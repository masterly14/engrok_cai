import { NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";

export async function GET() {
  try {
    const user = await onBoardUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const knowledgeBases = await db.knowledgeBase.findMany({
      where: { userId: user.data.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true },
    });

    console.log("[API] Knowledge bases fetched", knowledgeBases);
    
    return NextResponse.json(knowledgeBases);
  } catch (err) {
    console.error("[API] Error fetching knowledge bases", err);
    return NextResponse.json(
      { message: "Failed to fetch knowledge bases" },
      { status: 500 },
    );
  }
} 