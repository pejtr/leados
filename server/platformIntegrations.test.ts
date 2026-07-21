import { describe, expect, it } from "vitest";
import {
  commandCenterTemplates,
  getCommandCenterFieldSuggestions,
  getCommandCenterTemplate,
  localAcquisitionIndustryOptions,
  targetMarketOptions,
} from "../shared/commandCenterTemplates";
import {
  createPlatformIntegrationArtifacts,
  getPlatformIntegrationPoints,
} from "../shared/platformIntegrationContracts";

describe("Platform integration contracts", () => {
  it("provides suggestions for every command center field", () => {
    for (const template of commandCenterTemplates) {
      for (const field of template.fields) {
        expect(
          getCommandCenterFieldSuggestions(field).length,
          `${template.id}.${field.key}`
        ).toBeGreaterThan(0);
      }
    }
  });

  it("provides Czech and international target markets", () => {
    expect(targetMarketOptions.map(option => option.value)).toEqual(
      expect.arrayContaining(["CZ", "SK", "DE", "AT", "PL", "UK", "US"])
    );
    expect(targetMarketOptions.length).toBeGreaterThanOrEqual(12);

    const marketField = getCommandCenterTemplate(
      "local-growth-system"
    )?.fields.find(field => field.key === "market");
    expect(marketField?.allowCustom).not.toBe(true);
    expect(marketField?.options?.length).toBe(targetMarketOptions.length);
  });

  it("covers common and specialist Czech local industries", () => {
    const industries = localAcquisitionIndustryOptions.map(
      option => option.value
    );

    expect(industries).toEqual(
      expect.arrayContaining([
        "elektrikáři",
        "hodinový manžel",
        "realitní makléři",
        "kominictví",
        "geodeti",
      ])
    );
    expect(localAcquisitionIndustryOptions.length).toBeGreaterThanOrEqual(60);
  });

  it("connects requested modules to a local route or explicit contract", () => {
    const templateIds = [
      "profit-ai-reception",
      "profit-eshop-autopilot",
      "profit-reputation-monitor",
      "profit-content-revenue-loop",
      "image-asset-pack",
      "website-chatbot",
      "social-calendar",
    ];

    for (const templateId of templateIds) {
      const points = getPlatformIntegrationPoints(templateId);
      expect(points.length, templateId).toBeGreaterThan(0);

      for (const point of points) {
        expect(point.requiredInputs.length, point.id).toBeGreaterThan(0);
        expect(point.outputs.length, point.id).toBeGreaterThan(0);
        if (point.transport === "local_route") expect(point.route).toBeTruthy();
        if (point.transport === "mcp_tool") expect(point.toolName).toBeTruthy();
        if (point.transport === "domain_event")
          expect(point.eventName).toBeTruthy();
      }
    }
  });

  it("routes media creation to OMNIVIDEO and publishing to FORGE", () => {
    const points = getPlatformIntegrationPoints("profit-content-revenue-loop");
    expect(
      points.some(
        point =>
          point.platform === "omnivideo" &&
          point.toolName === "omnivideo.project.create"
      )
    ).toBe(true);
    expect(
      points.some(
        point =>
          point.platform === "forge" && point.eventName === "FinalVideoReady.v1"
      )
    ).toBe(true);
  });

  it("connects YouTube and Patreon to the global earnings ledger", () => {
    const points = getPlatformIntegrationPoints("profit-content-revenue-loop");
    expect(points.some(point => point.platform === "youtube")).toBe(true);
    expect(points.some(point => point.platform === "patreon")).toBe(true);
    expect(points.some(point => point.route === "/global-earnings")).toBe(true);
  });

  it("creates actionable and contract workflow artifacts", () => {
    const artifacts = createPlatformIntegrationArtifacts(
      "profit-content-revenue-loop",
      123
    );
    expect(new Set(artifacts.map(artifact => artifact.id)).size).toBe(
      artifacts.length
    );
    expect(artifacts.some(artifact => artifact.type === "action")).toBe(true);
    expect(
      artifacts.some(artifact => artifact.type === "integration_contract")
    ).toBe(true);
  });
});
