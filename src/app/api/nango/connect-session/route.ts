import { NextRequest, NextResponse } from "next/server";
import { getSessionToken } from "@/actions/nango";
import { onBoardUser } from "@/actions/user";

export async function GET(_req: NextRequest) {
  try {
    // Garantizamos que el usuario está en BD y obtenemos su id
    const onboard = await onBoardUser();
    const userId = onboard.data.id;

    const tokenOrObj = await getSessionToken(userId);
    console.log("tokenOrObj", tokenOrObj);
    const token =
      typeof tokenOrObj === "string" ? tokenOrObj : tokenOrObj?.token;

    return NextResponse.json({ token });
  } catch (e: any) {
    console.error("[Nango] Failed to get connect session token", e);
    return NextResponse.json(
      { error: e.message || "Internal" },
      { status: 500 },
    );
  }
}
