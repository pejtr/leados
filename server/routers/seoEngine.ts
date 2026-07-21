import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  listKeywords,
  getKeyword,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  listContentScores,
  getContentScore,
  createContentScore,
  getKeywordStats,
} from "../db/seo-engine";
import {
  calculateSeoScore,
  generateMetaTags,
  analyzeKeyword as analyzeKeywordCore,
} from "../seoEngine";

export const seoEngineRouter = router({
  keywords: router({
    list: protectedProcedure.query(async () => {
      return listKeywords();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getKeyword(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        keyword: z.string().min(1),
        volume: z.number().int().optional(),
        difficulty: z.number().int().optional(),
        intent: z.string().optional(),
        competitorScore: z.number().int().optional(),
        suggestions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createKeyword({
          keyword: input.keyword,
          volume: input.volume ?? 0,
          difficulty: input.difficulty ?? 0,
          intent: input.intent ?? "informational",
          competitorScore: input.competitorScore ?? 0,
          suggestions: input.suggestions ?? null,
        });
        return { id, status: "created" };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number().int().positive(),
        keyword: z.string().optional(),
        volume: z.number().int().optional(),
        difficulty: z.number().int().optional(),
        intent: z.string().optional(),
        competitorScore: z.number().int().optional(),
        suggestions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const success = await updateKeyword(input.id, {
          ...(input.keyword !== undefined && { keyword: input.keyword }),
          ...(input.volume !== undefined && { volume: input.volume }),
          ...(input.difficulty !== undefined && { difficulty: input.difficulty }),
          ...(input.intent !== undefined && { intent: input.intent }),
          ...(input.competitorScore !== undefined && { competitorScore: input.competitorScore }),
          ...(input.suggestions !== undefined && { suggestions: input.suggestions }),
        });
        return { success };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        const success = await deleteKeyword(input.id);
        return { success };
      }),
  }),

  contentScores: router({
    list: protectedProcedure.query(async () => {
      return listContentScores();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ input }) => {
        return getContentScore(input.id);
      }),

    create: protectedProcedure
      .input(z.object({
        contentType: z.string().min(1),
        contentId: z.number().int(),
        readabilityScore: z.number().int().optional(),
        seoScore: z.number().int().optional(),
        keywordDensity: z.string().optional(),
        suggestions: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await createContentScore({
          contentType: input.contentType,
          contentId: input.contentId,
          readabilityScore: input.readabilityScore ?? 0,
          seoScore: input.seoScore ?? 0,
          keywordDensity: input.keywordDensity ?? null,
          suggestions: input.suggestions ?? null,
        });
        return { id, status: "created" };
      }),
  }),

  analyze: protectedProcedure
    .input(z.object({
      content: z.string().min(1),
      keyword: z.string().optional(),
    }))
    .query(async ({ input }) => {
      return calculateSeoScore(input.content, input.keyword);
    }),

  generateMeta: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .query(async ({ input }) => {
      return generateMetaTags(input.title, input.content);
    }),

  analyzeKeyword: protectedProcedure
    .input(z.string().min(1))
    .query(async ({ input }) => {
      return analyzeKeywordCore(input);
    }),

  stats: protectedProcedure.query(async () => {
    return getKeywordStats();
  }),
});
