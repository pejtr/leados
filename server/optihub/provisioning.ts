/**
 * OPTIHUB EDGE - credential provisioning and rotation.
 *
 * INTERNAL CONTROL PLANE ONLY. These functions are deliberately not reachable
 * over HTTP. The public edge consumes credentials; it never creates, rotates or
 * revokes them. A future admin control plane may call this module, but it must
 * be authenticated and audited on its own terms.
 *
 * The raw secret is returned exactly once, here. Everywhere else only the hash
 * exists.
 */

import { randomUUID } from "node:crypto";

import {
  buildEdgeCredential,
  credentialStatusAt,
  isEdgeSecretFormat,
  type EdgeCredentialRecord,
} from "./credentials";
import type { EdgeCredentialStore } from "./store";

/** Bounded transition window. An unbounded overlap is not expressible. */
export const MAX_ROTATION_OVERLAP_MS = 24 * 60 * 60 * 1000;

export class EdgeProvisioningError extends Error {
  readonly reason: string;

  constructor(reason: string) {
    super(reason);
    this.name = "EdgeProvisioningError";
    this.reason = reason;
  }
}

export interface ProvisionEdgeCredentialInput {
  readonly tenantId: string;
  readonly actorId: string;
  readonly scopes: readonly string[];
  /** `undefined` means non-expiring. */
  readonly expiresAt?: number | null;
  readonly metadata?: Readonly<Record<string, string>>;
}

export interface EdgeCredentialSecret {
  /** Returned once. Never persisted, never logged. */
  readonly secret: string;
  readonly record: EdgeCredentialRecord;
}

export async function provisionEdgeCredential(
  store: EdgeCredentialStore,
  input: ProvisionEdgeCredentialInput,
  now: number = Date.now(),
): Promise<EdgeCredentialSecret> {
  if (input.tenantId.trim() === "") {
    throw new EdgeProvisioningError("tenant_id_required");
  }
  if (input.actorId.trim() === "") {
    throw new EdgeProvisioningError("actor_id_required");
  }

  const draft = buildEdgeCredential(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
      metadata: input.metadata,
    },
    generateEdgeCredentialId(),
    now,
  );

  await store.insert(draft.record);
  return { secret: draft.secret, record: draft.record };
}

/**
 * Adopt a secret that already exists in a secret manager (bootstrap). The raw
 * value is never returned and never stored; only its hash is persisted.
 */
export async function registerEdgeCredential(
  store: EdgeCredentialStore,
  input: ProvisionEdgeCredentialInput & { readonly secret: string },
  now: number = Date.now(),
): Promise<EdgeCredentialRecord> {
  if (input.tenantId.trim() === "") {
    throw new EdgeProvisioningError("tenant_id_required");
  }
  if (input.actorId.trim() === "") {
    throw new EdgeProvisioningError("actor_id_required");
  }
  if (!isEdgeSecretFormat(input.secret)) {
    throw new EdgeProvisioningError("secret_format_invalid");
  }

  const draft = buildEdgeCredential(
    {
      tenantId: input.tenantId,
      actorId: input.actorId,
      scopes: input.scopes,
      expiresAt: input.expiresAt ?? null,
      metadata: input.metadata,
      secret: input.secret,
    },
    generateEdgeCredentialId(),
    now,
  );

  await store.insert(draft.record);
  return draft.record;
}

export interface RotateEdgeCredentialOptions {
  /** Defaults to the previous credential's scopes. */
  readonly scopes?: readonly string[];
  /** Defaults to the previous credential's expiry. */
  readonly expiresAt?: number | null;
  readonly metadata?: Readonly<Record<string, string>>;
  /**
   * Explicit, bounded overlap so the old credential keeps working briefly.
   * Omitted means "no overlap": the old credential is revoked immediately.
   */
  readonly overlapMs?: number;
}

/**
 * Rotate `credentialId` to a new version.
 *
 * The claim on the old credential is a single compare-and-swap, so two
 * concurrent rotations cannot both create a successor.
 */
export async function rotateEdgeCredential(
  store: EdgeCredentialStore,
  credentialId: string,
  options: RotateEdgeCredentialOptions = {},
  now: number = Date.now(),
): Promise<EdgeCredentialSecret> {
  const current = await store.findById(credentialId);
  if (current === null) throw new EdgeProvisioningError("credential_not_found");
  if (credentialStatusAt(current, now) !== "active") {
    throw new EdgeProvisioningError("credential_not_active");
  }
  if (current.rotatedToId !== null) {
    throw new EdgeProvisioningError("credential_already_rotated");
  }

  const overlapMs = resolveOverlap(options.overlapMs);
  const successorId = generateEdgeCredentialId();
  const draft = buildEdgeCredential(
    {
      tenantId: current.tenantId,
      actorId: current.actorId,
      scopes: options.scopes ?? [...current.scopes],
      expiresAt: options.expiresAt === undefined ? current.expiresAt : options.expiresAt,
      metadata: options.metadata ?? current.metadata,
      version: current.version + 1,
      rotatedFromId: current.id,
    },
    successorId,
    now,
  );

  const patch =
    overlapMs === undefined
      ? { rotatedToId: successorId, status: "revoked" as const, revokedAt: now }
      : {
          rotatedToId: successorId,
          expiresAt: earliestExpiry(current.expiresAt, now + overlapMs),
        };

  const claimed = await store.updateIf(
    current.id,
    record =>
      credentialStatusAt(record, now) === "active" && record.rotatedToId === null,
    patch,
  );
  if (claimed === null) throw new EdgeProvisioningError("rotation_race_lost");

  await store.insert(draft.record);
  return { secret: draft.secret, record: draft.record };
}

export async function revokeEdgeCredential(
  store: EdgeCredentialStore,
  credentialId: string,
  now: number = Date.now(),
): Promise<EdgeCredentialRecord | null> {
  return store.updateIf(
    credentialId,
    record => record.status !== "revoked",
    { status: "revoked", revokedAt: now },
  );
}

export function generateEdgeCredentialId(): string {
  return `ohc_${randomUUID()}`;
}

function resolveOverlap(overlapMs: number | undefined): number | undefined {
  if (overlapMs === undefined) return undefined;
  if (!Number.isFinite(overlapMs) || overlapMs <= 0) {
    throw new EdgeProvisioningError("invalid_overlap");
  }
  if (overlapMs > MAX_ROTATION_OVERLAP_MS) {
    throw new EdgeProvisioningError("overlap_too_long");
  }
  return overlapMs;
}

function earliestExpiry(current: number | null, candidate: number): number {
  if (current === null) return candidate;
  return Math.min(current, candidate);
}
