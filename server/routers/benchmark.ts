/**
 * Agent Benchmark Router — ARC-AGI inspired evaluation framework for LeadOS agents
 *
 * Inspired by ARC-AGI-3 principles:
 * - Novel environments (fresh test cases, no memorization)
 * - Skill-acquisition efficiency (how fast agent adapts)
 * - Long-horizon planning with sparse feedback
 * - Experience-driven adaptation
 *
 * LeadOS adapts these to B2B sales intelligence tasks:
 * - Lead qualification accuracy
 * - Icebreaker quality & personalization
 * - ICP matching precision
 * - Multi-signal reasoning
 * - Adversarial robustness (noisy/incomplete data)
 */

import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getConstitutionContext } from "./constitution";

// ── Test Case Definitions ─────────────────────────────────────────────────────

export const BENCHMARK_TASKS = [
  // TIER 1 — Lead Qualification
  {
    id: "lq-001",
    tier: 1,
    category: "Lead Qualification",
    name: "ICP Fit Detection",
    description: "Given a lead profile, determine if they match the Ideal Customer Profile.",
    difficulty: "easy",
    input: {
      lead: {
        name: "Martin Kovář",
        title: "Head of Operations",
        company: "LogiFlow s.r.o.",
        industry: "Logistics",
        employees: 85,
        revenue: "€2.1M",
        techStack: ["SAP", "Excel", "Slack"],
        signals: ["Visited competitor website", "Posted about 'scaling challenges'"],
        location: "Brno, CZ",
      },
      icp: {
        targetTitles: ["CEO", "COO", "Head of Operations", "VP Sales"],
        targetIndustries: ["Logistics", "Manufacturing", "Supply Chain"],
        targetSize: "50-500 employees",
        targetRevenue: "€1M-€20M",
        painPoints: ["Manual processes", "Scaling challenges", "Lead generation"],
      },
    },
    expectedOutput: {
      isIcpMatch: true,
      fitScore: { min: 75, max: 100 },
      keySignals: ["Head of Operations title", "Logistics industry", "Scaling challenges signal"],
    },
    scoringCriteria: [
      { criterion: "Correct ICP match decision", weight: 40 },
      { criterion: "Fit score in expected range (75-100)", weight: 25 },
      { criterion: "Identified at least 2 key signals", weight: 20 },
      { criterion: "Reasoning is specific and actionable", weight: 15 },
    ],
  },
  {
    id: "lq-002",
    tier: 1,
    category: "Lead Qualification",
    name: "False Positive Rejection",
    description: "Correctly reject a lead that superficially looks like ICP but isn't.",
    difficulty: "medium",
    input: {
      lead: {
        name: "Jana Procházková",
        title: "Sales Manager",
        company: "MegaCorp International",
        industry: "Retail",
        employees: 12000,
        revenue: "€890M",
        techStack: ["Salesforce", "SAP", "Oracle"],
        signals: ["Downloaded whitepaper", "LinkedIn active"],
        location: "Prague, CZ",
      },
      icp: {
        targetTitles: ["CEO", "COO", "Head of Sales"],
        targetIndustries: ["SaaS", "Tech", "B2B Services"],
        targetSize: "10-200 employees",
        targetRevenue: "€500K-€10M",
        painPoints: ["No CRM", "Manual outreach", "Small team scaling"],
      },
    },
    expectedOutput: {
      isIcpMatch: false,
      fitScore: { min: 0, max: 35 },
      rejectionReasons: ["Wrong industry (Retail vs SaaS/Tech)", "Too large (12000 vs 10-200)", "Too high revenue"],
    },
    scoringCriteria: [
      { criterion: "Correctly rejects the lead", weight: 40 },
      { criterion: "Fit score below 35", weight: 25 },
      { criterion: "Identifies at least 2 disqualifying factors", weight: 25 },
      { criterion: "Does not hallucinate positive signals", weight: 10 },
    ],
  },

  // TIER 2 — Icebreaker Generation
  {
    id: "ib-001",
    tier: 2,
    category: "Icebreaker Quality",
    name: "Signal-Based Personalization",
    description: "Generate a personalized icebreaker that references specific buying signals.",
    difficulty: "medium",
    input: {
      lead: {
        name: "Tomáš Blaha",
        title: "CEO",
        company: "TechStart Praha s.r.o.",
        industry: "SaaS",
        employees: 23,
        signals: [
          "Posted on LinkedIn: 'We just closed Series A, time to scale sales'",
          "Visited /pricing page 4 times in 7 days",
          "Downloaded 'B2B Outreach Playbook' PDF",
        ],
      },
      product: "LeadOS — AI-powered B2B lead generation and outreach automation",
    },
    scoringCriteria: [
      { criterion: "References at least 1 specific signal (Series A, pricing visits, or PDF download)", weight: 35 },
      { criterion: "Mentions the lead's name and company", weight: 15 },
      { criterion: "Clear value proposition in 1-2 sentences", weight: 25 },
      { criterion: "Ends with a specific, low-friction CTA", weight: 15 },
      { criterion: "Under 80 words total", weight: 10 },
    ],
  },
  {
    id: "ib-002",
    tier: 2,
    category: "Icebreaker Quality",
    name: "Adversarial — Sparse Data",
    description: "Generate a quality icebreaker with minimal available data (no signals, basic info only).",
    difficulty: "hard",
    input: {
      lead: {
        name: "Pavel Novotný",
        title: "Director",
        company: "Novotný & Partners",
        industry: "Consulting",
        employees: 8,
        signals: [],
      },
      product: "LeadOS — AI-powered B2B lead generation",
    },
    scoringCriteria: [
      { criterion: "Does NOT fabricate signals or fake personalization", weight: 40 },
      { criterion: "Uses industry/role context creatively", weight: 25 },
      { criterion: "Remains specific and non-generic", weight: 20 },
      { criterion: "Appropriate tone for consulting industry", weight: 15 },
    ],
  },

  // TIER 3 — Multi-Signal Reasoning
  {
    id: "ms-001",
    tier: 3,
    category: "Multi-Signal Reasoning",
    name: "Intent Score Synthesis",
    description: "Synthesize multiple weak signals into a coherent buying intent score with reasoning.",
    difficulty: "hard",
    input: {
      lead: {
        name: "Eva Horáčková",
        company: "DataFlow CZ",
        industry: "Analytics",
        employees: 45,
      },
      signals: [
        { type: "web", event: "Visited /pricing page", timestamp: "2 days ago", weight: "medium" },
        { type: "web", event: "Visited /case-studies page", timestamp: "2 days ago", weight: "low" },
        { type: "linkedin", event: "Liked post about 'AI in sales'", timestamp: "5 days ago", weight: "low" },
        { type: "email", event: "Opened email sequence 3/5", timestamp: "1 day ago", weight: "medium" },
        { type: "linkedin", event: "Connected with 2 LeadOS team members", timestamp: "3 days ago", weight: "high" },
        { type: "web", event: "Spent 8 minutes on /features page", timestamp: "1 day ago", weight: "medium" },
      ],
    },
    expectedOutput: {
      intentScore: { min: 70, max: 95 },
      urgencyLevel: "high",
      recommendedAction: "immediate outreach",
    },
    scoringCriteria: [
      { criterion: "Intent score in 70-95 range", weight: 30 },
      { criterion: "Correctly identifies high urgency", weight: 25 },
      { criterion: "Explains signal synthesis logic clearly", weight: 25 },
      { criterion: "Recommends immediate/priority action", weight: 20 },
    ],
  },

  // TIER 4 — Adversarial Robustness
  {
    id: "ar-001",
    tier: 4,
    category: "Adversarial Robustness",
    name: "Contradictory Data Handling",
    description: "Handle contradictory signals without hallucinating or ignoring conflicts.",
    difficulty: "expert",
    input: {
      lead: {
        name: "Michal Šimánek",
        title: "CTO",
        company: "FinTech Brno",
        industry: "FinTech",
        employees: 120,
      },
      signals: [
        { event: "Visited /pricing 6 times", sentiment: "positive" },
        { event: "Submitted cancellation request for trial", sentiment: "negative" },
        { event: "Opened 5 emails in 3 days", sentiment: "positive" },
        { event: "Left negative review on G2: 'too expensive'", sentiment: "negative" },
        { event: "Shared LeadOS blog post on LinkedIn", sentiment: "positive" },
      ],
    },
    scoringCriteria: [
      { criterion: "Acknowledges the contradiction explicitly", weight: 30 },
      { criterion: "Does not force a single narrative", weight: 25 },
      { criterion: "Suggests a clarification strategy", weight: 25 },
      { criterion: "Provides nuanced recommendation (not binary)", weight: 20 },
    ],
  },
];

