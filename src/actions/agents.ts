"use server";

import { db } from "@/utils";
import { onBoardUser } from "./user";

export const saveAgentDB = async (values: any, widget?: boolean) => {
  const userResponse = await onBoardUser();
  if (!userResponse?.data?.id) {
    throw new Error("User not found");
  }

  if (widget) {
    const response = await db.agent.create({
      data: {
        name: values.name,
        activated: true,
        isWidget: true,
        prompt: values.prompt,
        type: "widget",
        voice_id: values.voice_id,
        first_message: values.first_message,
        userId: userResponse.data.id,
        language: values.language,
      },
    });

    if (!response) {
      return {
        status: 500,
        message: "Failed to save agent in data base. Retry in a moments.",
      };
    }

    return {
      status: 200,
      data: response,
      message: "Agente created succesfully.",
    };
  } else {
    const response = await db.agent.create({
      data: {
        name: values.name,
        activated: false,
        isWidget: false,
        prompt: values.prompt,
        type: values.type,
        voice_id: values.voice_id,
        first_message: values.first_message,
        userId: userResponse.data.id,
        language: values.language,
      },
    });

    if (!response) {
      return {
        status: 500,
        message: "Failed to save agent in data base. Retry in a moments.",
      };
    }

    return {
      status: 200,
      data: response,
      message: "Agente created succesfully.",
    };
  }
};

export const getAllInboundAgents = async () => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not found");
  }

  const response = await db.agent.findMany({
    where: {
      userId: user.data.id,
      type: "inbound",
    },
  });

  if (!response) {
    return {
      status: 404,
      message: "Not found agents",
    };
  }

  return {
    status: 200,
    data: response,
  };
};

export const getAllOutboundAgents = async () => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not found");
  }

  const response = await db.agent.findMany({
    where: {
      userId: user.data.id,
      type: "outbound",
    },
  });

  if (!response) {
    return {
      status: 404,
      message: "Not found agents",
    };
  }

  return {
    status: 200,
    data: response,
  };
};

export const getAllAgents = async () => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not found");
  }

  console.log('Dentro de la función de servidor')
  const response = await db.agent.findMany({
    where: {
      userId: user.data.id,
    },
  });

  if (!response) {
    return {
      status: 404,
      message: "Not found agents",
    };
  }

  return {
    status: 200,
    data: response,
  };
};

export const getWidgetAgents = async () => {
  const user = await onBoardUser();
  if (!user?.data?.id) {
    throw new Error("User not found");
  }

  const response = await db.agent.findMany({
    where: {
      userId: user.data.id,
      type: "widget",
    },
  });

  if (!response) {
    return {
      status: 404,
      message: "Not found agents",
    };
  }

  return {
    status: 200,
    data: response,
  };
};
export const updateAgentWithElevenLabs = async (
  agentId: string,
  elevenLabsId: string,
  knowledgeBaseId: string,
  phoneNumber: string
) => {
  try {
    console.log(`[updateAgentWithElevenLabs] Actualizando agente ID: ${agentId}`);
    console.log(`[updateAgentWithElevenLabs] Datos de actualización:`, {
      elevenLabsId,
      knowledgeBaseId,
      phoneNumber
    });

    const response = await db.agent.update({
      where: { id: agentId },
      data: {
        idElevenLabs: elevenLabsId,
        knowledgeBaseId: knowledgeBaseId,
        phoneNumber: phoneNumber,
        addedKnowledgeBase: true,
        activated: true,
      },
    });

    console.log(`[updateAgentWithElevenLabs] Respuesta de actualización:`, response);

    if (!response) {
      console.error(`[updateAgentWithElevenLabs] Error: No se pudo actualizar el agente`);
      return {
        status: 500,
        message: "Failed to update agent in database. Please try again.",
      };
    }

    return {
      status: 200,
      data: response,
      message: "Agent updated successfully.",
    };
  } catch (error: any) {
    console.error(`[updateAgentWithElevenLabs] Error:`, error);
    return {
      status: 500,
      message: error.message || "Failed to update agent.",
    };
  }
};

export const createPhoneNumberRecord = async (
  agentId: string,
  twilioAccountSid: string,
  twilioAuthToken: string,
  twilioPhoneNumber: string
) => {
  try {
    console.log(`[createPhoneNumberRecord] Creando registro de número para agente ID: ${agentId}`);
    console.log(`[createPhoneNumberRecord] Datos de Twilio:`, {
      twilioAccountSid,
      twilioPhoneNumber
    });

    const response = await db.agentPhoneNumber.create({
      data: {
        twilio_account_sid: twilioAccountSid,
        twilio_auth_token: twilioAuthToken,
        twilio_phone_number: twilioPhoneNumber,
        agentId: agentId,
      },
    });

    console.log(`[createPhoneNumberRecord] Registro creado:`, response);

    if (!response) {
      console.error(`[createPhoneNumberRecord] Error: No se pudo crear el registro`);
      return {
        status: 500,
        message: "Failed to create phone number record. Please try again.",
      };
    }

    return {
      status: 200,
      data: response,
      message: "Phone number record created successfully.",
    };
  } catch (error: any) {
    console.error(`[createPhoneNumberRecord] Error:`, error);
    return {
      status: 500,
      message: error.message || "Failed to create phone number record.",
    };
  }
};
