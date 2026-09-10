import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  isForbiddenDirectOnyxHostname,
  optimateoPaymentBoundary,
  privateOnyxServices,
} from "../../shared/optihubBoundary";
import { EDGE_CREDENTIAL_PREFIX, isEdgeSecretFormat } from "./credentials";
import { EDGE_MOUNT_PATH, buildManifest, resolveEdgeSurface } from "./edge";
import { createEdgeHarness } from "./testing";

const entrypointSource = readFileSync(new URL("../_core/index.ts", import.meta.url), "utf8");
const edgeSource = readFileSync(new URL("./edge.ts", import.meta.url), "utf8");

describe("edge is mounted in the runtime entrypoint", () => {
  it("imports and awaits the edge runtime registration", () => {
    expect(entrypointSource).toMatch(/from "\.\.\/optihub\/runtime"/);
    expect(entrypointSource).toMatch(/await registerOptiHubEdgeRuntime\(app\)/);
  });

  it("mounts the edge before tRPC, before the SPA fallback and before the 50mb parser", () => {
    const edgeIndex = entrypointSource.indexOf("registerOptiHubEdgeRuntime(app)");
    const trpcIndex = entrypointSource.indexOf('"/api/trpc"');
    const staticIndex = entrypointSource.indexOf("serveStatic(app)");
    const viteIndex = entrypointSource.indexOf("setupVite(app, server)");
    const uploadParserIndex = entrypointSource.indexOf('express.json({ limit: "50mb" })');

    expect(edgeIndex).toBeGreaterThan(-1);
    expect(trpcIndex).toBeGreaterThan(-1);
    expect(staticIndex).toBeGreaterThan(-1);
    expect(viteIndex).toBeGreaterThan(-1);
    expect(uploadParserIndex).toBeGreaterThan(-1);
    expect(edgeIndex).toBeLessThan(trpcIndex);
    expect(edgeIndex).toBeLessThan(staticIndex);
    expect(edgeIndex).toBeLessThan(viteIndex);
    expect(edgeIndex).toBeLessThan(uploadParserIndex);
  });

  it("does not mount the legacy hub or external API as a bypass", () => {
    expect(entrypointSource).not.toMatch(/registerHubRoute/);
    expect(entrypointSource).not.toMatch(/registerExternalApi/);
    expect(entrypointSource).not.toMatch(/from "\.\.\/hubRoute"/);
    expect(entrypointSource).not.toMatch(/from "\.\.\/externalApi"/);
  });

  it("mounts the edge at the documented path", () => {
    expect(EDGE_MOUNT_PATH).toBe("/api/optihub");
  });
});

describe("edge cannot proxy into private ONYX services", () => {
  it("contains no outbound request primitive", () => {
    expect(edgeSource).not.toMatch(/\baxios\b/);
    expect(edgeSource).not.toMatch(/http\.request/);
    expect(edgeSource).not.toMatch(/https\.request/);
    expect(edgeSource).not.toMatch(/\bfetch\(/);
    expect(edgeSource).not.toMatch(/createProxyMiddleware/);
    expect(edgeSource).not.toMatch(/http-proxy/);
  });

  it("has no public hostname for any private ONYX service", () => {
    for (const service of privateOnyxServices) {
      expect(service.exposure).toBe("private");
      expect(service.publicHostname).toBeNull();
    }
  });

  it("treats any direct ONYX hostname as forbidden", () => {
    expect(isForbiddenDirectOnyxHostname("onyx.optihub.cz")).toBe(true);
    expect(isForbiddenDirectOnyxHostname("onyx-core.optihub.cz")).toBe(true);
    expect(isForbiddenDirectOnyxHostname("api.optihub.cz")).toBe(false);

    const resolution = resolveEdgeSurface("onyx-core.optihub.cz", { enabledSurfaces: ["api"] });
    expect(resolution.kind).toBe("forbidden");
  });

  it("does not treat mcp as an enabled P1 surface", () => {
    expect(resolveEdgeSurface("mcp.optihub.cz", { enabledSurfaces: ["api"] }).kind).toBe("disabled");
  });
});

describe("edge manifest and payment boundary keep secrets out", () => {
  it("does not leak private service or payment identifiers", () => {
    const manifest = JSON.stringify(buildManifest(createEdgeHarness().deps));
    expect(manifest).not.toMatch(/onyx-router|onyx-core|omnicore|omniads/i);
    expect(manifest).not.toContain(optimateoPaymentBoundary.hostname);
    expect(manifest).not.toMatch(/comgate/i);
    expect(manifest).not.toMatch(/DATABASE_URL|JWT_SECRET|STRIPE_SECRET/i);
  });

  it("only accepts edge-prefixed credentials, so payment secrets cannot be used", () => {
    expect(EDGE_CREDENTIAL_PREFIX).toBe("ohk_");
    // A Comgate merchant secret is not an edge credential and never enters the pipeline.
    expect(isEdgeSecretFormat("comgate-merchant-secret")).toBe(false);
    expect(isEdgeSecretFormat(optimateoPaymentBoundary.provider)).toBe(false);
    expect(optimateoPaymentBoundary.hostname).not.toBe("api.optihub.cz");
  });
});
