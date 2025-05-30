import { db } from "@/utils";
import redisClient from "@/lib/redis";
import { OrderStatus, ChatAgent } from "@prisma/client";

/**
 * OrderAgent
 * 1.  Recibe la sessionData actual y el ChatAgent.
 * 2.  Calcula el total con base en productIds y cantidades dentro de sessionData.productInterest.
 * 3.  Crea una Order con estado PENDING, la asocia al ChatAgent y al User.
 * 4.  Guarda orderId en sessionData y persiste nuevamente en Redis.
 */
export class OrderAgent {
  /**
   * Procesa la creación de la orden.
   * @param sessionData  Datos de sesión para el usuario en curso.
   * @param chatAgent    Instancia de ChatAgent proveniente de la BD.
   * @returns            orderId creado.
   */
  async process(sessionData: any, chatAgent: ChatAgent): Promise<string> {
    // Validaciones básicas
    if (!sessionData) throw new Error("sessionData is required");
    if (!chatAgent) throw new Error("chatAgent is required");

    console.log("Session data", sessionData);
    
    // Extraer productos con cantidades del nuevo formato
    const productInterest = sessionData.productInterest || {};
    const productIds = Object.keys(productInterest);

    if (!productIds.length) {
      throw new Error("No products found in sessionData.productInterest");
    }

    // Traer productos de la DB y calcular total con cantidades
    console.log("Id de los productos", productIds);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { price: true, id: true, name: true },
    });

    if (!products.length) {
      throw new Error("No products found in database for provided productIds");
    }

    // Calcular el total considerando las cantidades
    let totalAmount = 0;
    const orderDetails: string[] = [];

    products.forEach(product => {
      const quantity = productInterest[product.id] || 1;
      const subtotal = (product.price ?? 0) * quantity;
      totalAmount += subtotal;
      orderDetails.push(`${product.name} x${quantity} = $${subtotal}`);
    });

    console.log("Order details:", orderDetails.join(", "));
    console.log("Total amount:", totalAmount);

    // Crear orden con información adicional en metadata
    const order = await db.order.create({
      data: {
        chatAgentId: chatAgent.id,
        userId: chatAgent.userId,
        productIds,
        totalAmount,
        paymentLink: "", // se actualizará luego
        status: OrderStatus.PENDING,
      },
    });

    // Guardar información adicional de cantidades en sessionData
    sessionData.orderDetails = {
      orderId: order.id,
      productQuantities: productInterest,
      orderSummary: orderDetails
    };

    // Persistir en sessionData y Redis
    sessionData.orderId = order.id;
    try {
      const key = `sessionData:${sessionData.userId}`;
      if (sessionData.userId) {
        await redisClient.set(key, JSON.stringify(sessionData));
      }
    } catch (err) {
      console.error("[OrderAgent] Error guardando sessionData en Redis", err);
    }

    return order.id;
  }
} 