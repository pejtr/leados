/**
 * OPTIHUB EDGE - explicit handler response.
 *
 * Most edge handlers return a body and the route's nominal status is used. A
 * handler that must control its own HTTP status - an MCP notification is
 * answered 202 with no body - returns an `EdgeHandlerResponse` instead. Plain
 * handler return values are unaffected, so the REST contract does not change.
 */

export interface EdgeHandlerResponse {
  readonly kind: "edge_handler_response";
  readonly status: number;
  readonly body?: unknown;
}

export function edgeHandlerResponse(status: number, body?: unknown): EdgeHandlerResponse {
  return { kind: "edge_handler_response", status, body };
}

export function isEdgeHandlerResponse(value: unknown): value is EdgeHandlerResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as { kind?: unknown }).kind === "edge_handler_response"
  );
}
