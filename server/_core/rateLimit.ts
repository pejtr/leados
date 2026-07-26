import { TRPCError } from "@trpc/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

const DEFAULT_RPM = 100;
const LLM_RPM = 20;
const WINDOW_MS = 60_000;

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function startCleanup(): void {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.resetAt <= now) store.delete(key);
    }
    if (store.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval);
      cleanupInterval = null;
    }
  }, WINDOW_MS);
}

export type RateLimitConfig = {
  rpm?: number;
  isLlmRoute?: boolean;
};

export function checkRateLimit(
  userId: number,
  config?: RateLimitConfig,
): void {
  const maxRequests = config?.isLlmRoute ? LLM_RPM : (config?.rpm ?? DEFAULT_RPM);
  const key = `${userId}:${config?.isLlmRoute ? "llm" : "default"}`;
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS };
    store.set(key, entry);
  }

  entry.count++;
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${retryAfter}s.`,
    });
  }

  startCleanup();
}

export function resetRateLimits(): void {
  store.clear();
}
