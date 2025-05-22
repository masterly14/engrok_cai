"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";

// Obtener la información básica de un agente por su ID (verificando que pertenezca al usuario logueado)
export const getAgentById = async (agentId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const agent = await db.agent.findFirst({
    where: {
      id: agentId,
      userId: user.data.id,
    },
  });

  if (!agent)
    return { status: 404, message: "Agent not found" } as const;

  return { status: 200, data: agent } as const;
};

// Recupera todas las conversaciones (contactos) de un agente
export const getAgentConversations = async (agentId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  // Comprobamos que el agente pertenece al usuario
  const agent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });
  if (!agent)
    return { status: 404, message: "Agent not found" } as const;

  const contacts = await db.contact.findMany({
    where: { chatAgentId: agentId },
    include: {
      messages: {
        orderBy: { timestamp: "desc" },
        take: 1, // Solo el último mensaje para mostrar en la lista
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Formateamos la estructura para la UI del chat
  const conversations = contacts.map((contact) => {
    const lastMessage = contact.messages[0];
    return {
      id: contact.id,
      contact: contact.name || contact.phoneNumber,
      phoneNumber: contact.phoneNumber,
      lastMessage: lastMessage?.textBody ?? "",
      unread: 0, // Campo placeholder. Implementar lógica de no leídos si existe.
      timestamp: lastMessage?.timestamp ?? contact.updatedAt,
    };
  });

  return { status: 200, data: conversations } as const;
};

// Recuperar los mensajes de un contacto concreto
export const getMessagesByContact = async (contactId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  // Obtenemos el contacto con su agente y mensajes
  const contact = await db.contact.findFirst({
    where: { id: contactId },
    include: {
      chatAgent: true,
      messages: {
        orderBy: { timestamp: "asc" },
      },
    },
  });

  if (!contact) return { status: 404, message: "Contact not found" } as const;

  const formattedMessages = contact.messages.map((msg) => {
    // Si el mensaje viene del número de teléfono del contacto, el remitente es "user", de lo contrario "agent"
    const sender = msg.from === contact.phoneNumber ? "user" : "agent";
    return {
      id: msg.id,
      sender,
      content: msg.textBody ?? "",
      timestamp: msg.timestamp,
    };
  });

  return { status: 200, data: formattedMessages } as const;
};

// Crear un mensaje nuevo (enviado por el agente)
export const sendMessage = async (
  agentId: string,
  contactId: string,
  content: string
) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  // Obtenemos el agente para el número de teléfono
  const chatAgent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });

  if (!chatAgent) return { status: 404, message: "Agent not found" } as const;

  const contact = await db.contact.findFirst({ where: { id: contactId } });
  if (!contact)
    return { status: 404, message: "Contact not found" } as const;

  const message = await db.message.create({
    data: {
      waId: `${Date.now()}`, // Placeholder id. Debería provenir de proveedor WhatsApp.
      from: chatAgent.phoneNumber ?? "",
      to: contact.phoneNumber,
      timestamp: new Date(),
      type: "TEXT",
      textBody: content,
      contactId: contact.id,
      chatAgentId: chatAgent.id,
    },
  });

  return { status: 201, data: message } as const;
}; 