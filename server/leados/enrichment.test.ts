/**
 * Midnight enrichment: attribution of externally ingested leads.
 *
 * The matching rule is pure, so it is pinned directly here; the DB pass is
 * asserted to fail soft (no database in the test runtime) so a scheduler tick
 * can never fail because attribution is unavailable.
 */

import { describe, expect, it } from "vitest";

import { enrichIngestedLeads, matchProjectForLead, INGESTION_ENRICHMENT_BATCH } from "./engine";
import { runMidnightEnrichment } from "./scheduler";
import { connectedProjects, ingestedLeads } from "../../drizzle/schema/projects";

const PROJECTS = [
  { id: 1, name: "bezmasajidla.cz", isActive: true },
  { id: 2, name: "OPTIMATEO", isActive: false },
];

async function withoutDatabase<T>(run: () => Promise<T>): Promise<T> {
  const previous = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    return await run();
  } finally {
    if (previous !== undefined) process.env.DATABASE_URL = previous;
  }
}

describe("enrichment table bindings", () => {
  it("binds to real table objects, not undefined barrel re-exports", () => {
    // Regression guard: the bare `drizzle/schema` specifier resolves to the old
    // monolith, which does not re-export schema/projects.ts. Importing the tables
    // from there yields `undefined` and silently disables attribution at runtime.
    expect(ingestedLeads.projectId).toBeDefined();
    expect(ingestedLeads.status).toBeDefined();
    expect(connectedProjects.isActive).toBeDefined();
  });
});

describe("matchProjectForLead", () => {
  it("matches an active project by name, case- and whitespace-insensitively", () => {
    expect(matchProjectForLead({ projectName: "  BezMasajidla.cz " }, PROJECTS)).toBe(1);
  });

  it("ignores a trailing slash", () => {
    expect(matchProjectForLead({ projectName: "bezmasajidla.cz/" }, PROJECTS)).toBe(1);
  });

  it("falls back to source when projectName does not resolve", () => {
    expect(matchProjectForLead({ projectName: "", source: "bezmasajidla.cz" }, PROJECTS)).toBe(1);
  });

  it("prefers projectName over source", () => {
    expect(
      matchProjectForLead({ projectName: "bezmasajidla.cz", source: "unknown.example" }, PROJECTS),
    ).toBe(1);
  });

  it("never attributes to an inactive project", () => {
    expect(matchProjectForLead({ projectName: "OPTIMATEO" }, PROJECTS)).toBeNull();
  });

  it("returns null rather than guessing when nothing matches", () => {
    expect(matchProjectForLead({ projectName: "unknown.example", source: "x" }, PROJECTS)).toBeNull();
    expect(matchProjectForLead({}, PROJECTS)).toBeNull();
    expect(matchProjectForLead({ source: "   " }, PROJECTS)).toBeNull();
  });
});

describe("enrichIngestedLeads", () => {
  it("fails soft when no database is configured", async () => {
    await withoutDatabase(async () => {
      await expect(enrichIngestedLeads()).resolves.toEqual({
        processed: 0,
        attributed: 0,
        unattributed: 0,
      });
    });
  });

  it("bounds a single pass", () => {
    expect(INGESTION_ENRICHMENT_BATCH).toBeGreaterThan(0);
    expect(INGESTION_ENRICHMENT_BATCH).toBeLessThanOrEqual(1000);
  });
});

describe("runMidnightEnrichment", () => {
  it("never throws, so the daily queue cannot be skipped by an enrichment failure", async () => {
    await withoutDatabase(async () => {
      await expect(runMidnightEnrichment()).resolves.toEqual({
        processed: 0,
        attributed: 0,
        unattributed: 0,
      });
    });
  });
});
