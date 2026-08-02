/**
 * LeadOS LinkedIn Opportunity Engine — sdílené typy a stavový automat.
 *
 * Stavový automat (nikoliv "asi jsme ho oslovili"):
 *   DISCOVERED → RESEARCHED → QUALIFIED → MESSAGE_READY → APPROVED
 *   → MANUALLY_SENT → CONNECTED → REPLIED → MEETING → PROPOSAL → WON/LOST/NURTURE
 *
 * Automatizace smí zpracovat jen přesný následující stav.
 * MESSAGE_READY ≠ odesláno. APPROVED ≠ odpověděno. PIPELINE ≠ příjem.
 */

export const LEAD_STATES = [
  "DISCOVERED",
  "RESEARCHED",
  "QUALIFIED",
  "MESSAGE_READY",
  "APPROVED",
  "MANUALLY_SENT",
  "CONNECTED",
  "REPLIED",
  "MEETING",
  "PROPOSAL",
  "WON",
  "LOST",
  "NURTURE",
] as const;

export type LeadState = (typeof LEAD_STATES)[number];

/** Povolený přechod do dalšího stavu. Vrací true, pokud je přechod legitimní. */
export const LEAD_STATE_TRANSITIONS: Record<LeadState, LeadState[]> = {
  DISCOVERED: ["RESEARCHED", "LOST"],
  RESEARCHED: ["QUALIFIED", "NURTURE", "LOST"],
  QUALIFIED: ["MESSAGE_READY", "NURTURE", "LOST"],
  MESSAGE_READY: ["APPROVED", "LOST"],
  APPROVED: ["MANUALLY_SENT", "LOST"],
  MANUALLY_SENT: ["CONNECTED", "NURTURE", "LOST"],
  CONNECTED: ["REPLIED", "NURTURE", "LOST"],
  REPLIED: ["MEETING", "NURTURE", "LOST"],
  MEETING: ["PROPOSAL", "NURTURE", "LOST"],
  PROPOSAL: ["WON", "LOST", "NURTURE"],
  WON: [],
  LOST: [],
  NURTURE: ["QUALIFIED", "MESSAGE_READY"],
};

export function canTransition(from: LeadState, to: LeadState): boolean {
  return LEAD_STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Experimentální varianty oslovení (viz message-rules.md). */
export const MESSAGE_VARIANTS = ["A", "B", "C", "D"] as const;
export type MessageVariant = (typeof MESSAGE_VARIANTS)[number];

export interface CreepRisk {
  /** 0 = bezpečné, 100 = digitální stalking. */
  score: number;
  flags: string[];
}

export interface EvidenceClaim {
  claim: string;
  evidenceType: "verified_fact" | "probable_signal" | "business_hypothesis" | "recommendation";
  evidenceUrl?: string;
}
