/**
 * OPTIHUB EDGE - stable machine-readable error contract.
 *
 * Every failure the edge can produce has one code, one HTTP status and one
 * shape. Business handlers never build these responses themselves: an edge
 * denial is emitted by the pipeline, before (or instead of) the handler.
 *
 * The response deliberately carries no stack trace, no dependency name and no
 * configuration detail.
 */

export const EDGE_ERROR_STATUS = {
  MISSING_CREDENTIAL: 401,
  INVALID_CREDENTIAL: 401,
  EXPIRED_CREDENTIAL: 401,
  REVOKED_CREDENTIAL: 401,
  TENANT_DENIED: 403,
  SCOPE_DENIED: 403,
  POLICY_DENIED: 403,
  HOST_DENIED: 403,
  SURFACE_NOT_ENABLED: 501,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  PAYLOAD_TOO_LARGE: 413,
  RATE_LIMITED: 429,
  RATE_LIMIT_UNAVAILABLE: 503,
  INTERNAL: 500,
} as const;

export type EdgeErrorCode = keyof typeof EDGE_ERROR_STATUS;

export interface EdgeErrorBody {
  error: {
    code: EdgeErrorCode;
    message: string;
    reason: string;
    requestId: string;
  };
}

/**
 * Stable, human-readable message per code. The machine contract is `code`; the
 * specific cause is `reason`. Neither is ever a stack trace or a dependency name.
 */
const EDGE_ERROR_MESSAGES: Record<EdgeErrorCode, string> = {
  MISSING_CREDENTIAL: "A credential is required for this endpoint.",
  INVALID_CREDENTIAL: "The provided credential is not valid.",
  EXPIRED_CREDENTIAL: "The provided credential has expired.",
  REVOKED_CREDENTIAL: "The provided credential has been revoked.",
  TENANT_DENIED: "The request is not permitted for this tenant.",
  SCOPE_DENIED: "The credential does not grant the required scope.",
  POLICY_DENIED: "The request was denied by policy.",
  HOST_DENIED: "This host is not a permitted OPTIHUB entrypoint.",
  SURFACE_NOT_ENABLED: "This OPTIHUB surface is not enabled.",
  NOT_FOUND: "The requested resource was not found.",
  BAD_REQUEST: "The request body could not be processed.",
  PAYLOAD_TOO_LARGE: "The request body exceeds the allowed size.",
  RATE_LIMITED: "The rate limit for this action was exceeded.",
  RATE_LIMIT_UNAVAILABLE: "The request was denied because rate limiting is unavailable.",
  INTERNAL: "The edge could not complete the request.",
};

export function edgeErrorStatus(code: EdgeErrorCode): number {
  return EDGE_ERROR_STATUS[code];
}

export function edgeErrorBody(
  code: EdgeErrorCode,
  reason: string,
  requestId: string,
): EdgeErrorBody {
  return { error: { code, message: EDGE_ERROR_MESSAGES[code], reason, requestId } };
}
