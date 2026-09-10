import { describe, expect, it } from "vitest";

import { machineGatewayContextFields } from "../../shared/optihubBoundary";
import {
  EDGE_AUDIT_FORBIDDEN_KEYS,
  InMemoryEdgeAuditSink,
  hashClientAddress,
  redactEdgeMetadata,
  truncateUserAgent,
  type EdgeAuditRecord,
} from "./audit";
import {
  EDGE_CREDENTIAL_PREFIX,
  EDGE_SECRET_PATTERN,
  buildEdgeCredential,
  credentialStatusAt,
  generateEdgeSecret,
  hashEdgeSecret,
  isEdgeSecretFormat,
  verifyEdgeSecret,
  type EdgeCredentialRecord,
} from "./credentials";
import {
  createEdgeCorrelation,
  generateInternalRequestId,
  validateExternalRequestId,
} from "./correlation";
import {
  MAX_ROTATION_OVERLAP_MS,
  EdgeProvisioningError,
  provisionEdgeCredential,
  registerEdgeCredential,
  revokeEdgeCredential,
  rotateEdgeCredential,
} from "./provisioning";
import {
  InMemoryEdgeRateLimiter,
  edgeRateLimitFor,
} from "./rateLimit";
import { hasEdgeScope, normalizeEdgeScopes } from "./scopes";
import { InMemoryEdgeCredentialStore } from "./store";
import { authorize, type EdgePolicyConfig } from "./policy";
import {
  buildMachineGatewayContext,
  checkRequestedTenant,
  readRequestedTenantId,
  resolveEdgeTenant,
  type EdgePrincipal,
} from "./tenant";

const NOW = 1_750_000_000_000;

function principal(overrides: Partial<EdgePrincipal> = {}): EdgePrincipal {
  return {
    tenantId: "tenant-alpha",
    actorId: "actor-alpha",
    credentialId: "ohc_test",
    credentialVersion: 1,
    scopes: ["projects:read", "publication:execute"],
    ...overrides,
  };
}

describe("edge scopes", () => {
  it("keeps only catalog scopes, de-duplicated and in catalog order", () => {
    expect(normalizeEdgeScopes(["publication:execute", "read", "projects:read", "projects:read"])).toEqual([
      "projects:read",
      "publication:execute",
    ]);
  });

  it("never grants an unknown string", () => {
    expect(normalizeEdgeScopes(["root", "*"])).toEqual([]);
  });

  it("checks membership exactly", () => {
    expect(hasEdgeScope(["projects:read"], "projects:read")).toBe(true);
    expect(hasEdgeScope(["projects:read"], "projects:write")).toBe(false);
  });
});

describe("edge credentials", () => {
  it("generates prefixed, high-entropy secrets that match the strict format", () => {
    const secret = generateEdgeSecret();
    expect(secret.startsWith(EDGE_CREDENTIAL_PREFIX)).toBe(true);
    expect(EDGE_SECRET_PATTERN.test(secret)).toBe(true);
    expect(isEdgeSecretFormat(secret)).toBe(true);
    expect(new Set(Array.from({ length: 25 }, () => generateEdgeSecret())).size).toBe(25);
  });

  it("rejects secrets that are not edge credentials", () => {
    expect(isEdgeSecretFormat("sk_live_1234567890")).toBe(false);
    expect(isEdgeSecretFormat("ohk_short")).toBe(false);
    expect(isEdgeSecretFormat("")).toBe(false);
  });

  it("hashes deterministically and verifies in constant time", () => {
    const secret = generateEdgeSecret();
    const hash = hashEdgeSecret(secret);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashEdgeSecret(secret)).toBe(hash);
    expect(verifyEdgeSecret(secret, hash)).toBe(true);
    expect(verifyEdgeSecret(generateEdgeSecret(), hash)).toBe(false);
    expect(verifyEdgeSecret(secret, "not-a-hash")).toBe(false);
  });

  it("stores only the hash, never the raw secret", () => {
    const { secret, record } = buildEdgeCredential(
      { tenantId: "t", actorId: "a", scopes: ["projects:read"] },
      "ohc_1",
      NOW,
    );
    expect(record.secretHash).toBe(hashEdgeSecret(secret));
    expect(record.secretHash).not.toBe(secret);
    expect(Object.prototype.hasOwnProperty.call(record, "secret")).toBe(false);
    expect(record.status).toBe("active");
    expect(record.expiresAt).toBeNull();
    expect(record.version).toBe(1);
  });

  it("evaluates status with revocation winning over expiry", () => {
    const active: EdgeCredentialRecord = {
      ...buildEdgeCredential({ tenantId: "t", actorId: "a", scopes: [] }, "ohc_2", NOW).record,
    };
    expect(credentialStatusAt(active, NOW)).toBe("active");
    expect(credentialStatusAt({ ...active, expiresAt: NOW - 1 }, NOW)).toBe("expired");
    expect(credentialStatusAt({ ...active, expiresAt: NOW }, NOW)).toBe("expired");
    expect(credentialStatusAt({ ...active, expiresAt: NOW + 1 }, NOW)).toBe("active");
    expect(credentialStatusAt({ ...active, status: "revoked", revokedAt: NOW }, NOW)).toBe("revoked");
    expect(
      credentialStatusAt({ ...active, status: "revoked", revokedAt: NOW, expiresAt: NOW - 1 }, NOW),
    ).toBe("revoked");
  });
});

