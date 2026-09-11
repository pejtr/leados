/**
 * OPTIHUB EDGE - origin authentication.
 *
 * When the public perimeter is Cloudflare (not a direct client), the Railway
 * origin must reject any request that did not come through Cloudflare. Cloudflare
 * injects a static secret header (a Request Header Transform Rule) that a client
 * cannot guess, and the rule overwrites any value the client tries to set.
 *
 * The check is opt-in and environment-controlled; it defaults to OFF so the
 * direct-Railway path behaves exactly as before. Enabling it is a deployment
 * decision made together with the matching Cloudflare rule.
 *
 * The secret is compared in constant time. Neither the presented header value
 * nor the expected secret is ever logged or written to the audit trail; only
 * the ORIGIN_DENIED outcome is recorded.
 *
 * INVARIANT (client identity): if a Cloudflare-provided client identity header
 * (e.g. CF-Connecting-IP) is ever trusted, that trust MUST be gated on origin
 * authentication having succeeded first. Otherwise an attacker who reaches the
 * Railway origin directly could forge the header. The current client identity
 * model is Railway-controlled, so it is unaffected by this check.
 */

import { createHash, timingSafeEqual } from "node:crypto";

export type OriginAuthMode = "off" | "cloudflare_static_header";

export const ORIGIN_AUTH_DEFAULT_HEADER = "x-optihub-origin-auth";

export interface OriginAuthConfig {
  readonly mode: OriginAuthMode;
  readonly headerName: string;
  /** The expected secret, or null when the mode requires one but none is set. */
  readonly expectedSecret: string | null;
}

/** Unknown values fall back to `off`; the hardening is strictly opt-in. */
export function parseOriginAuthMode(value: string | undefined | null): OriginAuthMode {
  return value === "cloudflare_static_header" ? "cloudflare_static_header" : "off";
}

export function originAuthConfigFrom(env: NodeJS.ProcessEnv): OriginAuthConfig {
  const mode = parseOriginAuthMode(env["OPTIHUB_ORIGIN_AUTH_MODE"]);
  const rawHeader = (env["OPTIHUB_ORIGIN_AUTH_HEADER"] ?? ORIGIN_AUTH_DEFAULT_HEADER).trim().toLowerCase();
  const secret = env["OPTIHUB_ORIGIN_AUTH_SECRET"];
  return {
    mode,
    headerName: rawHeader === "" ? ORIGIN_AUTH_DEFAULT_HEADER : rawHeader,
    expectedSecret: secret !== undefined && secret.trim() !== "" ? secret : null,
  };
}

export type OriginAuthDecision =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "origin_auth_missing" | "origin_auth_invalid" | "origin_auth_misconfigured" };

/**
 * Evaluate origin authentication for one request. `mode off` always passes.
 * When enabled with no configured secret the check fails closed (the request is
 * denied rather than silently accepted). A duplicated header (array) is never a
 * valid single secret.
 */
export function evaluateOriginAuth(
  config: OriginAuthConfig,
  headerValue: unknown,
): OriginAuthDecision {
  if (config.mode === "off") return { ok: true };
  if (config.expectedSecret === null) return { ok: false, reason: "origin_auth_misconfigured" };
  if (typeof headerValue !== "string" || headerValue.length === 0) {
    return { ok: false, reason: "origin_auth_missing" };
  }
  return constantTimeEquals(headerValue, config.expectedSecret)
    ? { ok: true }
    : { ok: false, reason: "origin_auth_invalid" };
}

/** Compare two strings without leaking length or content through timing. */
function constantTimeEquals(presented: string, expected: string): boolean {
  const a = createHash("sha256").update(presented, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
