import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { db } from "@/utils";
import { PricingService } from "@/services/pricing-service";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

const STREAM_KEY = "incoming_messages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    const trigger = await db.workflowTrigger.findUnique({
      where: { token },
    });

    if (!trigger) {
      return NextResponse.json({ error: "Trigger not found" }, { status: 404 });
    }

    const body = await request.json();
    const { phone, variables = {} } = body as {
      phone: string;
      variables?: Record<string, any>;
    };

    if (!phone) {
      return NextResponse.json(
        { error: "Missing 'phone' in payload" },
        { status: 400 },
      );
    }

    // --- Debit credits (1 conversation) --
    try {
      await PricingService.applyChatUsage({
        userId: trigger.userId,
        conversations: 1,
        externalRef: `${token}-${Date.now()}`,
      });
    } catch (e) {
      console.error("[Trigger] Credit debit failed", e);
    }

    // --- Push event to Redis stream (same one used by WhatsApp webhook) --
    const eventPayload = {
      kind: "external", // custom flag for worker
      workflowId: trigger.workflowId,
      phone,
      variables,
    };

    const messageId = await redis.xadd(STREAM_KEY, "*", {
      payload: JSON.stringify(eventPayload),
    });

    return NextResponse.json({ status: "queued", id: messageId });
  } catch (error) {
    console.error("[Trigger] Error handling trigger POST", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
