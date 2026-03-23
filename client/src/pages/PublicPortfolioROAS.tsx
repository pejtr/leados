import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { TrendingUp, DollarSign, Target, Megaphone, Trophy, ExternalLink, ShieldCheck } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────
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
function pnoColor(pno: number | null) {
  if (pno === null) return "text-muted-foreground";
  if (pno <= 20) return "text-emerald-400";
  if (pno <= 35) return "text-green-500";
  if (pno <= 60) return "text-yellow-500";
  return "text-red-500";
}
const ROAS_COLORS = ["#10b981", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];
function roasBarColor(roas: number) {
  if (roas >= 3) return ROAS_COLORS[0];
  if (roas >= 2) return ROAS_COLORS[1];
  if (roas >= 1.5) return ROAS_COLORS[2];
  if (roas >= 1) return ROAS_COLORS[3];
  if (roas >= 0.5) return ROAS_COLORS[4];
  return ROAS_COLORS[5];
}

function KpiCard({ label, value, sub, color = "text-foreground", icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: any;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

export default function PublicPortfolioROAS() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = trpc.portfolioShare.getPublicReport.useQuery(
    { token: token ?? "" },
    { enabled: !!token, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Načítám report...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Odkaz není platný</h1>
          <p className="text-muted-foreground text-sm">
            {error?.message ?? "Tento sdílený report neexistuje nebo vypršel."}
          </p>
        </div>
      </div>
    );
  }

  const { portfolio, projects, campaigns, label, generatedAt } = data;

  const campaignsChartData = campaigns
    .filter((c) => c.roas !== null)
    .sort((a, b) => (b.roas ?? 0) - (a.roas ?? 0))
    .slice(0, 10)
    .map((c) => ({ name: c.name.length > 20 ? c.name.slice(0, 20) + "…" : c.name, roas: parseFloat((c.roas ?? 0).toFixed(2)) }));

  const projectsChartData = projects
    .map((p) => {
      const linked = campaigns.filter((c: any) => c.projectId === p.id);
      const spend = linked.reduce((s: number, c: any) => s + c.adSpend, 0);
      const rev = linked.reduce((s: number, c: any) => s + c.revenue, 0);
      const roas = spend > 0 ? rev / spend : null;
      return { name: p.name.length > 16 ? p.name.slice(0, 16) + "…" : p.name, roas: roas ? parseFloat(roas.toFixed(2)) : 0 };
    })
    .filter((p) => p.roas > 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-bold text-foreground text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">
                Vygenerováno: {new Date(generatedAt).toLocaleDateString("cs-CZ")} · LeadOS
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-semibold">Ověřený report</span>
            <a
              href="https://crmleadsystem.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-4 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              crmleadsystem.com <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Portfolio ROAS"
            value={portfolio.roas !== null ? `${portfolio.roas.toFixed(2)}×` : "—"}
            sub={`Ad spend: ${fmt(portfolio.adSpendTotal, "Kč")}`}
            color={roasColor(portfolio.roas)}
            icon={TrendingUp}
          />
          <KpiCard
            label="PNO"
            value={portfolio.pno !== null ? `${portfolio.pno.toFixed(1)}%` : "—"}
            sub="Podíl nákladů na obratu"
            color={pnoColor(portfolio.pno)}
            icon={Target}
          />
          <KpiCard
            label="Ad Spend"
            value={fmt(portfolio.adSpendTotal, "Kč")}
            sub={`${portfolio.adConversions} konverzí`}
            icon={DollarSign}
          />
          <KpiCard
            label="Revenue z reklam"
            value={fmt(portfolio.adRevenueTotal, "Kč")}
            sub={`Zisk: ${fmt(portfolio.adRevenueTotal - portfolio.adSpendTotal, "Kč")}`}
            color="text-emerald-400"
            icon={Megaphone}
          />
        </div>

        {/* Charts */}
        {(campaignsChartData.length > 0 || projectsChartData.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaignsChartData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Top kampaně — ROAS</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignsChartData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} width={110} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                      <Bar dataKey="roas" name="ROAS" radius={[0, 4, 4, 0]}>
                        {campaignsChartData.map((entry, i) => (
                          <Cell key={i} fill={roasBarColor(entry.roas)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {projectsChartData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Projekty — ROAS</h3>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectsChartData} margin={{ left: 0, right: 20, top: 0, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }} />
                      <Bar dataKey="roas" name="ROAS" radius={[4, 4, 0, 0]}>
                        {projectsChartData.map((entry, i) => (
                          <Cell key={i} fill={roasBarColor(entry.roas)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Table */}
        {campaigns.length > 0 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Kampaně</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Kampaň</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ad Spend</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Revenue</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">ROAS</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Konverze</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c, i) => (
                    <tr key={c.id} className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/5" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{c.platform}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{fmt(c.adSpend, c.currency)}</td>
                      <td className="px-5 py-3 text-right text-foreground">{fmt(c.revenue, c.currency)}</td>
                      <td className={`px-5 py-3 text-right font-bold ${roasColor(c.roas)}`}>
                        {c.roas !== null ? `${c.roas.toFixed(2)}×` : "—"}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{c.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Tento report byl vygenerován platformou{" "}
            <a href="https://crmleadsystem.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              LeadOS — crmleadsystem.com
            </a>
            {" "}· AI-powered B2B Lead Generation & Revenue Analytics
          </p>
        </div>
      </div>
    </div>
  );
}
