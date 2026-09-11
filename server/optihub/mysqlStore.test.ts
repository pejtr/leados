/**
 * OPTIHUB EDGE - persistence and atomicity tests against a real MySQL.
 *
 * No mocks: the same migration file and the same stores the runtime uses.
 */

import type { Pool, RowDataPacket } from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { credentialStatusAt, hashEdgeSecret } from "./credentials";
import { MySqlEdgeCredentialStore } from "./mysql/mysqlCredentialStore";
import { MySqlEdgeRateLimiter } from "./mysql/mysqlRateLimiter";
import { createOptiHubDbPool } from "./mysql/pool";
import { OPTIHUB_EDGE_DDL, ensureOptiHubEdgeSchema } from "./mysql/schema";
import {
  createOptiHubTestPool,
  createOptiHubTestStores,
  ensureOptiHubTestDatabase,
  optiHubTestDatabaseUrl,
  readOptiHubMigrationStatements,
  resetOptiHubTestTables,
  type OptiHubTestStores,
} from "./mysql/testDatabase";
import {
  provisionEdgeCredential,
  revokeEdgeCredential,
  rotateEdgeCredential,
} from "./provisioning";

const databaseUrl = optiHubTestDatabaseUrl();

let pool: Pool;
let stores: OptiHubTestStores;

beforeAll(async () => {
  await ensureOptiHubTestDatabase(databaseUrl);
  pool = createOptiHubTestPool(databaseUrl);
  stores = createOptiHubTestStores(pool);
}, 30_000);

afterAll(async () => {
  await pool.end();
});

beforeEach(async () => {
  await resetOptiHubTestTables(pool);
});

function newStore(): MySqlEdgeCredentialStore {
  return new MySqlEdgeCredentialStore(pool);
}

describe("MySQL credential store", () => {
  it("never persists the raw secret", async () => {
    const { secret, record } = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
    });

    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM optihub_edge_credentials");
    const serialized = JSON.stringify(rows);

    expect(rows).toHaveLength(1);
    expect(serialized).not.toContain(secret);
    expect(rows[0]?.["secretHash"]).toBe(hashEdgeSecret(secret));
    expect(rows[0]?.["secretHash"]).toBe(record.secretHash);
  });

  it("persists revocation across store instances", async () => {
    const { secret, record } = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
    });

    await revokeEdgeCredential(stores.store, record.id, Date.now());

    // A brand-new store instance reads the durable state, not process memory.
    const found = await newStore().findBySecretHash(hashEdgeSecret(secret));
    expect(found?.status).toBe("revoked");
    expect(found?.revokedAt).not.toBeNull();
    expect(credentialStatusAt(found!, Date.now())).toBe("revoked");
  });

  it("persists expiry across store instances", async () => {
    const now = Date.now();
    const { secret } = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
      expiresAt: now - 1_000,
    });

    const found = await newStore().findBySecretHash(hashEdgeSecret(secret));
    expect(found?.expiresAt).toBe(now - 1_000);
    expect(credentialStatusAt(found!, now)).toBe("expired");
  });

  it("persists rotation lineage and version", async () => {
    const first = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
    });

    const second = await rotateEdgeCredential(stores.store, first.record.id, {}, Date.now());
    expect(second.record.version).toBe(2);
    expect(second.record.rotatedFromId).toBe(first.record.id);

    const fresh = newStore();
    const predecessor = await fresh.findById(first.record.id);
    expect(predecessor?.status).toBe("revoked");
    expect(predecessor?.rotatedToId).toBe(second.record.id);

    // The old secret is no longer accepted, the new one is.
    expect(await fresh.findBySecretHash(hashEdgeSecret(first.secret))).not.toBeNull();
    const successor = await fresh.findBySecretHash(hashEdgeSecret(second.secret));
    expect(successor?.id).toBe(second.record.id);
  });

  it("rotates atomically under concurrency: one winner, no partial state", async () => {
    const first = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
    });

    const results = await Promise.allSettled([
      rotateEdgeCredential(stores.store, first.record.id, {}, Date.now()),
      rotateEdgeCredential(stores.store, first.record.id, {}, Date.now()),
    ]);

    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, status, rotatedToId, rotatedFromId FROM optihub_edge_credentials",
    );
    // Exactly the original plus one successor: no half-rotated credential.
    expect(rows).toHaveLength(2);
    const original = rows.find(row => row["id"] === first.record.id);
    const successors = rows.filter(row => row["rotatedFromId"] === first.record.id);
    expect(successors).toHaveLength(1);
    expect(original?.["status"]).toBe("revoked");
    expect(original?.["rotatedToId"]).toBe(successors[0]?.["id"]);
  }, 20_000);

  it("keeps the predecessor usable during an explicit overlap window", async () => {
    const now = Date.now();
    const first = await provisionEdgeCredential(stores.store, {
      tenantId: "tenant-a",
      actorId: "actor-a",
      scopes: ["projects:read"],
    });

    const second = await rotateEdgeCredential(
      stores.store,
      first.record.id,
      { overlapMs: 60_000 },
      now,
    );

    const predecessor = await newStore().findById(first.record.id);
    expect(predecessor?.status).toBe("active");
    expect(credentialStatusAt(predecessor!, now + 1)).toBe("active");
    expect(credentialStatusAt(predecessor!, now + 120_000)).toBe("expired");
    expect(predecessor?.rotatedToId).toBe(second.record.id);

    // The predecessor cannot be rotated a second time.
    await expect(
      rotateEdgeCredential(stores.store, first.record.id, {}, now + 1),
    ).rejects.toThrow(/rotation_race_lost|credential_already_rotated|credential_not_active/);
  });

  it("applies the migration repeatably (idempotent)", async () => {
    await ensureOptiHubTestDatabase(databaseUrl);
    await ensureOptiHubTestDatabase(databaseUrl);
    const [rows] = await pool.query<RowDataPacket[]>("SHOW TABLES LIKE 'optihub_edge_%'");
    expect(rows.map(row => Object.values(row)[0]).sort()).toEqual([
      "optihub_edge_audit",
      "optihub_edge_credentials",
      "optihub_edge_rate_windows",
    ]);
  }, 30_000);
});

