import { LLMChain } from "langchain/chains"; //Cadena simple de modelo-Encapsula un prompt, un modelo de lenguaje
import { ChatAnthropic } from "@langchain/anthropic";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { UserSessionManager } from "@/services/userSessionManager";
import { productDatabase } from "@/services/productDatabase";
import { CRMService } from "@/integrations/crmService";
import { PaymentService } from "@/integrations/paymentService";
import { GreeterAgent } from "./greeterAgent";
import { ProductExpertAgent } from "./productExpertAgent";
import { objectionHandlerAgent } from "./objectionHandlerAgent";
import { CloseAgent } from "./closeAgent";
import redisClient from "@/lib/redis";
import { OrderAgent } from "./orderAgent";
import { PaymentLinkAgent } from "./paymentLinkAgent";

enum conversationState {
  GREETING = "greeting",
  QUALIFYING = "qualifying",
  PRODUCT_DISCOVERY = "product_discovery",
  OBJECTION_HANDLING = "objection_handling",
  CLOSING = "closing",
  PAYMENT = "payment",
  FOLLOW_UP = "follow_up",
}

export class AgentOrchestator {
  private model: ChatAnthropic;
  private memory: BufferMemory;
  private sessionManager: UserSessionManager;
  private productDb: productDatabase;
  private crmService: CRMService;
  private paymentService: PaymentService;

  private greeterAgent: GreeterAgent;
  private productExpertAgent: ProductExpertAgent;
  private objectionHandlerAgent: objectionHandlerAgent;
  private closerAgent: CloseAgent;
  private orderAgent: OrderAgent;
  private paymentLinkAgent: PaymentLinkAgent;

  private routerChain: LLMChain;

  constructor() {
    this.model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.3,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.memory = new BufferMemory({
      memoryKey: "chat_history",
      inputKey: "input",
      outputKey: "output",
      returnMessages: true,
    });

    this.sessionManager = new UserSessionManager();
    this.productDb = new productDatabase();
    this.crmService = new CRMService();
    this.paymentService = new PaymentService();

    this.greeterAgent = new GreeterAgent(this.model);
    this.productExpertAgent = new ProductExpertAgent(
      this.model,
      this.productDb
    );
    this.objectionHandlerAgent = new objectionHandlerAgent(this.model);
    this.closerAgent = new CloseAgent(this.model);

    this.orderAgent = new OrderAgent();
    this.paymentLinkAgent = new PaymentLinkAgent();

    this.routerChain = this.createRouterChain();
  }

  private createRouterChain(): LLMChain {
    const routerPrompt = PromptTemplate.fromTemplate(
      `Eres un enrutador inteligente para un sistema de conversación de ventas por WhatsApp.  
        Con base en el mensaje del usuario y el historial del chat, determina qué agente especializado debe encargarse de responder y en qué estado de la conversación nos encontramos.

        Los agentes disponibles son:
        - **greeter**: Para saludos iniciales y construcción de relación.
        - **product_expert**: Para brindar información detallada sobre productos.
        - **objection_handler**: Para responder a dudas o preocupaciones del cliente.
        - **closer**: Para avanzar hacia el cierre de la venta cuando el cliente muestra interés.

        Los estados posibles de la conversación son:
        - **greeting**: Interacción inicial con el cliente.
        - **qualifying**: Identificación de necesidades y presupuesto del cliente.
        - **product_discovery**: Exploración de opciones de productos.
        - **objection_handling**: Resolución de dudas o inquietudes del cliente.
        - **closing**: Avance hacia la decisión de compra.
        - **payment**: Facilitación del proceso de pago.
        - **follow_up**: Interacción posterior a la venta.

        Estado actual de la conversación: {current_state}

        Historial del chat:  
        {chat_history}

        Mensaje del usuario:  
        {input}

        Con base en esto, determina:
        1. Qué agente debe responder (greeter, product_expert, objection_handler, closer).
        2. Cuál debe ser el nuevo estado de la conversación.

        Devuelve tu respuesta en formato JSON:
        {{  
          "agent": "nombre_del_agente",  
          "state": "estado_de_conversación"  
        }}
        `
    );

    return new LLMChain({
      llm: this.model,
      prompt: routerPrompt,
      outputParser: new StringOutputParser(),
    });
  }

