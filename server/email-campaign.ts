/**
 * Email Campaign Service
 *
 * Manages email campaigns, subscribers, tracking, and scheduling.
 * Uses Resend API for delivery with open/click tracking support.
 */

import { PUBLIC_SITE_URL } from "../shared/brand-config";
import { sendEmail } from "./email-service";
import { getDb } from "./db";
import { emailCampaigns, emailSubscribers, emailEvents, emailTemplates } from "../drizzle/schema";
import { eq, desc, count, sql, and } from "drizzle-orm";

// ─── Subscriber Management ────────────────────────────────────────────────────

export async function addSubscriber(email: string, name?: string, source?: string, tags?: string[]): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.insert(emailSubscribers).values({
      email: email.toLowerCase().trim(),
      name,
      source,
      tags: tags ? JSON.stringify(tags) : null,
    }).onDuplicateKeyUpdate({
      set: { status: "active", updatedAt: new Date() },
    });
    return true;
  } catch (error) {
    console.error("[EmailCampaign] Failed to add subscriber:", error);
    return false;
  }
}

export async function removeSubscriber(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(emailSubscribers)
      .set({ status: "unsubscribed", unsubscribedAt: new Date() })
      .where(eq(emailSubscribers.email, email.toLowerCase().trim()));
    return true;
  } catch (error) {
    console.error("[EmailCampaign] Failed to remove subscriber:", error);
    return false;
  }
}

export async function getActiveSubscribers(): Promise<Array<{ id: number; email: string; name: string | null; tags: string | null }>> {
  const db = await getDb();
  if (!db) return [];

  return await db.select({
    id: emailSubscribers.id,
    email: emailSubscribers.email,
    name: emailSubscribers.name,
    tags: emailSubscribers.tags,
  })
    .from(emailSubscribers)
    .where(eq(emailSubscribers.status, "active"));
}

export async function getSubscriberStats(): Promise<{ active: number; unsubscribed: number; bounced: number; total: number }> {
  const db = await getDb();
  if (!db) return { active: 0, unsubscribed: 0, bounced: 0, total: 0 };

  const results = await db.select({
    status: emailSubscribers.status,
    count: count(),
  })
    .from(emailSubscribers)
    .groupBy(emailSubscribers.status);

  const stats = { active: 0, unsubscribed: 0, bounced: 0, total: 0 };
  for (const row of results) {
    stats[row.status as keyof typeof stats] = row.count;
    stats.total += row.count;
  }
  return stats;
}

// ─── Campaign Management ──────────────────────────────────────────────────────

export async function createCampaign(data: {
  name: string;
  subject: string;
  htmlContent: string;
  plainContent?: string;
}): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(emailCampaigns).values({
      name: data.name,
      subject: data.subject,
      htmlContent: data.htmlContent,
      plainContent: data.plainContent,
    });
    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[EmailCampaign] Failed to create campaign:", error);
    return null;
  }
}

export async function updateCampaign(campaignId: number, data: {
  name?: string;
  subject?: string;
  htmlContent?: string;
  plainContent?: string;
  status?: "draft" | "scheduled" | "sending" | "sent" | "paused";
  scheduledAt?: Date;
}): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    await db.update(emailCampaigns).set({ ...data, updatedAt: new Date() }).where(eq(emailCampaigns.id, campaignId));
    return true;
  } catch (error) {
    console.error("[EmailCampaign] Failed to update campaign:", error);
    return false;
  }
}

export async function getCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(emailCampaigns).where(eq(emailCampaigns.id, campaignId)).limit(1);
  return result[0];
}

export async function listCampaigns() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(emailCampaigns).orderBy(desc(emailCampaigns.createdAt));
}

// ─── Campaign Sending ─────────────────────────────────────────────────────────

