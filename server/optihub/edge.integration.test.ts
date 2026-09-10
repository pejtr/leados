import { afterEach, describe, expect, it } from "vitest";

import { EDGE_INTERNAL_REQUEST_ID_HEADER } from "./correlation";
import { EDGE_MOUNT_PATH, type EdgeHandlerContext, type ProtectedEdgeRoute } from "./edge";
import type { EdgeAuditRecord } from "./audit";
import {
  API_HOST,
  APP_HOST,
  FORBIDDEN_ONYX_HOST,
  MCP_HOST,
  UNKNOWN_HOST,
  WWW_HOST,
  createEdgeHarness,
  edgeRequest,
  seedCredential,
  startEdgeServer,
  type EdgeHarness,
  type HarnessOverrides,
} from "./testing";

const HARNESS_STORE = "tenant-alpha";

const openServers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (openServers.length > 0) {
    const close = openServers.pop();
    if (close) await close();
  }
});

async function withHarness<T>(
  overrides: HarnessOverrides,
  run: (harness: EdgeHarness, url: string) => Promise<T>,
  options: Parameters<typeof createEdgeHarness>[1] = {},
): Promise<T> {
  const harness = createEdgeHarness(overrides, options);
  const server = await startEdgeServer(harness.app);
  openServers.push(server.close);
  return run(harness, server.url);
}

interface Spy {
  readonly calls: EdgeHandlerContext[];
  readonly handler: (context: EdgeHandlerContext) => { ok: true };
}

function spy(): Spy {
  const calls: EdgeHandlerContext[] = [];
  return {
    calls,
    handler: context => {
      calls.push(context);
      return { ok: true };
    },
  };
}

function probeRoute(handler: Spy["handler"], overrides: Partial<ProtectedEdgeRoute> = {}): ProtectedEdgeRoute {
  return {
    method: "get",
    path: "/v1/probe",
    action: "projects:read",
    requiredScope: "projects:read",
    handler,
    ...overrides,
  };
}

function lastAudit(harness: EdgeHarness): EdgeAuditRecord | undefined {
  return harness.audit.entries[harness.audit.entries.length - 1];
}

function auditJson(harness: EdgeHarness): string {
  return JSON.stringify(harness.audit.entries);
}

