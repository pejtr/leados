import { useState, useMemo, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, ReferenceLine,
} from "recharts";
import {
  TrendingUp, DollarSign, Target, Megaphone,
  BarChart3, ArrowUpRight, ArrowDownRight, Minus, Trophy,
  Zap, ArrowRight, AlertTriangle, Download, Calendar, RefreshCw, Share2, Copy, Trash2, ExternalLink, Plus,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// ─── Helpers ─────────────────────────────────────────────────────
function fmt(n: number, currency = "Kč", decimals = 0) {
  return n.toLocaleString("cs-CZ", { maximumFractionDigits: decimals }) + " " + currency;
}
function roasColor(roas: number | null) {
  if (roas === null) return "text-muted-foreground";
  if (roas >= 3) return "text-emerald-400";
  if (roas >= 2) return "text-green-500";
  if (roas >= 1) return "text-yellow-500";
  return "text-red-500";
}
function roasBg(roas: number | null) {
  if (roas === null) return "bg-muted/30";
  if (roas >= 3) return "bg-emerald-500/10 border-emerald-500/20";
  if (roas >= 2) return "bg-green-500/10 border-green-500/20";
  if (roas >= 1) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}
function pnoColor(pno: number | null) {
  if (pno === null) return "text-muted-foreground";
  if (pno <= 20) return "text-emerald-400";
  if (pno <= 35) return "text-green-500";
  if (pno <= 60) return "text-yellow-500";
  return "text-red-500";
}
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-black text-lg">🥇</span>;
  if (rank === 2) return <span className="text-slate-300 font-black text-lg">🥈</span>;
  if (rank === 3) return <span className="text-amber-600 font-black text-lg">🥉</span>;
  return <span className="w-7 h-7 rounded-full bg-muted/40 text-muted-foreground text-xs font-bold flex items-center justify-center">{rank}</span>;
}

