/**
 * Daily Report Scheduler — sends a daily sales & ROAS digest email
 * to configured recipients. Runs every 60 minutes and checks if
 * any report config is due for sending based on sendHour (UTC).
 */
import { getDb } from "./db";
import { dailyReportConfigs, connectedProjects, projectEvents, adCampaigns } from "../drizzle/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Check every hour

interface DailyStats {
  totalSales: number;
  totalRevenue: number;
  totalLeads: number;
  totalAdSpend: number;
  roas: number | null;
  pno: number | null;
  topProject: string | null;
  topCampaign: string | null;
}

async function getDailyStats(userId: string): Promise<DailyStats> {
  const db = await getDb();
  if (!db) return { totalSales: 0, totalRevenue: 0, totalLeads: 0, totalAdSpend: 0, roas: null, pno: null, topProject: null, topCampaign: null };
  const now = Date.now();
  const yesterday = now - 24 * 60 * 60 * 1000;

  // Get all projects for user
  const projects = await db
    .select()
    .from(connectedProjects)
    .where(eq(connectedProjects.userId, userId));

  const projectIds = projects.map((p) => p.id);

  let totalSales = 0;
  let totalRevenue = 0;
  let totalLeads = 0;
  const projectRevMap: Record<number, number> = {};

  if (projectIds.length > 0) {
    // Get events from last 24h
    for (const pid of projectIds) {
      const events = await db
        .select()
        .from(projectEvents)
        .where(
          and(
            eq(projectEvents.projectId, pid),
            gte(projectEvents.createdAt, yesterday),
            lte(projectEvents.createdAt, now)
          )
        );

      let projRev = 0;
      for (const e of events) {
        if (e.eventType === "sale") {
          totalSales++;
          const val = parseFloat(e.value ?? "0");
          totalRevenue += val;
          projRev += val;
        } else if (e.eventType === "lead") {
          totalLeads++;
        }
      }
      projectRevMap[pid] = projRev;
    }
  }

  // Get ad campaigns data
  const campaigns = await db
    .select()
    .from(adCampaigns)
    .where(eq(adCampaigns.userId, userId))
    .orderBy(desc(adCampaigns.updatedAt));

  let totalAdSpend = 0;
  let totalCampaignRevenue = 0;
  let topCampaignName: string | null = null;
  let topCampaignROAS = 0;

  for (const c of campaigns) {
    const spend = parseFloat(c.adSpend as string) || 0;
    const rev = parseFloat(c.revenue as string) || 0;
    totalAdSpend += spend;
    totalCampaignRevenue += rev;
    const cRoas = spend > 0 ? rev / spend : 0;
    if (cRoas > topCampaignROAS) {
      topCampaignROAS = cRoas;
      topCampaignName = c.name;
    }
  }

  const roas = totalAdSpend > 0 ? totalCampaignRevenue / totalAdSpend : null;
  const pno = totalCampaignRevenue > 0 ? (totalAdSpend / totalCampaignRevenue) * 100 : null;

  // Top project by revenue
  let topProjectId: number | null = null;
  let topProjectRev = 0;
  for (const [pidStr, rev] of Object.entries(projectRevMap)) {
    if (rev > topProjectRev) {
      topProjectRev = rev;
      topProjectId = parseInt(pidStr);
    }
  }
  const topProject = topProjectId
    ? projects.find((p) => p.id === topProjectId)?.name ?? null
    : null;

  return {
    totalSales,
    totalRevenue,
    totalLeads,
    totalAdSpend,
    roas,
    pno,
    topProject,
    topCampaign: topCampaignName,
  };
}

