/**
 * OPTIHUB EDGE - rate-limit boundary.
 *
 * The contract is intentionally independent of the pipeline and of the concrete
 * storage: tenant + credential + action in, a decision out. The in-memory
 * implementation is a real fixed-window limiter suitable for a single process; a
 * Redis implementation can replace it behind this interface without touching a
 * handler.
 *
 * The limiter never decides what happens on its own failure. That is the
 * pipeline's job, and the pipeline fails closed.
 */

export interface EdgeRateLimitKey {
  readonly tenantId: string;
  readonly credentialId: string;
  readonly action: string;
}

export interface EdgeRateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterSeconds: number;
}

export interface EdgeRateLimiter {
  evaluate(
    key: EdgeRateLimitKey,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<EdgeRateLimitDecision>;
}

export interface EdgeRateLimitRule {
  readonly limit: number;
  readonly windowMs: number;
}

const MINUTE_MS = 60_000;

/** Default budget per action. Unknown actions fall back to `default`. */
export const EDGE_RATE_LIMITS: Readonly<Record<string, EdgeRateLimitRule>> = {
  default: { limit: 120, windowMs: MINUTE_MS },
  "projects:read": { limit: 120, windowMs: MINUTE_MS },
  "content:read": { limit: 120, windowMs: MINUTE_MS },
  "publication:execute": { limit: 10, windowMs: MINUTE_MS },
};

export function edgeRateLimitFor(action: string): EdgeRateLimitRule {
  return EDGE_RATE_LIMITS[action] ?? EDGE_RATE_LIMITS["default"]!;
}

interface WindowEntry {
  count: number;
  resetAt: number;
}

const MAX_TRACKED_KEYS = 10_000;

export class InMemoryEdgeRateLimiter implements EdgeRateLimiter {
  private readonly windows = new Map<string, WindowEntry>();

  async evaluate(
    key: EdgeRateLimitKey,
    limit: number,
    windowMs: number,
    now: number = Date.now(),
  ): Promise<EdgeRateLimitDecision> {
    this.prune(now);

    const composite = `${key.tenantId}\u0000${key.credentialId}\u0000${key.action}`;
    const current = this.windows.get(composite);

    if (current === undefined || current.resetAt <= now) {
      this.windows.set(composite, { count: 1, resetAt: now + windowMs });
      return { allowed: true, remaining: Math.max(limit - 1, 0), retryAfterSeconds: 0 };
    }

    if (current.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
      };
    }

    current.count += 1;
    return {
      allowed: true,
      remaining: Math.max(limit - current.count, 0),
      retryAfterSeconds: 0,
    };
  }

  reset(): void {
    this.windows.clear();
  }

  private prune(now: number): void {
    // Only pay for cleanup when the map is actually at its bound. Scanning on
    // every request would turn the limiter itself into a CPU amplifier.
    if (this.windows.size < MAX_TRACKED_KEYS) return;
    for (const [key, entry] of Array.from(this.windows.entries())) {
      if (entry.resetAt <= now) this.windows.delete(key);
    }
    while (this.windows.size >= MAX_TRACKED_KEYS) {
      const oldest = this.windows.keys().next().value;
      if (typeof oldest !== "string") break;
      this.windows.delete(oldest);
    }
  }
}
