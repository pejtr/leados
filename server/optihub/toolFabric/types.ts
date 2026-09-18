export const OMNI_TOOL_PROVIDER_IDS = [
  "firecrawl",
  "brave-search",
  "stripe",
  "figma",
  "notion",
  "mem0",
  "composio",
  "playwright",
  "e2b",
] as const;

export type OmniToolProviderId = (typeof OMNI_TOOL_PROVIDER_IDS)[number];

export const OMNI_TOOL_CAPABILITIES = [
  "research",
  "search",
  "payments",
  "design",
  "knowledge",
  "memory",
  "ops",
  "browser",
  "sandbox",
] as const;

export type OmniToolCapability = (typeof OMNI_TOOL_CAPABILITIES)[number];
export type OmniToolRisk = "read" | "draft" | "write" | "browser" | "compute" | "financial";
export type OmniToolTransport = "remote_http" | "sidecar_http" | "sandbox_native" | "delegated";

export interface OmniToolProviderDefinition {
  readonly id: OmniToolProviderId;
  readonly name: string;
  readonly role: string;
  readonly capabilities: readonly OmniToolCapability[];
  readonly transport: OmniToolTransport;
  readonly defaultEndpoint?: string;
  readonly endpointEnv?: string;
  readonly authEnv?: string;
  readonly authScheme?: "bearer" | "token" | "x-api-key" | "oauth";
  readonly keylessRead?: boolean;
  readonly writeDefaultDisabled: boolean;
  readonly humanGate: readonly OmniToolRisk[];
  readonly notes?: string;
}

export interface OmniToolProviderRuntime {
  readonly definition: OmniToolProviderDefinition;
  readonly endpoint: string | null;
  readonly configured: boolean;
  readonly enabled: boolean;
  readonly authConfigured: boolean;
  readonly statusReason: string;
}

export const OMNI_TOOL_INTENTS = [
  "lead_research",
  "trend_scan",
  "design_to_code",
  "project_knowledge",
  "persistent_memory",
  "ops_action",
  "browser_automation",
  "safe_compute",
  "billing",
] as const;

export type OmniToolIntent = (typeof OMNI_TOOL_INTENTS)[number];

export interface OmniToolRoutePlan {
  readonly intent: OmniToolIntent;
  readonly providers: readonly OmniToolProviderId[];
  readonly risk: OmniToolRisk;
  readonly humanGateRequired: boolean;
}
