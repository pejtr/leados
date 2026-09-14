/**
 * OPTIHUB EDGE - public alias (`o`) layer tests.
 *
 * An alias names a canonical internal identity, but it is never a credential and
 * it is never returned. The grammar is canonical-only: a request alias is either
 * already in canonical form or it is rejected, so two spellings can never claim
 * the same identity.
 */

import { describe, expect, it } from "vitest";

import {
  EMPTY_ALIAS_REGISTRY,
  createAliasRegistry,
  isValidAlias,
  normalizeAlias,
  parseAliasRegistry,
  resolveRequestedAlias,
} from "./alias";

describe("alias grammar", () => {
  it("accepts canonical slugs", () => {
    for (const alias of ["ab", "acme", "buddha-cajovna", "femsidergrok", "a1-b2-c3"]) {
      expect(isValidAlias(alias), alias).toBe(true);
    }
  });

  it("rejects non-canonical or unsafe values", () => {
    for (const alias of [
      "a",
      "",
      "ACME",
      "Acme",
      "bu ddha",
      "buddha_cajovna",
      "-acme",
      "acme-",
      "acme--corp",
      "acme.corp",
      "acme@example.com",
      "a".repeat(64),
    ]) {
      expect(isValidAlias(alias), alias).toBe(false);
    }
  });

  it("normalizes human labels to canonical slugs", () => {
    expect(normalizeAlias("Buddha Čajovna")).toBe("buddha-cajovna");
    expect(normalizeAlias("  ACME  Corp ")).toBe("acme-corp");
    expect(normalizeAlias("FEMSIDER Grok")).toBe("femsider-grok");
  });
});

describe("alias registry", () => {
  it("maps canonical aliases to internal identities", () => {
    const registry = createAliasRegistry([["femsidergrok", "tenant-femsider"]]);
    expect(registry.resolve("femsidergrok")).toBe("tenant-femsider");
    expect(registry.resolve("unknown")).toBeNull();
    expect(registry.size).toBe(1);
  });

  it("normalizes keys at ingestion so a human label cannot create a second key", () => {
    const registry = createAliasRegistry([["Buddha Čajovna", "tenant-cajovna"]]);
    expect(registry.resolve("buddha-cajovna")).toBe("tenant-cajovna");
  });

  it("fails closed on invalid, empty or duplicate config", () => {
    expect(() => createAliasRegistry([["ACME", "tenant-a"]])).not.toThrow();
    expect(() => createAliasRegistry([["!", "tenant-a"]])).toThrow();
    expect(() => createAliasRegistry([["acme", ""]])).toThrow();
    expect(() =>
      createAliasRegistry([
        ["acme", "tenant-a"],
        ["ACME", "tenant-b"],
      ]),
    ).toThrow();
  });

  it("parses the env JSON object, rejecting a non-object payload", () => {
    expect(parseAliasRegistry(undefined)).toBe(EMPTY_ALIAS_REGISTRY);
    expect(parseAliasRegistry("").size).toBe(0);
    expect(parseAliasRegistry('{"femsidergrok":"tenant-femsider"}').resolve("femsidergrok")).toBe(
      "tenant-femsider",
    );
    expect(() => parseAliasRegistry("not json")).toThrow();
    expect(() => parseAliasRegistry('["acme"]')).toThrow();
    expect(() => parseAliasRegistry('{"acme":123}')).toThrow();
  });
});

describe("requested alias resolution", () => {
  const registry = createAliasRegistry([["femsidergrok", "tenant-femsider"]]);

  it("reports absence without error", () => {
    expect(resolveRequestedAlias(registry, undefined)).toEqual({ kind: "none" });
    expect(resolveRequestedAlias(registry, "")).toEqual({ kind: "none" });
    expect(resolveRequestedAlias(registry, "   ")).toEqual({ kind: "none" });
  });

  it("rejects malformed values instead of coercing them", () => {
    expect(resolveRequestedAlias(registry, "FEMSIDERGROK")).toEqual({ kind: "malformed" });
    expect(resolveRequestedAlias(registry, "femsidergrok!")).toEqual({ kind: "malformed" });
    expect(resolveRequestedAlias(registry, 42)).toEqual({ kind: "malformed" });
  });

  it("resolves a known alias to its internal identity", () => {
    expect(resolveRequestedAlias(registry, "femsidergrok")).toEqual({
      kind: "known",
      alias: "femsidergrok",
      oID: "tenant-femsider",
    });
  });

  it("marks an unknown canonical alias as unknown", () => {
    expect(resolveRequestedAlias(registry, "nobody")).toEqual({
      kind: "unknown",
      alias: "nobody",
    });
  });

  it("uses the first value when the query repeats the parameter", () => {
    expect(resolveRequestedAlias(registry, ["femsidergrok", "other"])).toEqual({
      kind: "known",
      alias: "femsidergrok",
      oID: "tenant-femsider",
    });
  });
});
