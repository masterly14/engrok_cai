import { saveMessage } from "@/actions/whatsapp";
import { AgentOrchestator } from "@/agents/orchestrator";
import { UserSessionManager } from "@/services/userSessionManager";
import { whatsappService } from "@/services/whatsapp";
import { WhatsAppMessage } from "@/types/whatsapp";
import { pusherService } from "@/services/pusher";
import { cacheService } from "@/services/cache";
import { queueInitializer } from "@/services/queueInitializer";
import { db } from "@/utils";

export class MessageHandler {
  private orchestator: AgentOrchestator;
  private sessionManager: UserSessionManager;

  constructor() {
    this.orchestator = new AgentOrchestator();
    this.sessionManager = new UserSessionManager();
  }

  async saveMessageDB(message: any) {
    console.log("[Save message DB]")
    const response = await saveMessage(message);
    console.log(response)
    if (response.status !== 200 && response.status !== 201) {
      console.log('Failed save text message');
      return;
    } 

    // Notificar a través de Pusher
    await pusherService.triggerNewMessage(message);
    return response;
  }

  async handleIncomingMessage(message: WhatsAppMessage, AgentNumber: string): Promise<void> {
    console.log("[handleIncomingMessage]: mensaje recibido", message);
    try {
      // Ensure queue is initialized (important for Vercel)
      await queueInitializer.ensureInitialized();
      
      // Obtener el chatAgent basado en el número de teléfono del agente
      console.log("El numero de telefono es: ", AgentNumber)
      console.log('El mensaje recibido es: ', message)
      const chatAgent = await db.chatAgent.findUnique({
        where: {
          phoneNumber: AgentNumber
        }
      });

      console.log('EL chatAgent es: ', chatAgent)

      if (!chatAgent) {
        console.error("[handleIncomingMessage]: No se encontró el agente para el número", message.metadata?.display_phone_number);
        throw new Error("Agent not found for this phone number");
      }

      // Actualizar la configuración del servicio de WhatsApp
      await whatsappService.updateConfiguration(chatAgent.id);
      console.log("[handleIncomingMessage]: configuración de WhatsApp actualizada para el agente", chatAgent.id);

      await whatsappService.markMessageAsRead(message.id);
      console.log("[handleIncomingMessage]: mensaje marcado como leído");

      // Verificar caché para respuestas frecuentes
      const cachedResponse = cacheService.get<string>(`response:${message.text?.body}`);
      if (cachedResponse) {
        await whatsappService.sendTextMessage(message.from, cachedResponse);
        return;
      }

      switch (message.type) {
        case "text":
          console.log("[handleIncomingMessage]: procesando mensaje de texto");
          await this.handleTextMessage(message, chatAgent);
          break;

        default:
          console.log(`[handleIncomingMessage]: tipo de mensaje no manejado: ${message.type}`);
          break;
      }
    } catch (error) {
      console.error("[handleIncomingMessage]: error al enviar mensaje de fallback", error);
    }
  }

  private async handleTextMessage(message: WhatsAppMessage, chatAgent: any): Promise<void> {
    console.log("[handleTextMessage]: iniciando");

    if (!message.text || !message.from) {
      console.log("[handleTextMessage]: mensaje inválido (sin texto o sin remitente)");
      return;
    }

    const userId = message.from;
    const text = message.text.body;

    console.log(`[handleTextMessage]: mensaje recibido de ${userId}: ${text}`);

    const isNewSession = await this.sessionManager.inNewSession(userId);
    console.log(`[handleTextMessage]: ¿es nueva sesión?: ${isNewSession}`);

    try {
      const response = await this.orchestator.routeMessage(text, userId, chatAgent);
      console.log("[handleTextMessage]: respuesta generada por el orquestador:", response);

      // Guardar respuesta en caché
      cacheService.set(`response:${text}`, response);

      // Enviar mensaje directamente en lugar de usar la cola
      if (response.includes("res.cloudinary.com")) {
        let parsedResponse = JSON.parse(response);
        if (Array.isArray(parsedResponse.images)) {
          for (const img of parsedResponse.images) {
            await whatsappService.sendImageMessage(userId, img.link, img.caption);
          }
        } else {
          await whatsappService.sendTextMessage(userId, "No se pudo procesar el mensaje con imagenes");
        }
      } else {
        await whatsappService.sendTextMessage(userId, response);
      }
      
      await this.sessionManager.updateSession(userId);
      console.log("[handleTextMessage]: sesión actualizada");
    } catch (error) {
      console.error("[handleTextMessage]: error al procesar mensaje con AI", error);
      await this.sendErrorMessage(userId);
    }
  }

  private async sendErrorMessage(to: string): Promise<void> {
    console.log("[sendErrorMessage]: enviando mensaje de error");

    try {
      await whatsappService.sendTextMessage(
        to,
        "Lo siento, hubo un problema procesando tu mensaje. Por favor intenta de nuevo más tarde."
      );
      console.log("[sendErrorMessage]: mensaje de error enviado");
    } catch (error) {
      console.error("[sendErrorMessage]: error al enviar mensaje de error", error);
    }
  }
}

export const messageHandler = new MessageHandler();
