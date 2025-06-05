"use server";

import { VapiClient } from "@vapi-ai/server-sdk";
import { onBoardUser } from "../user";
import { db } from "@/utils";
import { v4 } from "uuid";


const vapi = new VapiClient({
  token: process.env.VAPI_API_KEY!,
});

interface CreatePhoneNumberParams {
  number: string;
  provider: "twilio" | "vonage" | "byo-phone-number" | "telnyx" | "vapi";
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  vonageApiKey?: string;
  assistantId?: string;
  workflowId?: string;
  squadId?: string;
  vonageApiSecret?: string;
  extension?: string;
  credentialId?: string;
  name?: string;
  numberDesiredAreaCode?: string;
  sipUri?: string;
  sipUsername?: string;
  sipPassword?: string;
}

export const createPhoneNumber = async (params: CreatePhoneNumberParams) => {
  const user = await onBoardUser();

  if (!user) {
    throw new Error("User not found");
  }


  let vapiResponse;
  // Create phone number in Vapi
  if (params.provider === "twilio") {
    vapiResponse = await vapi.phoneNumbers.create({
      name: params.name,
      provider: "twilio",
      twilioAccountSid: params.twilioAccountSid!,
      twilioAuthToken: params.twilioAuthToken,
      number: params.number,
    });
  } else if (params.provider === "byo-phone-number") {
    vapiResponse = await vapi.phoneNumbers.create({
      name: params.name,
      provider: "byo-phone-number",
      credentialId: params.credentialId!,
      number: params.number,
    });
  } else if (params.provider === "telnyx") {
    vapiResponse = await vapi.phoneNumbers.create({
      name: params.name,
      provider: "telnyx",
      credentialId: params.credentialId!,
      number: params.number,
    });
  } else if (params.provider === "vonage") {
    vapiResponse = await vapi.phoneNumbers.create({
      name: params.name,
      provider: "vonage",
      credentialId: params.credentialId!,
      number: params.number,
    });
  } else if (params.provider === "vapi") {
    vapiResponse = await vapi.phoneNumbers.create({
      name: params.name,
      provider: "vapi",
      numberDesiredAreaCode: params.numberDesiredAreaCode,
      sipUri: params.sipUri,
      authentication: {
        username: params.sipUsername!,
        password: params.sipPassword!,
      },
    });
  }

  const existing = await db.phoneNumber.findFirst({
    where: {
      number: params.number,
      userId: user.data.id,
    },
  });

  if (existing) {
    const error = new Error("Phone number already exists");
    // @ts-ignore
    error.status = 400;
    throw error;
  }

  // Save to database
  try {
    console.log(vapiResponse);
    const phoneNumber = await db.phoneNumber.create({
      data: {
        vapiId: vapiResponse?.id,
        name: params.name,
        provider: params.provider,
        number: params.number,
        sipUri: params.sipUri,
        sipUsername: params.sipUsername,
        sipPassword: params.sipPassword,
        twilioAccountId: params.twilioAccountSid,
        twilioAuthToken: params.twilioAuthToken,
        extension: params.extension,
        userId: user.data.id,
      },
    });

    return phoneNumber;
  } catch (dbError) {
    console.log(dbError);
    if (!existing) {
      if (vapiResponse?.id) {
        await vapi.phoneNumbers.delete(vapiResponse.id);
      }
    }

    throw new Error("Error saving phone number to database.");
  }
};

export const getAllPhoneNumbers = async () => {
  const user = await onBoardUser();

  if (!user) {
    return {
      error: "User not found",
    };
  }

  const numbers = await db.phoneNumber.findMany({
    where: {
      userId: user.data.id,
    },
  });

  return numbers;
};


export const updatePhoneNumber = async (params: CreatePhoneNumberParams) => {
  const user = await onBoardUser();

  console.log("Información que llega: ", params)



  if (!user) {
    throw new Error("User not found");
  }

  const phoneNumber = await db.phoneNumber.findFirst({
    where: {
      number: params.number,
      userId: user.data.id,
    },
  });

  if (!phoneNumber) {
    throw new Error("Phone number not found");
  }

  if (params.assistantId != null && params.assistantId !== "") {
    console.log("Actualizando assistantId, previamente era: ", params.assistantId)
    
    await vapi.phoneNumbers.update(phoneNumber.vapiId!, {
      assistantId: params.assistantId,
      workflowId: undefined,
      squadId: undefined,
    })

    const updatedPhoneNumber = await db.phoneNumber.update({
      where: {
        id: phoneNumber.id,
      },
      data: {
        assistantId: params.assistantId,
        workflowId: null,
        squadId: null,
      }
    })
    console.log("updatedPhoneNumber", updatedPhoneNumber)
  } else if (params.workflowId != null && params.workflowId !== "") {
    await vapi.phoneNumbers.update(phoneNumber.vapiId!, {
      workflowId: params.workflowId,
      assistantId: undefined,
      squadId: undefined,
    })
    await db.phoneNumber.update({
      where: {
        id: phoneNumber.id,
      },
      data: {
        workflowId: params.workflowId,
        assistantId: null,
        squadId: null,
      },
    })
  } else if (params.squadId != null && params.squadId !== "") {
    console.log("Actualizando squadId")
    
    const vapiId = await db.squad.findFirst({
      where: {
        id: params.squadId,
      },
      select: {
        vapiId: true,
      },
    })

    if (vapiId?.vapiId) {
      await vapi.phoneNumbers.update(phoneNumber.vapiId!, {
        squadId: vapiId.vapiId,
        assistantId: undefined,
        workflowId: undefined,
      })
    await db.phoneNumber.update({
      where: {
        id: phoneNumber.id,
      },
      data: {
          squadId: vapiId.vapiId,
          workflowId: null,
          assistantId: null,
        },
      })
    }
  } else {
    console.log("Actualizando a null")
    await vapi.phoneNumbers.update(phoneNumber.vapiId!, {
      assistantId: undefined,
      workflowId: undefined,
      squadId: undefined,
    })
    await db.phoneNumber.update({
      where: {
        id: phoneNumber.id,
      },
      data: {
        assistantId: null,
        workflowId: null,
        squadId: null,
      },
    })
  }
}
