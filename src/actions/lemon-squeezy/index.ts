"use server";

import { db } from "@/utils";
import { lemonSqueezy } from "@/lib/lemonSqueezy";

export async function createCheckoutAction(userId: string, variantId: number) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const url = await lemonSqueezy.createCheckout({
    variantId,
    email: user.email,
    custom: { userId },
  });

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
