import { db } from "@/utils";

export type CreditLedgerType = "debit" | "credit" | "reset" | "rollover";

interface LedgerMeta {
  [key: string]: any;
}

export class CreditService {
  /**
   * Añade (delta > 0) o sustrae (delta < 0) créditos creando un registro en CreditLedger y actualizando Subscription.currentCredits
   */
  static async mutateCredits(
    userId: string,
    delta: number,
    type: CreditLedgerType,
    meta?: LedgerMeta,
  ) {
    return db.$transaction(async (tx) => {
      const sub = await tx.subscription.findFirst({
        where: {
          userId,
          isPaused: false,
          status: { in: ["ACTIVE", "TRIALING"] },
        },
        orderBy: { createdAt: "desc" },
      });
      if (!sub) throw new Error("SUBSCRIPTION_NOT_FOUND");

      if (delta < 0 && sub.currentCredits + delta < 0) {
        throw new Error("NO_CREDITS");
      }

      await tx.subscription.update({
        where: { id: sub.id },
        data: { currentCredits: { increment: delta } },
      });

      await tx.creditLedger.create({
        data: {
          userId,
          delta,
          type,
          meta,
        },
      });
    });
  }

  static debit(userId: string, credits: number, meta?: LedgerMeta) {
    return this.mutateCredits(userId, -Math.abs(credits), "debit", meta);
  }

  static credit(userId: string, credits: number, meta?: LedgerMeta) {
    return this.mutateCredits(userId, Math.abs(credits), "credit", meta);
  }

  static async ensureBalance(userId: string, needed: number) {
    const sub = await db.subscription.findFirst({
      where: {
        userId,
        isPaused: false,
        status: { in: ["ACTIVE", "TRIALING"] },
      },
    });
    if (!sub || sub.currentCredits < needed) {
      throw new Error("NO_CREDITS");
    }
  }
}