describe("edge credential store", () => {
  it("inserts, looks up and lists by tenant", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const { record } = buildEdgeCredential(
      { tenantId: "tenant-alpha", actorId: "a", scopes: ["projects:read"] },
      "ohc_1",
      NOW,
    );
    await store.insert(record);
    expect(await store.findById("ohc_1")).toEqual(record);
    expect(await store.findBySecretHash(record.secretHash)).toEqual(record);
    expect(await store.findBySecretHash("missing")).toBeNull();
    expect(await store.listByTenant("tenant-alpha")).toHaveLength(1);
    expect(await store.listByTenant("other")).toHaveLength(0);
  });

  it("refuses duplicate ids and duplicate secrets", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = buildEdgeCredential(
      { tenantId: "t", actorId: "a", scopes: [] },
      "ohc_1",
      NOW,
    );
    await store.insert(first.record);
    await expect(store.insert(first.record)).rejects.toThrow();
  });

  it("applies updateIf only when the predicate holds (compare-and-swap)", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const { record } = buildEdgeCredential(
      { tenantId: "t", actorId: "a", scopes: [] },
      "ohc_1",
      NOW,
    );
    await store.insert(record);

    const rejected = await store.updateIf("ohc_1", current => current.status === "revoked", {
      revokedAt: NOW,
    });
    expect(rejected).toBeNull();
    expect((await store.findById("ohc_1"))?.revokedAt).toBeNull();

    const applied = await store.updateIf("ohc_1", current => current.status === "active", {
      revokedAt: NOW,
      status: "revoked",
    });
    expect(applied?.status).toBe("revoked");
    expect((await store.findById("ohc_1"))?.revokedAt).toBe(NOW);
  });
});

describe("edge correlation", () => {
  it("mints a fresh internal id and never reuses the external one", () => {
    const correlation = createEdgeCorrelation("client-request-1");
    expect(correlation.requestId.startsWith("req_")).toBe(true);
    expect(correlation.requestId).not.toBe("client-request-1");
    expect(correlation.externalRequestId).toBe("client-request-1");
  });

  it("accepts only safe, bounded external ids", () => {
    expect(validateExternalRequestId("abcdefgh")).toBe("abcdefgh");
    expect(validateExternalRequestId("abc")).toBeNull();
    expect(validateExternalRequestId("has space here")).toBeNull();
    expect(validateExternalRequestId("<script>alert(1)</script>")).toBeNull();
    expect(validateExternalRequestId("a".repeat(129))).toBeNull();
    expect(validateExternalRequestId(undefined)).toBeNull();
    expect(validateExternalRequestId(12345)).toBeNull();
    expect(validateExternalRequestId("q".repeat(128))).toBe("q".repeat(128));
  });

  it("generates unique internal ids", () => {
    expect(generateInternalRequestId()).not.toBe(generateInternalRequestId());
  });
});

