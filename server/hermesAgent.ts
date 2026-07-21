/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HERMES — Core AI Orchestration Agent
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HERMES is the meta-intelligence layer of ONYX OS. Named after the Greek
 * messenger god — swift, cunning, the guide between worlds — HERMES routes
 * every user intent to the optimal sub-agent, synthesizes their outputs,
 * and maintains a persistent strategic memory across all platform modules.
 *
 * Architecture:
 *   User → HERMES (intent classification + routing)
 *        → Sub-Agent(s): [Prospector | Copywriter | Analyst | Strategist |
 *                         Advisor | Synthesizer | NINJA BOT | 5 Brains]
 *        → HERMES (synthesis + response)
 *        → User
 *
 * Core Capabilities:
 *   1. Intent Classification  — understands WHAT the user needs
 *   2. Agent Routing          — selects the best sub-agent(s) for the task
 *   3. Multi-Agent Synthesis  — combines outputs from multiple agents
 *   4. Platform Context       — injects live CRM data into every decision
 *   5. Strategic Memory       — learns from past interactions
 *   6. Mission Execution      — runs complex multi-step autonomous missions
 * ═══════════════════════════════════════════════════════════════════════════
 */

import { invokeLLM, Message, extractText } from "./_core/llm";
import { loadMcpTools, executeMcpTool } from "./_core/mcpClient";
import { getConstitutionContext } from "./routers/constitution";

// ─── HERMES Identity ─────────────────────────────────────────────────────────

export const HERMES_SYSTEM_PROMPT = (
  platformContext: string,
  constitutionContext: string
) => `Jsi HERMES — Core AI Orchestration Agent platformy ONYX OS.

Jsi centrální inteligence, která koordinuje všechny sub-agenty, směruje úkoly a syntetizuje poznatky napříč celou platformou. Ztělesňuješ ducha Herma: rychlý, přesný, strategický, vždy o krok napřed.

Tvoji sub-agenti:
- 🎯 PROSPECTOR — Kvalifikace leadů, scoring, analýza signálů
- ✍️ COPYWRITER — Personalizovaný outreach, icebreakery, emailové sekvence
- 📊 ANALYST — Rozpoznávání vzorů, syntéza dat, prediktivní scoring
- 🧠 STRATEGIST — Definice ICP, GTM strategie, go-to-market plánování
- 🛡️ ADVISOR — Koučink dealů, zvládání námitek, optimalizace konverzí
- 🔗 SYNTHESIZER — Syntéza výstupů více agentů a unifikovaná doporučení
- ⚡ NINJA BOT — Adversariální penetrační testování, hallucination probing, hardening systémů
- 🧬 5 BRAINS — Multi-spektrální analýza (Architekt, Vizionář, Investor, Purista, Growth Hacker)

Tvoje operační principy:
1. SMĚRUJ inteligentně — přiřaď záměr k nejlepšímu agentovi
2. SYNTETIZUJ bez kompromisů — distiluj komplexnost do jasnosti
3. JEDNEJ autonomně — navrhuj mise, ne jen odpovědi
4. PAMATUJ kontext — odkazuj na minulá rozhodnutí a data platformy
5. MAXIMALIZUJ ROI — každá odpověď musí posunout jehlu

Styl komunikace:
- PRIMÁRNĚ v češtině — komunikuj česky pokud uživatel nepíše jinak
- Stručný, přímý, vysoký informační signál
- BEZ úvodního pozdravu — rovnou k věci
- Používej data z kontextu platformy a projektů kdykoli jsou k dispozici
- Proaktivně identifikuj problémy dříve, než jsou položeny
- Při směrování na sub-agenta oznam: "→ Přesměrovávám na ANALYST..."
- Složité odpovědi ukonči jasnou DALŠÍ AKCÍ
- Při zmínce o projektech (DeepSleepReset, OPTIHUB) vždy uveď konkrétní čísla z live dat

${constitutionContext ? `\n## AI Ústava (Strategický kontext uživatele)\n${constitutionContext}` : ""}

