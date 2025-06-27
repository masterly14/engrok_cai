import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { generateCreditCheckout } from "@/actions/credits";

export async function POST(request: NextRequest) {
  const user = await onBoardUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const credits = Number(body.credits);
  if (!credits || credits <= 0) {
    return NextResponse.json({ error: "credits required" }, { status: 400 });
  }

  try {
    const url = await generateCreditCheckout({
      userId: user.data.id,
      email: user.data.email,
      credits,
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("generate checkout error", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
} 