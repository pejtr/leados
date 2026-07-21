import { describe, it, expect } from "vitest";
import {
  CATEGORY_META,
  SEVERITY_META,
  STATUS_META,
} from "@shared/globalSignals";

describe("CATEGORY_META", () => {
  const expected = [
    "internet_outage",
    "cyber_threat",
    "natural_disaster",
    "infrastructure",
    "cables",
    "datacenter",
    "space_weather",
  ];

  for (const key of expected) {
    it(`has entry for ${key}`, () => {
      const entry = CATEGORY_META[key as keyof typeof CATEGORY_META];
      expect(entry).toBeDefined();
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.emoji).toBe("string");
      expect(entry.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  }

  it("has exactly 7 categories", () => {
    expect(Object.keys(CATEGORY_META)).toHaveLength(7);
  });
});

describe("SEVERITY_META", () => {
  const expected = ["low", "medium", "high", "critical"];

  for (const key of expected) {
    it(`has entry for ${key}`, () => {
      const entry = SEVERITY_META[key as keyof typeof SEVERITY_META];
      expect(entry).toBeDefined();
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.color).toBe("string");
      expect(typeof entry.bg).toBe("string");
    });
  }

  it("has exactly 4 severities", () => {
    expect(Object.keys(SEVERITY_META)).toHaveLength(4);
  });
});

describe("STATUS_META", () => {
  const expected = ["confirmed", "likely", "unverified"];

  for (const key of expected) {
    it(`has entry for ${key}`, () => {
      const entry = STATUS_META[key as keyof typeof STATUS_META];
      expect(entry).toBeDefined();
      expect(typeof entry.label).toBe("string");
      expect(typeof entry.color).toBe("string");
    });
  }

  it("has exactly 3 statuses", () => {
    expect(Object.keys(STATUS_META)).toHaveLength(3);
  });
});
