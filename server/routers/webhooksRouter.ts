/**
 * Webhooks Management Router
 * tRPC procedures for CRUD operations on webhook configurations
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { webhookConfigs, webhookLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { testWebhook } from "../webhookDispatcher";

export const webhooksRouter = router({
  /**
   * Create a new webhook configuration
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(256),
        url: z.string().url(),
        events: z.string().min(1), // comma-separated: "new_lead,new_order,quiz_completed"
        maxRetries: z.number().min(1).max(10).default(3),
        retryDelaySeconds: z.number().min(60).max(3600).default(300),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Generate a random secret for HMAC signing
      const secret = require("crypto").randomBytes(32).toString("hex");

      const result = await db.insert(webhookConfigs).values({
        userId: ctx.user.id,
        name: input.name,
        url: input.url,
        events: input.events,
        secret,
        status: "active",
        maxRetries: input.maxRetries,
        retryDelaySeconds: input.retryDelaySeconds,
        headers: input.headers || {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return {
        id: (result as any).insertId,
        name: input.name,
        secret,
        message: "Webhook created successfully. Save the secret — you'll need it to verify signatures!",
      };
    }),

  /**
   * List all webhook configurations for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const configs = await db
      .select()
      .from(webhookConfigs)
      .where(eq(webhookConfigs.userId, ctx.user.id));

    return configs.map(config => ({
      id: config.id,
      name: config.name,
      url: config.url,
      events: config.events,
      status: config.status,
      maxRetries: config.maxRetries,
      retryDelaySeconds: config.retryDelaySeconds,
      lastTriggeredAt: config.lastTriggeredAt ? new Date(config.lastTriggeredAt) : null,
      failureCount: config.failureCount,
      createdAt: new Date(config.createdAt),
      updatedAt: new Date(config.updatedAt),
    }));
  }),

  /**
   * Get a specific webhook configuration
   */
  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const config = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.id))
        .limit(1);

      if (config.length === 0 || config[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      return config[0];
    }),

  /**
   * Update a webhook configuration
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().url().optional(),
        events: z.string().optional(),
        status: z.enum(["active", "paused", "failed"]).optional(),
        maxRetries: z.number().optional(),
        retryDelaySeconds: z.number().optional(),
        headers: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const existing = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.id))
        .limit(1);

      if (existing.length === 0 || existing[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      const updateData: Record<string, any> = { updatedAt: Date.now() };
      if (input.name) updateData.name = input.name;
      if (input.url) updateData.url = input.url;
      if (input.events) updateData.events = input.events;
      if (input.status) updateData.status = input.status;
      if (input.maxRetries) updateData.maxRetries = input.maxRetries;
      if (input.retryDelaySeconds) updateData.retryDelaySeconds = input.retryDelaySeconds;
      if (input.headers) updateData.headers = input.headers;

      await db.update(webhookConfigs).set(updateData).where(eq(webhookConfigs.id, input.id));

      return { message: "Webhook updated successfully" };
    }),

  /**
   * Delete a webhook configuration
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const existing = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.id))
        .limit(1);

      if (existing.length === 0 || existing[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      await db.delete(webhookConfigs).where(eq(webhookConfigs.id, input.id));

      return { message: "Webhook deleted successfully" };
    }),

  /**
   * Test webhook delivery
   */
  test: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const webhook = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.id))
        .limit(1);

      if (webhook.length === 0 || webhook[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      const result = await testWebhook(webhook[0], ctx.user.id);
      return result;
    }),

  /**
   * Get webhook delivery logs
   */
  logs: protectedProcedure
    .input(
      z.object({
        webhookId: z.number(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify ownership
      const webhook = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.webhookId))
        .limit(1);

      if (webhook.length === 0 || webhook[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      const logs = await db
        .select()
        .from(webhookLogs)
        .where(eq(webhookLogs.webhookConfigId, input.webhookId))
        .limit(input.limit)
        .offset(input.offset);

      return logs.map(log => ({
        id: log.id,
        event: log.event,
        status: log.status,
        statusCode: log.statusCode,
        attempt: log.attempt,
        createdAt: new Date(log.createdAt),
        completedAt: log.completedAt ? new Date(log.completedAt) : null,
      }));
    }),

  /**
   * Pause/resume webhook
   */
  toggleStatus: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const webhook = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, input.id))
        .limit(1);

      if (webhook.length === 0 || webhook[0].userId !== ctx.user.id) {
        throw new Error("Webhook not found");
      }

      const newStatus = webhook[0].status === "active" ? "paused" : "active";
      await db
        .update(webhookConfigs)
        .set({ status: newStatus, updatedAt: Date.now() })
        .where(eq(webhookConfigs.id, input.id));

      return { status: newStatus };
    }),
});
