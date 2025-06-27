"use server";

import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";
import { computeIncludedCredits } from "@/lib/planCredits";

interface VariantLS {
  id: string;
  attributes: {
    price: number; // cents
    name: string;
    product_id: number;
    product_name?: string;
    interval?: string; // month, year, etc.
    interval_count?: number;
  };
}

export async function syncPlansFromLemon() {
  let page = 1;
  const perPage = 100;
  let keepGoing = true;
  while (keepGoing) {
    const res = await lemonSqueezy.listVariants(page, perPage);
    const variants: VariantLS[] = res.data as any;
    if (!variants || variants.length === 0) {
      break;
    }

    for (const v of variants) {
      const priceUsd = v.attributes.price / 100;
      const credits = computeIncludedCredits(Number(v.id), priceUsd);

      // Filtrar por store si la API nos lo indica
      const storeIdAttr = (v.attributes as any).store_id as number | undefined;
      if (storeIdAttr && process.env.LEMON_SQUEEZY_STORE_ID && storeIdAttr !== Number(process.env.LEMON_SQUEEZY_STORE_ID)) {
        continue;
      }

      await db.plan.upsert({
        where: { variantId: Number(v.id) },
        update: {
          name: v.attributes.name,
          price: `${priceUsd}`,
          productId: v.attributes.product_id,
          productName: v.attributes.product_name ?? undefined,
          interval: v.attributes.interval ?? "month",
          intervalCount: v.attributes.interval_count ?? 1,
          creditsPerCycle: credits,
        },
        create: {
          variantId: Number(v.id),
          name: v.attributes.name,
          price: `${priceUsd}`,
          productId: v.attributes.product_id,
          productName: v.attributes.product_name ?? undefined,
          interval: v.attributes.interval ?? "month",
          intervalCount: v.attributes.interval_count ?? 1,
          creditsPerCycle: credits,
        },
      });
    }

    if (variants.length < perPage) {
      keepGoing = false;
    } else {
      page += 1;
    }
  }
} 