describe("edge public surface", () => {
  it("serves health and readiness without exposing topology", async () => {
    await withHarness({}, async (_harness, url) => {
      const health = await edgeRequest(url, `${EDGE_MOUNT_PATH}/health`);
      expect(health.status).toBe(200);
      expect(health.body).toMatchObject({ status: "ok", service: "optihub-edge", version: "test-build" });
      const serialized = JSON.stringify(health.body);
      expect(serialized).not.toMatch(/onyx|comgate|stripe|secret|DATABASE_URL/i);

      const ready = await edgeRequest(url, `${EDGE_MOUNT_PATH}/ready`);
      expect(ready.status).toBe(200);
      expect(ready.body).toMatchObject({ status: "ready" });
    });
  });

  it("reports not-ready as 503 when readiness fails", async () => {
    await withHarness({ readiness: () => false }, async (_harness, url) => {
      const ready = await edgeRequest(url, `${EDGE_MOUNT_PATH}/ready`);
      expect(ready.status).toBe(503);
      expect(ready.body).toMatchObject({ status: "not_ready" });
    });
  });

  it("publishes a versioned manifest with mcp explicitly not enabled", async () => {
    await withHarness({}, async (_harness, url) => {
      const response = await edgeRequest<Record<string, unknown>>(url, `${EDGE_MOUNT_PATH}/v1/manifest`);
      expect(response.status).toBe(200);
      expect(response.body["service"]).toBe("optihub-edge");
      expect(response.body["apiVersion"]).toBe("v1");
      const surfaces = response.body["surfaces"] as Array<{ id: string; status: string }>;
      const byId = Object.fromEntries(surfaces.map(surface => [surface.id, surface.status]));
      expect(byId["api"]).toBe("available");
      expect(byId["mcp"]).toBe("not_enabled");
      expect(byId["app"]).toBe("not_enabled");
      const serialized = JSON.stringify(response.body);
      expect(serialized).not.toMatch(/comgate|stripe|DATABASE_URL|JWT_SECRET/i);
    });
  });

  it("host-gates the manifest but keeps health/readiness reachable for platform checks", async () => {
    await withHarness({}, async (_harness, url) => {
      const manifestOnMcp = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/manifest`, { host: MCP_HOST });
      expect(manifestOnMcp.status).toBe(501);
      expect(manifestOnMcp.body).toMatchObject({ error: { code: "SURFACE_NOT_ENABLED" } });

      const healthOnPlatformHost = await edgeRequest(url, `${EDGE_MOUNT_PATH}/health`, {
        host: UNKNOWN_HOST,
      });
      expect(healthOnPlatformHost.status).toBe(200);
      expect(healthOnPlatformHost.body).toMatchObject({ status: "ok" });

      const healthOnForbidden = await edgeRequest(url, `${EDGE_MOUNT_PATH}/health`, {
        host: FORBIDDEN_ONYX_HOST,
      });
      expect(healthOnForbidden.status).toBe(403);
      expect(healthOnForbidden.body).toMatchObject({ error: { code: "HOST_DENIED" } });
    });
  });
});

describe("edge surface gate (invariants A, K, L)", () => {
  it("denies a direct ONYX hostname before any handler runs", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        host: FORBIDDEN_ONYX_HOST,
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "HOST_DENIED", reason: "forbidden_onyx_hostname" } });
      expect(probe.calls).toHaveLength(0);
      expect(lastAudit(harness)?.decision).toBe("DENY");
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("denies an unknown host", async () => {
    const probe = spy();
    await withHarness({}, async (_harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, { host: UNKNOWN_HOST });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "HOST_DENIED", reason: "unknown_host" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("does not activate mcp, app or www as a bypass in P1", async () => {
    const probe = spy();
    for (const host of [MCP_HOST, APP_HOST, WWW_HOST]) {
      await withHarness({}, async (_harness, url) => {
        const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, { host });
        expect(response.status).toBe(501);
        expect(response.body).toMatchObject({ error: { code: "SURFACE_NOT_ENABLED" } });
        expect(probe.calls).toHaveLength(0);
      }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
    }
  });
});

describe("edge credential pipeline (invariant B)", () => {
  it("denies a missing credential", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`);
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: { code: "MISSING_CREDENTIAL" } });
      expect(probe.calls).toHaveLength(0);
      expect(lastAudit(harness)?.code).toBe("MISSING_CREDENTIAL");
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("denies a malformed or unknown credential", async () => {
    const probe = spy();
    await withHarness({}, async (_harness, url) => {
      const malformed = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: "Bearer not-an-edge-secret" },
      });
      expect(malformed.status).toBe(401);
      expect(malformed.body).toMatchObject({ error: { code: "INVALID_CREDENTIAL" } });

      const unknown = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ohk_${"a".repeat(48)}` },
      });
      expect(unknown.status).toBe(401);
      expect(unknown.body).toMatchObject({ error: { code: "INVALID_CREDENTIAL" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("denies a revoked credential", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const { revokeEdgeCredential } = await import("./provisioning");
      await revokeEdgeCredential(harness.store, seeded.id, harness.clock.now);

      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: { code: "REVOKED_CREDENTIAL" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("denies an expired credential", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["projects:read"], expiresAt: harness.clock.now - 1 },
        harness.clock.now,
      );
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({ error: { code: "EXPIRED_CREDENTIAL" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("allows a valid credential and audits the decision", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ ok: true });
      expect(probe.calls).toHaveLength(1);
      const audit = lastAudit(harness);
      expect(audit?.decision).toBe("ALLOW");
      expect(audit?.tenantId).toBe(HARNESS_STORE);
      expect(audit?.credentialId).toBe(seeded.id);
      expect(audit?.status).toBe(200);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });
});

describe("edge scope and tenant controls (invariants E, F, G)", () => {
  it("denies a credential that lacks the required scope", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["content:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "SCOPE_DENIED" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("denies a cross-tenant request from header, body or query", async () => {
    interface CrossTenantAttempt {
      method: "POST";
      path?: string;
      headers?: Record<string, string>;
      body?: unknown;
    }
    const attempts: CrossTenantAttempt[] = [
      { method: "POST", headers: { "x-optihub-tenant": "tenant-beta" } },
      { method: "POST", body: { tenantId: "tenant-beta" } },
      { method: "POST", body: { tenant_id: "tenant-beta" } },
      { method: "POST", path: `${EDGE_MOUNT_PATH}/v1/probe?tenantId=tenant-beta` },
      { method: "POST", path: `${EDGE_MOUNT_PATH}/v1/probe?tenant_id=tenant-beta` },
    ];

    for (const attempt of attempts) {
      const probe = spy();
      await withHarness({}, async (harness, url) => {
        const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
        const response = await edgeRequest(url, attempt.path ?? `${EDGE_MOUNT_PATH}/v1/probe`, {
          method: attempt.method,
          body: attempt.body,
          headers: { authorization: `Bearer ${seeded.secret}`, ...attempt.headers },
        });
        expect(response.status).toBe(403);
        expect(response.body).toMatchObject({ error: { code: "TENANT_DENIED" } });
        expect(probe.calls).toHaveLength(0);
      }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler, { method: "post" })] });
    }
  });

  it("denies a policy resource bound to another tenant", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "TENANT_DENIED", reason: "resource_tenant_mismatch" } });
      expect(probe.calls).toHaveLength(0);
    }, {
      publicRoutes: [],
      protectedRoutes: [probeRoute(probe.handler, { resolveResource: () => ({ tenantId: "tenant-beta" }) })],
    });
  });

  it("allows a matching tenant", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        method: "POST",
        headers: { authorization: `Bearer ${seeded.secret}`, "x-optihub-tenant": HARNESS_STORE },
        body: { tenantId: HARNESS_STORE },
      });
      expect(response.status).toBe(200);
      expect(probe.calls).toHaveLength(1);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler, { method: "post" })] });
  });
});

describe("edge policy gate (invariant D)", () => {
  it("fails publication execution closed and never reaches the handler", async () => {
    const probe = spy();
    await withHarness({ publicationExecuteEnabled: false }, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["publication:execute"] },
        harness.clock.now,
      );
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        method: "POST",
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "POLICY_DENIED", reason: "publication_execute_disabled" } });
      expect(probe.calls).toHaveLength(0);
    }, {
      publicRoutes: [],
      protectedRoutes: [
        probeRoute(probe.handler, {
          method: "post",
          action: "publication:execute",
          requiredScope: "publication:execute",
          policyAction: "publication:execute",
        }),
      ],
    });
  });

  it("allows publication execution when explicitly enabled", async () => {
    const probe = spy();
    await withHarness({ publicationExecuteEnabled: true }, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["publication:execute"] },
        harness.clock.now,
      );
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        method: "POST",
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(200);
      expect(probe.calls).toHaveLength(1);
    }, {
      publicRoutes: [],
      protectedRoutes: [
        probeRoute(probe.handler, {
          method: "post",
          action: "publication:execute",
          requiredScope: "publication:execute",
          policyAction: "publication:execute",
        }),
      ],
    });
  });

  it("uses the real default publication route", async () => {
    await withHarness({ publicationExecuteEnabled: true }, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["publication:execute"] },
        harness.clock.now,
      );
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/publications/pub-1/execute`, {
        method: "POST",
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(202);
      expect(response.body).toMatchObject({ capability: "publication:execute", executed: false });
      expect(lastAudit(harness)?.status).toBe(202);
    });
  });

  it("denies an unknown action", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({ error: { code: "POLICY_DENIED", reason: "unknown_action" } });
      expect(probe.calls).toHaveLength(0);
    }, {
      publicRoutes: [],
      protectedRoutes: [probeRoute(probe.handler, { action: "database:drop" })],
    });
  });
});

