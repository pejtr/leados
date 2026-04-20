import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Bell, CheckCircle2, Clock, Lightbulb, Loader2,
  Mail, Phone, Sparkles, Timer, TrendingUp, Users, Zap, Linkedin,
  XCircle, ArrowRight, Shield, Brain, ChevronRight, Activity, BookOpen, Star,
  Sun, X, RefreshCw, Target, AlertTriangle, ListChecks, Cpu, Flame,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useLocation } from "wouter";

// ─── Animated Counter Hook ───────────────────────────────────
function useCountUp(target: number, duration = 1400) {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration]);

  return count;
}

// ─── Atlantis Stat Card ──────────────────────────────────────
function AnimatedStatCard({
  title, value, icon, description, color, suffix = "",
}: {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  description: string;
  color: "teal" | "emerald" | "indigo" | "amber";
  suffix?: string;
}) {
  const numericValue = typeof value === "number" ? value : 0;
  const animated = useCountUp(numericValue);

  const colorMap = {
    teal:   { icon: "text-[oklch(0.50_0.22_192)]", bg: "bg-[oklch(0.55_0.20_192_/_10%)]", border: "border-[oklch(0.55_0.20_192_/_20%)]", bar: "bg-[oklch(0.55_0.20_192)]", top: "from-[oklch(0.55_0.20_192_/_15%)]" },
    emerald:{ icon: "text-[oklch(0.55_0.18_162)]", bg: "bg-[oklch(0.68_0.18_162_/_10%)]", border: "border-[oklch(0.68_0.18_162_/_20%)]", bar: "bg-[oklch(0.68_0.18_162)]", top: "from-[oklch(0.68_0.18_162_/_12%)]" },
    indigo: { icon: "text-[oklch(0.50_0.24_278)]", bg: "bg-[oklch(0.55_0.24_278_/_10%)]", border: "border-[oklch(0.55_0.24_278_/_20%)]", bar: "bg-[oklch(0.55_0.24_278)]", top: "from-[oklch(0.55_0.24_278_/_12%)]" },
    amber:  { icon: "text-[oklch(0.65_0.20_60)]",  bg: "bg-[oklch(0.72_0.18_60_/_10%)]",  border: "border-[oklch(0.72_0.18_60_/_20%)]",  bar: "bg-[oklch(0.72_0.18_60)]",  top: "from-[oklch(0.72_0.18_60_/_12%)]" },
  };
  const c = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-white shadow-sm hover:shadow-md transition-all duration-300 p-5 group`}>
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${c.top} to-transparent`} />
      {/* Subtle glow orb */}
      <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full ${c.bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className={`p-2 rounded-xl ${c.bg}`}>
            <span className={c.icon}>{icon}</span>
          </div>
        </div>
        <div className="flex items-end gap-1">
          {value === null ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
          ) : (
            <span className="text-3xl font-black text-foreground tracking-tight">{animated}{suffix}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full transition-all duration-1000`}
            style={{ width: value !== null ? `${Math.min((numericValue / Math.max(numericValue, 100)) * 100, 100)}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Flow ───────────────────────────────────────────
function PipelineFlow({ stats }: { stats: any }) {
  const stages = [
    { label: "Generated", value: stats?.totalLeads ?? 0, color: "bg-[oklch(0.55_0.20_192)]", light: "bg-[oklch(0.55_0.20_192_/_10%)]", text: "text-[oklch(0.45_0.20_192)]", icon: <Zap className="h-3.5 w-3.5" /> },
    { label: "Enriched", value: stats?.enrichedLeads ?? 0, color: "bg-[oklch(0.55_0.24_278)]", light: "bg-[oklch(0.55_0.24_278_/_10%)]", text: "text-[oklch(0.45_0.24_278)]", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { label: "Contacted", value: Math.floor((stats?.enrichedLeads ?? 0) * 0.6), color: "bg-[oklch(0.68_0.18_162)]", light: "bg-[oklch(0.68_0.18_162_/_10%)]", text: "text-[oklch(0.50_0.18_162)]", icon: <Mail className="h-3.5 w-3.5" /> },
    { label: "Converted", value: Math.floor((stats?.enrichedLeads ?? 0) * 0.15), color: "bg-[oklch(0.72_0.18_60)]", light: "bg-[oklch(0.72_0.18_60_/_10%)]", text: "text-[oklch(0.55_0.18_60)]", icon: <Star className="h-3.5 w-3.5" /> },
  ];
  const max = stages[0].value || 1;

  return (
    <div className="space-y-3.5">
      {stages.map((stage, i) => {
        const pct = Math.round((stage.value / max) * 100);
        return (
          <div key={stage.label} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${stage.light} ${stage.text}`}>{stage.icon}</div>
                <span className="text-xs font-semibold text-foreground/70">{stage.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">{stage.value.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground w-8 text-right">{pct}%</span>
              </div>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${stage.color} rounded-full transition-all duration-1000`}
                style={{ width: `${pct}%`, transitionDelay: `${i * 150}ms` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Activity Pulse ──────────────────────────────────────────
function ActivityPulse({ sessions }: { sessions: any[] }) {
  const recent = sessions?.slice(0, 7) ?? [];
  const maxLeads = Math.max(...recent.map(s => s.leadsFound ?? 0), 1);
  const { t } = useTranslation();

  return (
    <div className="flex items-end gap-1.5 h-16">
      {recent.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground/50 text-xs">{t('dashboard.noSessionsYet')}</div>
      ) : (
        recent.map((s, i) => {
          const h = Math.max(((s.leadsFound ?? 0) / maxLeads) * 100, 8);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <div
                className="w-full rounded-t-sm bg-[oklch(0.55_0.20_192_/_60%)] group-hover:bg-[oklch(0.55_0.20_192)] transition-all duration-300"
                style={{ height: `${h}%` }}
                title={`${s.leadsFound ?? 0} leads`}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.leads.stats.useQuery();
  const { data: sessions } = trpc.leads.sessions.useQuery();
  const { data: nbaItems, isLoading: nbaLoading } = trpc.nba.list.useQuery({ limit: 5 });
  const { data: alerts } = trpc.alertRules.list.useQuery();
  const { data: stlConfig } = trpc.speedToLead.get.useQuery();
  const { data: setupProgress, isLoading: setupLoading } = trpc.aiChat.setupProgress.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.aiChat.insights.useQuery();
  const { data: briefing, refetch: refetchBriefing, isLoading: briefingLoading } = trpc.morningBriefing.getLatest.useQuery();
  const { data: earningsData } = trpc.globalEarnings.summary.useQuery(undefined, { refetchInterval: 60_000, staleTime: 30_000 });
  const USD_TO_CZK = 25;
  const fmtCZK = (cents: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format((cents / 100) * USD_TO_CZK);
  const generateBriefingMutation = trpc.morningBriefing.generate.useMutation({
    onSuccess: () => { refetchBriefing(); toast.success("Morning briefing generated!"); },
    onError: () => toast.error("Failed to generate briefing"),
  });
  const dismissBriefingMutation = trpc.morningBriefing.dismiss.useMutation({
    onSuccess: () => refetchBriefing(),
  });
  const { t } = useTranslation();
  const today = new Date().toLocaleDateString("cs-CZ", { weekday: "long", month: "long", day: "numeric" });
  const enrichmentRate = stats && stats.totalLeads > 0 ? Math.round((stats.enrichedLeads / stats.totalLeads) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">

        {/* ── Hero Header — Atlantis Command Center ─────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.55_0.20_192_/_20%)] bg-gradient-to-br from-[oklch(0.55_0.20_192_/_8%)] via-white to-[oklch(0.55_0.24_278_/_5%)] p-6 shadow-sm">
          {/* Ambient orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[oklch(0.55_0.20_192_/_8%)] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-[oklch(0.55_0.24_278_/_6%)] rounded-full blur-3xl pointer-events-none" />
          {/* Ancient geometry decoration */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.04] text-[120px] font-black text-[oklch(0.55_0.20_192)] select-none pointer-events-none leading-none">⬡</div>
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-[oklch(0.68_0.18_162)] animate-pulse" />
                <span className="text-xs text-[oklch(0.45_0.18_162)] font-semibold">{t('dashboard.aiSystemsActive')}</span>
              </div>
              <h1 className="text-3xl font-black text-foreground tracking-tight">{t('dashboard.commandCenter')}</h1>
              <p className="text-muted-foreground text-sm mt-1">{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/chat-agent")}
                className="border-[oklch(0.55_0.20_192_/_30%)] text-[oklch(0.45_0.20_192)] hover:bg-[oklch(0.55_0.20_192_/_8%)] gap-2"
              >
                <Brain className="h-4 w-4" />
                {t('sidebar.aiAdvisor')}
              </Button>
              <Button
                onClick={() => setLocation("/generate")}
                className="bg-gradient-to-r from-[oklch(0.50_0.22_192)] to-[oklch(0.52_0.24_220)] hover:from-[oklch(0.55_0.22_192)] hover:to-[oklch(0.57_0.24_220)] text-white border-0 gap-2 font-semibold shadow-lg shadow-[oklch(0.55_0.20_192_/_20%)]"
              >
                <Zap className="h-4 w-4" />
                {t('sidebar.generateLeads')}
              </Button>
            </div>
          </div>
        </div>

        {/* ── CZK Earnings KPI Bar ─────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Dnes */}
          <div className="relative overflow-hidden rounded-xl border border-[oklch(0.68_0.18_162_/_25%)] bg-gradient-to-br from-[oklch(0.68_0.18_162_/_8%)] to-white p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[oklch(0.68_0.18_162)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.50_0.18_162)] mb-1">💰 Dnes</p>
            <p className="text-2xl font-black text-foreground tabular-nums">
              {earningsData ? fmtCZK(earningsData.todayRevenueCents) : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">tržby za dnešek</p>
          </div>
          {/* Posledních 30 dní */}
          <div className="relative overflow-hidden rounded-xl border border-[oklch(0.55_0.20_192_/_25%)] bg-gradient-to-br from-[oklch(0.55_0.20_192_/_8%)] to-white p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[oklch(0.55_0.20_192)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0.20_192)] mb-1">📈 30 dní</p>
            <p className="text-2xl font-black text-foreground tabular-nums">
              {earningsData ? fmtCZK((earningsData as any).last30dRevenueCents ?? 0) : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">posledních 30 dní</p>
          </div>
          {/* Celkem */}
          <div className="relative overflow-hidden rounded-xl border border-[oklch(0.72_0.18_60_/_25%)] bg-gradient-to-br from-[oklch(0.72_0.18_60_/_8%)] to-white p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[oklch(0.72_0.18_60)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.55_0.18_60)] mb-1">🏆 Celkem</p>
            <p className="text-2xl font-black text-foreground tabular-nums">
              {earningsData ? fmtCZK(earningsData.totalRevenueCents) : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">výdělek celkem</p>
          </div>
          {/* Projekty */}
          <div className="relative overflow-hidden rounded-xl border border-[oklch(0.55_0.24_278_/_25%)] bg-gradient-to-br from-[oklch(0.55_0.24_278_/_8%)] to-white p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-[oklch(0.55_0.24_278)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[oklch(0.45_0.24_278)] mb-1">🔗 Projekty</p>
            <p className="text-2xl font-black text-foreground tabular-nums">
              {earningsData ? earningsData.projectCount : <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">aktivní zdroje příjmů</p>
          </div>
        </div>

        {/* ── Morning Briefing ────────────────────────────── */}
        {!briefingLoading && (
          <>
            {(!briefing || briefing.dismissed) ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-[oklch(0.72_0.18_60_/_25%)] bg-[oklch(0.72_0.18_60_/_5%)]">
                <div className="p-2.5 rounded-xl bg-[oklch(0.72_0.18_60_/_12%)]">
                  <Sun className="h-5 w-5 text-[oklch(0.60_0.18_60)]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{t('dashboard.morningBriefing')}</p>
                  <p className="text-xs text-muted-foreground">{today} — {t('dashboard.morningBriefingDesc')}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateBriefingMutation.mutate()}
                  disabled={generateBriefingMutation.isPending}
                  className="bg-[oklch(0.72_0.18_60_/_15%)] hover:bg-[oklch(0.72_0.18_60_/_25%)] text-[oklch(0.50_0.18_60)] border border-[oklch(0.72_0.18_60_/_30%)] gap-2 shrink-0"
                >
                  {generateBriefingMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {t('dashboard.generate')}
                </Button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-[oklch(0.72_0.18_60_/_20%)] bg-gradient-to-br from-[oklch(0.72_0.18_60_/_6%)] to-white p-5 shadow-sm">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[oklch(0.72_0.18_60_/_6%)] rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[oklch(0.72_0.18_60_/_12%)]">
                        <Sun className="h-5 w-5 text-[oklch(0.60_0.18_60)]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{t('dashboard.morningBriefing')}</h3>
                        <p className="text-xs text-muted-foreground">{today}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => generateBriefingMutation.mutate()} disabled={generateBriefingMutation.isPending} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        {generateBriefingMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => dismissBriefingMutation.mutate({ id: briefing.id })} className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 mb-4 leading-relaxed">{briefing.content}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {briefing.topLeads?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[oklch(0.55_0.20_192_/_6%)] border border-[oklch(0.55_0.20_192_/_15%)]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target className="h-3.5 w-3.5 text-[oklch(0.50_0.20_192)]" />
                          <span className="text-xs font-bold text-[oklch(0.45_0.20_192)]">{t('dashboard.topLeadsToday')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.topLeads.map((lead: any, i: number) => (
                            <li key={i} className="text-xs text-foreground/60 flex items-start gap-1.5">
                              <span className="text-[oklch(0.50_0.20_192)] shrink-0 mt-0.5">›</span>
                              <span>{typeof lead === 'object' && lead !== null ? (lead.name || lead.title || lead.company || JSON.stringify(lead)) : String(lead ?? '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {briefing.pipelineAlerts?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[oklch(0.72_0.18_60_/_6%)] border border-[oklch(0.72_0.18_60_/_15%)]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-[oklch(0.60_0.18_60)]" />
                          <span className="text-xs font-bold text-[oklch(0.55_0.18_60)]">{t('dashboard.pipelineAlerts')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.pipelineAlerts.map((a: any, i: number) => (
                            <li key={i} className="text-xs text-foreground/60 flex items-start gap-1.5">
                              <span className="text-[oklch(0.60_0.18_60)] shrink-0 mt-0.5">›</span>
                              <span>{typeof a === 'object' && a !== null ? (a.name || a.alert || a.reason || a.title || JSON.stringify(a)) : String(a ?? '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {briefing.nextActions?.length > 0 && (
                      <div className="p-3 rounded-xl bg-[oklch(0.68_0.18_162_/_6%)] border border-[oklch(0.68_0.18_162_/_15%)]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ListChecks className="h-3.5 w-3.5 text-[oklch(0.50_0.18_162)]" />
                          <span className="text-xs font-bold text-[oklch(0.45_0.18_162)]">{t('dashboard.nextActions')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.nextActions.map((a: any, i: number) => (
                            <li key={i} className="text-xs text-foreground/60 flex items-start gap-1.5">
                              <span className="text-[oklch(0.50_0.18_162)] shrink-0 mt-0.5">{i + 1}.</span>
                              <span>{typeof a === 'object' && a !== null ? (a.action || a.name || a.title || a.reason || JSON.stringify(a)) : String(a ?? '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── Stats Row — Atlantis Data Nodes ─────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard title={t('dashboard.totalLeads')} value={isLoading ? null : stats?.totalLeads ?? 0} icon={<Users className="h-4 w-4" />} description={t('dashboard.allTime')} color="teal" />
          <AnimatedStatCard title={t('dashboard.aiEnriched')} value={isLoading ? null : stats?.enrichedLeads ?? 0} icon={<Sparkles className="h-4 w-4" />} description={t('dashboard.withIcebreakers')} color="emerald" />
          <AnimatedStatCard title={t('dashboard.enrichmentRate')} value={isLoading ? null : enrichmentRate} icon={<TrendingUp className="h-4 w-4" />} description={t('dashboard.leadsWithAI')} color="indigo" suffix="%" />
          <AnimatedStatCard title={t('dashboard.sessions')} value={isLoading ? null : stats?.totalSessions ?? 0} icon={<BarChart3 className="h-4 w-4" />} description={t('dashboard.generationRuns')} color="amber" />
        </div>

        {/* ── Pipeline + Activity ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Flow — large light card */}
          <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[oklch(0.55_0.20_192_/_10%)]">
                  <TrendingUp className="h-4 w-4 text-[oklch(0.50_0.20_192)]" />
                </div>
                <h2 className="text-sm font-bold text-foreground">{t('dashboard.pipelineFunnel')}</h2>
              </div>
              <button onClick={() => setLocation("/kanban")} className="text-xs text-muted-foreground hover:text-[oklch(0.50_0.20_192)] transition-colors flex items-center gap-1">
                {t('dashboard.viewKanban')} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <PipelineFlow stats={stats} />
          </div>

          {/* Activity — dark Atlantis card */}
          <div className="rounded-2xl bg-[oklch(0.14_0.04_240)] border border-[oklch(1_0_0_/_8%)] p-5 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.55_0.20_192_/_50%)] to-transparent" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-[oklch(0.55_0.20_192_/_8%)] rounded-full blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-[oklch(0.55_0.20_192_/_15%)]">
                  <Activity className="h-4 w-4 text-[oklch(0.70_0.18_192)]" />
                </div>
                <h2 className="text-sm font-bold text-[oklch(0.93_0.008_240)]">{t('dashboard.recentActivity')}</h2>
                <div className="ml-auto">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[oklch(0.68_0.18_162_/_20%)] text-[oklch(0.70_0.18_162)] font-semibold">Live</span>
                </div>
              </div>
              <ActivityPulse sessions={sessions ?? []} />
              <p className="text-[10px] text-[oklch(0.93_0.008_240_/_30%)] mt-2 text-center">{t('dashboard.leadsPerSession')}</p>
              <div className="mt-3 pt-3 border-t border-[oklch(1_0_0_/_8%)] flex items-center justify-between">
                <span className="text-xs text-[oklch(0.93_0.008_240_/_50%)]">{t('dashboard.avgPerSession')}</span>
                <span className="text-xs font-bold text-[oklch(0.93_0.008_240)]">
                  {sessions && sessions.length > 0
                    ? Math.round(sessions.reduce((a, s) => a + (s.leadsFound ?? 0), 0) / sessions.length)
                    : 0} leads
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── NBA + Speed-to-Lead ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NBA — violet Atlantis card */}
          <div className="lg:col-span-2 rounded-2xl border border-[oklch(0.55_0.24_278_/_20%)] bg-[oklch(0.88_0.06_278_/_30%)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[oklch(0.55_0.24_278_/_12%)]">
                  <Lightbulb className="h-4 w-4 text-[oklch(0.50_0.24_278)]" />
                </div>
                <h2 className="text-sm font-bold text-foreground">{t('dashboard.nextBestActions')}</h2>
              </div>
              <button onClick={() => setLocation("/next-actions")} className="text-xs text-muted-foreground hover:text-[oklch(0.50_0.24_278)] transition-colors flex items-center gap-1">
                {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {nbaLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" />
              </div>
            ) : !nbaItems || nbaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                <Lightbulb className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{t('dashboard.noRecommendations')}</p>
                <p className="text-[10px] text-muted-foreground/60">{t('dashboard.generateLeadsForActions')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nbaItems.map((item: any) => <NbaCard key={item.id} item={item} />)}
              </div>
            )}
          </div>

          {/* Speed-to-Lead — teal card */}
          <div className="rounded-2xl border border-[oklch(0.68_0.18_162_/_20%)] bg-[oklch(0.72_0.16_192_/_15%)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[oklch(0.68_0.18_162_/_12%)]">
                  <Timer className="h-4 w-4 text-[oklch(0.50_0.18_162)]" />
                </div>
                <h2 className="text-sm font-bold text-foreground">{t('sidebar.speedToLead')}</h2>
              </div>
              <button onClick={() => setLocation("/speed-to-lead")} className="text-xs text-muted-foreground hover:text-[oklch(0.50_0.18_162)] transition-colors">
                {t('dashboard.configure')} →
              </button>
            </div>
            {stlConfig ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-2.5 rounded-xl ${stlConfig.isEnabled ? "bg-[oklch(0.68_0.18_162_/_12%)] border border-[oklch(0.68_0.18_162_/_25%)]" : "bg-muted border border-border"}`}>
                  <div className={`h-2 w-2 rounded-full ${stlConfig.isEnabled ? "bg-[oklch(0.68_0.18_162)] animate-pulse" : "bg-muted-foreground/30"}`} />
                  <span className={`text-xs font-semibold ${stlConfig.isEnabled ? "text-[oklch(0.45_0.18_162)]" : "text-muted-foreground"}`}>
                    {stlConfig.isEnabled ? t('dashboard.active') : t('dashboard.inactive')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/60 text-center border border-border">
                    <p className="text-lg font-black text-foreground">{stlConfig.responseTimeMinutes ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{t('dashboard.minResponse')}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 text-center border border-border">
                    <p className="text-lg font-black text-foreground">{stlConfig.maxFollowUps ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground">{t('dashboard.followUps')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Timer className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{t('dashboard.notConfigured')}</p>
                <button onClick={() => setLocation("/speed-to-lead")} className="text-xs text-[oklch(0.50_0.18_162)] hover:underline">{t('dashboard.setUpNow')} →</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Setup Progress + Quick Actions ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {setupProgress && setupProgress.percentage < 100 && (
            <div className="rounded-2xl border border-border bg-white shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-[oklch(0.55_0.20_192_/_10%)]">
                  <CheckCircle2 className="h-4 w-4 text-[oklch(0.50_0.20_192)]" />
                </div>
                <h2 className="text-sm font-bold text-foreground">{t('dashboard.setupProgress')}</h2>
                <span className="ml-auto text-xs font-bold text-[oklch(0.50_0.20_192)]">{setupProgress.percentage}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[oklch(0.55_0.20_192)] to-[oklch(0.55_0.24_278)] rounded-full transition-all duration-700"
                  style={{ width: `${setupProgress.percentage}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {setupProgress.steps.map((step: any) => (
                  <button
                    key={step.id}
                    onClick={() => !step.done && setLocation(step.link)}
                    className={`flex items-center gap-2.5 w-full text-left p-2 rounded-lg transition-colors ${step.done ? "opacity-50 cursor-default" : "hover:bg-muted cursor-pointer"}`}
                  >
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-[oklch(0.68_0.18_162_/_15%)]" : "bg-muted"}`}>
                      {step.done ? <CheckCircle2 className="h-3 w-3 text-[oklch(0.50_0.18_162)]" /> : <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <span className={`text-xs ${step.done ? "line-through text-muted-foreground/40" : "text-foreground/70"}`}>{step.label}</span>
                    {!step.done && <ChevronRight className="h-3 w-3 text-muted-foreground/40 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`rounded-2xl border border-border bg-white shadow-sm p-5 ${setupProgress && setupProgress.percentage < 100 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <h2 className="text-sm font-bold text-foreground mb-4">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction icon={<Zap className="h-5 w-5" />} title={t('dashboard.generateLeads')} description={t('dashboard.generateLeadsDesc')} onClick={() => setLocation("/generate")} primary />
              <QuickAction icon={<Users className="h-5 w-5" />} title={t('dashboard.viewPipeline')} description={t('dashboard.viewPipelineDesc')} onClick={() => setLocation("/kanban")} />
              <QuickAction icon={<Lightbulb className="h-5 w-5" />} title={t('dashboard.aiRecommendations')} description={t('dashboard.aiRecommendationsDesc')} onClick={() => setLocation("/next-actions")} />
              <QuickAction icon={<BarChart3 className="h-5 w-5" />} title={t('dashboard.viewStatistics')} description={t('dashboard.viewStatisticsDesc')} onClick={() => setLocation("/stats")} />
            </div>
            {/* AI Chat Banner */}
            <div
              onClick={() => setLocation("/chat-agent")}
              className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-[oklch(0.55_0.20_192_/_8%)] to-[oklch(0.55_0.24_278_/_5%)] border border-[oklch(0.55_0.20_192_/_20%)] cursor-pointer hover:border-[oklch(0.55_0.20_192_/_35%)] transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.55_0.20_192_/_15%)] to-[oklch(0.55_0.24_278_/_15%)] flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-[oklch(0.50_0.20_192)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{t('dashboard.aiAdvisorPersonas')}</p>
                <p className="text-xs text-muted-foreground">{t('dashboard.aiAdvisorPersonasDesc')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-[oklch(0.50_0.20_192)] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── AI Insights Panel ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Agent Actions */}
          <div className="rounded-2xl border border-[oklch(0.55_0.20_192_/_20%)] bg-[oklch(0.55_0.20_192_/_5%)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-[oklch(0.55_0.20_192_/_12%)]">
                <Cpu className="h-4 w-4 text-[oklch(0.50_0.20_192)]" />
              </div>
              <h2 className="text-sm font-bold text-foreground">{t('dashboard.aiAgentActions')}</h2>
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.20_192)] animate-pulse" />
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" /></div>
            ) : insights?.recentActions?.length > 0 ? (
              <div className="space-y-2">
                {insights.recentActions.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 border border-[oklch(0.55_0.20_192_/_10%)]">
                    <div className="h-5 w-5 rounded-full bg-[oklch(0.55_0.20_192_/_15%)] flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="h-2.5 w-2.5 text-[oklch(0.50_0.20_192)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">{action.action}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Score: {action.score}/100 · {action.cycleType}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                <Cpu className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{t('dashboard.noAutonomousActions')}</p>
                <p className="text-[10px] text-muted-foreground/60">{t('dashboard.aiAgentRunsEvery')}</p>
              </div>
            )}
          </div>

          {/* AI Memory */}
          <div className="rounded-2xl border border-[oklch(0.72_0.18_60_/_20%)] bg-[oklch(0.72_0.18_60_/_5%)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-[oklch(0.72_0.18_60_/_12%)]">
                <BookOpen className="h-4 w-4 text-[oklch(0.55_0.18_60)]" />
              </div>
              <h2 className="text-sm font-bold text-foreground">{t('dashboard.aiMemory')}</h2>
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" /></div>
            ) : insights?.learnings?.length > 0 ? (
              <div className="space-y-2">
                {insights.learnings.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/60 border border-[oklch(0.72_0.18_60_/_10%)]">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 mt-0.5 ${
                      item.type === "preference" ? "bg-[oklch(0.55_0.20_192_/_12%)] text-[oklch(0.45_0.20_192)]" :
                      item.type === "learning" ? "bg-[oklch(0.68_0.18_162_/_12%)] text-[oklch(0.45_0.18_162)]" :
                      item.type === "insight" ? "bg-[oklch(0.72_0.18_60_/_12%)] text-[oklch(0.50_0.18_60)]" :
                      "bg-[oklch(0.55_0.24_278_/_12%)] text-[oklch(0.45_0.24_278)]"
                    }`}>{item.type}</span>
                    <p className="text-xs text-foreground/60 line-clamp-2 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                <BookOpen className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground">{t('dashboard.noLearnings')}</p>
                <p className="text-[10px] text-muted-foreground/60">{t('dashboard.chatToBuildMemory')}</p>
              </div>
            )}
          </div>

          {/* AI Performance */}
          <div className="rounded-2xl border border-[oklch(0.68_0.18_162_/_20%)] bg-[oklch(0.68_0.18_162_/_5%)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-[oklch(0.68_0.18_162_/_12%)]">
                <Flame className="h-4 w-4 text-[oklch(0.50_0.18_162)]" />
              </div>
              <h2 className="text-sm font-bold text-foreground">{t('dashboard.aiPerformance')}</h2>
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground/40" /></div>
            ) : insights ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Avg Score", value: insights.stats.avgScore, color: "text-[oklch(0.50_0.18_162)]" },
                    { label: "AI Cycles", value: insights.stats.totalCycles, color: "text-[oklch(0.50_0.20_192)]" },
                    { label: "Questions", value: insights.stats.userMessages, color: "text-[oklch(0.50_0.24_278)]" },
                    { label: "Memories", value: insights.learnings?.length ?? 0, color: "text-[oklch(0.55_0.18_60)]" },
                  ].map(m => (
                    <div key={m.label} className="p-2.5 rounded-xl bg-white/60 border border-[oklch(0.68_0.18_162_/_10%)] text-center">
                      <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                {insights.stats.lastActivity && (
                  <p className="text-[10px] text-muted-foreground text-center">
                    Last activity: {new Date(insights.stats.lastActivity).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={() => setLocation("/chat-agent")}
                  className="w-full text-xs text-[oklch(0.50_0.18_162)] hover:text-[oklch(0.45_0.18_162)] transition-colors flex items-center justify-center gap-1 pt-1"
                >
                  {t('dashboard.viewFullChatHistory')} <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function NbaCard({ item }: { item: any }) {
  const actionIcons: Record<string, React.ReactNode> = {
    call: <Phone className="h-3.5 w-3.5" />,
    email: <Mail className="h-3.5 w-3.5" />,
    linkedin: <Linkedin className="h-3.5 w-3.5" />,
    qualify: <CheckCircle2 className="h-3.5 w-3.5" />,
    disqualify: <XCircle className="h-3.5 w-3.5" />,
    wait: <Clock className="h-3.5 w-3.5" />,
  };
  const actionColors: Record<string, string> = {
    call: "bg-[oklch(0.55_0.20_192_/_10%)] text-[oklch(0.45_0.20_192)] border-[oklch(0.55_0.20_192_/_20%)]",
    email: "bg-[oklch(0.55_0.24_278_/_10%)] text-[oklch(0.45_0.24_278)] border-[oklch(0.55_0.24_278_/_20%)]",
    linkedin: "bg-[oklch(0.55_0.20_220_/_10%)] text-[oklch(0.45_0.20_220)] border-[oklch(0.55_0.20_220_/_20%)]",
    qualify: "bg-[oklch(0.68_0.18_162_/_10%)] text-[oklch(0.45_0.18_162)] border-[oklch(0.68_0.18_162_/_20%)]",
    disqualify: "bg-[oklch(0.58_0.22_27_/_10%)] text-[oklch(0.45_0.22_27)] border-[oklch(0.58_0.22_27_/_20%)]",
    wait: "bg-[oklch(0.72_0.18_60_/_10%)] text-[oklch(0.50_0.18_60)] border-[oklch(0.72_0.18_60_/_20%)]",
  };
  const priorityColor = item.priority >= 70 ? "text-[oklch(0.55_0.22_27)]" : item.priority >= 40 ? "text-[oklch(0.55_0.18_60)]" : "text-muted-foreground/40";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/60 border border-border hover:border-[oklch(0.55_0.20_192_/_20%)] transition-colors">
      <div className={`p-2 rounded-lg border ${actionColors[item.action] ?? "bg-muted text-muted-foreground border-border"}`}>
        {actionIcons[item.action] ?? <Lightbulb className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {item.action?.charAt(0).toUpperCase() + item.action?.slice(1)} — Lead #{item.leadId}
          </p>
          <span className={`text-[10px] font-bold ${priorityColor}`}>P{item.priority}</span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.reason}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="h-1.5 w-12 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-[oklch(0.55_0.20_192_/_60%)]" style={{ width: `${item.aiScore ?? 50}%` }} />
        </div>
        <span className="text-[10px] text-muted-foreground w-6 text-right">{item.aiScore ?? "—"}</span>
      </div>
    </div>
  );
}

function QuickAction({
  icon, title, description, onClick, primary,
}: {
  icon: React.ReactNode; title: string; description: string; onClick: () => void; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${
        primary
          ? "border-[oklch(0.55_0.20_192_/_25%)] bg-gradient-to-br from-[oklch(0.55_0.20_192_/_8%)] to-[oklch(0.55_0.24_278_/_5%)] hover:border-[oklch(0.55_0.20_192_/_40%)] shadow-sm"
          : "border-border bg-white hover:bg-muted/30 hover:border-[oklch(0.55_0.20_192_/_15%)] shadow-sm"
      }`}
    >
      <div className={`mt-0.5 ${primary ? "text-[oklch(0.50_0.20_192)]" : "text-muted-foreground/50"}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}
