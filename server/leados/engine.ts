/**
 * LeadOS LinkedIn Opportunity Engine — orchestrátor.
 *
 * Vazba: KITT (koordinace) → LEADOS (segment/nbídka) → HERA (výzkum) → HERMES (web QA)
 * → PERSONALIZATION ENGINE → OMNICORE QA + KARR → LEADOS ACTION QUEUE → PETR ručně odešle.
 *
 * Automatizuje výzkum, kvalifikaci, personalizaci, QA a evidenci.
 * Odesílání na LinkedIn zůstává na člověku (human-in-the-loop, viz compliance-policy.md).
 *
 * Stavový automat se ukládá do `prospects.notes` (JSON) – rozšíření DB schématu
 * (sloupec `leadState`) je doporučená následná migrace.
 */

import { getDb } from "../db";
import { prospects } from "../../drizzle/schema";
// `connectedProjects` / `ingestedLeads` live in schema/projects.ts. They are NOT
// re-exported by the (shadowing) drizzle/schema.ts monolith, so importing them
// from the bare `drizzle/schema` specifier yields `undefined` at runtime.
import { connectedProjects, ingestedLeads } from "../../drizzle/schema/projects";
import { eq, desc, and, isNull } from "drizzle-orm";
import { scoreProspect, type IcpContract, type LinkedInProfile } from "../prospecting";
import { generateOutreachMessage } from "../outreach-agent";
import { canTransition, type LeadState, type MessageVariant } from "./types";

/** Creep skóre nad tuto hranici → zpráva k ruční revizi, ne do fronty. */
export const CREEP_THRESHOLD = 40;

/** Deterministický přechod stavu podle stavového automatu. Vrací false při nelegálním skoku. */
export async function advanceLeadState(prospectId: number, to: LeadState): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  if (!rows[0]) return false;

  const from = (rows[0].leadState as LeadState) || "DISCOVERED";
  if (!canTransition(from, to)) {
    console.warn(`[LeadOS] Nelegální přechod ${from} → ${to} pro prospect ${prospectId}`);
    return false;
  }

  await db
    .update(prospects)
    .set({ leadState: to, updatedAt: new Date() })
    .where(eq(prospects.id, prospectId));
  return true;
}

export interface QueueResult {
  processed: number;
  messageReady: number;
  rejected: number;
  briefing: string;
}

/**
 * Denní dávka: vybere nové kandidáty (max 5–10), ohodnotí, připraví zprávu,
 * spustí Creep Guard a uloží stav MESSAGE_READY k ručnímu schválení.
 */
export async function runDailyProspectingQueue(
  icp: IcpContract,
  limit: number = icp.maxCandidatesPerDay ?? 10,
): Promise<QueueResult> {
  const db = await getDb();
  if (!db) return { processed: 0, messageReady: 0, rejected: 0, briefing: "DB nedostupná." };

  const capped = Math.min(Math.max(1, limit), 10);
  const candidates = await db
    .select()
    .from(prospects)
    .where(and(eq(prospects.status, "new")))
    .orderBy(desc(prospects.createdAt))
    .limit(capped);

  let messageReady = 0;
  let rejected = 0;
  const lines: string[] = [];

  for (const c of candidates) {
    const profile: LinkedInProfile = {
      linkedinUrl: c.linkedinUrl || "",
      name: c.name,
      company: c.company || undefined,
      title: c.title || undefined,
      industry: c.industry || undefined,
      employeeCount: c.employeeCount || undefined,
      revenue: c.revenue || undefined,
      location: c.location || undefined,
      about: c.about || undefined,
      currentRole: c.currentRole || undefined,
    };

    const scored = await scoreProspect(profile, icp);
    await advanceLeadState(c.id, "RESEARCHED");

    if (scored.fitScore < (icp.minScore ?? 50)) {
      await advanceLeadState(c.id, "LOST");
      rejected++;
      lines.push(`• ${c.name} (${c.company ?? "?"}): pod limitem, fitScore ${scored.fitScore}`);
      continue;
    }
    await advanceLeadState(c.id, "QUALIFIED");

    const variant: MessageVariant = "C";
    const msg = await generateOutreachMessage({
      prospectId: c.id,
      messageType: "first_message",
      variant,
      evidence: scored.verifiedSignals,
    });

    if (!msg || msg.creepRisk.score > CREEP_THRESHOLD) {
      await advanceLeadState(c.id, "NURTURE");
      rejected++;
      lines.push(
        `• ${c.name} (${c.company ?? "?"}): creep risk ${msg?.creepRisk.score ?? "?"}${
          msg ? ` (${msg.creepRisk.flags.join(", ")})` : ""
        } — k revizi`,
      );
      continue;
    }

    await advanceLeadState(c.id, "MESSAGE_READY");
    messageReady++;
    lines.push(`• ${c.name} (${c.company ?? "?"}): fit ${scored.fitScore}, zpráva připravena (varianta ${variant}), čeká na ruční schválení`);
  }

  const briefing =
    `Denní LinkedIn queue: ${messageReady} připraveno k odeslání, ${rejected} zamítnuto/k revizi.\n` +
    lines.join("\n");

  return { processed: candidates.length, messageReady, rejected, briefing };
}

