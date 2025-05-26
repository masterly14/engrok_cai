import { db } from "@/utils";
import { whatsappService } from "@/services/whatsapp";
import { OrderStatus } from "@prisma/client";
import { UserSessionManager } from "@/services/userSessionManager";
import { FollowUpAgent } from "./followUpAgent";

export interface PaymentConfirmEvent {
  type: "PAYMENT_CONFIRM";
  orderId: string;
  status: OrderStatus;
}

/**
 * ConfirmationAgent
 * Gestiona confirmaciones de pago y envía notificaciones al cliente.
 */
export class ConfirmationAgent {
  private sessionManager = new UserSessionManager();
  private followUpAgent = new FollowUpAgent();

  async handle(event: PaymentConfirmEvent): Promise<void> {
    const { orderId, status } = event;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { chatAgent: true },
    });
    if (!order || !order.chatAgent) {
      console.error("[ConfirmationAgent] Order or ChatAgent not found for", orderId);
      return;
    }

    const chatAgent = order.chatAgent;

    // Obtener último contacto asociado al agente (simplificación)
    const contact = await db.contact.findFirst({
      where: { chatAgentId: chatAgent.id },
      orderBy: { updatedAt: "desc" },
    });

    if (!contact) {
      console.warn("[ConfirmationAgent] Contact not found for chatAgent", chatAgent.id);
    }

    let message: string;

    if (status === OrderStatus.APPROVED) {
      message = `✅ ¡Pago recibido! Tu pedido #${orderId} está en proceso.`;
      const lead = await db.lead.findFirst({
        where: { phone: contact?.phoneNumber }
      });
      if (lead) {
        await db.lead.update({
          where: { id: lead.id },
          data: {status: "CERRADO"}
        });
      }
    } else if (status === OrderStatus.FAILED) {
      message = `❌ Hubo un problema con tu pago del pedido #${orderId}. Puedes intentar nuevamente.`;
    } else {
      message = `Actualización de tu pedido #${orderId}: estado ${status}`;
    }

    // Enviar mensaje por WhatsApp
    if (contact) {
      await whatsappService.updateConfiguration(chatAgent.id);
      await whatsappService.sendTextMessage(contact.waId, message);
    }

    // Actualizar estado de conversación en Redis
    const userId = contact?.waId;
    if (userId) {
      const sessionData = await this.sessionManager.getSessionData(userId);
      sessionData.state = status === OrderStatus.APPROVED ? "follow_up" : "closing";
      await this.sessionManager.saveSessionData(userId, sessionData);
    }

    // Programar follow-up si pagado
    if (status === OrderStatus.APPROVED) {
      this.followUpAgent.schedule(orderId);
    }
  }
}

export const confirmationAgent = new ConfirmationAgent(); 