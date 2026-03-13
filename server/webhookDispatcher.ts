/**
 * Webhook Dispatcher — sends lead data to user-configured endpoints
 * Supports: Generic webhook (Zapier/Make/n8n), ClickUp Tasks, Slack notifications
 */

import type { WebhookConfig, Lead } from "../drizzle/schema";
import { createIntegrationLog } from "./db";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // ms

interface WebhookPayload {
  event: string;
  timestamp: string;
  leads: LeadPayload[];
  metadata?: Record<string, unknown>;
}

interface LeadPayload {
  id: number;
  companyName: string;
  email: string | null;
  website: string | null;
  industry: string;
  location: string | null;
  companySize: string | null;
  seniorityLevel: string | null;
  contactName: string | null;
  linkedinUrl: string | null;
  companyDescription: string | null;
  icebreaker: string | null;
  status: string;
  segment: string | null;
  dealValue: string | null;
  dealClosed: boolean;
}

function formatLeadPayload(lead: Lead): LeadPayload {
  return {
    id: lead.id,
    companyName: lead.companyName,
    email: lead.email,
    website: lead.website,
    industry: lead.industry,
    location: lead.location,
    companySize: lead.companySize,
    seniorityLevel: lead.seniorityLevel,
    contactName: lead.contactName,
    linkedinUrl: lead.linkedinUrl,
    companyDescription: lead.companyDescription,
    icebreaker: lead.icebreaker,
    status: lead.status,
    segment: lead.segment,
    dealValue: lead.dealValue,
    dealClosed: lead.dealClosed,
  };
}

// ─── Generic Webhook (Zapier/Make/n8n) ──────────────────────────

async function sendGenericWebhook(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ status: number; body: string }> {
  if (!config.webhookUrl) throw new Error("Webhook URL is required");

  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "AI-LeadGen-Webhook/1.0",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const body = await response.text().catch(() => "");
  return { status: response.status, body: body.substring(0, 1000) };
}

// ─── ClickUp Task Creation ──────────────────────────────────────

async function sendToClickUp(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ status: number; body: string }> {
  if (!config.clickupApiKey || !config.clickupListId) {
    throw new Error("ClickUp API key and List ID are required");
  }

  const results: string[] = [];
  let lastStatus = 200;

  for (const lead of payload.leads) {
    const taskData = {
      name: `Lead: ${lead.companyName}`,
      description: [
        `**Contact:** ${lead.contactName || "N/A"}`,
        `**Email:** ${lead.email || "N/A"}`,
        `**Website:** ${lead.website || "N/A"}`,
        `**Industry:** ${lead.industry}`,
        `**Location:** ${lead.location || "N/A"}`,
        `**Company Size:** ${lead.companySize || "N/A"}`,
        `**Seniority:** ${lead.seniorityLevel || "N/A"}`,
        `**LinkedIn:** ${lead.linkedinUrl || "N/A"}`,
        `**Status:** ${lead.status}`,
        lead.icebreaker ? `\n**AI Icebreaker:**\n${lead.icebreaker}` : "",
        lead.companyDescription ? `\n**Description:**\n${lead.companyDescription}` : "",
      ].filter(Boolean).join("\n"),
      tags: ["ai-leadgen", lead.industry.toLowerCase().replace(/\s+/g, "-")],
      status: "to do",
    };

    const response = await fetch(
      `https://api.clickup.com/api/v2/list/${config.clickupListId}/task`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: config.clickupApiKey,
        },
        body: JSON.stringify(taskData),
        signal: AbortSignal.timeout(15000),
      }
    );

    lastStatus = response.status;
    const body = await response.text().catch(() => "");
    results.push(`${lead.companyName}: ${response.status}`);

    if (!response.ok) {
      return { status: response.status, body };
    }

    // Rate limit: max 100 requests per minute for ClickUp
    if (payload.leads.length > 1) {
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  return { status: lastStatus, body: results.join("; ") };
}

// ─── Slack Notification ─────────────────────────────────────────

