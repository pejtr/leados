/**
 * OPTIHUB EDGE - real runtime boot test.
 *
 * Boots the actual `server/_core/index.ts` entrypoint (`createApp`) on an
 * ephemeral port, against a real MySQL, and drives HTTP through it. This is not a
 * source assertion: the process really listens and really answers.
 */

import type { Express } from "express";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Pool, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../_core/index";
import { EDGE_INTERNAL_REQUEST_ID_HEADER } from "./correlation";
import {
  createOptiHubTestPool,
  ensureOptiHubTestDatabase,
  optiHubTestDatabaseUrl,
  resetOptiHubTestTables,
} from "./mysql/testDatabase";
import { provisionEdgeCredential, type EdgeCredentialSecret } from "./provisioning";
import type { EdgeRuntimeHandle } from "./runtime";
import { API_HOST, edgeRequest } from "./testing";

const databaseUrl = optiHubTestDatabaseUrl(process.env, "boot");

interface BootedApp {
  readonly app: Express;
  readonly baseUrl: string;
  readonly server: Server;
  readonly edge: EdgeRuntimeHandle;
}

async function bootApp(): Promise<BootedApp> {
  const created = await createApp({ serveFrontend: false });
  await new Promise<void>((resolve, reject) => {
    created.server.once("error", reject);
    created.server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = created.server.address() as AddressInfo;
  return {
    app: created.app,
    baseUrl: `http://127.0.0.1:${address.port}`,
    server: created.server,
    edge: created.edge,
  };
}

async function stopApp(app: BootedApp): Promise<void> {
  await new Promise<void>(resolve => app.server.close(() => resolve()));
  await app.edge.close();
}

/** Middleware order as it exists in the running Express app. */
function middlewareIndexes(app: Express): { edgeIndex: number; parserIndex: number } {
  const stack =
    (app as unknown as { _router?: { stack: Array<{ name?: string; regexp?: RegExp }> } })._router
      ?.stack ?? [];
  const edgeIndex = stack.findIndex(
    layer => layer.name === "router" && layer.regexp?.test("/api/optihub") === true,
  );
  const parserIndex = stack.findIndex(layer => layer.name === "jsonParser");
  return { edgeIndex, parserIndex };
}

let pool: Pool;
let primary: BootedApp;
let policyOff: BootedApp;
let readCred: EdgeCredentialSecret;
let execCred: EdgeCredentialSecret;
let rateCred: EdgeCredentialSecret;
let policyCred: EdgeCredentialSecret;
let savedEnv: Record<string, string | undefined> = {};

beforeAll(async () => {
  await ensureOptiHubTestDatabase(databaseUrl);
  pool = createOptiHubTestPool(databaseUrl);
  await resetOptiHubTestTables(pool);

  savedEnv = {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    OPTIHUB_TRUSTED_PROXIES: process.env.OPTIHUB_TRUSTED_PROXIES,
    OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED:
      process.env.OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED,
  };
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = "test";
  delete process.env.OPTIHUB_TRUSTED_PROXIES;

  process.env.OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED = "true";
  primary = await bootApp();

  process.env.OPTIHUB_EDGE_PUBLICATION_EXECUTE_ENABLED = "false";
  policyOff = await bootApp();

  const store = primary.edge.deps.store;
  readCred = await provisionEdgeCredential(store, {
    tenantId: "tenant-boot",
    actorId: "actor-boot",
    scopes: ["projects:read"],
  });
  execCred = await provisionEdgeCredential(store, {
    tenantId: "tenant-boot",
    actorId: "actor-exec",
    scopes: ["publication:execute"],
  });
  rateCred = await provisionEdgeCredential(store, {
    tenantId: "tenant-boot",
    actorId: "actor-rate",
    scopes: ["publication:execute"],
  });
  policyCred = await provisionEdgeCredential(policyOff.edge.deps.store, {
    tenantId: "tenant-boot",
    actorId: "actor-policy",
    scopes: ["publication:execute"],
  });
}, 60_000);

afterAll(async () => {
  await stopApp(primary);
  await stopApp(policyOff);
  await pool.end();
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("real runtime boot", () => {
  it("mounts the edge before the app-wide JSON parser", () => {
    const { edgeIndex, parserIndex } = middlewareIndexes(primary.app);
    expect(edgeIndex).toBeGreaterThanOrEqual(0);
    expect(parserIndex).toBeGreaterThan(edgeIndex);
  });

  it("answers health through the real entrypoint", async () => {
    const response = await edgeRequest(primary.baseUrl, "/api/optihub/health", {
      host: API_HOST,
    });
    expect(response.status).toBe(200);
    expect((response.body as { service: string }).service).toBe("optihub-edge");
  });

  it("answers unknown edge routes with the edge contract", async () => {
    const response = await edgeRequest(primary.baseUrl, "/api/optihub/v1/does-not-exist", {
      host: API_HOST,
    });
    expect(response.status).toBe(404);
    expect((response.body as { error: { code: string } }).error.code).toBe("NOT_FOUND");
  });

  it("rejects an invalid credential with 401", async () => {
    const response = await edgeRequest(primary.baseUrl, "/api/optihub/v1/context", {
      host: API_HOST,
      headers: { authorization: `Bearer ohk_${"a".repeat(43)}` },
    });
    expect(response.status).toBe(401);
    expect((response.body as { error: { code: string } }).error.code).toBe("INVALID_CREDENTIAL");
  });

  it("allows a valid credential and derives the tenant from it", async () => {
    const response = await edgeRequest<{ tenantId: string; actorId: string }>(
      primary.baseUrl,
      "/api/optihub/v1/context",
      { host: API_HOST, headers: { authorization: `Bearer ${readCred.secret}` } },
    );
    expect(response.status).toBe(200);
    expect(response.body.tenantId).toBe("tenant-boot");
    expect(response.body.actorId).toBe("actor-boot");
  });

  it("denies a tenant mismatch", async () => {
    const response = await edgeRequest(primary.baseUrl, "/api/optihub/v1/context", {
      host: API_HOST,
      headers: {
        authorization: `Bearer ${readCred.secret}`,
        "x-optihub-tenant": "tenant-other",
      },
    });
    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe("TENANT_DENIED");
  });

  it("denies a missing scope", async () => {
    const response = await edgeRequest(
      primary.baseUrl,
      "/api/optihub/v1/publications/pub-1/execute",
      {
        method: "POST",
        host: API_HOST,
        headers: { authorization: `Bearer ${readCred.secret}` },
        body: {},
      },
    );
    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe("SCOPE_DENIED");
  });

  it("denies by policy when execution is disabled", async () => {
    const response = await edgeRequest(
      policyOff.baseUrl,
      "/api/optihub/v1/publications/pub-1/execute",
      {
        method: "POST",
        host: API_HOST,
        headers: { authorization: `Bearer ${policyCred.secret}` },
        body: {},
      },
    );
    expect(response.status).toBe(403);
    expect((response.body as { error: { code: string } }).error.code).toBe("POLICY_DENIED");
  });

  it("executes a permitted action and records an allow", async () => {
    const response = await edgeRequest<{ ok: boolean; requestId: string }>(
      primary.baseUrl,
      "/api/optihub/v1/publications/pub-1/execute",
      {
        method: "POST",
        host: API_HOST,
        headers: { authorization: `Bearer ${execCred.secret}` },
        body: {},
      },
    );
    expect(response.status).toBe(202);
    expect(response.body.ok).toBe(true);

    const requestId = response.headers[EDGE_INTERNAL_REQUEST_ID_HEADER];
    expect(typeof requestId).toBe("string");
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT decision, code, tenantId, credentialId FROM optihub_edge_audit WHERE requestId = ?",
      [requestId],
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.some(row => row["decision"] === "ALLOW")).toBe(true);
    expect(rows.every(row => row["tenantId"] === "tenant-boot")).toBe(true);
  });

  it("enforces the shared rate limit on the real stack", async () => {
    const path = "/api/optihub/v1/publications/pub-rate/execute";
    const options = {
      method: "POST" as const,
      host: API_HOST,
      headers: { authorization: `Bearer ${rateCred.secret}` },
      body: {},
    };
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const allowed = await edgeRequest(primary.baseUrl, path, options);
      expect(allowed.status).toBe(202);
    }
    const denied = await edgeRequest(primary.baseUrl, path, options);
    expect(denied.status).toBe(429);
    expect((denied.body as { error: { code: string } }).error.code).toBe("RATE_LIMITED");
    expect(denied.headers["retry-after"]).toBeDefined();
  }, 30_000);

  it("persists the audit trail and never stores raw secrets in it", async () => {
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM optihub_edge_audit");
    expect(rows.length).toBeGreaterThan(0);
    const serialized = JSON.stringify(rows);
    for (const secret of [readCred.secret, execCred.secret, rateCred.secret, policyCred.secret]) {
      expect(serialized).not.toContain(secret);
    }
    // Correlation ids are present, so a request can be traced end to end.
    expect(rows.every(row => typeof row["requestId"] === "string")).toBe(true);
  });

  it("rejects an oversized edge body with the edge contract before the handler", async () => {
    const oversized = JSON.stringify({ data: "x".repeat(100 * 1024) });
    const response = await edgeRequest(
      primary.baseUrl,
      "/api/optihub/v1/publications/pub-1/execute",
      {
        method: "POST",
        host: API_HOST,
        headers: { authorization: `Bearer ${execCred.secret}` },
        rawBody: oversized,
      },
    );
    // The global parser allows 50mb; the edge's own 64kb limit rejects first.
    expect(response.status).toBe(413);
    expect((response.body as { error: { code: string } }).error.code).toBe("PAYLOAD_TOO_LARGE");
  }, 20_000);
});
