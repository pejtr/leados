import { describe, it, expect, beforeEach } from "vitest";
import {
  normalizeSeverity,
  normalizeConfidence,
  deduplicateSignals,
  registerProvider,
  getProvider,
  getCachedSignals,
  setCachedSignals,
  invalidateCache,
} from "./signalProviders/index";
import type { GlobalSignal } from "@shared/globalSignals";

describe("normalizeSeverity", () => {
  it("maps numeric 9+ to critical", () => {
    expect(normalizeSeverity(9)).toBe("critical");
    expect(normalizeSeverity(10)).toBe("critical");
  });

  it("maps numeric 7-8 to high", () => {
    expect(normalizeSeverity(7)).toBe("high");
    expect(normalizeSeverity(8)).toBe("high");
  });

  it("maps numeric 4-6 to medium", () => {
    expect(normalizeSeverity(4)).toBe("medium");
    expect(normalizeSeverity(6)).toBe("medium");
  });

  it("maps numeric <4 to low", () => {
    expect(normalizeSeverity(0)).toBe("low");
    expect(normalizeSeverity(3)).toBe("low");
  });

  it("maps string 'critical' to critical", () => {
    expect(normalizeSeverity("critical")).toBe("critical");
  });

  it("maps string 'extreme' to critical", () => {
    expect(normalizeSeverity("extreme event")).toBe("critical");
  });

  it("maps string 'high' to high", () => {
    expect(normalizeSeverity("high")).toBe("high");
  });

  it("maps string 'major' to high", () => {
    expect(normalizeSeverity("major incident")).toBe("high");
  });

  it("maps string 'moderate' to medium", () => {
    expect(normalizeSeverity("moderate")).toBe("medium");
  });

  it("maps string 'warning' to medium", () => {
    expect(normalizeSeverity("warning")).toBe("medium");
  });

  it("maps unknown string to low", () => {
    expect(normalizeSeverity("info")).toBe("low");
  });

  it("is case-insensitive", () => {
    expect(normalizeSeverity("CRITICAL")).toBe("critical");
    expect(normalizeSeverity("High")).toBe("high");
  });
});

describe("normalizeConfidence", () => {
  it("returns 0-100 number from integer", () => {
    expect(normalizeConfidence(85)).toBe(85);
  });

  it("clamps above 100", () => {
    expect(normalizeConfidence(150)).toBe(100);
  });

  it("clamps below 0", () => {
    expect(normalizeConfidence(-10)).toBe(0);
  });

  it("rounds to integer", () => {
    expect(normalizeConfidence(85.7)).toBe(86);
  });

  it("parses string number", () => {
    expect(normalizeConfidence("85")).toBe(85);
  });

  it("auto-scales 0-1 string to 0-100", () => {
    expect(normalizeConfidence("0.85")).toBe(85);
  });

  it("rounds 0-1 number to nearest integer (no auto-scale for numbers)", () => {
    expect(normalizeConfidence(0.85)).toBe(1);
  });

  it("returns default 60 for unparseable input", () => {
    expect(normalizeConfidence("garbage")).toBe(60);
  });

  it("returns default 60 for null", () => {
    expect(normalizeConfidence(null)).toBe(60);
  });

  it("returns default 60 for undefined", () => {
    expect(normalizeConfidence(undefined)).toBe(60);
  });
});

describe("deduplicateSignals", () => {
  const makeSignal = (id: string, rawProvider: string, title: string): GlobalSignal => ({
    id,
    title,
    summary: "",
    category: "internet_outage",
    severity: "low",
    confidence: 50,
    status: "unverified",
    region: "",
    detectedAt: Date.now(),
    updatedAt: Date.now(),
    sourceName: "",
    sourceUrl: "",
    rawProvider,
    tags: [],
  });

  it("removes duplicates by rawProvider + title", () => {
    const a = makeSignal("1", "mock", "Same Title");
    const b = makeSignal("2", "mock", "Same Title");
    const result = deduplicateSignals([a, b]);
    expect(result).toHaveLength(1);
  });

  it("keeps distinct signals", () => {
    const a = makeSignal("1", "mock", "Title A");
    const b = makeSignal("2", "mock", "Title B");
    const result = deduplicateSignals([a, b]);
    expect(result).toHaveLength(2);
  });

  it("keeps signals from different providers with same title", () => {
    const a = makeSignal("1", "mock", "Same Title");
    const b = makeSignal("2", "world_monitor", "Same Title");
    const result = deduplicateSignals([a, b]);
    expect(result).toHaveLength(2);
  });

  it("returns empty array for empty input", () => {
    expect(deduplicateSignals([])).toEqual([]);
  });
});

describe("provider registry", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("registerProvider and getProvider round-trip", () => {
    const provider = { name: "Test", slug: "test" as any, fetchSignals: async () => [], isConfigured: () => false };
    registerProvider("mock" as any, provider);
    expect(getProvider("mock" as any)).toBe(provider);
  });

  it("getProvider returns undefined for unknown slug", () => {
    expect(getProvider("usgs" as any)).toBeUndefined();
  });
});

describe("signal cache", () => {
  beforeEach(() => {
    invalidateCache();
  });

  it("returns null when cache empty", () => {
    expect(getCachedSignals()).toBeNull();
  });

  it("returns cached signals after set", () => {
    const signals: GlobalSignal[] = [];
    setCachedSignals(signals, "test");
    const cached = getCachedSignals();
    expect(cached).not.toBeNull();
    expect(cached!.signals).toEqual(signals);
    expect(cached!.provider).toBe("test");
  });

  it("returns null after invalidateCache", () => {
    setCachedSignals([], "test");
    invalidateCache();
    expect(getCachedSignals()).toBeNull();
  });
});
