import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  checkUserSubscription,
  checkFeatureAccess,
  checkResourceLimit,
  PlanRestrictions,
} from "@/utils/checkSubscription";
import { onBoardUser } from "@/actions/user";
import { CreditService } from "@/services/credit-service";

export async function checkPlanRestrictions(
  request: NextRequest,
  requiredFeature?: string,
  resourceType?: keyof PlanRestrictions,
  currentCount?: number,
  expectedCredits?: number,
) {
  const user = await onBoardUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verificar si el usuario tiene una suscripción activa
  const { hasActiveSubscription } = await checkUserSubscription(user.data.id);

  if (!hasActiveSubscription) {
    return NextResponse.json(
      { error: "Subscription required" },
      { status: 403 },
    );
  }

  // Si se requiere una característica específica
  if (requiredFeature) {
    const hasAccess = await checkFeatureAccess(user.data.id, requiredFeature);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Feature not available in your plan" },
        { status: 403 },
      );
    }
  }

  // Si se requiere verificar un límite de recurso
  if (resourceType && currentCount !== undefined) {
    const withinLimit = await checkResourceLimit(
      user.data.id,
      resourceType,
      currentCount,
    );
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Resource limit reached for your plan" },
        { status: 403 },
      );
    }
  }

  // Verificar saldo de créditos si se indica expectedCredits
  if (expectedCredits && expectedCredits > 0) {
    try {
      await CreditService.ensureBalance(user.data.id, expectedCredits);
    } catch {
      return NextResponse.json(
        { error: "Not enough credits" },
        { status: 403 },
      );
    }
  }

  return null; // No hay restricciones, continuar
}
