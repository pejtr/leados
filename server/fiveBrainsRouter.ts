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
import { getConstitutionContext } from "./routers/constitution";

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
  contextSummary: string,
  constitutionContext: string
): Promise<string> {
  try {
    // Prepend AI Constitution context to the expert's system prompt if available
    const systemContent = constitutionContext
      ? `${expert.systemPrompt}\n\n${constitutionContext}`
      : expert.systemPrompt;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: systemContent },
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
  expertOutputs: Record<string, string>,
  constitutionContext: string
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
Buď konkrétní, syntetizuj konflikty mezi experty, maximálně 800 slov.${constitutionContext ? `\n\n${constitutionContext}` : ""}`,
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

// ─── Helper: Advocate + Skeptic confidence check ───────────────────────────

interface ConfidenceResult {
  score: number;          // 0-100
  advocateAnalysis: string;
  skepticAnalysis: string;
  reasoning: string;
}

async function runConfidenceCheck(
  contextData: string,
  masterReport: string,
  constitutionContext: string
): Promise<ConfidenceResult> {
  try {
    const constitutionNote = constitutionContext
      ? `\n\nFiremní kontext (AI Ústava):\n${constitutionContext}`
      : "";

    const [advocateRaw, skepticRaw] = await Promise.all([
      // Advocate — finds strengths, confirms validity
      invokeLLM({
        messages: [
          {
            role: "system",
            content: `Jsi Advokát — tvůj úkol je najít silné stránky a potvrdit platnost analýzy.
Hledej: správné předpoklady, realistické závěry, dobré nápady, konzistentnost s tržními daty.
Výstup: JSON objekt { "score": <0-100>, "strengths": ["...", "...", "..."], "summary": "..." }
Score 80-100 = velmi solidní analýza, 60-79 = dobrá s drobnými mezerami, 40-59 = průměrná, 0-39 = slabá.${constitutionNote}`,
          },
          {
            role: "user",
            content: `Kontext: ${contextData.slice(0, 1500)}\n\nMaster Report:\n${masterReport.slice(0, 2000)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "advocate_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "integer", description: "0-100 confidence score" },
                strengths: { type: "array", items: { type: "string" }, description: "Key strengths found" },
                summary: { type: "string", description: "Brief advocate summary" },
              },
              required: ["score", "strengths", "summary"],
              additionalProperties: false,
            },
          },
        },
      }),
      // Skeptic — finds weaknesses, challenges assumptions
      invokeLLM({
        messages: [
          {
            role: "system",
            content: `Jsi Skeptik — tvůj úkol je najít slabiny, zpochybnit předpoklady a odhalit slepá místa.
Hledej: nerealistické předpoklady, chybějící rizika, přehlédnuté konkurenty, slabé datové základy, logické chyby.
Výstup: JSON objekt { "score": <0-100>, "weaknesses": ["...", "...", "..."], "summary": "..." }
Score 80-100 = analýza nemá zásadní slabiny, 60-79 = drobné mezery, 40-59 = výrazné problémy, 0-39 = zásadní chyby.${constitutionNote}`,
          },
          {
            role: "user",
            content: `Kontext: ${contextData.slice(0, 1500)}\n\nMaster Report:\n${masterReport.slice(0, 2000)}`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "skeptic_result",
            strict: true,
            schema: {
              type: "object",
              properties: {
                score: { type: "integer", description: "0-100 confidence score" },
                weaknesses: { type: "array", items: { type: "string" }, description: "Key weaknesses found" },
                summary: { type: "string", description: "Brief skeptic summary" },
              },
              required: ["score", "weaknesses", "summary"],
              additionalProperties: false,
            },
          },
        },
      }),
    ]);

    const advocateContent = (advocateRaw as any)?.choices?.[0]?.message?.content || "{}";
    const skepticContent = (skepticRaw as any)?.choices?.[0]?.message?.content || "{}";

    const advocate = JSON.parse(typeof advocateContent === "string" ? advocateContent : JSON.stringify(advocateContent));
    const skeptic = JSON.parse(typeof skepticContent === "string" ? skepticContent : JSON.stringify(skepticContent));

    const advocateScore = Math.min(100, Math.max(0, Number(advocate.score) || 70));
    const skepticScore = Math.min(100, Math.max(0, Number(skeptic.score) || 70));
    const compositeScore = Math.round((advocateScore * 0.45) + (skepticScore * 0.55));

    const advocateText = `**Advokát (${advocateScore}/100):**\n${advocate.summary || ""}\n\n**Silné stránky:**\n${(advocate.strengths || []).map((s: string) => `• ${s}`).join("\n")}`;
    const skepticText = `**Skeptik (${skepticScore}/100):**\n${skeptic.summary || ""}\n\n**Slabiny:**\n${(skeptic.weaknesses || []).map((w: string) => `• ${w}`).join("\n")}`;
    const reasoning = `Advokát: ${advocateScore}/100 | Skeptik: ${skepticScore}/100 → Kompozitní skóre: ${compositeScore}/100`;

    return { score: compositeScore, advocateAnalysis: advocateText, skepticAnalysis: skepticText, reasoning };
  } catch (err: any) {
    console.error("[5Brains] Confidence check failed:", err?.message);
    return { score: 72, advocateAnalysis: "Analýza nedostupná.", skepticAnalysis: "Analýza nedostupná.", reasoning: "Výchozí skóre (chyba při výpočtu)" };
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

      // Fetch AI Constitution context once for this user (injected into all 5 brains)
      const constitutionContext = await getConstitutionContext(String(ctx.user.id));
      if (constitutionContext) {
        console.log(`[5Brains] AI Constitution context loaded for user ${ctx.user.id} (${constitutionContext.length} chars)`);
      }

      // Run all 5 experts in parallel (fire-and-forget, update DB when done)
      (async () => {
        try {
          const [pa, cv, ci, tp, gh] = await Promise.all([
            callExpert(EXPERTS[0], input.contextData, constitutionContext),
            callExpert(EXPERTS[1], input.contextData, constitutionContext),
            callExpert(EXPERTS[2], input.contextData, constitutionContext),
            callExpert(EXPERTS[3], input.contextData, constitutionContext),
            callExpert(EXPERTS[4], input.contextData, constitutionContext),
          ]);

          const masterReport = await synthesizeMasterReport(input.contextData, {
            pragmaticArchitect: pa,
            creativeVisionary: cv,
            criticalInvestor: ci,
            technicalPurist: tp,
            growthHacker: gh,
          }, constitutionContext);

          // Run Advocate + Skeptic confidence check in parallel with DB update
          const confidence = await runConfidenceCheck(input.contextData, masterReport, constitutionContext);

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
              confidenceScore: confidence.score,
              advocateAnalysis: confidence.advocateAnalysis,
              skepticAnalysis: confidence.skepticAnalysis,
              confidenceReasoning: confidence.reasoning,
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
