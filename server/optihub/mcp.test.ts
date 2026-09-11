/**
 * OPTIHUB EDGE - MCP surface tests (P2.0).
 *
 * The MCP endpoint must be an ordinary protected edge request: the same origin
 * auth, credential, tenant, scope, policy, rate-limit and audit controls apply,
 * and it must be impossible to reach it (or the REST routes) from the wrong
 * surface. Only read-only capabilities are exposed.
 */

import { afterEach, describe, expect, it } from "vitest";

import { EDGE_MOUNT_PATH } from "./edge";
import { MCP_PROTOCOL_VERSION, MCP_ROUTE_PATH, MCP_TOOLS, defaultMcpEdgeRoutes } from "./mcp";
import { EDGE_POLICY_ACTIONS } from "./policy";
import {
  API_HOST,
  MCP_HOST,
  createEdgeHarness,
  edgeRequest,
  seedCredential,
  startEdgeServer,
  type EdgeHarness,
} from "./testing";

const MCP_ENDPOINT = `${EDGE_MOUNT_PATH}${MCP_ROUTE_PATH}`;
const MCP_SURFACES = ["api", "mcp"] as const;

const openServers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (openServers.length > 0) {
    const close = openServers.pop();
    if (close) await close();
  }
});

async function withMcp(
  run: (harness: EdgeHarness, url: string) => Promise<void>,
  overrides: Parameters<typeof createEdgeHarness>[0] = {},
): Promise<void> {
  const harness = createEdgeHarness({ enabledSurfaces: [...MCP_SURFACES], ...overrides });
  const server = await startEdgeServer(harness.app);
  openServers.push(server.close);
  await run(harness, server.url);
}

function rpc(method: string, params?: unknown, id: unknown = 1): Record<string, unknown> {
  return { jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) };
}

function textOf(body: unknown): unknown {
  const result = (body as { result?: { content?: Array<{ text?: string }> } }).result;
  const text = result?.content?.[0]?.text;
  return typeof text === "string" ? JSON.parse(text) : undefined;
}

describe("mcp route definition", () => {
  it("exposes only read-risk, mcp-bound routes with a known policy action", () => {
    const routes = defaultMcpEdgeRoutes({
      version: "test-build",
      endpoint: MCP_ENDPOINT,
      manifest: () => ({}),
      readiness: async () => true,
    });

    expect(routes.map(route => route.method).sort()).toEqual(["get", "post"]);
    for (const route of routes) {
      expect(route.action).toBe("mcp:rpc");
      expect(route.risk).toBe("read");
      expect(route.requiredScope).toBe("projects:read");
      expect(route.surfaces).toEqual(["mcp"]);
      expect(EDGE_POLICY_ACTIONS).toContain(route.policyAction);
    }
  });

  it("catalogs only read-only tools", () => {
    expect(MCP_TOOLS.map(tool => tool.name)).toEqual([
      "optihub_context",
      "optihub_manifest",
      "optihub_readiness",
    ]);
  });
});

describe("mcp surface binding", () => {
  it("is not reachable on the REST (api) surface", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const res = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: API_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
        body: rpc("tools/list"),
      });
      expect(res.status).toBe(404);
      expect((res.body as { error: { code: string } }).error.code).toBe("NOT_FOUND");
    });
  });

  it("does not expose REST routes on the mcp surface", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const res = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/context`, {
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
      });
      expect(res.status).toBe(404);
      expect((res.body as { error: { code: string } }).error.code).toBe("NOT_FOUND");
    });
  });

  it("does not expose the write capability on the mcp surface", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["publication:execute"] });
      const res = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/publications/pub-1/execute`, {
        method: "POST",
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
      });
      expect(res.status).toBe(404);
    });
  });

  it("stays unreachable when the surface is disabled", async () => {
    await withMcp(
      async (_harness, url) => {
        const res = await edgeRequest(url, MCP_ENDPOINT, { method: "POST", host: MCP_HOST, body: rpc("tools/list") });
        expect(res.status).toBe(501);
        expect((res.body as { error: { code: string } }).error.code).toBe("SURFACE_NOT_ENABLED");
      },
      { enabledSurfaces: ["api"] },
    );
  });
});

