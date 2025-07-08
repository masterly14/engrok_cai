import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { onBoardUser } from "@/actions/user";
import { db } from "@/utils";
import { Redis } from "@upstash/redis";
import crypto from "crypto";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL!,
  token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN!,
});

const STREAM_KEY = "incoming_messages";

const BodySchema = z.object({
  agentId: z.string().uuid(),
  contactIds: z.array(z.string().uuid()).optional().default([]),
  phoneNumbers: z.array(z.string()).optional().default([]),
  nodeData: z.any(),
  perContactVariables: z.record(z.record(z.any())).optional(),
});

export async function POST(req: NextRequest) {
  // 1. Auth
  const onboard = await onBoardUser();
  if (!onboard) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = onboard.data.id;

  // 2. Parse & validate body
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await req.json());
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "invalid body" },
      { status: 400 },
    );
  }

  const { agentId, contactIds, phoneNumbers } = body;

  // 3. Ownership checks
  const agent = await db.chatAgent.findFirst({
    where: { id: agentId, userId },
  });
  if (!agent) {
    return NextResponse.json({ error: "agent not found" }, { status: 404 });
  }

  // 3a. Si se enviaron phoneNumbers, asegurarnos de que existan contactos para ellos
  let finalContactIds = [...contactIds];

  if (phoneNumbers && phoneNumbers.length) {
    for (const phone of phoneNumbers) {
      if (!phone) continue;
      let contact = await db.chatContact.findFirst({ where: { phone } });
      if (!contact) {
        contact = await db.chatContact.create({
          data: {
            id: crypto.randomUUID(),
            phone,
            name: phone,
            chatAgentId: agentId,
          },
        });
      }
      finalContactIds.push(contact.id);
    }
  }

  // 3b. Validar que todos los contactos existan y pertenezcan al agente
  const validContacts = await db.chatContact.count({
    where: { chatAgentId: agentId, id: { in: finalContactIds } },
  });
  if (validContacts !== finalContactIds.length) {
    return NextResponse.json(
      { error: "one or more contacts invalid" },
      { status: 400 },
    );
  }

  // 4. Queue event
  const payload = {
    kind: "batch_send",
    agentId,
    contactIds: finalContactIds,
    nodeData: body.nodeData,
    perContactVariables: body.perContactVariables || {},
  };

  try {
    await redis.xadd(STREAM_KEY, "*", { payload: JSON.stringify(payload) });
  } catch (e: any) {
    console.error("[Broadcast] Failed to push to stream", e);
    return NextResponse.json({ error: "stream push failed" }, { status: 500 });
  }

  return NextResponse.json({ status: "queued" });
}
