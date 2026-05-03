/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPUTER FLOW — Perplexity-style Multi-Model Orchestration Engine          ║
 * ║                                                                              ║
 * ║  Architecture:                                                               ║
 * ║    1. DECOMPOSER  — Breaks the task into N specialized sub-tasks             ║
 * ║    2. ROUTER      — Assigns each sub-task to the optimal "brain" layer       ║
 * ║    3. EXECUTOR    — Runs all sub-tasks in parallel (Promise.all)             ║
 * ║    4. SYNTHESIZER — Merges all outputs into one optimized final answer       ║
 * ║                                                                              ║
 * ║  Brain Layers (differentiated by thinking budget + system prompt):           ║
 * ║    SCOUT      — Fast decomposition & routing (thinking: 64)                  ║
 * ║    ANALYST    — Deep domain analysis (thinking: 512)                         ║
 * ║    STRATEGIST — Strategic synthesis (thinking: 1024)                         ║
 * ║    DEEP_THINK — Gemini 2.5 Pro via direct API (thinking: 4096)               ║
 * ║    SYNTHESIZER— Final unification (thinking: 2048)                           ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { ENV } from "./_core/env";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrainLayer = "scout" | "analyst" | "strategist" | "deep_think" | "synthesizer";

export interface SubTask {
  id: string;
  title: string;
  description: string;
  layer: BrainLayer;
  systemPrompt: string;
  priority: number; // 1 = highest
}

export interface SubTaskResult {
  taskId: string;
  title: string;
  layer: BrainLayer;
  content: string;
  durationMs: number;
  tokensUsed?: number;
}

export interface ComputerFlowResult {
  query: string;
  subTasks: SubTask[];
  results: SubTaskResult[];
  synthesis: string;
  totalDurationMs: number;
  flowId: string;
  decompositionMs: number;
  executionMs: number;
  synthesisMs: number;
}

export interface ComputerFlowOptions {
  query: string;
  context?: string;          // Platform context (CRM data, etc.)
  maxSubTasks?: number;      // Default: 4
  enableDeepThink?: boolean; // Use Gemini 2.5 Pro for complex tasks
  domain?: string;           // e.g. "lead_gen", "strategy", "analysis"
}

// ─── Brain Layer Configs ──────────────────────────────────────────────────────

const BRAIN_CONFIGS: Record<BrainLayer, { thinkingBudget: number; label: string; emoji: string; color: string }> = {
  scout: {
    thinkingBudget: 64,
    label: "Scout",
    emoji: "🔍",
    color: "oklch(0.65 0.18 200)",
  },
  analyst: {
    thinkingBudget: 512,
    label: "Analyst",
    emoji: "📊",
    color: "oklch(0.60 0.20 260)",
  },
  strategist: {
    thinkingBudget: 1024,
    label: "Strategist",
    emoji: "🧠",
    color: "oklch(0.55 0.22 310)",
  },
  deep_think: {
    thinkingBudget: 4096,
    label: "Deep Think",
    emoji: "⚡",
    color: "oklch(0.55 0.25 25)",
  },
  synthesizer: {
    thinkingBudget: 2048,
    label: "Synthesizer",
    emoji: "🔗",
    color: "oklch(0.60 0.22 150)",
  },
};

export const BRAIN_CONFIGS_PUBLIC = BRAIN_CONFIGS;

// ─── LLM Invocation Helpers ───────────────────────────────────────────────────

