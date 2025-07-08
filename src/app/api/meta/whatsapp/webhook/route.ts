import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { db } from "@/utils";
import { PricingService } from "@/services/pricing-service";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

const STREAM_KEY = "incoming_messages";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === "1234567890") {
    return new NextResponse(challenge);
  } else {
    return NextResponse.json(
      { error: "Verificación fallida" },
      { status: 403 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // El objeto 'value' contiene tanto los mensajes como los metadatos.
    const value = body.entry?.[0]?.changes?.[0]?.value;

    // Solo nos interesan los webhooks que contienen mensajes de usuario.
    // Ignoramos otros eventos como las actualizaciones de estado ('statuses').
    if (!value || !value.messages || !value.messages[0]) {
      console.log("Received webhook, but it's not a user message. [Ignoring]");
      return NextResponse.json({ status: "ignored" });
    }

    console.log(
      "Mensaje de WhatsApp recibido, añadiendo al stream de Redis...",
    );

    // Identificar el chatAgent por phone_number_id (prop del webhook)
    const phoneNumberId: string | undefined = value?.metadata?.phone_number_id;
    if (phoneNumberId) {
      const agent = await db.chatAgent.findFirst({
        where: { whatsappPhoneNumberId: phoneNumberId },
      });
      console.log("agent", agent);
      if (agent) {
        // Por simplicidad, cobramos 1 conversación por cada mensaje recibido fuera de la ventana gratis.
        try {
          await PricingService.applyChatUsage({
            userId: agent.userId,
            conversations: 1,
            externalRef: value.messages[0].id,
          });
        } catch (e) {
          console.error("Credit debit failed", e);
        }
      }
    }

    // Serializamos y enviamos el objeto 'value' completo.
    const messageId = await redis.xadd(STREAM_KEY, "*", {
      payload: JSON.stringify(value),
    });

    console.log(`Message added to stream with ID: ${messageId}`);

    return NextResponse.json({ status: "success" });
  } catch (error) {
    console.error("Error in webhook POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
