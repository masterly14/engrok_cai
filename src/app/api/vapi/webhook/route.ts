import { NextRequest, NextResponse } from "next/server";
import { PricingService } from "@/services/pricing-service";
import { db } from "@/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event = body.event;
    const call = body.call;

    if (event !== "calls.completed" || !call) {
      return NextResponse.json({ status: "ignored" });
    }

    const assistantId: string | undefined = call.assistantId;
    // Buscar agent por vapiAssistantId
    const agent = await db.agent.findFirst({ where: { vapiId: assistantId } });
    if (!agent) {
      return NextResponse.json({ status: "agent_not_found" });
    }

    const started = call.startedAt ? new Date(call.startedAt).getTime() : 0;
    const ended = call.endedAt ? new Date(call.endedAt).getTime() : 0;
    const durationSec =
      ended > started ? Math.round((ended - started) / 1000) : 0;

    await PricingService.applyVoiceUsage({
      userId: agent.userId,
      seconds: durationSec,
      externalRef: call.id,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Vapi webhook error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