async function generateAISummary(stats: DailyStats): Promise<string> {
  try {
    const prompt = `You are a concise business analyst. Based on these 24h LeadOS metrics, write a 2-3 sentence executive summary in Czech language. Be specific about numbers and give one actionable insight.

Metrics:
- Sales: ${stats.totalSales} (Revenue: $${stats.totalRevenue.toFixed(2)})
- New Leads: ${stats.totalLeads}
- Ad Spend: $${stats.totalAdSpend.toFixed(2)}
- ROAS: ${stats.roas ? stats.roas.toFixed(2) + "×" : "N/A"}
- PNO: ${stats.pno ? stats.pno.toFixed(1) + "%" : "N/A"}
- Top Project: ${stats.topProject ?? "N/A"}
- Top Campaign: ${stats.topCampaign ?? "N/A"}`;

    const response = await invokeLLM({
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

async function sendDailyReport(config: typeof dailyReportConfigs.$inferSelect): Promise<void> {
  const db = await getDb();
  if (!db) { console.warn("[DailyReport] DB unavailable"); return; }

  try {
    const stats = await getDailyStats(config.userId);
    const aiSummary = await generateAISummary(stats);

    const date = new Date().toLocaleDateString("cs-CZ", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Europe/Prague",
    });

    const roasStr = stats.roas ? `${stats.roas.toFixed(2)}×` : "N/A";
    const pnoStr = stats.pno ? `${stats.pno.toFixed(1)}%` : "N/A";

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f14; color: #e2e8f0; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 32px 24px; }
  .header { border-bottom: 1px solid #1e293b; padding-bottom: 20px; margin-bottom: 24px; }
  .logo { font-size: 24px; font-weight: 700; color: #06b6d4; }
  .logo span { color: #e2e8f0; }
  .date { color: #64748b; font-size: 14px; margin-top: 4px; }
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
  .kpi { background: #1e293b; border-radius: 8px; padding: 16px; text-align: center; }
  .kpi-value { font-size: 28px; font-weight: 700; color: #06b6d4; }
  .kpi-label { font-size: 12px; color: #64748b; margin-top: 4px; }
  .kpi-revenue .kpi-value { color: #10b981; }
  .kpi-roas .kpi-value { color: #8b5cf6; }
  .ai-summary { background: #1e293b; border-left: 3px solid #06b6d4; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #cbd5e1; }
  .ai-label { font-size: 11px; color: #06b6d4; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 14px; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #64748b; }
  .row-value { color: #e2e8f0; font-weight: 500; }
  .cta { text-align: center; margin-top: 28px; }
  .cta a { background: #06b6d4; color: #0f0f14; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .footer { text-align: center; color: #334155; font-size: 12px; margin-top: 32px; }
</style></head>
<body>
<div class="container">
  <div class="header">
    <div class="logo">Lead<span>OS</span></div>
    <div class="date">Denní report — ${date}</div>
  </div>

  <div class="kpi-grid">
    <div class="kpi kpi-revenue">
      <div class="kpi-value">$${stats.totalRevenue.toFixed(0)}</div>
      <div class="kpi-label">Revenue (24h)</div>
    </div>
    <div class="kpi">
      <div class="kpi-value">${stats.totalSales}</div>
      <div class="kpi-label">Prodeje</div>
    </div>
    <div class="kpi kpi-roas">
      <div class="kpi-value">${roasStr}</div>
      <div class="kpi-label">ROAS</div>
    </div>
  </div>

  ${aiSummary ? `
  <div class="ai-summary">
    <div class="ai-label">🧠 AI Shrnutí</div>
    ${aiSummary}
  </div>` : ""}

  <div class="row"><span class="row-label">Nové leady</span><span class="row-value">${stats.totalLeads}</span></div>
  <div class="row"><span class="row-label">Ad Spend</span><span class="row-value">$${stats.totalAdSpend.toFixed(2)}</span></div>
  <div class="row"><span class="row-label">PNO</span><span class="row-value">${pnoStr}</span></div>
  <div class="row"><span class="row-label">Top projekt</span><span class="row-value">${stats.topProject ?? "—"}</span></div>
  <div class="row"><span class="row-label">Top kampaň (ROAS)</span><span class="row-value">${stats.topCampaign ?? "—"}</span></div>

  <div class="cta">
    <a href="https://crmleadsystem.com/portfolio-roas">Otevřít Portfolio ROAS →</a>
  </div>

  <div class="footer">
    LeadOS · crmleadsystem.com · Automatický denní report<br>
    Odesláno na ${config.email}
  </div>
</div>
</body>
</html>`;

    // Send via Manus Forge email API if available, otherwise use notifyOwner
    let emailSent = false;

    if (ENV.forgeApiUrl && ENV.forgeApiKey) {
      try {
        const emailEndpoint = new URL(
          "webdevtoken.v1.WebDevService/SendEmail",
          ENV.forgeApiUrl.endsWith("/") ? ENV.forgeApiUrl : ENV.forgeApiUrl + "/"
        ).toString();

        const res = await fetch(emailEndpoint, {
          method: "POST",
          headers: {
            accept: "application/json",
            authorization: `Bearer ${ENV.forgeApiKey}`,
            "content-type": "application/json",
            "connect-protocol-version": "1",
          },
          body: JSON.stringify({
            to: config.email,
            subject: `LeadOS Denní Report — ${stats.totalSales} prodejů, $${stats.totalRevenue.toFixed(0)} revenue`,
            html: emailHtml,
          }),
        });

        if (res.ok) {
          emailSent = true;
          console.log(`[DailyReport] Email sent to ${config.email}`);
        } else {
          const txt = await res.text().catch(() => "");
          console.warn(`[DailyReport] Forge email failed (${res.status}): ${txt}`);
        }
      } catch (e) {
        console.warn("[DailyReport] Forge email error:", e);
      }
    }

    // Fallback: Manus push notification to owner
    if (!emailSent) {
      const notifContent = `📊 Denní Report LeadOS\n\n` +
        `💰 Revenue: $${stats.totalRevenue.toFixed(2)} (${stats.totalSales} prodejů)\n` +
        `🎯 Nové leady: ${stats.totalLeads}\n` +
        `📈 ROAS: ${roasStr} | PNO: ${pnoStr}\n` +
        `💸 Ad Spend: $${stats.totalAdSpend.toFixed(2)}\n` +
        `🏆 Top projekt: ${stats.topProject ?? "—"}\n\n` +
        (aiSummary ? `🧠 AI: ${aiSummary}` : "") +
        `\n\nZobrazte detail: https://crmleadsystem.com/portfolio-roas`;

      await notifyOwner({
        title: `LeadOS Report — $${stats.totalRevenue.toFixed(0)} revenue dnes`,
        content: notifContent,
      });
      console.log(`[DailyReport] Push notification sent (email fallback)`);
    }

    // Update lastSentAt
    await db
      .update(dailyReportConfigs)
      .set({ lastSentAt: Date.now(), updatedAt: Date.now() })
      .where(eq(dailyReportConfigs.id, config.id));

  } catch (err) {
    console.error(`[DailyReport] Error sending report for config ${config.id}:`, err);
  }
}

async function checkAndSendReports(): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const now = new Date();
  const currentHourUTC = now.getUTCHours();

  try {
    const configs = await db
      .select()
      .from(dailyReportConfigs)
      .where(eq(dailyReportConfigs.isActive, true));

    for (const config of configs) {
      if (config.sendHour !== currentHourUTC) continue;

      // Check if already sent in the last 23 hours
      const lastSent = config.lastSentAt ?? 0;
      const hoursSinceLast = (Date.now() - lastSent) / (1000 * 60 * 60);
      if (hoursSinceLast < 23) continue;

      console.log(`[DailyReport] Sending report for user ${config.userId} to ${config.email}`);
      await sendDailyReport(config);
    }
  } catch (err) {
    console.error("[DailyReport] Scheduler error:", err);
  }
}

export function startDailyReportScheduler(): void {
  console.log("[DailyReport] Scheduler started — checking every hour");
  setInterval(checkAndSendReports, CHECK_INTERVAL_MS);
  // Also run immediately on startup (with 10s delay)
  setTimeout(checkAndSendReports, 10_000);
}

export { sendDailyReport, getDailyStats };
