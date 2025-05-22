"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";

export const saveKnowledgeBase = async (values: any) => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("No user");
  }

  const response = await db.knowledgeBase.create({
    data: {
      name: values.name,
      idElevenlabs: values.id,
      userId: user.data.id,
    },
  });

  if (!response ){
   return {
      status: 500,
      message: "¡Ups! We couldn't create the knowledge base"
   }
  }

  return {
   status: 200
}
}

export const getKnowledgeBases = async () => {
  const user = await onBoardUser();
  if (!user?.data.id) {
    throw new Error("No user");
  }

  const knowledgeBases = await db.knowledgeBase.findMany({
    where: {
      userId: user.data.id
    },
  });
  console.log('Respuesta de servidor: ', knowledgeBases)
  return {
    status: 200,
    data: knowledgeBases
  }
}