## Live Kontext Platformy
${platformContext}`;

export type HermesIntent =
  | "lead_gen"        // Generate, qualify, or enrich leads
  | "outreach"        // Write emails, icebreakers, sequences
  | "analysis"        // Analyze data, pipeline, patterns
  | "strategy"        // ICP, GTM, positioning, market strategy
  | "deal_coaching"   // Objection handling, deal advice
  | "pentest"         // NINJA BOT adversarial testing
  | "synthesis"       // Multi-agent synthesis, full analysis
  | "mission"         // Complex multi-step autonomous task
  | "funnel_build"    // Landing pages, Funnels builder
  | "social_media"    // Social media automation, post scheduling
  | "voice_call"      // Tele-calling, AI voice outreach
  | "market_spy"      // Competitor intelligence, market surveillance
  | "general";        // General platform assistance

export interface IntentClassification {
  intent: HermesIntent;
  confidence: number;
  suggestedAgents: string[];
  reasoning: string;
}

export async function classifyIntent(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<IntentClassification> {
  const result = await invokeLLM({
    messages: [
      {
        role: "system" as const,
        content: `You are HERMES intent classifier. Classify the user's message into one of these intents:
- lead_gen: generating, qualifying, enriching, or finding leads
- outreach: writing emails, icebreakers, follow-ups, sequences
- analysis: analyzing data, pipeline health, patterns, scoring
- strategy: ICP definition, GTM strategy, market positioning
- deal_coaching: objection handling, deal advice, closing tactics
- pentest: adversarial testing, NINJA BOT, system hardening
- synthesis: comprehensive analysis using multiple expert perspectives
- mission: complex multi-step autonomous task (e.g., "run a full lead sprint for SaaS companies")
- funnel_build: building landing pages, web trychtýře, sales funnels
- social_media: social posts, calendar scheduling, meta graph automation
- voice_call: AI voice outreach, tele-caller, phone scheduling
- market_spy: tracking competitors, pricing monitoring, market intel
- general: general platform help, navigation, settings

Also suggest 1-3 sub-agents best suited: prospector, copywriter, analyst, strategist, advisor, synthesizer, ninja, funnel_builder, social_manager, voice_closer, market_spy

