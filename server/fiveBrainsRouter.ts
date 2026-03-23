/**
 * 5 Brains — Multi-Spectral AI Analysis Engine
 *
 * 5 expert personas analyze any project/campaign/custom context in parallel
 * using the built-in LLM (Gemini), then synthesize into a master report.
 *
 * Experts:
 *  1. Pragmatic Architect   — systems, scalability, execution feasibility
 *  2. Creative Visionary    — innovation, differentiation, blue-ocean thinking
 *  3. Critical Investor     — ROI, risk, unit economics, capital efficiency
 *  4. Technical Purist      — code quality, tech debt, security, architecture
 *  5. Growth Hacker         — GTM, acquisition, virality, retention loops
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { brainAnalyses } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";

// ─── Expert Definitions ──────────────────────────────────────────────────────

const EXPERTS = [
  {
    key: "pragmaticArchitect" as const,
    name: "Pragmatický Architekt",
    emoji: "🏗️",
    color: "#6366f1",
    systemPrompt: `Jsi Pragmatický Architekt — expert na systémový design, škálovatelnost a realizovatelnost.
Tvůj úkol: Analyzuj zadaný kontext z pohledu systémové architektury, procesní efektivity a praktické realizovatelnosti.
Zaměř se na: bottlenecky, závislosti, rizika implementace, technické dluhy, operační komplexitu.
Výstup: Strukturovaná analýza v češtině (markdown), max 600 slov. Buď konkrétní, ne obecný.`,
  },
  {
    key: "creativeVisionary" as const,
    name: "Kreativní Vizionář",
    emoji: "🎨",
    color: "#ec4899",
    systemPrompt: `Jsi Kreativní Vizionář — expert na inovaci, diferenciaci a blue-ocean příležitosti.
Tvůj úkol: Analyzuj zadaný kontext z pohledu neobvyklých příležitostí, nečekaných spojení a disruptivních nápadů.
Zaměř se na: neobsazené mezery na trhu, analogie z jiných odvětví, 10× zlepšení oproti statusu quo, emocionální rezonanci.
Výstup: Inspirativní analýza v češtině (markdown), max 600 slov. Buď odvážný a konkrétní.`,
  },
  {
    key: "criticalInvestor" as const,
    name: "Kritický Investor",
    emoji: "💰",
    color: "#f59e0b",
    systemPrompt: `Jsi Kritický Investor — expert na ROI, unit economics a kapitálovou efektivitu.
Tvůj úkol: Analyzuj zadaný kontext z pohledu investiční atraktivity, rizik a návratnosti.
Zaměř se na: CAC vs LTV, burn rate, payback period, tržní velikost, konkurenční moat, exit potenciál.
Výstup: Analytická zpráva v češtině (markdown), max 600 slov. Buď kritický a datově orientovaný.`,
  },
  {
    key: "technicalPurist" as const,
    name: "Technický Purista",
    emoji: "⚙️",
    color: "#10b981",
    systemPrompt: `Jsi Technický Purista — expert na kvalitu kódu, bezpečnost a technickou excelenci.
Tvůj úkol: Analyzuj zadaný kontext z pohledu technické implementace, bezpečnosti a dlouhodobé udržitelnosti.
Zaměř se na: technický dluh, bezpečnostní rizika, výkonnostní bottlenecky, testovatelnost, dokumentaci, DevOps.
Výstup: Technická analýza v češtině (markdown), max 600 slov. Buď precizní a konkrétní.`,
  },
  {
    key: "growthHacker" as const,
    name: "Growth Hacker",
    emoji: "🚀",
    color: "#3b82f6",
    systemPrompt: `Jsi Growth Hacker — expert na GTM strategii, akvizici uživatelů a virální smyčky.
Tvůj úkol: Analyzuj zadaný kontext z pohledu růstové strategie, akvizičních kanálů a retence.
Zaměř se na: první 100 zákazníků, virální koeficient, retention loops, content marketing, partnerships, AARRR metriky.
Výstup: Akční growth plán v češtině (markdown), max 600 slov. Buď konkrétní s čísly a taktikami.`,
  },
];

// ─── Helper: call one expert ─────────────────────────────────────────────────

async function callExpert(
  expert: (typeof EXPERTS)[number],
  contextSummary: string
): Promise<string> {
  try {
    const result = await invokeLLM({
      messages: [
        { role: "system", content: expert.systemPrompt },
        {
          role: "user",
          content: `## Kontext k analýze\n\n${contextSummary}\n\nProsím analyzuj tento kontext ze své expertní perspektivy.`,
        },
      ],
    });
    return (result as any)?.choices?.[0]?.message?.content || "Analýza nedostupná.";
  } catch (err: any) {
    return `Chyba při generování analýzy: ${err?.message || "Unknown error"}`;
  }
}

// ─── Helper: synthesize all 5 outputs into master report ─────────────────────

async function synthesizeMasterReport(
  contextSummary: string,
  expertOutputs: Record<string, string>
): Promise<string> {
  const expertsText = EXPERTS.map(
    (e) => `### ${e.emoji} ${e.name}\n${expertOutputs[e.key] || "N/A"}`
  ).join("\n\n---\n\n");

  try {
    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Jsi Master Synthesizer — tvůj úkol je syntetizovat pohledy 5 expertů do jednoho koherentního strategického dokumentu.
Vytvoř strukturovaný master report v češtině (markdown) s těmito sekcemi:
1. **Executive Summary** (3-5 vět)
2. **Klíčové příležitosti** (top 3, konkrétní)
3. **Kritická rizika** (top 3, s mitigací)
4. **Doporučené priority** (seřazené akce, numbered list)
5. **Multispektrální skóre** (tabulka: dimenze | skóre 1-10 | zdůvodnění)
6. **Závěr** (1 odstavec)
Buď konkrétní, syntetizuj konflikty mezi experty, maximálně 800 slov.`,
        },
        {
          role: "user",
          content: `## Původní kontext\n${contextSummary}\n\n## Expertní analýzy\n\n${expertsText}`,
        },
      ],
    });
    return (result as any)?.choices?.[0]?.message?.content || "Syntéza nedostupná.";
  } catch (err: any) {
    return `Chyba při syntéze: ${err?.message || "Unknown error"}`;
  }
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const fiveBrainsRouter = router({
  // List all analyses for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    return db
      .select()
      .from(brainAnalyses)
      .where(eq(brainAnalyses.userId, ctx.user.id))
      .orderBy(desc(brainAnalyses.createdAt))
      .limit(50);
  }),

  // Get a single analysis by ID
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const [analysis] = await db
        .select()
        .from(brainAnalyses)
        .where(
          and(eq(brainAnalyses.id, input.id), eq(brainAnalyses.userId, ctx.user.id))
        );
      return analysis || null;
    }),

  // Start a new 5-brain analysis (async — returns immediately, runs in background)
  start: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        contextType: z.enum(["project", "campaign", "custom"]).default("custom"),
        contextId: z.number().optional(),
        contextData: z.string().min(10).max(8000), // free-text context summary
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();

      // Create the analysis record in "running" state
      const [inserted] = await db.insert(brainAnalyses).values({
        userId: ctx.user.id,
        title: input.title,
        contextType: input.contextType,
        contextId: input.contextId ?? null,
        contextData: input.contextData,
        status: "running",
      });

      const analysisId = (inserted as any).insertId as number;

      // Run all 5 experts in parallel (fire-and-forget, update DB when done)
      (async () => {
        try {
          const [pa, cv, ci, tp, gh] = await Promise.all([
            callExpert(EXPERTS[0], input.contextData),
            callExpert(EXPERTS[1], input.contextData),
            callExpert(EXPERTS[2], input.contextData),
            callExpert(EXPERTS[3], input.contextData),
            callExpert(EXPERTS[4], input.contextData),
          ]);

          const masterReport = await synthesizeMasterReport(input.contextData, {
            pragmaticArchitect: pa,
            creativeVisionary: cv,
            criticalInvestor: ci,
            technicalPurist: tp,
            growthHacker: gh,
          });

          await db
            .update(brainAnalyses)
            .set({
              status: "done",
              pragmaticArchitect: pa,
              creativeVisionary: cv,
              criticalInvestor: ci,
              technicalPurist: tp,
              growthHacker: gh,
              masterReport,
              completedAt: new Date(),
            })
            .where(eq(brainAnalyses.id, analysisId));

          console.log(`[5Brains] Analysis ${analysisId} completed.`);
        } catch (err: any) {
          await db
            .update(brainAnalyses)
            .set({ status: "error" })
            .where(eq(brainAnalyses.id, analysisId));
          console.error(`[5Brains] Analysis ${analysisId} failed:`, err?.message);
        }
      })();

      return { id: analysisId, status: "running" };
    }),

  // Delete an analysis
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      await db
        .delete(brainAnalyses)
        .where(
          and(eq(brainAnalyses.id, input.id), eq(brainAnalyses.userId, ctx.user.id))
        );
      return { ok: true };
    }),
});

export const BRAIN_EXPERTS = EXPERTS;