async function invokeForge(params: {
  systemPrompt: string;
  userMessage: string;
  thinkingBudget: number;
  maxTokens?: number;
}): Promise<{ content: string; durationMs: number }> {
  const start = Date.now();
  const apiUrl = ENV.forgeApiUrl
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/chat/completions`
    : "https://forge.manus.ai/v1/chat/completions";

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ENV.forgeApiKey}`,
    },
    body: JSON.stringify({
      model: "gemini-2.5-flash",
      messages: [
        { role: "system", content: params.systemPrompt },
        { role: "user", content: params.userMessage },
      ],
      max_tokens: params.maxTokens ?? 8192,
      thinking: { budget_tokens: params.thinkingBudget },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Forge API error: ${response.status} – ${err}`);
  }

  const data = await response.json() as any;
  const content = data.choices?.[0]?.message?.content ?? "";
  return { content, durationMs: Date.now() - start };
}

async function invokeGeminiPro(params: {
  systemPrompt: string;
  userMessage: string;
}): Promise<{ content: string; durationMs: number }> {
  const start = Date.now();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: params.userMessage }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          thinkingConfig: { thinkingBudget: 4096 },
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini Pro API error: ${response.status} – ${err}`);
  }

  const data = await response.json() as any;
  const content = data.candidates?.[0]?.content?.parts
    ?.filter((p: any) => p.text && !p.thought)
    ?.map((p: any) => p.text)
    ?.join("") ?? "";
  return { content, durationMs: Date.now() - start };
}

// ─── Step 1: Decomposer ───────────────────────────────────────────────────────

const DECOMPOSER_PROMPT = `You are the DECOMPOSER brain of the Computer Flow system.
Your job: analyze the user's query and break it into 3-5 specialized sub-tasks.
Each sub-task should be handled by the optimal brain layer:
- "scout": Quick factual lookups, data retrieval, classification
- "analyst": Deep data analysis, pattern recognition, metrics
- "strategist": Strategic recommendations, GTM, positioning, planning
- "deep_think": Complex multi-step reasoning, novel synthesis (use sparingly)
- "synthesizer": Cross-cutting synthesis (reserved for final step, do NOT assign here)

Return ONLY valid JSON in this exact format:
{
  "subTasks": [
    {
      "id": "t1",
      "title": "Short task title",
      "description": "What this brain should analyze or produce",
      "layer": "analyst",
      "systemPrompt": "You are a specialized [role]. Your task is to [specific instruction]...",
      "priority": 1
    }
  ]
}

Rules:
- Max 5 sub-tasks, min 2
- Each sub-task must be genuinely independent (parallelizable)
- systemPrompt must be specific and role-focused (50-200 chars)
- Assign "deep_think" only if the query requires novel strategic insight
- Tasks should cover complementary angles (data + strategy + execution)`;

async function decompose(query: string, context: string, domain: string): Promise<SubTask[]> {
  const { content } = await invokeForge({
    systemPrompt: DECOMPOSER_PROMPT,
    userMessage: `Query: ${query}\n\nPlatform context: ${context.slice(0, 1000)}\nDomain: ${domain}`,
    thinkingBudget: 128,
    maxTokens: 2048,
  });

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Decomposer returned invalid JSON");

  const parsed = JSON.parse(jsonMatch[0]) as { subTasks: SubTask[] };
  return parsed.subTasks.slice(0, 5);
}

// ─── Step 2: Parallel Executor ────────────────────────────────────────────────

async function executeSubTask(
  task: SubTask,
  query: string,
  context: string,
  enableDeepThink: boolean
): Promise<SubTaskResult> {
  const config = BRAIN_CONFIGS[task.layer];
  const userMessage = `Original query: ${query}\n\nYour specific sub-task: ${task.description}\n\nContext: ${context.slice(0, 800)}`;

  let result: { content: string; durationMs: number };

  if (task.layer === "deep_think" && enableDeepThink) {
    result = await invokeGeminiPro({
      systemPrompt: task.systemPrompt,
      userMessage,
    });
  } else {
    // Map deep_think to strategist if Gemini Pro is disabled
    const effectiveBudget = task.layer === "deep_think"
      ? BRAIN_CONFIGS.strategist.thinkingBudget
      : config.thinkingBudget;

    result = await invokeForge({
      systemPrompt: task.systemPrompt,
      userMessage,
      thinkingBudget: effectiveBudget,
    });
  }

  return {
    taskId: task.id,
    title: task.title,
    layer: task.layer,
    content: result.content,
    durationMs: result.durationMs,
  };
}

// ─── Step 3: Synthesizer ──────────────────────────────────────────────────────

