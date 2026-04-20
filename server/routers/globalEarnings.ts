/**
 * Global Earnings Router
 * Aggregates revenue from all connected projects:
 *  - DeepSleepReset (via Management API)
 *  - LeadOS internal (Stripe orders stored in DB, if any)
 *
 * Returns a unified earnings snapshot for the Global Earnings widget.
 */
import { protectedProcedure, router } from "../_core/trpc";

const DSR_BASE = "https://deep-sleep-reset.com/api/v1";

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
    return res.json();
  } catch {
    return null;
  }
}

async function fetchDsrHealth() {
  try {
    const res = await fetch(`${DSR_BASE}/health`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    return res.json();
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
  summary: protectedProcedure.query(async () => {
    const dsrAnalytics = await fetchDsrAnalytics();
    const kpis = dsrAnalytics?.kpis;
    const dsrTotal = kpis ? Math.round(parseFloat(kpis.totalRevenueUsd ?? "0") * 100) : 0;
    const dsrToday = kpis ? Math.round(parseFloat(kpis.todayRevenueUsd ?? "0") * 100) : 0;
    const projectCount = dsrHeaders() ? 2 : 1; // DSR + LeadOS
    return {
      totalRevenueCents: dsrTotal,
      todayRevenueCents: dsrToday,
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
        currency: "USD",
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
      projects.push({
        id: "deep-sleep-reset",
        name: "DeepSleepReset",
        url: "https://deep-sleep-reset.com",
        currency: "USD",
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
    // When Stripe webhooks are set up and orders are stored in DB, query them here.
    // For now we show LeadOS as a project with 0 revenue (not yet tracked).
    projects.push({
      id: "leadOS",
      name: "LeadOS",
      url: "https://leadOS.manus.space",
      currency: "USD",
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
});
