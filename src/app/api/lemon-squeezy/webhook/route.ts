import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezyWebhook";
import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";
import { CreditService } from "@/services/credit-service";
import { computeIncludedCredits } from "@/lib/planCredits";
import { LsSubscriptionStatus } from "@prisma/client";

// Disable Next.js default body parsing for raw body access.
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: Request) {
  console.log("[LS Webhook] Received request");
  const rawBody = await req.text();
  const signature = req.headers.get("X-Signature");
  console.log(`[LS Webhook] Signature: ${signature}`);

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    console.error("[LS Webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  console.log("[LS Webhook] Signature verified successfully");

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
    console.log(
      "[LS Webhook] Parsed payload:",
      JSON.stringify(payload, null, 2),
    );
  } catch (err) {
    console.error("[LS Webhook] Invalid JSON in payload");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Immediately respond 200 to acknowledge receipt.
  // Process asynchronously to avoid timeouts.
  console.log(
    `[LS Webhook] Acknowledging receipt and starting async processing for event: ${payload.meta?.event_name}`,
  );
  handleEvent(payload).catch((err) => {
    console.error("Error processing Lemon Squeezy webhook", err);
  });

  return NextResponse.json({ received: true });
}

async function handleEvent(payload: any) {
  const type: string = payload.meta?.event_name ?? "";
  console.log(`[LS Webhook] Handling event: ${type}`);
  switch (type) {
    case "subscription_created":
      console.log(
        "[LS Webhook] Event: subscription_created. Payload:",
        JSON.stringify(payload.data.attributes, null, 2),
      );
      await upsertSubscription(payload);
      await syncInternalPlanAndSubscription(payload, /* isNew */ true);
      break;
    case "subscription_updated":
      console.log(
        "[LS Webhook] Event: subscription_updated. Payload:",
        JSON.stringify(payload.data.attributes, null, 2),
      );
      await upsertSubscription(payload);
      await syncInternalPlanAndSubscription(payload);
      break;
    case "subscription_cancelled":
      console.log(
        "[LS Webhook] Event: subscription_cancelled. Payload:",
        JSON.stringify(payload.data.attributes, null, 2),
      );
      await upsertSubscription(payload);
      await markSubscriptionCancelled(payload);
      break;
    case "subscription_payment_success":
    case "invoice_payment_succeeded":
      console.log(
        `[LS Webhook] Event: ${type}. Payload:`,
        JSON.stringify(payload.data.attributes, null, 2),
      );
      // Aseguramos existencia de Plan & Subscription interna antes de acreditar
      await syncInternalPlanAndSubscription(payload);
      // Renueva créditos en cada pago exitoso
      await creditOnSuccessfulPayment(payload);
      break;
    case "order_created":
      console.log(
        "[LS Webhook] Event: order_created. Payload:",
        JSON.stringify(payload.data.attributes, null, 2),
      );
      await processCreditPackOrder(payload);
      break;
    default:
      console.info("Unhandled LS event", type);
  }
}

async function upsertSubscription(payload: any) {
  console.log("[LS Webhook] upsertSubscription: Starting...");
  const sub = payload.data;
  const userId = await resolveUserId(payload);
  if (!userId) {
    console.warn(
      "[LS Webhook] upsertSubscription: User not found for LS subscription",
      sub.id,
    );
    return;
  }
  console.log(`[LS Webhook] upsertSubscription: Resolved userId: ${userId}`);

  const attributes = sub.attributes;
  const firstOrderItem = attributes.first_order_item;
  const planVariantId = firstOrderItem?.variant_id ?? attributes.variant_id;

  if (!planVariantId) {
    console.error(
      "[LS Webhook] upsertSubscription: Could not determine variantId. Cannot upsert subscription.",
    );
    return;
  }
  console.log(
    `[LS Webhook] upsertSubscription: Determined variantId: ${planVariantId}`,
  );

  // Declare shared variables so they are available outside conditional blocks
  let price: number | undefined = firstOrderItem?.price; // price is expressed in cents by LS
  let variantName: string =
    firstOrderItem?.variant_name ??
    attributes.variant_name ??
    `Variant ${planVariantId}`;
  let productId: number | undefined =
    firstOrderItem?.product_id ?? attributes.product_id;
  const storeId = attributes.store_id;
  console.log(
    `[LS Webhook] upsertSubscription: Initial plan details - Price: ${price}, Variant Name: ${variantName}, Product ID: ${productId}`,
  );

  let lsPlan = await db.lsPlan.findUnique({
    where: { variantId: planVariantId },
  });

  // Si el plan no existe, debemos crearlo.
  // Esto puede suceder si el webhook `subscription_created` se omitió por alguna razón.
  if (!lsPlan) {
    console.log(
      `[LS Webhook] upsertSubscription: LsPlan with variantId ${planVariantId} not found. Creating it...`,
    );

    // Si no tenemos precio todavía, lo consultamos vía API
    if (price === undefined) {
      try {
        console.log(
          `[LS Webhook] upsertSubscription: Price not in webhook payload for variant ${planVariantId}. Fetching from API...`,
        );
        const variantData: any = await lemonSqueezy.getVariant(planVariantId);
        price = variantData.data.attributes.price;
        console.log(
          `[LS Webhook] upsertSubscription: Fetched price from API: ${price}`,
        );
      } catch (error) {
        console.error(
          `[LS Webhook] upsertSubscription: Error fetching variant ${planVariantId} from Lemon Squeezy API:`,
          error,
        );
        return;
      }
    }

    if (price === undefined) {
      console.error(
        `[LS Webhook] upsertSubscription: Could not determine price for variant ${planVariantId}. Cannot create plan.`,
      );
      return;
    }

    if (productId === undefined) {
      console.error(
        "[LS Webhook] upsertSubscription: Cannot create plan without productId",
      );
      return;
    }

    console.log(
      `[LS Webhook] upsertSubscription: Creating new lsPlan with data:`,
      {
        variantId: planVariantId,
        productId: Number(productId),
        storeId: storeId,
        name: variantName,
        price: price,
      },
    );
    lsPlan = await db.lsPlan.create({
      data: {
        variantId: planVariantId,
        productId: Number(productId),
        storeId: storeId,
        name: variantName,
        price: price,
      },
    });

    console.log(
      `[LS Webhook] upsertSubscription: Created new lsPlan "${variantName}" (ID: ${lsPlan.id}) from webhook.`,
    );
  } else {
    // Cuando el plan ya existe, usamos su información como fallback
    console.log(
      `[LS Webhook] upsertSubscription: Found existing lsPlan with ID: ${lsPlan.id}`,
    );
    price = price ?? lsPlan.price;
    productId = productId ?? lsPlan.productId;
    variantName = variantName ?? lsPlan.name;
    console.log(
      `[LS Webhook] upsertSubscription: Using effective plan details - Price: ${price}, Product ID: ${productId}, Variant Name: ${variantName}`,
    );
  }

  // ---------------- Plan de negocio interno ----------------
  const priceUsd = (price ?? 0) / 100;
  const creditsPerCycleCalc = computeIncludedCredits(planVariantId, priceUsd);
  console.log(
    `[LS Webhook] upsertSubscription: Internal plan details - Price USD: ${priceUsd}, Calculated Credits/Cycle: ${creditsPerCycleCalc}`,
  );

  let plan = await db.plan.findUnique({ where: { variantId: planVariantId } });
  if (!plan) {
    console.log(
      `[LS Webhook] upsertSubscription: Internal plan not found. Creating...`,
    );
    const planData = {
      name: variantName,
      price: String(priceUsd),
      interval: attributes.interval ?? "month",
      productId: Number(productId),
      variantId: planVariantId,
      creditsPerCycle: creditsPerCycleCalc,
    };
    console.log(
      "[LS Webhook] upsertSubscription: Internal plan create data:",
      planData,
    );
    plan = await db.plan.create({
      data: planData,
    });
    console.log(
      "[LS Webhook] upsertSubscription: Internal plan created:",
      plan,
    );
  } else if (plan.creditsPerCycle !== creditsPerCycleCalc) {
    console.log(
      `[LS Webhook] upsertSubscription: Internal plan credits mismatch (${plan.creditsPerCycle} vs ${creditsPerCycleCalc}). Updating...`,
    );
    await db.plan.update({
      where: { id: plan.id },
      data: { creditsPerCycle: creditsPerCycleCalc },
    });
    plan = await db.plan.findUnique({ where: { id: plan.id } });
    console.log(
      "[LS Webhook] upsertSubscription: Internal plan updated:",
      plan,
    );
  } else {
    console.log(
      "[LS Webhook] upsertSubscription: Found existing internal plan:",
      plan,
    );
  }

  if (!plan) {
    console.error(
      "[LS Webhook] upsertSubscription: Failed to create or fetch internal Plan",
    );
    return;
  }

  console.log(
    `[LS Webhook] upsertSubscription: Final plan IDs - lsPlan: ${lsPlan.id}, bizPlan: ${plan.id}`,
  );

  const updateData = {
    status: mapStatus(sub.attributes.status_formatted),
    renewsAt: sub.attributes.renews_at
      ? new Date(sub.attributes.renews_at)
      : null,
    endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
    trialEndsAt: sub.attributes.trial_ends_at
      ? new Date(sub.attributes.trial_ends_at)
      : null,
    planId: lsPlan.id,
    isPaused: sub.attributes.is_paused,
  };

  const createData = {
    lsSubscriptionId: Number(sub.id),
    userId,
    status: mapStatus(sub.attributes.status_formatted),
    renewsAt: sub.attributes.renews_at
      ? new Date(sub.attributes.renews_at)
      : null,
    endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
    trialEndsAt: sub.attributes.trial_ends_at
      ? new Date(sub.attributes.trial_ends_at)
      : null,
    planId: lsPlan.id,
    isPaused: sub.attributes.is_paused,
  };

  console.log(
    `[LS Webhook] upsertSubscription: Upserting LsSubscription with ID ${sub.id}. Update data:`,
    updateData,
    "Create data:",
    createData,
  );
  const subscription = await db.lsSubscription.upsert({
    where: { lsSubscriptionId: Number(sub.id) },
    update: updateData,
    create: createData,
  });

  console.log(
    "[LS Webhook] upsertSubscription: Upserted LsSubscription result:",
    subscription,
  );
  // Sincronizaremos créditos en la fase `syncInternalPlanAndSubscription`, donde ya existe la suscripción interna.
  const user = await db.user.findUnique({ where: { id: userId } });
  console.log(
    "[LS Webhook] upsertSubscription: Checking user for initial credit grant:",
    user,
  );
  if (user && user.initialAmountCredits === 0) {
    console.log(
      `[LS Webhook] upsertSubscription: User has 0 initial credits. Granting ${plan.creditsPerCycle} initial credits.`,
    );
    await db.user.update({
      where: { id: userId },
      data: {
        initialAmountCredits: plan.creditsPerCycle,
        amountCredits: plan.creditsPerCycle,
      },
    });
    console.log(`[LS Webhook] upsertSubscription: User credits updated.`);
    // Crear una transacción de recarga inicial
  }
}

function mapStatus(statusFormatted: string): LsSubscriptionStatus {
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

async function resolveUserId(payload: any): Promise<string | null> {
  console.log("[LS Webhook] resolveUserId: Starting...");
  try {
    // 1) Intentar por custom_data.userId (checkout > custom field)
    const custom =
      payload?.data?.attributes?.custom_data ??
      payload?.meta?.custom_data ??
      {};
    console.log("[LS Webhook] resolveUserId: Checking custom data:", custom);
    const uid = custom?.userId ?? custom?.userid ?? custom?.user_id;
    if (uid && typeof uid === "string") {
      console.log(
        `[LS Webhook] resolveUserId: Found potential user ID in custom data: ${uid}`,
      );
      const userById = await db.user.findUnique({ where: { id: uid } });
      console.log(
        "[LS Webhook] resolveUserId: User lookup by ID result:",
        userById ? `found user ${userById.id}` : "not found",
      );
      if (userById) return userById.id;
    }

    // 2) Fallback: email
    const email = payload?.data?.attributes?.user_email;
    console.log(`[LS Webhook] resolveUserId: Falling back to email: ${email}`);
    if (email) {
      const userByEmail = await db.user.findUnique({ where: { email } });
      console.log(
        "[LS Webhook] resolveUserId: User lookup by email result:",
        userByEmail ? `found user ${userByEmail.id}` : "not found",
      );
      return userByEmail?.id ?? null;
    }
  } catch (err) {
    console.error("[LS Webhook] resolveUserId: An error occurred", err);
  }
  console.log("[LS Webhook] resolveUserId: Could not resolve user ID.");
  return null;
}

/**
 * Sincroniza las tablas Plan y Subscription (internas) con la información de Lemon Squeezy.
 * Si `isNew` es `true`, otorga los créditos iniciales del ciclo.
 */
async function syncInternalPlanAndSubscription(
  payload: any,
  isNew: boolean = false,
) {
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Starting... isNew=${isNew}`,
  );
  const sub = payload.data;
  const attributes = sub.attributes as any;

  const userId = await resolveUserId(payload);
  if (!userId) {
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Could not resolve user ID. Aborting.",
    );
    return;
  }
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Resolved userId: ${userId}`,
  );

  // 1) Plan (mapeado por variantId)
  const variantId =
    attributes.variant_id ?? attributes.first_order_item?.variant_id;
  if (!variantId) {
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: No variantId found. Aborting.",
    );
    return;
  }
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Using variantId: ${variantId}`,
  );

  // Price is not reliably in the subscription_created payload.
  // We fetch our internal LsPlan record, which `upsertSubscription` should have already created/updated with the correct price.
  const lsPlan = await db.lsPlan.findUnique({
    where: { variantId: variantId },
  });
  if (!lsPlan) {
    console.error(
      `[LS Webhook] syncInternalPlanAndSubscription: Could not find LsPlan for variantId ${variantId}. This should have been created by upsertSubscription. Aborting.`,
    );
    return;
  }

  // Price is in cents according to LemonSqueezy docs
  const priceCents: number = lsPlan.price; // Get price from our DB record
  const priceUsd = priceCents / 100;
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Price in USD from LsPlan: ${priceUsd}`,
  );

  const productId =
    attributes.product_id ?? attributes.first_order_item?.product_id;
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Using productId: ${productId}`,
  );

  // Aproximamos créditos incluidos: precioUSD * 100 (1 cr = 0.01 USD coste)
  const approxCredits = computeIncludedCredits(variantId, priceUsd);
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Calculated approxCredits: ${approxCredits}`,
  );

  // ----- Internal Plan (biz) -----
  let plan = await db.plan.findUnique({ where: { variantId } });
  console.log(
    "[LS Webhook] syncInternalPlanAndSubscription: Internal plan search result: ",
    plan ? `found plan ${plan.id}` : "not found",
  );
  if (!plan) {
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Internal plan not found, creating...",
    );
    if (productId === undefined) {
      console.log(
        "[LS Webhook] syncInternalPlanAndSubscription: Cannot create plan without productId. Aborting.",
      );
      return;
    }

    const createPlanData = {
      variantId,
      productId: Number(productId),
      name: attributes.variant_name ?? `Plan ${variantId}`,
      price: `${priceUsd}`,
      interval: attributes.interval ?? "month",
      creditsPerCycle: approxCredits,
    };
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Creating plan with data:",
      createPlanData,
    );
    plan = await db.plan.create({
      data: createPlanData,
    });
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Plan created: ",
      plan,
    );
  } else if (plan.creditsPerCycle !== approxCredits && approxCredits > 0) {
    console.log(
      `[LS Webhook] syncInternalPlanAndSubscription: Plan credits mismatch (${plan.creditsPerCycle} vs ${approxCredits}). Updating...`,
    );
    await db.plan.update({
      where: { id: plan.id },
      data: { creditsPerCycle: approxCredits },
    });
    plan = await db.plan.findUnique({ where: { id: plan.id } });
    console.log("[LS Webhook] syncInternalPlanAndSubscription: Plan updated.");
  }

  if (!plan) {
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Plan could not be found or created. Aborting.",
    );
    return;
  } // safety

  // --- Garantizar créditos por plan ---
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Checking for credit guarantee. Current creditsPerCycle: ${plan.creditsPerCycle}`,
  );
  if (plan.creditsPerCycle === 0) {
    let mapped = 0;
    const lname = plan.name.toLowerCase();
    if (lname.includes("starter")) mapped = 3000;
    else if (lname.includes("growth")) mapped = 10000;
    else if (lname.includes("scale")) mapped = 30000;
    else mapped = approxCredits;
    console.log(
      `[LS Webhook] syncInternalPlanAndSubscription: Mapped credits by name: ${mapped}`,
    );

    if (mapped > 0) {
      console.log(
        `[LS Webhook] syncInternalPlanAndSubscription: Updating plan with guaranteed credits: ${mapped}`,
      );
      await db.plan.update({
        where: { id: plan.id },
        data: { creditsPerCycle: mapped },
      });
      plan = { ...plan, creditsPerCycle: mapped } as typeof plan;
    }
  }

  // 2) Subscription (interna)
  const cycleEnd = attributes.renews_at ? new Date(attributes.renews_at) : null;
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Searching for internal subscription with LS ID: ${sub.id.toString()}`,
  );
  let subscription = await db.subscription.findFirst({
    where: { lemonSqueezyId: sub.id.toString() },
  });
  console.log(
    `[LS Webhook] syncInternalPlanAndSubscription: Internal subscription search result:`,
    subscription ? `found sub ${subscription.id}` : "not found",
  );

  if (!subscription) {
    const createSubData = {
      planId: plan.id,
      status: mapStatus(attributes.status_formatted),
      userId,
      lemonSqueezyId: sub.id.toString(),
      email: attributes.user_email,
      endsAt: attributes.ends_at,
      name: attributes.variant_name,
      orderId: Number(attributes.order_id) || 0,
      price: `${priceUsd}`,
      renewsAt: attributes.renews_at,
      statusFormatted: attributes.status_formatted,
      subscriptionItemId: attributes.first_subscription_item
        ?.subscription_item_id
        ? String(attributes.first_subscription_item.subscription_item_id)
        : undefined,
      trialEndsAt: attributes.trial_ends_at,
      cycleEndAt: cycleEnd,
    };
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Creating internal subscription with data:",
      createSubData,
    );
    subscription = await db.subscription.create({
      data: createSubData,
    });
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Internal subscription created:",
      subscription,
    );

    // Otorgar créditos iniciales
    if (plan.creditsPerCycle > 0) {
      console.log(
        `[LS Webhook] syncInternalPlanAndSubscription: New subscription. Granting ${plan.creditsPerCycle} initial credits.`,
      );
      await CreditService.credit(userId, plan.creditsPerCycle, {
        reason: "subscription_created",
        subId: subscription.id,
      });
      console.log(
        `[LS Webhook] syncInternalPlanAndSubscription: Initial credits granted.`,
      );
    }
  } else {
    // Update existing subscription
    const updateSubData = {
      status: mapStatus(attributes.status_formatted),
      endsAt: attributes.ends_at,
      renewsAt: attributes.renews_at,
      cycleEndAt: cycleEnd,
      isPaused: attributes.is_paused,
      orderId: Number(attributes.order_id) || subscription.orderId,
    };
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Updating existing internal subscription with data:",
      updateSubData,
    );
    await db.subscription.update({
      where: { id: subscription.id },
      data: updateSubData,
    });
    console.log(
      "[LS Webhook] syncInternalPlanAndSubscription: Internal subscription updated.",
    );

    // Si aún no tiene créditos, otorgar los incluidos en el plan
    console.log(
      `[LS Webhook] syncInternalPlanAndSubscription: Checking if existing subscription needs credits. Current credits: ${subscription.currentCredits}, Plan credits: ${plan.creditsPerCycle}`,
    );
    if (subscription.currentCredits === 0 && plan.creditsPerCycle > 0) {
      console.log(
        `[LS Webhook] syncInternalPlanAndSubscription: Granting ${plan.creditsPerCycle} credits on sync.`,
      );
      await CreditService.credit(userId, plan.creditsPerCycle, {
        reason: "subscription_sync",
        subId: subscription.id,
      });
      console.log(
        `[LS Webhook] syncInternalPlanAndSubscription: Credits granted on sync.`,
      );
    }
  }
}

