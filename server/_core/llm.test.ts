import { describe, it, expect, vi } from "vitest";

// Deterministic retry configuration for tests.
vi.mock("../_core/env", () => ({
  ENV: {
    llmMaxRetries: 3,
    llmRetryBaseMs: 0,
    anthropicApiKey: "",
    deepseekApiKey: "",
    forgeApiKey: "",
    anthropicModel: "claude-sonnet-5",
    deepseekModel: "deepseek-chat",
    forgeApiUrl: "",
  },
}));

const { isRetryableError, parseRetryAfter, retryWithBackoff } = await import(
  "../_core/llm"
);

describe("isRetryableError", () => {
  it("treats 429/500/502/503/504 as retryable", () => {
    for (const status of [429, 500, 502, 503, 504]) {
      expect(isRetryableError(new Error(`LLM invoke failed: ${status} oops`))).toBe(
        true
      );
    }
  });

  it("treats 400/401/403/404 as non-retryable", () => {
    for (const status of [400, 401, 403, 404]) {
      expect(isRetryableError(new Error(`LLM invoke failed: ${status} oops`))).toBe(
        false
      );
    }
  });

  it("treats network failures as retryable", () => {
    expect(isRetryableError(new Error("fetch failed"))).toBe(true);
    expect(isRetryableError(new Error("ECONNRESET during request"))).toBe(true);
    expect(isRetryableError(new Error("ETIMEDOUT after 30s"))).toBe(true);
  });

  it("returns false for unrelated errors and non-errors", () => {
    expect(isRetryableError(new Error("unexpected json shape"))).toBe(false);
    expect(isRetryableError("not an Error instance")).toBe(false);
    expect(isRetryableError(null)).toBe(false);
  });
});

describe("parseRetryAfter", () => {
  it("extracts seconds from the message", () => {
    expect(
      parseRetryAfter(new Error("LLM invoke failed: 429 retry_after: 5"))
    ).toBe(5000);
  });

  it("is case-insensitive and tolerant of hyphen", () => {
    expect(
      parseRetryAfter(new Error("LLM invoke failed: 429 Retry-After: 2"))
    ).toBe(2000);
  });

  it("returns null when no retry-after present", () => {
    expect(parseRetryAfter(new Error("LLM invoke failed: 500 boom"))).toBeNull();
  });
});

describe("retryWithBackoff", () => {
  it("retries on retryable errors and returns the first success", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      if (attempts < 3) throw new Error("LLM invoke failed: 503 temporary");
      return "ok";
    });
    const result = await retryWithBackoff(fn, "anthropic");
    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry on a non-retryable error", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      throw new Error("LLM invoke failed: 400 bad request");
    });
    await expect(retryWithBackoff(fn, "deepseek")).rejects.toThrow("400");
    expect(attempts).toBe(1);
  });

  it("gives up after exceeding max retries, surfacing the last error", async () => {
    let attempts = 0;
    const fn = vi.fn(async () => {
      attempts++;
      throw new Error("LLM invoke failed: 503 still down");
    });
    await expect(retryWithBackoff(fn, "forge")).rejects.toThrow("503");
    // attempt 0..3 inclusive = 4 invocations for llmMaxRetries=3
    expect(attempts).toBe(4);
  });
});
