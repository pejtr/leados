export type OptiHubIngressId = "www" | "app" | "api" | "mcp";

export type OptiHubAudience = "public" | "customer" | "service" | "agent";

export type OptiHubEdgeControl =
  | "authentication"
  | "tenant_resolution"
  | "scope_authorization"
  | "policy_evaluation"
  | "rate_limiting"
  | "audit_logging";

export interface OptiHubIngressSurface {
  id: OptiHubIngressId;
  hostname: string;
  audience: OptiHubAudience;
  destination: "optihub-web" | "optihub-app" | "optihub-api" | "optihub-mcp";
  requiredControls: readonly OptiHubEdgeControl[];
}

const protectedEdgeControls = [
  "authentication",
  "tenant_resolution",
  "scope_authorization",
  "policy_evaluation",
  "rate_limiting",
  "audit_logging",
] as const satisfies readonly OptiHubEdgeControl[];

export const optihubIngressSurfaces = [
  {
    id: "www",
    hostname: "www.optihub.cz",
    audience: "public",
    destination: "optihub-web",
    requiredControls: ["rate_limiting"],
  },
  {
    id: "app",
    hostname: "app.optihub.cz",
    audience: "customer",
    destination: "optihub-app",
    requiredControls: protectedEdgeControls,
  },
  {
    id: "api",
    hostname: "api.optihub.cz",
    audience: "service",
    destination: "optihub-api",
    requiredControls: protectedEdgeControls,
  },
  {
    id: "mcp",
    hostname: "mcp.optihub.cz",
    audience: "agent",
    destination: "optihub-mcp",
    requiredControls: protectedEdgeControls,
  },
] as const satisfies readonly OptiHubIngressSurface[];

export type PrivateOnyxServiceId =
  | "onyx-router"
  | "onyx-core"
  | "onyxo"
  | "omnicore-qa-security"
  | "leados"
  | "omni-profit"
  | "omnivideo-control-plane"
  | "omniads";

export interface PrivateOnyxService {
  id: PrivateOnyxServiceId;
  role: string;
  exposure: "private";
  publicHostname: null;
}

export const privateOnyxServices = [
  {
    id: "onyx-router",
    role: "Routes authorized capability requests to private services.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "onyx-core",
    role: "Owns private operating intelligence and shared control-plane state.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "onyxo",
    role: "Provides executive orchestration over approved ONYX capabilities.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "omnicore-qa-security",
    role: "Independently evaluates quality, security and release policy.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "leados",
    role: "Executes lead discovery, qualification and CRM workflows.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "omni-profit",
    role: "Owns revenue measurement and economic control workflows.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "omnivideo-control-plane",
    role: "Owns media generation jobs and asset provenance.",
    exposure: "private",
    publicHostname: null,
  },
  {
    id: "omniads",
    role: "Executes approved advertising and distribution workflows.",
    exposure: "private",
    publicHostname: null,
  },
] as const satisfies readonly PrivateOnyxService[];

export const optimateoPaymentBoundary = {
  hostname: "pay.optimateo.com",
  service: "onyx-pay",
  provider: "comgate",
  ownership: "optimateo",
} as const;

export const machineGatewayContextFields = [
  "requestId",
  "tenantId",
  "actorId",
  "scopes",
  "policyVersion",
] as const;

function normalizeHostname(value: string): string {
  const withoutScheme = value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "");
  return (withoutScheme.split("/")[0] ?? "")
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function getOptiHubIngressSurface(
  hostname: string
): OptiHubIngressSurface | undefined {
  const normalized = normalizeHostname(hostname);
  return optihubIngressSurfaces.find(
    surface => surface.hostname === normalized
  );
}

export function isForbiddenDirectOnyxHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  const optihubSuffix = ".optihub.cz";
  if (!normalized.endsWith(optihubSuffix)) return false;

  const subdomain = normalized.slice(0, -optihubSuffix.length);
  return subdomain.includes("onyx");
}
