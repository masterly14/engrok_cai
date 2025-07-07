"use server";
import { db } from "@/utils";
import { Nango } from "@nangohq/node";
import axios from "axios";

const nango = new Nango({ secretKey: process.env.NANGO_SECRET_KEY! });

const generateConnectSessionToken = async (
  userId: string,
  email: string,
  name: string | null
) => {
  const { data } = await nango.createConnectSession({
    end_user: {
      id: userId,
      email: email,
      display_name: name || undefined,
    },
    allowed_integrations: [
      "google-calendar",
      "facebook",
      "cal-com-v2",
      "google-sheet",
      "hubspot",
      "airtable",
    ],
  });

  await db.user.update({
    where: {
      clerkId: userId,
    },
    data: {
      nangoConnectSessionToken: data.token,
      nangoConnectSessionExpiresAt: data.expires_at,
    },
  });

  return {
    token: data.token,
    expires_at: data.expires_at,
  };
};

export const getSessionToken = async (userId: string) => {
  const user = await db.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      nangoConnectSessionToken: true,
      nangoConnectSessionExpiresAt: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  const expirationDate = user.nangoConnectSessionExpiresAt
    ? new Date(user.nangoConnectSessionExpiresAt)
    : null;

  if (expirationDate && expirationDate.getTime() > now.getTime() + bufferTime) {
    return user.nangoConnectSessionToken;
  } else {
    const { token } = await generateConnectSessionToken(
      userId,
      user.email,
      user.name
    );
    return {
      token,
    };
  }
};

export const createConnection = async ({
  integrationId,
  providerConfigKey,
  authMode,
  endUserId,
}: {
  integrationId: string;
  providerConfigKey: string;
  authMode: string;
  endUserId: string; // clerkId del usuario
}) => {
  // Buscamos el usuario interno por su clerkId para obtener el UUID
  const user = await db.user.findUnique({
    where: { clerkId: endUserId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("Usuario no encontrado al crear la conexión");
  }

  const connection = await db.connection.create({
    data: {
      connectionId: integrationId,
      providerConfigKey,
      authMode,
      endUserId, // seguimos guardando el clerkId para referencia
      userId: user.id, // UUID correcto
    },
  });

  return connection;
};

export const ConnectionExists = async (
  userId: string,
  providerConfigKey: string
) => {
  const user = await db.user.findUnique({
    where: {
      clerkId: userId,
    },
    select: {
      id: true,
    },
  });

  const connection = await db.connection.findFirst({
    where: {
      userId: user?.id,
      providerConfigKey: providerConfigKey,
    },
  });

  if (!connection) {
    return {
      connection: null,
      isConnected: false,
    };
  }

  return {
    connection: connection,
    isConnected: true,
  };
};

export const getAccessToken = async (connectionId: string, provider: string = "google-calendar") => {
  try {
    const token = await nango.getToken(provider, connectionId);
    console.log(token);
    return token.toString();
  } catch (error) {
    console.error(error);
    console.log(connectionId);
    throw new Error("Error getting access token");
  }
};

export const getGoogleCalendarCalendarsList = async (userId: string) => {
  const connection = await db.connection.findFirst({
    where: {
      userId: userId,
      providerConfigKey: "google-calendar",
    },
  });

  if (!connection) {
    throw new Error("Connection not found");
  }

  try {
    const accessToken = await getAccessToken(connection.connectionId, "google-calendar");
    const response = await axios.get(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    console.log(response.data);
    return response.data.items;
  } catch (error) {
    console.error(error);
    throw new Error("Error getting google calendar calendars list");
  }
};

export const createOrUpdateSync = async (params: {
  connectionId: string;
  providerConfigKey: string;
  syncName?: string;
  cron?: string; // e.g. "*/5 * * * *"
  webhookUrl: string;
}) => {
  console.log("createOrUpdateSync", params);
  const {
    connectionId,
    providerConfigKey,
    syncName = `${providerConfigKey}-sync`,
    cron = "*/5 * * * *",
    webhookUrl,
  } = params;

  const nangoBase = process.env.NANGO_API_BASE_URL || "https://api.nango.dev/v1";
  console.log("createOrUpdateSync payload", params);
  try {
    await axios.post(
      `${nangoBase}/sync/start`,
      {
        connection_id: connectionId,
        provider_config_key: providerConfigKey,
        syncs: [syncName],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.NANGO_SECRET_KEY!}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err: any) {
    // Si el sync ya está iniciado, Nango devuelve 400/409; lo ignoramos
    const status = err?.response?.status;
    if (status && (status === 400 || status === 409)) {
      console.warn("[Nango] Sync ya iniciado o duplicado", err.response?.data);
    } else {
      console.error("[Nango] startSync error", err.response?.data || err);
      throw err;
    }
  }
  return { syncName };
};
