import { TRPCError } from "@trpc/server";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitEntry>();
const MAX_TRACKED_CLIENTS = 5_000;

function firstHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getClientIdentifier(req: Request) {
  const forwardedFor = firstHeaderValue(req.headers["x-forwarded-for"])?.split(",")[0]?.trim();
  const address = firstHeaderValue(req.headers["cf-connecting-ip"])
    || firstHeaderValue(req.headers["x-real-ip"])
    || forwardedFor
    || req.socket?.remoteAddress
    || req.ip
    || "unknown";
  const userAgent = (req.headers["user-agent"] || "unknown").slice(0, 160);
  return `${address}|${userAgent}`;
}

function pruneRateLimits(now: number) {
  rateLimits.forEach((entry, key) => {
    if (entry.resetAt <= now) rateLimits.delete(key);
  });

  while (rateLimits.size >= MAX_TRACKED_CLIENTS) {
    const oldestKey = rateLimits.keys().next().value;
    if (typeof oldestKey !== "string") break;
    rateLimits.delete(oldestKey);
  }
}

export function enforcePublicRateLimit(
  req: Request,
  scope: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
) {
  if (rateLimits.size >= MAX_TRACKED_CLIENTS) pruneRateLimits(now);

  const key = `${scope}:${getClientIdentifier(req)}`;
  const current = rateLimits.get(key);
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "Příliš mnoho požadavků. Zkuste to prosím za chvíli znovu.",
    });
  }

  current.count += 1;
}

export function hasValidSharedSecret(req: Request, headerName: string, expectedSecret: string | undefined) {
  const provided = firstHeaderValue(req.headers[headerName.toLowerCase()]);
  const expected = expectedSecret?.trim();
  if (!provided || !expected) return false;

  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length
    && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function resetPublicRateLimitsForTests() {
  rateLimits.clear();
}
