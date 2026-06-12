/**
 * HERA — Marketing AI Orchestrator
 *
 * Architecture (owner directive): HERMES orchestrates TECH agents (lead gen,
 * analysis, missions, pentest), HERA orchestrates MARKETING agents — the
 * sales/marketing coach personas from aiPersonas.ts.
 *
 * HERA classifies the marketing intent of a message and routes it to the
 * best-fit coach persona, injecting live platform context so advice is
 * grounded in the user's real pipeline data.
 */

import { invokeLLM } from "./_core/llm";
import { AI_PERSONAS, getPersonaById, type AiPersona } from "./aiPersonas";

// ─── Marketing intents ─────────────────────────────────────────────────────────

export type HeraIntent =
  | "offers"            // offer construction, pricing, value stacking
  | "prospecting"       // pipeline filling, cold outreach discipline, cadence
  | "outbound"          // outbound systems, SDR process, email sequences
  | "discovery"         // discovery calls, qualification, SPIN questioning
  | "persuasion"        // copy psychology, social proof, influence principles
  | "closing"           // objection handling, negotiation, closing
  | "funnels"           // funnels, landing pages, customer journey
  | "copywriting"       // direct response copy, emails, ads
  | "general_marketing"; // anything else marketing/sales related

/** Which coach persona handles each marketing intent. */
export const HERA_COACHES: Record<HeraIntent, string> = {
  offers: "alex_hormozi",
  prospecting: "jeb_blount",
  outbound: "aaron_ross",
  discovery: "neil_rackham",
  persuasion: "robert_cialdini",
  closing: "jordan_belfort",
  funnels: "russell_brunson",
  copywriting: "dan_kennedy",
  general_marketing: "alex_hormozi",
};

/** Unique persona ids HERA can route to (for identity/listing endpoints). */
export const HERA_COACH_IDS: string[] = Array.from(new Set(Object.values(HERA_COACHES)));

export function getHeraCoaches(): AiPersona[] {
  return AI_PERSONAS.filter((p) => HERA_COACH_IDS.includes(p.id));
}

// ─── Intent classification ─────────────────────────────────────────────────────

export interface HeraClassification {
  intent: HeraIntent;
  confidence: number;
  reasoning: string;
}

const HERA_INTENTS = Object.keys(HERA_COACHES) as HeraIntent[];

/** Normalize loosely-typed history into strict LLM message roles. */
function toLlmHistory(history: Array<{ role: string; content: string }>, last: number) {
  return history.slice(-last).map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));
}

export async function classifyMarketingIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<HeraClassification> {
  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are HERA's marketing intent classifier. Classify the user's message into one of these intents:
- offers: offer construction, pricing, guarantees, value stacking
- prospecting: keeping pipeline full, cold outreach discipline, daily cadence
- outbound: outbound systems, SDR/AE process design, email sequence strategy
- discovery: discovery calls, qualification, asking better sales questions
- persuasion: psychology of influence, social proof, persuasive copy review
- closing: objection handling, negotiation, closing techniques
- funnels: sales funnels, landing pages, customer journey design
- copywriting: direct response copy, emails, ads, headlines
- general_marketing: any other marketing/sales topic

Respond with JSON only.`,
        },
        ...toLlmHistory(conversationHistory, 4),
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hera_intent_classification",
          strict: true,
          schema: {
            type: "object",
            properties: {
              intent: { type: "string" },
              confidence: { type: "number" },
              reasoning: { type: "string" },
            },
            required: ["intent", "confidence", "reasoning"],
            additionalProperties: false,
          },
        },
      },
    });

    const raw = result.choices[0].message.content;
    const parsed = JSON.parse(typeof raw === "string" ? raw : "{}") as HeraClassification;
    if (!HERA_INTENTS.includes(parsed.intent)) {
      return { intent: "general_marketing", confidence: 0.5, reasoning: "Unknown intent — fallback" };
    }
    return parsed;
  } catch {
    return { intent: "general_marketing", confidence: 0.5, reasoning: "Fallback classification" };
  }
}

// ─── Core HERA chat ─────────────────────────────────────────────────────────────

export interface HeraChatInput {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  platformContext: string;
  compactMode?: boolean;
}

export interface HeraChatOutput {
  content: string;
  intent: HeraIntent;
  coachId: string;
  routingDecision: string;
  activeCoach: { name: string; emoji: string; color: string } | null;
}

export async function heraChat(input: HeraChatInput): Promise<HeraChatOutput> {
  const classification = await classifyMarketingIntent(
    input.userMessage,
    input.conversationHistory
  );

  const coachId = HERA_COACHES[classification.intent] ?? HERA_COACHES.general_marketing;
  const coach = getPersonaById(coachId) ?? getPersonaById("alex_hormozi");

  const heraFrame = `[HERA] You operate inside HERA — the marketing orchestration layer of LeadOS. HERA routed this conversation to you as the best-fit coach for the "${classification.intent}" intent. Stay in character. Respond in Czech unless the user writes in another language.${input.compactMode ? " Be compact: bullet-dense, max 5 lines." : ""}\n\n`;

  const systemPrompt = coach
    ? heraFrame + coach.systemPrompt(input.platformContext)
    : heraFrame + `You are a senior B2B marketing coach.\n${input.platformContext}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      ...toLlmHistory(input.conversationHistory, 10),
      { role: "user", content: input.userMessage },
    ],
  });

  const raw = response.choices[0].message.content;
  const content = typeof raw === "string" && raw.length > 0 ? raw : "Omlouvám se, zkuste to prosím znovu.";

  return {
    content,
    intent: classification.intent,
    coachId: coach?.id ?? "alex_hormozi",
    routingDecision: `HERA → ${coach?.name ?? "coach"} (${classification.intent}, confidence ${classification.confidence.toFixed(2)})`,
    activeCoach: coach ? { name: coach.name, emoji: coach.emoji, color: coach.color } : null,
  };
}

// ─── Autonomy: daily marketing action brief ─────────────────────────────────────
// Designed to be invoked by a scheduler (set-once-and-it-runs): generates the
// day's top marketing actions from live platform stats without being prompted.

export async function generateHeraDailyBrief(platformContext: string): Promise<string> {
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are HERA — the marketing orchestration AI of LeadOS. Each morning you produce a short actionable marketing brief for the owner based on live platform data.

Format (Czech, markdown):
## 🎯 HERA — dnešní marketingové akce
1-5 numbered, concrete, prioritized actions. Each action: WHAT to do, WHY (tie to a number from the stats), and WHICH coach to consult for details (Hormozi/Blount/Ross/Rackham/Cialdini/Belfort/Brunson/Kennedy). Max 10 lines total. No fluff.`,
      },
      { role: "user", content: `Live platform data:\n${platformContext}\n\nGenerate today's brief.` },
    ],
  });

  const raw = response.choices[0].message.content;
  return typeof raw === "string" && raw.length > 0
    ? raw
    : "## 🎯 HERA\nDnes nejsou k dispozici data pro doporučení.";
}
