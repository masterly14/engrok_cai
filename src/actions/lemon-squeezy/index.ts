"use server";

import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";
import { currentUser } from "@clerk/nextjs/server";

export async function createCheckoutAction(userId: string, variantId: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  let url: string;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const checkoutParams: any = {
    variantId,
    email: user.email,
    custom: { userId },
  };

  if (baseUrl) {
    checkoutParams.productOptions = {
      redirectUrl: `${baseUrl}/thank-you`,
    };
  }

  try {
    url = await lemonSqueezy.createCheckout(checkoutParams);
  } catch (err) {
    console.error("[LS] createCheckoutAction error", err);
    throw err;
  }

  return url;
}

export async function cancelSubscriptionAction(lsSubscriptionId: number) {
  await lemonSqueezy.cancelSubscription(lsSubscriptionId);

  await db.lsSubscription.update({
    where: { lsSubscriptionId },
    data: { status: "CANCELLED" },
  });
}

export async function syncSubscriptionAction(lsSubscriptionId: number) {
  const lsSub: any = await lemonSqueezy.getSubscription(lsSubscriptionId);
  // Simplified mapping; you can expand as needed.
  await db.lsSubscription.update({
    where: { lsSubscriptionId },
    data: {
      status: lsSub.data.attributes.status_formatted.toUpperCase(),
      renewsAt: lsSub.data.attributes.renews_at ? new Date(lsSub.data.attributes.renews_at) : null,
      endsAt: lsSub.data.attributes.ends_at ? new Date(lsSub.data.attributes.ends_at) : null,
      isPaused: lsSub.data.attributes.is_paused,
    },
  });
}

export async function createCheckoutFromTemp(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");
  if (!user.temporalVariantId) throw new Error("No temporary variantId found for user");

  const variantId = Number(user.temporalVariantId);

  let url: string;
  const baseUrl2 = process.env.NEXT_PUBLIC_APP_URL;
  const checkoutParams2: any = {
    variantId,
    email: user.email,
    custom: { userId },
  };

  if (baseUrl2) {
    checkoutParams2.productOptions = {
      redirectUrl: `${baseUrl2}/application`,
    };
  }

  try {
    url = await lemonSqueezy.createCheckout(checkoutParams2);
  } catch (err) {
    console.error("[LS] createCheckoutFromTemp error", err);
    throw err;
  }

  // Limpiar el variantId temporal
  await db.user.update({
    where: { id: userId },
    data: { temporalVariantId: null },
  });

  return url;
}


export const getPublicPlans = async () => {
  const plans = await db.plan.findMany();
  const user = await currentUser();

  if (!user) return { plans };

  const userRow = await db.user.findUnique({
    where: { clerkId: user.id },
    select: { id: true }
  });
  if (!userRow) return { plans };

  // Incluimos el plan de Lemon Squeezy en la consulta
  const subscription = await db.lsSubscription.findFirst({
    where: {
      userId: userRow.id,
      status: "ACTIVE"
    },
    include: { plan: true }          // ← aquí
  });

  if (subscription) {
    // Buscamos en nuestros planes por variantId
    const matched = plans.find(
      (p) => p.variantId === subscription.plan.variantId
    );
    return {
      plans,
      currentPlan: matched?.name ?? null
    };
  }

  return { plans };
};