import { NextRequest, NextResponse } from "next/server"
import { db } from "@/utils"
import { onBoardUser } from "@/actions/user"

export async function GET(request: NextRequest) {
  const user = await onBoardUser()
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const agentId = request.nextUrl.searchParams.get("agentId")
  const contactId = request.nextUrl.searchParams.get("contactId")
  if (!agentId || !contactId) {
    return NextResponse.json({ error: "missing parameters" }, { status: 400 })
  }

  // Ensure agent belongs to user
  const agent = await db.chatAgent.findFirst({ where: { id: agentId, userId: user.data.id } })
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 })
  }

  const session = await db.chatSession.findFirst({
    where: { chatAgentId: agentId, contactId },
    orderBy: { updatedAt: "desc" },
  })

  if (!session) {
    return NextResponse.json({ session: null })
  }

  return NextResponse.json({ session })
} 