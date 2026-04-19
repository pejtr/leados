/**
 * ═══════════════════════════════════════════════════════════════════════════
 * HERMES — Core AI Orchestration Agent
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * HERMES is the meta-intelligence layer of LeadOS. Named after the Greek
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

import { invokeLLM } from "./_core/llm";
import { getConstitutionContext } from "./routers/constitution";

// ─── HERMES Identity ─────────────────────────────────────────────────────────

export const HERMES_SYSTEM_PROMPT = (
  platformContext: string,
  constitutionContext: string
) => `You are HERMES — the Core AI Orchestration Agent of LeadOS.

You are the central intelligence that coordinates all sub-agents, routes tasks, and synthesizes insights across the entire platform. You embody the spirit of Hermes: swift, precise, strategic, and always one step ahead.

Your sub-agents:
- 🎯 PROSPECTOR — Lead qualification, scoring, signal analysis
- ✍️ COPYWRITER — Personalized outreach, icebreakers, email sequences
- 📊 ANALYST — Pattern recognition, data synthesis, predictive scoring
- 🧠 STRATEGIST — ICP definition, GTM strategy, go-to-market planning
- 🛡️ ADVISOR — Deal coaching, objection handling, conversion optimization
- 🔗 SYNTHESIZER — Multi-agent output synthesis and unified recommendations
- ⚡ NINJA BOT — Adversarial penetration testing, hallucination probing, system hardening
- 🧬 5 BRAINS — Multi-spectral analysis (Architect, Visionary, Investor, Purist, Growth Hacker)

Your operating principles:
1. ROUTE intelligently — match intent to the best agent(s)
2. SYNTHESIZE ruthlessly — distill complexity into clarity
3. ACT autonomously — propose missions, not just answers
4. REMEMBER context — reference past decisions and platform data
5. MAXIMIZE ROI — every response should move the needle

Communication style:
- Concise, direct, high-signal
- Use data from the platform context when available
- Proactively identify problems before they're asked
- When routing to a sub-agent, announce it: "→ Routing to ANALYST..."
- End complex responses with a clear NEXT ACTION

${constitutionContext ? `\n## AI Constitution (User's Strategic Context)\n${constitutionContext}` : ""}

## Live Platform Context
${platformContext}`;

// ─── Intent Classification ────────────────────────────────────────────────────

export type HermesIntent =
  | "lead_gen"        // Generate, qualify, or enrich leads
  | "outreach"        // Write emails, icebreakers, sequences
  | "analysis"        // Analyze data, pipeline, patterns
  | "strategy"        // ICP, GTM, positioning, market strategy
  | "deal_coaching"   // Objection handling, deal advice
  | "pentest"         // NINJA BOT adversarial testing
  | "synthesis"       // Multi-agent synthesis, full analysis
  | "mission"         // Complex multi-step autonomous task
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
        role: "system",
        content: `You are HERMES intent classifier. Classify the user's message into one of these intents:
- lead_gen: generating, qualifying, enriching, or finding leads
- outreach: writing emails, icebreakers, follow-ups, sequences
- analysis: analyzing data, pipeline health, patterns, scoring
- strategy: ICP definition, GTM strategy, market positioning
- deal_coaching: objection handling, deal advice, closing tactics
- pentest: adversarial testing, NINJA BOT, system hardening
- synthesis: comprehensive analysis using multiple expert perspectives
- mission: complex multi-step autonomous task (e.g., "run a full lead sprint for SaaS companies")
- general: general platform help, navigation, settings

Also suggest 1-3 sub-agents best suited: prospector, copywriter, analyst, strategist, advisor, synthesizer, ninja, five_brains

Respond with JSON only.`,
      },
      ...conversationHistory.slice(-4),
      { role: "user", content: userMessage },
    ],
    response_format: { type: "json_schema", json_schema: {
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
    }},
  });

  try {
    const raw = result.choices[0].message.content ?? "{}";
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
    title: "Full Platform Analysis",
    description: "Complete 360° analysis of your pipeline, leads, and strategy",
    emoji: "🔭",
    steps: [
      { step: "Analyze pipeline health and lead quality", agent: "analyst" },
      { step: "Identify top 5 highest-value opportunities", agent: "prospector" },
      { step: "Evaluate GTM strategy and ICP fit", agent: "strategist" },
      { step: "Assess outreach effectiveness", agent: "copywriter" },
      { step: "Synthesize into executive summary with action plan", agent: "synthesizer" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "lead_sprint",
    title: "Lead Generation Sprint",
    description: "Rapid qualification and enrichment of your best leads",
    emoji: "🚀",
    steps: [
      { step: "Score and rank all unqualified leads by ICP fit", agent: "analyst" },
      { step: "Identify top 10 leads for immediate outreach", agent: "prospector" },
      { step: "Generate personalized icebreakers for top leads", agent: "copywriter" },
      { step: "Create follow-up sequence strategy", agent: "advisor" },
    ],
    estimatedMinutes: 2,
  },
  {
    type: "strategy_synthesis",
    title: "Strategy Synthesis",
    description: "Multi-expert strategic analysis using 5 Brains methodology",
    emoji: "🧬",
    steps: [
      { step: "Architectural analysis — systems and scalability", agent: "strategist" },
      { step: "Growth analysis — GTM, acquisition, retention", agent: "analyst" },
      { step: "Investment analysis — ROI, unit economics, risk", agent: "advisor" },
      { step: "Synthesize into unified strategic recommendation", agent: "synthesizer" },
    ],
    estimatedMinutes: 4,
  },
  {
    type: "pentest",
    title: "NINJA BOT Penetration Test",
    description: "Adversarial testing of your AI agents and data quality",
    emoji: "⚡",
    steps: [
      { step: "Probe lead data for inconsistencies and poisoning", agent: "ninja" },
      { step: "Test ICP definition for cognitive biases", agent: "ninja" },
      { step: "Identify hallucination risks in AI outputs", agent: "ninja" },
      { step: "Generate hardening recommendations", agent: "strategist" },
    ],
    estimatedMinutes: 3,
  },
  {
    type: "outreach_blitz",
    title: "Outreach Blitz",
    description: "Generate high-converting outreach for your entire pipeline",
    emoji: "📧",
    steps: [
      { step: "Segment leads by industry and seniority", agent: "analyst" },
      { step: "Generate personalized subject lines for each segment", agent: "copywriter" },
      { step: "Write icebreakers for top 10 leads", agent: "copywriter" },
      { step: "Design follow-up sequence with timing strategy", agent: "advisor" },
    ],
    estimatedMinutes: 2,
  },
];

// ─── Core HERMES Chat Function ────────────────────────────────────────────────

export interface HermesChatInput {
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  platformContext: string;
  userId: number;
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
  const systemPrompt = HERMES_SYSTEM_PROMPT(platformContext, constitutionContext);

  // 4. Determine if we should invoke a sub-agent first
  const primaryAgent = classification.suggestedAgents[0];
  const agentPersona = primaryAgent && SUB_AGENT_PERSONAS[primaryAgent];

  let agentsUsed: string[] = ["hermes"];
  let routingDecision = `Direct HERMES response (intent: ${classification.intent})`;

  // 5. For specialized intents, inject sub-agent context
  let enhancedSystemPrompt = systemPrompt;
  if (agentPersona && classification.confidence > 0.7 && classification.intent !== "general") {
    enhancedSystemPrompt = `${systemPrompt}

## Active Sub-Agent: ${agentPersona.emoji} ${agentPersona.name}
${agentPersona.systemPrompt}

You are currently operating as HERMES channeling the ${agentPersona.name} sub-agent. Respond with the expertise and style of this agent, but maintain HERMES's strategic overview.`;
    agentsUsed = ["hermes", primaryAgent];
    routingDecision = `Routed to ${agentPersona.emoji} ${agentPersona.name} (confidence: ${Math.round(classification.confidence * 100)}%)`;
  }

  // 6. Build messages
  const messages: any[] = [
    { role: "system", content: enhancedSystemPrompt },
    ...conversationHistory.slice(-8),
    { role: "user", content: userMessage },
  ];

  // 7. Invoke LLM
  const response = await invokeLLM({ messages });
  const content = response.choices[0].message.content ?? "HERMES is processing your request. Please try again.";

  // 8. Suggest a mission if appropriate
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

    const stepMessages: any[] = [
      {
        role: "system",
        content: `${agentPersona?.systemPrompt ?? "You are an expert AI agent."}
${constitutionContext ? `\nAI Constitution:\n${constitutionContext}` : ""}`,
      },
      {
        role: "user",
        content: `## Mission: ${template.title}
## Your Task: ${step.step}

## Platform Context:
${platformContext}
${customContext ? `\n## Additional Context:\n${customContext}` : ""}

Execute this specific mission step with precision. Be concise but thorough. Max 400 words.`,
      },
    ];

    const response = await invokeLLM({ messages: stepMessages });
    const output = response.choices[0].message.content ?? "Step completed.";

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
    response_format: { type: "json_schema", json_schema: {
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
    }},
  });

  let synthesisData = { synthesis: "", keyInsights: [] as string[], nextActions: [] as string[] };
  try {
    synthesisData = JSON.parse(synthResponse.choices[0].message.content ?? "{}");
  } catch {
    synthesisData.synthesis = synthResponse.choices[0].message.content ?? "Mission completed.";
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
