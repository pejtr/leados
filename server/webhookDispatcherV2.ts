/**
 * Webhook Dispatcher V2 — CRM Integration
 * Handles outbound webhooks with HMAC-SHA256 signing, exponential backoff retry logic, and event logging
 * Supports: new_lead, new_order, quiz_completed events
 */
import crypto from "crypto";
import { getDb } from "./db";
import { webhookConfigs, webhookLogs } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export type WebhookEventType = "new_lead" | "new_order" | "quiz_completed" | "lead_qualified";

interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Generate HMAC-SHA256 signature for webhook payload
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Calculate exponential backoff delay (in ms)
 * Formula: baseDelay * (2 ^ attemptNumber) + random jitter
 */
function calculateBackoffDelay(attempt: number, baseDelayMs: number = 1000): number {
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  const maxDelay = 60 * 60 * 1000; // Max 1 hour
  const cappedDelay = Math.min(exponentialDelay, maxDelay);
  const jitter = Math.random() * 0.1 * cappedDelay; // 10% jitter
  return cappedDelay + jitter;
}

/**
 * Dispatch a webhook event to all configured webhooks for a user
 * Runs asynchronously (fire-and-forget)
 */
export async function dispatchWebhookEvent(
  userId: number,
  event: WebhookEventType,
  data: Record<string, any>
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[WebhookDispatcher] Database unavailable");
    return;
  }

  try {
    // Fetch all active webhooks for this user
    const configs = await db
      .select()
      .from(webhookConfigs)
      .where(
        and(
          eq(webhookConfigs.userId, userId),
          eq(webhookConfigs.status, "active")
        )
      );

    if (configs.length === 0) {
      console.log(`[WebhookDispatcher] No active webhooks for user ${userId}`);
      return;
    }

    // Build payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    const payloadStr = JSON.stringify(payload);

    // Dispatch to each webhook asynchronously
    for (const config of configs) {
      // Check if webhook listens to this event
      const events = config.events.split(",").map(e => e.trim());
      if (!events.includes(event) && !events.includes("*")) continue;

      // Create initial log entry
      const signature = generateWebhookSignature(payloadStr, config.secret);

      const logResult = await db.insert(webhookLogs).values({
        webhookConfigId: config.id,
        userId,
        event,
        payload,
        attempt: 1,
        status: "pending",
        createdAt: Date.now(),
      });

      const logId = (logResult as any).insertId || 0;

      // Dispatch asynchronously (fire and forget)
      dispatchWithRetry(
        config.id,
        config.url,
        signature,
        payloadStr,
        config.secret,
        config.maxRetries,
        config.headers || {},
        1,
        logId
      ).catch(err => console.error("[WebhookDispatcher] Error in retry loop:", err));
    }
  } catch (error) {
    console.error("[WebhookDispatcher] Error fetching webhooks:", error);
  }
}

/**
 * Dispatch webhook with exponential backoff retry logic
 */