async function markSubscriptionCancelled(payload: any) {
  console.log("[LS Webhook] markSubscriptionCancelled: Starting...");
  const sub = payload.data;
  const attributes = sub.attributes as any;
  console.log(
    `[LS Webhook] markSubscriptionCancelled: Looking for internal subscription with LS ID: ${sub.id.toString()}`,
  );
  const internal = await db.subscription.findFirst({
    where: { lemonSqueezyId: sub.id.toString() },
  });
  if (internal) {
    console.log(
      `[LS Webhook] markSubscriptionCancelled: Found internal subscription ${internal.id}. Updating status to CANCELLED.`,
    );
    await db.subscription.update({
      where: { id: internal.id },
      data: { status: "CANCELLED" },
    });
    console.log("[LS Webhook] markSubscriptionCancelled: Status updated.");
  } else {
    console.log(
      "[LS Webhook] markSubscriptionCancelled: No internal subscription found.",
    );
  }
}

async function creditOnSuccessfulPayment(payload: any) {
  console.log("[LS Webhook] creditOnSuccessfulPayment: Starting...");
  const sub = payload.data;
  const attributes = sub.attributes as any;
  console.log(
    `[LS Webhook] creditOnSuccessfulPayment: Looking for internal subscription with LS ID: ${sub.id.toString()}`,
  );
  const internal = await db.subscription.findFirst({
    where: { lemonSqueezyId: sub.id.toString() },
    include: { plan: true },
  });
  if (!internal || !internal.plan) {
    console.log(
      "[LS Webhook] creditOnSuccessfulPayment: Internal subscription or plan not found. Aborting. Sub:",
      internal,
    );
    return;
  }
  console.log(
    `[LS Webhook] creditOnSuccessfulPayment: Found internal sub ${internal.id} with plan ${internal.plan.id}.`,
  );

  // Reponer créditos según plan
  if (internal.plan.creditsPerCycle > 0) {
    console.log(
      `[LS Webhook] creditOnSuccessfulPayment: Crediting user ${internal.userId} with ${internal.plan.creditsPerCycle} credits for payment.`,
    );
    await CreditService.credit(internal.userId, internal.plan.creditsPerCycle, {
      reason: "cycle_payment",
      subId: internal.id,
    });
    console.log(
      `[LS Webhook] creditOnSuccessfulPayment: Credits granted. Updating subscription cycle date.`,
    );
    // Ajustar currentCredits y ciclo
    const nextCycle = attributes.renews_at
      ? new Date(attributes.renews_at)
      : undefined;
    await db.subscription.update({
      where: { id: internal.id },
      data: {
        cycleEndAt: nextCycle,
      },
    });
    console.log(
      `[LS Webhook] creditOnSuccessfulPayment: Subscription cycle updated to ${nextCycle}.`,
    );
  } else {
    console.log(
      "[LS Webhook] creditOnSuccessfulPayment: Plan has no credits to cycle. Skipping credit grant.",
    );
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
  console.log("[LS Webhook] processCreditPackOrder: Starting...");
  const order = payload.data;
  const attributes = order.attributes as any;
  const variantId = attributes.first_order_item?.variant_id;
  if (!variantId) {
    console.log(
      "[LS Webhook] processCreditPackOrder: No variantId in order. Aborting.",
    );
    return;
  }
  console.log(
    `[LS Webhook] processCreditPackOrder: Order has variantId: ${variantId}`,
  );

  const credits = CREDIT_PACKS[variantId];
  if (!credits) {
    console.log(
      `[LS Webhook] processCreditPackOrder: VariantId ${variantId} is not a credit pack. Skipping.`,
    );
    return;
  }
  console.log(
    `[LS Webhook] processCreditPackOrder: It's a credit pack for ${credits} credits.`,
  );

  const email = attributes.user_email;
  const userId = await resolveUserId(payload);
  if (!userId) {
    console.log(
      `[LS Webhook] processCreditPackOrder: Could not resolve user for email ${email}. Aborting.`,
    );
    return;
  }
  console.log(
    `[LS Webhook] processCreditPackOrder: Resolved userId: ${userId}. Granting credits.`,
  );

  await CreditService.credit(userId, credits, {
    reason: "credit_pack_purchase",
    orderId: order.id,
    variantId,
  });
  console.log(
    "[LS Webhook] processCreditPackOrder: Credits granted successfully.",
  );

  // Opcional: registrar en UsageEvent? no necesario
}
