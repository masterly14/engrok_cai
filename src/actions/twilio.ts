'use server'

import { db } from '@/utils';
import { Twilio } from 'twilio';

interface TwilioCredentials {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

interface TwilioError extends Error {
  code?: number;
}

export async function verifyTwilioCredentials(credentials: TwilioCredentials) {
  try {
    const { accountSid, authToken, phoneNumber } = credentials;
    console.log(`[verifyTwilioCredentials] Verificando credenciales para número: ${phoneNumber}`);

    // Verificar que se hayan proporcionado todos los datos
    if (!accountSid || !authToken || !phoneNumber) {
      console.error(`[verifyTwilioCredentials] Error: Faltan credenciales requeridas`, {
        hasAccountSid: !!accountSid,
        hasAuthToken: !!authToken,
        hasPhoneNumber: !!phoneNumber
      });
      return { 
        success: false, 
        message: "Missing required Twilio credentials" 
      };
    }

    // Crear un cliente de Twilio con las credenciales proporcionadas
    const client = new Twilio(accountSid, authToken);
    console.log(`[verifyTwilioCredentials] Cliente Twilio creado`);

    const verifyExist = await db.agent.findUnique({
      where: {
        phoneNumber: phoneNumber
      }
    });
    console.log(`[verifyTwilioCredentials] Verificación de existencia en DB:`, verifyExist);

    try {
      console.log(`[verifyTwilioCredentials] Verificando cuenta Twilio...`);
      await client.api.accounts(accountSid).fetch();
      
      // Verificar si el número de teléfono pertenece a la cuenta
      console.log(`[verifyTwilioCredentials] Verificando número de teléfono...`);
      const incomingPhoneNumbers = await client.incomingPhoneNumbers.list({
        phoneNumber: phoneNumber
      });
      
      console.log(`[verifyTwilioCredentials] Números encontrados:`, incomingPhoneNumbers);

      // Si llegamos aquí, las credenciales son válidas
      console.log(`[verifyTwilioCredentials] Credenciales verificadas exitosamente`);
      return { 
        success: true, 
        message: "Twilio credentials verified successfully" 
      };
    } catch (twilioError) {
      console.error('[verifyTwilioCredentials] Error en API de Twilio:', twilioError);
      
      const error = twilioError as TwilioError;
      
      // Determinar el tipo de error para dar un mensaje más específico
      if (error.code === 20003) {
        console.error(`[verifyTwilioCredentials] Error de autenticación: Credenciales inválidas`);
        return { 
          success: false, 
          message: "Authentication failed: Invalid Account SID or Auth Token" 
        };
      } else if (error.code === 20404) {
        console.error(`[verifyTwilioCredentials] Error: Account SID no encontrado`);
        return { 
          success: false, 
          message: "The Account SID provided was not found" 
        };
      } else {
        console.error(`[verifyTwilioCredentials] Error de Twilio: ${error.message}`);
        return { 
          success: false, 
          message: `Twilio error: ${error.message}` 
        };
      }
    }
  } catch (error) {
    console.error(`[verifyTwilioCredentials] Error general:`, error);
    return {
      success: false,
      message: "An unexpected error occurred while verifying credentials"
    };
  }
}