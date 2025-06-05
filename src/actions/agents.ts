"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";
import { VapiClient } from "@vapi-ai/server-sdk";


const client = new VapiClient({
  token: process.env.VAPI_API_KEY!
});
export const getAllAgents = async () => {
  const user = await onBoardUser();

  if (!user) {
    return {
      error: "User not found",
    };
  }

  const agents = await db.agent.findMany({
    where: {
      userId: user.data.id,
    },
  });

  return agents;
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
