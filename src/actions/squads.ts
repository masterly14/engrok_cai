"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";

export const getAllSquads = async () => {
  const user = await onBoardUser();

  if (!user) {
    return {
      error: "User not found",
    };
  }

  const squads = await db.squad.findMany({
    where: {
      userId: user.data.id,
    },
    include: {
      agents: {
        include: {
          agent: true,
        },
      },
    },
  });

  return squads;
};

interface CreateSquadParams {
  name: string;
  agentIds: string[];
  edges?: any; // Optional: could be saved in future
}

export const createSquad = async (params: CreateSquadParams, vapiId: string) => {
  const user = await onBoardUser();

  if (!user) {
    throw new Error("User not found");
  }

  // Create squad first
  const squad = await db.squad.create({
    data: {
      name: params.name,
      userId: user.data.id,
      vapiId: vapiId,
    },
  });

  // Link agents to squad
  if (Array.isArray(params.agentIds) && params.agentIds.length > 0) {
    const agentSquadData = params.agentIds.map((agentId) => ({
      agentId,
      squadId: squad.id,
    }));

    await db.agentSquad.createMany({ data: agentSquadData });
  }

  // TODO: persist edges if you extend schema

  return squad;
}; 