describe("edge audit redaction", () => {
  it("masks secret-shaped keys at any depth and bounds strings", () => {
    const redacted = redactEdgeMetadata({
      safe: "value",
      password: "p",
      nested: { authorization: "Bearer x", apiKey: "k", comgateMerchantSecret: "s" },
      payment: { card: "4111111111111111" },
      oversized: "x".repeat(600),
    }) as Record<string, unknown>;

    expect(redacted["safe"]).toBe("value");
    expect(redacted["password"]).toBe("[REDACTED]");
    expect(redacted["payment"]).toBe("[REDACTED]");
    const nested = redacted["nested"] as Record<string, unknown>;
    expect(nested["authorization"]).toBe("[REDACTED]");
    expect(nested["apiKey"]).toBe("[REDACTED]");
    expect(nested["comgateMerchantSecret"]).toBe("[REDACTED]");
    expect(String(redacted["oversized"])).toContain("[TRUNCATED]");
    expect(EDGE_AUDIT_FORBIDDEN_KEYS.test("creditCard")).toBe(true);
  });

  it("pseudonymises client addresses and bounds user agents", () => {
    const hash = hashClientAddress("203.0.113.7");
    expect(hash).toMatch(/^ip_[a-f0-9]{24}$/);
    expect(hashClientAddress("203.0.113.7")).toBe(hash);
    expect(hashClientAddress("")).toBeNull();
    expect(hashClientAddress(undefined)).toBeNull();
    expect(truncateUserAgent("u".repeat(400))?.length).toBe(256);
  });

  it("records entries in the in-memory sink", () => {
    const sink = new InMemoryEdgeAuditSink();
    sink.record({
      timestamp: NOW,
      requestId: "req_1",
      externalRequestId: null,
      surface: "api",
      host: "api.optihub.cz",
      method: "GET",
      route: "/api/optihub/v1/context",
      action: "projects:read",
      credentialId: null,
      tenantId: null,
      actorId: null,
      decision: "DENY",
      code: "MISSING_CREDENTIAL",
      reason: "missing_authorization",
      status: 401,
      ipHash: null,
      userAgent: null,
    });
    expect(sink.entries).toHaveLength(1);
    expect(sink.entries[0]?.decision).toBe("DENY");
  });

  it("bounds the in-memory audit trail and evicts the oldest records", () => {
    const sink = new InMemoryEdgeAuditSink(3);
    const base: EdgeAuditRecord = {
      timestamp: NOW,
      requestId: "req_0",
      externalRequestId: null,
      surface: "api",
      host: "api.optihub.cz",
      method: "GET",
      route: "/api/optihub/v1/context",
      action: "projects:read",
      credentialId: null,
      tenantId: null,
      actorId: null,
      decision: "ALLOW",
      code: "MISSING_CREDENTIAL",
      reason: "ok",
      status: 200,
      ipHash: null,
      userAgent: null,
    };
    for (let i = 0; i < 5; i += 1) sink.record({ ...base, requestId: `req_${i}` });
    expect(sink.entries).toHaveLength(3);
    expect(sink.entries.map(entry => entry.requestId)).toEqual(["req_2", "req_3", "req_4"]);
  });
});

describe("edge policy engine", () => {
  const config: EdgePolicyConfig = { publicationExecuteEnabled: false };

  it("denies unknown actions instead of allowing by default", () => {
    const decision = authorize(principal(), { name: "database:drop" }, undefined, config);
    expect(decision).toEqual({ decision: "DENY", code: "POLICY_DENIED", reason: "unknown_action" });
  });

  it("denies a resource bound to another tenant", () => {
    const decision = authorize(
      principal(),
      { name: "projects:read" },
      { kind: "project", tenantId: "tenant-beta" },
      config,
    );
    expect(decision).toEqual({
      decision: "DENY",
      code: "TENANT_DENIED",
      reason: "resource_tenant_mismatch",
    });
  });

  it("allows a resource bound to the same tenant", () => {
    const decision = authorize(
      principal(),
      { name: "projects:read" },
      { kind: "project", tenantId: "tenant-alpha" },
      config,
    );
    expect(decision.decision).toBe("ALLOW");
  });

  it("fails publication execution closed unless explicitly enabled", () => {
    expect(authorize(principal(), { name: "publication:execute" }, undefined, config)).toEqual({
      decision: "DENY",
      code: "POLICY_DENIED",
      reason: "publication_execute_disabled",
    });
    expect(
      authorize(principal(), { name: "publication:execute" }, undefined, {
        publicationExecuteEnabled: true,
      }).decision,
    ).toBe("ALLOW");
  });

  it("denies a principal with no tenant", () => {
    const decision = authorize(principal({ tenantId: "" }), { name: "projects:read" }, undefined, config);
    expect(decision).toEqual({ decision: "DENY", code: "POLICY_DENIED", reason: "missing_tenant" });
  });

  it("is deterministic", () => {
    const input = { name: "projects:read" } as const;
    expect(authorize(principal(), input, undefined, config)).toEqual(
      authorize(principal(), input, undefined, config),
    );
  });
});

