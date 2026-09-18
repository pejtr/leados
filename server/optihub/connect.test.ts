/**
 * OPTIHUB EDGE - /connect facade tests.
 *
 * `/connect` is a second *mount* of the canonical MCP runtime, not a second MCP
 * server: `POST /connect` must run the exact protected pipeline the REST and MCP
 * routes run. It exists only on the `mcp` surface, it never returns HTML, and the
 * `o` alias is a name - the credential stays authoritative.
 */

import { afterEach, describe, expect, it } from "vitest";

import { createAliasRegistry } from "./alias";
import { CONNECT_HEALTH_ROUTE_PATH, CONNECT_ROUTE_PATH } from "./connectFacade";
import { EDGE_MOUNT_PATH } from "./edge";
import { MCP_ROUTE_PATH } from "./mcp";
import {
  API_HOST,
  MCP_HOST,
  WWW_HOST,
  createEdgeHarness,
  edgeRequest,
  seedCredential,
  startEdgeServer,
  type EdgeHarness,
} from "./testing";

const INTERNAL_ID = "tenant-femsider";
const ALIAS = "femsidergrok";
const ALIASES = createAliasRegistry([[ALIAS, INTERNAL_ID]]);
const MCP_SURFACES = ["api", "mcp"] as const;
const MCP_ENDPOINT = `${EDGE_MOUNT_PATH}${MCP_ROUTE_PATH}`;

const openServers: Array<() => Promise<void>> = [];
afterEach(async () => {
  while (openServers.length > 0) {
    const close = openServers.pop();
    if (close) await close();
  }
});

async function withConnect(
  run: (harness: EdgeHarness, url: string, secret: string) => Promise<void>,
): Promise<void> {
  const harness = createEdgeHarness({
    enabledSurfaces: [...MCP_SURFACES],
    aliases: ALIASES,
  });
  const { secret } = await seedCredential(harness.store, {
    tenantId: INTERNAL_ID,
    actorId: ALIAS,
    scopes: ["projects:read"],
  });
  const server = await startEdgeServer(harness.app);
  openServers.push(server.close);
  await run(harness, server.url, secret);
}

function rpc(method: string, params?: unknown, id: unknown = 1): Record<string, unknown> {
  return { jsonrpc: "2.0", id, method, ...(params === undefined ? {} : { params }) };
}

function textOf(body: unknown): unknown {
  const result = (body as { result?: { content?: Array<{ text?: string }> } }).result;
  const text = result?.content?.[0]?.text;
  return typeof text === "string" ? JSON.parse(text) : undefined;
}

function bearer(secret: string): Record<string, string> {
  return { authorization: `Bearer ${secret}` };
}

describe("GET /health", () => {
  it("identifies the MCP service on the mcp surface, never the SPA", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, CONNECT_HEALTH_ROUTE_PATH, { host: MCP_HOST });
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toMatchObject({
        status: "ok",
        service: "optihub-edge",
        transport: "streamable-http",
        endpoint: CONNECT_ROUTE_PATH,
      });
    });
  });

  it("reports not_ready when readiness fails", async () => {
    const harness = createEdgeHarness({
      enabledSurfaces: [...MCP_SURFACES],
      aliases: ALIASES,
      readiness: () => false,
    });
    const server = await startEdgeServer(harness.app);
    openServers.push(server.close);
    const response = await edgeRequest(server.url, CONNECT_HEALTH_ROUTE_PATH, { host: MCP_HOST });
    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({ status: "not_ready" });
  });

  it("does not answer for other hostnames", async () => {
    await withConnect(async (_harness, url) => {
      for (const host of [API_HOST, WWW_HOST]) {
        const response = await edgeRequest(url, CONNECT_HEALTH_ROUTE_PATH, { host });
        expect(response.status, host).not.toBe(200);
      }
    });
  });
});

