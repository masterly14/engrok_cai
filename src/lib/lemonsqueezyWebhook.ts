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
  console.log("Verifying Lemon Squeezy webhook signature...");

  if (!secret) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET env variable is not set.");
    throw new Error("Missing LEMON_SQUEEZY_WEBHOOK_SECRET env variable");
  }
  if (!signatureHeader) {
    console.warn("Signature header is missing from webhook request.");
    return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Use constant-time comparison.
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signatureHeader),
  );

  if (!isValid) {
    console.warn("Invalid Lemon Squeezy signature.");
    return false;
  }

  console.log("Successfully verified Lemon Squeezy webhook signature.");
  return true;
} 