"use server";

import { db } from "@/utils";
import { onCurrentUser } from "@/actions/user";
import { revalidatePath } from "next/cache";
import twilio from "twilio";

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
    // La librería de Twilio usa paginación basada en `pageToken` internamente,
    // pero el helper `list` nos abstrae esto y podemos pedir un tamaño de página.
    // Para simular páginas, podríamos usar `limit` y un `areaCode` si quisiéramos ser más granulares,
    // pero para este caso, buscaremos de forma general y mostraremos los resultados.
    // La API de `availablePhoneNumbers` no soporta un `offset` o `page` directo.
    // Por simplicidad, obtendremos una lista y la manejaremos en el cliente, 
    // o podríamos implementar una lógica de "Cargar más".
    
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
  const user = await onCurrentUser();
  if (!user) {
    throw new Error("User not authenticated.");
  }
  
  const internalUser = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!internalUser) {
    throw new Error("Internal user not found.");
  }

  const client = getTwilioClient();

  try {
    const purchasedNumber = await client.incomingPhoneNumbers.create({
      phoneNumber,
      // Se puede configurar una URL por defecto para manejar las llamadas
      voiceUrl: 'https://demo.twilio.com/docs/voice.xml',
    });

    const newDbNumber = await db.phoneNumber.create({
      data: {
        number: purchasedNumber.phoneNumber,
        provider: "twilio",
        userId: internalUser.id,
        name: phoneNumber,
        vapiId: purchasedNumber.sid, // Guardamos el SID de Twilio
        twilioAccountId: process.env.TWILIO_ACCOUNT_SID,
      },
    });

    revalidatePath("/application/phone-numbers");
    revalidatePath("/application/agents/voice-agents/numbers");
    return { success: true, data: newDbNumber };
  } catch (error: any) {
    console.error("Error purchasing phone number:", error);
    return { success: false, error: error.message };
  }
}
