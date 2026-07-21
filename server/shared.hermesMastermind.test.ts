import { describe, it, expect } from "vitest";
import {
  HERMES_EXPERTS,
  buildMastermindPrompt,
  getExpert,
  DEFAULT_MASTERMIND_IDS,
} from "@shared/hermesMastermind";

describe("HERMES_EXPERTS", () => {
  it("has 8 experts", () => {
    expect(HERMES_EXPERTS).toHaveLength(8);
  });

  it("has unique ids", () => {
    const ids = HERMES_EXPERTS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const expert of HERMES_EXPERTS) {
    it(`${expert.name} has all required fields`, () => {
      expect(expert.id).toBeTruthy();
      expect(expert.name).toBeTruthy();
      expect(expert.title).toBeTruthy();
      expect(expert.emoji).toBeTruthy();
      expect(expert.color).toMatch(/^oklch/);
      expect(expert.philosophy).toBeTruthy();
      expect(expert.focusAreas.length).toBeGreaterThan(0);
      expect(expert.systemPrompt).toBeTruthy();
      expect(expert.books.length).toBeGreaterThan(0);
    });
  }
});

describe("getExpert", () => {
  it("returns expert by id", () => {
    const e = getExpert("hormozi");
    expect(e).toBeDefined();
    expect(e!.name).toBe("Alex Hormozi");
  });

  it("returns undefined for unknown id", () => {
    expect(getExpert("nonexistent")).toBeUndefined();
  });
});

describe("buildMastermindPrompt", () => {
  it("returns fallback prompt when no experts selected", () => {
    const prompt = buildMastermindPrompt([]);
    expect(prompt).toContain("HERMES");
    expect(prompt).toContain("business advisor");
  });

  it("returns single expert prompt when one expert selected", () => {
    const prompt = buildMastermindPrompt(["hormozi"]);
    expect(prompt).toContain("Alex Hormozi");
    expect(prompt).not.toContain("HERMES MASTERMIND");
  });

  it("combines multiple expert prompts", () => {
    const prompt = buildMastermindPrompt(["hormozi", "kennedy"]);
    expect(prompt).toContain("HERMES MASTERMIND");
    expect(prompt).toContain("Alex Hormozi");
    expect(prompt).toContain("Dan Kennedy");
    expect(prompt).toContain("HERMES SYNTHESIS");
  });

  it("includes user context when provided (multi-expert)", () => {
    const prompt = buildMastermindPrompt(["hormozi", "kennedy"], "My business is a bakery");
    expect(prompt).toContain("My business is a bakery");
  });

  it("does not include user context when omitted", () => {
    const prompt = buildMastermindPrompt(["godin"]);
    expect(prompt).not.toContain("## Context");
  });
});

describe("DEFAULT_MASTERMIND_IDS", () => {
  it("has 4 expert ids", () => {
    expect(DEFAULT_MASTERMIND_IDS).toHaveLength(4);
  });

  it("all ids exist in HERMES_EXPERTS", () => {
    const ids = new Set(HERMES_EXPERTS.map((e) => e.id));
    for (const id of DEFAULT_MASTERMIND_IDS) {
      expect(ids.has(id)).toBe(true);
    }
  });
});
