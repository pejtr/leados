/**
 * OPTIHUB EDGE - policy decision layer.
 *
 * One deterministic engine, not `if` statements scattered through handlers. It
 * answers exactly two things: ALLOW, or DENY with a machine-readable reason. No
 * LLM, no network, no clock: the same inputs always produce the same decision.
 *
 * The engine is fail-closed for actions it does not know: an action missing from
 * the catalog is denied rather than allowed by default.
 */

import type { EdgePrincipal } from "./tenant";

export const EDGE_POLICY_VERSION = "optihub-edge-policy/1";

/** Actions the edge knows about. Anything else is denied. */
export const EDGE_POLICY_ACTIONS = [
  "projects:read",
  "content:read",
  "publication:execute",
] as const;

export type EdgePolicyAction = (typeof EDGE_POLICY_ACTIONS)[number];

const knownActions: ReadonlySet<string> = new Set(EDGE_POLICY_ACTIONS);

export interface EdgePolicyConfig {
  /**
   * Publishing is fail-closed for the same reason the worker's publisher gate is:
   * an environment that has not explicitly enabled execution cannot execute.
   */
  readonly publicationExecuteEnabled: boolean;
}

export interface EdgeAction {
  readonly name: string;
}

export interface EdgeResourceRef {
  readonly kind?: string;
  readonly id?: string;
  /** When present, binds the resource to a tenant. */
  readonly tenantId?: string;
}

export type EdgePolicyDecision =
  | { readonly decision: "ALLOW"; readonly reason: string }
  | {
      readonly decision: "DENY";
      readonly code: "POLICY_DENIED" | "TENANT_DENIED";
      readonly reason: string;
    };

export interface EdgePolicyRule {
  readonly id: string;
  evaluate(
    principal: EdgePrincipal,
    action: EdgeAction,
    resource: EdgeResourceRef | undefined,
    config: EdgePolicyConfig,
  ): EdgePolicyDecision | null;
}

export const edgePolicyRules: readonly EdgePolicyRule[] = [
  {
    id: "resource_tenant_binding",
    evaluate(principal, _action, resource) {
      if (resource?.tenantId === undefined) return null;
      if (resource.tenantId !== principal.tenantId) {
        return { decision: "DENY", code: "TENANT_DENIED", reason: "resource_tenant_mismatch" };
      }
      return null;
    },
  },
  {
    id: "principal_tenant_present",
    evaluate(principal) {
      if (principal.tenantId.trim() === "") {
        return { decision: "DENY", code: "POLICY_DENIED", reason: "missing_tenant" };
      }
      return null;
    },
  },
  {
    id: "known_action",
    evaluate(_principal, action) {
      if (!knownActions.has(action.name)) {
        return { decision: "DENY", code: "POLICY_DENIED", reason: "unknown_action" };
      }
      return null;
    },
  },
  {
    id: "publication_execute_gate",
    evaluate(_principal, action, _resource, config) {
      if (action.name === "publication:execute" && !config.publicationExecuteEnabled) {
        return {
          decision: "DENY",
          code: "POLICY_DENIED",
          reason: "publication_execute_disabled",
        };
      }
      return null;
    },
  },
] as const;

export function authorize(
  principal: EdgePrincipal,
  action: EdgeAction,
  resource: EdgeResourceRef | undefined,
  config: EdgePolicyConfig,
): EdgePolicyDecision {
  for (const rule of edgePolicyRules) {
    const decision = rule.evaluate(principal, action, resource, config);
    if (decision !== null) return decision;
  }
  return { decision: "ALLOW", reason: "policy_allowed" };
}
