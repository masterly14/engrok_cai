export function computeIncludedCredits(
  variantId: number,
  priceUsd: number,
): number {
  // 1) Use explicit map via env variable if provided
  try {
    const raw = process.env.PLAN_CREDIT_VARIANTS;
    if (raw) {
      const map = JSON.parse(raw) as Record<string, number>;
      const v = map[variantId.toString()];
      if (typeof v === "number") return v;
    }
  } catch {
    // ignore malformed JSON
  }

  // 2) Fallback by price tiers
  if (priceUsd >= 150) return 30000;
  if (priceUsd >= 50) return 10000;
  if (priceUsd >= 20) return 3000;

  // 3) Linear default 1 USD = 100 credits
  return Math.round(priceUsd * 100);
}
