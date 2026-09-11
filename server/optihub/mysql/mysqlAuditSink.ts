/**
 * OPTIHUB EDGE - MySQL append-only audit sink.
 *
 * Application code only ever INSERTs into `optihub_edge_audit`. There is no
 * update or delete path. The read side (`EdgeAuditQuery`) exists for operators
 * and tests.
 *
 * The record shape only carries identifiers, a route/action, the decision, the
 * reason and a hashed client address. Raw credentials, Authorization headers,
 * cookies, payment data and request payloads are never part of it.
 */

import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  EdgeAuditDecision,
  EdgeAuditQuery,
  EdgeAuditRecord,
  EdgeAuditSink,
} from "../audit";

const TABLE = "optihub_edge_audit";

interface AuditRow extends RowDataPacket {
  timestamp: number;
  requestId: string;
  externalRequestId: string | null;
  surface: string;
  host: string;
  method: string;
  route: string;
  action: string;
  resource: string | null;
  credentialId: string | null;
  tenantId: string | null;
  actorId: string | null;
  decision: string;
  code: string | null;
  reason: string;
  status: number;
  ipHash: string | null;
  userAgent: string | null;
}

function toRecord(row: AuditRow): EdgeAuditRecord {
  return {
    timestamp: Number(row.timestamp),
    requestId: row.requestId,
    externalRequestId: row.externalRequestId,
    surface: row.surface,
    host: row.host,
    method: row.method,
    route: row.route,
    action: row.action,
    resource: row.resource,
    credentialId: row.credentialId,
    tenantId: row.tenantId,
    actorId: row.actorId,
    decision: normalizeDecision(row.decision),
    code: row.code,
    reason: row.reason,
    status: Number(row.status),
    ipHash: row.ipHash,
    userAgent: row.userAgent,
  };
}

function normalizeDecision(value: string): EdgeAuditDecision {
  return value === "ALLOW" || value === "ERROR" ? value : "DENY";
}

function auditError(error: unknown): Error {
  return new Error("edge_audit_store_unavailable", { cause: error });
}

export class MySqlEdgeAuditSink implements EdgeAuditSink, EdgeAuditQuery {
  constructor(private readonly pool: Pool) {}

  async record(entry: EdgeAuditRecord): Promise<void> {
    try {
      await this.pool.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE}
          (timestamp, requestId, externalRequestId, surface, host, method, route, action, resource,
           credentialId, tenantId, actorId, decision, code, reason, status, ipHash, userAgent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.timestamp,
          entry.requestId,
          entry.externalRequestId,
          entry.surface,
          entry.host,
          entry.method,
          entry.route,
          entry.action,
          entry.resource ?? null,
          entry.credentialId,
          entry.tenantId,
          entry.actorId,
          entry.decision,
          entry.code,
          entry.reason,
          entry.status,
          entry.ipHash,
          entry.userAgent,
        ],
      );
    } catch (error) {
      throw auditError(error);
    }
  }

  async findByRequestId(requestId: string): Promise<readonly EdgeAuditRecord[]> {
    return this.query("SELECT * FROM " + TABLE + " WHERE requestId = ? ORDER BY id ASC", [requestId]);
  }

  async findByTenant(tenantId: string, limit = 100): Promise<readonly EdgeAuditRecord[]> {
    const bounded = Math.min(Math.max(Math.trunc(limit), 1), 1_000);
    return this.query(
      `SELECT * FROM ${TABLE} WHERE tenantId = ? ORDER BY id DESC LIMIT ${bounded}`,
      [tenantId],
    );
  }

  /** Readiness probe used by `/ready` and by the runtime wiring. */
  async ping(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private async query(sql: string, params: unknown[]): Promise<readonly EdgeAuditRecord[]> {
    try {
      const [rows] = await this.pool.query<AuditRow[]>(sql, params);
      return rows.map(toRecord);
    } catch (error) {
      throw auditError(error);
    }
  }
}