describe("mcp reuses the protected pipeline", () => {
  it("requires a credential", async () => {
    await withMcp(async (_harness, url) => {
      const res = await edgeRequest(url, MCP_ENDPOINT, { method: "POST", host: MCP_HOST, body: rpc("tools/list") });
      expect(res.status).toBe(401);
      expect((res.body as { error: { code: string } }).error.code).toBe("MISSING_CREDENTIAL");
    });
  });

  it("denies a credential without the read scope", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["publication:read"] });
      const res = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
        body: rpc("tools/list"),
      });
      expect(res.status).toBe(403);
      expect((res.body as { error: { code: string } }).error.code).toBe("SCOPE_DENIED");
    });
  });

  it("denies a cross-tenant request", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const res = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: {
          authorization: `Bearer ${credential.secret}`,
          "x-optihub-tenant": "tenant-other",
        },
        body: rpc("tools/list"),
      });
      expect(res.status).toBe(403);
      expect((res.body as { error: { code: string } }).error.code).toBe("TENANT_DENIED");
    });
  });

  it("audits an allowed MCP call as an mcp:rpc read", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
        body: rpc("tools/list"),
      });
      const last = harness.audit.entries[harness.audit.entries.length - 1];
      expect(last?.decision).toBe("ALLOW");
      expect(last?.action).toBe("mcp:rpc");
      expect(last?.surface).toBe("mcp");
      expect(JSON.stringify(harness.audit.entries)).not.toContain(credential.secret);
    });
  });
});

describe("mcp protocol", () => {
  it("initializes and lists the read-only tools", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const auth = { authorization: `Bearer ${credential.secret}` };

      const init = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: auth,
        body: rpc("initialize", { protocolVersion: MCP_PROTOCOL_VERSION }),
      });
      expect(init.status).toBe(200);
      expect((init.body as { result: { protocolVersion: string } }).result.protocolVersion).toBe(
        MCP_PROTOCOL_VERSION,
      );

      const list = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: auth,
        body: rpc("tools/list"),
      });
      const tools = (list.body as { result: { tools: Array<{ name: string }> } }).result.tools;
      expect(tools.map(tool => tool.name)).toEqual([
        "optihub_context",
        "optihub_manifest",
        "optihub_readiness",
      ]);
    });
  });

  it("calls the read-only tools", async () => {
    await withMcp(
      async (harness, url) => {
        const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
        const auth = { authorization: `Bearer ${credential.secret}` };

        const context = await edgeRequest(url, MCP_ENDPOINT, {
          method: "POST",
          host: MCP_HOST,
          headers: auth,
          body: rpc("tools/call", { name: "optihub_context", arguments: {} }),
        });
        const identity = textOf(context.body) as {
          tenantId: string;
          actorId: string;
          scopes: string[];
          policyVersion: string;
        };
        expect(identity.tenantId).toBe("tenant-alpha");
        expect(identity.actorId).toBe("actor-alpha");
        expect(identity.scopes).toEqual(["projects:read"]);
        expect(identity.policyVersion).toBeTruthy();

        const manifest = await edgeRequest(url, MCP_ENDPOINT, {
          method: "POST",
          host: MCP_HOST,
          headers: auth,
          body: rpc("tools/call", { name: "optihub_manifest", arguments: {} }),
        });
        expect((textOf(manifest.body) as { surfaces: unknown[] }).surfaces.length).toBeGreaterThan(0);

        const readiness = await edgeRequest(url, MCP_ENDPOINT, {
          method: "POST",
          host: MCP_HOST,
          headers: auth,
          body: rpc("tools/call", { name: "optihub_readiness", arguments: {} }),
        });
        expect((textOf(readiness.body) as { status: string }).status).toBe("ready");
      },
      { readiness: () => true },
    );
  });

  it("answers a notification with 202 and no body", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const res = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
        body: { jsonrpc: "2.0", method: "notifications/initialized" },
      });
      expect(res.status).toBe(202);
      expect(res.body).toBeNull();
    });
  });

  it("rejects an unknown method and an unknown tool without leaking", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const auth = { authorization: `Bearer ${credential.secret}` };

      const method = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: auth,
        body: rpc("tools/execute"),
      });
      expect((method.body as { error: { code: number } }).error.code).toBe(-32601);

      const tool = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: auth,
        body: rpc("tools/call", { name: "optihub_write_everything" }),
      });
      expect((tool.body as { error: { code: number } }).error.code).toBe(-32602);

      const invalid = await edgeRequest(url, MCP_ENDPOINT, {
        method: "POST",
        host: MCP_HOST,
        headers: auth,
        body: { jsonrpc: "2.0", id: 3 },
      });
      expect((invalid.body as { error: { code: number } }).error.code).toBe(-32600);
    });
  });

  it("describes itself over GET", async () => {
    await withMcp(async (harness, url) => {
      const credential = await seedCredential(harness.store, { scopes: ["projects:read"] });
      const res = await edgeRequest(url, MCP_ENDPOINT, {
        host: MCP_HOST,
        headers: { authorization: `Bearer ${credential.secret}` },
      });
      expect(res.status).toBe(200);
      expect((res.body as { tools: string[] }).tools).toEqual([
        "optihub_context",
        "optihub_manifest",
        "optihub_readiness",
      ]);
    });
  });
});
