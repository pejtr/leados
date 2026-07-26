/**
 * Bezpečnostní hlavičky + jednoduchý in-memory rate limiter.
 *
 * Záměrně bez závislosti (helmet/express-rate-limit) — chování je plně pod
 * kontrolou a snadno testovatelné. CSP zde NEnastavujeme striktně, abychom
 * nerozbili Vite SPA; řešíme HSTS, anti-sniff, clickjacking, referrer a
 * odstranění X-Powered-By. Rate limit chrání před brute-force a cost-DoS
 * (neomezené drahé LLM inference).
 */

import type { Request, Response, NextFunction } from "express";

const IS_PROD = process.env.NODE_ENV === "production";

/** Nastaví bezpečnostní HTTP hlavičky na každou odpověď. */
export function securityHeaders() {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.removeHeader("X-Powered-By");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    // HSTS jen v produkci (na HTTPS) — v dev přes http by bránil přístupu
    if (IS_PROD) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }
    next();
  };
}

// ─── Rate limiter (in-memory, fixed window) ────────────────────────────────────

interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  /** Délka okna v ms. */
  windowMs: number;
  /** Max požadavků na klíč za okno. */
  max: number;
  /** Volitelný klíč (default: IP). */
  keyFn?: (req: Request) => string;
  /** Popisek pro hlavičku/log. */
  name?: string;
}

function clientIp(req: Request): string {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length > 0) {
    return fwd.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || req.ip || "unknown";
}

/**
 * Vytvoří rate-limit middleware s vlastní pamětí. Vrací 429 při překročení.
 * Pozn.: in-memory = per-instance. Pro více instancí je potřeba sdílený store
 * (Redis); pro single-instance Manus deploy je to dostatečná ochrana.
 */
export function rateLimit(opts: RateLimitOptions) {
  const buckets = new Map<string, Bucket>();
  const { windowMs, max, name = "rl" } = opts;
  const keyFn = opts.keyFn ?? clientIp;

  // Periodický úklid expirovaných bucketů (zabraňuje růstu paměti)
  const sweep = setInterval(() => {
    const now = Date.now();
    buckets.forEach((b, key) => {
      if (b.resetAt <= now) buckets.delete(key);
    });
  }, Math.max(windowMs, 60_000));
  // Neblokovat ukončení procesu kvůli timeru
  if (typeof sweep.unref === "function") sweep.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${name}:${keyFn(req)}`;
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(remaining));
    res.setHeader("RateLimit-Reset", String(Math.ceil((bucket.resetAt - now) / 1000)));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ error: "Too many requests. Please slow down." });
      return;
    }

    next();
  };
}