// ── Scoring Engine ────────────────────────────────────────────────────────────

async function scoreAgentResponse(
  task: typeof BENCHMARK_TASKS[0],
  agentResponse: string,
  constitutionContext: string
): Promise<{ score: number; breakdown: Record<string, number>; feedback: string; passed: boolean }> {
  const scoringPrompt = `You are an expert AI agent evaluator using ARC-AGI inspired scoring methodology.

Task: "${task.name}" (${task.category}, Difficulty: ${task.difficulty})
Description: ${task.description}

Input given to agent:
${JSON.stringify(task.input, null, 2)}

Agent's response:
${agentResponse}

Scoring criteria (evaluate each 0-100%):
${task.scoringCriteria.map((c, i) => `${i + 1}. [Weight: ${c.weight}%] ${c.criterion}`).join("\n")}

${task.expectedOutput ? `Expected output characteristics:\n${JSON.stringify(task.expectedOutput, null, 2)}` : ""}

Evaluate the agent's response against each criterion. Return a JSON object with:
{
  "breakdown": { "criterion_1": <0-100>, "criterion_2": <0-100>, ... },
  "feedback": "<2-3 sentences of specific, actionable feedback>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>"]
}`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: `You are an objective AI benchmark evaluator. Score strictly and fairly. ${constitutionContext}` },
      { role: "user", content: scoringPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "benchmark_score",
        strict: true,
        schema: {
          type: "object",
          properties: {
            breakdown: {
              type: "object",
              properties: Object.fromEntries(
                task.scoringCriteria.map((_, i) => [`criterion_${i + 1}`, { type: "number" }])
              ),
              required: task.scoringCriteria.map((_, i) => `criterion_${i + 1}`),
              additionalProperties: false,
            },
            feedback: { type: "string" },
            strengths: { type: "array", items: { type: "string" } },
            weaknesses: { type: "array", items: { type: "string" } },
          },
          required: ["breakdown", "feedback", "strengths", "weaknesses"],
          additionalProperties: false,
        },
      },
    },
  });

  const parsed = JSON.parse(result.choices[0].message.content as string);

  // Weighted score calculation
  let totalScore = 0;
  const breakdown: Record<string, number> = {};
  task.scoringCriteria.forEach((criterion, i) => {
    const key = `criterion_${i + 1}`;
    const rawScore = parsed.breakdown[key] ?? 0;
    const weighted = (rawScore * criterion.weight) / 100;
    totalScore += weighted;
    breakdown[criterion.criterion] = Math.round(rawScore);
  });

  return {
    score: Math.round(totalScore),
    breakdown,
    feedback: parsed.feedback,
    passed: totalScore >= 70,
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

export const benchmarkRouter = router({
  // List all available benchmark tasks
  listTasks: protectedProcedure.query(() => {
    return BENCHMARK_TASKS.map((t) => ({
      id: t.id,
      tier: t.tier,
      category: t.category,
      name: t.name,
      description: t.description,
      difficulty: t.difficulty,
      criteriaCount: t.scoringCriteria.length,
    }));
  }),

  // Run a single benchmark task against an agent
  runTask: protectedProcedure
    .input(
      z.object({
        taskId: z.string(),
        agentId: z.enum(["strategist", "prospector", "copywriter", "analyst", "advisor", "synthesizer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = BENCHMARK_TASKS.find((t) => t.id === input.taskId);
      if (!task) throw new Error(`Task ${input.taskId} not found`);

      const constitutionContext = await getConstitutionContext(ctx.user.id);

      // Agent persona definitions
      const agentPersonas: Record<string, string> = {
        strategist: "You are the Strategic Orchestrator — expert in B2B sales strategy, ICP definition, and go-to-market planning.",
        prospector: "You are the Lead Intelligence Specialist — expert in lead qualification, scoring, and signal analysis.",
        copywriter: "You are the Outreach Copywriter — expert in personalized B2B messaging, icebreakers, and email sequences.",
        analyst: "You are the Data Analyst — expert in pattern recognition, signal synthesis, and predictive scoring.",
        advisor: "You are the Sales Advisor — expert in deal coaching, objection handling, and conversion optimization.",
        synthesizer: "You are the Master Synthesizer — integrate all perspectives into a unified, actionable recommendation.",
      };

      const persona = agentPersonas[input.agentId];

      // Run the agent
      const agentResult = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `${persona}\n\n${constitutionContext}\n\nYou are being evaluated on a benchmark task. Respond with your best analysis.`,
          },
          {
            role: "user",
            content: `Task: ${task.name}\n\nDescription: ${task.description}\n\nInput:\n${JSON.stringify(task.input, null, 2)}\n\nProvide your analysis and recommendation.`,
          },
        ],
      });

      const agentResponse = agentResult.choices[0].message.content as string;

      // Score the response
      const scoreResult = await scoreAgentResponse(task, agentResponse, constitutionContext);

      return {
        taskId: task.id,
        taskName: task.name,
        agentId: input.agentId,
        agentResponse,
        score: scoreResult.score,
        breakdown: scoreResult.breakdown,
        feedback: scoreResult.feedback,
        passed: scoreResult.passed,
        tier: task.tier,
        category: task.category,
        difficulty: task.difficulty,
        timestamp: Date.now(),
      };
    }),

  // Run full benchmark suite (all tasks, one agent)
  runFullSuite: protectedProcedure
    .input(
      z.object({
        agentId: z.enum(["strategist", "prospector", "copywriter", "analyst", "advisor", "synthesizer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const constitutionContext = await getConstitutionContext(ctx.user.id);

      const agentPersonas: Record<string, string> = {
        strategist: "You are the Strategic Orchestrator — expert in B2B sales strategy, ICP definition, and go-to-market planning.",
        prospector: "You are the Lead Intelligence Specialist — expert in lead qualification, scoring, and signal analysis.",
        copywriter: "You are the Outreach Copywriter — expert in personalized B2B messaging, icebreakers, and email sequences.",
        analyst: "You are the Data Analyst — expert in pattern recognition, signal synthesis, and predictive scoring.",
        advisor: "You are the Sales Advisor — expert in deal coaching, objection handling, and conversion optimization.",
        synthesizer: "You are the Master Synthesizer — integrate all perspectives into a unified, actionable recommendation.",
      };

      const persona = agentPersonas[input.agentId];
      const results = [];

      for (const task of BENCHMARK_TASKS) {
        const agentResult = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `${persona}\n\n${constitutionContext}\n\nYou are being evaluated on a benchmark task.`,
            },
            {
              role: "user",
              content: `Task: ${task.name}\n\nDescription: ${task.description}\n\nInput:\n${JSON.stringify(task.input, null, 2)}\n\nProvide your analysis.`,
            },
          ],
        });

        const agentResponse = agentResult.choices[0].message.content as string;
        const scoreResult = await scoreAgentResponse(task, agentResponse, constitutionContext);

        results.push({
          taskId: task.id,
          taskName: task.name,
          category: task.category,
          difficulty: task.difficulty,
          tier: task.tier,
          score: scoreResult.score,
          passed: scoreResult.passed,
          feedback: scoreResult.feedback,
        });
      }

      const totalScore = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);
      const passRate = Math.round((results.filter((r) => r.passed).length / results.length) * 100);

      // ARC-AGI style tier breakdown
      const tierBreakdown = [1, 2, 3, 4].map((tier) => {
        const tierResults = results.filter((r) => r.tier === tier);
        return {
          tier,
          avgScore: tierResults.length
            ? Math.round(tierResults.reduce((s, r) => s + r.score, 0) / tierResults.length)
            : 0,
          passed: tierResults.filter((r) => r.passed).length,
          total: tierResults.length,
        };
      });

      return {
        agentId: input.agentId,
        totalScore,
        passRate,
        results,
        tierBreakdown,
        arcAgiEquivalent: Math.round(totalScore * 0.85), // Normalized to ARC-AGI scale
        timestamp: Date.now(),
      };
    }),
});