describe("edge rate limiting (invariant G)", () => {
  it("denies with 429 and Retry-After after the budget is exhausted", async () => {
    await withHarness({ publicationExecuteEnabled: true }, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["publication:execute"] },
        harness.clock.now,
      );
      const call = () =>
        edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/publications/pub-1/execute`, {
          method: "POST",
          headers: { authorization: `Bearer ${seeded.secret}` },
        });

      for (let i = 0; i < 10; i += 1) {
        expect((await call()).status).toBe(202);
      }
      const limited = await call();
      expect(limited.status).toBe(429);
      expect(limited.body).toMatchObject({ error: { code: "RATE_LIMITED" } });
      expect(Number(limited.headers["retry-after"])).toBeGreaterThan(0);
      expect(lastAudit(harness)?.code).toBe("RATE_LIMITED");
    });
  });

  it("fails closed when the limiter is unavailable", async () => {
    const probe = spy();
    await withHarness({ limiterImpl: { evaluate: () => Promise.reject(new Error("redis down")) } }, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(503);
      expect(response.body).toMatchObject({ error: { code: "RATE_LIMIT_UNAVAILABLE" } });
      expect(probe.calls).toHaveLength(0);
      void harness;
    }, {
      publicRoutes: [],
      protectedRoutes: [probeRoute(probe.handler)],
    });
  });
});

describe("edge correlation and audit (invariants I, J)", () => {
  it("mints an internal request id, keeps the external separate, and echoes both to the trail", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: {
          authorization: `Bearer ${seeded.secret}`,
          "x-request-id": "client-supplied-1",
        },
      });
      expect(response.status).toBe(200);
      const internal = String(response.headers[EDGE_INTERNAL_REQUEST_ID_HEADER]);
      expect(internal.startsWith("req_")).toBe(true);
      expect(internal).not.toBe("client-supplied-1");
      const audit = lastAudit(harness);
      expect(audit?.requestId).toBe(internal);
      expect(audit?.externalRequestId).toBe("client-supplied-1");
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("drops a malformed external request id", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: {
          authorization: `Bearer ${seeded.secret}`,
          "x-request-id": "<script>alert(1)</script>",
        },
      });
      expect(lastAudit(harness)?.externalRequestId).toBeNull();
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("never writes the raw secret into the response or the audit trail", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(harness.store, { scopes: ["projects:read"] }, harness.clock.now);
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(JSON.stringify(response.body)).not.toContain(seeded.secret);
      expect(auditJson(harness)).not.toContain(seeded.secret);
      expect(auditJson(harness)).not.toContain("Bearer ");
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("includes the internal request id in denial errors", async () => {
    const probe = spy();
    await withHarness({}, async (harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`);
      const internal = String(response.headers[EDGE_INTERNAL_REQUEST_ID_HEADER]);
      expect(response.body).toMatchObject({ error: { requestId: internal } });
      expect(lastAudit(harness)?.requestId).toBe(internal);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler)] });
  });

  it("surfaces the resolved principal through the default context route", async () => {
    await withHarness({}, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["projects:read"], tenantId: "tenant-omega", actorId: "svc-omega" },
        harness.clock.now,
      );
      const response = await edgeRequest<Record<string, unknown>>(url, `${EDGE_MOUNT_PATH}/v1/context`, {
        headers: { authorization: `Bearer ${seeded.secret}` },
      });
      expect(response.status).toBe(200);
      expect(response.body["tenantId"]).toBe("tenant-omega");
      expect(response.body["actorId"]).toBe("svc-omega");
      expect(JSON.stringify(response.body)).not.toContain(seeded.secret);
    });
  });
});

