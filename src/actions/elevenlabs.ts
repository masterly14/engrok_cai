"use server";

import { ElevenLabsClient } from "elevenlabs";
import { onBoardUser } from "./user";
import { db } from "@/utils";
import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";

const apiKey = process.env.ELEVENLABS_API_KEY;

// Fetch the list of available TTS voices from ElevenLabs, with caching.
export const getElevenLabsVoices = unstable_cache(
  async () => {
    const client = new ElevenLabsClient({ apiKey });
    const voices = await client.voices.getAll();
    return voices;
  },
  ["elevenlabs-voices"], // Clave de caché única
  {
    revalidate: 60 * 60, // Cachear por 1 hora
  },
);

/**
 * Input parameters required to create an ElevenLabs agent in the Conversational-AI API
 * and immediately persist a local widget record.
 */

/**
 * Crea un agente conversacional en ElevenLabs y guarda (o actualiza) la entrada
 * correspondiente en la colección `ElevenLabsWidget`.
 * Devuelve el widget persistido con su `agentId` listo para usarse en el front-end.
 */
export const createAgentAndWidget = async (payload: any) => {
  const user = await onBoardUser();
  if (!user) {
    throw new Error("unauthorized");
  }

  try {
    const client = new ElevenLabsClient({ apiKey });

    // Gracias a la corrección, usamos el método correcto del SDK.
    // La estructura del payload probablemente esté anidada, similar a la API de websockets.
    const agentData = await client.conversationalAi.createAgent({
      conversation_config: {
        agent: {
          dynamic_variables: payload.dynamicVariables,
          language: "es",
          first_message: payload.firstMessage,
          prompt: {
            prompt: payload.systemPrompt,
            llm: "gemini-2.5-flash",
            temperature: 0.5,
          },
        },
        tts: {
          voice_id: payload.voiceId,
          model_id: "eleven_flash_v2_5",
          optimize_streaming_latency: 4,
          speed: 1.0,
          stability: 0.5,
        },
        conversation: {
          max_duration_seconds: 300,
        },
      },
      platform_settings: {
        widget: {
          action_text: payload.actionText,
          language_selector: true,
          listening_text: payload.listeningText
            ? payload.listeningText
            : "Escuchando...",
          end_call_text: payload.endCallText
            ? payload.endCallText
            : "Fin de la llamada",
          speaking_text: payload.speakingText
            ? payload.speakingText
            : "Hablando...",
          start_call_text: payload.startCallText
            ? payload.startCallText
            : "Iniciando llamada...",
        },
      },
      name: payload.name,
    });

    const agentId = (agentData as any).agent_id;
    if (!agentId) {
      throw new Error(
        "El ID del agente no se encontró en la respuesta de la API de ElevenLabs",
      );
    }

    const widget = await db.elevenLabsWidget.create({
      data: {
        agentId,
        name: payload.name,
        firstMessage: payload.firstMessage,
        systemPrompt: payload.systemPrompt,
        voiceId: payload.voiceId,
        actionText: payload.actionText,
        avatarImageUrl: payload.avatarImageUrl,
        dynamicVariables: payload.dynamicVariables,
        ownerId: user.data.id,
      },
    });

    return widget;
  } catch (error) {
    console.error("create widget error", error);
    if (error instanceof Error) {
      throw new Error(`Error al crear el agente con el SDK: ${error.message}`);
    }
    throw new Error("Ocurrió un error desconocido al crear el agente.");
  }
};

// TODO: Implement agent + widget creation using ElevenLabs API and persist it in the DB.
// export const createElevenLabsAgentAndWidget = async (params: CreateAgentParams) => { ... }
