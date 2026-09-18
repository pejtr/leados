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

import { randomUUID } from "node:crypto";

import { resolveRequestedAlias, ALIAS_QUERY_PARAM, type AliasRegistry } from "./alias";
import { edgeErrorBody, edgeErrorStatus } from "./errors";
import type { EdgeHandlerContext, ProtectedEdgeRoute } from "./edge";
import { edgeHandlerResponse } from "./handlerResponse";
import { callOmniReadTool, probeOmniToolProvider } from "./toolFabric/broker";
import { planOmniToolRoute } from "./toolFabric/catalog";
import { resolveOmniToolProviders } from "./toolFabric/config";
import {
  OMNI_TOOL_INTENTS,
  OMNI_TOOL_PROVIDER_IDS,
  type OmniToolIntent,
  type OmniToolProviderId,
} from "./toolFabric/types";

export const MCP_PROTOCOL_VERSION = "2025-06-18";
export const MCP_SERVER_NAME = "optihub-mcp";
export const MCP_ROUTE_PATH = "/mcp";
/**
 * Streamable-HTTP session header. Minted on `initialize` and echoed to the
 * client. The adapter keeps no server-side session state, so the id is a
 * correlation handle, not a server resource.
 */
export const MCP_SESSION_ID_HEADER = "mcp-session-id";

const SESSION_ID_PATTERN = /^[A-Za-z0-9._-]{8,128}$/;

function boundedString(value: unknown, maxLength: number): string | null {
  return typeof value === "string" ? value.slice(0, maxLength) : null;
}

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

/** Input for the read-only interoperability handshake. */
const TEST_CONNECT_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    requestId: { type: "string", description: "Client-side correlation id." },
    message: { type: "string", description: "Free-form probe message, echoed back." },
    client: { type: "string", description: "Client name, echoed back." },
  },
  additionalProperties: false,
};

const OMNI_ROUTE_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { intent: { type: "string", enum: OMNI_TOOL_INTENTS } },
  required: ["intent"],
  additionalProperties: false,
};

const OMNI_PROBE_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: { provider: { type: "string", enum: OMNI_TOOL_PROVIDER_IDS } },
  required: ["provider"],
  additionalProperties: false,
};

const OMNI_READ_INPUT_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    provider: { type: "string", enum: OMNI_TOOL_PROVIDER_IDS },
    tool: { type: "string", minLength: 1, maxLength: 128 },
    arguments: { type: "object", additionalProperties: true },
  },
  required: ["provider", "tool"],
  additionalProperties: false,
};