function buildTrackingPixel(campaignId: number, subscriberId: number): string {
  const trackingUrl = `${PUBLIC_SITE_URL}/api/email/track/open?cid=${campaignId}&sid=${subscriberId}`;
  return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="" />`;
}

function addUnsubscribeLink(html: string, email: string): string {
  const unsubUrl = `${PUBLIC_SITE_URL}/api/email/unsubscribe?email=${encodeURIComponent(email)}`;
  const footer = `
    <div style="margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="color:#94a3b8;font-size:11px;">
        Pokud nechcete tyto e-maily dostávat, <a href="${unsubUrl}" style="color:#4f46e5;">odhlaste se</a>.
      </p>
    </div>
  `;
  return html.replace("</body>", footer + "</body>");
}

export async function sendCampaign(campaignId: number): Promise<{ sent: number; failed: number }> {
  const db = await getDb();
  if (!db) return { sent: 0, failed: 0 };

  const campaign = await getCampaign(campaignId);
  if (!campaign || campaign.status === "sent") return { sent: 0, failed: 0 };

  const subscribers = await getActiveSubscribers();
  if (subscribers.length === 0) return { sent: 0, failed: 0 };

  await db.update(emailCampaigns)
    .set({ status: "sending", totalRecipients: subscribers.length })
    .where(eq(emailCampaigns.id, campaignId));

  let sent = 0;
  let failed = 0;

  for (const subscriber of subscribers) {
    // Personalize content
    let personalizedHtml = campaign.htmlContent
      .replace(/\{\{name\}\}/g, subscriber.name || "")
      .replace(/\{\{email\}\}/g, subscriber.email);

    // Add tracking pixel
    personalizedHtml += buildTrackingPixel(campaignId, subscriber.id);

    // Add unsubscribe link
    personalizedHtml = addUnsubscribeLink(personalizedHtml, subscriber.email);

    const success = await sendEmail({
      to: subscriber.email,
      subject: campaign.subject.replace(/\{\{name\}\}/g, subscriber.name || ""),
      html: personalizedHtml,
      idempotencyKey: `campaign-${campaignId}-sub-${subscriber.id}`,
    });

    // Record event
    try {
      await db.insert(emailEvents).values({
        campaignId,
        subscriberId: subscriber.id,
        event: success ? "sent" : "bounced",
      });
    } catch {
      // Best effort
    }

    if (success) sent++;
    else failed++;

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 50));
  }

  await db.update(emailCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      totalSent: sent,
      totalBounced: failed,
    })
    .where(eq(emailCampaigns.id, campaignId));

  return { sent, failed };
}

// ─── Event Tracking ───────────────────────────────────────────────────────────

export async function trackOpen(campaignId: number, subscriberId: number) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(emailEvents).values({
      campaignId,
      subscriberId,
      event: "opened",
    });
    await db.update(emailCampaigns)
      .set({ totalOpened: sql`totalOpened + 1` })
      .where(eq(emailCampaigns.id, campaignId));
  } catch {
    // Best effort
  }
}

export async function trackClick(campaignId: number, subscriberId: number, url: string) {
  const db = await getDb();
  if (!db) return;

  try {
    await db.insert(emailEvents).values({
      campaignId,
      subscriberId,
      event: "clicked",
      metadata: JSON.stringify({ url }),
    });
    await db.update(emailCampaigns)
      .set({ totalClicked: sql`totalClicked + 1` })
      .where(eq(emailCampaigns.id, campaignId));
  } catch {
    // Best effort
  }
}

// ─── Template Management ──────────────────────────────────────────────────────

export async function createTemplate(data: { name: string; subject: string; htmlContent: string; category?: string }) {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db.insert(emailTemplates).values({
      name: data.name,
      subject: data.subject,
      htmlContent: data.htmlContent,
      category: data.category,
    });
    return (result as any).insertId || 0;
  } catch (error) {
    console.error("[EmailCampaign] Failed to create template:", error);
    return null;
  }
}

export async function listTemplates() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emailTemplates).orderBy(desc(emailTemplates.createdAt));
}
