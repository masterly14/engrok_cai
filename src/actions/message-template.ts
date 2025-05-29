"use server"

import { whatsappService } from "@/services/whatsapp";
import { db } from "@/utils";
import { onBoardUser } from "./user";

interface TemplateComponent {
  type: string;
  format?: string;
  text?: string;
  buttons?: any[];
}

interface CreateTemplateInput {
  agentId: string;
  name: string;
  language: string;
  category: string;
  components: TemplateComponent[];
}

export async function createAgentMessageTemplate({
  agentId,
  name,
  language,
  category,
  components,
}: CreateTemplateInput) {
  // Seguridad: validar usuario dueño del agente
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const agent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });

  if (!agent) throw new Error("Agent not found");

  const payload = {
    name,
    language,
    category,
    components,
  };

  // 1. Crear plantilla en Meta
  const metaResponse = await whatsappService.createMessageTemplate(
    agentId,
    payload
  );

  // 2. Guardar en base de datos
  const saved = await db.messageTemplate.create({
    data: {
      externalId: metaResponse.id,
      name: metaResponse.name ?? name,
      status: metaResponse.status as any,
      language,
      category,
      components: components as any,
      chatAgentId: agentId,
    },
  });

  return { status: 201, data: saved };
}

export async function getAgentMessageTemplates(agentId: string) {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const templates = await db.messageTemplate.findMany({
    where: { chatAgentId: agentId, chatAgent: { userId: user.data.id } },
  });

  return templates;
}

// Obtener una plantilla específica por su ID asegurando pertenencia del usuario
export async function getMessageTemplateById(templateId: string) {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const template = await db.messageTemplate.findFirst({
    where: { id: templateId, chatAgent: { userId: user.data.id } },
  });

  if (!template) throw new Error("Template not found");

  return template;
} 