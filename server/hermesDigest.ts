/**
 * HERMES Daily Digest
 * Generates a Czech-language morning briefing with live project performance data
 * and sends it via notifyOwner push notification.
 * Scheduled to run every day at 08:00 CET (07:00 UTC).
 */

import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { getDb } from "./db";
import { hermesSessions, hermesMessages } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

const DSR_BASE = "https://deep-sleep-reset.com/api/v1";

// ─── DSR Data Fetcher ─────────────────────────────────────────────────────────

async function fetchDsrData(): Promise<{
  totalRevenueUsd: string;
  totalOrders: number;
  conversionRate: string;
  totalLeads: number;
  todayRevenue: string;
  todayOrders: number;
  abTests: { name: string; winner: string; lift: string }[];
  emailSequence: { totalSubscribers: number; avgOpenRate: string };
  health: string;
} | null> {
  const key = process.env.DEEP_SLEEP_RESET_API_KEY;
  if (!key) return null;

  const headers = { Authorization: `Bearer ${key}` };

  try {
    const [healthRes, analyticsRes, abRes, emailRes] = await Promise.allSettled([
      fetch(`${DSR_BASE}/health`).then((r) => r.json()),
      fetch(`${DSR_BASE}/analytics`, { headers }).then((r) => r.json()),
      fetch(`${DSR_BASE}/ab-tests`, { headers }).then((r) => r.json()),
      fetch(`${DSR_BASE}/email-sequence`, { headers }).then((r) => r.json()),
    ]);

    const health = healthRes.status === "fulfilled" ? (healthRes.value?.status ?? "unknown") : "error";
    const analytics = analyticsRes.status === "fulfilled" ? analyticsRes.value : null;
    const abTests = abRes.status === "fulfilled" ? (abRes.value?.variants ?? []) : [];
    const emailSeq = emailRes.status === "fulfilled" ? emailRes.value : null;

    // Today's revenue from dailyRevenue array
    const today = new Date().toISOString().split("T")[0];
    const todayEntry = analytics?.dailyRevenue?.find((d: any) => d.date === today);

    return {
      totalRevenueUsd: analytics?.totalRevenueUsd ?? "0.00",
      totalOrders: analytics?.totalOrders ?? 0,
      conversionRate: analytics?.conversionRate ?? "0%",
      totalLeads: analytics?.totalLeads ?? 0,
      todayRevenue: todayEntry?.revenueUsd ?? "0.00",
      todayOrders: todayEntry?.orderCount ?? 0,
      abTests: abTests.slice(0, 3).map((v: any) => ({
        name: v.name ?? "Varianta",
        winner: v.isWinner ? "✓ vítěz" : "probíhá",
        lift: v.conversionRate ?? "—",
      })),
      emailSequence: {
        totalSubscribers: emailSeq?.totalSubscribers ?? 0,
        avgOpenRate: emailSeq?.avgOpenRate ?? "0%",
      },
      health,
    };
  } catch {
    return null;
  }
}

// ─── LeadOS Stats ─────────────────────────────────────────────────────────────

async function fetchLeadOsStats(): Promise<{
  totalLeads: number;
  newToday: number;
  pipelineValue: string;
} | null> {
  try {
    const { getLeadStats } = await import("./db");
    // getLeadStats returns { total, enriched, enrichmentRate, sessions }
    const stats = await getLeadStats("1"); // owner id
    return {
      totalLeads: stats?.total ?? 0,
      newToday: 0, // simplified — no per-day breakdown in getLeadStats
      pipelineValue: "N/A",
    };
  } catch {
    return null;
  }
}

// ─── Generate Digest ─────────────────────────────────────────────────────────

