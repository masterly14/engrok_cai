"use server";

import { db } from "@/utils";
import { onBoardUser } from "../user";

export const saveFileInDatabase = async (data: any) => {
  const user = await onBoardUser();

  if (!user) {
    return {
      status: 500,
      message: "Error interno al subir el archivo",
    };
  }
  const { id, name } = data;
  const file = await db.knowledgeBase.create({
    data: {
      vapiId: id,
      trieveApiKey: data.trieveApiKey,
      name: name,
      credentialId: data.credentialId,
      user: {
        connect: {
          id: user.data.id,
        },
      },
    },
  });

  if (!file) {
    return {
      status: 500,
      message: "Error interno al subir el archivo",
    };
  }

  return {
    status: 200,
    message: "Archivo subido correctamente",
    data: {
      id: file.id,
      vapiId: file.vapiId,
    },
  };
};

export const getUserFiles = async () => {
  const user = await onBoardUser();

  if (!user) {
    return {
      status: 500,
      message: "Error interno al obtener los archivos",
      data: null,
    };
  }

  try {
    const files = await db.knowledgeBase.findMany({
      where: {
        userId: user.data.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      status: 200,
      message: "Archivos obtenidos correctamente",
      data: files,
    };
  } catch (error) {
    console.error("Error fetching files:", error);
    return {
      status: 500,
      message: "Error interno al obtener los archivos",
      data: null,
    };
  }
};
