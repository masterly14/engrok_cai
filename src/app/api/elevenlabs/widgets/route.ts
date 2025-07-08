import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { createAgentAndWidget } from "@/actions/elevenlabs";
import { db } from "@/utils";

export async function GET() {
  const user = await onBoardUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const widgets = await db.elevenLabsWidget.findMany({
    where: { ownerId: user.data.id },
  });
  return NextResponse.json({ widgets });
}

export async function POST(request: NextRequest) {
  const user = await onBoardUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  try {
    const widget = await createAgentAndWidget(body);
    return NextResponse.json(widget, { status: 201 });
  } catch (e: any) {
    console.error("create widget error", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
