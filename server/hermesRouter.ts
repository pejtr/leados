/**
 * HERMES Router — tRPC procedures for the Core AI Orchestration Agent
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { hermesSessions, hermesMessages, hermesMissions } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import {
  hermesChat,
  executeMission,
  MISSION_TEMPLATES,
  SUB_AGENT_PERSONAS,
  HERMES_SYSTEM_PROMPT,
} from "./hermesAgent";
import { getLeadStats } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function fetchDsrAnalytics(): Promise<string> {
  try {
    const apiKey = process.env.DEEP_SLEEP_RESET_API_KEY;
    if (!apiKey) return "";
    const res = await fetch("https://deep-sleep-reset.com/api/v1/analytics", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return "";
    const data = await res.json() as any;
    const k = data.kpis ?? data;
    return `\n## Projekt: DeepSleepReset (live data)
- Celkové tržby: $${parseFloat(k.totalRevenueUsd ?? 0).toFixed(2)}
- Dnes: $${parseFloat(k.todayRevenueUsd ?? 0).toFixed(2)} | Posledních 7 dní: $${parseFloat(k.last7DaysRevenueUsd ?? 0).toFixed(2)} | 30 dní: $${parseFloat(k.last30DaysRevenueUsd ?? 0).toFixed(2)}
- Objednávky celkem: ${k.totalOrders ?? 0} | Průměrná hodnota: $${parseFloat(k.avgOrderValueUsd ?? 0).toFixed(2)}
- Leady: ${k.totalLeads ?? 0} celkem | Konverzní poměr: ${parseFloat(k.conversionRatePct ?? 0).toFixed(1)}%
- Stav webu: ${k.healthStatus ?? 'unknown'}`;
  } catch {
    return "";
  }
}

async function buildPlatformContext(userId: number): Promise<string> {
  try {
    const [stats, dsrContext] = await Promise.all([
      getLeadStats(userId),
      fetchDsrAnalytics(),
    ]);
    return `User ID: ${userId}
## LeadOS — Live statistiky platformy
- Celkem leadů: ${stats.totalLeads} | Obohaceno: ${stats.enrichedLeads} | Sezení: ${stats.totalSessions}
- Pipeline: ${stats.statusBreakdown?.map((s: any) => `${s.status}(${s.count})`).join(", ") || "prázdná"}
- Top odvětví: ${stats.industryBreakdown?.slice(0, 3).map((i: any) => `${i.industry}(${i.count})`).join(", ") || "žádná"}
- Tržby: $${stats.roiStats?.totalRevenue?.toFixed(0) ?? 0} z ${stats.roiStats?.closedDeals ?? 0} uzavřených dealů
- Míra uzavření: ${stats.roiStats?.closeRate?.toFixed(1) ?? 0}%
- Kvalita: ${stats.qualityBreakdown?.good ?? 0} dobrých / ${stats.qualityBreakdown?.bad ?? 0} špatných / ${stats.qualityBreakdown?.unrated ?? 0} nehodnocených${dsrContext}`;
  } catch {
    return `User ID: ${userId}\nStatistiky platformy nejsou dostupné.`;
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────

export const hermesRouter = router({
  // ── Get HERMES identity and capabilities ──────────────────────────────────
  getIdentity: protectedProcedure.query(async () => {
    return {
      name: "HERMES",
      fullName: "Hierarchical Execution & Routing Meta-Intelligence Engine System",
      version: "1.0.0",
      description: "Core AI Orchestration Agent — routes tasks, synthesizes sub-agents, executes autonomous missions",
      subAgents: Object.entries(SUB_AGENT_PERSONAS).map(([id, agent]) => ({
        id,
        name: agent.name,
        emoji: agent.emoji,
        color: agent.color,
      })),
      missionTemplates: MISSION_TEMPLATES.map((m) => ({
        type: m.type,
        title: m.title,
        description: m.description,
        emoji: m.emoji,
        estimatedMinutes: m.estimatedMinutes,
        stepCount: m.steps.length,
      })),
    };
  }),

  // ── Create or get active session ──────────────────────────────────────────
  getOrCreateSession: protectedProcedure
    .input(z.object({ sessionId: z.number().int().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      if (input.sessionId) {
        const rows = await db
          .select()
          .from(hermesSessions)
          .where(and(eq(hermesSessions.id, input.sessionId), eq(hermesSessions.userId, ctx.user.id)))
          .limit(1);
        if (rows[0]) return rows[0];
      }

      // Create new session
      await db.insert(hermesSessions).values({
        userId: ctx.user.id,
        sessionName: `Session ${new Date().toLocaleDateString("cs-CZ")}`,
        intent: "general",
        status: "active",
        messageCount: 0,
        subAgentsUsed: [],
        lastActivity: Date.now(),
        createdAt: Date.now(),
      });

      const sessions = await db
        .select()
        .from(hermesSessions)
        .where(eq(hermesSessions.userId, ctx.user.id))
        .orderBy(desc(hermesSessions.createdAt))
        .limit(1);

      return sessions[0];
    }),

  // ── List sessions ─────────────────────────────────────────────────────────
  listSessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(hermesSessions)
      .where(eq(hermesSessions.userId, ctx.user.id))
      .orderBy(desc(hermesSessions.lastActivity))
      .limit(20);
  }),

  // ── Get messages for a session ────────────────────────────────────────────
  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(hermesMessages)
        .where(
          and(
            eq(hermesMessages.sessionId, input.sessionId),
            eq(hermesMessages.userId, ctx.user.id)
          )
        )
        .orderBy(hermesMessages.createdAt)
        .limit(100);
    }),

  // ── Send message to HERMES ────────────────────────────────────────────────
  sendMessage: protectedProcedure
    .input(
      z.object({
        sessionId: z.number().int(),
        message: z.string().min(1).max(4000),
        conversationHistory: z
          .array(z.object({ role: z.string(), content: z.string() }))
          .default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const platformContext = await buildPlatformContext(ctx.user.id);

      // Save user message
      await db.insert(hermesMessages).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        role: "user",
        content: input.message,
        createdAt: Date.now(),
      });

      // Run HERMES
      const result = await hermesChat({
        userMessage: input.message,
        conversationHistory: input.conversationHistory,
        platformContext,
        userId: ctx.user.id,
      });

      // Save HERMES response
      await db.insert(hermesMessages).values({
        sessionId: input.sessionId,
        userId: ctx.user.id,
        role: "hermes",
        agentName: result.agentsUsed.join(", "),
        content: result.content,
        metadata: {
          intent: result.intent,
          agentsUsed: result.agentsUsed,
          routingDecision: result.routingDecision,
        },
        createdAt: Date.now(),
      });

      // Update session
      await db
        .update(hermesSessions)
        .set({
          intent: result.intent,
          messageCount: input.conversationHistory.length / 2 + 1,
          subAgentsUsed: result.agentsUsed,
          lastActivity: Date.now(),
        })
        .where(eq(hermesSessions.id, input.sessionId));

      return {
        content: result.content,
        intent: result.intent,
        agentsUsed: result.agentsUsed,
        routingDecision: result.routingDecision,
        suggestedMission: result.suggestedMission,
      };
    }),

  // ── Execute a mission ─────────────────────────────────────────────────────
  executeMission: protectedProcedure
    .input(
      z.object({
        missionType: z.string(),
        sessionId: z.number().int().optional(),
        customContext: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const platformContext = await buildPlatformContext(ctx.user.id);

      // Create mission record
      const template = MISSION_TEMPLATES.find((m) => m.type === input.missionType);
      if (!template) throw new Error(`Unknown mission type: ${input.missionType}`);

      await db.insert(hermesMissions).values({
        userId: ctx.user.id,
        sessionId: input.sessionId ?? null,
        missionType: input.missionType,
        title: template.title,
        status: "running",
        plan: template.steps.map((s) => ({ step: s.step, agent: s.agent, status: "pending" })),
        subAgentsInvolved: template.steps.map((s) => s.agent),
        startedAt: Date.now(),
        createdAt: Date.now(),
      });

      const missions = await db
        .select()
        .from(hermesMissions)
        .where(eq(hermesMissions.userId, ctx.user.id))
        .orderBy(desc(hermesMissions.createdAt))
        .limit(1);
      const missionId = missions[0]?.id;

      try {
        // Execute mission
        const result = await executeMission({
          missionType: input.missionType,
          platformContext,
          userId: ctx.user.id,
          customContext: input.customContext,
        });

        // Update mission record
        if (missionId) {
          await db
            .update(hermesMissions)
            .set({
              status: "completed",
              result: {
                synthesis: result.synthesis,
                keyInsights: result.keyInsights,
                nextActions: result.nextActions,
                totalDuration: result.totalDuration,
              },
              plan: result.steps.map((s) => ({ step: s.step, agent: s.agent, status: "completed" })),
              completedAt: Date.now(),
            })
            .where(eq(hermesMissions.id, missionId));
        }

        // Save mission result as HERMES message in session
        if (input.sessionId) {
          const summaryContent = `## ✅ Mission Complete: ${result.title}

**Duration:** ${(result.totalDuration / 1000).toFixed(1)}s | **Steps:** ${result.steps.length}

### Executive Summary
${result.synthesis}

### Key Insights
${result.keyInsights.map((i, n) => `${n + 1}. ${i}`).join("\n")}

### Next Actions
${result.nextActions.map((a, n) => `${n + 1}. ${a}`).join("\n")}`;

          await db.insert(hermesMessages).values({
            sessionId: input.sessionId,
            userId: ctx.user.id,
            role: "hermes",
            agentName: "HERMES Mission Control",
            content: summaryContent,
            metadata: {
              missionType: input.missionType,
              missionId,
              stepCount: result.steps.length,
            },
            createdAt: Date.now(),
          });
        }

        return { ...result, missionId };
      } catch (err) {
        if (missionId) {
          await db
            .update(hermesMissions)
            .set({ status: "failed", completedAt: Date.now() })
            .where(eq(hermesMissions.id, missionId));
        }
        throw err;
      }
    }),

  // ── Get mission history ───────────────────────────────────────────────────
  getMissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(hermesMissions)
      .where(eq(hermesMissions.userId, ctx.user.id))
      .orderBy(desc(hermesMissions.createdAt))
      .limit(20);
  }),

  // ── HERMES-powered AI Chat (drop-in replacement for aiChat.sendMessage) ────
  aiChat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4000),
        personaId: z.string().optional(), // kept for UI compat, HERMES overrides
        conversationHistory: z
          .array(z.object({ role: z.string(), content: z.string() }))
          .default([]),
        hermesMode: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const platformContext = await buildPlatformContext(ctx.user.id);

      if (!input.hermesMode) {
        // Fallback: direct LLM without HERMES routing
        const { invokeLLM } = await import("./_core/llm");
        const { getPersonaById, DEFAULT_PERSONA_ID } = await import("./aiPersonas");
        const persona = getPersonaById(input.personaId ?? DEFAULT_PERSONA_ID);
        const systemPrompt = persona
          ? persona.systemPrompt(platformContext)
          : `You are an autonomous AI sales assistant.\n${platformContext}`;
        const messages: any[] = [
          { role: "system", content: systemPrompt },
          ...input.conversationHistory.slice(-10),
          { role: "user", content: input.message },
        ];
        const response = await invokeLLM({ messages });
        const content = response.choices[0].message.content ?? "No response.";
        return {
          content,
          role: "assistant" as const,
          hermesMode: false,
          intent: "general",
          agentsUsed: [] as string[],
          routingDecision: "Direct LLM (HERMES mode off)",
          activeAgent: null as null | { name: string; emoji: string; color: string },
          stats: { totalLeads: 0, closedDeals: 0, revenue: 0 },
        };
      }

      // HERMES orchestration path
      const result = await hermesChat({
        userMessage: input.message,
        conversationHistory: input.conversationHistory,
        platformContext,
        userId: ctx.user.id,
      });

      // Resolve active sub-agent info for UI
      const primaryAgent = result.agentsUsed[0];
      const agentInfo = primaryAgent ? SUB_AGENT_PERSONAS[primaryAgent] : null;

      // Persist to HERMES messages (best-effort, no session required)
      try {
        const db = await getDb();
        if (db) {
          // Find or create a "widget" session for this user
          const existing = await db
            .select()
            .from(hermesSessions)
            .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "widget")))
            .orderBy(desc(hermesSessions.lastActivity))
            .limit(1);

          let sessionId: number;
          if (existing[0]) {
            sessionId = existing[0].id;
          } else {
            await db.insert(hermesSessions).values({
              userId: ctx.user.id,
              sessionName: "AI Chat Widget",
              intent: "widget",
              status: "active",
              messageCount: 0,
              subAgentsUsed: [],
              lastActivity: Date.now(),
              createdAt: Date.now(),
            });
            const created = await db
              .select()
              .from(hermesSessions)
              .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "widget")))
              .orderBy(desc(hermesSessions.createdAt))
              .limit(1);
            sessionId = created[0].id;
          }

          await Promise.all([
            db.insert(hermesMessages).values({
              sessionId,
              userId: ctx.user.id,
              role: "user",
              content: input.message,
              createdAt: Date.now(),
            }),
            db.insert(hermesMessages).values({
              sessionId,
              userId: ctx.user.id,
              role: "hermes",
              agentName: agentInfo?.name ?? "HERMES",
              content: result.content,
              metadata: {
                intent: result.intent,
                agentsUsed: result.agentsUsed,
                routingDecision: result.routingDecision,
              },
              createdAt: Date.now() + 1,
            }),
          ]);

          await db
            .update(hermesSessions)
            .set({
              intent: result.intent === "widget" ? "widget" : result.intent,
              messageCount: (existing[0]?.messageCount ?? 0) + 1,
              subAgentsUsed: result.agentsUsed,
              lastActivity: Date.now(),
            })
            .where(eq(hermesSessions.id, sessionId));
        }
      } catch {
        // Non-fatal: message persistence failure should not break the chat
      }

      return {
        content: result.content,
        role: "assistant" as const,
        hermesMode: true,
        intent: result.intent,
        agentsUsed: result.agentsUsed,
        routingDecision: result.routingDecision,
        activeAgent: agentInfo
          ? { name: agentInfo.name, emoji: agentInfo.emoji, color: agentInfo.color }
          : null,
        stats: { totalLeads: 0, closedDeals: 0, revenue: 0 },
      };
    }),

  // ── Get HERMES platform status ────────────────────────────────────────────
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;

    const [sessions, missions] = await Promise.all([
      db
        .select()
        .from(hermesSessions)
        .where(eq(hermesSessions.userId, ctx.user.id))
        .orderBy(desc(hermesSessions.lastActivity))
        .limit(5),
      db
        .select()
        .from(hermesMissions)
        .where(eq(hermesMissions.userId, ctx.user.id))
        .orderBy(desc(hermesMissions.createdAt))
        .limit(5),
    ]);

     const totalMessages = sessions.reduce((sum, s) => sum + (s.messageCount ?? 0), 0);
    const completedMissions = missions.filter((m) => m.status === "completed").length;
    return {
      totalSessions: sessions.length,
      totalMessages,
      completedMissions,
      recentSessions: sessions,
      recentMissions: missions,
      subAgentCount: Object.keys(SUB_AGENT_PERSONAS).length,
      missionTemplateCount: MISSION_TEMPLATES.length,
    };
  }),

  /** Manually trigger a HERMES Daily Digest (admin/testing) */
  triggerDigest: protectedProcedure.mutation(async () => {
    const { sendDailyDigest } = await import("./hermesDigest");
    await sendDailyDigest();
    return { ok: true, message: "Digest vygenerován a odeslán." };
  }),

  /** HERMES Mastermind — multi-expert virtual board chat */
  mastermindChat: protectedProcedure
    .input(z.object({
      message: z.string().min(1).max(4000),
      expertIds: z.array(z.string()).min(1).max(8),
      conversationHistory: z.array(z.object({ role: z.string(), content: z.string() })).default([]),
      userContext: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { invokeLLM } = await import("./_core/llm");
      const { buildMastermindPrompt } = await import("../shared/hermesMastermind");
      const systemPrompt = buildMastermindPrompt(input.expertIds, input.userContext);
      const messages: any[] = [
        { role: "system", content: systemPrompt },
        ...input.conversationHistory.slice(-10),
        { role: "user", content: input.message },
      ];
      const response = await invokeLLM({ messages });
      const content = response.choices[0].message.content ?? "No response.";
      return { content, expertIds: input.expertIds };
    }),

  /** COMPUTER FLOW — Perplexity-style multi-brain parallel orchestration */
  computerFlow: protectedProcedure
    .input(z.object({
      query: z.string().min(1).max(4000),
      domain: z.string().optional().default("general"),
      maxSubTasks: z.number().min(2).max(5).optional().default(4),
      enableDeepThink: z.boolean().optional().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const { runComputerFlow } = await import("./computerFlow");
      const platformContext = await buildPlatformContext(ctx.user.id);
      const result = await runComputerFlow({
        query: input.query,
        context: platformContext,
        domain: input.domain,
        maxSubTasks: input.maxSubTasks,
        enableDeepThink: input.enableDeepThink,
      });
      return result;
    }),

  /** COMPUTER FLOW — get brain layer configs for UI */
  getComputerFlowConfig: protectedProcedure.query(async () => {
    const { BRAIN_CONFIGS_PUBLIC } = await import("./computerFlow");
    return BRAIN_CONFIGS_PUBLIC;
  }),

  /** Get digest history from hermes_messages (role: hermes, type: daily_digest) */
  getDigestHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    // Find the digest session for this user
    const digestSessions = await db
      .select()
      .from(hermesSessions)
      .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "daily_digest")))
      .orderBy(desc(hermesSessions.createdAt))
      .limit(1);
    if (!digestSessions.length) return [];
    const messages = await db
      .select()
      .from(hermesMessages)
      .where(eq(hermesMessages.sessionId, digestSessions[0].id))
      .orderBy(desc(hermesMessages.createdAt))
      .limit(30);
    return messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      metadata: m.metadata ? JSON.parse(m.metadata as string) : null,
    }));
  }),
});