  private async extractProductInterest(message: string, chatAgentId: string): Promise<string[]> {
    // Get relevant products for the message
    const productInfo = await this.productDb.getRelevanProducts(chatAgentId, message);
    
    // Extract product IDs from the product info
    const productIds: string[] = [];
    const lines = productInfo.split('\n');
    let currentProductId: string | null = null;
    
    for (const line of lines) {
      if (line.startsWith('Nombre:')) {
        // This is a new product, extract its ID from the product info
        const productName = line.replace('Nombre:', '').trim();
        const product = await this.productDb.getProductByName(chatAgentId, productName);
        if (product) {
          currentProductId = product.id;
          if (currentProductId) {
            productIds.push(currentProductId);
          }
        }
      }
    }
    
    return productIds;
  }

  async routeMessage(message: string, userId: string, chatAgent?: any): Promise<string> {
    try {
      const sessionData = await this.sessionManager.getSessionData(userId);
      console.log(
        "Raw session data from Redis:",
        await redisClient.get(`sessionData:${userId}`)
      );
      console.log("Parsed session data:", sessionData);

      // After updating session data
      console.log("Session data before saving:", sessionData);
      console.log("Datos de la sesión: ", sessionData);
      const chatHistory = await this.memory.loadMemoryVariables({});

      const routerOutput = await this.routerChain.predict({
        input: message,
        chat_history: chatHistory.chat_history || "",
        current_state: sessionData.state,
      });

      const jsonMatch = routerOutput.match(/```json\s*([\s\S]*?)\s*```/);
      let routerResult;
      if (jsonMatch) {
        const jsonString = jsonMatch[1].trim();
        try {
          routerResult = JSON.parse(jsonString);
          console.log("Router result si sale bien", routerResult);
        } catch (parseError) {
          console.log("Error al parsear JSON:", parseError);
        }
      } else {
        console.log("Formato inesperado en routerOutput:", routerOutput);
      }
      sessionData.state = routerResult.state;

      let response: string;

      console.log("type: MarkerType.ArrowClosed: ", routerResult.agent);
      console.log("Chat history", chatHistory.chat_history);
      const chat_agent_info = chatAgent
        ? `Nombre: ${chatAgent.name}\nDescripción: ${chatAgent.description || ""}`
        : "";

      switch (routerResult.agent) {
        case "greeter":
          response = await this.greeterAgent.process({
            message,
            chat_history: chatHistory.chat_history || "",
            chat_agent_info,
          });
          break;
        case "product_expert":
          response = await this.productExpertAgent.process({
            message,
            chat_history: chatHistory.chat_history || "",
            chatAgentId: chatAgent?.id || "",
          });

          if (!sessionData.productInterest) {
            sessionData.productInterest = [];
          }
          const productIds = await this.extractProductInterest(message, chatAgent?.id || "");
          sessionData.productInterest.push(...productIds);
          break;

        case "objection_handler":
          response = await this.objectionHandlerAgent.process({
            message,
            chat_history: chatHistory.chat_history || "",
          });

          if (!sessionData.objections) {
            sessionData.objections = [];
          }
          break;
        case "closer":


          // Heurística simple: si el mensaje del usuario indica aceptación de compra
            // 1. Crear orden
            const orderId = await this.orderAgent.process(sessionData, chatAgent);
            // 2. Generar link y enviarlo
            const paymentLink = await this.paymentLinkAgent.process(orderId);

            
            sessionData.state = conversationState.PAYMENT;
            response = paymentLink;
          break;
        default:
          response = await this.greeterAgent.process({
            message,
            chat_history: chatHistory.chat_history || "",
            chat_agent_info,
          });
          break;
      }
      await this.memory.saveContext({ input: message }, { output: response });

      await this.sessionManager.saveSessionData(userId, sessionData);

      return response;
    } catch (error) {
      console.error("Error routing message:", error);
      return "Lo siento, estoy experimentando problemas técnicos. Por favor, intenta de nuevo más tarde.";
    }
  }

  private extractObjection(message: string): string {
    return message;
  }
}
