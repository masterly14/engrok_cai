"use server";

import { db } from "@/utils";
import { onCurrentUser } from "@/actions/user";
import { revalidatePath } from "next/cache";
import twilio from "twilio";
import { createPhoneNumber } from "../vapi/numbers";

const getTwilioClient = () => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured in environment variables.");
  }

  return twilio(accountSid, authToken);
};

export async function getAvailablePhoneNumbers(
  countryCode: "US" | "CO",
  page: number = 1,
  pageSize: number = 10
) {
  try {
    const client = getTwilioClient();

    
    const numbers = await client.availablePhoneNumbers(countryCode).local.list({
      voiceEnabled: true,
      limit: pageSize,
    });

    return numbers.map((number) => ({
      phoneNumber: number.phoneNumber,
      friendlyName: number.friendlyName,
      locality: number.locality,
      region: number.region,
    }));
  } catch (error: any) {
    console.error("Error fetching available phone numbers from Twilio:", error);
    throw new Error(`Failed to fetch numbers: ${error.message}`);
  }
}

export async function purchasePhoneNumber(phoneNumber: string) {
  const client = getTwilioClient();
  let purchasedNumberSid: string | null = null;

  try {
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
    });
    purchasedNumberSid = purchasedNumber.sid;

    const newDbNumber = await createPhoneNumber({
      provider: "twilio",
      number: purchasedNumber.phoneNumber,
      name: purchasedNumber.friendlyName,
      twilioAccountSid: process.env.TWILIO_ACCOUNT_SID!,
      twilioAuthToken: process.env.TWILIO_AUTH_TOKEN!,
    });

    revalidatePath("/application/phone-numbers");
    revalidatePath("/application/agents/voice-agents/numbers");
    return { success: true, data: newDbNumber };
  } catch (error: any) {
    if (purchasedNumberSid) {
      try {
        await client.incomingPhoneNumbers(purchasedNumberSid).remove();
        console.log(
          `Successfully released Twilio number SID: ${purchasedNumberSid} after failed registration.`
        );
      } catch (releaseError) {
        console.error(
          `CRITICAL: Failed to release Twilio number SID: ${purchasedNumberSid}. Please release manually.`,
          releaseError
        );
      }
    }
    console.error("Error purchasing and registering phone number:", error);
    return { success: false, error: error.message };
  }
}
  