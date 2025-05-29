"use server"

import { db } from "@/utils";
import { onBoardUser } from "./user";

export const getAllChatAgents = async () => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");
  const agents = await db.chatAgent.findMany({
    where: { userId: user.data.id },
    include: {
      tags: true,
      stage: true,
      _count: {
        select: { messages: true },
      },
      products: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Mapear para reemplazar la propiedad `totalMessages` con el conteo real de mensajes
  const agentsWithMessageCount = agents.map(({ _count, ...agent }) => ({
    ...agent,
    totalMessages: _count.messages,
  }));

  return { status: 200, data: agentsWithMessageCount };
};

export const createChatAgent = async (values: any) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");

  // Extract all the fields from the form
  const {
    name,
    isActive,
    type,
    whatsappBusinessId,
    phoneNumberId,
    apiKey,
    phoneNumber,
    wompiEventsKey,
    wompiPrivateKey,
    products = []
  } = values;

  // Create the agent with all the required fields
  const agent = await db.chatAgent.create({
    data: {
      name,
      isActive,
      type,
      whatsappBusinessId,
      phoneNumberId,
      apiKey,
      phoneNumber,
      wompiEventsKey,
      wompiPrivateKey,
      userId: user.data.id,
      products: products.length > 0 ? {
        create: products.map((p: any) => ({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          images: p.images,
          payment_link: p.payment_link,
          category: p.category,
        }))
      } : undefined,
    },
    include: { products: true },
  });

  return { status: 201, data: agent };
};

export const updateChatAgent = async (id: string, values: any) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");
  const agent = await db.chatAgent.update({
    where: { id, userId: user.data.id },
    data: values,
  });
  return { status: 200, data: agent };
};

export const deleteChatAgent = async (id: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) throw new Error("User not found");
  await db.chatAgent.delete({
    where: { id, userId: user.data.id },
  });
  return { status: 204 };
};


export const finishSetupServer = async (id: string, whatsappWebhookSecret: string) => {
  const updatedAgent = await db.chatAgent.update({
    where: { id },
    data: {
      whatsappWebhookSecret: whatsappWebhookSecret,
    }
  });
  if (!updatedAgent) throw new Error("Agent not found");
  return { status: 200, data: updatedAgent };
};