async function dispatchWithRetry(
  webhookConfigId: number,
  url: string,
  signature: string,
  payload: string,
  secret: string,
  maxRetries: number,
  customHeaders: Record<string, string>,
  attempt: number,
  logId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LeadOS-Signature": signature,
        "X-LeadOS-Timestamp": Date.now().toString(),
        "X-LeadOS-Attempt": attempt.toString(),
        ...customHeaders,
      },
      body: payload,
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await response.text();

    if (response.ok) {
      // Success
      await db
        .update(webhookLogs)
        .set({
          status: "success",
          statusCode: response.status,
          response: responseText.substring(0, 5000),
          completedAt: Date.now(),
        })
        .where(eq(webhookLogs.id, logId));

      // Update webhook config
      await db
        .update(webhookConfigs)
        .set({
          lastTriggeredAt: Date.now(),
          failureCount: 0,
        })
        .where(eq(webhookConfigs.id, webhookConfigId));

      console.log(`[WebhookDispatcher] Webhook ${webhookConfigId} delivered successfully (attempt ${attempt})`);
      return;
    } else {
      throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 500)}`);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    if (attempt < maxRetries) {
      // Schedule retry with exponential backoff
      const delayMs = calculateBackoffDelay(attempt);
      const nextRetryAt = Date.now() + delayMs;

      await db
        .update(webhookLogs)
        .set({
          status: "retrying",
          error: errorMsg,
          nextRetryAt,
          attempt: attempt + 1,
        })
        .where(eq(webhookLogs.id, logId));

      console.log(
        `[WebhookDispatcher] Webhook ${webhookConfigId} failed (attempt ${attempt}/${maxRetries}). ` +
        `Retrying in ${(delayMs / 1000).toFixed(1)}s...`
      );

      // Schedule next retry
      setTimeout(() => {
        dispatchWithRetry(
          webhookConfigId,
          url,
          signature,
          payload,
          secret,
          maxRetries,
          {},
          attempt + 1,
          logId
        ).catch(err => console.error("[WebhookDispatcher] Retry error:", err));
      }, delayMs);
    } else {
      // Final failure
      await db
        .update(webhookLogs)
        .set({
          status: "failed",
          error: errorMsg,
          completedAt: Date.now(),
          attempt,
        })
        .where(eq(webhookLogs.id, logId));

      // Increment failure count
      const config = await db
        .select()
        .from(webhookConfigs)
        .where(eq(webhookConfigs.id, webhookConfigId))
        .limit(1);

      if (config.length > 0) {
        const newFailureCount = (config[0].failureCount || 0) + 1;
        const newStatus = newFailureCount >= 5 ? "failed" : "active";

        await db
          .update(webhookConfigs)
          .set({
            failureCount: newFailureCount,
            status: newStatus,
          })
          .where(eq(webhookConfigs.id, webhookConfigId));

        console.error(
          `[WebhookDispatcher] Webhook ${webhookConfigId} failed after ${maxRetries} attempts. ` +
          `Failure count: ${newFailureCount}. Status: ${newStatus}`
        );
      }
    }
  }
}

/**
 * Test webhook delivery synchronously (for admin testing)
 */
export async function testWebhookDelivery(
  webhookConfigId: number,
  userId: number
): Promise<{ success: boolean; statusCode?: number; response?: string; error?: string }> {
  const db = await getDb();
  if (!db) {
    return { success: false, error: "Database unavailable" };
  }

  try {
    const config = await db
      .select()
      .from(webhookConfigs)
      .where(
        and(
          eq(webhookConfigs.id, webhookConfigId),
          eq(webhookConfigs.userId, userId)
        )
      )
      .limit(1);

    if (config.length === 0) {
      return { success: false, error: "Webhook config not found" };
    }

    const webhook = config[0];
    const testPayload: WebhookPayload = {
      event: "new_lead",
      timestamp: new Date().toISOString(),
      data: {
        isTest: true,
        message: "This is a test webhook delivery",
        testId: `test_${Date.now()}`,
      },
    };

    const payloadStr = JSON.stringify(testPayload);
    const signature = generateWebhookSignature(payloadStr, webhook.secret);

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-LeadOS-Signature": signature,
        "X-LeadOS-Timestamp": Date.now().toString(),
        "X-LeadOS-Test": "true",
        ...(webhook.headers || {}),
      },
      body: payloadStr,
      signal: AbortSignal.timeout(15000),
    });

    const responseText = await response.text();

    return {
      success: response.ok,
      statusCode: response.status,
      response: responseText.substring(0, 2000),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get webhook delivery history
 */
export async function getWebhookLogs(
  webhookConfigId: number,
  userId: number,
  limit: number = 50,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return null;

  try {
    // Verify ownership
    const config = await db
      .select()
      .from(webhookConfigs)
      .where(
        and(
          eq(webhookConfigs.id, webhookConfigId),
          eq(webhookConfigs.userId, userId)
        )
      )
      .limit(1);

    if (config.length === 0) return null;

    const logs = await db
      .select()
      .from(webhookLogs)
      .where(eq(webhookLogs.webhookConfigId, webhookConfigId))
      .limit(limit)
      .offset(offset);

    return logs;
  } catch (error) {
    console.error("[WebhookDispatcher] Error fetching logs:", error);
    return null;
  }
}
