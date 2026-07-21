import { describe, it, expect } from "vitest";
import {
  commandCenterTemplates,
  getCommandCenterFieldSuggestions,
  getCommandCenterTemplate,
  localAcquisitionIndustryOptions,
  targetMarketOptions,
  commandCenterCategoryLabels,
} from "../shared/commandCenterTemplates";

describe("Command Center Templates", () => {
  describe("commandCenterTemplates", () => {
    it("contains at least 5 templates", () => {
      expect(commandCenterTemplates.length).toBeGreaterThanOrEqual(5);
    });

    it("every template has a unique id", () => {
      const ids = commandCenterTemplates.map(t => t.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every template has required fields", () => {
      for (const t of commandCenterTemplates) {
        expect(t.id).toBeTruthy();
        expect(t.title).toBeTruthy();
        expect(t.description).toBeTruthy();
        expect(t.category).toBeTruthy();
        expect(t.status).toBeTruthy();
        expect(t.icon).toBeTruthy();
        expect(Array.isArray(t.agentIds)).toBe(true);
        expect(Array.isArray(t.fields)).toBe(true);
        expect(Array.isArray(t.outputs)).toBe(true);
        expect(Array.isArray(t.steps)).toBe(true);
        expect(t.prompt).toBeTruthy();
      }
    });

    it("every template has valid category", () => {
      const validCategories = ["acquisition", "sales", "content", "operations", "profit"];
      for (const t of commandCenterTemplates) {
        expect(validCategories).toContain(t.category);
      }
    });

    it("every template has valid status", () => {
      const validStatuses = ["live", "guided", "roadmap"];
      for (const t of commandCenterTemplates) {
        expect(validStatuses).toContain(t.status);
      }
    });

    it("every template has non-empty fields with key and label", () => {
      for (const t of commandCenterTemplates) {
        expect(t.fields.length).toBeGreaterThan(0);
        for (const field of t.fields) {
          expect(field.key).toBeTruthy();
          expect(field.label).toBeTruthy();
        }
      }
    });
  });

  describe("getCommandCenterTemplate", () => {
    it("returns a template by id", () => {
      const first = commandCenterTemplates[0]!;
      const found = getCommandCenterTemplate(first.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(first.id);
    });

    it("returns undefined for unknown id", () => {
      expect(getCommandCenterTemplate("nonexistent")).toBeUndefined();
    });
  });

  describe("getCommandCenterFieldSuggestions", () => {
    it("returns non-empty suggestions for each field in each template", () => {
      for (const t of commandCenterTemplates) {
        for (const field of t.fields) {
          const suggestions = getCommandCenterFieldSuggestions(field);
          expect(Array.isArray(suggestions)).toBe(true);
          expect(suggestions.length).toBeGreaterThan(0);
          for (const s of suggestions) {
            expect(s.value).toBeTruthy();
            expect(s.label).toBeTruthy();
          }
        }
      }
    });
  });

  describe("localAcquisitionIndustryOptions", () => {
    it("contains at least 20 Czech local industries", () => {
      expect(localAcquisitionIndustryOptions.length).toBeGreaterThanOrEqual(20);
    });

    it("every option has value and label", () => {
      for (const opt of localAcquisitionIndustryOptions) {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
      }
    });

    it("contains common Czech industries", () => {
      const values = localAcquisitionIndustryOptions.map(o => o.value);
      expect(values).toContain("restaurace");
      expect(values).toContain("kadeřnictví");
    });
  });

  describe("targetMarketOptions", () => {
    it("contains at least 12 target markets", () => {
      expect(targetMarketOptions.length).toBeGreaterThanOrEqual(12);
    });

    it("includes CZ, SK, DE, AT, PL, UK, US", () => {
      const values = targetMarketOptions.map(o => o.value);
      expect(values).toEqual(expect.arrayContaining(["CZ", "SK", "DE", "AT", "PL", "UK", "US"]));
    });

    it("every option has value and label", () => {
      for (const opt of targetMarketOptions) {
        expect(opt.value).toBeTruthy();
        expect(opt.label).toBeTruthy();
      }
    });
  });

  describe("commandCenterCategoryLabels", () => {
    it("has labels for all categories", () => {
      expect(commandCenterCategoryLabels.acquisition).toBeTruthy();
      expect(commandCenterCategoryLabels.sales).toBeTruthy();
      expect(commandCenterCategoryLabels.content).toBeTruthy();
      expect(commandCenterCategoryLabels.operations).toBeTruthy();
      expect(commandCenterCategoryLabels.profit).toBeTruthy();
    });
  });
});
