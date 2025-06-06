"use server";

import { VapiClient } from "@vapi-ai/server-sdk";
import { onBoardUser } from "./user";
import { unstable_cache } from "next/cache";
import { db } from "@/utils";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!
});

// Función interna cacheada que solo maneja la consulta a la base de datos
const getCachedAgents = unstable_cache(
  async (userId: string) => {
    const agents = await db.agent.findMany({
      where: { userId },
    });
    return agents;
  },
  ["agents"],
  {
    revalidate: 3600,
    tags: ["agents"],
  }
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
    }
  })

  await client.assistants.delete(vapiId);

  return {
    status: 200,
    message: "Agente eliminado correctamente",
  }
}
