import "server-only"

/*
 * Minimal Lemon Squeezy API wrapper focused on subscription flows.
 * Docs: https://docs.lemonsqueezy.com/api
 */

const BASE_URL = "https://api.lemonsqueezy.com/v1";

function assertEnv(name: string, value?: string): asserts value is string {
  if (!value) {
    console.error(`[LS] Missing env var ${name}`);
    throw new Error(`Missing env var ${name}`);
  }
  console.debug(`[LS] Env var ${name} is available`);
  // Log el valor (ocultando parte por seguridad)
  if (name === "LEMON_SQUEEZY_API_KEY") {
    const maskedValue = value.length > 8 ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}` : "***";
    console.debug(`[LS] API Key value: ${maskedValue} (length: ${value.length})`);
    
    // Detectar si es test o live mode
    if (value.startsWith('test_')) {
      console.debug(`[LS] API Key is in TEST mode`);
    } else if (value.startsWith('live_')) {
      console.debug(`[LS] API Key is in LIVE mode`);
    } else {
      console.warn(`[LS] API Key format not recognized - should start with 'test_' or 'live_'`);
    }
  }
  
  if (name === "LEMON_SQUEEZY_STORE_ID") {
    console.debug(`[LS] Store ID: ${value}`);
  }
}

assertEnv("LEMON_SQUEEZY_API_KEY", process.env.LEMON_SQUEEZY_API_KEY);
assertEnv("LEMON_SQUEEZY_STORE_ID", process.env.LEMON_SQUEEZY_STORE_ID);

const API_KEY = process.env.LEMON_SQUEEZY_API_KEY!.trim();
const STORE_ID = process.env.LEMON_SQUEEZY_STORE_ID!;

async function lsFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  // Log básico de la petición
  try {
    console.debug("[LS] Request", endpoint, init.method ?? "GET");
    if (init.body) {
      console.debug("[LS] Body", init.body);
    }
    // Verificar que la API key esté disponible
    if (!API_KEY) {
      console.error("[LS] API_KEY is not available");
    } else {
      // Log el header Authorization (ocultando parte por seguridad)
      const authHeader = `Bearer ${API_KEY}`;
      const maskedAuth = authHeader.length > 20 ? `${authHeader.substring(0, 15)}...${authHeader.substring(authHeader.length - 5)}` : "***";
      console.debug(`[LS] Authorization header: ${maskedAuth} (length: ${authHeader.length})`);
    }
  } catch {
    // ignore log errors
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...init,
    method: init.method || "GET",
    headers: {
      ...init.headers,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
    },
    // Always revalidate: we don't want to cache admin calls.
    cache: "no-store",
  });

  // Log los headers finales para debug
  try {
    const finalHeaders = {
      ...init.headers,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
    };
    console.debug("[LS] Final headers:", Object.keys(finalHeaders));
  } catch {
    // ignore log errors
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("[LS] API Error Response:", text);
    throw new Error(`Lemon Squeezy API error (${res.status}): ${text}`);
  }

  return res.json();
}

// ---------- High-level helpers ----------

export interface CreateCheckoutParams {
  variantId: number;
  email: string; // Customer email
  custom?: Record<string, unknown>; // optional custom metadata
  submitType?: "pay" | "subscribe";
  checkoutOptions?: {
    expiresAt?: string;
    cancelUrl?: string; // NB: pertenece a productOptions en la API, mantenido por compat
  };

  /**
   * Opciones que realmente pertenecen a `product_options` en la API.
   * Ej: redirect_url tras la compra o textos del recibo.
   */
  productOptions?: {
    redirectUrl?: string;
    receiptButtonText?: string;
    receiptLinkUrl?: string;
    receiptThankYouNote?: string;
  };
}

export async function createCheckout(params: CreateCheckoutParams) {
  // Desglosamos opcionalmente checkoutOptions
  const { checkoutOptions = {} } = params;
  // Extraemos expiresAt (se envía aparte)
  const { expiresAt, ...restOptions } = checkoutOptions as any;

  // Map camelCase → snake_case únicamente para las keys con valor definido
  const checkoutOptionsSnake: Record<string, unknown> = {};
  Object.entries(restOptions).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
      checkoutOptionsSnake[snakeKey] = value;
    }
  });

  const attributes: Record<string, any> = {
    checkout_data: {
      email: params.email,
      custom: params.custom ?? {},
    },
    expires_at: expiresAt ?? null,
  };

  // Solo incluimos checkout_options si contiene algo útil
  if (Object.keys(checkoutOptionsSnake).length > 0) {
    attributes.checkout_options = checkoutOptionsSnake;
  }

  // ---------- product_options ----------
  if (params.productOptions) {
    const productOptionsSnake: Record<string, unknown> = {};
    Object.entries(params.productOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const snakeKey = key.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
        productOptionsSnake[snakeKey] = value;
      }
    });

    if (Object.keys(productOptionsSnake).length > 0) {
      attributes.product_options = productOptionsSnake;
    }
  }

  const payload = {
    data: {
      type: "checkouts",
      attributes,
      relationships: {
        store: {
          data: {
            type: "stores",
            id: STORE_ID.toString(),
          },
        },
        variant: {
          data: { type: "variants", id: params.variantId.toString() },
        },
      },
    },
  };

  // -------- DEBUG --------
  if (process.env.NODE_ENV !== "production") {
    console.debug("[LS] createCheckout payload", JSON.stringify(payload, null, 2));
  }

  // Verificar modo y compatibilidad
  const isTestMode = API_KEY.startsWith('test_');
  const isLiveMode = API_KEY.startsWith('live_');
  console.debug(`[LS] Creating checkout in ${isTestMode ? 'TEST' : isLiveMode ? 'LIVE' : 'UNKNOWN'} mode`);
  console.debug(`[LS] Store ID: ${STORE_ID}, Variant ID: ${params.variantId}`);

  try {
    const result = await lsFetch<{ data: { attributes: { url: string } } }>(
      "/checkouts",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    return result.data.attributes.url;
  } catch (error) {
    console.error("[LS] createCheckout error", error);
    throw error;
  }
}

export type LemonSubscriptionStatus =
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "trialing";

export async function getSubscription(lsSubscriptionId: number) {
  return await lsFetch(`/subscriptions/${lsSubscriptionId}`);
}

export async function cancelSubscription(lsSubscriptionId: number) {
  return await lsFetch(`/subscriptions/${lsSubscriptionId}`, {
    method: "PATCH",
    body: JSON.stringify({
      data: {
        type: "subscriptions",
        id: lsSubscriptionId.toString(),
        attributes: { cancelled: true },
      },
    }),
  });
}

export async function getVariant(variantId: number) {
  return await lsFetch(`/variants/${variantId}`);
}

export const lemonSqueezy = {
  createCheckout,
  getSubscription,
  cancelSubscription,
  getVariant,

  /**
   * Lista variantes del store.
   * Lemon Squeezy aún no soporta filtro por store en /variants, así que
   * simplemente paginamos todas y filtramos en código cuando sea necesario.
   */
  async listVariants(page = 1, perPage = 100) {
    const endpoint = `/variants?page[number]=${page}&page[size]=${perPage}`;
    return await lsFetch<{ data: any[] }>(endpoint);
  },
}; 