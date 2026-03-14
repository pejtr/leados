import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { BarChart3, Loader2, Sparkles, TrendingUp, Users, Zap } from "lucide-react";

const CHART_COLORS = [
  "oklch(0.62 0.19 264)",
  "oklch(0.68 0.18 180)",
  "oklch(0.72 0.17 140)",
  "oklch(0.75 0.18 60)",
  "oklch(0.65 0.2 320)",
  "oklch(0.70 0.18 30)",
  "oklch(0.67 0.17 220)",
  "oklch(0.73 0.16 100)",
];

export default function Stats() {
  const { t, i18n } = useTranslation();
  const { data: stats, isLoading } = trpc.leads.stats.useQuery();
  const { data: sessions } = trpc.leads.sessions.useQuery();

  const enrichmentRate =
    stats && stats.totalLeads > 0
      ? Math.round((stats.enrichedLeads / stats.totalLeads) * 100)
      : 0;

  const notEnriched = (stats?.totalLeads ?? 0) - (stats?.enrichedLeads ?? 0);

  const pieData = [
    { name: t("stats.enriched"), value: stats?.enrichedLeads ?? 0 },
    { name: t("stats.notEnriched", "Neobohaceno"), value: notEnriched },
  ];

  // Sessions over time (last 10)
  const locale = i18n.language === "cs" ? "cs-CZ" : i18n.language === "de" ? "de-DE" : "en-US";
  const sessionData = (sessions ?? [])
    .slice(0, 10)
    .reverse()
    .map((s) => ({
      date: new Date(s.createdAt).toLocaleDateString(locale, { month: "short", day: "numeric" }),
      leads: s.generatedCount,
      industry: s.industry,
    }));

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("stats.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("stats.subtitle")}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={<Users className="h-4 w-4" />}
                label={t("stats.totalLeads")}
                value={stats?.totalLeads ?? 0}
                color="primary"
              />
              <SummaryCard
                icon={<Sparkles className="h-4 w-4" />}
                label={t("stats.enriched")}
                value={stats?.enrichedLeads ?? 0}
                color="violet"
              />
              <SummaryCard
                icon={<TrendingUp className="h-4 w-4" />}
                label={t("stats.enrichmentRate")}
                value={`${enrichmentRate}%`}
                color="emerald"
              />
              <SummaryCard
                icon={<Zap className="h-4 w-4" />}
                label={t("stats.industries")}
                value={stats?.totalSessions ?? 0}
                color="amber"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Industry Breakdown Bar Chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    {t("stats.leadsByIndustry")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!stats?.industryBreakdown.length ? (
                    <EmptyChart label={t("stats.noData")} />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart
                        data={stats.industryBreakdown.slice(0, 8)}
                        margin={{ top: 5, right: 10, left: -10, bottom: 60 }}
                      >
                        <XAxis
                          dataKey="industry"
                          tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                        />
                        <YAxis tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.17 0.015 264)",
                            border: "1px solid oklch(0.26 0.015 264)",
                            borderRadius: "8px",
                            color: "oklch(0.93 0.01 264)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {stats.industryBreakdown.slice(0, 8).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Enrichment Rate Pie */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    {t("stats.industryBreakdown")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.totalLeads === 0 ? (
                    <EmptyChart label={t("stats.noData")} />
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="45%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          <Cell fill="oklch(0.62 0.19 264)" />
                          <Cell fill="oklch(0.26 0.015 264)" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.17 0.015 264)",
                            border: "1px solid oklch(0.26 0.015 264)",
                            borderRadius: "8px",
                            color: "oklch(0.93 0.01 264)",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span style={{ color: "oklch(0.85 0.01 264)", fontSize: "12px" }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                  {stats && stats.totalLeads > 0 && (
                    <div className="text-center -mt-4">
                      <p className="text-3xl font-bold text-foreground">{enrichmentRate}%</p>
                      <p className="text-xs text-muted-foreground">{t("stats.enrichmentRate").toLowerCase()}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sessions over time */}
            {sessionData.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    {t("stats.leadsOverTime", "Vygenerované leady v čase (posledních 10 sessions)")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sessionData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <XAxis dataKey="date" tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} />
                      <YAxis tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "oklch(0.17 0.015 264)",
                          border: "1px solid oklch(0.26 0.015 264)",
                          borderRadius: "8px",
                          color: "oklch(0.93 0.01 264)",
                          fontSize: "12px",
                        }}
                        formatter={(val, _, props) => [val, props.payload?.industry ?? t("stats.totalLeads")]}
                      />
                      <Bar dataKey="leads" fill="oklch(0.68 0.18 180)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Industry table */}
            {(stats?.industryBreakdown.length ?? 0) > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">{t("stats.industryBreakdown")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("stats.industryBreakdown")}</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("stats.totalLeads")}</th>
                          <th className="text-right py-2 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("stats.share", "Podíl")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats?.industryBreakdown.map((item) => {
                          const share = stats.totalLeads > 0
                            ? Math.round((item.count / stats.totalLeads) * 100)
                            : 0;
                          return (
                            <tr key={item.industry} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                              <td className="py-2.5 px-3 text-foreground">{item.industry}</td>
                              <td className="py-2.5 px-3 text-right font-medium text-foreground">{item.count}</td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                                  </div>
                                  <span className="text-muted-foreground text-xs w-8 text-right">{share}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function SummaryCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: "primary" | "violet" | "emerald" | "amber";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    violet: "text-violet-400 bg-violet-400/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    amber: "text-amber-400 bg-amber-400/10",
  };
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground">
      <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
