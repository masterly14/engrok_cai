import { db } from "@/utils";
import { PaymentService } from "@/integrations/paymentService";
import { whatsappService } from "@/services/whatsapp";
import { OrderStatus } from "@prisma/client";

/**
 * PaymentLinkAgent
 * Genera el enlace de pago usando PaymentService y lo envía al cliente por WhatsApp.
 */
export class PaymentLinkAgent {
  private paymentService = new PaymentService();

  /**
   * Genera y envía el enlace de pago.
   * @param orderId Id de la orden previamente creada.
   * @returns       URL del enlace de pago.
   */
  async process(orderId: string): Promise<string> {
    // 1. Obtener la orden y su ChatAgent
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { chatAgent: true },
    });
    if (!order || !order.chatAgent) {
      throw new Error("Order or ChatAgent not found");
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new Error("Payment link can only be generated for PENDING orders");
    }

    const { chatAgent } = order;

    // 2. Preparar payload para PaymentService → puedes ajustarlo a tu endpoint real
    const orderData = {
      name: `Pedido ${order.id}`,
      description: `Pago de productos (${order.productIds.length})`,
      currency: "COP", 
      amount_in_cents: Math.round(order.totalAmount * 100),
      sku: order.id,
      redirect_url: "http://localhost:3000/payment-success",
      collect_shipping: true,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      wompi_private_key: chatAgent.wompiPrivateKey,
    };

    console.log("Order data", orderData);
    const paymentLink = await this.paymentService.generatePaymentLink(orderData);

    console.log("Payment link", paymentLink);
    // 3. Actualizar orden con paymentLink
    await db.order.update({
      where: { id: order.id },
      data: { paymentLink },
    });

    // 4. Enviar mensaje por WhatsApp al cliente
    try {
      const contact = await db.contact.findFirst({
        where: { chatAgentId: chatAgent.id },
        orderBy: { createdAt: "desc" },
      });
      if (contact) {
        await whatsappService.updateConfiguration(chatAgent.id);
        await whatsappService.sendTextMessage(
          contact.waId,
          `¡Perfecto, gracias por tu interés! 🙌 Completa tu pago en el siguiente enlace: 🔗 ${paymentLink}

            Se te pedira el numero de orden. Copia y pega el siguiente identificador: ${order.id}`
        );
      }
    } catch (err) {
      console.error("[PaymentLinkAgent] Error enviando WhatsApp", err);
    }

    return paymentLink;
  }
} 