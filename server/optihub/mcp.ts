/**
 * OPTIHUB EDGE - minimal MCP adapter (P2.0).
 *
 * A read-only Model Context Protocol endpoint served on the `mcp` ingress
 * surface. It adds no second auth system: every call is an ordinary protected
 * edge request, so origin authentication, credential verification, tenant
 * isolation, scope authorization, policy evaluation, rate limiting and audit are
 * exactly the controls the REST API already uses.
 *
 * Only read-only capabilities are exposed. There are no write, shell, deploy or
 * payment tools, and the route is bound to the `mcp` surface alone.
 */

import type { EdgeHandlerContext, ProtectedEdgeRoute } from "./edge";
import { edgeHandlerResponse } from "./handlerResponse";

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MCP_SERVER_NAME = "optihub-mcp";
export const MCP_ROUTE_PATH = "/mcp";

export interface McpToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
}

const EMPTY_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {},
  additionalProperties: false,
};

/**
 * Read-only capabilities, each backed by an existing edge read path: the
 * principal context (`/v1/context`), the public manifest (`/v1/manifest`) and
 * readiness (`/ready`).
 */
export const MCP_TOOLS: readonly McpToolDefinition[] = [
  {
    name: "optihub_context",
    description:
      "Read the calling credential's resolved OPTIHUB context: tenant, actor, credential, scopes and policy version.",
    inputSchema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "optihub_manifest",
    description:
      "Read the OPTIHUB edge manifest: enabled surfaces, auth scheme, request pipeline and policy version.",
    inputSchema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "optihub_readiness",
    description: "Read OPTIHUB edge readiness (durable dependency health). Read-only status.",
    inputSchema: EMPTY_INPUT_SCHEMA,
  },
];

const MCP_TOOL_NAMES: ReadonlySet<string> = new Set(MCP_TOOLS.map(tool => tool.name));

/**
 * The bits of the edge the adapter needs, injected as values so the module has
 * no runtime dependency back on `edge.ts` (only type imports).
 */
export interface McpEdgePorts {
  readonly version: string;
  /** Absolute edge path of the MCP endpoint, e.g. `/api/optihub/mcp`. */
  readonly endpoint: string;
  readonly manifest: () => Record<string, unknown>;
  readonly readiness: () => Promise<boolean>;
}

interface JsonRpcSuccess {
  readonly jsonrpc: "2.0";
  readonly id: unknown;
  readonly result: unknown;
}

interface JsonRpcFailure {
  readonly jsonrpc: "2.0";
  readonly id: unknown;
  readonly error: { readonly code: number; readonly message: string };
}

type JsonRpcResponse = JsonRpcSuccess | JsonRpcFailure;

function jsonRpcResult(id: unknown, result: unknown): JsonRpcSuccess {
  return { jsonrpc: "2.0", id, result };
}

function jsonRpcError(id: unknown, code: number, message: string): JsonRpcFailure {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

interface McpTextResult {
  readonly content: ReadonlyArray<{ readonly type: "text"; readonly text: string }>;
  readonly isError?: boolean;
}

function textResult(value: unknown): McpTextResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

async function callTool(
  name: string,
  context: EdgeHandlerContext,
  ports: McpEdgePorts,
): Promise<McpTextResult> {
  switch (name) {
    case "optihub_context":
      return textResult({
        tenantId: context.principal.tenantId,
        actorId: context.principal.actorId,
        credentialId: context.principal.credentialId,
        credentialVersion: context.principal.credentialVersion,
        scopes: context.principal.scopes,
        policyVersion: context.gatewayContext.policyVersion,
        requestId: context.requestId,
      });
    case "optihub_manifest":
      return textResult(ports.manifest());
    case "optihub_readiness":
      return textResult({ status: (await ports.readiness()) ? "ready" : "not_ready" });
    default:
      return { content: [{ type: "text", text: `unknown_tool:${name}` }], isError: true };
  }
}

function dispatchMcpMessage(
  raw: unknown,
  context: EdgeHandlerContext,
  ports: McpEdgePorts,
): Promise<JsonRpcResponse | undefined> {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return Promise.resolve(jsonRpcError(null, -32600, "Invalid Request"));
  }
  const message = raw as Record<string, unknown>;
  const id = message["id"] ?? null;
  const isNotification = message["id"] === undefined || message["id"] === null;
  const method = message["method"];

  if (typeof method !== "string") {
    // A message without a method is not a valid request *or* notification.
    return Promise.resolve(jsonRpcError(id, -32600, "Invalid Request"));
  }
  // Notifications carry no id and receive no JSON-RPC response.
  if (isNotification) return Promise.resolve(undefined);

  switch (method) {
    case "initialize":
      return Promise.resolve(
        jsonRpcResult(id, {
          protocolVersion: MCP_PROTOCOL_VERSION,
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: MCP_SERVER_NAME, version: ports.version },
          instructions:
            "Read-only OPTIHUB control-plane context. No write, shell, deploy or payment tools.",
        }),
      );
    case "ping":
      return Promise.resolve(jsonRpcResult(id, {}));
    case "tools/list":
      return Promise.resolve(jsonRpcResult(id, { tools: MCP_TOOLS }));
    case "tools/call": {
      const params = (message["params"] ?? {}) as Record<string, unknown>;
      const name = typeof params["name"] === "string" ? params["name"] : "";
      if (!MCP_TOOL_NAMES.has(name)) {
        return Promise.resolve(jsonRpcError(id, -32602, `Unknown tool: ${name}`));
      }
      return callTool(name, context, ports).then(result => jsonRpcResult(id, result));
    }
    default:
      return Promise.resolve(jsonRpcError(id, -32601, "Method not found"));
  }
}

/**
 * Handle one MCP JSON-RPC POST. Returns the JSON-RPC response, or a 202 with no
 * body when the message was a notification. JSON-RPC batches are rejected: MCP's
 * streamable HTTP transport does not use them.
 */
export async function handleMcpPost(
  context: EdgeHandlerContext,
  ports: McpEdgePorts,
): Promise<unknown> {
  const body = context.request.body as unknown;
  if (Array.isArray(body)) return jsonRpcError(null, -32600, "Invalid Request");

  const response = await dispatchMcpMessage(body, context, ports);
  return response === undefined ? edgeHandlerResponse(202) : response;
}

/**
 * The MCP surface route set: read risk, bound to the `mcp` surface, gated on the
 * same read scope and policy action as the REST read path.
 */
export function defaultMcpEdgeRoutes(ports: McpEdgePorts): readonly ProtectedEdgeRoute[] {
  return [
    {
      method: "get",
      path: MCP_ROUTE_PATH,
      action: "mcp:rpc",
      requiredScope: "projects:read",
      policyAction: "projects:read",
      risk: "read",
      surfaces: ["mcp"],
      handler: () => ({
        service: MCP_SERVER_NAME,
        transport: "streamable-http",
        protocolVersion: MCP_PROTOCOL_VERSION,
        endpoint: ports.endpoint,
        server: { name: MCP_SERVER_NAME, version: ports.version },
        tools: MCP_TOOLS.map(tool => tool.name),
      }),
    },
    {
      method: "post",
      path: MCP_ROUTE_PATH,
      action: "mcp:rpc",
      requiredScope: "projects:read",
      policyAction: "projects:read",
      risk: "read",
      surfaces: ["mcp"],
      handler: context => handleMcpPost(context, ports),
    },
  ];
}