/** Volá člověk po ručním odeslání zprávy na LinkedInu. */
export async function markManuallySent(prospectId: number): Promise<boolean> {
  const ok = await advanceLeadState(prospectId, "MANUALLY_SENT");
  if (!ok) return false;
  const db = await getDb();
  if (!db) return false;
  await db.update(prospects).set({ status: "contacted", lastContactedAt: new Date() }).where(eq(prospects.id, prospectId));
  return true;
}

/** Bounded, best-effort attribution pass over externally ingested leads. */
export const INGESTION_ENRICHMENT_BATCH = 100;

export interface IngestionEnrichmentResult {
  /** Unattributed rows examined in this pass (bounded). */
  processed: number;
  /** Rows linked to an active connected project. */
  attributed: number;
  /** Rows left untouched because no active project matched. */
  unattributed: number;
}

export interface EnrichableLead {
  readonly source?: string | null;
  readonly projectName?: string | null;
}

export interface EnrichableProject {
  readonly id: number;
  readonly name: string;
  readonly isActive: boolean;
}

function attributionKey(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\/+$/, "");
}

/**
 * Resolve the active project an ingested lead belongs to. `projectName` is the
 * stronger signal (the hub records the project's own name on every lead);
 * `source` is the caller-supplied fallback.
 *
 * Only an active project is a destination. An unattributed lead stays visible
 * to a human; a misattributed lead is silently wrong, so no match beats a guess.
 */
export function matchProjectForLead(
  lead: EnrichableLead,
  projects: readonly EnrichableProject[],
): number | null {
  const candidates = [attributionKey(lead.projectName), attributionKey(lead.source)].filter(
    key => key !== "",
  );
  if (candidates.length === 0) return null;

  for (const key of candidates) {
    const hit = projects.find(project => project.isActive && attributionKey(project.name) === key);
    if (hit !== undefined) return hit.id;
  }
  return null;
}

/**
 * Midnight enrichment: attach externally ingested leads (`ingested_leads` rows
 * with no `projectId`) to the active connected project they came from, so they
 * appear in that project's pipeline instead of floating unattributed.
 *
 * Idempotent (only null `projectId` rows are read), bounded, and read-only apart
 * from the attribution it performs: it never changes a lead's status, never
 * deletes anything, and never calls an external service.
 */
export async function enrichIngestedLeads(
  limit: number = INGESTION_ENRICHMENT_BATCH,
): Promise<IngestionEnrichmentResult> {
  const result: IngestionEnrichmentResult = { processed: 0, attributed: 0, unattributed: 0 };

  const db = await getDb();
  if (!db) return result;

  const rows = await db
    .select({
      id: ingestedLeads.id,
      source: ingestedLeads.source,
      projectName: ingestedLeads.projectName,
    })
    .from(ingestedLeads)
    .where(isNull(ingestedLeads.projectId))
    .orderBy(desc(ingestedLeads.createdAt))
    .limit(limit);

  result.processed = rows.length;
  if (rows.length === 0) return result;

  const projects = await db
    .select({
      id: connectedProjects.id,
      name: connectedProjects.name,
      isActive: connectedProjects.isActive,
    })
    .from(connectedProjects);

  for (const row of rows) {
    const projectId = matchProjectForLead(row, projects);
    if (projectId === null) {
      result.unattributed += 1;
      continue;
    }
    await db
      .update(ingestedLeads)
      .set({ projectId, updatedAt: Date.now() })
      .where(eq(ingestedLeads.id, row.id));
    result.attributed += 1;
  }

  return result;
}
