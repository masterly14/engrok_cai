"use server";

import { db } from "@/utils";
import { currentUser } from "@clerk/nextjs/server";
import axios from "axios";
import { MessageType, Prisma } from "@prisma/client";
import Pusher from "pusher";

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export const sendTemplateMessage = async (
  contactId: string,
  templateId: string,
  variables: Record<string, string>,
) => {
  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true },
  });
  if (!dbUser) {
    throw new Error("User not found in DB.");
  }

  const contact = await db.chatContact.findUnique({
    where: { id: contactId },
    include: { chatAgent: true },
  });
  if (!contact || contact.chatAgent.userId !== dbUser.id) {
    throw new Error("Contact not found or you don't have permission.");
  }

  const template = await db.messageTemplate.findUnique({
    where: { id: templateId },
  });
  if (!template || template.agentId !== contact.chatAgentId) {
    throw new Error("Template not found or does not belong to the agent.");
  }

  const agent = contact.chatAgent;
  const SENDER_ID = agent.whatsappPhoneNumberId;
  const META_URL = `https://graph.facebook.com/v19.0/${SENDER_ID}/messages`;

  const templateComponents: any[] = [];
  const templateJson = template.components as Prisma.JsonObject;
  const componentsDefinition = (templateJson.components || []) as any[];

  const headerDef = componentsDefinition.find((c) => c.type === "HEADER");
  if (headerDef && headerDef.format === "TEXT" && headerDef.text) {
    const headerVarMatches = headerDef.text.match(/\\{\\{\\d+\\}\\}/g) || [];
    if (headerVarMatches.length > 0) {
      const headerParams = headerVarMatches.map((match: string) => {
        const idx = match.replace(/[^\\d]/g, "");
        return { type: "text", text: variables[idx] || "" };
      });
      templateComponents.push({ type: "header", parameters: headerParams });
    }
  }

  const bodyDef = componentsDefinition.find((c) => c.type === "BODY");
  if (bodyDef && bodyDef.text) {
    const bodyVarMatches = bodyDef.text.match(/\\{\\{\\d+\\}\\}/g) || [];
    if (bodyVarMatches.length > 0) {
      const bodyParams = bodyVarMatches.map((match: string) => {
        const idx = match.replace(/[^\\d]/g, "");
        return { type: "text", text: variables[idx] || "" };
      });
      templateComponents.push({ type: "body", parameters: bodyParams });
    }
  }

  const payload = {
    messaging_product: "whatsapp",
    to: contact.phone,
    type: "template",
    template: {
      name: template.name,
      language: { code: template.language },
      components: templateComponents,
    },
  };

  const response = await axios.post(META_URL, payload, {
    headers: { Authorization: `Bearer ${agent.whatsappAccessToken}` },
  });

  const sentMessageId = response.data.messages[0].id;

  const newMessage = await db.message.create({
    data: {
      waId: sentMessageId,
      from: agent.whatsappPhoneNumber,
      to: contact.phone,
      timestamp: new Date(),
      type: "INTERACTIVE",
      textBody: `Template: ${template.name}`,
      metadata: payload as any,
      chatAgentId: agent.id,
      chatContactId: contact.id,
    },
  });

  const channel = `conversation-${agent.id}-${contact.id}`;
  await pusher.trigger(channel, "new-message", newMessage);

  return { success: true, message: newMessage };
};
