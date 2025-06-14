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
export const getMessagesByContact = async (contactId: string, options?: { page?: number; limit?: number }) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const page = options?.page || 1;
  const limit = options?.limit || 50;
  const skip = (page - 1) * limit;

  // Obtenemos el contacto con sus mensajes paginados
  const contact = await db.contact.findFirst({
    where: { id: contactId },
    select: {
      id: true,
      phoneNumber: true,
      messages: {
        orderBy: { timestamp: "desc" }, // Más recientes primero
        take: limit,
        skip: skip,
        select: {
          id: true,
          from: true,
          textBody: true,
          timestamp: true,
          type: true,
        },
      },
      _count: {
        select: { messages: true }
      }
    },
  });

  if (!contact) return { status: 404, message: "Contact not found" } as const;

  // Invertimos el orden para mostrar los más antiguos primero en la UI
  const formattedMessages = contact.messages.reverse().map((msg) => ({
    id: msg.id,
    sender: msg.from === contact.phoneNumber ? "user" : "agent",
    content: msg.textBody ?? "",
    timestamp: msg.timestamp,
  }));

  const totalMessages = contact._count.messages;
  const hasMore = skip + limit < totalMessages;

  return { 
    status: 200, 
    data: formattedMessages,
    nextPage: hasMore ? page + 1 : undefined,
    totalMessages
  } as const;
};