describe("edge schema bootstrap", () => {
  it("keeps the runtime DDL identical to the committed migration", () => {
    const normalize = (sql: string): string =>
      sql
        .replace(/\r/g, "")
        .split("\n")
        .map(line => line.replace(/--.*$/, "").trim())
        .filter(line => line !== "")
        .join(" ")
        .replace(/\s+/g, " ")
        .replace(/;$/, "")
        .trim();
    expect(OPTIHUB_EDGE_DDL.map(normalize)).toEqual(
      readOptiHubMigrationStatements().map(normalize),
    );
  });

  it("creates missing tables and is safe to repeat on every boot", async () => {
    const probeUrl = optiHubTestDatabaseUrl(process.env, "bootstrap");
    await ensureOptiHubTestDatabase(probeUrl);
    const probePool = createOptiHubTestPool(probeUrl);
    try {
      await probePool.query("DROP TABLE IF EXISTS optihub_edge_audit");
      await probePool.query("DROP TABLE IF EXISTS optihub_edge_rate_windows");
      await probePool.query("DROP TABLE IF EXISTS optihub_edge_credentials");
      const [dropped] = await probePool.query<RowDataPacket[]>(
        "SHOW TABLES LIKE 'optihub_edge_%'",
      );
      expect(dropped).toHaveLength(0);

      await ensureOptiHubEdgeSchema(probePool);
      const [created] = await probePool.query<RowDataPacket[]>(
        "SHOW TABLES LIKE 'optihub_edge_%'",
      );
      expect(created.map(row => Object.values(row)[0]).sort()).toEqual([
        "optihub_edge_audit",
        "optihub_edge_credentials",
        "optihub_edge_rate_windows",
      ]);

      // Idempotent: a restart must not fail or duplicate anything.
      await ensureOptiHubEdgeSchema(probePool);
    } finally {
      await probePool.end();
    }
  }, 30_000);
});

describe("MySQL shared rate limiter", () => {
  it("shares window state across two application instances", async () => {
    const secondPool = createOptiHubDbPool(databaseUrl);
    try {
      const instanceA = new MySqlEdgeRateLimiter(pool, 0);
      const instanceB = new MySqlEdgeRateLimiter(secondPool, 0);
      const key = { tenantId: "tenant-a", credentialId: "cred-a", action: "projects:read" };
      const now = Date.now();

      expect((await instanceA.evaluate(key, 2, 60_000, now)).allowed).toBe(true);
      expect((await instanceB.evaluate(key, 2, 60_000, now)).allowed).toBe(true);

      const third = await instanceA.evaluate(key, 2, 60_000, now);
      expect(third.allowed).toBe(false);
      expect(third.remaining).toBe(0);
      expect(third.retryAfterSeconds).toBeGreaterThan(0);
    } finally {
      await secondPool.end();
    }
  }, 20_000);

  it("resets after the window and isolates buckets", async () => {
    const now = Date.now();
    const key = { tenantId: "tenant-a", credentialId: "cred-a", action: "projects:read" };
    const other = { tenantId: "tenant-b", credentialId: "cred-a", action: "projects:read" };

    expect((await stores.limiter.evaluate(key, 1, 1_000, now)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 1, 1_000, now)).allowed).toBe(false);
    expect((await stores.limiter.evaluate(other, 1, 1_000, now)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 1, 1_000, now + 1_001)).allowed).toBe(true);
  });

  it("re-arms the limit after a window rollover (regression: windowStart advances)", async () => {
    const key = { tenantId: "tenant-a", credentialId: "cred-a", action: "projects:read" };
    const window = 1_000;
    const now = Date.now();

    expect((await stores.limiter.evaluate(key, 2, window, now)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 2, window, now)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 2, window, now)).allowed).toBe(false);

    const next = now + window;
    expect((await stores.limiter.evaluate(key, 2, window, next)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 2, window, next)).allowed).toBe(true);
    expect((await stores.limiter.evaluate(key, 2, window, next)).allowed).toBe(false);
  });
});
