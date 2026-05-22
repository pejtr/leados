/**
 * Webhook Retry Scheduler Handler
 * Called by Heartbeat every 5 minutes to retry failed webhook deliveries
 * Uses exponential backoff: 5min, 15min, 45min (max 3 retries)
 */
import type { Request, Response } from "express";
import { getDb } from "./db";
import { webhookLogs, webhookConfigs } from "../drizzle/schema";
import { eq, and, lt, lte, isNotNull } from "drizzle-orm";
import crypto from "crypto";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [5 * 60_000, 15 * 60_000, 45 * 60_000]; // 5min, 15min, 45min

/**
 * Express handler for /api/scheduled/webhook-retry
 * Finds all webhook logs with status "retrying" and attempts redelivery
 */
export async function webhookRetryHandler(req: Request, res: Response) {
  try {
    const db = await getDb();
    if (!db) {
      return res.json({ ok: true, skipped: "no-db" });
    }

    // Find all logs that need retry: status = "failed" or "retrying", attempt < MAX_RETRIES
    const pendingRetries = await db
      .select()
      .from(webhookLogs)
      .where(
        and(
          eq(webhookLogs.status, "failed"),
          lt(webhookLogs.attempt, MAX_RETRIES)
        )
      )
      .limit(50); // Process max 50 per cycle to stay within timeout

    if (pendingRetries.length === 0) {
      return res.json({ ok: true, processed: 0, message: "No pending retries" });
    }

    let successCount = 0;
    let failCount = 0;

    for (const log of pendingRetries) {
      // Check if enough time has passed for this retry attempt
      const delayMs = RETRY_DELAYS_MS[Math.min(log.attempt, RETRY_DELAYS_MS.length - 1)];
      const nextRetryTime = log.createdAt + delayMs * (log.attempt + 1);
      
      if (Date.now() < nextRetryTime) {
        continue; // Not time yet for this retry
      }

      // Get the webhook config to get the URL and secret
      const configs = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, log.webhookConfigId))
        .limit(1);

      if (configs.length === 0) {
        // Webhook config deleted, mark as permanently failed
        await db
          .update(webhookLogs)
          .set({ status: "failed", errorMessage: "Webhook config deleted" })
          .where(eq(webhookLogs.id, log.id));
        continue;
      }

      const config = configs[0];
      
      // Attempt redelivery
      try {
        const payload = log.payload || "{}";
        const timestamp = Math.floor(Date.now() / 1000).toString();
        
        // Generate HMAC-SHA256 signature
        const signatureBody = `${timestamp}.${payload}`;
        const signature = crypto
          .createHmac("sha256", config.secret)
          .update(signatureBody)
          .digest("hex");

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Timestamp": timestamp,
          "X-Webhook-Event": log.eventType,
          "X-Webhook-Retry": (log.attempt + 1).toString(),
          ...(config.headers || {}),
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30s timeout

        const response = await fetch(config.url, {
          method: "POST",
          headers,
          body: payload,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseBody = await response.text().catch(() => "");

        if (response.ok) {
          // Success! Update log
          await db
            .update(webhookLogs)
            .set({
              status: "success",
              statusCode: response.status,
              responseBody: responseBody.substring(0, 2000),
              attempt: log.attempt + 1,
              deliveredAt: Date.now(),
            })
            .where(eq(webhookLogs.id, log.id));
          successCount++;
        } else {
          // Still failing
          const newAttempt = log.attempt + 1;
          const newStatus = newAttempt >= MAX_RETRIES ? "failed" : "failed"; // Will be retried next cycle
          
          await db
            .update(webhookLogs)
            .set({
              status: newStatus,
              statusCode: response.status,
              responseBody: responseBody.substring(0, 2000),
              attempt: newAttempt,
              errorMessage: `HTTP ${response.status}: ${responseBody.substring(0, 200)}`,
            })
            .where(eq(webhookLogs.id, log.id));
          failCount++;
        }
      } catch (fetchError: any) {
        // Network error or timeout
        const newAttempt = log.attempt + 1;
        
        await db
          .update(webhookLogs)
          .set({
            status: newAttempt >= MAX_RETRIES ? "failed" : "failed",
            attempt: newAttempt,
            errorMessage: fetchError.message || "Network error",
          })
          .where(eq(webhookLogs.id, log.id));
        failCount++;
      }
    }

    // Update webhook config failure counts
    const failedConfigs = new Set(pendingRetries.filter((_, i) => i < failCount).map(l => l.webhookConfigId));
    for (const configId of failedConfigs) {
      const config = (await db.select().from(webhookConfigs).where(eq(webhookConfigs.id, configId)).limit(1))[0];
      if (config && config.failureCount >= 10) {
        // Auto-pause webhook after 10 consecutive failures
        await db
          .update(webhookConfigs)
          .set({ status: "failed" })
          .where(eq(webhookConfigs.id, configId));
      }
    }

    return res.json({
      ok: true,
      processed: pendingRetries.length,
      success: successCount,
      failed: failCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[WebhookRetry] Scheduler error:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
      context: { url: req.url, taskUid: req.headers["x-manus-cron-task-uid"] },
      timestamp: new Date().toISOString(),
    });
  }
}
