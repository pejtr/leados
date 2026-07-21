import { useMemo } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  Clock3,
  Command,
  Kanban,
  ListChecks,
  PlugZap,
  RefreshCw,
  Users,
} from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

type AttentionItem = {
  id: string;
  title: string;
  detail: string;
  path: string;
  kind: "approval" | "task" | "recommendation";
  priority: number;
};

const attentionIcons = {
  approval: Command,
  task: CalendarCheck,
  recommendation: CircleDot,
};

const integrationStatus = {
  ready: {
    label: "Připraveno",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  action_required: {
    label: "Vyžaduje nastavení",
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  error: {
    label: "Chyba",
    className: "border-rose-200 bg-rose-50 text-rose-700",
  },
  not_available: {
    label: "Zatím nedostupné",
    className: "border-slate-200 bg-slate-100 text-slate-600",
  },
};

function formatDate(value: Date | string | number | null | undefined) {
  if (!value) return "Bez termínu";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Bez termínu";
  return new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function Today() {
  const [, setLocation] = useLocation();
  const statsQuery = trpc.leads.stats.useQuery();
  const tasksQuery = trpc.tasks.list.useQuery();
  const nbaQuery = trpc.nba.list.useQuery({ status: "pending", limit: 6 });
  const missionsQuery = trpc.hermes.getMissions.useQuery();
  const integrationsQuery = trpc.connectedApps.health.useQuery();

  const statusCounts = useMemo(
    () =>
      new Map(
        (statsQuery.data?.statusBreakdown ?? []).map(item => [
          item.status,
          Number(item.count),
        ])
      ),
    [statsQuery.data]
  );

  const pendingTasks = (tasksQuery.data ?? []).filter(
    task => task.status === "pending"
  );
  const pendingApprovals = (missionsQuery.data ?? []).filter(
    mission => mission.status === "awaiting_approval"
  );

  const attentionItems = useMemo<AttentionItem[]>(() => {
    const approvals: AttentionItem[] = pendingApprovals.map(mission => ({
      id: `approval-${mission.id}`,
      title: mission.title,
      detail: "Workflow čeká na vaše schválení",
      path: "/command-center",
      kind: "approval",
      priority: 100,
    }));
    const tasks: AttentionItem[] = pendingTasks.map(task => ({
      id: `task-${task.id}`,
      title: task.title,
      detail: formatDate(task.dueAt),
      path: "/tasks",
      kind: "task",
      priority: task.dueAt ? 80 : 50,
    }));
    const recommendations: AttentionItem[] = (nbaQuery.data ?? []).map(
      item => ({
        id: `nba-${item.id}`,
        title: item.reason,
        detail: `Doporučená akce: ${item.action} · priorita ${item.priority}`,
        path: "/next-actions",
        kind: "recommendation",
        priority: item.priority,
      })
    );

    return [...approvals, ...tasks, ...recommendations]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 8);
  }, [nbaQuery.data, pendingApprovals, pendingTasks]);

  const metrics = [
    {
      label: "Leady celkem",
      value: statsQuery.isError ? "—" : (statsQuery.data?.totalLeads ?? 0),
      icon: Users,
      isError: statsQuery.isError,
    },
    {
      label: "Oslovené",
      value: statsQuery.isError ? "—" : (statusCounts.get("contacted") ?? 0),
      icon: Clock3,
      isError: statsQuery.isError,
    },
    {
      label: "Kvalifikované",
      value: statsQuery.isError ? "—" : (statusCounts.get("qualified") ?? 0),
      icon: CheckCircle2,
      isError: statsQuery.isError,
    },
    {
      label: "Čeká na vás",
      value: tasksQuery.isError
        ? "—"
        : pendingTasks.length + pendingApprovals.length,
      icon: ListChecks,
      isError: tasksQuery.isError || missionsQuery.isError,
    },
  ];

  const todayLabel = new Intl.DateTimeFormat("cs-CZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <DashboardLayout>
      <div className="mx-auto w-full max-w-[1480px] overflow-hidden rounded-lg border border-border bg-card shadow-[0_14px_40px_rgba(30,64,175,0.08)]">
        <header className="flex flex-col justify-between gap-3 border-b border-border/70 px-5 py-5 sm:flex-row sm:items-end md:px-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-sky-700">
              <span className="size-2 rounded-full bg-emerald-400" />
              Pracovní přehled
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">
              Dnes
            </h1>
            <p className="mt-1 text-sm capitalize text-muted-foreground">
              {todayLabel}
            </p>
          </div>
          <Button
            onClick={() => setLocation("/command-center")}
            className="gap-2"
          >
            <Command className="size-4" />
            Nové workflow
          </Button>
        </header>

        <section
          aria-label="Klíčové metriky"
          className="grid border-b border-border/70 px-5 sm:grid-cols-2 md:px-6 xl:grid-cols-4"
        >
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <div
                key={metric.label}
                className={cn(
                  "flex min-h-28 items-center gap-4 py-5 sm:px-5",
                  index > 0 && "sm:border-l sm:border-border/70",
                  index > 1 && "sm:border-t xl:border-t-0"
                )}
              >
                <Icon className="size-5 shrink-0 text-sky-600" />
                <div>
                  <div className="text-2xl font-semibold tabular-nums text-foreground">
                    {metric.value}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {metric.label}
                    <span className={cn(
                      "rounded border px-1.5 py-0.5 text-[9px] uppercase",
                      metric.isError ? "border-red-200 bg-red-50 text-red-700" : "border-border"
                    )}>
                      {metric.isError ? "chyba" : "live"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <div className="grid gap-8 px-5 py-7 md:px-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <section>
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Co vyžaduje pozornost
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Schválení, termíny a doporučené obchodní kroky
                </p>
              </div>
              <Badge variant="outline">{attentionItems.length} položek</Badge>
            </div>

            <div className="divide-y divide-border/70">
              {attentionItems.map(item => {
                const Icon = attentionIcons[item.kind];
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLocation(item.path)}
                    className="group flex min-h-16 w-full items-center gap-3 py-3 text-left"
                  >
                    <Icon className="size-4 shrink-0 text-slate-400 group-hover:text-sky-700" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-1 block truncate text-xs text-muted-foreground">
                        {item.detail}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-slate-400 group-hover:text-sky-700" />
                  </button>
                );
              })}
              {!attentionItems.length &&
                (tasksQuery.isError || missionsQuery.isError || nbaQuery.isError) && (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <AlertTriangle className="size-6 text-red-600" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Data se nepodařilo načíst
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Zkuste přehled obnovit později.
                    </p>
                  </div>
                )}
              {!attentionItems.length &&
                !tasksQuery.isError &&
                !missionsQuery.isError &&
                !nbaQuery.isError &&
                !tasksQuery.isLoading &&
                !missionsQuery.isLoading && (
                  <div className="flex min-h-40 flex-col items-center justify-center text-center">
                    <CheckCircle2 className="size-6 text-emerald-600" />
                    <p className="mt-3 text-sm font-medium text-foreground">
                      Nic naléhavého
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Nové úkoly a schválení se objeví zde.
                    </p>
                  </div>
                )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Stav systémů
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bezpečné hranice reálného provedení
                </p>
              </div>
              <PlugZap className="size-4 text-slate-500" />
            </div>

            <div className="divide-y divide-border/70">
              {(integrationsQuery.data ?? []).map(integration => {
                const state = integrationStatus[integration.status];
                return (
                  <button
                    key={integration.id}
                    type="button"
                    onClick={() => setLocation(integration.route)}
                    className="flex w-full items-center gap-3 py-3 text-left"
                  >
                    {integration.status === "ready" ? (
                      <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                    ) : integration.status === "error" ? (
                      <AlertTriangle className="size-4 shrink-0 text-rose-600" />
                    ) : (
                      <CircleDot className="size-4 shrink-0 text-slate-500" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {integration.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {integration.capability}
                      </span>
                    </span>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0 text-[10px]", state.className)}
                    >
                      {state.label}
                    </Badge>
                  </button>
                );
              })}
              {integrationsQuery.isError && (
                <div className="flex items-center gap-2 py-5 text-xs text-rose-700">
                  <AlertTriangle className="size-4" />
                  Stav integrací není dostupný.
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="border-t border-border/70 px-5 pt-6 pb-5 md:px-6 md:pb-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Kanban className="size-4 text-sky-600" />
                Skutečný stav pipeline
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Pouze uložené CRM stavy, bez odhadovaných konverzí
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void statsQuery.refetch()}
              className="gap-2"
            >
              <RefreshCw
                className={cn(
                  "size-3.5",
                  statsQuery.isFetching && "animate-spin"
                )}
              />
              Obnovit
            </Button>
          </div>
          <div className="mt-4 grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-5">
            {["new", "contacted", "replied", "qualified", "disqualified"].map(
              status => (
                <div key={status} className="bg-card px-4 py-4">
                  <div className="text-lg font-semibold tabular-nums text-foreground">
                    {statsQuery.isError ? "—" : (statusCounts.get(status) ?? 0)}
                  </div>
                  <div className="mt-1 text-xs capitalize text-muted-foreground">
                    {status}
                  </div>
                </div>
              )
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