// ─── Custom Tooltip ───────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl text-sm">
      <div className="font-bold mb-2 text-foreground">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.stroke }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground">{typeof p.value === "number" ? p.value.toLocaleString("cs-CZ", { maximumFractionDigits: 2 }) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color = "text-foreground", icon: Icon, trend }: {
  label: string; value: string; sub?: string; color?: string; icon: any; trend?: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        {trend === "up" && <ArrowUpRight className="w-4 h-4 text-green-500" />}
        {trend === "down" && <ArrowDownRight className="w-4 h-4 text-red-500" />}
        {trend === "neutral" && <Minus className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ─── Period options ───────────────────────────────────────────────
const PERIODS = [
  { label: "7 dní", days: 7 },
  { label: "30 dní", days: 30 },
  { label: "90 dní", days: 90 },
  { label: "180 dní", days: 180 },
  { label: "365 dní", days: 365 },
];

const ROAS_COLORS = ["#10b981", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
function roasBarColor(roas: number) {
  if (roas >= 3) return ROAS_COLORS[0];
  if (roas >= 2) return ROAS_COLORS[1];
  if (roas >= 1.5) return ROAS_COLORS[2];
  if (roas >= 1) return ROAS_COLORS[3];
  if (roas >= 0.5) return ROAS_COLORS[4];
  return ROAS_COLORS[5];
}

// ─── Main Page ────────────────────────────────────────────────────
export default function PortfolioROAS() {
  const [days, setDays] = useState(30);
  const printRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareLabel, setShareLabel] = useState("Portfolio ROAS Report");
  const [shareExpiry, setShareExpiry] = useState(30);
  const [newShareUrl, setNewShareUrl] = useState<string | null>(null);

  const { data: shareTokens = [], refetch: refetchTokens } = trpc.portfolioShare.listTokens.useQuery();
  const createToken = trpc.portfolioShare.createToken.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/portfolio/share/${data.token}`;
      setNewShareUrl(url);
      refetchTokens();
      toast.success("Share link vytvořen!");
    },
    onError: (e) => toast.error(e.message),
  });
  const revokeToken = trpc.portfolioShare.revokeToken.useMutation({
    onSuccess: () => { refetchTokens(); toast.success("Share link zrušen."); },
  });

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link zkopírován do schránky!");
  };

  const { data: allStats = [], isLoading: loadingStats, refetch: refetchStats } = trpc.projects.getAllStats.useQuery({ days });
  const { data: allCampaigns = [], isLoading: loadingCampaigns, refetch: refetchCampaigns } = trpc.adCampaigns.list.useQuery();

  const isLoading = loadingStats || loadingCampaigns;

  const handleRefresh = useCallback(() => {
    refetchStats();
    refetchCampaigns();
    toast.success("Data obnovena — Portfolio ROAS aktualizováno.");
  }, [refetchStats, refetchCampaigns]);

  // ── PDF Export via browser print ──────────────────────────────────
  const handleExportPDF = useCallback(() => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Povolte pop-upy pro export PDF.");
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try { return Array.from(sheet.cssRules).map((r) => r.cssText).join("\n"); }
        catch { return ""; }
      })
      .join("\n");

    const now = new Date().toLocaleDateString("cs-CZ");
    const periodLabel = PERIODS.find((p) => p.days === days)?.label ?? `${days} dní`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>Portfolio ROAS Report — ${now}</title>
          <style>
            ${styles}
            @page { size: A4; margin: 20mm; }
            body { background: #0f172a !important; color: #f1f5f9 !important; font-family: Inter, sans-serif; }
            .no-print { display: none !important; }
            .print-header { padding: 16px 0 24px; border-bottom: 1px solid #334155; margin-bottom: 24px; }
            .print-header h1 { font-size: 24px; font-weight: 900; color: #f1f5f9; margin: 0 0 4px; }
            .print-header p { font-size: 13px; color: #94a3b8; margin: 0; }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>🏆 Portfolio ROAS Report</h1>
            <p>Vygenerováno: ${now} · Období: ${periodLabel} · LeadOS — crmleadsystem.com</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);

    toast.success("Tiskový dialog otevřen — uložte jako PDF.");
  }, [days]);

  // ── Portfolio-level aggregates ──────────────────────────────────
  const portfolio = useMemo(() => {
    let totalRevenue = 0, totalAdSpend = 0, totalSales = 0, totalProfit = 0;
    for (const { stats } of allStats) {
      totalRevenue += stats.netRevenue;
      totalAdSpend += stats.totalAdSpend;
      totalSales += stats.salesCount;
      totalProfit += stats.netRevenue - stats.totalAdSpend;
    }
    const roas = totalAdSpend > 0 ? totalRevenue / totalAdSpend : null;
    const pno = totalRevenue > 0 ? (totalAdSpend / totalRevenue) * 100 : null;

    let adTotalSpend = 0, adTotalRevenue = 0, adTotalConversions = 0;
    for (const c of allCampaigns) {
      adTotalSpend += parseFloat(c.adSpend as string) || 0;
      adTotalRevenue += parseFloat(c.revenue as string) || 0;
      adTotalConversions += c.conversions;
    }
    const adRoas = adTotalSpend > 0 ? adTotalRevenue / adTotalSpend : null;
    const adPno = adTotalRevenue > 0 ? (adTotalSpend / adTotalRevenue) * 100 : null;
    const adCpa = adTotalConversions > 0 ? adTotalSpend / adTotalConversions : null;

    return { totalRevenue, totalAdSpend, totalSales, totalProfit, roas, pno, adTotalSpend, adTotalRevenue, adTotalConversions, adRoas, adPno, adCpa };
  }, [allStats, allCampaigns]);

  // ── Projects ranked by ROAS ──────────────────────────────────────
  const projectsRanked = useMemo(() => {
    return [...allStats]
      .map(({ project, stats }) => {
        const roas = stats.totalAdSpend > 0 ? stats.netRevenue / stats.totalAdSpend : null;
        const pno = stats.netRevenue > 0 ? (stats.totalAdSpend / stats.netRevenue) * 100 : null;
        const profit = stats.netRevenue - stats.totalAdSpend;
        const linked = allCampaigns.filter((c) => c.projectId === project.id);
        const adSpend = linked.reduce((s, c) => s + (parseFloat(c.adSpend as string) || 0), 0);
        const adRevenue = linked.reduce((s, c) => s + (parseFloat(c.revenue as string) || 0), 0);
        const adRoas = adSpend > 0 ? adRevenue / adSpend : null;
        return { project, stats, roas, pno, profit, adRoas, adSpend, adRevenue, linkedCount: linked.length };
      })
      .sort((a, b) => {
        const ra = a.adRoas ?? a.roas ?? -Infinity;
        const rb = b.adRoas ?? b.roas ?? -Infinity;
        return rb - ra;
      });
  }, [allStats, allCampaigns]);

  // ── Campaigns ranked by ROAS ─────────────────────────────────────
  const campaignsRanked = useMemo(() => {
    return [...allCampaigns]
      .map((c) => {
        const spend = parseFloat(c.adSpend as string) || 0;
        const rev = parseFloat(c.revenue as string) || 0;
        const roas = spend > 0 ? rev / spend : null;
        const pno = rev > 0 ? (spend / rev) * 100 : null;
        const cpa = c.conversions > 0 ? spend / c.conversions : null;
        const linkedProject = allStats.find((s) => s.project.id === c.projectId)?.project;
        return { ...c, roas, pno, cpa, spend, rev, linkedProject };
      })
      .sort((a, b) => (b.roas ?? -Infinity) - (a.roas ?? -Infinity));
  }, [allCampaigns, allStats]);

  // ── Chart data ───────────────────────────────────────────────────
  const projectsChartData = useMemo(() =>
    projectsRanked.map((p) => ({
      name: p.project.name.length > 14 ? p.project.name.slice(0, 14) + "…" : p.project.name,
      "ROAS (ads)": p.adRoas !== null ? parseFloat(p.adRoas.toFixed(2)) : 0,
      "ROAS (events)": p.roas !== null ? parseFloat(p.roas.toFixed(2)) : 0,
      Revenue: parseFloat(p.stats.netRevenue.toFixed(0)),
      "Ad Spend": parseFloat(p.adSpend.toFixed(0)),
    })), [projectsRanked]);

  const campaignsChartData = useMemo(() =>
    campaignsRanked.slice(0, 10).map((c) => ({
      name: c.name.length > 16 ? c.name.slice(0, 16) + "…" : c.name,
      ROAS: c.roas !== null ? parseFloat(c.roas.toFixed(2)) : 0,
      "Ad Spend": parseFloat(c.spend.toFixed(0)),
      Revenue: parseFloat(c.rev.toFixed(0)),
    })), [campaignsRanked]);

  const hasData = allStats.length > 0 || allCampaigns.length > 0;
  const periodLabel = PERIODS.find((p) => p.days === days)?.label ?? `${days} dní`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" /> Portfolio ROAS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified výkonnost všech projektů a kampaní — porovnej, optimalizuj, škáluj.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period filter */}
          <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-xl p-1">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground ml-2" />
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setDays(p.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  days === p.days
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 no-print">
            <RefreshCw className="w-3.5 h-3.5" /> Obnovit
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1.5 no-print">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNewShareUrl(null); setShowShareDialog(true); }} className="gap-1.5 no-print">
            <Share2 className="w-3.5 h-3.5" /> Sdílet report
          </Button>
          <Link href="/ad-campaigns">
            <Button variant="outline" size="sm" className="gap-1.5 no-print">
              <Megaphone className="w-4 h-4" /> Ad Campaigns
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Printable content area ──────────────────────────────── */}
      <div ref={printRef} className="space-y-8">

        {/* Empty state */}
        {!isLoading && !hasData && (
          <div className="border-2 border-dashed border-border rounded-2xl p-14 text-center">
            <BarChart3 className="w-14 h-14 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-bold mb-2">Žádná data k porovnání</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              Přidejte projekty v Command Center a kampaně v Ad Campaigns, pak se zde zobrazí portfolio ROAS přehled.
            </p>
            <div className="flex gap-3 justify-center no-print">
              <Link href="/projects"><Button className="gap-2"><BarChart3 className="w-4 h-4" /> Přidat projekt</Button></Link>
              <Link href="/ad-campaigns"><Button variant="outline" className="gap-2"><Megaphone className="w-4 h-4" /> Přidat kampaň</Button></Link>
            </div>
          </div>
        )}

        {hasData && (
          <>
            {/* ── Period badge ──────────────────────────────────── */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zobrazené období:</span>
              <span className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-0.5 text-xs font-bold">{periodLabel}</span>
              <span className="text-xs text-muted-foreground">· {allStats.length} projektů · {allCampaigns.length} kampaní</span>
            </div>

            {/* ── Portfolio KPIs ──────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard label="Portfolio ROAS" icon={Target}
                value={portfolio.adRoas !== null ? `${portfolio.adRoas.toFixed(2)}×` : portfolio.roas !== null ? `${portfolio.roas.toFixed(2)}×` : "—"}
                color={roasColor(portfolio.adRoas ?? portfolio.roas)}
                sub={`${allStats.length} projektů · ${allCampaigns.length} kampaní`}
                trend={portfolio.adRoas !== null ? (portfolio.adRoas >= 2 ? "up" : portfolio.adRoas >= 1 ? "neutral" : "down") : "neutral"} />
              <KpiCard label="Portfolio PNO" icon={BarChart3}
                value={portfolio.adPno !== null ? `${portfolio.adPno.toFixed(1)}%` : portfolio.pno !== null ? `${portfolio.pno.toFixed(1)}%` : "—"}
                color={pnoColor(portfolio.adPno ?? portfolio.pno)}
                sub="Podíl nákladů na obratu"
                trend={portfolio.adPno !== null ? (portfolio.adPno <= 35 ? "up" : portfolio.adPno <= 60 ? "neutral" : "down") : "neutral"} />
              <KpiCard label="Celkový Ad Spend" icon={Megaphone}
                value={fmt(portfolio.adTotalSpend > 0 ? portfolio.adTotalSpend : portfolio.totalAdSpend)}
                sub={`Revenue: ${fmt(portfolio.adTotalRevenue > 0 ? portfolio.adTotalRevenue : portfolio.totalRevenue)}`}
                trend="neutral" />
              <KpiCard label={`Celkový zisk / ${periodLabel}`} icon={TrendingUp}
                value={fmt(portfolio.totalProfit)}
                color={portfolio.totalProfit >= 0 ? "text-green-500" : "text-red-500"}
                sub={`${portfolio.totalSales} prodejů`}
                trend={portfolio.totalProfit >= 0 ? "up" : "down"} />
            </div>

            {/* ── Charts row ─────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projectsChartData.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" /> ROAS podle projektu — {periodLabel}
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={projectsChartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine y={1} stroke="#eab308" strokeDasharray="4 4" label={{ value: "Break-even", position: "right", fontSize: 10, fill: "#eab308" }} />
                      <ReferenceLine y={2} stroke="#10b981" strokeDasharray="4 4" label={{ value: "2× target", position: "right", fontSize: 10, fill: "#10b981" }} />
                      <Bar dataKey="ROAS (ads)" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {projectsChartData.map((entry, i) => (
                          <Cell key={i} fill={roasBarColor(entry["ROAS (ads)"] || entry["ROAS (events)"])} />
                        ))}
                      </Bar>
                      <Bar dataKey="ROAS (events)" radius={[4, 4, 0, 0]} maxBarSize={40} fill="hsl(var(--muted-foreground)/0.3)" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> ROAS (kampaně)</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-muted-foreground/30 inline-block" /> ROAS (events)</span>
                  </div>
                </div>
              )}

              {campaignsChartData.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-5">
                  <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-primary" /> ROAS podle kampaně (top 10)
                  </h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={campaignsChartData} layout="vertical" barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine x={1} stroke="#eab308" strokeDasharray="4 4" />
                      <Bar dataKey="ROAS" radius={[0, 4, 4, 0]} maxBarSize={20}>
                        {campaignsChartData.map((entry, i) => (
                          <Cell key={i} fill={roasBarColor(entry.ROAS)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ── Spend vs Revenue chart ──────────────────────────── */}
            {projectsChartData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary" /> Ad Spend vs Revenue — {periodLabel}
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={projectsChartData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }} />
                    <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Ad Spend" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ── Projects ranking table ──────────────────────────── */}
            {projectsRanked.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Ranking projektů podle ROAS
                  </h2>
                  <span className="text-xs text-muted-foreground">{periodLabel}</span>
                </div>
                <div className="divide-y divide-border">
                  {projectsRanked.map(({ project, stats, roas, pno, profit, adRoas, adSpend, adRevenue, linkedCount }, i) => {
                    const effectiveRoas = adRoas ?? roas;
                    return (
                      <div key={project.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                        <div className="flex-shrink-0 w-8 flex justify-center">
                          <RankBadge rank={i + 1} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{project.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span>{project.category}</span>
                            {linkedCount > 0 && (
                              <span className="flex items-center gap-0.5 text-blue-400">
                                <Megaphone className="w-3 h-3" /> {linkedCount} kampaní
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={`text-center px-3 py-1.5 rounded-lg border text-sm font-black min-w-[80px] ${roasBg(effectiveRoas)}`}>
                          <div className={roasColor(effectiveRoas)}>{effectiveRoas !== null ? `${effectiveRoas.toFixed(2)}×` : "—"}</div>
                          <div className="text-[10px] text-muted-foreground">ROAS</div>
                        </div>
                        <div className="text-center min-w-[60px] hidden md:block">
                          <div className={`text-sm font-bold ${pnoColor(pno)}`}>{pno !== null ? `${pno.toFixed(1)}%` : "—"}</div>
                          <div className="text-[10px] text-muted-foreground">PNO</div>
                        </div>
                        <div className="text-center min-w-[90px] hidden lg:block">
                          <div className="text-sm font-bold text-foreground">{fmt(adRevenue > 0 ? adRevenue : stats.netRevenue, project.currency)}</div>
                          <div className="text-[10px] text-muted-foreground">Revenue</div>
                        </div>
                        <div className="text-center min-w-[90px] hidden lg:block">
                          <div className={`text-sm font-bold ${profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {profit >= 0 ? "+" : ""}{fmt(profit, project.currency)}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Zisk</div>
                        </div>
                        <Link href="/projects" className="no-print">
                          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Campaigns ranking table ─────────────────────────── */}
            {campaignsRanked.length > 0 && (
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-bold text-sm flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-blue-400" /> Ranking kampaní podle ROAS
                  </h2>
                  <Link href="/ad-campaigns" className="no-print">
                    <Button size="sm" variant="ghost" className="h-7 text-xs gap-1">
                      Spravovat <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
                <div className="divide-y divide-border">
                  {campaignsRanked.map((c, i) => (
                    <div key={c.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                      <div className="flex-shrink-0 w-8 flex justify-center">
                        <RankBadge rank={i + 1} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${c.platform === "meta" ? "bg-blue-500" : c.platform === "google" ? "bg-yellow-500" : "bg-purple-500"}`} />
                          <span className="capitalize">{c.platform}</span>
                          {c.linkedProject && <span className="text-muted-foreground">· {c.linkedProject.name}</span>}
                        </div>
                      </div>
                      <div className={`text-center px-3 py-1.5 rounded-lg border text-sm font-black min-w-[80px] ${roasBg(c.roas)}`}>
                        <div className={roasColor(c.roas)}>{c.roas !== null ? `${c.roas.toFixed(2)}×` : "—"}</div>
                        <div className="text-[10px] text-muted-foreground">ROAS</div>
                      </div>
                      <div className="text-center min-w-[60px] hidden md:block">
                        <div className={`text-sm font-bold ${pnoColor(c.pno)}`}>{c.pno !== null ? `${c.pno.toFixed(1)}%` : "—"}</div>
                        <div className="text-[10px] text-muted-foreground">PNO</div>
                      </div>
                      <div className="text-center min-w-[80px] hidden lg:block">
                        <div className="text-sm font-bold text-foreground">{fmt(c.spend)}</div>
                        <div className="text-[10px] text-muted-foreground">Ad Spend</div>
                      </div>
                      <div className="text-center min-w-[80px] hidden lg:block">
                        <div className="text-sm font-bold text-green-500">{fmt(c.rev)}</div>
                        <div className="text-[10px] text-muted-foreground">Revenue</div>
                      </div>
                      <div className="text-center min-w-[70px] hidden xl:block">
                        <div className="text-sm font-bold text-foreground">{c.cpa !== null ? fmt(c.cpa) : "—"}</div>
                        <div className="text-[10px] text-muted-foreground">CPA</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Insights ────────────────────────────────────────── */}
            {campaignsRanked.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h2 className="font-bold text-sm mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" /> Portfolio Insights — {periodLabel}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {campaignsRanked[0]?.roas !== null && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Nejlepší kampaň</span>
                      </div>
                      <div className="font-bold text-sm truncate">{campaignsRanked[0].name}</div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">{campaignsRanked[0].roas?.toFixed(2)}× ROAS</div>
                      <div className="text-xs text-muted-foreground mt-1">PNO: {campaignsRanked[0].pno?.toFixed(1)}%</div>
                    </div>
                  )}
                  {campaignsRanked.length > 1 && campaignsRanked[campaignsRanked.length - 1].roas !== null && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">Nejhorší kampaň</span>
                      </div>
                      <div className="font-bold text-sm truncate">{campaignsRanked[campaignsRanked.length - 1].name}</div>
                      <div className="text-2xl font-black text-red-400 mt-1">{campaignsRanked[campaignsRanked.length - 1].roas?.toFixed(2)}× ROAS</div>
                      <div className="text-xs text-muted-foreground mt-1">Zvažte optimalizaci nebo pause</div>
                    </div>
                  )}
                  <div className={`rounded-xl p-4 border ${roasBg(portfolio.adRoas ?? portfolio.roas)}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portfolio zdraví</span>
                    </div>
                    <div className={`text-2xl font-black mt-1 ${roasColor(portfolio.adRoas ?? portfolio.roas)}`}>
                      {(portfolio.adRoas ?? portfolio.roas) !== null
                        ? (portfolio.adRoas ?? portfolio.roas)! >= 2 ? "Výborné" : (portfolio.adRoas ?? portfolio.roas)! >= 1 ? "Dobré" : "Potřebuje pozornost"
                        : "Bez dat"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {(portfolio.adRoas ?? portfolio.roas) !== null
                        ? `Portfolio ROAS: ${((portfolio.adRoas ?? portfolio.roas)!).toFixed(2)}×`
                        : "Přidejte kampaně pro analýzu"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Share Report Dialog ──────────────────────────────────── */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="w-4 h-4" /> Sdílet Portfolio ROAS Report</DialogTitle>
            <DialogDescription>Vytvořte read-only odkaz pro sdílení s klienty nebo investory — bez přihlášení.</DialogDescription>
          </DialogHeader>

          {/* New link creation */}
          {!newShareUrl ? (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Název reportu</label>
                <Input value={shareLabel} onChange={(e) => setShareLabel(e.target.value)} placeholder="Portfolio ROAS Report" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Platnost odkazu</label>
                <div className="flex gap-2">
                  {[7, 30, 90, 365].map((d) => (
                    <button key={d} onClick={() => setShareExpiry(d)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        shareExpiry === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
                      }`}>{d === 365 ? "1 rok" : `${d} dní`}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full gap-2" onClick={() => createToken.mutate({ label: shareLabel, expiresInDays: shareExpiry })} disabled={createToken.isPending}>
                <Plus className="w-4 h-4" /> {createToken.isPending ? "Vytváří se..." : "Vytvořit share link"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="text-xs font-semibold text-emerald-400 mb-2">✓ Share link vytvořen</div>
                <div className="flex items-center gap-2">
                  <Input value={newShareUrl} readOnly className="text-xs font-mono" />
                  <Button size="sm" variant="outline" onClick={() => handleCopyLink(newShareUrl!)}><Copy className="w-3.5 h-3.5" /></Button>
                  <a href={newShareUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="w-3.5 h-3.5" /></Button></a>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setNewShareUrl(null)}>Vytvořit další odkaz</Button>
            </div>
          )}

          {/* Existing tokens */}
          {shareTokens.length > 0 && (
            <div className="border-t border-border pt-4 mt-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aktivní share linky</div>
              <div className="space-y-2">
                {shareTokens.filter((t) => t.isActive).map((t) => {
                  const url = `${window.location.origin}/portfolio/share/${t.token}`;
                  return (
                    <div key={t.id} className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate">{t.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {t.expiresAt ? `Vyprší: ${new Date(t.expiresAt).toLocaleDateString("cs-CZ")}` : "Bez expirace"}
                        </div>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => handleCopyLink(url)}><Copy className="w-3 h-3" /></Button>
                      <a href={url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost"><ExternalLink className="w-3 h-3" /></Button></a>
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300" onClick={() => revokeToken.mutate({ id: t.id })}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
