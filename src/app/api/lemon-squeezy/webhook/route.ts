import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezyWebhook";
import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";
import { CreditService } from "@/services/credit-service";
import { computeIncludedCredits } from "@/lib/planCredits";


// Disable Next.js default body parsing for raw body access.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature");

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Immediately respond 200 to acknowledge receipt.
  // Process asynchronously to avoid timeouts.
  handleEvent(payload).catch((err) => {
    console.error("Error processing Lemon Squeezy webhook", err);
  });

  return NextResponse.json({ received: true });
}

async function handleEvent(payload: any) {
  const type: string = payload.meta?.event_name ?? "";
  switch (type) {
    case "subscription_created":
      await upsertSubscription(payload);
      await syncInternalPlanAndSubscription(payload, /* isNew */ true);
      break;
    case "subscription_updated":
      await upsertSubscription(payload);
      await syncInternalPlanAndSubscription(payload);
      break;
    case "subscription_cancelled":
      await upsertSubscription(payload);
      await markSubscriptionCancelled(payload);
      break;
    case "subscription_payment_success":
    case "invoice_payment_succeeded":
      // Renueva créditos en cada pago exitoso
      await creditOnSuccessfulPayment(payload);
      break;
    case "order_created":
      await processCreditPackOrder(payload);
      break;
    default:
      console.info("Unhandled LS event", type);
  }
}

async function upsertSubscription(payload: any) {
  const sub = payload.data;
  const userId = await resolveUserByEmail(sub.attributes.user_email);
  if (!userId) {
    console.warn("User not found for LS subscription", sub.id);
    return;
  }

  const attributes = sub.attributes;
  const firstOrderItem = attributes.first_order_item;
  const planVariantId = firstOrderItem?.variant_id ?? attributes.variant_id;

  if (!planVariantId) {
    console.error("Webhook: Could not determine variantId. Cannot upsert subscription.");
    return;
  }

  // Declare shared variables so they are available outside conditional blocks
  let price: number | undefined = firstOrderItem?.price; // price is expressed in cents by LS
  let variantName: string = firstOrderItem?.variant_name ?? attributes.variant_name ?? `Variant ${planVariantId}`;
  let productId: number | undefined = firstOrderItem?.product_id ?? attributes.product_id;
  const storeId = attributes.store_id;

  let lsPlan = await db.lsPlan.findUnique({ where: { variantId: planVariantId } });

  // Si el plan no existe, debemos crearlo.
  // Esto puede suceder si el webhook `subscription_created` se omitió por alguna razón.
  if (!lsPlan) {
    console.log(`LsPlan with variantId ${planVariantId} not found. Creating it...`);

    // Si no tenemos precio todavía, lo consultamos vía API
    if (price === undefined) {
      try {
        console.log(`Price not in webhook payload for variant ${planVariantId}. Fetching from API...`);
        const variantData: any = await lemonSqueezy.getVariant(planVariantId);
        price = variantData.data.attributes.price;
      } catch (error) {
        console.error(`Error fetching variant ${planVariantId} from Lemon Squeezy API:`, error);
        return;
      }
    }

    if (price === undefined) {
      console.error(`Could not determine price for variant ${planVariantId}. Cannot create plan.`);
      return;
    }

    if (productId === undefined) {
      console.error("Cannot create plan without productId");
      return;
    }

    lsPlan = await db.lsPlan.create({
      data: {
        variantId: planVariantId,
        productId: Number(productId),
        storeId: storeId,
        name: variantName,
        price: price,
      },
    });

    console.log(`Created new lsPlan "${variantName}" (ID: ${lsPlan.id}) from webhook.`);
  } else {
    // Cuando el plan ya existe, usamos su información como fallback
    price = price ?? lsPlan.price;
    productId = productId ?? lsPlan.productId;
    variantName = variantName ?? lsPlan.name;
  }

  // ---------------- Plan de negocio interno ----------------
  const priceUsd = (price ?? 0) / 100;
  const creditsPerCycleCalc = computeIncludedCredits(planVariantId, priceUsd);

  let plan = await db.plan.findUnique({ where: { variantId: planVariantId } });
  if (!plan) {
    plan = await db.plan.create({
      data: {
        name: variantName,
        price: String(priceUsd),
        interval: attributes.interval ?? "month",
        productId: Number(productId),
        variantId: planVariantId,
        creditsPerCycle: creditsPerCycleCalc,
      },
    });
  } else if (plan.creditsPerCycle !== creditsPerCycleCalc) {
    await db.plan.update({ where: { id: plan.id }, data: { creditsPerCycle: creditsPerCycleCalc } });
    plan = await db.plan.findUnique({ where: { id: plan.id } });
  }

  if (!plan) {
    console.error("Failed to create or fetch internal Plan");
    return;
  }

  console.log("lsPlan", lsPlan.id, "bizPlan", plan.id);

  const subscription = await db.lsSubscription.upsert({
    where: { lsSubscriptionId: Number(sub.id) },
    update: {
      status: mapStatus(sub.attributes.status_formatted),
      renewsAt: sub.attributes.renews_at ? new Date(sub.attributes.renews_at) : null,
      endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
      trialEndsAt: sub.attributes.trial_ends_at ? new Date(sub.attributes.trial_ends_at) : null,
      planId: lsPlan.id,
      isPaused: sub.attributes.is_paused,
    },
    create: {
      lsSubscriptionId: Number(sub.id),
      userId,
      status: mapStatus(sub.attributes.status_formatted),
      renewsAt: sub.attributes.renews_at ? new Date(sub.attributes.renews_at) : null,
      endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
      trialEndsAt: sub.attributes.trial_ends_at ? new Date(sub.attributes.trial_ends_at) : null,
      planId: lsPlan.id,
      isPaused: sub.attributes.is_paused,
    },
  });

  console.log("subscription", subscription);
  // Sincronizaremos créditos en la fase `syncInternalPlanAndSubscription`, donde ya existe la suscripción interna.
  const user = await db.user.findUnique({ where: { id: userId } });
  if (user && user.initialAmountCredits === 0) {
    await db.user.update({ where: { id: userId }, data: { initialAmountCredits: plan.creditsPerCycle } });
  }
}

