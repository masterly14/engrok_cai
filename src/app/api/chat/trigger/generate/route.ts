import { NextRequest, NextResponse } from "next/server";
import { db } from "@/utils";
import { onBoardUser } from "@/actions/user";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // ---- 2. Parse body ----
    const body = await request.json();
    const { workflowId } = body as { workflowId?: string };

    if (!workflowId) {
      return NextResponse.json(
        { error: "Missing 'workflowId' in body" },
        { status: 400 },
      );
    }

    // ---- 3. Verify that the workflow belongs to the current user ----
    const workflow = await db.chatWorkflow.findUnique({
      where: { id: workflowId },
      select: { id: true, userId: true },
    });

    if (!workflow) {
      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }

    // ---- 4. Find or create the WorkflowTrigger (provider = 'webhook') ----
    let trigger = await db.workflowTrigger.findFirst({
      where: { workflowId, provider: "webhook" },
    });

    if (!trigger) {
      trigger = await db.workflowTrigger.create({
        data: {
          id: randomUUID(),
          token: randomUUID(),
          workflowId,
          userId: workflow.userId!,
          provider: "webhook",
          mapping: {},
        },
      });
    }

    // ---- 5. Build the public URL ----
    const host =
      request.headers.get("x-forwarded-host") ||
      request.headers.get("host") ||
      "";
    const protocol =
      host.startsWith("localhost") || host.startsWith("127.0.0.1")
        ? "http"
        : "https";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${protocol}://${host}`;
    const url = `${baseUrl}/api/chat/trigger/${trigger.token}`;

    return NextResponse.json({ token: trigger.token, url });
  } catch (error) {
    console.error("[Trigger] Error generating webhook token", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
