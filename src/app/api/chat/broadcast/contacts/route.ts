import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";

export async function GET(request: NextRequest) {
  // 1. Auth & onboard
  const onboard = await onBoardUser();
  if (!onboard) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = onboard.data.id;

  // 2. Params
  const agentId = request.nextUrl.searchParams.get("agentId");
  if (!agentId) {
    return NextResponse.json({ error: "agentId param is required" }, { status: 400 });
  }

  // 3. Ensure agent belongs to the user
  const agent = await db.chatAgent.findFirst({ where: { id: agentId, userId } });
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  // 4. Fetch contacts
  const contacts = await db.chatContact.findMany({
    where: { chatAgentId: agentId },
    select: {
      id: true,
      phone: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ data: contacts });
} 