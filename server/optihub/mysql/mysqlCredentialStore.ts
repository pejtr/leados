/**
 * OPTIHUB EDGE - MySQL credential store.
 *
 * Implements the same `EdgeCredentialStore` contract as the in-memory store, so
 * the pipeline never learns which backend it is talking to.
 *
 * Rotation is a single transaction: the previous row is locked (`SELECT ... FOR
 * UPDATE`), the compare-and-swap precondition is checked, the previous row is
 * updated and the successor row is inserted. Either both happen or neither does,
 * and two concurrent rotations cannot both win.
 */

import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { credentialStatusAt, type EdgeCredentialRecord } from "../credentials";
import { normalizeEdgeScopes } from "../scopes";
import type {
  EdgeCredentialPatch,
  EdgeCredentialStore,
  EdgeRotationClaim,
} from "../store";
import { withOptiHubTransaction, type OptiHubDbPool } from "./pool";

const TABLE = "optihub_edge_credentials";

interface CredentialRow extends RowDataPacket {
  id: string;
  tenantId: string;
  actorId: string;
  secretHash: string;
  version: number;
  status: string;
  scopes: unknown;
  metadata: unknown;
  createdAt: number;
  expiresAt: number | null;
  revokedAt: number | null;
  lastUsedAt: number | null;
  rotatedFromId: string | null;
  rotatedToId: string | null;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function toRecord(row: CredentialRow): EdgeCredentialRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    actorId: row.actorId,
    secretHash: row.secretHash,
    status: row.status === "revoked" ? "revoked" : row.status === "expired" ? "expired" : "active",
    createdAt: Number(row.createdAt),
    expiresAt: row.expiresAt === null ? null : Number(row.expiresAt),
    version: Number(row.version),
    scopes: normalizeEdgeScopes(parseJson<readonly string[]>(row.scopes, [])),
    metadata: parseJson<Record<string, string>>(row.metadata, {}),
    rotatedFromId: row.rotatedFromId ?? null,
    rotatedToId: row.rotatedToId ?? null,
    revokedAt: row.revokedAt === null ? null : Number(row.revokedAt),
    lastUsedAt: row.lastUsedAt === null ? null : Number(row.lastUsedAt),
  };
}

function buildPatchSet(patch: EdgeCredentialPatch): { clause: string; values: unknown[] } {
  const assignments: string[] = [];
  const values: unknown[] = [];
  if (patch.status !== undefined) {
    assignments.push("status = ?");
    values.push(patch.status);
  }
  if (patch.expiresAt !== undefined) {
    assignments.push("expiresAt = ?");
    values.push(patch.expiresAt);
  }
  if (patch.rotatedToId !== undefined) {
    assignments.push("rotatedToId = ?");
    values.push(patch.rotatedToId);
  }
  if (patch.revokedAt !== undefined) {
    assignments.push("revokedAt = ?");
    values.push(patch.revokedAt);
  }
  if (patch.lastUsedAt !== undefined) {
    assignments.push("lastUsedAt = ?");
    values.push(patch.lastUsedAt);
  }
  return { clause: assignments.join(", "), values };
}

