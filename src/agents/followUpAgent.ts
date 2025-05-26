import { db } from "@/utils";
import { whatsappService } from "@/services/whatsapp";
import { UserSessionManager } from "@/services/userSessionManager";

const FOLLOW_UP_DELAY_MS = 24 * 60 * 60 * 1000; // 24h

export class FollowUpAgent {
  private sessionManager = new UserSessionManager();

  /**
   * Programa un follow-up para la orden.
   */
  schedule(orderId: string): void {
    setTimeout(async () => {
      try {
        await this.handle({ orderId });
      } catch (err) {
        console.error("[FollowUpAgent] Error en job de follow up", err);
      }
    }, FOLLOW_UP_DELAY_MS);
  }

  /**
   * Maneja el job de follow-up.
   */
  async handle(job: { orderId: string }): Promise<void> {
    const order = await db.order.findUnique({
      where: { id: job.orderId },
      include: { chatAgent: true },
    });
    if (!order || !order.chatAgent) return;

    const chatAgent = order.chatAgent;

    const contact = await db.contact.findFirst({
      where: { chatAgentId: chatAgent.id },
      orderBy: { updatedAt: "desc" },
    });
    if (!contact) return;

    await whatsappService.updateConfiguration(chatAgent.id);
    await whatsappService.sendTextMessage(
      contact.waId,
      `👋 ¡Hola de nuevo! Esperamos que estés disfrutando tu compra. Si tienes dudas o necesitas ayuda, avísanos.`
    );

    // Marcar sesion como follow_up_completed
    const sessionData = await this.sessionManager.getSessionData(contact.waId);
    sessionData.state = "follow_up_completed";
    await this.sessionManager.saveSessionData(contact.waId, sessionData);
  }
} 