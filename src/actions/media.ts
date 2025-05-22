"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";

/**
 * Envia un mensaje multimedia (imagen o documento) y lo guarda en la base de datos.
 * NOTA: Esta acción únicamente persiste el mensaje en la base de datos.  
 * Si quieres integrar el envío real por WhatsApp/Facebook, llama al servicio correspondiente
 * antes de crear el registro (por ejemplo `whatsappService.sendMessage`).
 */
export const sendMediaMessage = async (
  agentId: string,
  contactId: string,
  mediaUrl: string,
  mediaType: "IMAGE" | "DOCUMENT"
) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not found");
  }

  // Verificamos que el agente pertenezca al usuario autenticado
  const chatAgent = await db.chatAgent.findFirst({
    where: { id: agentId, userId: user.data.id },
  });
  if (!chatAgent) {
    return { status: 404 as const, message: "Agent not found" };
  }

  // Obtenemos el contacto
  const contact = await db.contact.findFirst({ where: { id: contactId } });
  if (!contact) {
    return { status: 404 as const, message: "Contact not found" };
  }

  const message = await db.message.create({
    data: {
      waId: `${Date.now()}`,
      from: chatAgent.phoneNumber ?? "",
      to: contact.phoneNumber,
      timestamp: new Date(),
      type: mediaType,
      textBody: mediaUrl, // guardamos la URL como cuerpo del mensaje
      metadata: { mediaUrl },
      contactId: contact.id,
      chatAgentId: chatAgent.id,
    },
  });

  return { status: 201 as const, data: message };
}; 