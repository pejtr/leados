import { describe, it, expect } from "vitest";
import { AI_PERSONAS, getPersonaById, DEFAULT_PERSONA_ID } from "./aiPersonas";

describe("AI Personas", () => {
  describe("AI_PERSONAS registry", () => {
    it("contains at least 8 personas", () => {
      expect(AI_PERSONAS.length).toBeGreaterThanOrEqual(8);
    });

    it("every persona has a unique id", () => {
      const ids = AI_PERSONAS.map(p => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every persona has required fields", () => {
      for (const persona of AI_PERSONAS) {
        expect(persona.id).toBeTruthy();
        expect(persona.name).toBeTruthy();
        expect(persona.title).toBeTruthy();
        expect(persona.specialty).toBeTruthy();
        expect(persona.emoji).toBeTruthy();
        expect(persona.color).toBeTruthy();
        expect(persona.tags.length).toBeGreaterThan(0);
        expect(persona.category).toBeTruthy();
        expect(typeof persona.systemPrompt).toBe("function");
      }
    });

    it("every persona has a valid category", () => {
      const validCategories = ["Sales & Business", "Wealth & Finance", "Leadership"];
      for (const persona of AI_PERSONAS) {
        expect(validCategories).toContain(persona.category);
      }
    });

    it("every persona has valid tier or undefined", () => {
      const validTiers = ["free", "gold", "diamond"];
      for (const persona of AI_PERSONAS) {
        if (persona.tier !== undefined) {
          expect(validTiers).toContain(persona.tier);
        }
      }
    });

    it("generates a non-empty system prompt for each persona", () => {
      for (const persona of AI_PERSONAS) {
        const prompt = persona.systemPrompt("Test platform context");
        expect(typeof prompt).toBe("string");
        expect(prompt.length).toBeGreaterThan(50);
      }
    });

    it("system prompt includes persona name", () => {
      for (const persona of AI_PERSONAS) {
        const prompt = persona.systemPrompt("");
        expect(prompt.toLowerCase()).toContain(persona.name.toLowerCase());
      }
    });

    it("includes alex_hormozi persona", () => {
      expect(AI_PERSONAS.some(p => p.id === "alex_hormozi")).toBe(true);
    });

    it("includes jordan_belfort persona", () => {
      expect(AI_PERSONAS.some(p => p.id === "jordan_belfort")).toBe(true);
    });
  });

  describe("getPersonaById", () => {
    it("returns the correct persona by id", () => {
      const persona = getPersonaById("alex_hormozi");
      expect(persona).toBeDefined();
      expect(persona!.id).toBe("alex_hormozi");
      expect(persona!.name).toBeTruthy();
    });

    it("returns undefined for unknown id", () => {
      expect(getPersonaById("nonexistent")).toBeUndefined();
    });

    it("returns undefined for empty string", () => {
      expect(getPersonaById("")).toBeUndefined();
    });
  });

  describe("DEFAULT_PERSONA_ID", () => {
    it("is defined and matches an existing persona", () => {
      expect(DEFAULT_PERSONA_ID).toBeTruthy();
      expect(getPersonaById(DEFAULT_PERSONA_ID)).toBeDefined();
    });
  });
});
