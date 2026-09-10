/**
 * OPTIHUB EDGE - tenant resolution.
 *
 * The tenant is derived exclusively from the verified credential. A tenant id in
 * the request body, query or header is only ever compared against the resolved
 * tenant; it is never a source of authority. A mismatch is a denial, not a hint.
 */

import type { EdgeCredentialRecord } from "./credentials";
import type { EdgeScope } from "./scopes";

export interface EdgePrincipal {
  readonly tenantId: string;
  readonly actorId: string;
  readonly credentialId: string;
  readonly credentialVersion: number;
  readonly scopes: readonly EdgeScope[];
}

/**
 * Resolve the trusted principal. The only input is a stored credential; there is
 * no code path where a caller-supplied tenant influences this value.
 */
export function resolveEdgeTenant(record: EdgeCredentialRecord): EdgePrincipal {
  return {
    tenantId: record.tenantId,
    actorId: record.actorId,
    credentialId: record.id,
    credentialVersion: record.version,
    scopes: record.scopes,
  };
}

export type RequestedTenantCheck = { readonly ok: true } | { readonly ok: false; readonly reason: string };

export function checkRequestedTenant(
  principal: EdgePrincipal,
  requestedTenantId: string | null | undefined,
): RequestedTenantCheck {
  if (requestedTenantId === null || requestedTenantId === undefined) return { ok: true };
  if (typeof requestedTenantId !== "string") return { ok: false, reason: "tenant_id_not_a_string" };
  if (requestedTenantId.trim() === "") return { ok: true };
  if (requestedTenantId !== principal.tenantId) {
    return { ok: false, reason: "cross_tenant_request" };
  }
  return { ok: true };
}

/**
 * Extract a caller-supplied tenant id for *comparison only*. It is intentionally
 * limited to unambiguous locations and is never trusted.
 */
export function readRequestedTenantId(input: {
  readonly header?: unknown;
  readonly body?: unknown;
  readonly query?: unknown;
}): string | null {
  const fromHeader = firstString(input.header);
  if (fromHeader !== null) return fromHeader;

  if (typeof input.body === "object" && input.body !== null) {
    const value = (input.body as Record<string, unknown>)["tenantId"] ?? (input.body as Record<string, unknown>)["tenant_id"];
    const fromBody = firstString(value);
    if (fromBody !== null) return fromBody;
  }

  if (typeof input.query === "object" && input.query !== null) {
    const value = (input.query as Record<string, unknown>)["tenantId"] ?? (input.query as Record<string, unknown>)["tenant_id"];
    const fromQuery = firstString(value);
    if (fromQuery !== null) return fromQuery;
  }

  return null;
}

function firstString(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
}

/**
 * The canonical machine gateway context handed to downstream services. Its field
 * set is pinned to the boundary contract so OPTIHUB, ONYXO and workers agree on
 * the wire shape. `tenantId` in this object is the resolved tenant, and it is the
 * only place downstream may read tenant identity from.
 */
export interface MachineGatewayContext {
  readonly requestId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly scopes: readonly EdgeScope[];
  readonly policyVersion: string;
}

export function buildMachineGatewayContext(
  principal: EdgePrincipal,
  requestId: string,
  policyVersion: string,
): MachineGatewayContext {
  return {
    requestId,
    tenantId: principal.tenantId,
    actorId: principal.actorId,
    scopes: principal.scopes,
    policyVersion,
  };
}
