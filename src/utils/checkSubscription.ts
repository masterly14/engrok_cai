import { db } from "@/utils";
import { LsSubscriptionStatus } from "@prisma/client";

export interface PlanRestrictions {
  maxAgents?: number;
  maxContacts?: number;
  maxWorkflows?: number;
  maxKnowledgeBases?: number;
  maxPhoneNumbers?: number;
  maxIntegrations?: number;
  maxCredits?: number;
  maxCallMinutes?: number;
  features?: string[];
  minutesCall?: number;
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
    "starter chat pro": {
      maxAgents: 5,
      maxContacts: 7000,
      maxWorkflows: 5,
      maxKnowledgeBases: 5,
      maxPhoneNumbers: 1,
      maxIntegrations: 5,
      maxCredits: 3250,
      maxCallMinutes: 0,
      features: ["chat"],
    },
    "smart voice plus": {
      maxAgents: 7,
      maxContacts: 7000,
      maxWorkflows: 7,
      maxKnowledgeBases: 7,
      maxPhoneNumbers: 2,
      maxIntegrations: 7,
      maxCredits: 7000,
      maxCallMinutes: 500,
      features: ["chat", "voice"],
    },
    "growth accelerator": {
      maxAgents: 10,
      maxContacts: 15000,
      maxWorkflows: 10,
      maxKnowledgeBases: 10,
      maxPhoneNumbers: 2,
      maxIntegrations: 10,
      maxCredits: 15000,
      maxCallMinutes: 1000,
      features: ["chat", "voice", "dedicated-infra"],
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
    restrictions: planRestrictions[subscription.plan.name.toLowerCase()] || fallbackRestrictions,
  };
}

export async function checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
  const { hasActiveSubscription, restrictions } = await checkUserSubscription(userId);
  
  if (!hasActiveSubscription) {
    return false;
  }

  return restrictions.features?.includes(feature) || false;
}

export async function checkResourceLimit(
  userId: string,
  resourceType: keyof PlanRestrictions,
  currentCount: number
): Promise<boolean> {
  const { hasActiveSubscription, restrictions } = await checkUserSubscription(userId);
  
  if (!hasActiveSubscription) {
    return false;
  }

  const limit = restrictions[resourceType];
  if (limit === undefined) return true;
  if (limit === -1) return true; // unlimited
  
  return Number(currentCount) < Number(limit);
} 