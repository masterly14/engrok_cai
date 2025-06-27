import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";
import { getCreditLedger } from "@/actions/credits";

export async function GET(request: NextRequest) {
  const user = await onBoardUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sp = request.nextUrl.searchParams;
  const take = Number(sp.get("take") ?? 50);
  const skip = Number(sp.get("skip") ?? 0);

  const data = await getCreditLedger(user.data.id, take, skip);
  return NextResponse.json({ data });
} 