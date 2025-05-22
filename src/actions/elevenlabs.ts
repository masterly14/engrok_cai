"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";
import { ElevenLabsClient } from "elevenlabs";

const apiKey = process.env.ELEVENLABS_API_KEY;

export const getAllCalls = async (userId?: string) => {
  try {
    let effectiveUserId: string | undefined;
    if (!userId) {
      const user = await onBoardUser();
      effectiveUserId = user?.data.id;
    } else {
      effectiveUserId = userId;
    }
    if (!effectiveUserId) throw new Error("Usuario no encontrado");

    const Agents = await db.agent.findMany({
      where: { userId: effectiveUserId },
    });

    let secondsConversations = 0;
    let totalConversationsUser = 0;
    let totalCost = 0;

    //Encontrar la información actual.
    const currentData = await db.user.findUnique({
      where: {
        id: effectiveUserId,
      },
      select: {
        totalAverageDuration: true,
        totalConversations: true,
        totalCost: true,
        amountCredits: true,
      },
    });

    for (const widget of Agents) {
      try {
        // Obtener conversaciones desde ElevenLabs
        const getConversations = await fetch(
          `https://api.elevenlabs.io/v1/convai/conversations?agent_id=${widget.idElevenLabs}`,
          {
            method: "GET",
            headers: { "xi-api-key": apiKey! },
          }
        );

        if (!getConversations.ok) {
          throw new Error(
            `Error en la petición a ElevenLabs: ${getConversations.statusText}`
          );
        }

        const data = await getConversations.json();

        //Obtener la duración de llamadas
        secondsConversations += data.conversations.reduce(
          (acc: number, item: any) => acc + item.call_duration_secs,
          0
        );

        const conversationsLength = data.conversations?.length || 0;

        // Actualizar base de datos con el número de conversaciones
        if (widget.idElevenLabs) {
          await db.agent.update({
            where: { idElevenLabs: widget.idElevenLabs },
            data: { conversations: { increment: conversationsLength } },
          });
        }

        totalConversationsUser += conversationsLength;

        //For para obtener la cantidad de creditos de cada conversación
        for (const item of data.conversations) {
          try {
            const conversationDetails = await fetch(
              `https://api.elevenlabs.io/v1/convai/conversations/${item.conversation_id}`,
              {
                method: "GET",
                headers: { "xi-api-key": apiKey! },
              }
            );

            const dataConversation = await conversationDetails.json();

            if (
              dataConversation.metadata &&
              typeof dataConversation.metadata.cost !== "undefined"
            ) {
              totalCost += dataConversation.metadata.cost;
            } else {
              console.warn(
                `No se encontró 'cost' en la respuesta de la conversación ${item.conversation_id}`
              );
            }
          } catch (error) {
            console.error(
              `Error al obtener detalles de la conversación ${item.conversation_id}:`,
              error
            );
          }
        }
      } catch (error) {
        console.error(
          `Error al obtener o actualizar conversaciones para el widget ${widget.idElevenLabs}:`,
          error
        );
      }
    }
    if (
      currentData?.totalAverageDuration === secondsConversations &&
      currentData.totalConversations === totalConversationsUser &&
      currentData.totalCost === totalCost
    ) {
      return { conversations: currentData, status: 200 };
    } else {
      // Actualizar la cantidad total de conversaciones del usuario
      await db.user.update({
        where: { id: effectiveUserId },
        data: {
          // Establecer valores absolutos en lugar de incrementar
          totalConversations: totalConversationsUser,
          totalAverageDuration: secondsConversations,
          totalCost: totalCost,
          // Solo decrementar la diferencia de costo
          amountCredits: {
            decrement: Math.max(0, totalCost - (currentData?.totalCost || 0)),
          },
        },
      });

      // Obtener el total de conversaciones del usuario
      const userConversations = await db.user.findUnique({
        where: { id: effectiveUserId },
        select: {
          totalConversations: true,
          totalAverageDuration: true,
          totalCost: true,
        },
      });

      return { conversations: userConversations, status: 200 };
    }
  } catch (error: any) {
    console.error("Error en getAllCalls:", error);
    return { conversations: null, status: 500, error: error.message };
  }
};

export const getElevenLabsVoices = async () => {
  const client = new ElevenLabsClient();

  const voices = await client.voices.getAll();
  return voices;
};


export const createElevenLabsAgent = async (data: any) => {
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not defined");
  }
  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/convai/agents/create",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );
    const responseText = await response.text();
    console.log("Response text:", responseText);


    let responseData;
    try {
      responseData = JSON.parse(responseText);
      
    } catch (parseError) {
      console.log("Could not parse response as JSON:", parseError);
      responseData = { error: "Could not parse response" };
    }

    // Log detailed error information
    if (!response.ok) {
      console.error("Error details:", {
        status: response.status,
        statusText: response.statusText,
        body: responseData,
      });


      return {
        message: responseData.detail || responseData.error || "Server error",
        status: response.status,
        data: responseData,
      };
    }

    return {
      status: response.status,
      data: responseData.agent_id,
    };
  } catch (error: any) {
    console.log("Network Error: ", error.message);
    return {
      message: error.message,
      status: 500,
    };
  }
};