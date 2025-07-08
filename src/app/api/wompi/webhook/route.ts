import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import crypto from "crypto";
import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL || "");
const STREAM_KEY = "incoming_messages";

// Interfaz para el cuerpo esperado del webhook de Wompi
interface WompiWebhookPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";
      reference: string;
      // ... otros campos de la transacción
    };
  };
  signature: {
    checksum: string;
    properties: string[];
  };
  // ... otros campos del webhook
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as WompiWebhookPayload;
    console.log("[Wompi Webhook] Received event:", payload.event);

    // 1. Extraer la referencia de la transacción.
    // Asumimos que la referencia siempre está presente para nuestros webhooks.
    const reference = payload.data.transaction.reference;
    if (!reference || !reference.startsWith("krl::")) {
      console.warn(
        `[Wompi Webhook] Ignoring event with invalid or missing reference: ${reference}`,
      );
      return NextResponse.json({
        status: "ignored",
        reason: "Invalid Reference",
      });
    }

    // 2. Parsear la referencia para obtener el userId a través de la sesión.
    const [, sessionId, sourceNodeId] = reference.split("::");
    if (!sessionId || !sourceNodeId) {
      console.warn(
        `[Wompi Webhook] Could not parse session info from reference: ${reference}`,
      );
      return NextResponse.json({
        status: "ignored",
        reason: "Malformed Reference",
      });
    }

    const session = await db.chatSession.findUnique({
      where: { id: sessionId },
      select: { chatAgent: true },
    });
    if (!session) {
      console.error(`[Wompi Webhook] Session with ID ${sessionId} not found.`);
      return NextResponse.json(
        { status: "error", reason: "Session Not Found" },
        { status: 404 },
      );
    }

    // 3. Obtener el 'eventsSecret' del usuario para verificar la firma.
    const wompiIntegration = await db.wompiIntegration.findUnique({
      where: { userId: session.chatAgent.userId },
    });

    if (!wompiIntegration || !wompiIntegration.eventsSecret) {
      console.error(
        `[Wompi Webhook] Wompi integration or eventsSecret not found for user ${session.chatAgent.userId}`,
      );
      return NextResponse.json(
        { status: "error", reason: "Integration Not Configured" },
        { status: 400 },
      );
    }

    // 4. Verificar la firma (checksum).
    const signatureProperties = payload.signature.properties;
    const stringToSign =
      signatureProperties
        .map((prop) => getNestedValue(payload.data, prop))
        .join("") + wompiIntegration.eventsSecret;

    const calculatedChecksum = crypto
      .createHash("sha256")
      .update(stringToSign)
      .digest("hex");

    if (calculatedChecksum !== payload.signature.checksum) {
      console.error("[Wompi Webhook] Invalid signature.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log("[Wompi Webhook] Signature verified successfully.");

    // 5. Procesar solo los eventos de transacción aprobada.
    if (
      payload.event === "transaction.updated" &&
      payload.data.transaction.status === "APPROVED"
    ) {
      console.log(
        `[Wompi Webhook] Approved transaction ${payload.data.transaction.id}. Enqueuing task for worker...`,
      );

      // 6. Enviar evento al stream de Redis para que el worker lo procese.
      const workerPayload = {
        kind: "wompi_payment_success",
        sessionId: sessionId,
        sourceNodeId: sourceNodeId,
        transactionId: payload.data.transaction.id,
      };

      await redisClient.xadd(
        STREAM_KEY,
        "*",
        "payload",
        JSON.stringify(workerPayload),
      );

      console.log("[Wompi Webhook] Task enqueued successfully.");
    } else {
      console.log(
        `[Wompi Webhook] Ignoring event type '${payload.event}' with status '${payload.data.transaction.status}'.`,
      );
    }

    return NextResponse.json({ status: "received" });
  } catch (error) {
    console.error("[Wompi Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Helper para obtener valores anidados de un objeto usando dot-notation (ej. "transaction.id")
function getNestedValue(obj: any, path: string): any {
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}
