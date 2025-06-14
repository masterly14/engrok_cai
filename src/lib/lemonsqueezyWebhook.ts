import crypto from "crypto";

/**
 * Verify Lemon Squeezy webhook signature.
 * Docs: https://docs.lemonsqueezy.com/api/webhooks
 */
export function verifyLemonSqueezySignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || "",
): boolean {
  if (!secret) throw new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET env variable");
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Use constant-time comparison.
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader));
} 