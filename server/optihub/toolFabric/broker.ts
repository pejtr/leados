import { omniToolProvider } from "./catalog";
import { resolveOmniToolProviders } from "./config";
import { McpHttpClient } from "./httpClient";
import type { OmniToolProviderId, OmniToolProviderRuntime } from "./types";

export interface OmniToolProbe {
  readonly provider: OmniToolProviderId;
  readonly ok: boolean;
  readonly configured: boolean;
  readonly enabled: boolean;
  readonly toolCount: number | null;
  readonly reason: string;
}

function oauthTokenEnv(id: OmniToolProviderId): string {
  return `OPTIHUB_TOOL_${id.toUpperCase().replace(/-/g, "_")}_BEARER_TOKEN`;
}

function authHeaders(runtime: OmniToolProviderRuntime, env: NodeJS.ProcessEnv): Readonly<Record<string, string>> {
  const definition = runtime.definition;
  if (definition.authScheme === "oauth") {
    const token = env[oauthTokenEnv(definition.id)]?.trim();
    return token ? { authorization: `Bearer ${token}` } : {};
  }
  const secret = definition.authEnv ? env[definition.authEnv]?.trim() : undefined;
  if (!secret) return {};
  if (definition.authScheme === "token") return { authorization: `Token ${secret}` };
  if (definition.authScheme === "x-api-key") return { "x-api-key": secret };
  return { authorization: `Bearer ${secret}` };
}

function runtimeFor(id: OmniToolProviderId, env: NodeJS.ProcessEnv): OmniToolProviderRuntime {
  const runtime = resolveOmniToolProviders(env).find(item => item.definition.id === id);
  if (!runtime) throw new Error(`Unknown OMNI tool provider: ${id}`);
  return runtime;
}

function clientFor(id: OmniToolProviderId, env: NodeJS.ProcessEnv, fetchImpl?: typeof fetch): McpHttpClient {
  const runtime = runtimeFor(id, env);
  if (!runtime.enabled) throw new Error(`OMNI tool provider ${id} is not enabled: ${runtime.statusReason}`);
  if (!runtime.endpoint) throw new Error(`OMNI tool provider ${id} has no HTTP endpoint`);
  if (runtime.definition.transport === "sandbox_native") {
    throw new Error(`OMNI tool provider ${id} uses sandbox-native transport`);
  }
  return new McpHttpClient({ endpoint: runtime.endpoint, headers: authHeaders(runtime, env), fetchImpl });
}

const READ_TOOL_PATTERNS: Readonly<Record<OmniToolProviderId, readonly RegExp[]>> = {
  firecrawl: [/^firecrawl_(search|scrape|parse|map|research_.*|developer_search)$/],
  "brave-search": [/search/i, /news/i, /local/i],
  stripe: [/^(get_|retrieve_|list_|search_)/],
  figma: [/^(get_|read_|list_|search_)/],
  notion: [/^(get_|fetch_|search_|list_|query_)/],
  mem0: [/^(get_|search_|list_)/],
  composio: [/^(search|list|get|discover)/i],
  playwright: [],
  e2b: [],
};

export function isReadOnlyProviderTool(providerId: OmniToolProviderId, toolName: string): boolean {
  return READ_TOOL_PATTERNS[providerId].some(pattern => pattern.test(toolName));
}

export async function probeOmniToolProvider(
  id: OmniToolProviderId,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl?: typeof fetch,
): Promise<OmniToolProbe> {
  const runtime = runtimeFor(id, env);
  if (!runtime.enabled) {
    return { provider: id, ok: false, configured: runtime.configured, enabled: false, toolCount: null, reason: runtime.statusReason };
  }
  if (!runtime.endpoint || runtime.definition.transport === "sandbox_native") {
    return { provider: id, ok: false, configured: runtime.configured, enabled: runtime.enabled, toolCount: null, reason: "transport_not_probeable_over_http" };
  }
  try {
    const tools = await clientFor(id, env, fetchImpl).listTools();
    return { provider: id, ok: true, configured: true, enabled: true, toolCount: tools.length, reason: "ready" };
  } catch {
    return { provider: id, ok: false, configured: true, enabled: true, toolCount: null, reason: "upstream_unavailable" };
  }
}

export async function callOmniReadTool(
  providerId: OmniToolProviderId,
  toolName: string,
  args: Record<string, unknown>,
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl?: typeof fetch,
): Promise<unknown> {
  omniToolProvider(providerId);
  if (!isReadOnlyProviderTool(providerId, toolName)) {
    throw new Error(`OMNI tool ${providerId}/${toolName} is not allowlisted as read-only`);
  }
  return clientFor(providerId, env, fetchImpl).callTool(toolName, args);
}
