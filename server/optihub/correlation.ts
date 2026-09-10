/**
 * OPTIHUB EDGE - request and correlation identity.
 *
 * Two identifiers, never conflated:
 *  - the internal correlation id (`req_<uuid>`) is minted here and is the id
 *    everything downstream traces on: OPTIHUB -> ONYXO -> worker.
 *  - the external request id is a client-supplied label. It is accepted only if
 *    it is a safe, bounded token, and it never replaces the internal id.
 */

import { randomUUID } from "node:crypto";

export const EDGE_INTERNAL_REQUEST_ID_HEADER = "x-optihub-request-id";
export const EDGE_EXTERNAL_REQUEST_ID_HEADER = "x-request-id";

const SAFE_EXTERNAL_ID = /^[A-Za-z0-9._:@-]{8,128}$/;

export interface EdgeCorrelation {
  readonly requestId: string;
  readonly externalRequestId: string | null;
}

export function generateInternalRequestId(): string {
  return `req_${randomUUID()}`;
}

/**
 * Returns the client id only when it is well-formed; otherwise null. A malformed
 * or hostile value is dropped, never echoed into logs or responses.
 */
export function validateExternalRequestId(value: unknown): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (typeof candidate !== "string") return null;
  if (!SAFE_EXTERNAL_ID.test(candidate)) return null;
  return candidate;
}

export function createEdgeCorrelation(externalHeaderValue: unknown): EdgeCorrelation {
  return {
    requestId: generateInternalRequestId(),
    externalRequestId: validateExternalRequestId(externalHeaderValue),
  };
}
