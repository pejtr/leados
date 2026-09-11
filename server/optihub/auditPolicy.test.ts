/**
 * OPTIHUB EDGE - audit failure semantics and redaction tests.
 */

import { describe, expect, it } from "vitest";

import {
  EDGE_AUDIT_FORBIDDEN_KEYS,
  InMemoryEdgeAuditSink,
  redactEdgeMetadata,
  type EdgeAuditRecord,
  type EdgeAuditSink,
} from "./audit";
import {
  DEFAULT_EDGE_AUDIT_POLICY,
  EdgeAuditWriter,
  type EdgeAuditPolicy,
} from "./auditPolicy";

class SwitchableSink implements EdgeAuditSink {
  failing = true;
  readonly records: EdgeAuditRecord[] = [];

  async record(entry: EdgeAuditRecord): Promise<void> {
    if (this.failing) throw new Error("audit backend down");
    this.records.push(entry);
  }
}

function entry(reason: string): EdgeAuditRecord {
  return {
    timestamp: 1_750_000_000_000,
    requestId: "req-1",
    externalRequestId: null,
    surface: "api",
    host: "api.optihub.cz",
    method: "GET",
    route: "/api/optihub/v1/context",
    action: "projects:read",
    credentialId: "ohc_1",
    tenantId: "tenant-a",
    actorId: "actor-a",
    decision: "ALLOW",
    code: null,
    reason,
    status: 200,
    ipHash: "ip_hash",
    userAgent: "vitest",
  };
}

const DEGRADED: EdgeAuditPolicy = {
  ...DEFAULT_EDGE_AUDIT_POLICY,
  readPolicy: "degraded_spool",
  spoolCapacity: 2,
};

describe("audit failure policy", () => {
  it("fails closed for reads and privileged actions by default", async () => {
    const writer = new EdgeAuditWriter(new SwitchableSink());
    expect(await writer.persist(entry("read"), "read")).toEqual({ ok: false, degraded: false });
    expect(await writer.persist(entry("mut"), "mutating")).toEqual({ ok: false, degraded: false });
    expect(await writer.persist(entry("exec"), "execute")).toEqual({ ok: false, degraded: false });
    expect(writer.spoolSize).toBe(0);
  });

  it("never spools a privileged action, even in degraded mode", async () => {
    const writer = new EdgeAuditWriter(new SwitchableSink(), DEGRADED);
    expect(await writer.persist(entry("mut"), "mutating")).toEqual({ ok: false, degraded: false });
    expect(await writer.persist(entry("exec"), "execute")).toEqual({ ok: false, degraded: false });
    expect(writer.spoolSize).toBe(0);
  });

  it("spools reads in explicit degraded mode and flushes when the sink recovers", async () => {
    const sink = new SwitchableSink();
    const writer = new EdgeAuditWriter(sink, DEGRADED);

    expect(await writer.persist(entry("degraded-read"), "read")).toEqual({
      ok: true,
      degraded: true,
    });
    expect(writer.spoolSize).toBe(1);

    sink.failing = false;
    expect(await writer.persist(entry("recovered"), "read")).toEqual({
      ok: true,
      degraded: false,
    });
    expect(writer.spoolSize).toBe(0);
    expect(sink.records.map(record => record.reason)).toEqual(["degraded-read", "recovered"]);
  });

  it("bounds the spool and makes the loss observable", async () => {
    const writer = new EdgeAuditWriter(new SwitchableSink(), DEGRADED);
    for (let index = 0; index < 5; index += 1) {
      await writer.persist(entry(`r${index}`), "read");
    }
    expect(writer.spoolSize).toBe(2);
    expect(writer.droppedCount).toBe(3);
  });

  it("records normally through the in-memory sink", async () => {
    const sink = new InMemoryEdgeAuditSink();
    const writer = new EdgeAuditWriter(sink);
    expect(await writer.persist(entry("ok"), "read")).toEqual({ ok: true, degraded: false });
    expect(sink.entries).toHaveLength(1);
  });
});

describe("audit redaction", () => {
  it("redacts secret-shaped keys at any depth", () => {
    const redacted = redactEdgeMetadata({
      authorization: "Bearer supersecret",
      nested: { password: "hunter2", cookie: "session=abc", safe: "keep" },
      payment: { card: "4111111111111111", cvv: "123" },
      billing: { card: "4111111111111111", cvv: "123" },
      list: [{ token: "t" }],
    }) as Record<string, unknown>;

    expect(redacted["authorization"]).toBe("[REDACTED]");
    const nested = redacted["nested"] as Record<string, unknown>;
    expect(nested["password"]).toBe("[REDACTED]");
    expect(nested["cookie"]).toBe("[REDACTED]");
    expect(nested["safe"]).toBe("keep");
    // A forbidden top-level key removes the whole subtree.
    expect(redacted["payment"]).toBe("[REDACTED]");
    const billing = redacted["billing"] as Record<string, unknown>;
    expect(billing["card"]).toBe("[REDACTED]");
    expect(billing["cvv"]).toBe("[REDACTED]");
    expect(((redacted["list"] as unknown[])[0] as Record<string, unknown>)["token"]).toBe(
      "[REDACTED]",
    );
    expect(EDGE_AUDIT_FORBIDDEN_KEYS.test("x-api-key")).toBe(true);
  });

  it("bounds strings so a payload cannot be smuggled into the trail", () => {
    const redacted = redactEdgeMetadata("x".repeat(2_000));
    expect(typeof redacted).toBe("string");
    expect((redacted as string).length).toBeLessThan(600);
  });
});
