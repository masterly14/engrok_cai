import { db } from "@/utils";
import { CreditService } from "./credit-service";

interface ApplyVoiceParams {
  userId: string;
  seconds: number;
  externalRef?: string;
  meta?: Record<string, any>;
}

interface ApplyChatParams {
  userId: string;
  conversations: number;
  externalRef?: string;
  meta?: Record<string, any>;
}

export class PricingService {
  /** Devuelve créditos necesarios para X segundos de voz */
  static async quoteVoice(userId: string, seconds: number) {
    const sub = await db.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });
    if (!sub || !sub.plan) throw new Error("PLAN_NOT_FOUND");
    const minutes = Math.ceil(seconds / 60);
    return minutes * sub.plan.voiceCreditsPerMinute;
  }

  /** Devuelve créditos para n conversaciones */
  static async quoteChat(userId: string, convs: number) {
    const sub = await db.subscription.findFirst({
      where: { userId },
      include: { plan: true },
    });
    if (!sub || !sub.plan) throw new Error("PLAN_NOT_FOUND");
    return convs * sub.plan.chatCreditsPerConversation;
  }

  static async applyVoiceUsage(params: ApplyVoiceParams) {
    const { userId, seconds, externalRef, meta } = params;
    const credits = await this.quoteVoice(userId, seconds);
    await CreditService.debit(userId, credits, {
      kind: "voice",
      seconds,
      externalRef,
      ...meta,
    });

    await db.usageEvent.create({
      data: {
        userId,
        kind: "voice",
        quantity: seconds,
        creditsCharged: credits,
        externalRef,
        meta,
      },
    });
  }

  static async applyChatUsage(params: ApplyChatParams) {
    const { userId, conversations, externalRef, meta } = params;
    const credits = await this.quoteChat(userId, conversations);
    await CreditService.debit(userId, credits, {
      kind: "chat",
      conversations,
      externalRef,
      ...meta,
    });

    await db.usageEvent.create({
      data: {
        userId,
        kind: "chat",
        quantity: conversations,
        creditsCharged: credits,
        externalRef,
        meta,
      },
    });
  }
} 