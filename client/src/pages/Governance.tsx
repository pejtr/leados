import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  Activity,
  Cpu,
  FlaskConical,
  Coins,
  AlertTriangle,
} from "lucide-react";

type Tab = "audit" | "usage" | "karr" | "budget";

const TABS: { id: Tab; label: string; icon: typeof ShieldCheck }[] = [
  { id: "audit", label: "Audit Log", icon: ShieldCheck },
  { id: "usage", label: "LLM Usage", icon: Activity },
  { id: "karr", label: "KARR Reviews", icon: FlaskConical },
  { id: "budget", label: "Budget", icon: Coins },
];

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function AuditTab() {
  const { data, isLoading } = trpc.audit.list.useQuery({ limit: 50, offset: 0 });
  const { data: stats } = trpc.audit.stats.useQuery();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Total Events</div>
          <div className="mt-1 text-2xl font-bold text-white">{stats?.total ?? 0}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Event Types</div>
          <div className="mt-1 text-2xl font-bold text-white">{stats?.byEventType.length ?? 0}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Event</th>
                <th className="p-3">Resource</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data?.items.map((e) => (
                <tr key={e.id} className="text-slate-200">
                  <td className="p-3 font-medium">{e.eventType}</td>
                  <td className="p-3 text-slate-400">
                    {e.resourceType}
                    {e.resourceId ? ` #${e.resourceId}` : ""}
                  </td>
                  <td className="p-3 text-slate-400">
                    {new Date(e.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data?.items.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-6 text-center text-slate-500">
                    No audit events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsageTab() {
  const { data: stats } = trpc.llmUsage.stats.useQuery();
  const { data: history, isLoading } = trpc.llmUsage.history.useQuery({ limit: 50, offset: 0 });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Calls</div>
          <div className="mt-1 text-2xl font-bold text-white">{stats?.totalCalls ?? 0}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Tokens</div>
          <div className="mt-1 text-2xl font-bold text-white">{stats?.totalTokens ?? 0}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-400">Est. Cost</div>
          <div className="mt-1 text-2xl font-bold text-white">
            {fmtMoney(stats?.totalCostCents ?? 0)}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <div className="mb-2 text-sm font-semibold text-white">Cost by Model</div>
        <div className="space-y-2">
          {stats?.byModel.map((m) => (
            <div key={m.model} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{m.model}</span>
              <span className="text-slate-400">
                {m.calls} calls · {m.tokens} tok · {fmtMoney(m.costCents)}
              </span>
            </div>
          ))}
          {stats?.byModel.length === 0 && (
            <div className="text-slate-500">No LLM usage recorded yet.</div>
          )}
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="p-3">Model</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Tokens</th>
                <th className="p-3">Cost</th>
                <th className="p-3">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history?.map((u) => (
                <tr key={u.id} className="text-slate-200">
                  <td className="p-3 font-medium">{u.model}</td>
                  <td className="p-3 text-slate-400">{u.provider}</td>
                  <td className="p-3 text-slate-400">{u.totalTokens}</td>
                  <td className="p-3 text-slate-400">{fmtMoney(Number(u.estimatedCostCents))}</td>
                  <td className="p-3 text-slate-400">{new Date(u.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {history?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    No usage history yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KarrTab() {
  const { data, isLoading } = trpc.karr.list.useQuery({ limit: 50, offset: 0 });

  const resultColor: Record<string, string> = {
    approved: "bg-emerald-500/15 text-emerald-300",
    flagged: "bg-amber-500/15 text-amber-300",
    rejected: "bg-rose-500/15 text-rose-300",
  };

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {data?.items.map((r) => (
            <div key={r.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-white">
                  {r.targetType}
                  {r.targetId ? ` #${r.targetId}` : ""}
                </span>
                <Badge className={resultColor[r.reviewResult] ?? ""}>{r.reviewResult}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-300">{r.summary}</p>
              {Array.isArray(r.issues) && r.issues.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  {r.issues.map((iss: any, i: number) => (
                    <li key={i}>
                      <span className="font-semibold text-slate-300">[{iss.severity}]</span>{" "}
                      {iss.description}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {data?.items.length === 0 && (
            <div className="rounded-lg border border-white/10 p-6 text-center text-slate-500">
              No KARR reviews yet. Reviews run automatically when workflows are approved.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BudgetTab() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { data: budget, isLoading } = trpc.llmUsage.getBudget.useQuery();
  const [daily, setDaily] = useState<string>("");
  const [monthly, setMonthly] = useState<string>("");
  const setBudget = trpc.llmUsage.setBudget.useMutation({
    onSuccess: () => {
      alert("Budget limits saved.");
    },
  });

  return (
    <div className="space-y-4">
      {!isAdmin && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          <AlertTriangle className="h-4 w-4" />
          Only admins can change budget limits. Showing your current limits below.
        </div>
      )}

      {isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          <div>Daily token limit: {budget?.dailyTokenLimit ?? "unlimited"}</div>
          <div>Monthly token limit: {budget?.monthlyTokenLimit ?? "unlimited"}</div>
        </div>
      )}

      {isAdmin && (
        <div className="space-y-3 rounded-lg border border-white/10 p-4">
          <div className="text-sm font-semibold text-white">Set limits (tokens, empty = unlimited)</div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              placeholder="Daily limit"
              value={daily}
              onChange={(e) => setDaily(e.target.value)}
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            />
            <input
              placeholder="Monthly limit"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              className="rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none"
            />
            <button
              onClick={() =>
                setBudget.mutate({
                  userId: user?.id ?? 0,
                  dailyTokenLimit: daily === "" ? null : Number(daily),
                  monthlyTokenLimit: monthly === "" ? null : Number(monthly),
                })
              }
              disabled={setBudget.isPending}
              className="rounded-md bg-teal-500 px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            >
              {setBudget.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Governance() {
  const [tab, setTab] = useState<Tab>("audit");

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div className="flex items-center gap-3">
          <Cpu className="h-7 w-7 text-teal-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Governance & Control</h1>
            <p className="text-sm text-slate-400">
              Audit trail, LLM cost tracking, KARR quality reviews, and budget limits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-teal-500 text-black"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {tab === "audit" && <AuditTab />}
        {tab === "usage" && <UsageTab />}
        {tab === "karr" && <KarrTab />}
        {tab === "budget" && <BudgetTab />}
      </div>
    </DashboardLayout>
  );
}