/**
 * Read-only capabilities, each backed by an existing edge read path: the
 * principal context (`/v1/context`), the public manifest (`/v1/manifest`) and
 * readiness (`/ready`). `test_connect` is a pure echo handshake: it reads nothing
 * and changes nothing.
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
  {
    name: "omni_tool_catalog",
    description: "Read OMNI Tool Fabric provider readiness without exposing credentials.",
    inputSchema: EMPTY_INPUT_SCHEMA,
  },
  {
    name: "omni_tool_route",
    description: "Plan providers, risk and human-gate requirements for a supported intent.",
    inputSchema: OMNI_ROUTE_INPUT_SCHEMA,
  },
  {
    name: "omni_tool_probe",
    description: "Probe one enabled provider with MCP initialize + tools/list; no provider tool executes.",
    inputSchema: OMNI_PROBE_INPUT_SCHEMA,
  },
  {
    name: "omni_tool_read",
    description: "Execute an explicitly allowlisted read-only provider tool through OPTIHUB.",
    inputSchema: OMNI_READ_INPUT_SCHEMA,
  },
  {
    name: "test_connect",
    description:
      "Interoperability handshake. Echoes the caller's probe and reports connection=verified. Read-only: never billable, never mutating.",
    inputSchema: TEST_CONNECT_INPUT_SCHEMA,
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
  /**
   * Public alias registry. When present, a request that carries `?o=` must
   * resolve to the same internal identity as the verified credential.
   */
  readonly aliases?: AliasRegistry;
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
  args: Record<string, unknown>,
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
    case "omni_tool_catalog":
      return textResult({
        providers: resolveOmniToolProviders(process.env).map(runtime => ({
          id: runtime.definition.id,
          name: runtime.definition.name,
          role: runtime.definition.role,
          capabilities: runtime.definition.capabilities,
          transport: runtime.definition.transport,
          configured: runtime.configured,
          enabled: runtime.enabled,
          status: runtime.statusReason,
          writeDefaultDisabled: runtime.definition.writeDefaultDisabled,
          humanGate: runtime.definition.humanGate,
        })),
        mutations: 0,
        secretsExposed: false,
      });
    case "omni_tool_route": {
      const rawIntent = args["intent"];
      if (typeof rawIntent !== "string" || !OMNI_TOOL_INTENTS.includes(rawIntent as OmniToolIntent)) {
        return { content: [{ type: "text", text: "unsupported_intent" }], isError: true };
      }
      const plan = planOmniToolRoute(rawIntent as OmniToolIntent);
      const runtimes = resolveOmniToolProviders(process.env);
      return textResult({
        ...plan,
        providers: plan.providers.map(id => {
          const runtime = runtimes.find(item => item.definition.id === id);
          return {
            id,
            configured: runtime?.configured ?? false,
            enabled: runtime?.enabled ?? false,
            status: runtime?.statusReason ?? "missing",
          };
        }),
        mutations: 0,
      });
    }
    case "omni_tool_probe": {
      const rawProvider = args["provider"];
      if (typeof rawProvider !== "string" || !OMNI_TOOL_PROVIDER_IDS.includes(rawProvider as OmniToolProviderId)) {
        return { content: [{ type: "text", text: "unsupported_provider" }], isError: true };
      }
      return textResult(await probeOmniToolProvider(rawProvider as OmniToolProviderId));
    }
    case "omni_tool_read": {
      const rawProvider = args["provider"];
      const rawTool = args["tool"];
      const rawArguments = args["arguments"];
      if (
        typeof rawProvider !== "string" ||
        !OMNI_TOOL_PROVIDER_IDS.includes(rawProvider as OmniToolProviderId) ||
        typeof rawTool !== "string" ||
        !rawTool.trim() ||
        (rawArguments !== undefined &&
          (typeof rawArguments !== "object" || rawArguments === null || Array.isArray(rawArguments)))
      ) {
        return { content: [{ type: "text", text: "invalid_tool_request" }], isError: true };
      }
      try {
        const result = await callOmniReadTool(
          rawProvider as OmniToolProviderId,
          rawTool,
          (rawArguments as Record<string, unknown> | undefined) ?? {},
        );
        return textResult({ provider: rawProvider, tool: rawTool, result, mutations: 0 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "omni_tool_read_failed";
        return { content: [{ type: "text", text: message.slice(0, 512) }], isError: true };
      }
    }
    case "test_connect":
      return textResult({
        ok: true,
        connection: "verified",
        requestId: boundedString(args["requestId"], 128) ?? context.requestId,
        message: boundedString(args["message"], 512) ?? "",
        client: boundedString(args["client"], 64) ?? "",
        server: MCP_SERVER_NAME,
        billable: false,
        mutations: 0,
      });
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
      const args =
        typeof params["arguments"] === "object" && params["arguments"] !== null
          ? (params["arguments"] as Record<string, unknown>)
          : {};
      return callTool(name, context, ports, args).then(result => jsonRpcResult(id, result));
    }
    default:
      return Promise.resolve(jsonRpcError(id, -32601, "Method not found"));
  }
}

/**
 * Enforce the `o` alias contract for an authenticated MCP request. An unknown
 * alias and a known alias bound to a different identity produce the identical
 * denial, so the endpoint cannot be used to enumerate aliases.
 */
function aliasDenial(
  context: EdgeHandlerContext,
  ports: McpEdgePorts,
): { readonly status: number; readonly body: unknown } | null {
  const registry = ports.aliases;
  if (registry === undefined) return null;

  const resolution = resolveRequestedAlias(registry, context.request.query[ALIAS_QUERY_PARAM]);
  if (resolution.kind === "none") return null;
  if (resolution.kind === "malformed") {
    return {
      status: edgeErrorStatus("BAD_REQUEST"),
      body: edgeErrorBody("BAD_REQUEST", "malformed_alias", context.requestId),
    };
  }
  if (resolution.kind === "unknown" || resolution.oID !== context.principal.tenantId) {
    return {
      status: edgeErrorStatus("TENANT_DENIED"),
      body: edgeErrorBody("TENANT_DENIED", "alias_identity_mismatch", context.requestId),
    };
  }
  return null;
}

/** Mint (or echo) the streamable-HTTP session id on `initialize` only. */
function initializeSessionId(body: unknown, context: EdgeHandlerContext): string | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;
  if ((body as Record<string, unknown>)["method"] !== "initialize") return null;

  const incoming = context.request.headers[MCP_SESSION_ID_HEADER];
  const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
  if (typeof candidate === "string" && SESSION_ID_PATTERN.test(candidate)) return candidate;
  return randomUUID();
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
  const denied = aliasDenial(context, ports);
  if (denied !== null) return edgeHandlerResponse(denied.status, denied.body);

  const body = context.request.body as unknown;
  if (Array.isArray(body)) return jsonRpcError(null, -32600, "Invalid Request");

  const response = await dispatchMcpMessage(body, context, ports);
  if (response === undefined) return edgeHandlerResponse(202);

  const sessionId = initializeSessionId(body, context);
  if (sessionId === null) return response;
  return edgeHandlerResponse(200, response, { [MCP_SESSION_ID_HEADER]: sessionId });
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
