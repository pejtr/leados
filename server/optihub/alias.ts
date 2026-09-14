/**
 * OPTIHUB EDGE - public alias (`o`) layer.
 *
 * `o` is a public, human-readable alias that names a canonical internal identity
 * (the `oID`). The `oID` is the edge tenant that already exists in the canonical
 * credential/tenant layer; this module does not introduce a second identity
 * database, it only names identities that the tenant layer already owns.
 *
 * An alias is NOT authentication. Knowing or guessing an alias grants nothing:
 * the `ohk_` Bearer credential remains the only authority. When a request carries
 * both an alias and a credential, the two must resolve to the same internal
 * identity or the request is denied.
 */

export const ALIAS_QUERY_PARAM = "o";
export const ALIAS_MIN_LENGTH = 2;
export const ALIAS_MAX_LENGTH = 63;

/**
 * Canonical public form. A request alias must already be in this form; a
 * non-canonical value is rejected rather than silently coerced, so two different
 * spellings can never address the same identity.
 */
export const ALIAS_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Fold a human label into the canonical form used for registry keys. */
export function normalizeAlias(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidAlias(raw: string): boolean {
  return (
    raw.length >= ALIAS_MIN_LENGTH && raw.length <= ALIAS_MAX_LENGTH && ALIAS_PATTERN.test(raw)
  );
}

export type AliasResolution =
  | { readonly kind: "none" }
  | { readonly kind: "malformed" }
  | { readonly kind: "unknown"; readonly alias: string }
  | { readonly kind: "known"; readonly alias: string; readonly oID: string };

export interface AliasRegistry {
  /** Canonical alias -> internal identity, or null when the alias is unknown. */
  resolve(alias: string): string | null;
  readonly size: number;
}

/**
 * Build a registry from alias -> internal-identity entries. A malformed alias, an
 * empty identity or a duplicate alias is a configuration error, not a runtime
 * downgrade: the edge refuses to start rather than guess.
 */
export function createAliasRegistry(entries: Iterable<readonly [string, string]>): AliasRegistry {
  const map = new Map<string, string>();
  for (const [rawAlias, oID] of Array.from(entries)) {
    const alias = normalizeAlias(rawAlias);
    if (!isValidAlias(alias)) {
      throw new Error(`OPTIHUB aliases: invalid alias "${rawAlias}"`);
    }
    if (typeof oID !== "string" || oID.trim() === "") {
      throw new Error(`OPTIHUB aliases: "${alias}" has no internal identity`);
    }
    if (map.has(alias)) {
      throw new Error(`OPTIHUB aliases: duplicate alias "${alias}"`);
    }
    map.set(alias, oID);
  }
  return {
    resolve: alias => map.get(alias) ?? null,
    size: map.size,
  };
}

export const EMPTY_ALIAS_REGISTRY: AliasRegistry = createAliasRegistry([]);

/** Parse `OPTIHUB_EDGE_ALIASES` (a JSON object of alias -> internal identity). */
export function parseAliasRegistry(raw: string | undefined): AliasRegistry {
  if (raw === undefined || raw.trim() === "") return EMPTY_ALIAS_REGISTRY;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("OPTIHUB_EDGE_ALIASES is not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("OPTIHUB_EDGE_ALIASES must be a JSON object of alias -> identity");
  }

  return createAliasRegistry(
    Object.entries(parsed as Record<string, unknown>).map(([alias, oID]) => {
      if (typeof oID !== "string") {
        throw new Error(`OPTIHUB_EDGE_ALIASES entry "${alias}" must map to a string identity`);
      }
      return [alias, oID] as const;
    }),
  );
}

export function loadAliasRegistryFromEnv(env: NodeJS.ProcessEnv = process.env): AliasRegistry {
  return parseAliasRegistry(env["OPTIHUB_EDGE_ALIASES"]);
}

/**
 * Resolve the `o` value from an untrusted request location. The caller-supplied
 * value is never trusted: it is only ever compared against the registry and the
 * verified credential.
 */
export function resolveRequestedAlias(registry: AliasRegistry, raw: unknown): AliasResolution {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === null) return { kind: "none" };
  if (typeof value !== "string") return { kind: "malformed" };

  const alias = value.trim();
  if (alias === "") return { kind: "none" };
  if (!isValidAlias(alias)) return { kind: "malformed" };

  const oID = registry.resolve(alias);
  return oID === null ? { kind: "unknown", alias } : { kind: "known", alias, oID };
}
