import { NextRequest, NextResponse } from "next/server";
import { onBoardUser } from "@/actions/user";

export async function GET(_req: NextRequest) {
  try {
    const user = await onBoardUser();
    return NextResponse.json({ id: user.data.id, email: user.data.email });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }
}