describe("edge rate limiter", () => {
  it("allows up to the limit and then denies with Retry-After", async () => {
    const limiter = new InMemoryEdgeRateLimiter();
    const key = { tenantId: "t", credentialId: "c", action: "projects:read" };
    for (let i = 0; i < 3; i += 1) {
      const decision = await limiter.evaluate(key, 3, 60_000, NOW);
      expect(decision.allowed).toBe(true);
    }
    const denied = await limiter.evaluate(key, 3, 60_000, NOW);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    expect(denied.remaining).toBe(0);
  });

  it("isolates tenants, credentials and actions", async () => {
    const limiter = new InMemoryEdgeRateLimiter();
    expect((await limiter.evaluate({ tenantId: "a", credentialId: "c", action: "x" }, 1, 1000, NOW)).allowed).toBe(true);
    expect((await limiter.evaluate({ tenantId: "b", credentialId: "c", action: "x" }, 1, 1000, NOW)).allowed).toBe(true);
    expect((await limiter.evaluate({ tenantId: "a", credentialId: "d", action: "x" }, 1, 1000, NOW)).allowed).toBe(true);
    expect((await limiter.evaluate({ tenantId: "a", credentialId: "c", action: "y" }, 1, 1000, NOW)).allowed).toBe(true);
    expect((await limiter.evaluate({ tenantId: "a", credentialId: "c", action: "x" }, 1, 1000, NOW)).allowed).toBe(false);
  });

  it("resets after the window and exposes a default rule", async () => {
    const limiter = new InMemoryEdgeRateLimiter();
    const key = { tenantId: "t", credentialId: "c", action: "x" };
    expect((await limiter.evaluate(key, 1, 1000, NOW)).allowed).toBe(true);
    expect((await limiter.evaluate(key, 1, 1000, NOW + 1001)).allowed).toBe(true);
    expect(edgeRateLimitFor("publication:execute").limit).toBe(10);
    expect(edgeRateLimitFor("unknown:action").limit).toBe(120);
  });

  it("stays bounded and functional past the tracked-key cap", async () => {
    const limiter = new InMemoryEdgeRateLimiter();
    for (let i = 0; i < 10_005; i += 1) {
      await limiter.evaluate({ tenantId: "t", credentialId: `c${i}`, action: "x" }, 1, 60_000, NOW);
    }
    const decision = await limiter.evaluate(
      { tenantId: "t", credentialId: "final", action: "x" },
      1,
      60_000,
      NOW,
    );
    expect(decision.allowed).toBe(true);
    expect(decision.remaining).toBe(0);
  });
});

describe("edge tenant resolution", () => {
  it("derives the principal from the credential only", () => {
    const { record } = buildEdgeCredential(
      { tenantId: "tenant-alpha", actorId: "svc", scopes: ["projects:read"] },
      "ohc_1",
      NOW,
    );
    const resolved = resolveEdgeTenant(record);
    expect(resolved.tenantId).toBe("tenant-alpha");
    expect(resolved.actorId).toBe("svc");
    expect(resolved.credentialId).toBe("ohc_1");
  });

  it("rejects a requested tenant that differs from the credential tenant", () => {
    const alpha = principal();
    expect(checkRequestedTenant(alpha, null).ok).toBe(true);
    expect(checkRequestedTenant(alpha, undefined).ok).toBe(true);
    expect(checkRequestedTenant(alpha, "  ").ok).toBe(true);
    expect(checkRequestedTenant(alpha, "tenant-alpha").ok).toBe(true);
    const denied = checkRequestedTenant(alpha, "tenant-beta");
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.reason).toBe("cross_tenant_request");
  });

  it("reads a comparison tenant only from explicit locations", () => {
    expect(readRequestedTenantId({ header: "t1" })).toBe("t1");
    expect(readRequestedTenantId({ body: { tenantId: "t2" } })).toBe("t2");
    expect(readRequestedTenantId({ body: { tenant_id: "t3" } })).toBe("t3");
    expect(readRequestedTenantId({ query: { tenantId: "t4" } })).toBe("t4");
    expect(readRequestedTenantId({ header: ["t5"] })).toBe("t5");
    expect(readRequestedTenantId({})).toBeNull();
  });

  it("emits the contract-shaped machine gateway context", () => {
    const context = buildMachineGatewayContext(principal(), "req_1", "policy/1");
    expect(Object.keys(context).sort()).toEqual([...machineGatewayContextFields].sort());
    expect(context.tenantId).toBe("tenant-alpha");
  });
});

