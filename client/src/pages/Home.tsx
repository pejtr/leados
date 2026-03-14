import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  BarChart3, Bell, CheckCircle2, Clock, Lightbulb, Loader2,
  Mail, Phone, Sparkles, Timer, TrendingUp, Users, Zap, Linkedin,
  XCircle, ArrowRight, Shield, Brain, ChevronRight, Activity, BookOpen, Star,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.leads.stats.useQuery();
  const { data: sessions } = trpc.leads.sessions.useQuery();
  const { data: nbaItems, isLoading: nbaLoading } = trpc.nba.list.useQuery({ limit: 5 });
  const { data: alerts, isLoading: alertsLoading } = trpc.alertRules.list.useQuery();
  const { data: stlConfig, isLoading: stlLoading } = trpc.speedToLead.get.useQuery();
  const { data: setupProgress, isLoading: setupLoading } = trpc.aiChat.setupProgress.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.aiChat.insights.useQuery();

  const enrichmentRate =
    stats && stats.totalLeads > 0
      ? Math.round((stats.enrichedLeads / stats.totalLeads) * 100)
      : 0;

  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered B2B lead generation overview
            </p>
          </div>
          <Button onClick={() => setLocation("/generate")} className="gap-2">
            <Zap className="h-4 w-4" />
            Generate Leads
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Leads"
            value={isLoading ? null : stats?.totalLeads ?? 0}
            icon={<Users className="h-4 w-4" />}
            description="All time"
            color="primary"
          />
          <StatCard
            title="AI Enriched"
            value={isLoading ? null : stats?.enrichedLeads ?? 0}
            icon={<Sparkles className="h-4 w-4" />}
            description="With icebreakers"
            color="emerald"
          />
          <StatCard
            title="Enrichment Rate"
            value={isLoading ? null : `${enrichmentRate}%`}
            icon={<TrendingUp className="h-4 w-4" />}
            description="Leads with AI content"
            color="violet"
          />
          <StatCard
            title="Sessions"
            value={isLoading ? null : stats?.totalSessions ?? 0}
            icon={<BarChart3 className="h-4 w-4" />}
            description="Generation runs"
            color="amber"
          />
        </div>

        {/* NBA + Speed-to-Lead Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* NBA Recommendations Widget */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-amber-500/10">
                    <Lightbulb className="h-4 w-4 text-amber-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Next Best Actions</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setLocation("/next-actions")}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {nbaLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !nbaItems || nbaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Lightbulb className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No recommendations yet.</p>
                  <p className="text-xs mt-1">Generate leads and get AI-powered action suggestions.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {nbaItems.slice(0, 5).map((item: any) => (
                    <NbaCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Speed-to-Lead Widget */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-cyan-500/10">
                    <Timer className="h-4 w-4 text-cyan-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Speed-to-Lead</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setLocation("/speed-to-lead")}
                >
                  Configure <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stlLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !stlConfig ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Timer className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm text-center">Not configured yet</p>
                  <Button
                    variant="link"
                    className="text-primary text-sm mt-2 h-auto p-0"
                    onClick={() => setLocation("/speed-to-lead")}
                  >
                    Set up instant follow-up →
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${stlConfig.isActive ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/30"}`} />
                      <span className="text-sm font-medium text-foreground">Status</span>
                    </div>
                    <span className={`text-sm font-semibold ${stlConfig.isActive ? "text-emerald-400" : "text-muted-foreground"}`}>
                      {stlConfig.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <StlMetric
                      label="Response Time"
                      value={stlConfig.responseDelaySeconds ? `${stlConfig.responseDelaySeconds}s` : "—"}
                      icon={<Clock className="h-3.5 w-3.5" />}
                    />
                    <StlMetric
                      label="Auto Email"
                      value={stlConfig.autoEmailEnabled ? "On" : "Off"}
                      icon={<Mail className="h-3.5 w-3.5" />}
                    />
                    <StlMetric
                      label="Notifications"
                      value={stlConfig.notifyOnNewLead ? "On" : "Off"}
                      icon={<Bell className="h-3.5 w-3.5" />}
                    />
                    <StlMetric
                      label="Channel"
                      value={stlConfig.notifyChannel ?? "—"}
                      icon={<Shield className="h-3.5 w-3.5" />}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts + Industry + Sessions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Alerts Widget */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-rose-500/10">
                    <Bell className="h-4 w-4 text-rose-400" />
                  </div>
                  <CardTitle className="text-base font-semibold">Smart Alerts</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => setLocation("/alerts")}
                >
                  Manage <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {alertsLoading ? (
                <div className="flex items-center justify-center h-40">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : !alerts || alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No alert rules configured.</p>
                  <Button
                    variant="link"
                    className="text-primary text-sm mt-1 h-auto p-0"
                    onClick={() => setLocation("/alerts")}
                  >
                    Create your first alert →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.slice(0, 5).map((alert: any) => (
                    <div
                      key={alert.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50"
                    >
                      <div className={`h-2 w-2 rounded-full shrink-0 ${alert.isActive ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{alert.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatConditionType(alert.conditionType)} → {alert.channel}
                        </p>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                        alert.isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {alert.isActive ? "ON" : "OFF"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Industry Breakdown */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Industry Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : stats?.industryBreakdown.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No data yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.industryBreakdown.slice(0, 6).map((item) => {
                    const max = stats.industryBreakdown[0]?.count ?? 1;
                    const pct = Math.round((item.count / max) * 100);
                    return (
                      <div key={item.industry} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{item.industry}</span>
                          <span className="text-muted-foreground font-medium">{item.count}</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Sessions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Recent Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Zap className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No sessions yet.</p>
                  <Button
                    variant="link"
                    className="text-primary text-sm mt-1 h-auto p-0"
                    onClick={() => setLocation("/generate")}
                  >
                    Generate your first leads →
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {session.industry}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.location} · {session.generatedCount} leads
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <StatusBadge status={session.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Progress + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Setup Progress Widget */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">Setup Progress</CardTitle>
                </div>
                {!setupLoading && setupProgress && (
                  <span className="text-sm font-bold text-primary">{setupProgress.percentage}%</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {setupLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : setupProgress ? (
                <div className="space-y-3">
                  {/* Progress bar */}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-700"
                      style={{ width: `${setupProgress.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {setupProgress.completed} of {setupProgress.total} steps completed
                  </p>
                  {/* Steps */}
                  <div className="space-y-1.5">
                    {setupProgress.steps.map((step: any) => (
                      <button
                        key={step.id}
                        onClick={() => !step.done && setLocation(step.link)}
                        className={`flex items-center gap-2.5 w-full text-left p-2 rounded-lg transition-colors ${
                          step.done
                            ? "opacity-60 cursor-default"
                            : "hover:bg-accent/50 cursor-pointer"
                        }`}
                      >
                        <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                          step.done ? "bg-emerald-500/20" : "bg-muted"
                        }`}>
                          {step.done ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                          )}
                        </div>
                        <span className={`text-xs ${
                          step.done ? "line-through text-muted-foreground" : "text-foreground"
                        }`}>
                          {step.label}
                        </span>
                        {!step.done && <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <QuickAction
                  icon={<Zap className="h-5 w-5" />}
                  title="Generate Leads"
                  description="Start a new AI lead generation run"
                  onClick={() => setLocation("/generate")}
                  primary
                />
                <QuickAction
                  icon={<Users className="h-5 w-5" />}
                  title="View Pipeline"
                  description="Manage leads in Kanban board"
                  onClick={() => setLocation("/kanban")}
                />
                <QuickAction
                  icon={<Lightbulb className="h-5 w-5" />}
                  title="AI Recommendations"
                  description="Get AI-powered next best actions"
                  onClick={() => setLocation("/next-actions")}
                />
                <QuickAction
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="View Statistics"
                  description="Analyze your performance"
                  onClick={() => setLocation("/stats")}
                />
              </div>
              {/* AI Advisor Banner */}
              <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Brain className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">AI Advisor — 33 Expert Personas</p>
                  <p className="text-xs text-muted-foreground">Get advice from Hormozi, Buffett, Sun Tzu and 30 more</p>
                </div>
                <div className="text-xs text-primary font-medium shrink-0">→ Bottom right</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Autonomous Actions */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-violet-500/10">
                  <Activity className="h-4 w-4 text-violet-400" />
                </div>
                <CardTitle className="text-base font-semibold">AI Agent Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : insights?.recentActions && insights.recentActions.length > 0 ? (
                <div className="space-y-2">
                  {insights.recentActions.map((action: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40">
                      <div className="h-5 w-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <Activity className="h-2.5 w-2.5 text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-relaxed line-clamp-2">{action.action}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Score: {action.score}/100 · {action.cycleType}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                  <Activity className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No autonomous actions yet.</p>
                  <p className="text-[10px] text-muted-foreground/60">The AI agent runs every 6 hours.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Memory Learnings */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10">
                  <BookOpen className="h-4 w-4 text-amber-400" />
                </div>
                <CardTitle className="text-base font-semibold">AI Memory</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : insights?.learnings && insights.learnings.length > 0 ? (
                <div className="space-y-2">
                  {insights.learnings.map((item: any) => (
                    <div key={item.id} className="flex items-start gap-2.5 p-2 rounded-lg bg-secondary/40">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${
                        item.type === 'preference' ? 'bg-blue-500/20 text-blue-400' :
                        item.type === 'learning' ? 'bg-emerald-500/20 text-emerald-400' :
                        item.type === 'insight' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-violet-500/20 text-violet-400'
                      }`}>{item.type}</span>
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">{item.value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-28 text-center gap-2">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No learnings yet.</p>
                  <p className="text-[10px] text-muted-foreground/60">Chat with the AI Advisor to build memory.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                </div>
                <CardTitle className="text-base font-semibold">AI Performance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center h-28">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : insights ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-2xl font-bold text-foreground">{insights.stats.avgScore}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Avg Score</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-2xl font-bold text-foreground">{insights.stats.totalCycles}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">AI Cycles</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-2xl font-bold text-foreground">{insights.stats.userMessages}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Questions Asked</p>
                    </div>
                    <div className="p-3 rounded-lg bg-secondary/40 text-center">
                      <p className="text-2xl font-bold text-foreground">{insights.learnings?.length ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Memories</p>
                    </div>
                  </div>
                  {insights.stats.lastActivity && (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Last activity: {new Date(insights.stats.lastActivity).toLocaleDateString()}
                    </p>
                  )}
                  <button
                    onClick={() => setLocation("/ai-advisor")}
                    className="w-full text-xs text-primary hover:underline text-center py-1"
                  >
                    View full chat history →
                  </button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ─────────────────────────────────────────

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
    call: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    email: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    linkedin: "bg-sky-500/15 text-sky-400 border-sky-500/20",
    qualify: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    disqualify: "bg-red-500/15 text-red-400 border-red-500/20",
    wait: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  const priorityColor = item.priority >= 70 ? "text-rose-400" : item.priority >= 40 ? "text-amber-400" : "text-muted-foreground";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
      <div className={`p-2 rounded-lg border ${actionColors[item.action] ?? "bg-muted text-muted-foreground border-border"}`}>
        {actionIcons[item.action] ?? <Lightbulb className="h-3.5 w-3.5" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {item.action?.charAt(0).toUpperCase() + item.action?.slice(1)} — Lead #{item.leadId}
          </p>
          <span className={`text-[10px] font-bold ${priorityColor}`}>
            P{item.priority}
          </span>
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.reason}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="h-1.5 w-12 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary/70 transition-all"
            style={{ width: `${item.aiScore ?? 50}%` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-6 text-right">{item.aiScore ?? "—"}</span>
      </div>
    </div>
  );
}

function StlMetric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 p-3 rounded-lg bg-secondary/50">
      <div className="text-muted-foreground">{icon}</div>
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

function StatCard({
  title, value, icon, description, color,
}: {
  title: string;
  value: number | string | null;
  icon: React.ReactNode;
  description: string;
  color: "primary" | "emerald" | "violet" | "amber";
}) {
  const colorMap = {
    primary: "text-primary bg-primary/10",
    emerald: "text-emerald-400 bg-emerald-400/10",
    violet: "text-violet-400 bg-violet-400/10",
    amber: "text-amber-400 bg-amber-400/10",
  };
  return (
    <Card className="bg-card border-border">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {value === null ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : value}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    done: "bg-emerald-500/15 text-emerald-400",
    completed: "bg-emerald-500/15 text-emerald-400",
    running: "bg-blue-500/15 text-blue-400",
    error: "bg-red-500/15 text-red-400",
    failed: "bg-red-500/15 text-red-400",
    pending: "bg-yellow-500/15 text-yellow-400",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status}
    </span>
  );
}

function QuickAction({
  icon, title, description, onClick, primary,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all hover:scale-[1.01] ${
        primary
          ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
          : "border-border bg-secondary/30 hover:bg-secondary/60"
      }`}
    >
      <div className={`mt-0.5 ${primary ? "text-primary" : "text-muted-foreground"}`}>{icon}</div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}

function formatConditionType(type: string): string {
  const map: Record<string, string> = {
    high_intent_visitor: "High Intent",
    new_lead_generated: "New Lead",
    lead_status_change: "Status Change",
    deal_closed: "Deal Closed",
    visitor_returning: "Returning Visitor",
    keyword_match: "Keyword Match",
  };
  return map[type] ?? type;
}
