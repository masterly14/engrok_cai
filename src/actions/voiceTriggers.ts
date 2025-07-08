"use server";

import { db } from "@/utils"; // Ajusta esta ruta si es necesario
import { onBoardUser } from "./user";
import { revalidatePath } from "next/cache";
import { randomBytes } from "crypto";

/**
 * Crea un nuevo trigger para un workflow de voz.
 * @param workflowId El ID del workflow al que se asocia el trigger.
 * @param provider Un nombre descriptivo para el trigger (ej. "Webhook de HubSpot").
 * @param mapping El objeto JSON que mapea los campos del webhook entrante.
 */
export const createVoiceTrigger = async (
  workflowId: string,
  provider: string,
  mapping: object,
) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("Usuario no autenticado");
  }

  // Verificar que el workflow pertenece al usuario
  const workflow = await db.workflow.findFirst({
    where: {
      id: workflowId,
      userId: user.data.id,
    },
  });

  if (!workflow) {
    throw new Error("El workflow no existe o no tienes permiso sobre él.");
  }

  // Generar un token único y seguro para la URL del webhook
  const token = randomBytes(20).toString("hex");

  const newTrigger = await db.voiceWorkflowTrigger.create({
    data: {
      userId: user.data.id,
      workflowId,
      provider,
      mapping,
      token,
    },
  });

  // Revalidar la caché de la página del workflow para mostrar el nuevo trigger
  revalidatePath(`/application/agents/voice-agents/workflows/${workflowId}`);

  return {
    status: 201,
    trigger: newTrigger,
  };
};

/**
 * Obtiene todos los triggers para un workflow específico.
 * @param workflowId El ID del workflow.
 */
export const getVoiceTriggersForWorkflow = async (workflowId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("Usuario no autenticado");
  }

  const triggers = await db.voiceWorkflowTrigger.findMany({
    where: {
      workflowId,
      userId: user.data.id, // Asegura que solo se devuelvan los del usuario
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    status: 200,
    triggers,
  };
};

/**
 * Elimina un trigger de voz.
 * @param triggerId El ID del trigger a eliminar.
 */
export const deleteVoiceTrigger = async (triggerId: string) => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("Usuario no autenticado");
  }

  const trigger = await db.voiceWorkflowTrigger.findFirst({
    where: {
      id: triggerId,
      userId: user.data.id, // El usuario solo puede borrar sus propios triggers
    },
  });

  if (!trigger) {
    throw new Error(
      "El trigger no existe o no tienes permiso para eliminarlo.",
    );
  }

  await db.voiceWorkflowTrigger.delete({
    where: {
      id: triggerId,
    },
  });

  // Revalidar la página del workflow para que la lista de triggers se actualice
  revalidatePath(
    `/application/agents/voice-agents/workflows/${trigger.workflowId}`,
  );

  return {
    status: 200,
    message: "Trigger eliminado correctamente.",
  };
};
