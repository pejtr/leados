import { describe, it, expect } from "vitest";
import { diffValues } from "./_core/audit";

describe("diffValues", () => {
  it("returns undefined oldValue when oldObj is undefined", () => {
    const result = diffValues(undefined, { name: "new" });
    expect(result.oldValue).toBeUndefined();
    expect(result.newValue).toEqual({ name: "new" });
  });

  it("returns undefined both when nothing changed", () => {
    const old = { name: "same", age: 30 };
    const result = diffValues(old, { name: "same" });
    expect(result.oldValue).toBeUndefined();
    expect(result.newValue).toBeUndefined();
  });

  it("returns only changed keys", () => {
    const old = { name: "old", age: 30, city: "Prague" };
    const result = diffValues(old, { name: "new", age: 30 });
    expect(result.oldValue).toEqual({ name: "old" });
    expect(result.newValue).toEqual({ name: "new" });
  });

  it("detects nested object changes via JSON comparison", () => {
    const old = { config: { a: 1, b: 2 } };
    const newObj = { config: { a: 1, b: 3 } };
    const result = diffValues(old, newObj);
    expect(result.oldValue).toEqual({ config: { a: 1, b: 2 } });
    expect(result.newValue).toEqual({ config: { a: 1, b: 3 } });
  });

  it("handles undefined values in diff", () => {
    const old = { name: "old", desc: "text" };
    const result = diffValues(old, { name: "new", desc: undefined });
    expect(result.oldValue).toEqual({ name: "old", desc: "text" });
    expect(result.newValue).toEqual({ name: "new", desc: undefined });
  });

  it("returns empty diff when no keys in newObj", () => {
    const old = { a: 1 };
    const result = diffValues(old, {});
    expect(result.oldValue).toBeUndefined();
    expect(result.newValue).toBeUndefined();
  });
});
