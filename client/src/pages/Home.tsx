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

// ─── Animated Stat Card ──────────────────────────────────────
function AnimatedStatCard({
  title, value, icon, description, color, suffix = "",
}: {
  title: string;
  value: number | null;
  icon: React.ReactNode;
  description: string;
  color: "primary" | "emerald" | "violet" | "amber";
  suffix?: string;
}) {
  const numericValue = typeof value === "number" ? value : 0;
  const animated = useCountUp(numericValue);
  const colorMap = {
    primary: { icon: "text-violet-400", bg: "bg-violet-500/10", glow: "shadow-violet-500/10", border: "border-violet-500/20", bar: "bg-violet-500" },
    emerald: { icon: "text-emerald-400", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-500" },
    violet: { icon: "text-blue-400", bg: "bg-blue-500/10", glow: "shadow-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500" },
    amber: { icon: "text-amber-400", bg: "bg-amber-500/10", glow: "shadow-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-500" },
  };
  const c = colorMap[color];

  return (
    <div className={`relative overflow-hidden rounded-2xl border ${c.border} bg-white/[0.03] backdrop-blur-sm p-5 shadow-lg ${c.glow} group hover:bg-white/[0.05] transition-all duration-300`}>
      {/* Glow orb */}
      <div className={`absolute -top-4 -right-4 w-20 h-20 rounded-full ${c.bg} blur-2xl opacity-60 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-widest">{title}</p>
          <div className={`p-2 rounded-xl ${c.bg}`}>
            <span className={c.icon}>{icon}</span>
          </div>
        </div>
        <div className="flex items-end gap-1">
          {value === null ? (
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          ) : (
            <span className="text-3xl font-black text-white tracking-tight">{animated}{suffix}</span>
          )}
        </div>
        <p className="text-xs text-white/30 mt-1">{description}</p>
        {/* Animated bar */}
        <div className="mt-3 h-0.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full ${c.bar} rounded-full transition-all duration-1000`}
            style={{ width: value !== null ? `${Math.min((numericValue / Math.max(numericValue, 100)) * 100, 100)}%` : "0%" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Pipeline Flow Infographic ───────────────────────────────
function PipelineFlow({ stats }: { stats: any }) {
  const stages = [
    { label: "Generated", value: stats?.totalLeads ?? 0, color: "from-violet-500 to-violet-600", icon: <Zap className="h-3.5 w-3.5" /> },
    { label: "Enriched", value: stats?.enrichedLeads ?? 0, color: "from-blue-500 to-blue-600", icon: <Sparkles className="h-3.5 w-3.5" /> },
    { label: "Contacted", value: Math.floor((stats?.enrichedLeads ?? 0) * 0.6), color: "from-emerald-500 to-emerald-600", icon: <Mail className="h-3.5 w-3.5" /> },
    { label: "Converted", value: Math.floor((stats?.enrichedLeads ?? 0) * 0.15), color: "from-amber-500 to-amber-600", icon: <Star className="h-3.5 w-3.5" /> },
  ];
  const max = stages[0].value || 1;

  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const pct = Math.round((stage.value / max) * 100);
        return (
          <div key={stage.label} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md bg-gradient-to-br ${stage.color} text-white`}>{stage.icon}</div>
                <span className="text-xs font-medium text-white/70">{stage.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">{stage.value.toLocaleString()}</span>
                <span className="text-[10px] text-white/30">{pct}%</span>
              </div>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${stage.color} rounded-full transition-all duration-1000`}
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
        <div className="flex-1 flex items-center justify-center text-white/20 text-xs">{t('dashboard.noSessionsYet')}</div>
      ) : (
        recent.map((s, i) => {
          const h = Math.max(((s.leadsFound ?? 0) / maxLeads) * 100, 8);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 group cursor-default">
              <div
                className="w-full rounded-t-sm bg-gradient-to-t from-violet-600 to-violet-400 opacity-70 group-hover:opacity-100 transition-all duration-300"
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

        {/* ── Hero Header ─────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-900/30 via-[#0f1117] to-blue-900/20 p-6">
          {/* Animated gradient orbs */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-400 font-medium">{t('dashboard.aiSystemsActive')}</span>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{t('dashboard.commandCenter')}</h1>
              <p className="text-white/40 text-sm mt-1">{today}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation("/ai-advisor")}
                className="border-violet-500/40 text-violet-300 hover:bg-violet-500/10 gap-2"
              >
                <Brain className="h-4 w-4" />
                {t('sidebar.aiAdvisor')}
              </Button>
              <Button
                onClick={() => setLocation("/generate")}
                className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white border-0 gap-2 font-semibold shadow-lg shadow-violet-500/20"
              >
                <Zap className="h-4 w-4" />
                {t('sidebar.generateLeads')}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Morning Briefing ────────────────────────────── */}
        {!briefingLoading && (
          <>
            {(!briefing || briefing.dismissed) ? (
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="p-2.5 rounded-xl bg-amber-500/10">
                  <Sun className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">{t('dashboard.morningBriefing')}</p>
                  <p className="text-xs text-white/40">{today} — {t('dashboard.morningBriefingDesc')}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => generateBriefingMutation.mutate()}
                  disabled={generateBriefingMutation.isPending}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 gap-2 shrink-0"
                >
                  {generateBriefingMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  {t('dashboard.generate')}
                </Button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-[#0f1117] to-[#0f1117] p-5">
                <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-amber-500/10">
                        <Sun className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{t('dashboard.morningBriefing')}</h3>
                        <p className="text-xs text-white/40">{today}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => generateBriefingMutation.mutate()} disabled={generateBriefingMutation.isPending} className="h-7 w-7 p-0 text-white/40 hover:text-white">
                        {generateBriefingMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => dismissBriefingMutation.mutate({ id: briefing.id })} className="h-7 w-7 p-0 text-white/40 hover:text-white">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-white/70 mb-4 leading-relaxed">{briefing.content}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {briefing.topLeads?.length > 0 && (
                      <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Target className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-xs font-bold text-blue-400">{t('dashboard.topLeadsToday')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.topLeads.map((lead: string, i: number) => (
                            <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                              <span className="text-blue-400 shrink-0 mt-0.5">›</span>{lead}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {briefing.pipelineAlerts?.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                          <span className="text-xs font-bold text-amber-400">{t('dashboard.pipelineAlerts')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.pipelineAlerts.map((a: string, i: number) => (
                            <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                              <span className="text-amber-400 shrink-0 mt-0.5">›</span>{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {briefing.nextActions?.length > 0 && (
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ListChecks className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">{t('dashboard.nextActions')}</span>
                        </div>
                        <ul className="space-y-1">
                          {briefing.nextActions.map((a: string, i: number) => (
                            <li key={i} className="text-xs text-white/60 flex items-start gap-1.5">
                              <span className="text-emerald-400 shrink-0 mt-0.5">{i + 1}.</span>{a}
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

        {/* ── Animated Stats Row ──────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnimatedStatCard title={t('dashboard.totalLeads')} value={isLoading ? null : stats?.totalLeads ?? 0} icon={<Users className="h-4 w-4" />} description={t('dashboard.allTime')} color="primary" />
          <AnimatedStatCard title={t('dashboard.aiEnriched')} value={isLoading ? null : stats?.enrichedLeads ?? 0} icon={<Sparkles className="h-4 w-4" />} description={t('dashboard.withIcebreakers')} color="emerald" />
          <AnimatedStatCard title={t('dashboard.enrichmentRate')} value={isLoading ? null : enrichmentRate} icon={<TrendingUp className="h-4 w-4" />} description={t('dashboard.leadsWithAI')} color="violet" suffix="%" />
          <AnimatedStatCard title={t('dashboard.sessions')} value={isLoading ? null : stats?.totalSessions ?? 0} icon={<BarChart3 className="h-4 w-4" />} description={t('dashboard.generationRuns')} color="amber" />
        </div>

        {/* ── Pipeline Infographic + Activity ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pipeline Flow */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <TrendingUp className="h-4 w-4 text-violet-400" />
                </div>
                <h2 className="text-sm font-bold text-white">{t('dashboard.pipelineFunnel')}</h2>
              </div>
              <button onClick={() => setLocation("/kanban")} className="text-xs text-white/30 hover:text-violet-400 transition-colors flex items-center gap-1">
                {t('dashboard.viewKanban')} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <PipelineFlow stats={stats} />
          </div>

          {/* Activity Chart */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
                <h2 className="text-sm font-bold text-white">{t('dashboard.recentActivity')}</h2>
            </div>
            <ActivityPulse sessions={sessions ?? []} />
            <p className="text-[10px] text-white/20 mt-2 text-center">{t('dashboard.leadsPerSession')}</p>
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-xs text-white/40">{t('dashboard.avgPerSession')}</span>
              <span className="text-xs font-bold text-white">
                {sessions && sessions.length > 0
                  ? Math.round(sessions.reduce((a, s) => a + (s.leadsFound ?? 0), 0) / sessions.length)
                  : 0} leads
              </span>
            </div>
          </div>
        </div>

        {/* ── NBA + Speed-to-Lead ──────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NBA */}
          <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <Lightbulb className="h-4 w-4 text-amber-400" />
                </div>
                <h2 className="text-sm font-bold text-white">{t('dashboard.nextBestActions')}</h2>
              </div>
              <button onClick={() => setLocation("/next-actions")} className="text-xs text-white/30 hover:text-amber-400 transition-colors flex items-center gap-1">
                {t('dashboard.viewAll')} <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            {nbaLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-5 w-5 animate-spin text-white/20" />
              </div>
            ) : !nbaItems || nbaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center gap-2">
                <Lightbulb className="h-8 w-8 text-white/10" />
                <p className="text-xs text-white/30">{t('dashboard.noRecommendations')}</p>
                <p className="text-[10px] text-white/20">{t('dashboard.generateLeadsForActions')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {nbaItems.map((item: any) => <NbaCard key={item.id} item={item} />)}
              </div>
            )}
          </div>

          {/* Speed-to-Lead */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <Timer className="h-4 w-4 text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-white">{t('sidebar.speedToLead')}</h2>
              </div>
              <button onClick={() => setLocation("/speed-to-lead")} className="text-xs text-white/30 hover:text-emerald-400 transition-colors">
                {t('dashboard.configure')} →
              </button>
            </div>
            {stlConfig ? (
              <div className="space-y-3">
                <div className={`flex items-center gap-2 p-2.5 rounded-xl ${stlConfig.isEnabled ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-white/5 border border-white/10"}`}>
                  <div className={`h-2 w-2 rounded-full ${stlConfig.isEnabled ? "bg-emerald-400 animate-pulse" : "bg-white/20"}`} />
                  <span className={`text-xs font-semibold ${stlConfig.isEnabled ? "text-emerald-400" : "text-white/30"}`}>
                    {stlConfig.isEnabled ? t('dashboard.active') : t('dashboard.inactive')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/5 text-center">
                    <p className="text-lg font-black text-white">{stlConfig.responseTimeMinutes ?? "—"}</p>
                    <p className="text-[10px] text-white/30">{t('dashboard.minResponse')}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 text-center">
                    <p className="text-lg font-black text-white">{stlConfig.maxFollowUps ?? "—"}</p>
                    <p className="text-[10px] text-white/30">{t('dashboard.followUps')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-24 gap-2">
                <Timer className="h-8 w-8 text-white/10" />
                <p className="text-xs text-white/30">{t('dashboard.notConfigured')}</p>
                <button onClick={() => setLocation("/speed-to-lead")} className="text-xs text-emerald-400 hover:underline">{t('dashboard.setUpNow')} →</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Setup Progress + Quick Actions ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Progress */}
          {setupProgress && setupProgress.percentage < 100 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-violet-500/10">
                  <CheckCircle2 className="h-4 w-4 text-violet-400" />
                </div>
                <h2 className="text-sm font-bold text-white">{t('dashboard.setupProgress')}</h2>
                <span className="ml-auto text-xs font-bold text-violet-400">{setupProgress.percentage}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-700"
                  style={{ width: `${setupProgress.percentage}%` }}
                />
              </div>
              <div className="space-y-1.5">
                {setupProgress.steps.map((step: any) => (
                  <button
                    key={step.id}
                    onClick={() => !step.done && setLocation(step.link)}
                    className={`flex items-center gap-2.5 w-full text-left p-2 rounded-lg transition-colors ${step.done ? "opacity-50 cursor-default" : "hover:bg-white/5 cursor-pointer"}`}
                  >
                    <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-emerald-500/20" : "bg-white/5"}`}>
                      {step.done ? <CheckCircle2 className="h-3 w-3 text-emerald-400" /> : <div className="h-1.5 w-1.5 rounded-full bg-white/20" />}
                    </div>
                    <span className={`text-xs ${step.done ? "line-through text-white/20" : "text-white/60"}`}>{step.label}</span>
                    {!step.done && <ChevronRight className="h-3 w-3 text-white/20 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={`rounded-2xl border border-white/10 bg-white/[0.02] p-5 ${setupProgress && setupProgress.percentage < 100 ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <h2 className="text-sm font-bold text-white mb-4">{t('dashboard.quickActions')}</h2>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction icon={<Zap className="h-5 w-5" />} title={t('dashboard.generateLeads')} description={t('dashboard.generateLeadsDesc')} onClick={() => setLocation("/generate")} primary />
              <QuickAction icon={<Users className="h-5 w-5" />} title={t('dashboard.viewPipeline')} description={t('dashboard.viewPipelineDesc')} onClick={() => setLocation("/kanban")} />
              <QuickAction icon={<Lightbulb className="h-5 w-5" />} title={t('dashboard.aiRecommendations')} description={t('dashboard.aiRecommendationsDesc')} onClick={() => setLocation("/next-actions")} />
              <QuickAction icon={<BarChart3 className="h-5 w-5" />} title={t('dashboard.viewStatistics')} description={t('dashboard.viewStatisticsDesc')} onClick={() => setLocation("/stats")} />
            </div>
            {/* AI Advisor Banner */}
            <div
              onClick={() => setLocation("/ai-advisor")}
              className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-violet-500/10 to-blue-500/5 border border-violet-500/20 cursor-pointer hover:border-violet-500/40 transition-all group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                <Brain className="h-5 w-5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{t('dashboard.aiAdvisorPersonas')}</p>
                <p className="text-xs text-white/40">{t('dashboard.aiAdvisorPersonasDesc')}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* ── AI Insights Panel ───────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Agent Actions */}
          <div className="rounded-2xl border border-violet-500/15 bg-violet-500/[0.03] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Cpu className="h-4 w-4 text-violet-400" />
              </div>
              <h2 className="text-sm font-bold text-white">{t('dashboard.aiAgentActions')}</h2>
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-white/20" /></div>
            ) : insights?.recentActions?.length > 0 ? (
              <div className="space-y-2">
                {insights.recentActions.map((action: any, i: number) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Cpu className="h-2.5 w-2.5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/70 leading-relaxed line-clamp-2">{action.action}</p>
                      <p className="text-[10px] text-white/25 mt-0.5">Score: {action.score}/100 · {action.cycleType}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                <Cpu className="h-8 w-8 text-white/10" />
                <p className="text-xs text-white/30">{t('dashboard.noAutonomousActions')}</p>
                <p className="text-[10px] text-white/20">{t('dashboard.aiAgentRunsEvery')}</p>
              </div>
            )}
          </div>

          {/* AI Memory */}
          <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <BookOpen className="h-4 w-4 text-amber-400" />
              </div>
              <h2 className="text-sm font-bold text-white">{t('dashboard.aiMemory')}</h2>
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-white/20" /></div>
            ) : insights?.learnings?.length > 0 ? (
              <div className="space-y-2">
                {insights.learnings.map((item: any) => (
                  <div key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 mt-0.5 ${
                      item.type === "preference" ? "bg-blue-500/20 text-blue-400" :
                      item.type === "learning" ? "bg-emerald-500/20 text-emerald-400" :
                      item.type === "insight" ? "bg-amber-500/20 text-amber-400" :
                      "bg-violet-500/20 text-violet-400"
                    }`}>{item.type}</span>
                    <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                <BookOpen className="h-8 w-8 text-white/10" />
                <p className="text-xs text-white/30">{t('dashboard.noLearnings')}</p>
                <p className="text-[10px] text-white/20">{t('dashboard.chatToBuildMemory')}</p>
              </div>
            )}
          </div>

          {/* AI Performance */}
          <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <Flame className="h-4 w-4 text-emerald-400" />
              </div>
              <h2 className="text-sm font-bold text-white">{t('dashboard.aiPerformance')}</h2>
            </div>
            {insightsLoading ? (
              <div className="flex items-center justify-center h-28"><Loader2 className="h-5 w-5 animate-spin text-white/20" /></div>
            ) : insights ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Avg Score", value: insights.stats.avgScore, color: "text-emerald-400" },
                    { label: "AI Cycles", value: insights.stats.totalCycles, color: "text-violet-400" },
                    { label: "Questions", value: insights.stats.userMessages, color: "text-blue-400" },
                    { label: "Memories", value: insights.learnings?.length ?? 0, color: "text-amber-400" },
                  ].map(m => (
                    <div key={m.label} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                      <p className={`text-xl font-black ${m.color}`}>{m.value}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                {insights.stats.lastActivity && (
                  <p className="text-[10px] text-white/20 text-center">
                    Last activity: {new Date(insights.stats.lastActivity).toLocaleDateString()}
                  </p>
                )}
                <button
                  onClick={() => setLocation("/ai-advisor")}
                  className="w-full text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-1 pt-1"
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
    call: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    email: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    linkedin: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    qualify: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    disqualify: "bg-red-500/10 text-red-400 border-red-500/20",
    wait: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  const priorityColor = item.priority >= 70 ? "text-rose-400" : item.priority >= 40 ? "text-amber-400" : "text-white/30";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors">
      <div className={`p-2 rounded-lg border ${actionColors[item.action] ?? "bg-white/5 text-white/40 border-white/10"}`}>
        {actionIcons[item.action] ?? <Lightbulb className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-white truncate">
            {item.action?.charAt(0).toUpperCase() + item.action?.slice(1)} — Lead #{item.leadId}
          </p>
          <span className={`text-[10px] font-bold ${priorityColor}`}>P{item.priority}</span>
        </div>
        <p className="text-xs text-white/30 truncate mt-0.5">{item.reason}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="h-1.5 w-12 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-violet-500/70" style={{ width: `${item.aiScore ?? 50}%` }} />
        </div>
        <span className="text-[10px] text-white/30 w-6 text-right">{item.aiScore ?? "—"}</span>
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
          ? "border-violet-500/30 bg-gradient-to-br from-violet-500/10 to-blue-500/5 hover:border-violet-500/50"
          : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/15"
      }`}
    >
      <div className={`mt-0.5 ${primary ? "text-violet-400" : "text-white/30"}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/30 mt-0.5">{description}</p>
      </div>
    </button>
  );
}
