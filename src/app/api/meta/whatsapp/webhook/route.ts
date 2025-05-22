import { messageHandler } from "@/handlers/messageHandler";
import { WhatsAppMessage, WhatsAppWebhookPayload } from "@/types/whatsapp";
import { NextRequest, NextResponse } from "next/server";

async function handleMessage(message: WhatsAppMessage): Promise<void> {
  await messageHandler.handleIncomingMessage(message);
}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.NEXT_PUBLIC_WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return NextResponse.json(
      { error: "WHATSAPP_VERIFY_TOKEN not configured" },
      { status: 500 }
    );
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("Webhook verificado con éxito");
    return new NextResponse(challenge);
  } else {
    return NextResponse.json(
      { error: "Verificación fallida" },
      { status: 403 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppWebhookPayload = await request.json();

    if (body.object !== "whatsapp_business_account") {
      return NextResponse.json(
        { error: "Invalid Object from payload" },
        { status: 400 }
      );
    }

    await messageHandler.saveMessageDB(body);
    
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === "messages") {
          if (change.value.messages && change.value.messages.length > 0) {
            for (const message of change.value.messages) {
              await handleMessage(message);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: `Error to process message, error: ${error}` },
      { status: 500 }
    );
  }
}
