import { describe, it, expect } from "vitest";
import { calculateConfidence } from "./sourceDataHarmonizer";

describe("calculateConfidence", () => {
  it("returns 0.9 for manual ingestion with no age or verification", () => {
    expect(calculateConfidence("manual", 0, 0)).toBe(0.9);
  });

  it("returns 0.85 for webhook ingestion with no age or verification", () => {
    expect(calculateConfidence("webhook", 0, 0)).toBe(0.85);
  });

  it("returns 0.8 for api ingestion with no age or verification", () => {
    expect(calculateConfidence("api", 0, 0)).toBe(0.8);
  });

  it("returns 0.4 for scrape ingestion with no age or verification", () => {
    expect(calculateConfidence("scrape", 0, 0)).toBe(0.4);
  });

  it("applies age penalty correctly", () => {
    const base = calculateConfidence("api", 0, 0);
    const aged = calculateConfidence("api", 60, 0);
    expect(aged).toBeLessThan(base);
    expect(aged).toBeCloseTo(base - 0.3, 2);
  });

  it("applies verification bonus correctly", () => {
    const base = calculateConfidence("manual", 0, 0);
    const verified = calculateConfidence("manual", 0, 3);
    expect(verified).toBeGreaterThan(base);
    expect(verified).toBeCloseTo(base + 0.15, 2);
  });

  it("caps verification bonus at 0.15", () => {
    const result = calculateConfidence("manual", 0, 100);
    expect(result).toBeCloseTo(0.9 + 0.15, 2);
  });

  it("returns 0.5 for unknown method with no modifiers", () => {
    expect(calculateConfidence("unknown", 0, 0)).toBe(0.5);
  });

  it("never returns negative values", () => {
    const result = calculateConfidence("scrape", 365, 0);
    expect(result).toBeGreaterThanOrEqual(0);
  });
});
