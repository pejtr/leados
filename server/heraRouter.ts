/**
 * HERA Router — tRPC procedures for the Marketing AI Orchestrator
 * (HERMES = tech agents, HERA = marketing coach personas)
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { hermesSessions, hermesMessages, hermesMissions } from "../drizzle/schema";
import { eq, desc, and, like } from "drizzle-orm";
import {
  heraChat,
  generateHeraDailyBrief,
  getHeraCoaches,
  HERA_COACHES,
  HERA_MISSION_TEMPLATES,
  executeHeraMission,
  heraPanel,
} from "./heraAgent";
import { buildPlatformContext } from "./hermesRouter";

export const heraRouter = router({
  // ── Identity: HERA + her coach roster (no system prompts leaked) ────────────
  getIdentity: protectedProcedure.query(() => ({
    name: "HERA",
    role: "Marketing AI Orchestrator",
    description:
      "HERA orchestruje marketingové AI kouče. Klasifikuje záměr zprávy a směruje ji na nejvhodnějšího kouče s živými daty platformy.",
    intents: Object.keys(HERA_COACHES),
    coaches: getHeraCoaches().map((p) => ({
      id: p.id,
      name: p.name,
      title: p.title,
      specialty: p.specialty,
      emoji: p.emoji,
      color: p.color,
      tags: p.tags,
      category: p.category,
      tier: p.tier ?? "free",
    })),
    missionTemplates: HERA_MISSION_TEMPLATES.map((m) => ({
      type: m.type,
      title: m.title,
      description: m.description,
      emoji: m.emoji,
      estimatedMinutes: m.estimatedMinutes,
      stepCount: m.steps.length,
      coaches: Array.from(new Set(m.steps.map((s) => s.coach))),
    })),
  })),

  // ── Chat: classify marketing intent → route to coach → persist ──────────────
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4000),
        conversationHistory: z
          .array(z.object({ role: z.string(), content: z.string() }))
          .default([]),
        compactMode: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const platformContext = await buildPlatformContext(ctx.user.id);

      const result = await heraChat({
        userMessage: input.message,
        conversationHistory: input.conversationHistory,
        platformContext,
        compactMode: input.compactMode,
      });

      // Persist into shared HERMES session tables (intent "hera"), best-effort
      try {
        const db = await getDb();
        if (db) {
          const existing = await db
            .select()
            .from(hermesSessions)
            .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "hera")))
            .orderBy(desc(hermesSessions.lastActivity))
            .limit(1);

          let sessionId: number;
          if (existing[0]) {
            sessionId = existing[0].id;
          } else {
            await db.insert(hermesSessions).values({
              userId: ctx.user.id,
              sessionName: "HERA — marketingoví kouči",
              intent: "hera",
              status: "active",
              messageCount: 0,
              subAgentsUsed: [],
              lastActivity: Date.now(),
              createdAt: Date.now(),
            });
            const created = await db
              .select()
              .from(hermesSessions)
              .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "hera")))
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
              role: "hera",
              agentName: `hera:${result.coachId}`,
              content: result.content,
              metadata: {
                orchestrator: "hera",
                intent: result.intent,
                coachId: result.coachId,
                routingDecision: result.routingDecision,
              },
              createdAt: Date.now() + 1,
            }),
          ]);

          await db
            .update(hermesSessions)
            .set({
              messageCount: (existing[0]?.messageCount ?? 0) + 1,
              subAgentsUsed: [result.coachId],
              lastActivity: Date.now(),
            })
            .where(eq(hermesSessions.id, sessionId));
        }
      } catch {
        // Non-fatal: persistence failure must not break the chat
      }

      return {
        content: result.content,
        role: "assistant" as const,
        intent: result.intent,
        coachId: result.coachId,
        routingDecision: result.routingDecision,
        activeCoach: result.activeCoach,
      };
    }),

  // ── Missions: multi-step marketing playbooks (parity with HERMES) ───────────
  executeMission: protectedProcedure
    .input(
      z.object({
        missionType: z.string(),
        customContext: z.string().max(4000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const template = HERA_MISSION_TEMPLATES.find((m) => m.type === input.missionType);
      if (!template) throw new Error("Unknown HERA mission type");

      const platformContext = await buildPlatformContext(ctx.user.id);

      // Persist mission start (best-effort)
      const db = await getDb();
      let missionId: number | null = null;
      try {
        if (db) {
          await db.insert(hermesMissions).values({
            userId: ctx.user.id,
            missionType: template.type,
            title: `HERA: ${template.title}`,
            status: "running",
            plan: template.steps.map((s) => ({ step: s.step, agent: `hera:${s.coach}`, status: "pending" })),
            subAgentsInvolved: Array.from(new Set(template.steps.map((s) => s.coach))),
          });
          const created = await db
            .select()
            .from(hermesMissions)
            .where(and(eq(hermesMissions.userId, ctx.user.id), eq(hermesMissions.missionType, template.type)))
            .orderBy(desc(hermesMissions.id))
            .limit(1);
          missionId = created[0]?.id ?? null;
        }
      } catch {
        // persistence is non-fatal
      }

      const result = await executeHeraMission({
        missionType: input.missionType,
        platformContext,
        customContext: input.customContext,
      });

      try {
        if (db && missionId) {
          await db
            .update(hermesMissions)
            .set({
              status: "completed",
              plan: result.stepResults.map((r) => ({ step: r.step, agent: `hera:${r.coach}`, status: "completed" })),
              result: {
                synthesis: result.synthesis,
                keyInsights: result.keyInsights,
                nextActions: result.nextActions,
                stepResults: result.stepResults,
                totalDuration: result.totalDuration,
              },
            })
            .where(eq(hermesMissions.id, missionId));
        }
      } catch {
        // persistence is non-fatal
      }

      return result;
    }),

  listMissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(hermesMissions)
      .where(and(eq(hermesMissions.userId, ctx.user.id), like(hermesMissions.missionType, "hera_%")))
      .orderBy(desc(hermesMissions.id))
      .limit(20);
  }),

  // ── Panel: multi-coach perspectives + HERA synthesis (mastermind parity) ────
  panel: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(4000),
        coachIds: z.array(z.string()).min(1).max(5),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const platformContext = await buildPlatformContext(ctx.user.id);
      return heraPanel({ message: input.message, coachIds: input.coachIds, platformContext });
    }),

  // ── Sessions: HERA conversation history (shared hermes tables, intent "hera") ─
  sessions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(hermesSessions)
      .where(and(eq(hermesSessions.userId, ctx.user.id), eq(hermesSessions.intent, "hera")))
      .orderBy(desc(hermesSessions.lastActivity))
      .limit(20);
  }),

  getMessages: protectedProcedure
    .input(z.object({ sessionId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(hermesMessages)
        .where(and(eq(hermesMessages.sessionId, input.sessionId), eq(hermesMessages.userId, ctx.user.id)))
        .orderBy(hermesMessages.createdAt)
        .limit(100);
    }),

  // ── Autonomy: daily marketing action brief (scheduler-callable) ─────────────
  dailyBrief: protectedProcedure.mutation(async ({ ctx }) => {
    const platformContext = await buildPlatformContext(ctx.user.id);
    const brief = await generateHeraDailyBrief(platformContext);
    return { brief, generatedAt: Date.now() };
  }),
});
