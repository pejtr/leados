/**
 * HERA Router — tRPC procedures for the Marketing AI Orchestrator
 * (HERMES = tech agents, HERA = marketing coach personas)
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { hermesSessions, hermesMessages } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { heraChat, generateHeraDailyBrief, getHeraCoaches, HERA_COACHES } from "./heraAgent";
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

  // ── Autonomy: daily marketing action brief (scheduler-callable) ─────────────
  dailyBrief: protectedProcedure.mutation(async ({ ctx }) => {
    const platformContext = await buildPlatformContext(ctx.user.id);
    const brief = await generateHeraDailyBrief(platformContext);
    return { brief, generatedAt: Date.now() };
  }),
});
