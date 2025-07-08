"use server";

import { VapiClient } from "@vapi-ai/server-sdk";
import { db } from "@/utils";
import { onBoardUser } from "../user";
import { revalidateTag } from "next/cache";

const client = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

export async function createAssistantAction(formData: FormData) {
  console.log("formData", formData);
  let backgroundSound =
    (formData.get("backgroundSound") as string) || undefined;
  if (backgroundSound !== "office" && backgroundSound !== "off") {
    backgroundSound = "off";
  }

  const assistantResponse = await client.assistants.create({
    name: formData.get("name") as string,
    model: {
      model: "gemma2-9b-it",
      provider: "groq",
      emotionRecognitionEnabled: true,
      maxTokens: 1000,
      temperature: 0.5,
      messages: [
        {
          role: "system",
          content: formData.get("prompt") as string,
        },
      ],
      knowledgeBaseId: (formData.get("knowledgeBaseId") as string) || undefined,
    },
    firstMessage: formData.get("firstMessage") as string,
    backgroundSound: backgroundSound,
    transcriber: {
      provider: "deepgram",
      language: "multi",
      model: "nova-3",
    },
    voice: {
      provider: "11labs",
      voiceId: (formData.get("voiceId") as string) || "21m00Tcm4TlvDq8ikWAM",
      optimizeStreamingLatency: 4,
      model: "eleven_multilingual_v2",
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.1,
    },
  });

  if (!assistantResponse) {
    return {
      status: 500,
      message: "Error al crear el asistente en Vapi",
    };
  }

  const user = await onBoardUser();
  if (!user || !user.data?.id) {
    return {
      status: 500,
      message: "Usuario no autenticado",
    };
  }

  const vapiAssistant: any =
    (assistantResponse as any).assistant || assistantResponse;
  const vapiAssistantId = vapiAssistant?.id;

  if (!vapiAssistantId) {
    return {
      status: 500,
      message: "No se pudo obtener el ID del asistente de Vapi",
    };
  }

  const agent = await db.agent.create({
    data: {
      vapiId: vapiAssistantId,
      name: formData.get("name") as string,
      firstMessage: formData.get("firstMessage") as string,
      prompt: formData.get("prompt") as string,
      backgroundSound: (formData.get("backgroundSound") as string) || null,
      voiceId: (formData.get("voiceId") as string) || null,
      User: {
        connect: {
          id: user.data.id,
        },
      },
    },
  });

  if (!agent) {
    return {
      status: 500,
      message: "Error al guardar el agente en la base de datos",
    };
  }

  // Revalidar la caché para reflejar el nuevo agente
  revalidateTag("agents");

  return {
    status: 201,
    message: "Asistente y agente creados correctamente",
    data: agent,
  };
}

export async function updateAssistantAction(
  formData: FormData,
  vapiId: string,
) {
  const assistantResponse = await client.assistants.update(vapiId, {
    name: formData.get("name") as string,
    firstMessage: formData.get("firstMessage") as string,
    model: {
      provider: "groq",
      model: "gemma2-9b-it",
      messages: [
        {
          role: "system",
          content: formData.get("prompt") as string,
        },
      ],
      emotionRecognitionEnabled: true,
      knowledgeBaseId: (formData.get("knowledgeBaseId") as string) || undefined,
    },
    backgroundSound: "office",
    voice: {
      provider: "11labs",
      voiceId: (formData.get("voiceId") as string) || "21m00Tcm4TlvDq8ikWAM",
      optimizeStreamingLatency: 4,
      model: "eleven_multilingual_v2",
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.1,
    },
    stopSpeakingPlan: {
      backoffSeconds: 1,
      numWords: 1,
      voiceSeconds: 0.2,
    },
    silenceTimeoutSeconds: 10,
  });

  if (!assistantResponse) {
    return {
      status: 500,
      message: "Error al actualizar el asistente en Vapi",
    };
  }

  const updateDb = await db.agent.update({
    where: {
      vapiId: vapiId,
    },
    data: {
      name: formData.get("name") as string,
      firstMessage: formData.get("firstMessage") as string,
      prompt: formData.get("prompt") as string,
      backgroundSound: (formData.get("backgroundSound") as string) || null,
      voiceId: (formData.get("voiceId") as string) || null,
    },
  });

  if (!updateDb) {
    return {
      status: 500,
      message: "Error al actualizar el agente en la base de datos",
    };
  }

  // Revalidar la caché para que las consultas obtengan los datos actualizados
  revalidateTag("agents");

  return {
    status: 201,
    message: "Asistente y agente actualizados correctamente",
    data: updateDb,
  };
}
