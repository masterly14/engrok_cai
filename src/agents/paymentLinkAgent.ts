import { db } from "@/utils";
import { PaymentService } from "@/integrations/paymentService";
import { whatsappService } from "@/services/whatsapp";
import { OrderStatus } from "@prisma/client";
import redisClient from "@/lib/redis";

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

    // Obtener detalles de los productos
    const products = await db.product.findMany({
      where: { id: { in: order.productIds } },
      select: { id: true, name: true, price: true },
    });

    // Intentar obtener las cantidades desde Redis
    let productQuantities: Record<string, number> = {};
    try {
      // Buscar el contacto más reciente
      const contact = await db.contact.findFirst({
        where: { chatAgentId: chatAgent.id },
        orderBy: { createdAt: "desc" },
      });
      
      if (contact) {
        const sessionKey = `sessionData:${contact.waId}`;
        const sessionDataStr = await redisClient.get(sessionKey);
        if (sessionDataStr && typeof sessionDataStr === 'string') {
          const sessionData = JSON.parse(sessionDataStr) as { orderDetails?: { productQuantities?: Record<string, number> } };
          if (sessionData.orderDetails?.productQuantities) {
            productQuantities = sessionData.orderDetails.productQuantities;
          }
        }
      }
    } catch (err) {
      console.error("[PaymentLinkAgent] Error obteniendo cantidades de Redis", err);
    }

    // Construir descripción detallada de la orden
    const productNames = products.map(p => p.name).join(", ");
    const orderDescription = `Pago de productos: ${productNames}`;

    // 2. Preparar payload para PaymentService
    const orderData = {
      name: `Pedido ${order.id}`,
      description: orderDescription,
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
        // Construir mensaje detallado con los productos
        let detailMessage = "📝 *Resumen de tu pedido:*\n\n";
        
        products.forEach(product => {
          const quantity = productQuantities[product.id] || 1;
          const subtotal = product.price * quantity;
          detailMessage += `• ${product.name} x${quantity} - $${subtotal.toLocaleString('es-CO')}\n`;
        });
        
        detailMessage += `\n💰 *Total a pagar:* $${order.totalAmount.toLocaleString('es-CO')} COP\n\n`;
        detailMessage += `¡Perfecto, gracias por tu interés! 🙌 Completa tu pago en el siguiente enlace:\n\n`;
        detailMessage += `🔗 ${paymentLink}\n\n`;
        detailMessage += `📋 *Identificador de tu orden:* ${order.id}\n`;
        detailMessage += `Copia este identificador, ya que se te pedira en el pago, en el campo Orden ID`;

        await whatsappService.updateConfiguration(chatAgent.id);
        await whatsappService.sendTextMessage(contact.waId, detailMessage);
      }
    } catch (err) {
      console.error("[PaymentLinkAgent] Error enviando WhatsApp", err);
    }

    return paymentLink;
  }
} 