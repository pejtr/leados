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

// ─── HERA Missions — multi-step marketing playbooks (parity with HERMES) ───────

export interface HeraMissionTemplate {
  type: string;
  title: string;
  description: string;
  emoji: string;
  steps: Array<{ step: string; coach: string }>;
  estimatedMinutes: number;
}

export const HERA_MISSION_TEMPLATES: HeraMissionTemplate[] = [
  {
    type: "hera_offer_sprint",
    title: "Grand Slam Offer Sprint",
    description: "Kompletní přestavba nabídky — Value Equation, důvěra, direct-response prezentace",
    emoji: "🎁",
    steps: [
      { step: "Rozeber současnou nabídku přes Value Equation a najdi slabá místa", coach: "alex_hormozi" },
      { step: "Navrhni etické prvky důvěry: social proof, autorita, garance, scarcity", coach: "robert_cialdini" },
      { step: "Napiš direct-response prezentaci nabídky s CTA a deadlinem", coach: "dan_kennedy" },
      { step: "Slož finální Grand Slam Offer stack (nabídka + bonusy + garance + urgence)", coach: "alex_hormozi" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "hera_outbound_campaign",
    title: "Outbound kampaň od nuly",
    description: "ICP targeting → discovery otázky → cold e-maily → follow-up kadence",
    emoji: "📬",
    steps: [
      { step: "Definuj ICP targeting a strukturu kampaně (seeds/nets/spears)", coach: "aaron_ross" },
      { step: "Vytvoř SPIN discovery otázky pro první call s odpovědí na kampaň", coach: "neil_rackham" },
      { step: "Napiš 3-krokovou cold email sekvenci (krátké, jeden jasný ask)", coach: "dan_kennedy" },
      { step: "Sestav multichannel follow-up kadenci na 14 dní", coach: "jeb_blount" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "hera_funnel_audit",
    title: "Audit funnelu",
    description: "Value ladder, přesvědčovací prvky, CTA — prioritizovaný plán oprav",
    emoji: "🔬",
    steps: [
      { step: "Zmapuj value ladder a vyhodnoť hook-story-offer každého kroku", coach: "russell_brunson" },
      { step: "Audituj přesvědčovací prvky (7 principů) na klíčových stránkách", coach: "robert_cialdini" },
      { step: "Přepiš nejslabší headliny a CTA na direct-response", coach: "dan_kennedy" },
      { step: "Syntetizuj do prioritizovaného plánu oprav podle dopadu na konverzi", coach: "russell_brunson" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "hera_pipeline_revival",
    title: "Oživení pipeline",
    description: "Diagnóza mrtvé pipeline, re-engagement zprávy, skripty na námitky",
    emoji: "🫀",
    steps: [
      { step: "Diagnostikuj pipeline a navrhni denní prospecting kadenci", coach: "jeb_blount" },
      { step: "Napiš re-engagement zprávu postavenou na reciprocitě a jednotě", coach: "robert_cialdini" },
      { step: "Připrav skripty na 3 nejčastější námitky oživených leadů", coach: "jordan_belfort" },
    ],
    estimatedMinutes: 2,
  },
  {
    type: "hera_content_week",
    title: "Týden obsahu",
    description: "5 direct-response témat z pain pointů → osnovy → finální texty",
    emoji: "✍️",
    steps: [
      { step: "Navrhni 5 direct-response témat vycházejících z pain pointů ICP", coach: "dan_kennedy" },
      { step: "Rozpracuj témata do hook-story-offer osnov", coach: "russell_brunson" },
      { step: "Napiš finální texty pro 2 nejsilnější témata včetně CTA", coach: "dan_kennedy" },
    ],
    estimatedMinutes: 2,
  },
];

export interface HeraMissionStepResult {
  step: string;
  coach: string;
  output: string;
  duration: number;
}

export interface HeraMissionResult {
  missionType: string;
  title: string;
  stepResults: HeraMissionStepResult[];
  synthesis: string;
  keyInsights: string[];
  nextActions: string[];
  totalDuration: number;
}

export async function executeHeraMission(input: {
  missionType: string;
  platformContext: string;
  customContext?: string;
}): Promise<HeraMissionResult> {
  const template = HERA_MISSION_TEMPLATES.find((m) => m.type === input.missionType);
  if (!template) throw new Error(`Unknown HERA mission type: ${input.missionType}`);

  const missionStart = Date.now();
  const stepResults: HeraMissionStepResult[] = [];

  // Steps run sequentially — each coach sees the previous coaches' outputs
  for (const step of template.steps) {
    const stepStart = Date.now();
    const coach = getPersonaById(step.coach);
    const stepMessages: any[] = [
      {
        role: "system",
        content: coach
          ? `[HERA mise] ${coach.systemPrompt(input.platformContext)}`
          : `You are a senior B2B marketing coach.\n${input.platformContext}`,
      },
      {
        role: "user",
        content: `## Mise: ${template.title}
## Tvůj krok: ${step.step}
${input.customContext ? `\n## Doplňující kontext:\n${input.customContext}` : ""}
${stepResults.length > 0 ? `\n## Výstupy předchozích kroků:\n${stepResults.map((r, i) => `### ${i + 1}. ${r.step}\n${r.output}`).join("\n\n")}` : ""}

Proveď přesně tento krok mise. Česky, konkrétně, max 400 slov.`,
      },
    ];

    const response = await invokeLLM({ messages: stepMessages });
    const raw = response.choices[0].message.content;
    stepResults.push({
      step: step.step,
      coach: step.coach,
      output: typeof raw === "string" && raw.length > 0 ? raw : "Krok dokončen.",
      duration: Date.now() - stepStart,
    });
  }

  // HERA synthesis of all step outputs
  let synthesisData = { synthesis: "", keyInsights: [] as string[], nextActions: [] as string[] };
  try {
    const synthResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are HERA — the marketing orchestration AI. Synthesize the mission step outputs into a unified, action-oriented summary in Czech. Extract the 3-5 most critical insights and 3-5 concrete next actions.",
        },
        {
          role: "user",
          content: `## Mise: ${template.title}\n## Výstupy kroků:\n${stepResults
            .map((r, i) => `### Krok ${i + 1}: ${r.step} (${r.coach})\n${r.output}`)
            .join("\n\n")}\n\nRespond as JSON.`,
        },
      ] as any[],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hera_mission_synthesis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              synthesis: { type: "string" },
              keyInsights: { type: "array", items: { type: "string" } },
              nextActions: { type: "array", items: { type: "string" } },
            },
            required: ["synthesis", "keyInsights", "nextActions"],
            additionalProperties: false,
          },
        },
      },
    });
    const raw = synthResponse.choices[0].message.content;
    synthesisData = JSON.parse(typeof raw === "string" ? raw : "{}");
  } catch {
    synthesisData.synthesis = "Mise dokončena — viz výstupy jednotlivých kroků.";
  }

  return {
    missionType: template.type,
    title: template.title,
    stepResults,
    synthesis: synthesisData.synthesis ?? "",
    keyInsights: synthesisData.keyInsights ?? [],
    nextActions: synthesisData.nextActions ?? [],
    totalDuration: Date.now() - missionStart,
  };
}

// ─── HERA Panel — multi-coach perspectives + synthesis (mastermind parity) ──────

export interface HeraPanelResult {
  responses: Array<{ coachId: string; name: string; emoji: string; content: string }>;
  synthesis: string;
}

export async function heraPanel(input: {
  message: string;
  coachIds: string[];
  platformContext: string;
}): Promise<HeraPanelResult> {
  const coaches = input.coachIds
    .map((id) => getPersonaById(id))
    .filter((c): c is AiPersona => Boolean(c));
  if (coaches.length === 0) throw new Error("No valid coaches selected");

  const responses = await Promise.all(
    coaches.map(async (coach) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `[HERA panel] ${coach.systemPrompt(input.platformContext)}\n\nAnswer in Czech, in character, max 250 words. Give YOUR distinct take — do not hedge.`,
            },
            { role: "user", content: input.message },
          ] as any[],
        });
        const raw = response.choices[0].message.content;
        return {
          coachId: coach.id,
          name: coach.name,
          emoji: coach.emoji,
          content: typeof raw === "string" && raw.length > 0 ? raw : "Bez odpovědi.",
        };
      } catch {
        return { coachId: coach.id, name: coach.name, emoji: coach.emoji, content: "Kouč není dostupný." };
      }
    })
  );

  let synthesis = "";
  try {
    const synthResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are HERA — synthesize the coach panel responses in Czech: where they agree, where they differ, and ONE recommended course of action. Max 200 words.",
        },
        {
          role: "user",
          content: `## Otázka: ${input.message}\n\n${responses
            .map((r) => `### ${r.emoji} ${r.name}\n${r.content}`)
            .join("\n\n")}`,
        },
      ] as any[],
    });
    const raw = synthResponse.choices[0].message.content;
    synthesis = typeof raw === "string" ? raw : "";
  } catch {
    synthesis = "";
  }

  return { responses, synthesis };
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
