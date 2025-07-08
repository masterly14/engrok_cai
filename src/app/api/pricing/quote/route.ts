import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { PricingService } from "@/services/pricing-service";

export async function GET(request: NextRequest) {
  const user = await onBoardUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const voiceSeconds = sp.get("voiceSeconds");
  const chatConvs = sp.get("chatConvs");

  try {
    if (voiceSeconds) {
      const credits = await PricingService.quoteVoice(
        user.data.id,
        Number(voiceSeconds),
      );
      return NextResponse.json({ credits });
    }
    if (chatConvs) {
      const credits = await PricingService.quoteChat(
        user.data.id,
        Number(chatConvs),
      );
      return NextResponse.json({ credits });
    }
    return NextResponse.json({ error: "invalid params" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
