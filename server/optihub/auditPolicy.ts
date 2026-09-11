/**
 * OPTIHUB EDGE - audit failure semantics.
 *
 * A security decision is only meaningful if it is recorded. The writer therefore
 * treats the audit sink as part of the authorization path:
 *
 *   - mutating / execute: an unavailable audit sink is a DENY. The handler is
 *     never invoked, so no side effect can happen without a trail.
 *   - read: explicit policy. Default is fail-closed. A deployment may opt into a
 *     bounded, observable spool instead (`degraded_spool`); the spool is capped,
 *     never unbounded, and exposes `droppedCount` so the loss is visible.
 *
 * There is no silent-audit-loss mode: either the write succeeded, or the request
 * was denied, or the loss was explicitly configured and is observable.
 */

import type { EdgeAuditRecord, EdgeAuditSink } from "./audit";

export type EdgeOperationRisk = "read" | "mutating" | "execute";
export type EdgeReadAuditPolicy = "fail_closed" | "degraded_spool";

export interface EdgeAuditPolicy {
  /** Always contains mutating/execute; they are never downgraded. */
  readonly alwaysFailClosed: readonly EdgeOperationRisk[];
  readonly readPolicy: EdgeReadAuditPolicy;
  readonly spoolCapacity: number;
}

export const DEFAULT_EDGE_AUDIT_POLICY: EdgeAuditPolicy = {
  alwaysFailClosed: ["mutating", "execute"],
  readPolicy: "fail_closed",
  spoolCapacity: 1_000,
};

export interface EdgeAuditPersistResult {
  readonly ok: boolean;
  /** True only in the explicit read + degraded_spool mode. */
  readonly degraded: boolean;
}

export class EdgeAuditWriter {
  private spool: EdgeAuditRecord[] = [];
  private dropped = 0;

  constructor(
    private readonly sink: EdgeAuditSink,
    private readonly policy: EdgeAuditPolicy = DEFAULT_EDGE_AUDIT_POLICY,
  ) {}

  get spoolSize(): number {
    return this.spool.length;
  }

  get droppedCount(): number {
    return this.dropped;
  }

  async persist(entry: EdgeAuditRecord, risk: EdgeOperationRisk): Promise<EdgeAuditPersistResult> {
    try {
      // Drain any backlog first so the trail keeps chronological order.
      await this.flushSpool();
      await this.sink.record(entry);
      return { ok: true, degraded: false };
    } catch {
      if (this.policy.alwaysFailClosed.includes(risk) || this.policy.readPolicy === "fail_closed") {
        return { ok: false, degraded: false };
      }
      this.enqueue(entry);
      return { ok: true, degraded: true };
    }
  }

  private enqueue(entry: EdgeAuditRecord): void {
    if (this.spool.length >= this.policy.spoolCapacity) {
      this.spool.shift();
      this.dropped += 1;
    }
    this.spool.push(entry);
  }

  private async flushSpool(): Promise<void> {
    if (this.spool.length === 0) return;
    const pending = this.spool;
    this.spool = [];
    for (let index = 0; index < pending.length; index += 1) {
      try {
        await this.sink.record(pending[index]!);
      } catch {
        for (const remaining of pending.slice(index)) this.enqueue(remaining);
        return;
      }
    }
  }
}
