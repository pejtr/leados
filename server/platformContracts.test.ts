import { describe, it, expect } from "vitest";
import {
  getPlatformIntegrationPoints,
  createPlatformIntegrationArtifacts,
} from "../shared/platformIntegrationContracts";

describe("Platform Integration Contracts", () => {
  const VALID_TEMPLATE_IDS = [
    "profit-ai-reception",
    "profit-eshop-autopilot",
    "profit-reputation-monitor",
    "profit-content-revenue-loop",
    "profit-affiliate-content",
    "profit-digital-products",
    "image-asset-pack",
    "website-chatbot",
    "social-calendar",
    "ugc-ad-pack",
    "video-repurpose",
  ];

  describe("getPlatformIntegrationPoints", () => {
    it("returns a non-empty array for valid template id", () => {
      const points = getPlatformIntegrationPoints("profit-ai-reception");
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
    });

    it("returns empty array for unknown template id", () => {
      const points = getPlatformIntegrationPoints("nonexistent");
      expect(points).toEqual([]);
    });

    it("every point has required fields", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        for (const p of points) {
          expect(p.id).toBeTruthy();
          expect(p.platform).toBeTruthy();
          expect(p.label).toBeTruthy();
          expect(p.description).toBeTruthy();
          expect(p.transport).toBeTruthy();
          expect(p.state).toBeTruthy();
          expect(Array.isArray(p.requiredInputs)).toBe(true);
          expect(Array.isArray(p.outputs)).toBe(true);
          expect(p.ownerBoundary).toBeTruthy();
        }
      }
    });

    it("every point has valid transport type", () => {
      const validTransports = ["local_route", "mcp_tool", "domain_event"];
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        for (const p of points) {
          expect(validTransports).toContain(p.transport);
        }
      }
    });

    it("every point has valid state", () => {
      const validStates = ["available", "contract_ready", "blocked"];
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        for (const p of points) {
          expect(validStates).toContain(p.state);
        }
      }
    });

    it("local_route points have route defined", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        const localRoutes = points.filter(p => p.transport === "local_route");
        for (const p of localRoutes) {
          expect(p.route).toBeTruthy();
        }
      }
    });

    it("mcp_tool points have toolName defined", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        const mcpTools = points.filter(p => p.transport === "mcp_tool");
        for (const p of mcpTools) {
          expect(p.toolName).toBeTruthy();
        }
      }
    });

    it("domain_event points have eventName defined", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        const events = points.filter(p => p.transport === "domain_event");
        for (const p of events) {
          expect(p.eventName).toBeTruthy();
        }
      }
    });

    it("every point has at least one required input and one output", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        for (const p of points) {
          expect(p.requiredInputs.length).toBeGreaterThanOrEqual(1);
          expect(p.outputs.length).toBeGreaterThanOrEqual(1);
        }
      }
    });

    it("every point has unique id within a template", () => {
      for (const templateId of VALID_TEMPLATE_IDS) {
        const points = getPlatformIntegrationPoints(templateId);
        const ids = points.map(p => p.id);
        expect(new Set(ids).size).toBe(ids.length);
      }
    });
  });

  describe("createPlatformIntegrationArtifacts", () => {
    it("returns artifacts for a valid template id", () => {
      const artifacts = createPlatformIntegrationArtifacts("profit-ai-reception", Date.now());
      expect(Array.isArray(artifacts)).toBe(true);
      expect(artifacts.length).toBeGreaterThan(0);
    });

    it("every artifact has pointId and type", () => {
      const artifacts = createPlatformIntegrationArtifacts("website-chatbot", Date.now());
      for (const a of artifacts) {
        expect(a.id).toBeTruthy();
        expect(a.type).toBeTruthy();
        expect(a.title).toBeTruthy();
        expect(a.description).toBeTruthy();
      }
    });

    it("returns empty array for unknown template id", () => {
      const artifacts = createPlatformIntegrationArtifacts("nonexistent", Date.now());
      expect(artifacts).toEqual([]);
    });
  });
});
