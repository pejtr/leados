import { describe, it, expect } from "vitest";
import { BRAIN_CONFIGS_PUBLIC } from "./computerFlow";
import type { BrainLayer } from "./computerFlow";

describe("BRAIN_CONFIGS_PUBLIC", () => {
  const config = BRAIN_CONFIGS_PUBLIC;
  const expectedLayers: BrainLayer[] = [
    "scout",
    "analyst",
    "strategist",
    "deep_think",
    "synthesizer",
  ];

  it("has 5 brain layers", () => {
    expect(Object.keys(config)).toHaveLength(5);
  });

  for (const layer of expectedLayers) {
    describe(`${layer} layer`, () => {
      const cfg = config[layer];

      it("has a thinkingBudget", () => {
        expect(typeof cfg.thinkingBudget).toBe("number");
        expect(cfg.thinkingBudget).toBeGreaterThan(0);
      });

      it("has a label", () => {
        expect(typeof cfg.label).toBe("string");
        expect(cfg.label.length).toBeGreaterThan(0);
      });

      it("has an emoji", () => {
        expect(typeof cfg.emoji).toBe("string");
      });

      it("has an oklch color", () => {
        expect(cfg.color).toMatch(/^oklch/);
      });
    });
  }

  it("scout has lowest thinkingBudget", () => {
    const budgets = Object.values(config).map((c) => c.thinkingBudget);
    expect(Math.min(...budgets)).toBe(config.scout.thinkingBudget);
  });

  it("deep_think has highest thinkingBudget", () => {
    const budgets = Object.values(config).map((c) => c.thinkingBudget);
    expect(Math.max(...budgets)).toBe(config.deep_think.thinkingBudget);
  });
});
