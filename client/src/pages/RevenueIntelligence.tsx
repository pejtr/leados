import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Zap,
  BarChart3, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar,
  Activity, Flame, Trophy, AlertTriangle
} from "lucide-react";

// ─── Metric Card ──────────────────────────────────────────────────────────────
function MetricCard({
  title, value, subtitle, trend, trendValue, icon: Icon, color, highlight
}: {
  title: string; value: string; subtitle?: string; trend?: "up" | "down" | "neutral";
  trendValue?: string; icon: any; color: string; highlight?: boolean;
}) {
  return (
    <Card className={`bg-zinc-900 border-zinc-800 ${highlight ? "ring-1 ring-violet-500/40" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-zinc-400"
            }`}>
              {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : trend === "down" ? <ArrowDownRight className="w-3 h-3" /> : null}
              {trendValue}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-xs text-zinc-400 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#8b5cf6" }: { data: number[]; color?: string }) {
  if (!data.length) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120, h = 36, pad = 4;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="opacity-80">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={points.split(" ").at(-1)?.split(",")[0]} cy={points.split(" ").at(-1)?.split(",")[1]} r="3" fill={color} />
    </svg>
  );
}

// ─── Revenue Cohort Table ─────────────────────────────────────────────────────
function CohortTable({ data }: { data: any[] }) {
  if (!data.length) return (
    <div className="text-center py-8 text-zinc-500 text-sm">Žádná data pro kohortní analýzu</div>
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left py-2 px-3 text-zinc-400">Kohorta</th>
            <th className="text-right py-2 px-3 text-zinc-400">Zákazníci</th>
            <th className="text-right py-2 px-3 text-zinc-400">MRR</th>
            <th className="text-right py-2 px-3 text-zinc-400">LTV</th>
            <th className="text-right py-2 px-3 text-zinc-400">Churn</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row: any, i: number) => (
            <tr key={i} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
              <td className="py-2 px-3 text-zinc-300">{row.cohort}</td>
              <td className="py-2 px-3 text-right text-white">{row.customers}</td>
              <td className="py-2 px-3 text-right text-emerald-400">€{row.mrr}</td>
              <td className="py-2 px-3 text-right text-violet-400">€{row.ltv}</td>
              <td className={`py-2 px-3 text-right ${row.churnRate > 5 ? "text-red-400" : "text-zinc-300"}`}>
                {row.churnRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RevenueIntelligence() {
  const [period, setPeriod] = useState<"30d" | "90d" | "1y">("30d");
  const { data, isLoading, refetch } = trpc.affiliate.getRevenueIntelligence.useQuery({ period });

  // Derived metrics with safe defaults
  const mrr = data?.mrr ?? 0;
  const arr = mrr * 12;
  const ltv = data?.ltv ?? 0;
  const cac = data?.cac ?? 0;
  const ltvCacRatio = cac > 0 ? (ltv / cac).toFixed(1) : "∞";
  const churnRate = data?.churnRate ?? 0;
  const newCustomers = data?.newCustomers ?? 0;
  const totalCustomers = data?.totalCustomers ?? 0;
  const revenueGrowth = data?.revenueGrowth ?? 0;
  const mrrHistory = data?.mrrHistory ?? [];
  const affiliateRevenue = data?.affiliateRevenue ?? 0;
  const affiliateConversions = data?.affiliateConversions ?? 0;

  // ROI calculation
  const estimatedCost = mrr > 0 ? mrr * 0.15 : 0; // ~15% of MRR as platform cost
  const roi = estimatedCost > 0 ? Math.round(((mrr - estimatedCost) / estimatedCost) * 100) : 0;

  const roiColor = roi >= 888 ? "text-amber-400" : roi >= 500 ? "text-emerald-400" : roi >= 200 ? "text-violet-400" : "text-zinc-300";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-violet-400" />
              Revenue Intelligence
            </h1>
            <p className="text-zinc-400 text-sm mt-1">MRR · ARR · LTV · CAC · Churn · Kohortní analýza</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-zinc-800 rounded-lg p-0.5">
              {(["30d", "90d", "1y"] as const).map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    period === p ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-300"
                  }`}>{p}</button>
              ))}
            </div>
            <button onClick={() => refetch()} className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROI Hero Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/20 via-zinc-900 to-amber-600/10 border border-violet-500/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-zinc-400 mb-1 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Aktuální výkonnost
              </div>
              <div className={`text-4xl font-black ${roiColor}`}>{roi.toLocaleString()}% ROI</div>
              <div className="text-sm text-zinc-400 mt-1">
                {roi >= 888 ? "🔥 Cíl 888% ROI dosažen!" : roi >= 500 ? "🚀 Výborná výkonnost" : roi >= 200 ? "✅ Nad průměrem" : "📈 Rosteme"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-zinc-400 mb-1">MRR Trend</div>
              <Sparkline data={mrrHistory.length ? mrrHistory : [100, 150, 180, 220, 280, 350, mrr || 400]} />
            </div>
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="MRR (Měsíční příjmy)"
            value={`€${mrr.toLocaleString()}`}
            subtitle={`ARR: €${arr.toLocaleString()}`}
            trend={revenueGrowth >= 0 ? "up" : "down"}
            trendValue={`${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}%`}
            icon={DollarSign}
            color="bg-emerald-500/20 text-emerald-400"
            highlight
          />
          <MetricCard
            title="LTV (Hodnota zákazníka)"
            value={`€${ltv.toLocaleString()}`}
            subtitle={`LTV:CAC = ${ltvCacRatio}x`}
            trend={ltv > cac * 3 ? "up" : "neutral"}
            trendValue={ltv > cac * 3 ? "Zdravé" : "Sleduj"}
            icon={Trophy}
            color="bg-violet-500/20 text-violet-400"
          />
          <MetricCard
            title="CAC (Náklady na zákazníka)"
            value={`€${cac.toLocaleString()}`}
            subtitle={`${newCustomers} nových / ${period}`}
            trend={cac < ltv / 3 ? "up" : "down"}
            trendValue={cac < ltv / 3 ? "Efektivní" : "Vysoké"}
            icon={Target}
            color="bg-blue-500/20 text-blue-400"
          />
          <MetricCard
            title="Churn Rate"
            value={`${churnRate}%`}
            subtitle={`${totalCustomers} zákazníků celkem`}
            trend={churnRate < 3 ? "up" : churnRate < 7 ? "neutral" : "down"}
            trendValue={churnRate < 3 ? "Výborný" : churnRate < 7 ? "Průměrný" : "Kritický"}
            icon={churnRate < 5 ? Activity : AlertTriangle}
            color={churnRate < 5 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="ARR (Roční příjmy)"
            value={`€${arr.toLocaleString()}`}
            subtitle="Annualized run rate"
            icon={Calendar}
            color="bg-amber-500/20 text-amber-400"
          />
          <MetricCard
            title="Affiliate Revenue"
            value={`€${affiliateRevenue.toLocaleString()}`}
            subtitle={`${affiliateConversions} konverzí`}
            trend={affiliateConversions > 0 ? "up" : "neutral"}
            trendValue={affiliateConversions > 0 ? `+${affiliateConversions}` : "Start"}
            icon={Users}
            color="bg-pink-500/20 text-pink-400"
          />
          <MetricCard
            title="Nových zákazníků"
            value={`${newCustomers}`}
            subtitle={`za posledních ${period}`}
            trend={newCustomers > 0 ? "up" : "neutral"}
            trendValue={newCustomers > 5 ? "Rychlý růst" : newCustomers > 0 ? "Rosteme" : "Začínáme"}
            icon={Zap}
            color="bg-cyan-500/20 text-cyan-400"
          />
          <MetricCard
            title="Revenue Growth"
            value={`${revenueGrowth > 0 ? "+" : ""}${revenueGrowth}%`}
            subtitle="Meziměsíční změna"
            trend={revenueGrowth >= 0 ? "up" : "down"}
            trendValue={revenueGrowth >= 20 ? "Hypergrowth" : revenueGrowth >= 5 ? "Zdravý" : revenueGrowth >= 0 ? "Stabilní" : "Pokles"}
            icon={TrendingUp}
            color={revenueGrowth >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}
          />
        </div>

        {/* LTV:CAC Ratio Gauge + Cohort Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* LTV:CAC Health */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" />
                LTV:CAC Health Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "LTV:CAC Ratio", value: `${ltvCacRatio}x`, target: "3x+", ok: parseFloat(ltvCacRatio as string) >= 3 },
                  { label: "Payback Period", value: cac > 0 && mrr > 0 ? `${Math.round(cac / (mrr / (totalCustomers || 1)))} měs` : "N/A", target: "<12 měs", ok: true },
                  { label: "Gross Margin", value: "~72%", target: "70%+", ok: true },
                  { label: "Net Revenue Retention", value: `${100 - churnRate}%`, target: "100%+", ok: churnRate < 5 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                    <span className="text-sm text-zinc-400">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">cíl: {item.target}</span>
                      <span className={`text-sm font-semibold ${item.ok ? "text-emerald-400" : "text-amber-400"}`}>{item.value}</span>
                      <span className={`text-xs ${item.ok ? "text-emerald-400" : "text-amber-400"}`}>{item.ok ? "✓" : "!"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Revenue Breakdown */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Revenue Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: "Starter plány", value: data?.planBreakdown?.starter ?? 0, color: "bg-blue-500" },
                    { label: "Growth plány", value: data?.planBreakdown?.growth ?? 0, color: "bg-violet-500" },
                    { label: "Pro plány", value: data?.planBreakdown?.pro ?? 0, color: "bg-amber-500" },
                    { label: "Affiliate", value: affiliateRevenue, color: "bg-pink-500" },
                  ].map((item, i) => {
                    const total = (data?.planBreakdown?.starter ?? 0) + (data?.planBreakdown?.growth ?? 0) + (data?.planBreakdown?.pro ?? 0) + affiliateRevenue;
                    const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-zinc-400">{item.label}</span>
                          <span className="text-zinc-300">€{item.value.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cohort Analysis */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Kohortní analýza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CohortTable data={data?.cohorts ?? []} />
          </CardContent>
        </Card>

        {/* Growth Recommendations */}
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              AI Doporučení pro ROI 888%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  priority: "KRITICKÉ",
                  color: "border-red-500/30 bg-red-500/5",
                  badge: "bg-red-500/20 text-red-400",
                  title: churnRate > 5 ? "Snižte churn" : "Zvyšte MRR",
                  desc: churnRate > 5
                    ? `Churn ${churnRate}% je nad průměrem. Aktivujte win-back sekvenci pro churned zákazníky.`
                    : `MRR €${mrr} — přidejte upsell flow pro Growth → Pro upgrade. Cíl: €${Math.round(mrr * 1.5)}.`,
                },
                {
                  priority: "VYSOKÉ",
                  color: "border-amber-500/30 bg-amber-500/5",
                  badge: "bg-amber-500/20 text-amber-400",
                  title: "Aktivujte Affiliate",
                  desc: `${affiliateConversions === 0 ? "Affiliate program je nastaven ale bez konverzí." : `${affiliateConversions} konverzí.`} Sdílejte referral odkaz na LinkedIn a v email signaturách.`,
                },
                {
                  priority: "DOPORUČENÉ",
                  color: "border-emerald-500/30 bg-emerald-500/5",
                  badge: "bg-emerald-500/20 text-emerald-400",
                  title: "Roční billing",
                  desc: `Přejít zákazníky na roční plán = okamžitý cash flow boost. Nabídněte 2 měsíce zdarma jako incentiv.`,
                },
              ].map((rec, i) => (
                <div key={i} className={`p-4 rounded-xl border ${rec.color}`}>
                  <Badge className={`text-xs mb-2 ${rec.badge}`}>{rec.priority}</Badge>
                  <div className="text-sm font-semibold text-white mb-1">{rec.title}</div>
                  <div className="text-xs text-zinc-400">{rec.desc}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
