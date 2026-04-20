import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Activity, DollarSign, Users, ShoppingCart, RefreshCw,
  TrendingUp, Mail, FlaskConical, CheckCircle2, AlertCircle,
  Clock, ArrowUpRight, ExternalLink, Zap, BarChart2,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt$(v: string | number) {
  const n = typeof v === "string" ? parseFloat(v) : v;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("cs-CZ", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  title, value, sub, icon: Icon, accent = false, highlight = false,
}: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; accent?: boolean; highlight?: boolean;
}) {
  return (
    <Card className={cn("relative overflow-hidden", highlight && "border-primary/40 bg-primary/5")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">{title}</p>
            <p className={cn("text-2xl font-bold tabular-nums", accent ? "text-primary" : "text-foreground")}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", accent ? "bg-primary/15" : "bg-muted")}>
            <Icon className={cn("h-5 w-5", accent ? "text-primary" : "text-muted-foreground")} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DeepSleepDashboard() {
  const [tab, setTab] = useState("overview");

  const { data, isLoading, error, refetch, isFetching } = trpc.deepSleep.overview.useQuery(undefined, {
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 min
    staleTime: 60_000,
  });

  const health = data?.health;
  const analytics = data?.analytics;
  const leads = data?.leads;
  const orders = data?.orders;
  const abTests = data?.abTests;
  const emailSeq = data?.emailSequence;

  const kpis = analytics?.kpis;
  const dailyRevenue = analytics?.dailyRevenue ?? [];

  // Build 7-day sparkline data (fill missing days with 0)
  const sparklineData = (() => {
    const today = new Date();
    const dayNames = ["Ne", "Po", "Út", "St", "Čt", "Pá", "So"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const iso = d.toISOString().slice(0, 10);
      const found = dailyRevenue.find((r) => r.date?.slice(0, 10) === iso);
      return {
        date: iso,
        label: i === 6 ? "Dnes" : dayNames[d.getDay()],
        revenue: found ? found.totalCents / 100 : 0,
        orders: found?.orderCount ?? 0,
      };
    });
  })();
  const sparkTotal = sparklineData.reduce((s, d) => s + d.revenue, 0);
  const sparkPeak = sparklineData.reduce((a, b) => (b.revenue > a.revenue ? b : a), sparklineData[0]);
  const sparkAvg = sparkTotal / 7;

  // Sort A/B variants by CVR desc
  const sortedVariants = [...(abTests?.variants ?? [])].sort(
    (a, b) => parseFloat(b.cvr) - parseFloat(a.cvr)
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/15 flex items-center justify-center">
              <Zap className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DeepSleepReset</h1>
              <p className="text-xs text-muted-foreground">Live monitoring · deep-sleep-reset.com</p>
            </div>
            {health && (
              <Badge
                className={cn(
                  "ml-2 text-xs font-medium",
                  health.status === "ok"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                )}
              >
                {health.status === "ok" ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> {health.status}</>
                )}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {health && (
              <span className="text-[11px] text-muted-foreground hidden sm:block">
                v{health.version} · {fmtDateTime(health.timestamp)}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5 text-xs"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" asChild className="gap-1.5 text-xs">
              <a href="https://deep-sleep-reset.com/api/v1/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> API Docs
              </a>
            </Button>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-sm text-rose-400">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Chyba při načítání dat: {error.message}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total Revenue" value={fmt$(kpis.totalRevenueUsd)} icon={DollarSign} accent highlight />
            <KpiCard title="Orders" value={kpis.totalOrders} icon={ShoppingCart} />
            <KpiCard title="Leads" value={kpis.totalLeads} icon={Users} />
            <KpiCard title="Converted" value={kpis.convertedLeads} sub={`${kpis.conversionRatePct}% CVR`} icon={TrendingUp} />
            <KpiCard title="Avg Order" value={fmt$(kpis.averageOrderValueUsd)} icon={ArrowUpRight} />
            <KpiCard title="Last 30d" value={fmt$(kpis.last30DaysRevenueUsd)} sub={`7d: ${fmt$(kpis.last7DaysRevenueUsd)}`} icon={Activity} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-9">
            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
            <TabsTrigger value="leads" className="text-xs">
              Leads {leads?.total != null && <Badge className="ml-1 text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary border-0">{leads.total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-xs">
              Orders {orders?.total != null && <Badge className="ml-1 text-[9px] px-1 py-0 h-4 bg-emerald-500/20 text-emerald-400 border-0">{orders.total}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="abtests" className="text-xs">A/B Tests</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">Email Seq.</TabsTrigger>
          </TabsList>

          {/* ── Overview ─────────────────────────────────────────────────── */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* ── Earnings Sparkline Chart (7 days) ─────────────────── */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-emerald-400" />
                    Revenue — posledních 7 dní
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                      Celkem: <strong className="text-emerald-400 ml-1">{fmt$(sparkTotal)}</strong>
                    </span>
                    <span>Průměr: <strong className="text-foreground ml-1">{fmt$(sparkAvg)}/den</strong></span>
                    {sparkPeak.revenue > 0 && (
                      <span>Peak: <strong className="text-amber-400 ml-1">{sparkPeak.label} ({fmt$(sparkPeak.revenue)})</strong></span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                {/* Area chart — revenue */}
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sparklineData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#94a3b8" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: 8,
                          fontSize: 12,
                        }}
                        labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? fmt$(value) : value,
                          name === "revenue" ? "Revenue" : "Objednávky",
                        ]}
                      />
                      {sparkAvg > 0 && (
                        <ReferenceLine
                          y={sparkAvg}
                          stroke="#f59e0b"
                          strokeDasharray="4 3"
                          label={{ value: "avg", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }}
                        />
                      )}
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#34d399"
                        strokeWidth={2.5}
                        fill="url(#revenueGrad)"
                        dot={{ r: 3, fill: "#34d399", strokeWidth: 0 }}
                        activeDot={{ r: 5, fill: "#34d399", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Bar chart — orders per day */}
                <div style={{ height: 56 }} className="mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparklineData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" hide />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(99,102,241,0.3)",
                          borderRadius: 8,
                          fontSize: 11,
                        }}
                        formatter={(value: number) => [value, "Objednávky"]}
                      />
                      <Bar dataKey="orders" fill="rgba(139,92,246,0.55)" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] text-muted-foreground text-center mt-1">Spodní graf: počet objednávek / den</p>
              </CardContent>
            </Card>

            {/* Funnel */}
            {analytics?.funnel && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(analytics.funnel).map(([key, val]) => (
                      <div key={key} className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-muted/50 border border-border min-w-[120px]">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{key}</span>
                        <span className="text-lg font-bold text-foreground">{val.count}</span>
                        <span className="text-xs text-emerald-400 font-medium">{fmt$(val.totalCents / 100)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Health endpoints */}
            {health?.endpoints && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" /> Available Endpoints
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {health.endpoints.map((ep: string) => (
                      <code key={ep} className="text-[11px] px-2 py-1 rounded-md bg-muted text-muted-foreground font-mono">
                        {ep}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Leads ────────────────────────────────────────────────────── */}
          <TabsContent value="leads" className="mt-4">
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Leads ({leads?.total ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">ID</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Email</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Source</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">A/B Variant</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Converted</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(leads?.data ?? []).map((lead) => (
                        <tr key={lead.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 text-muted-foreground font-mono">#{lead.id}</td>
                          <td className="py-2.5 px-4 text-foreground font-medium">{lead.email}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{lead.source}</Badge>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{lead.abVariant ?? "—"}</td>
                          <td className="py-2.5 px-4">
                            {lead.converted ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{fmtDate(lead.createdAt)}</td>
                        </tr>
                      ))}
                      {(leads?.data ?? []).length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground">Žádné leady</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Orders ───────────────────────────────────────────────────── */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-400" /> Orders ({orders?.total ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">ID</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Email</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Product</th>
                        <th className="text-right py-2.5 px-4 text-muted-foreground font-medium">Amount</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Status</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Date</th>
                        <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Stripe Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(orders?.data ?? []).map((order) => (
                        <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 text-muted-foreground font-mono">#{order.id}</td>
                          <td className="py-2.5 px-4 text-foreground font-medium">{order.email}</td>
                          <td className="py-2.5 px-4">
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">{order.productKey}</Badge>
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">{fmt$(order.amountUsd)}</td>
                          <td className="py-2.5 px-4">
                            <Badge
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-4 border-0",
                                order.status === "completed"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "bg-amber-500/15 text-amber-400"
                              )}
                            >
                              {order.status}
                            </Badge>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground">{fmtDate(order.createdAt)}</td>
                          <td className="py-2.5 px-4">
                            <code className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-[120px] block">
                              {order.stripeSessionId.slice(0, 20)}…
                            </code>
                          </td>
                        </tr>
                      ))}
                      {(orders?.data ?? []).length === 0 && !isLoading && (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-muted-foreground">Žádné objednávky</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── A/B Tests ────────────────────────────────────────────────── */}
          <TabsContent value="abtests" className="mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-violet-400" /> A/B Test Variants ({sortedVariants.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {sortedVariants.map((v, i) => {
                    const cvr = parseFloat(v.cvr);
                    const maxCvr = parseFloat(sortedVariants[0]?.cvr ?? "100");
                    const barWidth = maxCvr > 0 ? Math.min((cvr / maxCvr) * 100, 100) : 0;
                    const isWinner = i === 0 && cvr > 0;
                    return (
                      <div key={v.variant} className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                        isWinner ? "border-violet-500/30 bg-violet-500/5" : "border-border bg-muted/20"
                      )}>
                        <div className="w-32 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono text-foreground font-semibold">{v.variant}</code>
                            {isWinner && (
                              <Badge className="text-[9px] px-1 py-0 h-3.5 bg-violet-500/20 text-violet-400 border-0">winner</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full transition-all", isWinner ? "bg-violet-400" : "bg-primary/60")}
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                            <span className={cn("text-xs font-bold tabular-nums w-12 text-right", isWinner ? "text-violet-400" : "text-foreground")}>
                              {cvr.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex gap-3 text-[10px] text-muted-foreground">
                            <span>{v.impressions} impressions</span>
                            <span>{v.conversions} conversions</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Email Sequence ───────────────────────────────────────────── */}
          <TabsContent value="email" className="mt-4 space-y-4">
            {emailSeq && (
              <>
                {/* Summary cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <KpiCard title="Enrolled" value={emailSeq.summary.totalEnrolled} icon={Mail} />
                  <KpiCard title="Active" value={emailSeq.summary.active} icon={Activity} accent />
                  <KpiCard title="Completed" value={emailSeq.summary.completed} icon={CheckCircle2} />
                  <KpiCard title="Completion Rate" value={`${emailSeq.summary.completionRate}%`} icon={TrendingUp} />
                </div>

                {/* By day */}
                {Object.keys(emailSeq.byDay).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Emails by Day</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(emailSeq.byDay).map(([day, info]) => (
                          <div key={day} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/50">
                            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold text-primary">D{day}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-foreground font-medium">{info.sent} sent</p>
                              <p className="text-[10px] text-muted-foreground truncate">{info.emails.join(", ")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent enrollments */}
                {emailSeq.recentEnrollments.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">Recent Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Email</th>
                            <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Day</th>
                            <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Status</th>
                            <th className="text-left py-2.5 px-4 text-muted-foreground font-medium">Enrolled</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emailSeq.recentEnrollments.map((e) => (
                            <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                              <td className="py-2.5 px-4 text-foreground font-medium">{e.email}</td>
                              <td className="py-2.5 px-4">
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Day {e.currentDay}</Badge>
                              </td>
                              <td className="py-2.5 px-4">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 text-amber-400" />
                                  <span className="text-amber-400 capitalize">{e.status}</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-muted-foreground">{fmtDateTime(e.enrolledAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
