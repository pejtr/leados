import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart3, Loader2, Sparkles, TrendingUp, Users, Zap } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.leads.stats.useQuery();
  const { data: sessions } = trpc.leads.sessions.useQuery();

  const enrichmentRate =
    stats && stats.totalLeads > 0
      ? Math.round((stats.enrichedLeads / stats.totalLeads) * 100)
      : 0;

  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground text-sm mt-1">
              AI-powered B2B lead generation overview
            </p>
          </div>
          <Button
            onClick={() => setLocation("/generate")}
            className="gap-2"
          >
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

        {/* Industry Breakdown + Recent Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <p className="text-sm">No data yet. Generate your first leads.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.industryBreakdown.slice(0, 6).map((item, i) => {
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
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
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
                        <span className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <QuickAction
                icon={<Zap className="h-5 w-5" />}
                title="Generate Leads"
                description="Start a new AI lead generation run"
                onClick={() => setLocation("/generate")}
                primary
              />
              <QuickAction
                icon={<Users className="h-5 w-5" />}
                title="View History"
                description="Browse all previously generated leads"
                onClick={() => setLocation("/history")}
              />
              <QuickAction
                icon={<BarChart3 className="h-5 w-5" />}
                title="View Statistics"
                description="Analyze your lead generation performance"
                onClick={() => setLocation("/stats")}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
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
    running: "bg-blue-500/15 text-blue-400",
    error: "bg-red-500/15 text-red-400",
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
