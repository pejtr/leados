/**
 * OPTIHUB EDGE - security audit trail.
 *
 * This is not the debug log. Every security decision the edge makes produces one
 * record: who (credential/tenant/actor), what (route/action), the decision, the
 * reason, the result and the correlation id.
 *
 * Raw secrets, authorization headers and payment credentials must never appear
 * here. The pipeline never passes them in, and `redactEdgeMetadata` is defense in
 * depth for anything free-form.
 */

import { createHash } from "node:crypto";

export type EdgeAuditDecision = "ALLOW" | "DENY" | "ERROR";

export interface EdgeAuditRecord {
  readonly timestamp: number;
  readonly requestId: string;
  readonly externalRequestId: string | null;
  readonly surface: string;
  readonly host: string;
  readonly method: string;
  readonly route: string;
  readonly action: string;
  readonly credentialId: string | null;
  readonly tenantId: string | null;
  readonly actorId: string | null;
  readonly decision: EdgeAuditDecision;
  readonly code: string | null;
  readonly reason: string;
  readonly status: number;
  readonly ipHash: string | null;
  readonly userAgent: string | null;
  /** Non-sensitive resource reference (e.g. "publication:pub-1"); never a payload. */
  readonly resource?: string | null;
}

export interface EdgeAuditSink {
  record(entry: EdgeAuditRecord): void | Promise<void>;
}

/**
 * Read side of the audit trail. The pipeline never uses it; it exists so an
 * operator or a test can answer "what happened to request X / tenant Y".
 */
export interface EdgeAuditQuery {
  findByRequestId(requestId: string): Promise<readonly EdgeAuditRecord[]>;
  findByTenant(tenantId: string, limit?: number): Promise<readonly EdgeAuditRecord[]>;
}

const DEFAULT_AUDIT_CAPACITY = 10_000;

/**
 * Bounded in-memory audit sink. It keeps the most recent records and evicts the
 * oldest, so a long-running process cannot be OOM-ed by its own audit trail. It
 * is a reference implementation, not a durable audit store.
 */
export class InMemoryEdgeAuditSink implements EdgeAuditSink {
  readonly entries: EdgeAuditRecord[] = [];
  private readonly capacity: number;

  constructor(capacity: number = DEFAULT_AUDIT_CAPACITY) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error("audit capacity must be a positive integer");
    }
    this.capacity = capacity;
  }

  record(entry: EdgeAuditRecord): void {
    if (this.entries.length >= this.capacity) this.entries.shift();
    this.entries.push(entry);
  }
}

const REDACTED = "[REDACTED]";
const MAX_STRING_LENGTH = 512;

export const EDGE_AUDIT_FORBIDDEN_KEYS =
  /(secret|token|password|passwd|authorization|auth|cookie|api[-_]?key|credential|private[-_]?key|card|cvv|cvc|iban|comgate|payment|stripe)/i;

/**
 * Deep-copy a value for auditing: drop anything secret-shaped at any depth and
 * bound string length so a payload cannot be smuggled into the trail.
 */
export function redactEdgeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[TRUNCATED]";
  if (value === null || typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[TRUNCATED]` : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map(item => redactEdgeMetadata(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      output[key] = EDGE_AUDIT_FORBIDDEN_KEYS.test(key) ? REDACTED : redactEdgeMetadata(nested, depth + 1);
    }
    return output;
  }
  return "[UNSERIALIZABLE]";
}

/** A stable pseudonym for a client address, so the raw IP is not retained. */
export function hashClientAddress(address: string | undefined | null): string | null {
  if (address === undefined || address === null) return null;
  const trimmed = address.trim();
  if (trimmed === "") return null;
  return `ip_${createHash("sha256").update(trimmed).digest("hex").slice(0, 24)}`;
}

export function truncateUserAgent(userAgent: string | undefined): string | null {
  if (userAgent === undefined || userAgent.trim() === "") return null;
  return userAgent.slice(0, 256);
}
