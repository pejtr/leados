import { describe, it, expect } from "vitest";
import {
  profitEngines,
  profitEngineStateLabels,
  type ProfitEngine,
  type ProfitEngineId,
  type ProfitEngineState,
} from "../shared/profitAutopilot";

describe("Profit Autopilot", () => {
  describe("profitEngines", () => {
    it("contains at least 5 profit engines", () => {
      expect(profitEngines.length).toBeGreaterThanOrEqual(5);
    });

    it("every engine has required fields", () => {
      for (const engine of profitEngines) {
        expect(engine.id).toBeTruthy();
        expect(engine.templateId).toBeTruthy();
        expect(typeof engine.priority).toBe("number");
        expect(engine.title).toBeTruthy();
        expect(engine.shortTitle).toBeTruthy();
        expect(engine.description).toBeTruthy();
        expect(engine.state).toBeTruthy();
        expect(engine.targetAutomation).toBeTruthy();
        expect(engine.revenueType).toBeTruthy();
        expect(engine.pricing).toBeTruthy();
        expect(engine.pricing.setup).toBeTruthy();
        expect(engine.pricing.recurring).toBeTruthy();
        expect(engine.firstOffer).toBeTruthy();
        expect(Array.isArray(engine.currentEvidence)).toBe(true);
        expect(Array.isArray(engine.blockers)).toBe(true);
        expect(Array.isArray(engine.risks)).toBe(true);
        expect(Array.isArray(engine.stages)).toBe(true);
      }
    });

    it("every engine has unique id", () => {
      const ids = profitEngines.map(e => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every engine has unique templateId", () => {
      const ids = profitEngines.map(e => e.templateId);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("every engine has valid state", () => {
      const validStates: ProfitEngineState[] = ["guided", "integration_required", "planned"];
      for (const engine of profitEngines) {
        expect(validStates).toContain(engine.state);
      }
    });

    it("every engine has at least 2 stages", () => {
      for (const engine of profitEngines) {
        expect(engine.stages.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("every stage has required fields", () => {
      for (const engine of profitEngines) {
        for (const stage of engine.stages) {
          expect(stage.id).toBeTruthy();
          expect(stage.title).toBeTruthy();
          expect(stage.owner).toBeTruthy();
          expect(stage.mode).toBeTruthy();
          expect(stage.evidence).toBeTruthy();
        }
      }
    });

    it("every stage has valid automation mode", () => {
      const validModes = ["automatic", "approval", "blocked"];
      for (const engine of profitEngines) {
        for (const stage of engine.stages) {
          expect(validModes).toContain(stage.mode);
        }
      }
    });

    it("audit-to-revenue engine exists with correct structure", () => {
      const engine = profitEngines.find(e => e.id === "audit-to-revenue");
      expect(engine).toBeDefined();
      expect(engine!.stages.length).toBeGreaterThanOrEqual(5);
      expect(engine!.state).toBe("guided");
    });

    it("ai-reception engine exists", () => {
      const engine = profitEngines.find(e => e.id === "ai-reception");
      expect(engine).toBeDefined();
      expect(engine!.templateId).toBe("profit-ai-reception");
    });
  });

  describe("profitEngineStateLabels", () => {
    it("has labels for all states", () => {
      expect(profitEngineStateLabels.guided).toBeTruthy();
      expect(profitEngineStateLabels.integration_required).toBeTruthy();
      expect(profitEngineStateLabels.planned).toBeTruthy();
    });

    it("labels are in Czech", () => {
      expect(profitEngineStateLabels.guided.toLowerCase()).toContain("řízený");
    });
  });
});