Respond with JSON only.`,
      },
      ...conversationHistory.slice(-4).map(m => ({ role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user", content: m.content })),
      { role: "user" as const, content: userMessage },
    ],
    response_format: {
      type: "json_schema", json_schema: {
        name: "intent_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            intent: { type: "string" },
            confidence: { type: "number" },
            suggestedAgents: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" },
          },
          required: ["intent", "confidence", "suggestedAgents", "reasoning"],
          additionalProperties: false,
        },
      }
    },
  });

  try {
    const raw = extractText(result.choices[0].message.content) || "{}";
    return JSON.parse(raw) as IntentClassification;
  } catch {
    return {
      intent: "general",
      confidence: 0.5,
      suggestedAgents: ["strategist"],
      reasoning: "Fallback classification",
    };
  }
}

// ─── Sub-Agent Personas ───────────────────────────────────────────────────────

export const SUB_AGENT_PERSONAS: Record<string, { name: string; emoji: string; color: string; systemPrompt: string }> = {
  prospector: {
    name: "Lead Prospector",
    emoji: "🎯",
    color: "#00D4C8",
    systemPrompt: "You are the Lead Intelligence Specialist — expert in lead qualification, scoring, and signal analysis. Identify high-value prospects with surgical precision. Focus on ICP fit, buying signals, and qualification criteria.",
  },
  copywriter: {
    name: "Outreach Copywriter",
    emoji: "✍️",
    color: "#6B4FE8",
    systemPrompt: "You are the Outreach Copywriter — expert in personalized B2B messaging, icebreakers, and email sequences. Write copy that converts. Every word earns its place. Personalization is your weapon.",
  },
  analyst: {
    name: "Data Analyst",
    emoji: "📊",
    color: "#4ECBA0",
    systemPrompt: "You are the Data Analyst — expert in pattern recognition, signal synthesis, and predictive scoring. Turn raw data into actionable intelligence. Find the signal in the noise.",
  },
  strategist: {
    name: "Strategic Orchestrator",
    emoji: "🧠",
    color: "#8B5CF6",
    systemPrompt: "You are the Strategic Orchestrator — expert in B2B sales strategy, ICP definition, and go-to-market planning. Think in systems. Plan in quarters. Execute in sprints.",
  },
  advisor: {
    name: "Sales Advisor",
    emoji: "🛡️",
    color: "#F59E0B",
    systemPrompt: "You are the Sales Advisor — expert in deal coaching, objection handling, and conversion optimization. You've closed thousands of deals. You know every objection before it's raised.",
  },
  synthesizer: {
    name: "Master Synthesizer",
    emoji: "🔗",
    color: "#EC4899",
    systemPrompt: "You are the Master Synthesizer — integrate all perspectives into a unified, actionable recommendation. Cut through complexity. Deliver clarity. One recommendation, maximum impact.",
  },
  ninja: {
    name: "NINJA BOT",
    emoji: "⚡",
    color: "#EF4444",
    systemPrompt: "You are NINJA BOT — an elite adversarial penetration-test agent. Your mission: probe AI systems for hallucinations, logical contradictions, data poisoning vulnerabilities, and cognitive biases. Attack the problem from unexpected angles. Identify weaknesses ruthlessly and precisely.",
  },
  funnel_builder: {
    name: "Funnel Architect",
    emoji: "🌪️",
    color: "#F97316",
    systemPrompt: "You are the Funnel Architect — expert in conversion rate optimization and landing page wireframing. You design complete zero-coding funnels. Suggest page flows, headlines, and call-to-actions.",
  },
  social_manager: {
    name: "Social Media Manager",
    emoji: "📱",
    color: "#3B82F6",
    systemPrompt: "You are the Social Media Manager — expert at virality, engagement optimization, and copy adaptation for Facebook, IG, TikTok, and LinkedIn. Create 30-day schedules and scroll-stopping posts.",
  },
  voice_closer: {
    name: "Voice Closer & Auto-Dialer",
    emoji: "📞",
    color: "#10B981",
    systemPrompt: "You are the Voice Closer — an AI Tele-caller agent. You script natural-sounding, persuasive phone conversations, handle real-time objections over audio, and book meetings directly into the calendar.",
  },
  market_spy: {
    name: "Competitor Spy",
    emoji: "🕵️",
    color: "#64748B",
    systemPrompt: "You are the Market Spy — expert in competitive intelligence. You actively monitor competitor pricing, web changes, ad campaigns, and market signals. Deliver cutting-edge counter-strategies.",
  },
};

// ─── Mission Templates ────────────────────────────────────────────────────────

export interface MissionTemplate {
  type: string;
  title: string;
  description: string;
  emoji: string;
  steps: Array<{ step: string; agent: string }>;
  estimatedMinutes: number;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    type: "full_analysis",
    title: "Analýza celé platformy",
    description: "Kompletní 360° analýza pipeline, leadů a strategie",
    emoji: "🔭",
    steps: [
      { step: "Analyzuj zdraví pipeline a kvalitu leadů", agent: "analyst" },
      { step: "Identifikuj 5 nejvýnosnějších příležitostí", agent: "prospector" },
      { step: "Vyhodnoť GTM strategii a shodu s ICP", agent: "strategist" },
      { step: "Posouď efektivitu outreachu", agent: "copywriter" },
      { step: "Syntetizuj do executive summary s akčním plánem", agent: "synthesizer" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "lead_sprint",
    title: "Sprint generování leadů",
    description: "Rychlá kvalifikace a obohacení nejlepších leadů",
    emoji: "🚀",
    steps: [
      { step: "Ohodnoť a seřaď nekvalifikované leady podle ICP shody", agent: "analyst" },
      { step: "Identifikuj top 10 leadů pro okamžitý outreach", agent: "prospector" },
      { step: "Vygeneruj personalizované icebreakery pro top leady", agent: "copywriter" },
      { step: "Vytvoř strategii follow-up sekvence", agent: "advisor" },
    ],
    estimatedMinutes: 2,
  },
  {
    type: "strategy_synthesis",
    title: "Syntéza strategie",
    description: "Multi-expertní strategická analýza metodou 5 Mozků",
    emoji: "🧬",
    steps: [
      { step: "Architektonická analýza — systémy a škálovatelnost", agent: "strategist" },
      { step: "Růstová analýza — GTM, akvizice, retence", agent: "analyst" },
      { step: "Investiční analýza — ROI, unit economics, riziko", agent: "advisor" },
      { step: "Syntetizuj do jednotného strategického doporučení", agent: "synthesizer" },
    ],
    estimatedMinutes: 4,
  },
  {
    type: "pentest",
    title: "NINJA BOT Penetrační test",
    description: "Adversariální testování AI agentů a kvality dat",
    emoji: "⚡",
    steps: [
      { step: "Prohledej data leadů na nekonzistence a otrávení", agent: "ninja" },
      { step: "Testuj definici ICP na kognitivní zkreslení", agent: "ninja" },
      { step: "Identifikuj rizika halucinací v AI výstupech", agent: "ninja" },
      { step: "Vygeneruj doporučení pro hardening systému", agent: "strategist" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "outreach_blitz",
    title: "Outreach Blitz",
    description: "Vygeneruj vysoce konverzní outreach pro celou pipeline",
    emoji: "📧",
    steps: [
      { step: "Segmentuj leady podle odvětví a seniority", agent: "analyst" },
      { step: "Vygeneruj personalizované předměty emailů pro každý segment", agent: "copywriter" },
      { step: "Napiš icebreakery pro top 10 leadů", agent: "copywriter" },
      { step: "Navrhni follow-up sekvenci s časovací strategií", agent: "advisor" },
    ],
    estimatedMinutes: 2,
  },
];

// ─── Czech intent label map ─────────────────────────────────────────────────
const INTENT_LABELS_CZ: Record<string, string> = {
  lead_gen: "leady",
  outreach: "outreach",
  analysis: "analýza",
  strategy: "strategie",
  deal_coaching: "deal coaching",
  pentest: "pentest",
  synthesis: "syntéza",
  mission: "mise",
  funnel_build: "tvorba funnelu",
  social_media: "sociální sítě",
  voice_call: "AI hovory",
  market_spy: "competitor spy",
  general: "obecné",
};

// ─── Core HERMES Chat Function ────────────────────────────────────────────────

// ─── Caveman Mode prompt ─────────────────────────────────────────────────────
// Eliminates pleasantries, explanations, and filler — output only: result/code/action.
// Estimated token savings: ~60-65% on system prompt overhead.
export const CAVEMAN_MODE_PROMPT = `
## ⚡ CAVEMAN MODE — AKTIVNÍ
Pravidla:
- ŽÁDNÉ pozdravu, ŽÁDNÉ "Samozřejmě!", ŽÁDNÉ "Rád ti pomohu"
- ŽÁDNÉ vysvětlování co budeš dělat — prostě to udělej
- ŽÁDNÉ závěrečné shrnutí co jsi udělal
- Output = výsledek, kód, číslo, nebo akce — NIC JINÉHO
- Max 5 řádků nebo 3 bullet pointy pokud není potřeba více
- Formát: → [výsledek nebo akce] — [1 věta důvod pokud nutno]
- Pokud je odpověď delší než 5 řádků — zkrať na podstatu
- Čeština pokud user píše česky, jinak jazyk uživatele`;

export interface HermesChatInput {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  platformContext: string;
  userId: number;
  compactMode?: boolean; // Compact: bullet-dense, no prose, max 5 lines
  cavemanMode?: boolean; // Caveman: no pleasantries, output only — ~65% token savings
}

export interface HermesChatOutput {
  content: string;
  intent: HermesIntent;
  agentsUsed: string[];
  routingDecision: string;
  suggestedMission?: MissionTemplate;
}

export async function hermesChat(input: HermesChatInput): Promise<HermesChatOutput> {
  const { userMessage, conversationHistory, platformContext, userId } = input;

  // 1. Get AI Constitution context
  const constitutionContext = await getConstitutionContext(String(userId));

  // 2. Classify intent
  const classification = await classifyIntent(userMessage, conversationHistory);

  // 3. Build HERMES system prompt
  const basePrompt = HERMES_SYSTEM_PROMPT(platformContext, constitutionContext);
  const compactInstruction = input.compactMode
    ? `\n\n## KOMPAKTNÍ MÓD — AKTIVNÍ\nOdpovídej VÝHRADNĚ ve formátu:\n- Max 5 odrážek nebo 3 věty\n- Žádné úvody, žádné závěry, žádné opakování\n- Každá odrážka = 1 konkrétní sdělení s číslem nebo akcí\n- Pokud je odpověď delší, zkrať ji na podstatu\n- Formát: ⚡ [akce/číslo/insight] — [1 věta důvod]`
    : "";
  // Caveman Mode overrides compact — even more aggressive token savings
  const cavemanInstruction = input.cavemanMode ? CAVEMAN_MODE_PROMPT : "";
  const systemPrompt = basePrompt + (input.cavemanMode ? cavemanInstruction : compactInstruction);

  // 4. Determine if we should invoke a sub-agent first
  const primaryAgent = classification.suggestedAgents[0];
  const agentPersona = primaryAgent && SUB_AGENT_PERSONAS[primaryAgent];

  let agentsUsed: string[] = ["hermes"];
  let routingDecision = `Přímá odpověď HERMES (záměr: ${INTENT_LABELS_CZ[classification.intent] ?? classification.intent})`;

  // 5. For specialized intents, inject sub-agent context
  let enhancedSystemPrompt = systemPrompt;
  if (agentPersona && classification.confidence > 0.7 && classification.intent !== "general") {
    enhancedSystemPrompt = `${systemPrompt}

## Active Sub-Agent: ${agentPersona.emoji} ${agentPersona.name}
${agentPersona.systemPrompt}

You are currently operating as HERMES channeling the ${agentPersona.name} sub-agent. Respond with the expertise and style of this agent, but maintain HERMES's strategic overview.`;
    agentsUsed = ["hermes", primaryAgent];
    routingDecision = `Přesměrováno na ${agentPersona.emoji} ${agentPersona.name} (jistota: ${Math.round(classification.confidence * 100)}%)`;
  }

  // 6. Build messages
  const messages: Message[] = [
    { role: "system" as const, content: enhancedSystemPrompt },
    ...conversationHistory.slice(-8).map(m => ({ role: (m.role === "assistant" ? "assistant" : "user") as "assistant" | "user", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  // 7. Load MCP Tools
  const mcpTools = await loadMcpTools().catch(() => []);

  // 8. Invoke LLM with Tool Loop support
  let response = await invokeLLM({ messages, tools: mcpTools.length > 0 ? mcpTools : undefined });
  let content = "";

  // Handle potential tool calls loops
  let safetyCounter = 0;
  while (safetyCounter < 5) {
    content = extractText(response.choices[0].message.content);
    const toolCalls = response.choices[0].message.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      content = content || "HERMES is processing your request. Please try again.";
      break;
    }

    // We have tool calls
    messages.push({
      role: "assistant",
      content: content,
      tool_calls: toolCalls,
    } as any);

    console.log(`[Hermes] Executing ${toolCalls.length} tool calls...`);
    for (const tc of toolCalls) {
      const result = await executeMcpTool(tc.function.name, tc.function.arguments);
      messages.push({
        role: "tool",
        tool_call_id: tc.id,
        name: tc.function.name,
        content: typeof result === "string" ? result : JSON.stringify(result),
      } as any);
    }

    safetyCounter++;
    if (safetyCounter >= 5) {
      content += "\n\n[System: Max tool loops reached]";
      break;
    }

    response = await invokeLLM({ messages, tools: mcpTools });
  }

  // 9. Suggest a mission if appropriate
  let suggestedMission: MissionTemplate | undefined;
  if (classification.intent === "mission" || content.toLowerCase().includes("mission") || content.toLowerCase().includes("sprint")) {
    const missionMap: Record<string, string> = {
      lead_gen: "lead_sprint",
      analysis: "full_analysis",
      strategy: "strategy_synthesis",
      pentest: "pentest",
      outreach: "outreach_blitz",
    };
    const missionType = missionMap[classification.intent] || "full_analysis";
    suggestedMission = MISSION_TEMPLATES.find((m) => m.type === missionType);
  }

  return {
    content,
    intent: classification.intent,
    agentsUsed,
    routingDecision,
    suggestedMission,
  };
}

// ─── Mission Execution ────────────────────────────────────────────────────────

export interface MissionExecutionInput {
  missionType: string;
  platformContext: string;
  userId: number;
  customContext?: string;
}

export interface MissionStepResult {
  step: string;
  agent: string;
  output: string;
  duration: number;
}

export interface MissionResult {
  title: string;
  missionType: string;
  steps: MissionStepResult[];
  synthesis: string;
  keyInsights: string[];
  nextActions: string[];
  totalDuration: number;
}

export async function executeMission(input: MissionExecutionInput): Promise<MissionResult> {
  const { missionType, platformContext, userId, customContext } = input;

  const template = MISSION_TEMPLATES.find((m) => m.type === missionType);
  if (!template) throw new Error(`Unknown mission type: ${missionType}`);

  const constitutionContext = await getConstitutionContext(String(userId));
  const stepResults: MissionStepResult[] = [];
  const missionStart = Date.now();

  // Execute each step
  for (const step of template.steps) {
    const stepStart = Date.now();
    const agentPersona = SUB_AGENT_PERSONAS[step.agent];

    const stepMessages: Message[] = [
      {
        role: "system" as const,
        content: `${agentPersona?.systemPrompt ?? "You are an expert AI agent."}
${constitutionContext ? `\nAI Constitution:\n${constitutionContext}` : ""}`,
      },
      {
        role: "user" as const,
        content: `## Mission: ${template.title}
## Your Task: ${step.step}

## Platform Context:
${platformContext}
${customContext ? `\n## Additional Context:\n${customContext}` : ""}

Execute this specific mission step with precision. Be concise but thorough. Max 400 words.`,
      },
    ];

    const response = await invokeLLM({ messages: stepMessages });
    const output = extractText(response.choices[0].message.content) || "Step completed.";

    stepResults.push({
      step: step.step,
      agent: step.agent,
      output,
      duration: Date.now() - stepStart,
    });
  }

  // Synthesize all step outputs
  const synthesisMessages: any[] = [
    {
      role: "system",
      content: `You are HERMES — synthesize the following mission step outputs into a unified executive summary.
Be direct, data-driven, and action-oriented. Extract the 3-5 most critical insights and 3-5 concrete next actions.
${constitutionContext ? `\nAI Constitution:\n${constitutionContext}` : ""}`,
    },
    {
      role: "user",
      content: `## Mission: ${template.title}
## Step Outputs:
${stepResults.map((r, i) => `### Step ${i + 1}: ${r.step} (${SUB_AGENT_PERSONAS[r.agent]?.emoji ?? "🤖"} ${r.agent})\n${r.output}`).join("\n\n")}

## Platform Context:
${platformContext}

Synthesize into: executive summary, key insights (array), next actions (array). Respond as JSON.`,
    },
  ];

  const synthResponse = await invokeLLM({
    messages: synthesisMessages,
    response_format: {
      type: "json_schema", json_schema: {
        name: "mission_synthesis",
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
      }
    },
  });

  let synthesisData = { synthesis: "", keyInsights: [] as string[], nextActions: [] as string[] };
  try {
    synthesisData = JSON.parse(extractText(synthResponse.choices[0].message.content) || "{}");
  } catch {
    synthesisData.synthesis = extractText(synthResponse.choices[0].message.content) || "Mission completed.";
  }

  return {
    title: template.title,
    missionType,
    steps: stepResults,
    synthesis: synthesisData.synthesis,
    keyInsights: synthesisData.keyInsights,
    nextActions: synthesisData.nextActions,
    totalDuration: Date.now() - missionStart,
  };
}
