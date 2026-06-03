/**
 * Integrations Router
 * tRPC procedures for managing third-party integration settings
 * (Brevo, Reddit Ads, TikTok Ads, Meta Pixel, etc.)
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { integrationSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const VALID_INTEGRATIONS = [
  "brevo",
  "reddit-ads",
  "tiktok-ads",
  "meta-pixel",
  "stripe",
  "leados-crm",
] as const;

export const integrationsRouter = router({
  /**
   * Get all integration settings for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const settings = await db
      .select()
      .from(integrationSettings)
      .where(eq(integrationSettings.userId, ctx.user.id));

    // Mask API keys for security — only show last 4 chars
    return settings.map((s) => ({
      ...s,
      apiKey: s.apiKey ? `...${s.apiKey.slice(-4)}` : null,
      apiSecret: s.apiSecret ? `...${s.apiSecret.slice(-4)}` : null,
    }));
  }),

  /**
   * Get a single integration setting
   */
  get: protectedProcedure
    .input(z.object({ integrationId: z.enum(VALID_INTEGRATIONS) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [setting] = await db
        .select()
        .from(integrationSettings)
        .where(
          and(
            eq(integrationSettings.userId, ctx.user.id),
            eq(integrationSettings.integrationId, input.integrationId)
          )
        );

      if (!setting) return null;

      return {
        ...setting,
        apiKey: setting.apiKey ? `...${setting.apiKey.slice(-4)}` : null,
        apiSecret: setting.apiSecret ? `...${setting.apiSecret.slice(-4)}` : null,
      };
    }),

  /**
   * Save or update integration settings (upsert)
   */
  save: protectedProcedure
    .input(
      z.object({
        integrationId: z.enum(VALID_INTEGRATIONS),
        apiKey: z.string().optional(),
        apiSecret: z.string().optional(),
        config: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const now = Date.now();

      // Check if setting already exists
      const [existing] = await db
        .select()
        .from(integrationSettings)
        .where(
          and(
            eq(integrationSettings.userId, ctx.user.id),
            eq(integrationSettings.integrationId, input.integrationId)
          )
        );

      if (existing) {
        // Update
        await db
          .update(integrationSettings)
          .set({
            ...(input.apiKey !== undefined && { apiKey: input.apiKey }),
            ...(input.apiSecret !== undefined && { apiSecret: input.apiSecret }),
            ...(input.config !== undefined && { config: input.config }),
            status: input.apiKey ? "active" : "inactive",
            updatedAt: now,
          })
          .where(eq(integrationSettings.id, existing.id));

        return { success: true, action: "updated" };
      } else {
        // Insert
        await db.insert(integrationSettings).values({
          userId: ctx.user.id,
          integrationId: input.integrationId,
          apiKey: input.apiKey || null,
          apiSecret: input.apiSecret || null,
          config: input.config || {},
          status: input.apiKey ? "active" : "inactive",
          createdAt: now,
          updatedAt: now,
        });

        return { success: true, action: "created" };
      }
    }),

  /**
   * Test an integration connection
   */
  test: protectedProcedure
    .input(z.object({ integrationId: z.enum(VALID_INTEGRATIONS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [setting] = await db
        .select()
        .from(integrationSettings)
        .where(
          and(
            eq(integrationSettings.userId, ctx.user.id),
            eq(integrationSettings.integrationId, input.integrationId)
          )
        );

      if (!setting || !setting.apiKey) {
        return { success: false, error: "API klíč není nastaven" };
      }

      // Test connection based on integration type
      try {
        let testResult = { success: false, message: "" };

        if (input.integrationId === "brevo") {
          const resp = await fetch("https://api.brevo.com/v3/account", {
            headers: { "api-key": setting.apiKey },
          });
          testResult = {
            success: resp.ok,
            message: resp.ok ? "Brevo připojeno" : `HTTP ${resp.status}`,
          };
        } else if (input.integrationId === "reddit-ads") {
          // Reddit Ads uses OAuth2 — just validate key format
          testResult = {
            success: setting.apiKey.length > 10,
            message: setting.apiKey.length > 10 ? "Klíč nastaven" : "Klíč je příliš krátký",
          };
        } else if (input.integrationId === "tiktok-ads") {
          testResult = {
            success: setting.apiKey.length > 10,
            message: setting.apiKey.length > 10 ? "Klíč nastaven" : "Klíč je příliš krátký",
          };
        } else if (input.integrationId === "meta-pixel") {
          testResult = {
            success: /^\d{10,20}$/.test(setting.apiKey),
            message: /^\d{10,20}$/.test(setting.apiKey) ? "Pixel ID validní" : "Neplatný formát Pixel ID",
          };
        } else {
          testResult = { success: true, message: "Klíč nastaven" };
        }

        // Update lastTestedAt
        await db
          .update(integrationSettings)
          .set({
            lastTestedAt: Date.now(),
            status: testResult.success ? "active" : "error",
            updatedAt: Date.now(),
          })
          .where(eq(integrationSettings.id, setting.id));

        return testResult;
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }),

  /**
   * Get recent integration activity logs (stub — returns empty list if no log table exists)
   */
  logs: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(200).default(50) }))
    .query(async (_ctx) => {
      // Stub: returns empty array — extend with a real log table when needed
      return [] as Array<{
        id: number;
        integrationId: string;
        event: string;
        status: string;
        message: string | null;
        createdAt: number;
      }>;
    }),

  /**
   * Delete integration settings
   */
  delete: protectedProcedure
    .input(z.object({ integrationId: z.enum(VALID_INTEGRATIONS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .delete(integrationSettings)
        .where(
          and(
            eq(integrationSettings.userId, ctx.user.id),
            eq(integrationSettings.integrationId, input.integrationId)
          )
        );

      return { success: true };
    }),
});
