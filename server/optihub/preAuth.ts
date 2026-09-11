/**
 * OPTIHUB EDGE - pre-auth abuse limiter.
 *
 * A cheap, shared counter that runs before credential hashing/verification, so
 * an unauthenticated flood cannot turn into CPU work. It is keyed by the
 * resolved client IP hash and the declared surface (never by a raw header), plus
 * a global bucket so a botnet rotating addresses cannot bypass the per-IP limit.
 *
 * The limiter is only as trustworthy as `resolveClientIp`: it must run behind
 * the trusted-proxy model in `clientIp.ts`. A limiter failure propagates and the
 * pipeline fails closed.
 */

import type {
  EdgeRateLimitDecision,
  EdgeRateLimiter,
  EdgeRateLimitRule,
} from "./rateLimit";

export const EDGE_PRE_AUTH_PER_IP: EdgeRateLimitRule = { limit: 60, windowMs: 60_000 };
export const EDGE_PRE_AUTH_GLOBAL: EdgeRateLimitRule = { limit: 600, windowMs: 60_000 };

const PRE_AUTH_TENANT = "preauth";

export class EdgePreAuthLimiter {
  constructor(
    private readonly limiter: EdgeRateLimiter,
    private readonly perIpRule: EdgeRateLimitRule = EDGE_PRE_AUTH_PER_IP,
    private readonly globalRule: EdgeRateLimitRule = EDGE_PRE_AUTH_GLOBAL,
  ) {}

  async evaluate(
    clientIpHash: string | null,
    surface: string,
    now: number,
  ): Promise<EdgeRateLimitDecision> {
    const declaredSurface = surface === "" ? "unknown" : surface;
    const perIp = await this.limiter.evaluate(
      { tenantId: PRE_AUTH_TENANT, credentialId: clientIpHash ?? "unknown", action: `preauth:${declaredSurface}` },
      this.perIpRule.limit,
      this.perIpRule.windowMs,
      now,
    );
    if (!perIp.allowed) return perIp;
    return this.limiter.evaluate(
      { tenantId: PRE_AUTH_TENANT, credentialId: "global", action: `preauth:${declaredSurface}:global` },
      this.globalRule.limit,
      this.globalRule.windowMs,
      now,
    );
  }
}
