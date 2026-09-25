import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { omniAdCreatives, omniAdEvents, omniAdSites } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
  return next({ ctx });
});

export const omniAdsRouter = router({
  listSites: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(omniAdSites).orderBy(omniAdSites.name);
  }),

  upsertSite: adminProcedure
    .input(
      z.object({
        siteKey: z.string().regex(/^[a-z0-9][a-z0-9.-]{1,95}$/),
        name: z.string().min(1).max(160),
        domain: z.string().max(255).optional(),
        enabled: z.boolean().optional().default(false),
        customStreamEnabled: z.boolean().optional().default(true),
        mainstreamFallbackEnabled: z.boolean().optional().default(true),
        autoPlacement: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .insert(omniAdSites)
        .values(input)
        .onDuplicateKeyUpdate({
          set: {
            name: input.name,
            domain: input.domain ?? null,
            enabled: input.enabled,
            customStreamEnabled: input.customStreamEnabled,
            mainstreamFallbackEnabled: input.mainstreamFallbackEnabled,
            autoPlacement: input.autoPlacement,
          },
        });
      return { ok: true };
    }),

  setSiteEnabled: adminProcedure
    .input(z.object({ siteKey: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(omniAdSites)
        .set({ enabled: input.enabled })
        .where(eq(omniAdSites.siteKey, input.siteKey));
      return input;
    }),

  listCreatives: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(omniAdCreatives).orderBy(omniAdCreatives.priority);
  }),

  upsertCreative: adminProcedure
    .input(
      z.object({
        creativeKey: z.string().min(2).max(128),
        advertiserKey: z.string().min(2).max(96),
        stream: z.enum(["custom", "mainstream"]),
        format: z.enum(["image", "video"]).default("image"),
        title: z.string().min(1).max(255),
        assetUrl: z.string().url().max(1024),
        destinationUrl: z.string().url().max(1024),
        altText: z.string().max(512).optional(),
        tags: z.array(z.string()).default([]),
        targetSiteKeys: z.array(z.string()).default([]),
        priority: z.number().int().min(1).max(9999).default(100),
        frequencyCap: z.number().int().min(1).max(20).default(3),
        frequencyWindowHours: z.number().int().min(1).max(720).default(168),
        minRepeatMinutes: z.number().int().min(0).max(10080).default(360),
        enabled: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .insert(omniAdCreatives)
        .values(input)
        .onDuplicateKeyUpdate({ set: input });
      return { ok: true };
    }),

  setCreativeEnabled: adminProcedure
    .input(z.object({ creativeKey: z.string(), enabled: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(omniAdCreatives)
        .set({ enabled: input.enabled })
        .where(eq(omniAdCreatives.creativeKey, input.creativeKey));
      return input;
    }),

  stats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select({
        siteKey: omniAdEvents.siteKey,
        creativeKey: omniAdEvents.creativeKey,
        eventType: omniAdEvents.eventType,
        count: sql<number>\`count(*)\`,
      })
      .from(omniAdEvents)
      .groupBy(
        omniAdEvents.siteKey,
        omniAdEvents.creativeKey,
        omniAdEvents.eventType,
      )
      .orderBy(desc(sql\`count(*)\`));
  }),
});
