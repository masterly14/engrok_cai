import { db } from "@/utils";
import { CreditService } from "./credit-service";

export class PlanService {
  static async resetCycleForSubscription(subId: string) {
    const sub = await db.subscription.findUnique({
      where: { id: subId },
      include: { plan: true },
    });
    if (!sub || !sub.plan) return;
    const now = new Date();

    // Determine new cycle end (add 1 month)
    const nextCycle = new Date(now);
    nextCycle.setMonth(nextCycle.getMonth() + 1);

    const delta = sub.plan.creditsPerCycle - sub.currentCredits;

    if (delta !== 0) {
      // If delta positive => credit; if negative => debit (unlikely)
      await CreditService.mutateCredits(sub.userId, delta, "reset", {
        subId,
      });
    }

    await db.subscription.update({
      where: { id: subId },
      data: {
        cycleEndAt: nextCycle,
      },
    });
  }

  static async runMonthlyReset() {
    const today = new Date();
    const subs = await db.subscription.findMany({
      where: {
        cycleEndAt: {
          lte: today,
        },
        isPaused: false,
        status: "ACTIVE",
      },
    });

    for (const s of subs) {
      await this.resetCycleForSubscription(s.id);
    }
  }
} 