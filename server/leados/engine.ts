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
import { eq, desc, and } from "drizzle-orm";
import { scoreProspect, type IcpContract, type LinkedInProfile } from "../prospecting";
import { generateOutreachMessage } from "../outreach-agent";
import { canTransition, type LeadState, type MessageVariant } from "./types";

/** Creep skóre nad tuto hranici → zpráva k ruční revizi, ne do fronty. */
export const CREEP_THRESHOLD = 40;

function readNotes(notes?: string | null): Record<string, any> {
  if (!notes) return {};
  try {
    return JSON.parse(notes);
  } catch {
    return {};
  }
}

/** Deterministický přechod stavu podle stavového automatu. Vrací false při nelegálním skoku. */
export async function advanceLeadState(prospectId: number, to: LeadState): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db.select().from(prospects).where(eq(prospects.id, prospectId)).limit(1);
  if (!rows[0]) return false;

  const notes = readNotes(rows[0].notes);
  const from = (notes.leadState as LeadState) || "DISCOVERED";
  if (!canTransition(from, to)) {
    console.warn(`[LeadOS] Nelegální přechod ${from} → ${to} pro prospect ${prospectId}`);
    return false;
  }

  notes.leadState = to;
  await db
    .update(prospects)
    .set({ notes: JSON.stringify(notes), updatedAt: new Date() })
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
