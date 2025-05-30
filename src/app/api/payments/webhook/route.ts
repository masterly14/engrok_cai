// app/api/payments/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/utils";
import { confirmationAgent } from "@/agents/confirmationAgent";

export const runtime = "nodejs";

// Desactiva el parseo automático de body para leer rawBody
export const config = {
  api: {
    bodyParser: false,
  },
};

// Función principal para el método POST
export async function POST(request: NextRequest) {
  try {
    const arrayBuffer = await request.arrayBuffer();
    const rawBody = Buffer.from(arrayBuffer);

    const payload = JSON.parse(rawBody.toString("utf8"));
    const { data, signature } = payload;
    console.log("Payload", payload);
    
    const orderId = data.transaction.customer_data.customer_references[0].value;

    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error("Orden no encontrada");
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    }

    console.log('Orden encontrada: ', order)
    
    const agent = await db.chatAgent.findUnique({
      where: { id: order.chatAgentId },
    });
    if (!agent) {
      console.error("Agente no encontrado");
      return NextResponse.json({ error: "Agent not found" }, { status: 400 });
    }

    // 3. Verificar la firma usando el checksum del payload
    const receivedChecksum = signature.checksum;
    const signatureProperties = signature.properties;
    
    // Construir el string a firmar usando las propiedades especificadas
    let stringToSign = "";
    for (const property of signatureProperties) {
      const keys = property.split(".");
      let value = data;
      
      // Navegar por el objeto usando las claves del property
      for (const key of keys) {
        value = value[key];
      }
      
      stringToSign += value;
    }
    
    // Agregar el timestamp y el secret key
    stringToSign += payload.timestamp + agent.wompiEventsKey;
    
    // Calcular el checksum esperado
    const expectedChecksum = crypto
      .createHash("sha256")
      .update(stringToSign)
      .digest("hex");

    if (receivedChecksum !== expectedChecksum) {
      console.error("Checksum inválido en webhook Wompi");
      console.error("Received:", receivedChecksum);
      console.error("Expected:", expectedChecksum);
      console.error("String to sign:", stringToSign);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Actualizar la orden con todos los campos relevantes del webhook
    const tx = data.transaction;
    await db.order.update({
      where: { id: orderId },
      data: {
        status: tx.status,
        transactionId: tx.id,
        transactionCreatedAt: tx.created_at ? new Date(tx.created_at) : undefined,
        transactionFinalizedAt: tx.finalized_at ? new Date(tx.finalized_at) : undefined,
        amountInCents: tx.amount_in_cents,
        reference: tx.reference,
        customerEmail: tx.customer_email,
        currency: tx.currency,
        paymentMethodType: tx.payment_method_type,
        paymentMethod: tx.payment_method,
        statusMessage: tx.status_message,
        shippingAddress: tx.shipping_address,
        redirectUrl: tx.redirect_url,
        paymentSourceId: tx.payment_source_id,
        paymentLinkId: tx.payment_link_id,
        customerData: tx.customer_data,
        billingData: tx.billing_data,
        origin: tx.origin,
      },
    });
    
    // Llamar directamente al ConfirmationAgent
    try {
      await confirmationAgent.handle({
        type: "PAYMENT_CONFIRM",
        orderId,
        status: data.transaction.status,
      });
    } catch (err) {
      console.error("[Webhook] Error procesando confirmación", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error en webhook Wompi:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}