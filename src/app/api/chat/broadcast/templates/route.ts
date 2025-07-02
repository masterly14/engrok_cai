import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";

export async function GET(request: NextRequest) {
  const onboard = await onBoardUser();
  if (!onboard) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = onboard.data.id;

  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId param is required" }, { status: 400 });
  }

  const agent = await db.chatAgent.findFirst({ where: { id: agentId, userId } });
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  const templates = await db.messageTemplate.findMany({
    where: { agentId, status: "APPROVED" },
    select: {
      id: true,
      name: true,
      language: true,
      category: true,
      components: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: templates });
} 