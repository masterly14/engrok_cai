import { onBoardUser } from "@/actions/user";
import { db } from "@/utils";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await onBoardUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sub = await db.subscription.findFirst({ where: { userId: user.data.id } });
  return NextResponse.json({ credits: sub?.currentCredits ?? 0, cycleEndAt: sub?.cycleEndAt });
} 