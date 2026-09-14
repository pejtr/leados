/**
 * Schema-resolution regression guard.
 *
 * `from "../drizzle/schema"` resolves to the monolith `drizzle/schema.ts`, which
 * re-exports the modular barrel `drizzle/schema/index.ts`. This test pins the
 * runtime invariant that every table the ingest/hub/edge path needs is actually
 * defined (not `undefined`), including the three names that exist in both layers
 * and must be resolved by the local declaration shadowing the star export.
 */

import { describe, expect, it } from "vitest";

import * as schema from "../drizzle/schema";

const REQUIRED_MODULAR = [
  "ingestedLeads",
  "connectedProjects",
  "adCampaigns",
  "adCampaignSnapshots",
  "dsrSnapshots",
  "projectEvents",
];

const REQUIRED_CORE = [
  "users",
  "projects",
  "prospects",
  "projectMilestones",
  "heartbeatJobs",
];

function table(name: string): unknown {
  return (schema as Record<string, unknown>)[name];
}

describe("canonical drizzle schema barrel", () => {
  it("resolves every ingest/hub table through ../drizzle/schema", () => {
    for (const name of REQUIRED_MODULAR) {
      expect(table(name), `${name} should be defined`).toBeDefined();
    }
  });

  it("keeps the monolith core tables resolved", () => {
    for (const name of REQUIRED_CORE) {
      expect(table(name), `${name} should be defined`).toBeDefined();
    }
  });

  it("resolves the three duplicated names to the monolith declaration, not undefined", () => {
    // users / projectMilestones / heartbeatJobs exist in BOTH layers. The local
    // declaration must shadow the `export *` (explicit export wins), never become
    // an ambiguous undefined.
    for (const name of ["users", "projectMilestones", "heartbeatJobs"]) {
      expect(table(name), `${name} should be defined`).toBeDefined();
      expect(table(name), `${name} should not be undefined`).not.toBeUndefined();
    }
  });
});
