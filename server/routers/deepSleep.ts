import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";

const DSR_BASE = "https://deep-sleep-reset.com/api/v1";

function dsrHeaders() {
  const key = process.env.DEEP_SLEEP_RESET_API_KEY;
  if (!key) throw new Error("DEEP_SLEEP_RESET_API_KEY not configured");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function dsrFetch(path: string) {
  const res = await fetch(`${DSR_BASE}${path}`, { headers: dsrHeaders() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DSR API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Shapes ──────────────────────────────────────────────────────────────────

export type DsrHealth = {
  status: string;
  project: string;
  version: string;
  timestamp: string;
  endpoints: string[];
};

export type DsrAnalytics = {
  kpis: {
    totalRevenueUsd: string;
    totalOrders: number;
    totalLeads: number;
    convertedLeads: number;
    averageOrderValueUsd: string;
    conversionRatePct: number;
    todayRevenueUsd: string;
    last7DaysRevenueUsd: string;
    last30DaysRevenueUsd: string;
    avgChatRating: number;
    totalSurveys: number;
  };
  funnel: Record<string, { count: number; totalCents: number }>;
  dailyRevenue: { date: string; totalCents: number; orderCount: number }[];
  generatedAt: string;
};

export type DsrLead = {
  id: number;
  email: string;
  source: string;
  abVariant: string | null;
  converted: boolean;
  createdAt: string;
};

export type DsrOrder = {
  id: number;
  email: string;
  productKey: string;
  amountUsd: string;
  currency: string;
  status: string;
  stripeSessionId: string;
  createdAt: string;
};

export type DsrAbVariant = {
  variant: string;
  impressions: number;
  conversions: number;
  cvr: string;
};

export type DsrEmailSequence = {
  summary: {
    totalEnrolled: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  byDay: Record<string, { sent: number; emails: string[] }>;
  recentEnrollments: {
    id: number;
    email: string;
    currentDay: number;
    status: string;
    enrolledAt: string;
  }[];
  generatedAt: string;
};

// ─── Router ──────────────────────────────────────────────────────────────────

export const deepSleepRouter = router({
  /** Public health check (no auth required on DSR side, but we keep it behind protectedProcedure here) */
  health: protectedProcedure.query(async (): Promise<DsrHealth> => {
    const res = await fetch(`${DSR_BASE}/health`);
    return res.json();
  }),

  /** KPIs, funnel, daily revenue */
  analytics: protectedProcedure.query(async (): Promise<DsrAnalytics> => {
    return dsrFetch("/analytics");
  }),

  /** Leads list */
  leads: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ input }): Promise<{ total: number; limit: number; data: DsrLead[] }> => {
      return dsrFetch(`/leads?limit=${input.limit}`);
    }),

  /** Orders list */
  orders: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(500).default(100) }))
    .query(async ({ input }): Promise<{ total: number; limit: number; data: DsrOrder[] }> => {
      return dsrFetch(`/orders?limit=${input.limit}`);
    }),

  /** A/B test variants */
  abTests: protectedProcedure.query(async (): Promise<{ variants: DsrAbVariant[] }> => {
    return dsrFetch("/ab-tests");
  }),

  /** Email sequence stats */
  emailSequence: protectedProcedure.query(async (): Promise<DsrEmailSequence> => {
    return dsrFetch("/email-sequence");
  }),

  /** Last 7 days daily revenue history — for sparkline chart */
  earningsHistory: protectedProcedure.query(async () => {
    const analytics: DsrAnalytics = await dsrFetch("/analytics");
    const daily = analytics.dailyRevenue ?? [];
    // Build exactly 7 days, filling missing days with 0
    const today = new Date();
    const days: { date: string; label: string; revenueUsd: number; orders: number }[] = [];
    const dayNames = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const found = daily.find((r: { date: string; totalCents: number; orderCount: number }) =>
        r.date?.slice(0, 10) === iso
      );
      days.push({
        date: iso,
        label: i === 0 ? "Dnes" : dayNames[d.getDay()],
        revenueUsd: found ? found.totalCents / 100 : 0,
        orders: found?.orderCount ?? 0,
      });
    }
    const totalRevenue7d = days.reduce((s, d) => s + d.revenueUsd, 0);
    const totalOrders7d = days.reduce((s, d) => s + d.orders, 0);
    const peakDay = days.reduce((a, b) => (b.revenueUsd > a.revenueUsd ? b : a), days[0]);
    const avgDailyRevenue = totalRevenue7d / 7;
    return { days, totalRevenue7d, totalOrders7d, peakDay, avgDailyRevenue };
  }),

  /** All data in one call (used by dashboard overview) */
  overview: protectedProcedure.query(async () => {
    const [health, analytics, leads, orders, abTests, emailSequence] = await Promise.all([
      fetch(`${DSR_BASE}/health`).then((r) => r.json()),
      dsrFetch("/analytics"),
      dsrFetch("/leads?limit=500"),
      dsrFetch("/orders?limit=500"),
      dsrFetch("/ab-tests"),
      dsrFetch("/email-sequence"),
    ]);
    return { health, analytics, leads, orders, abTests, emailSequence };
  }),
});