function insertSql(): string {
  return `INSERT INTO ${TABLE}
    (id, tenantId, actorId, secretHash, version, status, scopes, metadata, createdAt, expiresAt, revokedAt, lastUsedAt, rotatedFromId, rotatedToId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
}

function insertValues(record: EdgeCredentialRecord): unknown[] {
  return [
    record.id,
    record.tenantId,
    record.actorId,
    record.secretHash,
    record.version,
    record.status,
    JSON.stringify(record.scopes),
    JSON.stringify(record.metadata),
    record.createdAt,
    record.expiresAt,
    record.revokedAt,
    record.lastUsedAt,
    record.rotatedFromId,
    record.rotatedToId,
  ];
}

/** Never surface driver/SQL detail beyond the server; callers audit a fixed reason. */
function storeError(error: unknown): Error {
  return new Error("edge_credential_store_unavailable", { cause: error });
}

export class MySqlEdgeCredentialStore implements EdgeCredentialStore {
  constructor(private readonly pool: Pool) {}

  async insert(record: EdgeCredentialRecord): Promise<void> {
    try {
      await this.pool.execute<ResultSetHeader>(insertSql(), insertValues(record));
    } catch (error) {
      throw storeError(error);
    }
  }

  async findById(id: string): Promise<EdgeCredentialRecord | null> {
    return this.findOne("SELECT * FROM " + TABLE + " WHERE id = ? LIMIT 1", [id]);
  }

  async findBySecretHash(secretHash: string): Promise<EdgeCredentialRecord | null> {
    return this.findOne("SELECT * FROM " + TABLE + " WHERE secretHash = ? LIMIT 1", [secretHash]);
  }

  async listByTenant(tenantId: string): Promise<readonly EdgeCredentialRecord[]> {
    try {
      const [rows] = await this.pool.query<CredentialRow[]>(
        "SELECT * FROM " + TABLE + " WHERE tenantId = ?",
        [tenantId],
      );
      return rows.map(toRecord);
    } catch (error) {
      throw storeError(error);
    }
  }

  async update(id: string, patch: EdgeCredentialPatch): Promise<EdgeCredentialRecord | null> {
    const { clause, values } = buildPatchSet(patch);
    if (clause === "") return this.findById(id);
    try {
      await this.pool.execute<ResultSetHeader>(`UPDATE ${TABLE} SET ${clause} WHERE id = ?`, [
        ...values,
        id,
      ]);
      return this.findById(id);
    } catch (error) {
      throw storeError(error);
    }
  }

  async updateIf(
    id: string,
    predicate: (record: EdgeCredentialRecord) => boolean,
    patch: EdgeCredentialPatch,
  ): Promise<EdgeCredentialRecord | null> {
    try {
      return await withOptiHubTransaction(this.pool, async connection => {
        const [rows] = await connection.query<CredentialRow[]>(
          "SELECT * FROM " + TABLE + " WHERE id = ? FOR UPDATE",
          [id],
        );
        const current = rows[0];
        if (current === undefined || !predicate(toRecord(current))) return null;
        const { clause, values } = buildPatchSet(patch);
        if (clause !== "") {
          await connection.execute<ResultSetHeader>(`UPDATE ${TABLE} SET ${clause} WHERE id = ?`, [
            ...values,
            id,
          ]);
        }
        const [updated] = await connection.query<CredentialRow[]>(
          "SELECT * FROM " + TABLE + " WHERE id = ? LIMIT 1",
          [id],
        );
        return updated[0] === undefined ? null : toRecord(updated[0]);
      });
    } catch (error) {
      throw storeError(error);
    }
  }

  async claimRotation(claim: EdgeRotationClaim): Promise<boolean> {
    try {
      return await withOptiHubTransaction(this.pool, async connection => {
        const [rows] = await connection.query<CredentialRow[]>(
          "SELECT * FROM " + TABLE + " WHERE id = ? FOR UPDATE",
          [claim.previousId],
        );
        const row = rows[0];
        if (row === undefined) return false;
        const current = toRecord(row);
        if (credentialStatusAt(current, claim.at) !== "active" || current.rotatedToId !== null) {
          return false;
        }
        if (claim.expectedVersion !== undefined && current.version !== claim.expectedVersion) {
          return false;
        }

        const { clause, values } = buildPatchSet(claim.previousPatch);
        if (clause === "") return false;
        await connection.execute<ResultSetHeader>(`UPDATE ${TABLE} SET ${clause} WHERE id = ?`, [
          ...values,
          claim.previousId,
        ]);
        await connection.execute<ResultSetHeader>(insertSql(), insertValues(claim.successor));
        return true;
      });
    } catch (error) {
      throw storeError(error);
    }
  }

  private async findOne(sql: string, params: unknown[]): Promise<EdgeCredentialRecord | null> {
    try {
      const [rows] = await this.pool.query<CredentialRow[]>(sql, params);
      const row = rows[0];
      return row === undefined ? null : toRecord(row);
    } catch (error) {
      throw storeError(error);
    }
  }
}

export type { OptiHubDbPool };
