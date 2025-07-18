"use server";

import { getUserSubscription } from "./user";

export async function getUserFeatures() {
    const sub = await getUserSubscription();
    return sub.restrictions.features ?? [];
}