/**
 * OPTIHUB EDGE - scope catalog.
 *
 * Deliberately small. A scope exists only when a protected route needs it, and
 * every protected route declares its required scope explicitly at registration.
 * There is no wildcard and no implicit "authenticated means authorized".
 */

export const EDGE_SCOPES = [
  "projects:read",
  "projects:write",
  "content:read",
  "content:write",
  "publication:read",
  "publication:execute",
] as const;

export type EdgeScope = (typeof EDGE_SCOPES)[number];

const scopeSet: ReadonlySet<string> = new Set(EDGE_SCOPES);

export function isEdgeScope(value: string): value is EdgeScope {
  return scopeSet.has(value);
}

/**
 * Keep only known scopes, de-duplicated and in catalog order. Unknown strings
 * are dropped rather than trusted, so a credential's effective grant can never
 * be wider than the catalog.
 */
export function normalizeEdgeScopes(values: readonly string[]): EdgeScope[] {
  const seen = new Set<EdgeScope>();
  for (const value of values) {
    if (isEdgeScope(value)) seen.add(value);
  }
  return EDGE_SCOPES.filter(scope => seen.has(scope));
}

export function hasEdgeScope(
  granted: readonly EdgeScope[],
  required: EdgeScope,
): boolean {
  return granted.includes(required);
}

export function formatEdgeScopes(scopes: readonly EdgeScope[]): string {
  return scopes.join(" ");
}