async function sendToSlack(
  config: WebhookConfig,
  payload: WebhookPayload
): Promise<{ status: number; body: string }> {
  if (!config.slackWebhookUrl) throw new Error("Slack webhook URL is required");

  const leadSummary = payload.leads
    .slice(0, 10)
    .map((l) => `• *${l.companyName}* — ${l.contactName || "N/A"} (${l.email || "no email"})`)
    .join("\n");

  const slackPayload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🎯 AI LeadGen: ${payload.event}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${payload.leads.length} lead(s)* generated\n\n${leadSummary}${payload.leads.length > 10 ? `\n_...and ${payload.leads.length - 10} more_` : ""}`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `⏰ ${new Date(payload.timestamp).toLocaleString()}`,
          },
        ],
      },
    ],
  };

  const response = await fetch(config.slackWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(slackPayload),
    signal: AbortSignal.timeout(15000),
  });

  const body = await response.text().catch(() => "");
  return { status: response.status, body: body.substring(0, 1000) };
}

// ─── Main Dispatcher ────────────────────────────────────────────

async function dispatchSingle(
  config: WebhookConfig,
  payload: WebhookPayload,
  retryCount = 0
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  try {
    let result: { status: number; body: string };

    switch (config.type) {
      case "clickup":
        result = await sendToClickUp(config, payload);
        break;
      case "slack":
        result = await sendToSlack(config, payload);
        break;
      case "generic":
      default:
        result = await sendGenericWebhook(config, payload);
        break;
    }

    const success = result.status >= 200 && result.status < 300;

    if (!success && retryCount < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[retryCount] || 15000));
      return dispatchSingle(config, payload, retryCount + 1);
    }

    return { success, status: result.status, body: result.body };
  } catch (err: any) {
    if (retryCount < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[retryCount] || 15000));
      return dispatchSingle(config, payload, retryCount + 1);
    }
    return {
      success: false,
      status: 0,
      body: "",
      error: err?.message || "Unknown error",
    };
  }
}

/**
 * Dispatch webhook to all active configs for a given user and event type.
 * Runs in background — does not block the caller.
 */
export async function dispatchWebhooks(
  userId: number,
  eventType: "generate" | "status_change" | "deal_close" | "test",
  leads: Lead[],
  metadata?: Record<string, unknown>
): Promise<void> {
  // Import here to avoid circular deps
  const { getActiveWebhookConfigs } = await import("./db");

  const dbEventType = eventType === "test" ? "generate" : eventType;
  const configs = await getActiveWebhookConfigs(userId, dbEventType as any);

  if (configs.length === 0) return;

  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    leads: leads.map(formatLeadPayload),
    metadata,
  };

  // Fire all webhooks in parallel (non-blocking)
  for (const config of configs) {
    dispatchSingle(config, payload).then(async (result) => {
      try {
        await createIntegrationLog({
          userId,
          webhookConfigId: config.id,
          eventType,
          payload: JSON.stringify(payload).substring(0, 5000),
          responseStatus: result.status,
          responseBody: result.body.substring(0, 2000),
          success: result.success,
          errorMessage: result.error || null,
          retryCount: result.success ? 0 : MAX_RETRIES,
        });
      } catch (logErr) {
        console.error("[Webhook] Failed to log integration event:", logErr);
      }
    });
  }
}

/**
 * Test a specific webhook config by sending a sample payload.
 */
export async function testWebhook(
  config: WebhookConfig,
  userId: number
): Promise<{ success: boolean; status: number; body: string; error?: string }> {
  const samplePayload: WebhookPayload = {
    event: "test",
    timestamp: new Date().toISOString(),
    leads: [
      {
        id: 0,
        companyName: "Test Company Inc.",
        email: "test@example.com",
        website: "https://example.com",
        industry: "Technology",
        location: "Prague, Czech Republic",
        companySize: "50-200",
        seniorityLevel: "Manager",
        contactName: "John Doe",
        linkedinUrl: "https://linkedin.com/in/johndoe",
        companyDescription: "A test company for webhook verification",
        icebreaker: "Hi John, I noticed your company is growing rapidly in the tech sector...",
        status: "new",
        segment: "SaaS",
        dealValue: null,
        dealClosed: false,
      },
    ],
    metadata: { isTest: true },
  };

  const result = await dispatchSingle(config, samplePayload, MAX_RETRIES); // no retries for test

  await createIntegrationLog({
    userId,
    webhookConfigId: config.id,
    eventType: "test",
    payload: JSON.stringify(samplePayload).substring(0, 5000),
    responseStatus: result.status,
    responseBody: result.body.substring(0, 2000),
    success: result.success,
    errorMessage: result.error || null,
    retryCount: 0,
  });

  return result;
}
