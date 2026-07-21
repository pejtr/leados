import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, resetRateLimits } from "./rateLimit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests within the default RPM limit (100)", () => {
    for (let i = 0; i < 100; i++) {
      expect(() => checkRateLimit(1)).not.toThrow();
    }
  });

  it("blocks requests exceeding the default RPM limit", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(1);
    }
    expect(() => checkRateLimit(1)).toThrow("Rate limit exceeded");
  });

  it("uses separate counters for different users", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(1);
    }
    expect(() => checkRateLimit(1)).toThrow("Rate limit exceeded");
    expect(() => checkRateLimit(2)).not.toThrow();
  });

  it("uses separate counters for LLM vs default routes", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(1);
    }
    expect(() => checkRateLimit(1)).toThrow("Rate limit exceeded");
    // LLM route has its own counter (20 RPM)
    expect(() => checkRateLimit(1, { isLlmRoute: true })).not.toThrow();
  });

  it("enforces LLM route limit of 20 RPM", () => {
    for (let i = 0; i < 20; i++) {
      checkRateLimit(1, { isLlmRoute: true });
    }
    expect(() => checkRateLimit(1, { isLlmRoute: true })).toThrow("Rate limit exceeded");
  });

  it("allows custom RPM config", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit(1, { rpm: 5 });
    }
    expect(() => checkRateLimit(1, { rpm: 5 })).toThrow("Rate limit exceeded");
  });

  it("includes retry-after seconds in error message", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(99);
    }
    let caught = false;
    try {
      checkRateLimit(99);
    } catch (err: any) {
      caught = true;
      expect(err.message).toContain("Try again in");
      expect(err.message).toMatch(/Try again in \d+s/);
    }
    expect(caught).toBe(true);
  });

  it("resetRateLimits clears all counters", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(1);
    }
    resetRateLimits();
    expect(() => checkRateLimit(1)).not.toThrow();
  });

  it("tracks different route types independently per user", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(5);
    }
    expect(() => checkRateLimit(5)).toThrow("Rate limit exceeded");
    expect(() => checkRateLimit(5, { isLlmRoute: true })).not.toThrow();
  });

  it("does not leak counters across users", () => {
    for (let i = 0; i < 100; i++) {
      checkRateLimit(10);
    }
    expect(() => checkRateLimit(10)).toThrow("Rate limit exceeded");
    expect(() => checkRateLimit(11)).not.toThrow();
    expect(() => checkRateLimit(12)).not.toThrow();
  });
});
