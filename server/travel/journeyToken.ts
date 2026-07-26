import crypto from "crypto";

export interface JourneyTokenPayload {
  anonymousVisitorId: string;
  sessionId: string;
  journeyId: string;
  originDomain: string;
  campaignId?: string;
  creativeId?: string;
  placementId?: string;
  exp: number; // Unix timestamp in ms
}

/**
 * Get the explicit TRAVEL_JOURNEY_SECRET.
 * Strictly checks process.env.TRAVEL_JOURNEY_SECRET.
 * NEVER falls back to JWT_SECRET, SESSION_SECRET, or implicit dev keys in non-test env.
 */
export function getJourneySecret(overrideSecret?: string): string | null {
  if (overrideSecret) return overrideSecret;
  const secret = process.env.TRAVEL_JOURNEY_SECRET;
  if (!secret || secret.trim() === "") {
    // Check if running under vitest / test environment where explicit test key can be used
    if (process.env.NODE_ENV === "test") {
      return process.env.TEST_TRAVEL_JOURNEY_SECRET || "test_only_journey_secret_32_chars_min!";
    }
    return null;
  }
  return secret;
}

/**
 * Server-side signing of journey tokens for cross-domain navigation.
 * Returns null if TRAVEL_JOURNEY_SECRET is missing.
 */
export function signJourneyToken(
  payload: Omit<JourneyTokenPayload, "exp">,
  ttlMs: number = 3600000, // Default 1 hour TTL
  secretOverride?: string
): string | null {
  const secret = getJourneySecret(secretOverride);
  if (!secret) {
    return null;
  }

  const fullPayload: JourneyTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Server-side verification of journey tokens.
 * Returns null if token is invalid, expired, tampered, or if secret is missing.
 */
export function verifyJourneyToken(
  token: string,
  secretOverride?: string
): JourneyTokenPayload | null {
  const secret = getJourneySecret(secretOverride);
  if (!secret || !token || typeof token !== "string") {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return null;
  }

  const [payloadBase64, providedSignature] = parts;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payloadBase64)
    .digest("base64url");

  if (
    providedSignature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as JourneyTokenPayload;

    if (Date.now() > payload.exp) {
      return null; // Expired token
    }

    return payload;
  } catch (err) {
    return null;
  }
}
