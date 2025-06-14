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
  features?: string[];
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
        features: ["basic"],
      },
    };
  }

  // Definir restricciones según el plan
  const planRestrictions: Record<string, PlanRestrictions> = {
    "basic": {
      maxAgents: 1,
      maxContacts: 100,
      maxWorkflows: 1,
      maxKnowledgeBases: 1,
      maxPhoneNumbers: 1,
      maxIntegrations: 1,
      maxCredits: 1000,
      features: ["basic"],
    },
    "pro": {
      maxAgents: 5,
      maxContacts: 1000,
      maxWorkflows: 5,
      maxKnowledgeBases: 3,
      maxPhoneNumbers: 3,
      maxIntegrations: 3,
      maxCredits: 5000,
      features: ["basic", "pro"],
    },
    "enterprise": {
      maxAgents: -1,
      maxContacts: -1,
      maxWorkflows: -1,
      maxKnowledgeBases: -1,
      maxPhoneNumbers: -1,
      maxIntegrations: -1,
      maxCredits: -1,
      features: ["basic", "pro", "enterprise"],
    },
  };

  return {
    hasActiveSubscription: true,
    currentPlan: subscription.plan.name,
    restrictions: planRestrictions[subscription.plan.name.toLowerCase()] || planRestrictions.basic,
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