/**
 * Global Earnings Router
 * Aggregates revenue from all connected projects:
 *  - DeepSleepReset (via Management API — values are in CZK despite "Usd" field names)
 *  - LeadOS internal (Stripe orders stored in DB, if any)
 *
 * NOTE: DSR API field names contain "Usd" but the actual currency is CZK (czk).
 * The amountUsd / totalRevenueUsd fields store CZK values — no conversion needed.
 */
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";

const DSR_BASE = "https://deepsleepreset.manus.space/api/v1";

function dsrHeaders() {
  const key = process.env.DEEP_SLEEP_RESET_API_KEY;
  if (!key) return null;
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function fetchDsrAnalytics() {
  const headers = dsrHeaders();
  if (!headers) return null;
  try {
    const res = await fetch(`${DSR_BASE}/analytics`, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchDsrHealth() {
  try {
    const res = await fetch(`${DSR_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export type ProjectEarnings = {
  id: string;
  name: string;
  url: string;
  currency: string;
  totalRevenue: number;
  todayRevenue: number;
  last7dRevenue: number;
  last30dRevenue: number;
  totalOrders: number;
  conversionRate: number;
  status: "online" | "offline" | "unconfigured";
  lastUpdated: string;
};

export type GlobalEarningsResult = {
  projects: ProjectEarnings[];
  totals: {
    totalRevenue: number;
    todayRevenue: number;
    last7dRevenue: number;
    last30dRevenue: number;
    totalOrders: number;
  };
  generatedAt: string;
};

export const globalEarningsRouter = router({
  // Lightweight summary for the sticky earnings bar in DashboardLayout
  // Values are in haléře (CZK cents) — divide by 100 to get Kč
  summary: protectedProcedure.query(async () => {
    const dsrAnalytics = await fetchDsrAnalytics();
    const kpis = dsrAnalytics?.kpis;
    // DSR API stores CZK values in "Usd" fields — no conversion needed, just parse
    const dsrTotal = kpis ? Math.round(parseFloat(kpis.totalRevenueUsd ?? "0") * 100) : 0;
    const dsrToday = kpis ? Math.round(parseFloat(kpis.todayRevenueUsd ?? "0") * 100) : 0;
    const dsrLast30d = kpis ? Math.round(parseFloat(kpis.last30DaysRevenueUsd ?? "0") * 100) : 0;
    const projectCount = dsrHeaders() ? 2 : 1; // DSR + LeadOS
    return {
      totalRevenueCents: dsrTotal,       // all-time total in haléře (CZK)
      todayRevenueCents: dsrToday,       // today only in haléře (CZK)
      last30dRevenueCents: dsrLast30d,   // last 30 days in haléře (CZK)
      projectCount,
      lastUpdated: new Date().toISOString(),
    };
  }),

  snapshot: protectedProcedure.query(async (): Promise<GlobalEarningsResult> => {
    const now = new Date().toISOString();

    // ── Fetch all sources in parallel ────────────────────────────────────────
    const [dsrAnalytics, dsrHealth] = await Promise.all([
      fetchDsrAnalytics(),
      fetchDsrHealth(),
    ]);

    const projects: ProjectEarnings[] = [];

    // ── DeepSleepReset ───────────────────────────────────────────────────────
    if (!dsrHeaders()) {
      projects.push({
        id: "deep-sleep-reset",
        name: "DeepSleepReset",
        url: "https://deep-sleep-reset.com",
        currency: "CZK",
        totalRevenue: 0,
        todayRevenue: 0,
        last7dRevenue: 0,
        last30dRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        status: "unconfigured",
        lastUpdated: now,
      });
    } else {
      const isOnline = dsrHealth?.status === "ok";
      const kpis = dsrAnalytics?.kpis;
      // DSR API "Usd" fields actually contain CZK values — no conversion
      projects.push({
        id: "deep-sleep-reset",
        name: "DeepSleepReset",
        url: "https://deep-sleep-reset.com",
        currency: "CZK",
        totalRevenue: kpis ? parseFloat(kpis.totalRevenueUsd ?? "0") : 0,
        todayRevenue: kpis ? parseFloat(kpis.todayRevenueUsd ?? "0") : 0,
        last7dRevenue: kpis ? parseFloat(kpis.last7DaysRevenueUsd ?? "0") : 0,
        last30dRevenue: kpis ? parseFloat(kpis.last30DaysRevenueUsd ?? "0") : 0,
        totalOrders: kpis?.totalOrders ?? 0,
        conversionRate: kpis?.conversionRatePct ?? 0,
        status: isOnline ? "online" : "offline",
        lastUpdated: now,
      });
    }

    // ── LeadOS (placeholder — Stripe revenue from DB can be added here) ──────
    projects.push({
      id: "leadOS",
      name: "LeadOS",
      url: "https://leadOS.manus.space",
      currency: "CZK",
      totalRevenue: 0,
      todayRevenue: 0,
      last7dRevenue: 0,
      last30dRevenue: 0,
      totalOrders: 0,
      conversionRate: 0,
      status: "online",
      lastUpdated: now,
    });

    // ── Aggregate totals ─────────────────────────────────────────────────────
    const totals = projects.reduce(
      (acc, p) => ({
        totalRevenue: acc.totalRevenue + p.totalRevenue,
        todayRevenue: acc.todayRevenue + p.todayRevenue,
        last7dRevenue: acc.last7dRevenue + p.last7dRevenue,
        last30dRevenue: acc.last30dRevenue + p.last30dRevenue,
        totalOrders: acc.totalOrders + p.totalOrders,
      }),
      { totalRevenue: 0, todayRevenue: 0, last7dRevenue: 0, last30dRevenue: 0, totalOrders: 0 }
    );

    return { projects, totals, generatedAt: now };
  }),

  // ─── getHealth: project health status summary ──────────────────────────────
  getHealth: protectedProcedure
    .input(z.object({ dateRange: z.enum(["7d", "30d", "90d"]).optional() }))
    .query(async () => {
      const [dsrAnalytics, dsrHealth] = await Promise.all([
        fetchDsrAnalytics(),
        fetchDsrHealth(),
      ]);
      const projects = [];
      // DSR project health
      if (dsrHeaders()) {
        const isOnline = dsrHealth?.status === "ok";
        projects.push({
          id: "deep-sleep-reset",
          name: "DeepSleepReset",
          status: isOnline ? "healthy" : "warning",
          uptime: isOnline ? 99.9 : 0,
          lastCheck: new Date().toISOString(),
        });
      } else {
        projects.push({
          id: "deep-sleep-reset",
          name: "DeepSleepReset",
          status: "warning",
          uptime: 0,
          lastCheck: new Date().toISOString(),
        });
      }
      // LeadOS health (always online)
      projects.push({
        id: "leadOS",
        name: "LeadOS",
        status: "healthy",
        uptime: 99.9,
        lastCheck: new Date().toISOString(),
      });
      const healthy = projects.filter(p => p.status === "healthy").length;
      const warning = projects.filter(p => p.status === "warning").length;
      const critical = projects.filter(p => p.status === "critical").length;
      return { healthy, warning, critical, projects };
    }),

  // ─── getAnalytics: full analytics with timeline and project breakdown ──────
  getAnalytics: protectedProcedure
    .input(z.object({ dateRange: z.enum(["7d", "30d", "90d"]).optional() }))
    .query(async ({ input }) => {
      const range = input.dateRange ?? "30d";
      const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
      const [dsrAnalytics, dsrHealth] = await Promise.all([
        fetchDsrAnalytics(),
        fetchDsrHealth(),
      ]);
      const kpis = dsrAnalytics?.kpis;
      // DSR API "Usd" fields contain CZK values — no conversion needed
      const dsrRevenueCzk = kpis ? parseFloat(kpis.totalRevenueUsd ?? "0") : 0;
      const dsrTodayCzk = kpis ? parseFloat(kpis.todayRevenueUsd ?? "0") : 0;
      const dsrOrders = kpis?.totalOrders ?? 0;
      const dsrConversion = kpis?.conversionRatePct ?? 0;
      const isOnline = dsrHealth?.status === "ok";

      // Build projects array matching GlobalEarnings.tsx expectations
      const projects = [
        {
          id: "deep-sleep-reset",
          name: "DeepSleepReset",
          description: "Sleep supplement e-commerce",
          revenue: dsrRevenueCzk,
          cost: dsrRevenueCzk * 0.35, // estimated 35% COGS
          roi: dsrRevenueCzk > 0
            ? ((dsrRevenueCzk - dsrRevenueCzk * 0.35) / (dsrRevenueCzk * 0.35)) * 100
            : 0,
          orders: dsrOrders,
          conversionRate: dsrConversion,
          status: dsrHeaders() ? (isOnline ? "active" : "inactive") : "inactive",
        },
        {
          id: "leadOS",
          name: "LeadOS CRM",
          description: "AI Lead Generation SaaS",
          revenue: 0,
          cost: 0,
          roi: 0,
          orders: 0,
          conversionRate: 0,
          status: "active",
        },
      ];

      // Build timeline using real dailyRevenue data from DSR API where available
      const now = Date.now();
      const realDailyMap: Record<string, number> = {};
      if (dsrAnalytics?.dailyRevenue) {
        for (const d of dsrAnalytics.dailyRevenue) {
          // totalCents is in CZK haléře — convert to Kč
          realDailyMap[d.date] = (d.totalCents ?? 0) / 100;
        }
      }

      const timeline = Array.from({ length: days }, (_, i) => {
        const date = new Date(now - (days - 1 - i) * 86400000);
        const dateStr = date.toISOString().slice(0, 10);
        // Use real data if available, otherwise 0 (no fake approximation)
        const dayRevenue = realDailyMap[dateStr] ?? (i === days - 1 ? dsrTodayCzk : 0);
        return {
          date: date.toISOString(),
          revenue: Math.round(dayRevenue),
          cost: Math.round(dayRevenue * 0.35),
        };
      });

      return { projects, timeline, generatedAt: new Date().toISOString() };
    }),
});