const SYNTHESIZER_PROMPT = `You are the SYNTHESIZER — the final brain in the Computer Flow pipeline.
You receive outputs from multiple specialized brain layers that analyzed different aspects of the same query.
Your mission: synthesize all perspectives into ONE unified, optimized, actionable response.

Rules:
- Eliminate redundancy — merge overlapping insights
- Resolve contradictions — explain trade-offs when perspectives differ
- Amplify signal — highlight the highest-leverage insights
- End with a clear NEXT ACTION section (2-3 concrete steps)
- Write in the same language as the original query
- Format with markdown headers for readability
- Be direct, specific, data-driven — no platitudes`;

async function synthesize(
  query: string,
  results: SubTaskResult[]
): Promise<{ content: string; durationMs: number }> {
  const brainOutputs = results
    .map((r) => {
      const cfg = BRAIN_CONFIGS[r.layer];
      return `## ${cfg.emoji} ${cfg.label}: ${r.title}\n${r.content}`;
    })
    .join("\n\n---\n\n");

  return invokeForge({
    systemPrompt: SYNTHESIZER_PROMPT,
    userMessage: `Original query: ${query}\n\n# Brain Layer Outputs\n\n${brainOutputs}`,
    thinkingBudget: 2048,
    maxTokens: 16384,
  });
}

// ─── Main Computer Flow Orchestrator ─────────────────────────────────────────

export async function runComputerFlow(options: ComputerFlowOptions): Promise<ComputerFlowResult> {
  const {
    query,
    context = "",
    maxSubTasks = 4,
    enableDeepThink = false,
    domain = "general",
  } = options;

  const flowId = `cf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const totalStart = Date.now();

  // Step 1: Decompose
  const decompStart = Date.now();
  const subTasks = (await decompose(query, context, domain)).slice(0, maxSubTasks);
  const decompositionMs = Date.now() - decompStart;

  // Step 2: Execute all sub-tasks in parallel
  const execStart = Date.now();
  const results = await Promise.all(
    subTasks.map((task) => executeSubTask(task, query, context, enableDeepThink))
  );
  const executionMs = Date.now() - execStart;

  // Step 3: Synthesize
  const synthStart = Date.now();
  const { content: synthesis } = await synthesize(query, results);
  const synthesisMs = Date.now() - synthStart;

  return {
    query,
    subTasks,
    results,
    synthesis,
    totalDurationMs: Date.now() - totalStart,
    flowId,
    decompositionMs,
    executionMs,
    synthesisMs,
  };
}

// ─── Streaming variant (yields progress events) ───────────────────────────────

export type FlowEvent =
  | { type: "decomposed"; subTasks: SubTask[] }
  | { type: "task_start"; taskId: string; title: string; layer: BrainLayer }
  | { type: "task_done"; result: SubTaskResult }
  | { type: "synthesis_start" }
  | { type: "synthesis_done"; content: string; totalDurationMs: number }
  | { type: "error"; message: string };

export async function* runComputerFlowStream(
  options: ComputerFlowOptions
): AsyncGenerator<FlowEvent> {
  const {
    query,
    context = "",
    maxSubTasks = 4,
    enableDeepThink = false,
    domain = "general",
  } = options;

  const totalStart = Date.now();

  try {
    // Step 1: Decompose
    const subTasks = (await decompose(query, context, domain)).slice(0, maxSubTasks);
    yield { type: "decomposed", subTasks };

    // Step 2: Emit task_start for all, then execute in parallel
    for (const task of subTasks) {
      yield { type: "task_start", taskId: task.id, title: task.title, layer: task.layer };
    }

    const results = await Promise.all(
      subTasks.map((task) => executeSubTask(task, query, context, enableDeepThink))
    );

    for (const result of results) {
      yield { type: "task_done", result };
    }

    // Step 3: Synthesize
    yield { type: "synthesis_start" };
    const { content: synthesis } = await synthesize(query, results);
    yield {
      type: "synthesis_done",
      content: synthesis,
      totalDurationMs: Date.now() - totalStart,
    };
  } catch (err: any) {
    yield { type: "error", message: err.message ?? "Unknown error" };
  }
}