function mapStatus(statusFormatted: string) {
  switch (statusFormatted.toLowerCase()) {
    case "active":
      return "ACTIVE";
    case "paused":
      return "PAUSED";
    case "cancelled":
      return "CANCELLED";
    case "expired":
      return "EXPIRED";
    case "trial":
    case "trialing":
      return "TRIALING";
    default:
      return "ACTIVE";
  }
}

async function resolveUserByEmail(email: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email } });
  return user?.id ?? null;
}

/**
 * Sincroniza las tablas Plan y Subscription (internas) con la información de Lemon Squeezy.
 * Si `isNew` es `true`, otorga los créditos iniciales del ciclo.
 */
async function syncInternalPlanAndSubscription(payload: any, isNew: boolean = false) {
  const sub = payload.data;
  const attributes = sub.attributes as any;

  const userId = await resolveUserByEmail(attributes.user_email);
  if (!userId) return;

  // 1) Plan (mapeado por variantId)
  const variantId = attributes.variant_id ?? attributes.first_order_item?.variant_id;
  if (!variantId) return;

  // Price is in cents according to LemonSqueezy docs
  const priceCents: number | undefined = attributes.first_order_item?.price ?? attributes.variants?.[0]?.price ?? attributes.price;
  const priceUsd = priceCents ? priceCents / 100 : 0;

  const productId = attributes.product_id ?? attributes.first_order_item?.product_id;

  // Aproximamos créditos incluidos: precioUSD * 100 (1 cr = 0.01 USD coste)
  const approxCredits = computeIncludedCredits(variantId, priceUsd);

  // ----- Internal Plan (biz) -----
  let plan = await db.plan.findUnique({ where: { variantId } });
  if (!plan) {
    if (productId === undefined) return; // cannot create plan without productId

    plan = await db.plan.create({
      data: {
        variantId,
        productId: Number(productId),
        name: attributes.variant_name ?? `Plan ${variantId}`,
        price: `${priceUsd}`,
        interval: attributes.interval ?? "month",
        creditsPerCycle: approxCredits,
      },
    });
  } else if (plan.creditsPerCycle !== approxCredits && approxCredits > 0) {
    await db.plan.update({
      where: { id: plan.id },
      data: { creditsPerCycle: approxCredits },
    });
    plan = await db.plan.findUnique({ where: { id: plan.id } });
  }

  if (!plan) return; // safety

  // 2) Subscription (interna)
  const cycleEnd = attributes.renews_at ? new Date(attributes.renews_at) : null;

  let subscription = await db.subscription.findFirst({
    where: { lemonSqueezyId: sub.id.toString() },
  });

  if (!subscription) {
    subscription = await db.subscription.create({
      data: {
        planId: plan.id,
        status: mapStatus(attributes.status_formatted),
        userId,
        lemonSqueezyId: sub.id.toString(),
        email: attributes.user_email,
        endsAt: attributes.ends_at,
        name: attributes.variant_name,
        orderId: attributes.order_id ?? 0,
        price: `${priceUsd}`,
        renewsAt: attributes.renews_at,
        statusFormatted: attributes.status_formatted,
        subscriptionItemId: attributes.first_subscription_item?.subscription_item_id ?? undefined,
        trialEndsAt: attributes.trial_ends_at,
        cycleEndAt: cycleEnd,
      },
    });

    // Otorgar créditos iniciales
    if (plan.creditsPerCycle > 0) {
      await CreditService.credit(userId, plan.creditsPerCycle, {
        reason: "subscription_created",
        subId: subscription.id,
      });
    }
  } else {
    // Update existing subscription
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: mapStatus(attributes.status_formatted),
        endsAt: attributes.ends_at,
        renewsAt: attributes.renews_at,
        cycleEndAt: cycleEnd,
        isPaused: attributes.is_paused,
      },
    });
  }
}

