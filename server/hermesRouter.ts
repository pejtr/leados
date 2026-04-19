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

async function buildPlatformContext(userId: number): Promise<string> {
  try {
    const stats = await getLeadStats(userId);
    return `User ID: ${userId}
Live platform stats:
- Total leads: ${stats.totalLeads} | Enriched: ${stats.enrichedLeads} | Sessions: ${stats.totalSessions}
- Pipeline: ${stats.statusBreakdown?.map((s: any) => `${s.status}(${s.count})`).join(", ") || "empty"}
- Top industries: ${stats.industryBreakdown?.slice(0, 3).map((i: any) => `${i.industry}(${i.count})`).join(", ") || "none"}
- Revenue: $${stats.roiStats?.totalRevenue?.toFixed(0) ?? 0} from ${stats.roiStats?.closedDeals ?? 0} closed deals
- Close rate: ${stats.roiStats?.closeRate?.toFixed(1) ?? 0}%
- Quality: ${stats.qualityBreakdown?.good ?? 0} good / ${stats.qualityBreakdown?.bad ?? 0} bad / ${stats.qualityBreakdown?.unrated ?? 0} unrated`;
  } catch {
    return `User ID: ${userId}\nPlatform stats unavailable.`;
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
});
