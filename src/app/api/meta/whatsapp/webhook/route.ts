import { messageHandler } from "@/handlers/messageHandler";
import { WhatsAppMessage, WhatsAppWebhookPayload } from "@/types/whatsapp";
import { db } from "@/utils";
import { NextRequest, NextResponse } from "next/server";

async function handleMessage(message: WhatsAppMessage, AgentNumber: string): Promise<void> {
  await messageHandler.handleIncomingMessage(message, AgentNumber);
}
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = await db.chatAgent.findUnique({
    where: {
      whatsappWebhookSecret: token!,
    },
  });

  if (!verifyToken) {
    return NextResponse.json(
      { error: "WHATSAPP_VERIFY_TOKEN not configured" },
      { status: 500 }
    );
  }

  if (mode === "subscribe" && token === verifyToken.whatsappWebhookSecret) {
    await db.chatAgent.update({
      where: {
        whatsappWebhookSecret: token!,
      },
      data: {
        webhook_verify: true,
      }
    })
    
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
              await handleMessage(message, change.value.metadata.display_phone_number);
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
