"use server";

import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";
import { revalidatePath } from "next/cache";

export interface LedgerEntry {
  id: string;
  delta: number;
  type: string;
  meta: any;
  createdAt: Date;
}

export async function getCreditLedger(
  userId: string,
  take = 50,
  skip = 0,
): Promise<LedgerEntry[]> {
  const rows = await db.creditLedger.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    skip,
  });
  return rows;
}

// -------- Generate checkout for credit pack --------
export interface GenerateCreditCheckoutParams {
  userId: string;
  email: string;
  credits: number; // e.g. 1000
}

/**
 * Crea un enlace de pago (checkout) en Lemon Squeezy para packs de créditos one-off.
 * Hay un producto en LS con varias variantes (1000cr, 5000cr, etc.).
 * El mapping VARIANT_ID ↔ credits se mantiene en env var JSON: CREDIT_PACK_VARIANTS
 */
export async function generateCreditCheckout(
  params: GenerateCreditCheckoutParams,
) {
  const mappingRaw = process.env.CREDIT_PACK_VARIANTS;
  if (!mappingRaw) throw new Error("CREDIT_PACK_VARIANTS env var missing");
  const mapping: Record<number, number> = JSON.parse(mappingRaw);
  const variantId = Number(
    Object.keys(mapping).find((k) => mapping[Number(k)] === params.credits),
  );
  if (!variantId) throw new Error("No variant found for credits");

  const url = await lemonSqueezy.createCheckout({
    variantId,
    email: params.email,
    custom: { userId: params.userId },
    submitType: "pay",
    productOptions: {
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/thank-you`,
    },
  });

  return url;
}
