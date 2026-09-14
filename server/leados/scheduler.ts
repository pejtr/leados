/**
 * LeadOS LinkedIn Opportunity Engine — denní scheduler.
 *
 * Spouští `runDailyProspectingQueue` každých 24 hodin (max 5–10 kandidátů/den).
 * Odesílání na LinkedIn zůstává na člověku — scheduler jen připraví a zevrubně zkontroluje.
 *
 * Spuštění se registruje vedlejším efektem importu v `routers.ts` (při startu serveru).
 */

import { runDailyProspectingQueue, type IngestionEnrichmentResult } from "./engine";
import { type IcpContract } from "../prospecting";

const DEFAULT_ICP: IcpContract = {
  offer: "ONYX WEB Audit",
  segment: "české B2B firmy a lokální služby",
  size: "5–100 zaměstnanců",
  decisionMaker: ["majitel", "CEO", "marketing manager"],
  signals: [
    "zastaralý web",
    "nefunkční formulář",
    "slabé CTA",
    "nová pobočka",
    "růst firmy",
    "nový produkt",
  ],
  exclude: ["přímí konkurenti", "již oslovení"],
  minScore: 50,
  maxCandidatesPerDay: 10,
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
let running = false;

/**
 * Midnight enrichment step. Never throws: attribution is best-effort and must
 * not cost the daily prospecting queue. Deliberately a dynamic import so the
 * scheduler stays loadable without pulling the whole engine in.
 */
export async function runMidnightEnrichment(): Promise<IngestionEnrichmentResult | null> {
  try {
    const { enrichIngestedLeads } = await import("./engine");
    const enrichment = await enrichIngestedLeads();
    console.log(
      `[LeadOS scheduler] enrichment: ${enrichment.processed} processed, ` +
        `${enrichment.attributed} attributed, ${enrichment.unattributed} unattributed.`,
    );
    return enrichment;
  } catch (error) {
    console.error("[LeadOS scheduler] enrichment selhalo (queue pokracuje):", error);
    return null;
  }
}

export function startLeadOsScheduler(): void {
  if (process.env.NODE_ENV === "test") return;
  if (process.env.LEADOS_SCHEDULER === "off") return;

  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      // 1. Midnight enrichment (best-effort, cannot skip the queue).
      await runMidnightEnrichment();

      // 2. Daily prospecting queue.
      const res = await runDailyProspectingQueue(DEFAULT_ICP);
      console.log(`[LeadOS scheduler] queue: ${res.messageReady} ready, ${res.rejected} k revizi.`);
    } catch (error) {
      console.error("[LeadOS scheduler] selhal:", error);
    } finally {
      running = false;
    }
  }, TWENTY_FOUR_HOURS);

  console.log("[LeadOS scheduler] spuštěn (interval 24 h).");
}
