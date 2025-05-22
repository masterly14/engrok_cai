"use server";

import { WhatsAppMessage } from "@/types/whatsapp";
import { db } from "@/utils";

export const saveMessage = async (message: any) => {
  const entry = message.entry?.[0];
  const change = entry?.changes?.[0];
  const messageText = change?.value?.messages?.[0];
  if (!messageText) {
    return {
      status: 200,
      data: "No message to process",
    };
  }
  const msgType = messageText.type.toUpperCase() as any;
  console.log("[saveMessage]: Processing message", messageText);

  if (!messageText) {
    console.log("[saveMessage]: No message text found");
    return {
      status: 200,
      data: "No message to process",
    };
  }

  console.log("[saveMessage]: Message type identified as", msgType);

  // Buscar o crear el contacto y obtener el chatAgentId
  const { contact, chatAgentId } = await getOrCreateContactAndChatAgent(
    change.value.metadata.display_phone_number,
    messageText.from,
    messageText
  );

  const response = await db.message.create({
    data: {
      waId: messageText.id,
      from: messageText.from,
      to: change.value.metadata.display_phone_number,
      timestamp: new Date(parseInt(messageText.timestamp) * 1000),
      type: msgType,
      textBody: messageText.text?.body ?? null,
      metadata: {
        ...messageText[messageText.type],
      },
      contactId: contact.id,
      chatAgentId: chatAgentId, // Asociar el mensaje con el ChatAgent
    },
  });
  if (!response) {
    return {
      status: 500,
      data: "Failed to save message"
    }
  }

  return {
    status: 201,
    data: "Saved message in database"
  }
};

// Nueva función mejorada para obtener o crear contacto y asociar ChatAgent
async function getOrCreateContactAndChatAgent(agentPhone: string, clientPhoneNumber: string, messageText: any) {
  /**
   * Vincula el contacto con el agente y el chatAgent correspondiente.
   */

  // 1. Obtener el agente que corresponde al número de WhatsApp entrante (Twilio)
  const chatAgent = await db.chatAgent.findFirst({
    where: {
      phoneNumber: agentPhone,
    },
  });

  if (!chatAgent) {
    throw new Error("Agent not found for this Twilio phone number");
  }
  console.log("[getOrCreateContactAndChatAgent]: Iniciando proceso para obtener o crear contacto y asociar ChatAgent");

  console.log(`[getOrCreateContactAndChatAgent]: Buscando chatAgent para el número de teléfono del agente: ${agentPhone}`);
  if (!chatAgent) {
    console.error("[getOrCreateContactAndChatAgent]: No se encontró un agente para este número de teléfono de Twilio");
    throw new Error("Agent not found for this Twilio phone number");
  }
  console.log(`[getOrCreateContactAndChatAgent]: chatAgent encontrado: ${chatAgent.id}`);

  console.log(`[getOrCreateContactAndChatAgent]: Buscando contacto existente para el número de cliente: ${clientPhoneNumber}`);

  // 3. Buscar el contacto existente para ese agente y número de cliente
  let contact = await db.contact.findFirst({
    where: {
      phoneNumber: clientPhoneNumber,
      chatAgentId: chatAgent.id,
    },
  });

  // 4. Si no existe, crearlo (incluyendo datos adicionales si están disponibles)
  if (!contact) {
    contact = await db.contact.create({
      data: {
        waId: clientPhoneNumber,
        phoneNumber: clientPhoneNumber,
        chatAgentId: chatAgent.id,
        name: messageText.profile?.name ?? null,
        email: null,
      },
    });

    // Crear Lead automáticamente si no existe
    const existingLead = await db.lead.findFirst({
      where: {
        phone: clientPhoneNumber,
        userId: chatAgent.userId,
      },
    });

    if (!existingLead) {
      await db.lead.create({
        data: {
          name: messageText.profile?.name ?? "Nuevo lead",
          company: "",
          email: "",
          phone: clientPhoneNumber,
          stageId: "new", // etapa por defecto
          tags: [],
          lastContact: new Date().toISOString(),
          notes: "",
          userId: chatAgent.userId,
        },
      });
    }
  } else if (chatAgent && contact.chatAgentId !== chatAgent.id) {
    // Si el contacto existe pero no tiene asociado el chatAgent, actualizarlo
    contact = await db.contact.update({
      where: { id: contact.id },
      data: { chatAgentId: chatAgent.id },
    });
  }

  return { contact, chatAgentId: chatAgent?.id ?? null };
}
