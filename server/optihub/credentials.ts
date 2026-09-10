/**
 * OPTIHUB EDGE - credential primitives.
 *
 * An edge credential is a high-entropy bearer secret. Only its SHA-256 hash is
 * ever stored; the raw secret exists at provisioning time and is returned to
 * the caller exactly once. Verification hashes the presented secret and compares
 * in constant time, so a wrong secret leaks nothing through timing.
 *
 * The `ohk_` prefix exists so a payment-provider secret, an OAuth token or any
 * other credential shape can never be mistaken for an edge credential.
 */

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { EDGE_SCOPES, normalizeEdgeScopes, type EdgeScope } from "./scopes";

export const EDGE_CREDENTIAL_PREFIX = "ohk_";

const SECRET_BYTES = 32;

/** Explicit prefix requirement. Anything else is not even a candidate. */
export const EDGE_SECRET_PATTERN = /^ohk_[A-Za-z0-9_-]{40,}$/;

export type EdgeCredentialStatus = "active" | "revoked" | "expired";

export interface EdgeCredentialRecord {
  /** Stable credential identifier. Safe to log; it is not a secret. */
  readonly id: string;
  readonly tenantId: string;
  /** The human/service principal this credential acts as, within the tenant. */
  readonly actorId: string;
  /** SHA-256 hex of the raw secret. Never the raw secret. */
  readonly secretHash: string;
  readonly status: EdgeCredentialStatus;
  readonly createdAt: number;
  /** `null` is an explicit non-expiring decision, not a missing value. */
  readonly expiresAt: number | null;
  /** Monotonic per rotation chain. Starts at 1. */
  readonly version: number;
  readonly scopes: readonly EdgeScope[];
  /** Non-secret labels only. Redacted before it reaches any audit sink. */
  readonly metadata: Readonly<Record<string, string>>;
  /** The credential this one replaced, when created by rotation. */
  readonly rotatedFromId: string | null;
  /** Set atomically when rotation claims this credential. Also the CAS marker. */
  readonly rotatedToId: string | null;
  readonly revokedAt: number | null;
  readonly lastUsedAt: number | null;
}

export function generateEdgeSecret(): string {
  return `${EDGE_CREDENTIAL_PREFIX}${randomBytes(SECRET_BYTES).toString("base64url")}`;
}

export function isEdgeSecretFormat(secret: string): boolean {
  return EDGE_SECRET_PATTERN.test(secret);
}

export function hashEdgeSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

/** Constant-time comparison of a presented secret against a stored hash. */
export function verifyEdgeSecret(secret: string, secretHash: string): boolean {
  const presented = Buffer.from(hashEdgeSecret(secret), "hex");
  const stored = Buffer.from(secretHash, "hex");
  if (presented.length !== stored.length || stored.length === 0) return false;
  return timingSafeEqual(presented, stored);
}

/**
 * The effective status at `now`. Revocation wins over expiry: a revoked
 * credential stays revoked even if it also passed its expiry.
 */
export function credentialStatusAt(
  record: Pick<EdgeCredentialRecord, "status" | "expiresAt" | "revokedAt">,
  now: number,
): EdgeCredentialStatus {
  if (record.status === "revoked" || record.revokedAt !== null) return "revoked";
  if (record.expiresAt !== null && record.expiresAt <= now) return "expired";
  return "active";
}

export interface NewEdgeCredential {
  readonly tenantId: string;
  readonly actorId: string;
  readonly scopes: readonly string[];
  /** `undefined` means non-expiring; a number is an absolute epoch millis. */
  readonly expiresAt?: number | null;
  readonly metadata?: Readonly<Record<string, string>>;
  readonly version?: number;
  readonly rotatedFromId?: string | null;
  /**
   * A pre-existing secret to adopt (bootstrap from a secret manager). When
   * omitted a fresh secret is generated. Either way only the hash is stored.
   */
  readonly secret?: string;
}

export interface EdgeCredentialDraft {
  readonly record: EdgeCredentialRecord;
  readonly secret: string;
}

/**
 * Build a credential record plus its one-time raw secret. This does not persist
 * anything; the store owns persistence.
 */
export function buildEdgeCredential(
  input: NewEdgeCredential,
  id: string,
  now: number,
): EdgeCredentialDraft {
  const secret = input.secret ?? generateEdgeSecret();
  return {
    secret,
    record: {
      id,
      tenantId: input.tenantId,
      actorId: input.actorId,
      secretHash: hashEdgeSecret(secret),
      status: "active",
      createdAt: now,
      expiresAt: input.expiresAt ?? null,
      version: input.version ?? 1,
      scopes: normalizeEdgeScopes(input.scopes),
      metadata: input.metadata ?? {},
      rotatedFromId: input.rotatedFromId ?? null,
      rotatedToId: null,
      revokedAt: null,
      lastUsedAt: null,
    },
  };
}

export function isKnownEdgeScope(value: string): value is EdgeScope {
  return (EDGE_SCOPES as readonly string[]).includes(value);
}
