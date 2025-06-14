import { NextResponse } from "next/server";
import { verifyLemonSqueezySignature } from "@/lib/lemonsqueezyWebhook";
import { db } from "@/utils";


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
      break;
    case "subscription_updated":
      await upsertSubscription(payload);
      break;
    case "subscription_cancelled":
      await upsertSubscription(payload);
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

  const planVariantId = sub.attributes.first_order_item.variant_id;

  // Upsert plan
  const plan = await db.lsPlan.upsert({
    where: { variantId: planVariantId },
    update: {
      name: sub.attributes.first_order_item.product_name,
      price: sub.attributes.first_order_item.price,
    },
    create: {
      variantId: planVariantId,
      productId: sub.attributes.first_order_item.product_id,
      storeId: payload.meta?.store_id ?? 0,
      name: sub.attributes.first_order_item.product_name,
      price: sub.attributes.first_order_item.price,
    },
  });

  await db.lsSubscription.upsert({
    where: { lsSubscriptionId: Number(sub.id) },
    update: {
      status: mapStatus(sub.attributes.status_formatted),
      renewsAt: sub.attributes.renews_at ? new Date(sub.attributes.renews_at) : null,
      endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
      trialEndsAt: sub.attributes.trial_ends_at ? new Date(sub.attributes.trial_ends_at) : null,
      planId: plan.id,
      isPaused: sub.attributes.is_paused,
    },
    create: {
      lsSubscriptionId: Number(sub.id),
      userId,
      status: mapStatus(sub.attributes.status_formatted),
      renewsAt: sub.attributes.renews_at ? new Date(sub.attributes.renews_at) : null,
      endsAt: sub.attributes.ends_at ? new Date(sub.attributes.ends_at) : null,
      trialEndsAt: sub.attributes.trial_ends_at ? new Date(sub.attributes.trial_ends_at) : null,
      planId: plan.id,
      isPaused: sub.attributes.is_paused,
    },
  });
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