import { NextResponse } from "next/server";
import { getChatAgents } from "@/actions/chat-agents";

export async function GET() {
  try {
    const agents = await getChatAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[API] Error fetching chat agents", error);
    return NextResponse.json(
      { message: "Failed to fetch agents" },
      { status: 500 },
    );
  }
}
