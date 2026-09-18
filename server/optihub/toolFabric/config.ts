import { OMNI_TOOL_CATALOG } from "./catalog";
import type {
  OmniToolProviderDefinition,
  OmniToolProviderId,
  OmniToolProviderRuntime,
} from "./types";

function envKey(id: OmniToolProviderId, suffix: string): string {
  return `OPTIHUB_TOOL_${id.toUpperCase().replace(/-/g, "_")}_${suffix}`;
}

function isTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function endpointFor(provider: OmniToolProviderDefinition, env: NodeJS.ProcessEnv): string | null {
  const override = provider.endpointEnv ? env[provider.endpointEnv]?.trim() : undefined;
  if (override) return override;
  return provider.defaultEndpoint ?? null;
}

function authConfiguredFor(provider: OmniToolProviderDefinition, env: NodeJS.ProcessEnv): boolean {
  if (provider.keylessRead) return true;
  if (provider.authScheme === "oauth") {
    return isTrue(env[envKey(provider.id, "AUTH_READY")]) && Boolean(env[envKey(provider.id, "BEARER_TOKEN")]?.trim());
  }
  if (provider.authEnv) return Boolean(env[provider.authEnv]?.trim());
  return provider.transport === "sidecar_http";
}

export function resolveOmniToolProviders(
  env: NodeJS.ProcessEnv = process.env,
): readonly OmniToolProviderRuntime[] {
  const globalEnabled = isTrue(env["OPTIHUB_TOOL_FABRIC_ENABLED"]);

  return OMNI_TOOL_CATALOG.map(definition => {
    const endpoint = endpointFor(definition, env);
    const authConfigured = authConfiguredFor(definition, env);
    const transportConfigured =
      definition.transport === "sandbox_native" ? authConfigured : endpoint !== null;
    const configured = transportConfigured && authConfigured;
    const requested = isTrue(env[envKey(definition.id, "ENABLED")]);
    const enabled = globalEnabled && requested && configured;

    let statusReason = "disabled_by_default";
    if (globalEnabled && !requested) statusReason = "provider_not_enabled";
    if (requested && !transportConfigured) statusReason = "transport_not_configured";
    if (requested && transportConfigured && !authConfigured) statusReason = "auth_not_configured";
    if (enabled) statusReason = "ready";

    return { definition, endpoint, configured, enabled, authConfigured, statusReason };
  });
}
