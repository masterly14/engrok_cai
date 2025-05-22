import { saveMessage } from "@/actions/whatsapp";
import { AgentOrchestator } from "@/agents/orchestrator";
import { UserSessionManager } from "@/services/userSessionManager";
import { whatsappService } from "@/services/whatsapp";
import { WhatsAppMessage } from "@/types/whatsapp";
import { pusherService } from "@/services/pusher";
import { queueService } from "@/services/queue";
import { cacheService } from "@/services/cache";
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

  async handleIncomingMessage(message: WhatsAppMessage): Promise<void> {
    console.log("[handleIncomingMessage]: mensaje recibido", message);
    try {
      // Obtener el chatAgent basado en el número de teléfono del agente
      const chatAgent = await db.chatAgent.findFirst({
        where: {
          phoneNumber: message.metadata?.display_phone_number
        }
      });

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
          await this.handleTextMessage(message);
          break;

        default:
          console.log(`[handleIncomingMessage]: tipo de mensaje no manejado: ${message.type}`);
          break;
      }
    } catch (error) {
      console.error("[handleIncomingMessage]: error al enviar mensaje de fallback", error);
    }
  }

  private async handleTextMessage(message: WhatsAppMessage): Promise<void> {
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
      const response = await this.orchestator.routeMessage(text, userId);
      console.log("[handleTextMessage]: respuesta generada por el orquestador:", response);

      // Guardar respuesta en caché
      cacheService.set(`response:${text}`, response);

      // Guardar mensaje saliente en la base de datos
      await this.saveOutgoingMessage({
        to: userId,
        from: process.env.NEXT_PUBLIC_WHATSAPP_PHONE_NUMBER_ID || "",
        text: response,
        timestamp: new Date(),
        type: "text"
      });

      // Añadir a la cola para procesamiento
      await queueService.addToQueue({
        ...message,
        text: { body: response }
      });

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

  // Nueva función para guardar mensajes salientes
  private async saveOutgoingMessage({ to, from, text, timestamp, type }: { to: string, from: string, text: string, timestamp: Date, type: string }) {
    // Buscar o crear el contacto y el agente
    const contact = await whatsappService["getOrCreateContact"](to);
    // Guardar el mensaje en la base de datos
    await db.message.create({
      data: {
        waId: `${from}_${Date.now()}`,
        from,
        to,
        timestamp,
        type: "TEXT",
        textBody: text,
        metadata: { text },
        contactId: contact.id,
      },
    });
  }
}

export const messageHandler = new MessageHandler();
