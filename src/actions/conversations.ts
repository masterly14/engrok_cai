"use server";

import { onBoardUser } from "./user";
import { notFound } from "next/navigation";
import { pusherServer } from "@/lib/pusher";
import axios from "axios";
import { db } from "@/utils";
import { MessageType } from "@prisma/client";

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

  const contacts = await db.chatContact.findMany({
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
      contact: contact.name || contact.phone,
      phoneNumber: contact.phone,
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
  const contact = await db.chatContact.findFirst({
    where: { id: contactId },
    select: {
      id: true,
      phone: true,
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
    sender: msg.from === contact.phone ? "user" : "agent",
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

/**
 * Fetches a single chat agent along with all its associated contacts.
 * @param agentId The ID of the chat agent.
 * @returns The agent object with its contacts, or null if not found.
 */
export const getAgentWithContacts = async (agentId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  const agent = await db.chatAgent.findUnique({
    where: { id: agentId, userId: user.data.id },
    include: {
      chatContacts: {
        orderBy: {
          updatedAt: 'desc'
        },
        include: {
          sessions: {
            where: { status: { in: ["ACTIVE", "NEEDS_ATTENTION"] } },
            select: { id: true, status: true }
          }
        }
      }
    },
  });

  return agent;
};

/**
 * Fetches all messages for a specific conversation between an agent and a contact.
 * @param agentId The ID of the chat agent.
 * @param contactPhone The phone number of the contact.
 * @returns An array of messages sorted by timestamp.
 */
export const getMessagesForConversation = async (
  agentId: string,
  contactPhone: string
) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not authenticated");
  }

  // Find the contact first to ensure it belongs to the agent
  const contact = await db.chatContact.findFirst({
    where: {
      phone: contactPhone,
      chatAgentId: agentId,
      chatAgent: {
        userId: user.data.id,
      },
    },
  });

  if (!contact) {
    console.warn(
      `Attempt to access messages for contact ${contactPhone} failed. Contact not found for agent ${agentId}.`
    );
    return [];
  }

  try {
    const messages = await db.message.findMany({
      where: {
        chatAgentId: agentId,
        chatContactId: contact.id,
      },
      orderBy: {
        timestamp: "asc",
      },
    });
    return messages;
  } catch (error) {
    console.error("Error fetching messages for conversation:", error);
    return [];
  }
};

export const sendManualMessage = async ({
  agentId,
  contactId,
  type,
  text,
  mediaUrl,
  fileName,
}: {
  agentId: string;
  contactId: string;
  /** "text" | "image" | "audio" | "video" | "document" */
  type: "text" | "image" | "audio" | "video" | "document";
  /** Caption for image / video / document or body for text */
  text?: string;
  /** Fully-qualified HTTPS URL pointing to the media previously uploaded to Cloudinary */
  mediaUrl?: string;
  /** Original filename for documents */
  fileName?: string;
}) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    return { error: "Unauthorized" };
  }

  const agent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });

  const contact = await db.chatContact.findUnique({
    where: { id: contactId },
  });

  if (!agent || !contact) {
    return { error: "Agent or Contact not found" };
  }

  if (!agent.whatsappAccessToken || !agent.whatsappPhoneNumberId) {
    return { error: "Agent is not configured for sending messages." };
  }

  const META_API_URL = `https://graph.facebook.com/v19.0/${agent.whatsappPhoneNumberId}/messages`;

  // Build payload according to WhatsApp Cloud API docs
  let payload: Record<string, any> = {
    messaging_product: "whatsapp",
    to: contact.phone,
  };

  switch (type) {
    case "image":
      payload = {
        ...payload,
        type: "image",
        image: {
          link: mediaUrl,
          ...(text ? { caption: text } : {}),
        },
      };
      break;
    case "audio":
      payload = {
        ...payload,
        type: "audio",
        audio: {
          link: mediaUrl,
        },
      };
      break;
    case "video":
      payload = {
        ...payload,
        type: "video",
        video: {
          link: mediaUrl,
          ...(text ? { caption: text } : {}),
        },
      };
      break;
    case "document":
      payload = {
        ...payload,
        type: "document",
        document: {
          link: mediaUrl,
          ...(text ? { caption: text } : {}),
          ...(fileName ? { filename: fileName } : {}),
        },
      };
      break;
    default:
      // text
      payload = {
        ...payload,
        type: "text",
        text: { body: text || "" },
      };
  }

  try {
    const response = await axios.post(META_API_URL, payload, {
      headers: { Authorization: `Bearer ${agent.whatsappAccessToken}` },
    });

    const sentMessageWaId = response.data?.messages?.[0]?.id;
    if (!sentMessageWaId) {
      console.error("WhatsApp API did not return a message ID", response.data);
      return { error: "Failed to send message via WhatsApp" };
    }

    // Map string type to Prisma enum
    const prismaType = MessageType[type.toUpperCase() as keyof typeof MessageType] || MessageType.TEXT;

    const newMessage = await db.message.create({
      data: {
        waId: sentMessageWaId,
        from: agent.whatsappPhoneNumber,
        to: contact.phone,
        timestamp: new Date(),
        type: prismaType,
        textBody: text || mediaUrl || "", // store caption or URL for quick reference
        metadata: payload,
        chatAgentId: agent.id,
        chatContactId: contact.id,
      },
    });

    const channel = `conversation-${agent.id}-${contact.id}`;
    await pusherServer.trigger(channel, "new-message", newMessage);
    console.log(`[Pusher] Triggered 'new-message' on channel ${channel}`);

    return { success: true, message: newMessage };
  } catch (error: any) {
    console.error("[sendManualMessage] Error:", error.response?.data || error.message);
    const errorMessage = error.response?.data?.error?.message || "An unknown error occurred.";
    return { error: `Failed to send message: ${errorMessage}` };
  }
};