describe("GET /connect presentation", () => {
  it("returns a safe JSON presentation, never HTML", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, CONNECT_ROUTE_PATH, { host: MCP_HOST });
      expect(response.status).toBe(200);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toMatchObject({
        service: "optihub-edge",
        protocol: "MCP",
        transport: "streamable-http",
        endpoint: CONNECT_ROUTE_PATH,
        auth: { scheme: "Bearer", queryTokenForbidden: true },
      });
      expect(JSON.stringify(response.body)).not.toContain("<html");
    });
  });

  it("recognizes a known alias without leaking the internal identity", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=${ALIAS}`, {
        host: MCP_HOST,
      });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ connection: { alias: ALIAS, accessState: "KNOWN" } });
      expect(JSON.stringify(response.body)).not.toContain(INTERNAL_ID);
    });
  });

  it("presents an unknown alias exactly like no alias at all", async () => {
    await withConnect(async (_harness, url) => {
      const none = await edgeRequest(url, CONNECT_ROUTE_PATH, { host: MCP_HOST });
      const unknown = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=nobody`, { host: MCP_HOST });
      const strip = (body: unknown) => ({ ...(body as Record<string, unknown>), requestId: "x" });
      expect(unknown.status).toBe(200);
      expect(strip(unknown.body)).toEqual(strip(none.body));
    });
  });

  it("rejects a malformed alias with the machine contract", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=ACME`, { host: MCP_HOST });
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { code: "BAD_REQUEST", reason: "malformed_alias" } });
    });
  });

  it("lists the read-only tools including test_connect", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, CONNECT_ROUTE_PATH, { host: MCP_HOST });
      expect((response.body as { tools: string[] }).tools).toEqual([
        "optihub_context",
        "optihub_manifest",
        "optihub_readiness",
        "omni_tool_catalog",
        "omni_tool_route",
        "omni_tool_probe",
        "omni_tool_read",
        "test_connect",
      ]);
    });
  });
});

describe("POST /connect is the canonical MCP runtime", () => {
  it("requires a credential", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, CONNECT_ROUTE_PATH, {
        method: "POST",
        host: MCP_HOST,
        body: rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: "femsidergrok", version: "1.0.0" },
        }),
      });
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: { code: "MISSING_CREDENTIAL" } });
    });
  });

  it("completes initialize, sets mcp-session-id and lists eight tools", async () => {
    await withConnect(async (_harness, url, secret) => {
      const init = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=${ALIAS}`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body: rpc("initialize", {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: { name: ALIAS, version: "1.0.0" },
        }),
      });
      expect(init.status).toBe(200);
      expect(typeof init.headers["mcp-session-id"]).toBe("string");
      expect(init.body).toMatchObject({
        jsonrpc: "2.0",
        result: { protocolVersion: "2025-06-18", serverInfo: { name: "optihub-mcp" } },
      });

      const list = await edgeRequest(url, CONNECT_ROUTE_PATH, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body: rpc("tools/list"),
      });
      const tools = (list.body as { result: { tools: Array<{ name: string }> } }).result.tools;
      expect(tools.map(tool => tool.name)).toContain("test_connect");
      expect(tools).toHaveLength(8);
    });
  });

  it("runs test_connect read-only and echo-verified", async () => {
    await withConnect(async (_harness, url, secret) => {
      const response = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=${ALIAS}`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body: rpc("tools/call", {
          name: "test_connect",
          arguments: {
            requestId: "femsider-grok-001",
            message: "Hello OPTIHUB from FEMSIDER Grok",
            client: ALIAS,
          },
        }),
      });
      expect(response.status).toBe(200);
      expect(textOf(response.body)).toEqual({
        ok: true,
        connection: "verified",
        requestId: "femsider-grok-001",
        message: "Hello OPTIHUB from FEMSIDER Grok",
        client: ALIAS,
        server: "optihub-mcp",
        billable: false,
        mutations: 0,
      });
    });
  });

  it("fails closed when the alias identity does not match the credential", async () => {
    await withConnect(async (_harness, url, secret) => {
      const response = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=somebody-else`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body: rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} }),
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "TENANT_DENIED", reason: "alias_identity_mismatch" } });
    });
  });

  it("answers unknown and mismatched aliases identically (no enumeration oracle)", async () => {
    await withConnect(async (_harness, url, secret) => {
      const body = rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} });
      const unknown = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=nobody`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body,
      });
      const mismatch = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=another-tenant`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body,
      });
      expect(unknown.status).toBe(403);
      expect(mismatch.status).toBe(403);
      expect((unknown.body as { error: { reason: string } }).error.reason).toBe(
        (mismatch.body as { error: { reason: string } }).error.reason,
      );
    });
  });

  it("keeps the core MCP route alias-aware as well", async () => {
    await withConnect(async (_harness, url, secret) => {
      const response = await edgeRequest(url, `${MCP_ENDPOINT}?o=another-tenant`, {
        method: "POST",
        host: MCP_HOST,
        headers: bearer(secret),
        body: rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} }),
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { reason: "alias_identity_mismatch" } });
    });
  });

  it("does not serve /connect on a non-mcp surface", async () => {
    await withConnect(async (_harness, url, secret) => {
      const response = await edgeRequest(url, CONNECT_ROUTE_PATH, {
        method: "POST",
        host: API_HOST,
        headers: bearer(secret),
        body: rpc("initialize", { protocolVersion: "2025-06-18", capabilities: {} }),
      });
      expect(response.status).toBe(404);
    });
  });
});

describe("DELETE /connect", () => {
  it("is an authenticated no-op (the runtime is stateless)", async () => {
    await withConnect(async (_harness, url, secret) => {
      const response = await edgeRequest(url, `${CONNECT_ROUTE_PATH}?o=${ALIAS}`, {
        method: "DELETE",
        host: MCP_HOST,
        headers: bearer(secret),
      });
      expect(response.status).toBe(204);
    });
  });

  it("still requires a credential", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, CONNECT_ROUTE_PATH, {
        method: "DELETE",
        host: MCP_HOST,
      });
      expect(response.status).toBe(401);
    });
  });
});

describe("mcp surface never falls through to the SPA", () => {
  it("answers unknown mcp-host paths with the JSON contract", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, "/some/browser/route", { host: MCP_HOST });
      expect(response.status).toBe(404);
      expect(response.headers["content-type"]).toContain("application/json");
      expect(response.body).toMatchObject({ error: { code: "NOT_FOUND" } });
    });
  });

  it("leaves other hostnames untouched", async () => {
    await withConnect(async (_harness, url) => {
      const response = await edgeRequest(url, "/some/browser/route", { host: API_HOST });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: { code: "NOT_FOUND", message: "not_found" } });
    });
  });
});