describe("edge body handling", () => {
  it("rejects an oversized body with 413 before any handler runs", async () => {
    const probe = spy();
    await withHarness({ publicationExecuteEnabled: true }, async (harness, url) => {
      const seeded = await seedCredential(
        harness.store,
        { scopes: ["publication:execute"] },
        harness.clock.now,
      );
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        method: "POST",
        headers: { authorization: `Bearer ${seeded.secret}` },
        body: { payload: "x".repeat(70 * 1024) },
      });
      expect(response.status).toBe(413);
      expect(response.body).toMatchObject({ error: { code: "PAYLOAD_TOO_LARGE" } });
      expect(probe.calls).toHaveLength(0);
      expect(lastAudit(harness)?.reason).toBe("request_body_too_large");
    }, {
      publicRoutes: [],
      protectedRoutes: [
        probeRoute(probe.handler, {
          method: "post",
          action: "publication:execute",
          requiredScope: "publication:execute",
          policyAction: "publication:execute",
        }),
      ],
    });
  });

  it("rejects malformed JSON with 400 and the JSON contract", async () => {
    const probe = spy();
    await withHarness({}, async (_harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/probe`, {
        method: "POST",
        rawBody: "{ this is not json",
        headers: { authorization: `Bearer ohk_${"a".repeat(48)}` },
      });
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({ error: { code: "BAD_REQUEST" } });
      expect(probe.calls).toHaveLength(0);
    }, { publicRoutes: [], protectedRoutes: [probeRoute(probe.handler, { method: "post" })] });
  });

  it("answers an unknown edge path with the JSON contract, not the SPA", async () => {
    await withHarness({}, async (harness, url) => {
      const response = await edgeRequest(url, `${EDGE_MOUNT_PATH}/v1/does-not-exist`);
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        error: { code: "NOT_FOUND", reason: "unknown_edge_route" },
      });
      expect(lastAudit(harness)?.action).toBe("route_not_found");
    });
  });
});

describe("edge credential-management surface", () => {
  it("exposes no provisioning, rotation or revocation HTTP route", async () => {
    await withHarness({}, async (_harness, url) => {
      for (const path of ["/v1/credentials", "/v1/credentials/ohc_1", "/credentials", "/v1/rotate"]) {
        const get = await edgeRequest(url, `${EDGE_MOUNT_PATH}${path}`);
        expect(get.status).toBe(404);
        const post = await edgeRequest(url, `${EDGE_MOUNT_PATH}${path}`, { method: "POST", body: {} });
        expect(post.status).toBe(404);
      }
    });
  });
});
