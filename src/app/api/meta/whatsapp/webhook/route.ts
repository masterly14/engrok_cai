import { db } from "@/utils";
import { NextRequest, NextResponse } from "next/server";


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
