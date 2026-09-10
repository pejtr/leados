import { describe, expect, it } from "vitest";
import {
  getOptiHubIngressSurface,
  isForbiddenDirectOnyxHostname,
  machineGatewayContextFields,
  optihubIngressSurfaces,
  optimateoPaymentBoundary,
  privateOnyxServices,
  type OptiHubEdgeControl,
} from "../shared/optihubBoundary";

const protectedControls: OptiHubEdgeControl[] = [
  "authentication",
  "tenant_resolution",
  "scope_authorization",
  "policy_evaluation",
  "rate_limiting",
  "audit_logging",
];

describe("OPTIHUB public edge and private ONYX boundary", () => {
  it("publishes only the four canonical OPTIHUB entrypoints", () => {
    expect(optihubIngressSurfaces.map(surface => surface.hostname)).toEqual([
      "www.optihub.cz",
      "app.optihub.cz",
      "api.optihub.cz",
      "mcp.optihub.cz",
    ]);
  });

  it("resolves host headers and URLs without accepting unknown subdomains", () => {
    expect(getOptiHubIngressSurface("MCP.OPTIHUB.CZ:443")?.id).toBe("mcp");
    expect(
      getOptiHubIngressSurface("https://app.optihub.cz/dashboard")?.id
    ).toBe("app");
    expect(getOptiHubIngressSurface("onyxos.optihub.cz")).toBeUndefined();
  });

  it("requires auth, tenant, scope, policy, rate limit and audit at protected edges", () => {
    for (const surface of optihubIngressSurfaces.filter(
      candidate => candidate.id !== "www"
    )) {
      expect(surface.requiredControls).toEqual(protectedControls);
    }
  });

  it("keeps every ONYX capability service private", () => {
    expect(privateOnyxServices.length).toBeGreaterThan(0);
    for (const service of privateOnyxServices) {
      expect(service.exposure).toBe("private");
      expect(service.publicHostname).toBeNull();
    }
    expect(isForbiddenDirectOnyxHostname("onyxos.optihub.cz")).toBe(true);
    expect(isForbiddenDirectOnyxHostname("mcp.optihub.cz")).toBe(false);
  });

  it("requires canonical identity and policy context for machine requests", () => {
    expect(machineGatewayContextFields).toEqual([
      "requestId",
      "tenantId",
      "actorId",
      "scopes",
      "policyVersion",
    ]);
  });

  it("keeps payments outside the OPTIHUB gateway namespace", () => {
    expect(
      getOptiHubIngressSurface(optimateoPaymentBoundary.hostname)
    ).toBeUndefined();
    expect(optimateoPaymentBoundary).toMatchObject({
      hostname: "pay.optimateo.com",
      service: "onyx-pay",
      provider: "comgate",
    });
  });
});
