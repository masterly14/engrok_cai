import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const user = await onBoardUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { status } = await request.json();
  const allowed = ["ACTIVE", "COMPLETED", "NEEDS_ATTENTION"] as const;
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const { sessionId } = await params;

  const session = await db.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      chatAgent: { select: { userId: true } },
      contact: { select: { id: true } },
    },
  });

  if (!session || session.chatAgent.userId !== user.data.id) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }

  const updated = await db.chatSession.update({
    where: { id: sessionId },
    data: { status },
  });

  try {
    const channel = `conversation-${updated.chatAgentId}-${updated.contactId}`;
    await pusher.trigger(channel, "session-status", { status: updated.status });
  } catch {
    // optional: log error
  }

  return NextResponse.json({ session: updated });
}
