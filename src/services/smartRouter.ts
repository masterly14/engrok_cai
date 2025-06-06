import { ChatAnthropic } from "@langchain/anthropic";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

export interface RoutingContext {
  message: string;
  currentState: string;
  chatHistory: string;
  sessionData: any;
  messageCount: number;
}

export interface RoutingResult {
  agent: string;
  state: string;
  confidence: number;
  reason: string;
}

export class SmartRouter {
  private model: ChatAnthropic;
  private deterministicRules: Map<string, (context: RoutingContext) => RoutingResult | null>;

  constructor() {
    this.model = new ChatAnthropic({
      modelName: "claude-3-7-sonnet-20250219",
      temperature: 0.1,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.deterministicRules = new Map();
    this.initializeDeterministicRules();
  }

  private initializeDeterministicRules() {
    // Greeting patterns
    this.deterministicRules.set('greeting_patterns', (context) => {
      const greetingWords = ['hola', 'buenos', 'buenas', 'hi', 'hello', 'saludos'];
      const message = context.message.toLowerCase();
      
      if (context.messageCount <= 2 && greetingWords.some(word => message.includes(word))) {
        return {
          agent: 'greeter',
          state: 'greeting',
          confidence: 0.9,
          reason: 'Greeting pattern detected'
        };
      }
      return null;
    });

    // Product inquiry patterns
    this.deterministicRules.set('product_patterns', (context) => {
      const productWords = ['producto', 'precio', 'cuesta', 'disponible', 'stock', 'comprar', 'vender'];
      const message = context.message.toLowerCase();
      
      if (productWords.some(word => message.includes(word))) {
        return {
          agent: 'product_expert',
          state: 'product_discovery',
          confidence: 0.85,
          reason: 'Product inquiry pattern detected'
        };
      }
      return null;
    });

    // Objection patterns
    this.deterministicRules.set('objection_patterns', (context) => {
      const objectionWords = ['caro', 'costoso', 'pensarlo', 'dudar', 'no estoy seguro', 'problema', 'pero'];
      const message = context.message.toLowerCase();
      
      if (objectionWords.some(word => message.includes(word))) {
        return {
          agent: 'objection_handler',
          state: 'objection_handling',
          confidence: 0.8,
          reason: 'Objection pattern detected'
        };
      }
      return null;
    });

    // Purchase intent patterns
    this.deterministicRules.set('purchase_patterns', (context) => {
      const purchaseWords = ['quiero comprar', 'me interesa', 'lo llevo', 'acepto', 'sí', 'ok', 'perfecto'];
      const message = context.message.toLowerCase();
      
      if (purchaseWords.some(word => message.includes(word)) && 
          ['product_discovery', 'objection_handling'].includes(context.currentState)) {
        return {
          agent: 'closer',
          state: 'closing',
          confidence: 0.85,
          reason: 'Purchase intent detected'
        };
      }
      return null;
    });

    // State-based routing
    this.deterministicRules.set('state_based', (context) => {
      // If in payment state, handle payment-related messages
      if (context.currentState === 'payment') {
        return {
          agent: 'payment_handler',
          state: 'payment',
          confidence: 0.9,
          reason: 'Currently in payment state'
        };
      }
      
      // If just started, always greet
      if (context.messageCount === 1) {
        return {
          agent: 'greeter',
          state: 'greeting',
          confidence: 0.95,
          reason: 'First message from user'
        };
      }
      
      return null;
    });
  }

  async route(context: RoutingContext): Promise<RoutingResult> {
    console.log(`[SmartRouter] Routing message: "${context.message}" in state: ${context.currentState}`);

    // 1. Try deterministic rules first (fast and free)
    for (const [ruleName, rule] of this.deterministicRules) {
      const result = rule(context);
      if (result && result.confidence >= 0.8) {
        console.log(`[SmartRouter] Deterministic rule '${ruleName}' matched with confidence ${result.confidence}`);
        return result;
      }
    }

    // 2. If no high-confidence rule matches, use LLM
    console.log('[SmartRouter] No high-confidence rule matched, using LLM routing');
    return await this.llmRoute(context);
  }

  private async llmRoute(context: RoutingContext): Promise<RoutingResult> {
    const prompt = PromptTemplate.fromTemplate(`
Eres un enrutador inteligente para un sistema de ventas por WhatsApp. 

Analiza el contexto y determina el mejor agente y estado:

CONTEXTO:
- Estado actual: {currentState}
- Mensaje del usuario: "{message}"
- Número de mensajes: {messageCount}
- Historial reciente: {chatHistory}

AGENTES DISPONIBLES:
- greeter: Saludos e introducción
- product_expert: Información de productos
- objection_handler: Manejo de objeciones/dudas
- closer: Cierre de ventas

ESTADOS:
- greeting: Saludo inicial
- qualifying: Calificación de necesidades
- product_discovery: Exploración de productos
- objection_handling: Resolución de dudas
- closing: Proceso de cierre
- payment: Proceso de pago

Responde en JSON:
{{
  "agent": "nombre_agente",
  "state": "estado",
  "confidence": 0.8,
  "reason": "explicación breve"
}}
    `);

    try {
      const response = await prompt.pipe(this.model).pipe(new StringOutputParser()).invoke({
        currentState: context.currentState,
        message: context.message,
        messageCount: context.messageCount,
        chatHistory: context.chatHistory || "Sin historial"
      });

      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0].replace(/```json\s*|\s*```/g, ''));
        
        return {
          agent: result.agent || 'greeter',
          state: result.state || 'greeting',
          confidence: result.confidence || 0.5,
          reason: result.reason || 'LLM routing'
        };
      }
    } catch (error) {
      console.error('[SmartRouter] LLM routing failed:', error);
    }

    // Fallback to safe default
    return {
      agent: 'greeter',
      state: context.currentState || 'greeting',
      confidence: 0.3,
      reason: 'Fallback routing due to error'
    };
  }

  // Add new rules dynamically
  addRule(name: string, rule: (context: RoutingContext) => RoutingResult | null) {
    this.deterministicRules.set(name, rule);
  }

  // Get routing statistics
  getStats(): { totalRules: number; availableAgents: string[] } {
    return {
      totalRules: this.deterministicRules.size,
      availableAgents: ['greeter', 'product_expert', 'objection_handler', 'closer']
    };
  }
}

export const smartRouter = new SmartRouter(); 