async function markSubscriptionCancelled(payload: any) {
  const sub = payload.data;
  const attributes = sub.attributes as any;
  const internal = await db.subscription.findFirst({ where: { lemonSqueezyId: sub.id.toString() } });
  if (internal) {
    await db.subscription.update({
      where: { id: internal.id },
      data: { status: "CANCELLED" },
    });
  }
}

async function creditOnSuccessfulPayment(payload: any) {
  const sub = payload.data;
  const attributes = sub.attributes as any;
  const internal = await db.subscription.findFirst({ where: { lemonSqueezyId: sub.id.toString() }, include: { plan: true } });
  if (!internal || !internal.plan) return;

  // Reponer créditos según plan
  if (internal.plan.creditsPerCycle > 0) {
    await CreditService.credit(internal.userId, internal.plan.creditsPerCycle, {
      reason: "cycle_payment",
      subId: internal.id,
    });
    // Ajustar currentCredits y ciclo
    const nextCycle = attributes.renews_at ? new Date(attributes.renews_at) : undefined;
    await db.subscription.update({
      where: { id: internal.id },
      data: {
        cycleEndAt: nextCycle,
      },
    });
  }
}

// ---------------- Credit Pack processing ----------------
const CREDIT_PACKS: Record<number, number> = (() => {
  try {
    const raw = process.env.CREDIT_PACK_VARIANTS; // JSON {"variantId":credits}
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
})();

async function processCreditPackOrder(payload: any) {
  const order = payload.data;
  const attributes = order.attributes as any;
  const variantId = attributes.first_order_item?.variant_id;
  if (!variantId) return;

  const credits = CREDIT_PACKS[variantId];
  if (!credits) return; // not a credit pack

  const email = attributes.user_email;
  const userId = await resolveUserByEmail(email);
  if (!userId) return;

  await CreditService.credit(userId, credits, {
    reason: "credit_pack_purchase",
    orderId: order.id,
    variantId,
  });

  // Opcional: registrar en UsageEvent? no necesario
} 