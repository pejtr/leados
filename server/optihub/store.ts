/**
 * OPTIHUB EDGE - credential storage boundary.
 *
 * The edge depends on this interface, never on a concrete database. The
 * in-memory implementation is the P1 reference store: it is real code (not a
 * test double) and it is what the runtime uses today. A MySQL/Drizzle store can
 * be dropped in behind the same contract without touching the pipeline.
 *
 * Mutating operations are synchronous internally, so `updateIf` gives
 * compare-and-swap semantics. That is what makes rotation race-safe: two
 * concurrent rotations of the same credential cannot both win.
 */

import {
  credentialStatusAt,
  type EdgeCredentialRecord,
  type EdgeCredentialStatus,
} from "./credentials";

export interface EdgeCredentialPatch {
  readonly status?: EdgeCredentialStatus;
  readonly expiresAt?: number | null;
  readonly rotatedToId?: string | null;
  readonly revokedAt?: number | null;
  readonly lastUsedAt?: number | null;
}

export interface EdgeCredentialStore {
  insert(record: EdgeCredentialRecord): Promise<void>;
  findById(id: string): Promise<EdgeCredentialRecord | null>;
  findBySecretHash(secretHash: string): Promise<EdgeCredentialRecord | null>;
  listByTenant(tenantId: string): Promise<readonly EdgeCredentialRecord[]>;
  update(id: string, patch: EdgeCredentialPatch): Promise<EdgeCredentialRecord | null>;
  /**
   * Atomic compare-and-swap: apply `patch` only when `predicate` holds for the
   * current record. Returns the updated record, or null when the predicate
   * failed or the id is unknown.
   */
  updateIf(
    id: string,
    predicate: (record: EdgeCredentialRecord) => boolean,
    patch: EdgeCredentialPatch,
  ): Promise<EdgeCredentialRecord | null>;
  /**
   * Atomically claim `previousId` for rotation and insert its successor in one
   * unit of work. Returns false when the claim lost a race (the credential is
   * no longer active, already rotated, or at a different version). A false
   * result leaves the store untouched: there is no half-rotated credential.
   */
  claimRotation(claim: EdgeRotationClaim): Promise<boolean>;
}

export interface EdgeRotationClaim {
  readonly previousId: string;
  /** Absolute time used to evaluate the previous credential's status. */
  readonly at: number;
  /** Allowed only if the previous record still has this version. */
  readonly expectedVersion?: number;
  readonly previousPatch: EdgeCredentialPatch;
  readonly successor: EdgeCredentialRecord;
}

export class InMemoryEdgeCredentialStore implements EdgeCredentialStore {
  private readonly byId = new Map<string, EdgeCredentialRecord>();
  private readonly byHash = new Map<string, string>();

  async insert(record: EdgeCredentialRecord): Promise<void> {
    if (this.byId.has(record.id)) {
      throw new Error("edge credential id already exists");
    }
    if (this.byHash.has(record.secretHash)) {
      throw new Error("edge credential secret already exists");
    }
    this.byId.set(record.id, record);
    this.byHash.set(record.secretHash, record.id);
  }

  async findById(id: string): Promise<EdgeCredentialRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async findBySecretHash(secretHash: string): Promise<EdgeCredentialRecord | null> {
    const id = this.byHash.get(secretHash);
    if (id === undefined) return null;
    return this.byId.get(id) ?? null;
  }

  async listByTenant(tenantId: string): Promise<readonly EdgeCredentialRecord[]> {
    return Array.from(this.byId.values()).filter(record => record.tenantId === tenantId);
  }

  async update(id: string, patch: EdgeCredentialPatch): Promise<EdgeCredentialRecord | null> {
    const current = this.byId.get(id);
    if (current === undefined) return null;
    const next = applyPatch(current, patch);
    this.byId.set(id, next);
    return next;
  }

  async updateIf(
    id: string,
    predicate: (record: EdgeCredentialRecord) => boolean,
    patch: EdgeCredentialPatch,
  ): Promise<EdgeCredentialRecord | null> {
    const current = this.byId.get(id);
    if (current === undefined || !predicate(current)) return null;
    const next = applyPatch(current, patch);
    this.byId.set(id, next);
    return next;
  }

  async claimRotation(claim: EdgeRotationClaim): Promise<boolean> {
    const current = this.byId.get(claim.previousId);
    if (current === undefined) return false;
    if (credentialStatusAt(current, claim.at) !== "active" || current.rotatedToId !== null) {
      return false;
    }
    if (claim.expectedVersion !== undefined && current.version !== claim.expectedVersion) {
      return false;
    }
    if (this.byId.has(claim.successor.id) || this.byHash.has(claim.successor.secretHash)) {
      throw new Error("edge credential successor already exists");
    }
    // No await between the check and both mutations: the claim is atomic on the
    // single JS thread, so two concurrent rotations cannot both win.
    this.byId.set(current.id, applyPatch(current, claim.previousPatch));
    this.byId.set(claim.successor.id, claim.successor);
    this.byHash.set(claim.successor.secretHash, claim.successor.id);
    return true;
  }
}

function applyPatch(
  record: EdgeCredentialRecord,
  patch: EdgeCredentialPatch,
): EdgeCredentialRecord {
  return {
    ...record,
    status: patch.status ?? record.status,
    expiresAt: patch.expiresAt === undefined ? record.expiresAt : patch.expiresAt,
    rotatedToId: patch.rotatedToId === undefined ? record.rotatedToId : patch.rotatedToId,
    revokedAt: patch.revokedAt === undefined ? record.revokedAt : patch.revokedAt,
    lastUsedAt: patch.lastUsedAt === undefined ? record.lastUsedAt : patch.lastUsedAt,
  };
}
