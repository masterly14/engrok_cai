"use server";

import { db } from "@/utils";
import { onBoardUser } from "../user";
import { IntegrationProvider } from "@prisma/client";
import { OpenAIToolSet } from "composio-core";

export const validateIntegrationUser = async (provider: string) => {
  const user = await onBoardUser();

  if (!user) {
    throw new Error("User not found");
  }

  const integration = await db.integration.findFirst({
    where: {
      provider: provider as IntegrationProvider,
      userId: user?.data.id,
    },
  });

  if (!integration) {
    return {
      isConnected: false,
      userId: user?.data.id,
      provider: provider as IntegrationProvider,
    };
  }

  return {
    isConnected: true,
    userId: user?.data.id,
    provider: provider as IntegrationProvider,
  };
};

export const connectIntegrationAccount = async (
  provider: string,
  userId: string,
  workflowId: string,
  waitingRequest: boolean = false
) => {
  const toolset = new OpenAIToolSet({
    apiKey: process.env.COMPOSIO_API_KEY,
    baseUrl: "https://backend.composio.dev",
  });

  if (provider === "GOOGLE_CALENDAR") {
    const googleIntegrationId = "1ff936bb-1aa4-4a57-9934-6befd557d4f6";


    console.log(
      "Initiating Google Calendar integration. Waiting mode:",
      waitingRequest
    );

    const connectionRequest = await toolset.connectedAccounts.initiate({
      integrationId: googleIntegrationId,
      entityId: userId,
      redirectUri: `${process.env.NEXT_PUBLIC_BASE_URL}/application/agents/chat-agents/flows/${workflowId}/integrations/google-calendar`,
    });

    if (waitingRequest) {
      console.log("Waiting for connection to become active...");
      const activeConnection = await connectionRequest.waitUntilActive(180);
      console.log("Google Calendar integration active", activeConnection);

      const integration = await db.integration.create({
        data: {
          provider: "GOOGLE_CALENDAR",
          userId: userId,
          accessToken: activeConnection.id,
          status: activeConnection.status,
          metadata: activeConnection.meta
            ? JSON.parse(JSON.stringify(activeConnection.meta))
            : undefined,
        },
      });

      return {
        isConnected: !!integration,
        userId: userId,
        provider: "GOOGLE_CALENDAR",
      };
    }

    if (connectionRequest.redirectUrl) {
      console.log(
        "Redirecting to Google Calendar",
        connectionRequest.redirectUrl
      );
      return {
        redirectUrl: connectionRequest.redirectUrl,
      };
    }

    console.error(
      "Could not get a redirectUrl from Composio and not in waiting mode."
    );
    return {
      isConnected: false,
      userId: userId,
      provider: "GOOGLE_CALENDAR",
    };
  }

  return { isConnected: false, userId, provider };
};


export const validateWompiIntegrationUser = async () => {
    const user = await onBoardUser();

    if (!user) {
        throw new Error("User not found");
    }

    const wompiIntegration = await db.wompiIntegration.findUnique({
      where: {
        userId: user?.data?.id
      }
    })

    if (!wompiIntegration) {
      return {
        isConnected: false,
        userId: user?.data?.id,
        provider: "WOMPI",
      };
    }

    return {
      isConnected: true,
      userId: user?.data?.id,
      provider: "WOMPI",
    }
}

export const validateAndSaveWompiCredentials = async (
  publicKey: string,
  privateKey: string,
  eventsSecret: string
) => {
  "use server";

  const user = await onBoardUser();
  if (!user) {
    throw new Error("User not found");
  }

  const isTest = publicKey.startsWith("pub_test_");
  const baseUrl = isTest
    ? "https://sandbox.wompi.co"
    : "https://production.wompi.co";

  const endpoint = `${baseUrl}/v1/merchants/${publicKey}`;

  const response = await fetch(endpoint, {
    method: "GET",
  });
  console.log(response);
  if (!response.ok) {
    if (response.status === 401) {
      return {
        success: false,
        error: "Credenciales inválidas. Verifica tu Llave Pública y Llave Privada de Wompi.",
      } as const;
    }

    const errorJson = await response.json().catch(() => undefined);
    return {
      success: false,
      error: errorJson?.error?.message ?? "Error al validar las credenciales con Wompi.",
    } as const;
  }

  // Paso 2: guardar o actualizar la integración en la base de datos
  await db.wompiIntegration.upsert({
    where: { userId: user.data.id },
    update: {
      publicKey,
      privateKey,
      eventsSecret,
    },
    create: {
      userId: user.data.id,
      publicKey,
      privateKey,
      eventsSecret,
      wompiAccessToken: "",
    },
  });

  return {
    success: true,
  } as const;
};

export const generateWompiPaymentLink = async ({
  name,
  description,
  amountInCents,
  currency,
  redirectUrl,
  sku,
  expiresAt,
  collectShipping = false,
  customerReferences,
}: {
  name: string;
  description: string;
  amountInCents: number;
  currency: string;
  redirectUrl: string;
  sku?: string;
  expiresAt?: number;
  collectShipping?: boolean;
  customerReferences?: { label: string; is_required?: boolean }[];
}) => {
  "use server";

  const user = await onBoardUser();
  if (!user) {
    throw new Error("User not found");
  }

  // Obtener las credenciales almacenadas de Wompi
  const wompiIntegration = await db.wompiIntegration.findUnique({
    where: { userId: user.data.id },
  });

  if (!wompiIntegration) {
    return {
      success: false,
      error: "Debes conectar tu cuenta de Wompi antes de generar un link.",
    } as const;
  }

  const { publicKey, privateKey } = wompiIntegration;

  const isTest = publicKey.startsWith("pub_test_");
  const baseUrl = isTest ? "https://sandbox.wompi.co" : "https://production.wompi.co";

  const payload: Record<string, any> = {
    name,
    description,
    amount_in_cents: amountInCents,
    currency,
    redirect_url: redirectUrl,
    single_use: true,
    collect_shipping: collectShipping,
  };

  if (sku) payload.sku = sku;
  if (expiresAt) payload.expires_at = expiresAt;
  if (customerReferences && customerReferences.length > 0) {
    payload.customer_data = { customer_references: customerReferences };
  }

  const response = await fetch(`${baseUrl}/v1/payment_links`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${privateKey}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data?.message ?? "Error al crear el link de pago con Wompi.",
    } as const;
  }

  return {
    success: true,
    data,
  } as const;
};