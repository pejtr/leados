/**
 * Radar Router — tRPC procedures for signal-based prospecting (AI Growth OS)
 */
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { radarWatches, radarSignals } from "../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { runRadarScan } from "./radarAgent";

export const radarRouter = router({
  // ── Watches (one-time setup → runs autonomously) ────────────────────────────
  listWatches: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(radarWatches)
      .where(eq(radarWatches.userId, ctx.user.id))
      .orderBy(desc(radarWatches.createdAt));
  }),

  createWatch: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(128),
        subreddits: z.array(z.string().min(1)).min(1).max(5),
        keywords: z.array(z.string()).default([]),
        offerContext: z.string().max(2000).default(""),
        minScore: z.number().min(0).max(100).default(60),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.insert(radarWatches).values({
        userId: ctx.user.id,
        name: input.name,
        subreddits: input.subreddits,
        keywords: input.keywords,
        offerContext: input.offerContext,
        minScore: input.minScore,
        isActive: 1,
      });
      return { success: true };
    }),

  updateWatch: protectedProcedure
    .input(
      z.object({
        watchId: z.number(),
        name: z.string().min(1).max(128).optional(),
        subreddits: z.array(z.string().min(1)).min(1).max(5).optional(),
        keywords: z.array(z.string()).optional(),
        offerContext: z.string().max(2000).optional(),
        minScore: z.number().min(0).max(100).optional(),
        isActive: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { watchId, ...data } = input;
      await db
        .update(radarWatches)
        .set(data)
        .where(and(eq(radarWatches.id, watchId), eq(radarWatches.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteWatch: protectedProcedure
    .input(z.object({ watchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .delete(radarWatches)
        .where(and(eq(radarWatches.id, input.watchId), eq(radarWatches.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Scan: run a watch now (also the scheduler entrypoint) ───────────────────
  scanNow: protectedProcedure
    .input(z.object({ watchId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const watches = await db
        .select()
        .from(radarWatches)
        .where(and(eq(radarWatches.id, input.watchId), eq(radarWatches.userId, ctx.user.id)))
        .limit(1);
      const watch = watches[0];
      if (!watch) throw new Error("Watch not found");

      // Known URLs for dedupe — only this watch's signals
      const existing = await db
        .select({ sourceUrl: radarSignals.sourceUrl })
        .from(radarSignals)
        .where(eq(radarSignals.watchId, watch.id));
      const knownUrls = new Set(existing.map((s) => s.sourceUrl));

      const result = await runRadarScan({
        subreddits: watch.subreddits ?? [],
        keywords: watch.keywords ?? [],
        offerContext: watch.offerContext ?? "",
        minScore: watch.minScore,
        knownUrls,
      });

      for (const s of result.signals) {
        await db.insert(radarSignals).values({
          userId: ctx.user.id,
          watchId: watch.id,
          source: "reddit",
          sourceUrl: s.post.url,
          subreddit: s.post.subreddit,
          title: s.post.title.slice(0, 500),
          excerpt: s.post.selftext.slice(0, 1000),
          painPoint: s.painPoint,
          opportunity: s.opportunity,
          score: Math.round(s.score),
          status: "new",
          postedAt: s.post.createdUtc * 1000,
        });
      }

      await db
        .update(radarWatches)
        .set({ lastScanAt: Date.now() })
        .where(eq(radarWatches.id, watch.id));

      return {
        scannedPosts: result.scannedPosts,
        matchedKeywords: result.matchedKeywords,
        newSignals: result.signals.length,
      };
    }),

  // ── Signals ──────────────────────────────────────────────────────────────────
  listSignals: protectedProcedure
    .input(
      z
        .object({
          watchId: z.number().optional(),
          status: z.enum(["new", "reviewed", "converted", "dismissed"]).optional(),
          limit: z.number().min(1).max(200).default(50),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(radarSignals.userId, ctx.user.id)];
      if (input?.watchId) conditions.push(eq(radarSignals.watchId, input.watchId));
      if (input?.status) conditions.push(eq(radarSignals.status, input.status));
      return db
        .select()
        .from(radarSignals)
        .where(and(...conditions))
        .orderBy(desc(radarSignals.score), desc(radarSignals.createdAt))
        .limit(input?.limit ?? 50);
    }),

  updateSignalStatus: protectedProcedure
    .input(
      z.object({
        signalId: z.number(),
        status: z.enum(["new", "reviewed", "converted", "dismissed"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(radarSignals)
        .set({ status: input.status })
        .where(and(eq(radarSignals.id, input.signalId), eq(radarSignals.userId, ctx.user.id)));
      return { success: true };
    }),
});
