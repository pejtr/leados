import { describe, it, expect } from "vitest";
import { mockProvider } from "./signalProviders/mockProvider";

describe("mockProvider", () => {
  it("has name 'Mock Data (Demo)'", () => {
    expect(mockProvider.name).toBe("Mock Data (Demo)");
  });

  it("has slug 'mock'", () => {
    expect(mockProvider.slug).toBe("mock");
  });

  it("isConfigured returns true", () => {
    expect(mockProvider.isConfigured()).toBe(true);
  });

  it("fetchSignals returns array of signals", async () => {
    const signals = await mockProvider.fetchSignals();
    expect(Array.isArray(signals)).toBe(true);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.length).toBe(15);
  });

  it("each signal has required fields", async () => {
    const signals = await mockProvider.fetchSignals();
    for (const s of signals) {
      expect(s.id).toBeTruthy();
      expect(s.title).toBeTruthy();
      expect(s.summary).toBeTruthy();
      expect(s.category).toMatch(/^(internet_outage|cyber_threat|natural_disaster|infrastructure|cables|datacenter|space_weather)$/);
      expect(s.severity).toMatch(/^(low|medium|high|critical)$/);
      expect(typeof s.confidence).toBe("number");
      expect(s.confidence).toBeGreaterThanOrEqual(0);
      expect(s.confidence).toBeLessThanOrEqual(100);
      expect(s.status).toMatch(/^(confirmed|likely|unverified)$/);
      expect(s.region).toBeTruthy();
      expect(s.detectedAt).toBeGreaterThan(0);
      expect(s.updatedAt).toBeGreaterThan(0);
      expect(s.sourceName).toBeTruthy();
      expect(s.sourceUrl).toBeTruthy();
      expect(s.rawProvider).toBe("mock");
      expect(Array.isArray(s.tags)).toBe(true);
    }
  });

  it("covers all 7 categories", async () => {
    const signals = await mockProvider.fetchSignals();
    const categories = new Set(signals.map((s) => s.category));
    expect(categories.size).toBe(7);
  });

  it("covers all 4 severities", async () => {
    const signals = await mockProvider.fetchSignals();
    const severities = new Set(signals.map((s) => s.severity));
    expect(severities).toContain("low");
    expect(severities).toContain("medium");
    expect(severities).toContain("high");
    expect(severities).toContain("critical");
  });

  it("all signals have unique ids", async () => {
    const signals = await mockProvider.fetchSignals();
    const ids = signals.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
