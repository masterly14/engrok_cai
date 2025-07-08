"use server";

import { VapiClient } from "@vapi-ai/server-sdk";
import { onBoardUser } from "../user";
import { db } from "@/utils";

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

export const updatePhoneNumber = async (params: any) => {
  try {
    const user = await onBoardUser();
    if (!user || !user.data.id) {
      throw new Error("User not authenticated");
    }

    const { number, assistantId, workflowId, name } = params;

    const phoneNumber = await db.phoneNumber.findFirst({
      where: { number: number, userId: user.data.id },
    });

    if (!phoneNumber || !phoneNumber.vapiId) {
      throw new Error("Phone number not found or not registered with Vapi.");
    }

    const vapiPayload: {
      assistantId?: string;
      workflowId?: string;
      name?: string;
    } = {
      name: name,
    };
    let localPayload: {
      assistantId?: string | null;
      workflowId?: string | null;
      name?: string;
    } = {
      name: name,
    };

    if (workflowId) {
      const workflow = await db.workflow.findUnique({
        where: { id: workflowId, userId: user.data.id },
      });
      if (!workflow || !workflow.vapiWorkflowId) {
        throw new Error("Workflow not found or has no Vapi ID.");
      }
      vapiPayload.workflowId = workflow.vapiWorkflowId;
      localPayload.workflowId = workflow.id;
      localPayload.assistantId = null;
    } else if (assistantId) {
      const agent = await db.agent.findUnique({
        where: { id: assistantId, userId: user.data.id },
      });
      if (!agent || !agent.vapiId) {
        throw new Error("Agent not found or has no Vapi ID.");
      }
      vapiPayload.assistantId = agent.vapiId;
      localPayload.assistantId = agent.id;
      localPayload.workflowId = null;
    }

    const response = await fetch(
      `https://api.vapi.ai/phone-number/${phoneNumber.vapiId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
        },
        body: JSON.stringify(vapiPayload),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Vapi API error:", errorData);
      throw new Error(
        errorData.message || "Failed to update phone number in Vapi.",
      );
    }

    const updatedPhoneNumberInVapi = await response.json();

    const updatedPhoneNumber = await db.phoneNumber.update({
      where: { id: phoneNumber.id },
      data: localPayload,
    });

    return updatedPhoneNumber;
  } catch (error: any) {
    console.error("Error updating phone number:", error);
    throw new Error(error.message || "An unknown error occurred.");
  }
};