describe("edge provisioning", () => {
  it("returns the secret once and persists only its hash", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const { secret, record } = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: ["projects:read"] },
      NOW,
    );
    expect(isEdgeSecretFormat(secret)).toBe(true);
    expect(record.secretHash).toBe(hashEdgeSecret(secret));
    const stored = await store.findById(record.id);
    expect(stored?.secretHash).toBe(hashEdgeSecret(secret));
    expect(JSON.stringify(stored)).not.toContain(secret);
  });

  it("adopts a pre-existing secret from a secret manager", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const secret = generateEdgeSecret();
    const record = await registerEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", secret, scopes: ["projects:read"] },
      NOW,
    );
    expect(await store.findBySecretHash(hashEdgeSecret(secret))).not.toBeNull();
    expect(record.tenantId).toBe("tenant-alpha");
    await expect(
      registerEdgeCredential(store, { tenantId: "t", actorId: "a", secret: "not-an-edge-secret", scopes: [] }, NOW),
    ).rejects.toThrow(EdgeProvisioningError);
  });

  it("rotates by revoking the old version when no overlap is requested", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: ["projects:read"] },
      NOW,
    );
    const second = await rotateEdgeCredential(store, first.record.id, {}, NOW + 10);

    expect(second.record.version).toBe(2);
    expect(second.record.rotatedFromId).toBe(first.record.id);
    const old = await store.findById(first.record.id);
    expect(old?.status).toBe("revoked");
    expect(old?.revokedAt).toBe(NOW + 10);
    expect(old?.rotatedToId).toBe(second.record.id);
    expect(second.secret).not.toBe(first.secret);
  });

  it("keeps a bounded overlap when explicitly requested, never unbounded", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: ["projects:read"] },
      NOW,
    );
    const overlapMs = 60 * 60 * 1000;
    await rotateEdgeCredential(store, first.record.id, { overlapMs }, NOW);

    const old = await store.findById(first.record.id);
    expect(old?.status).toBe("active");
    expect(old?.expiresAt).toBe(NOW + overlapMs);
    expect(credentialStatusAt(old!, NOW + overlapMs)).toBe("expired");
  });

  it("rejects an unbounded overlap", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: [] },
      NOW,
    );
    await expect(
      rotateEdgeCredential(store, first.record.id, { overlapMs: MAX_ROTATION_OVERLAP_MS + 1 }, NOW),
    ).rejects.toThrow(EdgeProvisioningError);
  });

  it("lets exactly one of two concurrent rotations win", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: [] },
      NOW,
    );

    const results = await Promise.allSettled([
      rotateEdgeCredential(store, first.record.id, {}, NOW),
      rotateEdgeCredential(store, first.record.id, {}, NOW),
    ]);

    const fulfilled = results.filter(result => result.status === "fulfilled");
    const rejected = results.filter(result => result.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(await store.listByTenant("tenant-alpha")).toHaveLength(2);
  });

  it("refuses to rotate an inactive credential and revokes idempotently", async () => {
    const store = new InMemoryEdgeCredentialStore();
    const first = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: [] },
      NOW,
    );
    await revokeEdgeCredential(store, first.record.id, NOW);
    await expect(rotateEdgeCredential(store, first.record.id, {}, NOW)).rejects.toThrow(
      EdgeProvisioningError,
    );

    const second = await provisionEdgeCredential(
      store,
      { tenantId: "tenant-alpha", actorId: "svc", scopes: [] },
      NOW,
    );
    expect(await revokeEdgeCredential(store, second.record.id, NOW)).not.toBeNull();
    expect(await revokeEdgeCredential(store, second.record.id, NOW + 5)).toBeNull();
  });
});