export async function generateDailyDigest(): Promise<string> {
  const [dsr, leadOs] = await Promise.all([fetchDsrData(), fetchLeadOsStats()]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("cs-CZ", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Prague",
  });

  const dsrSection = dsr
    ? `
**DeepSleepReset — aktuální výkon:**
- Celkové tržby: $${dsr.totalRevenueUsd}
- Objednávky celkem: ${dsr.totalOrders}
- Dnešní tržby: $${dsr.todayRevenue} (${dsr.todayOrders} objednávek)
- Konverzní poměr: ${dsr.conversionRate}
- Leady celkem: ${dsr.totalLeads}
- Email sekvence: ${dsr.emailSequence.totalSubscribers} odběratelů, průměrný open rate ${dsr.emailSequence.avgOpenRate}
- Stav systému: ${dsr.health}
${dsr.abTests.length > 0 ? `- A/B testy: ${dsr.abTests.map((t) => `${t.name} (${t.winner}, CVR: ${t.lift})`).join("; ")}` : ""}
`
    : "DeepSleepReset: data nedostupná (zkontroluj API klíč).\n";

  const leadOsSection = leadOs
    ? `
**LeadOS — aktuální stav:**
- Celkem leadů v systému: ${leadOs.totalLeads}
`
    : "";

  const systemPrompt = `Jsi HERMES — core AI orchestrační agent platformy LeadOS. VŽDY píšeš VÝHRADNĚ v češtině. Nikdy nepoužíváš angličtinu ani žádný jiný jazyk. Jsi stručný, přímý, analytický. Bez pozdravu, bez zbytečných frází. Celý výstup musí být česky — každé slovo.`;

  const userPrompt = `Dnes je ${dateStr}. Vygeneruj ranní přehled výkonu projektů na základě těchto dat:

${dsrSection}
${leadOsSection}

Struktura přehledu:
1. **Klíčové číslo dne** — jedno nejdůležitější číslo s krátkým komentářem
2. **DeepSleepReset** — 3-4 věty: co funguje, co je slabé, trend
3. **LeadOS** — 1-2 věty o stavu platformy
4. **Priorita dnes** — 2-3 konkrétní akce pro maximalizaci výkonu
5. **Rizika** — 1-2 věci, na které si dát pozor

Maximálně 250 slov. Žádné nadpisy s #, použij **tučné** pro sekce.

DŮLEŽITÉ: Celý přehled piš VÝHRADNĚ česky. Žádná anglická slova ani fráze.`;

  const result = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  return result.choices?.[0]?.message?.content ?? "Digest se nepodařilo vygenerovat.";
}

// ─── Send Digest ─────────────────────────────────────────────────────────────

export async function sendDailyDigest(): Promise<void> {
  console.log("[HERMES Digest] Generating daily digest...");

  try {
    const content = await generateDailyDigest();

    const now = new Date();
    const dateLabel = now.toLocaleDateString("cs-CZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Prague",
    });

    // Store digest in hermes_messages for history
    try {
      // Find or create the digest session
      const db = await getDb();
      let digestSession = await db
        .select()
        .from(hermesSessions)
        .where(eq(hermesSessions.intent, "daily_digest"))
        .orderBy(desc(hermesSessions.createdAt))
        .limit(1)
        .then((rows) => rows[0]);

      if (!digestSession) {
        const [newSession] = await db
          .insert(hermesSessions)
          .values({
            userId: 1, // owner
            intent: "daily_digest",
            plan: "Automatický denní přehled výkonu projektů",
            result: null,
            subAgentsUsed: JSON.stringify(["Data Analyst", "Strategic Orchestrator"]),
          })
          .$returningId();
        digestSession = await db
          .select()
          .from(hermesSessions)
          .where(eq(hermesSessions.id, newSession.id))
          .then((rows) => rows[0]);
      }

      if (digestSession) {
        await db.insert(hermesMessages).values({
          sessionId: digestSession.id,
          role: "hermes",
          content,
          agentName: "HERMES Daily Digest",
          metadata: JSON.stringify({ type: "daily_digest", date: now.toISOString() }),
        });
      }
    } catch (dbErr) {
      console.warn("[HERMES Digest] Could not store digest in DB:", dbErr);
    }

    // Send push notification
    await notifyOwner({
      title: `⚡ HERMES Ranní přehled — ${dateLabel}`,
      content,
    });

    console.log("[HERMES Digest] Daily digest sent successfully.");
  } catch (err) {
    console.error("[HERMES Digest] Failed to generate/send digest:", err);
  }
}
