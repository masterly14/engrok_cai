"use server";

import { VapiClient } from "@vapi-ai/server-sdk";
import { onBoardUser } from "./user";
import { unstable_cache } from "next/cache";
import { db } from "@/utils";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

// Función interna cacheada que solo maneja la consulta a la base de datos
const getCachedAgents = unstable_cache(
  async (userId: string) => {
    const agents = await db.agent.findMany({
      where: { userId },
      include: {
        tools: true,
      },
    });
    return agents;
  },
  ["agents"],
  {
    revalidate: 3600,
    tags: ["agents"],
  },
);

// Función principal que maneja la autenticación y luego usa la función cacheada
export const getAllAgents = async () => {
  const user = await onBoardUser();
  if (!user) {
    return { error: "User not found" };
  }

  return await getCachedAgents(user.data.id);
};

export const deleteAgents = async (agentId: string, vapiId: string) => {
  await db.agent.delete({
    where: {
      id: agentId,
    },
  });

  await client.assistants.delete(vapiId);

  return {
    status: 200,
    message: "Agente eliminado correctamente",
  };
};

/**
 * Obtiene todos los agentes de voz para un usuario específico.
 * Incluye las herramientas asociadas a cada agente.
 */
export async function getAgents(userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const agents = await db.agent.findMany({
    where: { userId },
    include: {
      tools: true, // ¡IMPORTANTE! Incluimos las herramientas relacionadas
    },
    orderBy: {
      name: "asc",
    },
  });
  return agents;
}

/**
 * Publica los cambios de un agente en Vapi y actualiza la base de datos local.
 * @param {Object} data - Datos del agente y herramientas.
 * @returns El agente actualizado.
 */
export async function publishAgent(data: {
  name: string;
  firstMessage: string;
  prompt: string;
  backgroundSound?: string;
  voiceId?: string;
  knowledgeBaseId?: string | null;
  vapiId: string;
  toolIds: string[]; // Se añade para recibir los IDs de las herramientas seleccionadas
}) {
  const { toolIds, ...agentData } = data;

  // 1. Actualizar el agente en la base de datos local y sus relaciones con las herramientas
  const updatedDbAgent = await db.agent.update({
    where: { vapiId: agentData.vapiId },
    data: {
      ...agentData,
      tools: {
        // 'set' es la forma más sencilla de sincronizar una relación muchos-a-muchos.
        // Reemplaza las conexiones existentes con la nueva lista.
        set: toolIds.map((id) => ({ id })),
      },
    },
    include: {
      tools: true, // Devolvemos el agente con las herramientas actualizadas
    },
  });

  // 2. Formatear las herramientas para la API de Vapi
  const vapiFunctions = updatedDbAgent.tools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  }));

  // 3. Crear el payload para la API de Vapi
  const vapiPayload = {
    name: updatedDbAgent.name,
    firstMessage: updatedDbAgent.firstMessage,
    backgroundSound: updatedDbAgent.backgroundSound,
    model: {
      provider: "openai",
      model: "gpt-4o",
      functions: vapiFunctions,
    },
  };

  // 4. Realizar la llamada PATCH a Vapi
  const response = await fetch(
    `https://api.vapi.ai/assistant/${agentData.vapiId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      },
      body: JSON.stringify(vapiPayload),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to update Vapi assistant: ${errorBody}`);
  }

  return updatedDbAgent;
}
