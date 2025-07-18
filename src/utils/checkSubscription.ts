import { db } from "@/utils";
import { LsSubscriptionStatus } from "@prisma/client";

export interface PlanRestrictions {
  maxAgents?: number;
  maxContacts?: number;
  maxWorkflows?: number;
  maxKnowledgeBases?: number;
  maxPhoneNumbers?: number | null;
  maxIntegrations?: number | null;
  maxCredits?: number;
  maxCallMinutes?: number | null;
  features?: string[];
  minutesCall?: number | null;
  phoneNumbersIncluded?: number;
}

export async function checkUserSubscription(userId: string): Promise<{
  hasActiveSubscription: boolean;
  currentPlan: string | null;
  restrictions: PlanRestrictions;
}> {
  const subscription = await db.lsSubscription.findFirst({
    where: {
      userId,
      status: LsSubscriptionStatus.ACTIVE,
    },
    include: {
      plan: true,
    },
  });

  if (!subscription) {
    return {
      hasActiveSubscription: false,
      currentPlan: null,
      restrictions: {
        maxAgents: 1,
        maxContacts: 100,
        maxWorkflows: 1,
        maxKnowledgeBases: 1,
        maxPhoneNumbers: 1,
        maxIntegrations: 1,
        maxCredits: 1000,
        maxCallMinutes: 0,
        features: ["basic"],
      },
    };
  }

  // Definir restricciones según el plan
  const planRestrictions: Record<string, PlanRestrictions> = {
    "starter": {
      maxAgents: 2,
      maxContacts: 600,
      maxWorkflows: 5,
      maxKnowledgeBases: 2,
      maxPhoneNumbers: null,
      maxIntegrations: null,
      maxCredits: 3000,
      maxCallMinutes: null,
      features: ["chat"],
    },
    "growth": {
      maxAgents: 5,
      maxContacts: 10000,
      maxWorkflows: 10,
      maxKnowledgeBases: 5,
      maxPhoneNumbers: 2,
      maxIntegrations: 10,
      maxCredits: 10000,
      maxCallMinutes: 1000,
      features: ["chat", "voice"],
    },
    "scale": {
      maxAgents: 10,
      maxContacts: 30000,
      maxWorkflows: 10,
      maxKnowledgeBases: 10,
      maxPhoneNumbers: 2,
      maxIntegrations: 10,
      maxCredits: 15000,
      maxCallMinutes: 1000,
      features: ["chat", "voice"],
    },
  };

  const fallbackRestrictions = {
    maxAgents: 1,
    maxContacts: 100,
    maxWorkflows: 1,
    maxKnowledgeBases: 1,
    maxPhoneNumbers: 1,
    maxIntegrations: 1,
    maxCredits: 1000,
    maxCallMinutes: 0,
    features: ["chat"],
  };

  return {
    hasActiveSubscription: true,
    currentPlan: subscription.plan.name,
    restrictions:
      planRestrictions[subscription.plan.name.toLowerCase()] ||
      fallbackRestrictions,
  };
}

export async function checkFeatureAccess(
  userId: string,
  feature: string,
): Promise<boolean> {
  const { hasActiveSubscription, restrictions } =
    await checkUserSubscription(userId);

  if (!hasActiveSubscription) {
    return false;
  }

  return restrictions.features?.includes(feature) || false;
}

export async function checkResourceLimit(
  userId: string,
  resourceType: keyof PlanRestrictions,
  currentCount: number,
): Promise<boolean> {
  const { hasActiveSubscription, restrictions } =
    await checkUserSubscription(userId);

  if (!hasActiveSubscription) {
    return false;
  }

  const limit = restrictions[resourceType];
  if (limit === undefined) return true;
  if (limit === -1) return true; // unlimited

  return Number(currentCount) < Number(limit);
}
