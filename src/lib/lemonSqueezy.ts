import "server-only"

/*
 * Minimal Lemon Squeezy API wrapper focused on subscription flows.
 * Docs: https://docs.lemonsqueezy.com/api
 */

const BASE_URL = "https://api.lemonsqueezy.com/v1";

function assertEnv(name: string, value?: string): asserts value is string {
  if (!value) throw new Error(`Missing env var ${name}`);
}

assertEnv("LEMON_SQUEEZY_API_KEY", process.env.LEMON_SQUEEZY_API_KEY);

const API_KEY = process.env.LEMON_SQUEEZY_API_KEY!;

async function lsFetch<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${API_KEY}`,
      ...init.headers,
    },
    ...init,
    // Always revalidate: we don't want to cache admin calls.
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
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
    redirectUrl?: string;
    cancelUrl?: string;
  };
}

export async function createCheckout(params: CreateCheckoutParams) {
  const payload = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email: params.email,
          custom: params.custom ?? {},
          discount_code: null,
          billing_address: null,
        },
        checkout_options: params.checkoutOptions ?? {},
        expires_at: params.checkoutOptions?.expiresAt ?? null,
      },
      relationships: {
        variant: {
          data: { type: "variants", id: params.variantId.toString() },
        },
      },
    },
  };

  const result = await lsFetch<{ data: { attributes: { url: string } } }>(
    "/checkouts",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return result.data.attributes.url;
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

export const lemonSqueezy = {
  createCheckout,
  getSubscription,
  cancelSubscription,
}; 