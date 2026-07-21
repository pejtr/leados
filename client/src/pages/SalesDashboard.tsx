import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trophy,
  TrendingUp,
  Target,
  DollarSign,
  Activity,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Percent,
} from "lucide-react";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";

const STAGE_LABELS: Record<string, string> = {
  new: "Nový",
  qualified: "Kvalifikován",
  presentation: "Prezentace",
  proposal: "Nabídka",
  negotiation: "Vyjednávání",
  won: "Vyhráno",
  lost: "Prohráno",
};

const STAGE_COLORS: Record<string, string> = {
  new: "bg-slate-500",
  qualified: "bg-blue-500",
  presentation: "bg-indigo-500",
  proposal: "bg-violet-500",
  negotiation: "bg-amber-500",
  won: "bg-emerald-500",
  lost: "bg-red-400",
};

function fmtCurrency(val: number, currency = "CZK") {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(val);
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

export default function SalesDashboard() {
  const utils = trpc.useUtils();

  const { data: deals = [], isLoading: dealsLoading } =
    trpc.crm.listDeals.useQuery();
  const { data: stats } = trpc.crm.getDealStats.useQuery();
  const { data: quotas = [] } = trpc.crm.listQuotas.useQuery();
  const { data: commissions = [] } = trpc.crm.listCommissions.useQuery();

  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState({
    period: "",
    periodType: "monthly" as const,
    targetValue: "",
    currency: "CZK",
  });

  const upsertQuota = trpc.crm.upsertQuota.useMutation({
    onSuccess: () => {
      utils.crm.listQuotas.invalidate();
      setQuotaOpen(false);
      toast.success("Kvóta uložena!");
    },
  });

  // Current month quota
  const currentPeriod = new Date().toISOString().slice(0, 7); // "2026-03"
  const currentQuota = quotas.find((q: any) => q.period === currentPeriod);
  const quotaTarget = parseFloat(currentQuota?.targetValue ?? "0");
  const quotaAchieved = parseFloat(currentQuota?.achievedValue ?? "0");
  const quotaPercent =
    quotaTarget > 0
      ? Math.min(100, Math.round((quotaAchieved / quotaTarget) * 100))
      : 0;

  // Stage distribution
  const stageDistribution = Object.entries(STAGE_LABELS).map(
    ([key, label]) => ({
      key,
      label,
      count: deals.filter((d: any) => d.stage === key).length,
      value: deals
        .filter((d: any) => d.stage === key)
        .reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0),
    })
  );

  // Recent deals
  const recentDeals = [...deals]
    .sort(
      (a: any, b: any) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 8);

  // Won deals this month
  const wonThisMonth = deals.filter((d: any) => {
    if (d.stage !== "won" || !d.wonAt) return false;
    const wonDate = new Date(d.wonAt);
    const now = new Date();
    return (
      wonDate.getMonth() === now.getMonth() &&
      wonDate.getFullYear() === now.getFullYear()
    );
  });

  const totalCommissions = commissions.reduce(
    (s: number, c: any) => s + parseFloat(c.amount ?? "0"),
    0
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-transparent p-6 text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Sales Dashboard
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Přehled obchodní výkonnosti, kvót a provizí
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setQuotaOpen(true)}
            >
              <Target className="w-4 h-4" /> Nastavit kvótu
            </Button>
            <Link href="/deal-pipeline">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                <BarChart3 className="w-4 h-4" /> Deal Pipeline
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              icon: TrendingUp,
              label: "Pipeline (aktivní)",
              value: fmtCurrency(stats?.pipelineValue ?? 0),
              sub: `${(deals as any[]).filter((d: any) => !["won", "lost"].includes(d.stage)).length} dealů`,
              color: "text-violet-700",
              bg: "bg-violet-50",
            },
            {
              icon: Trophy,
              label: "Vyhráno celkem",
              value: fmtCurrency(stats?.wonValue ?? 0),
              sub: `${stats?.won ?? 0} dealů`,
              color: "text-emerald-700",
              bg: "bg-emerald-50",
            },
            {
              icon: Percent,
              label: "Win rate",
              value: `${stats?.total ? Math.round(((stats?.won ?? 0) / stats.total) * 100) : 0} %`,
              sub: `${stats?.total ?? 0} celkem`,
              color: "text-blue-700",
              bg: "bg-blue-50",
            },
            {
              icon: DollarSign,
              label: "Provize celkem",
              value: fmtCurrency(totalCommissions),
              sub: `${commissions.length} záznamů`,
              color: "text-amber-700",
              bg: "bg-amber-50",
            },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${bg}`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quota + Stage Distribution */}
          <div className="space-y-6">
            {/* Monthly Quota */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Target className="h-4 w-4 text-violet-600" /> Měsíční kvóta
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {currentPeriod}
                </Badge>
              </div>
              {quotaTarget > 0 ? (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Dosaženo</span>
                    <span className="font-semibold text-foreground">
                      {quotaPercent}%
                    </span>
                  </div>
                  <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${quotaPercent >= 100 ? "bg-emerald-500" : quotaPercent >= 70 ? "bg-amber-500" : "bg-violet-500"}`}
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{fmtCurrency(quotaAchieved)}</span>
                    <span>cíl: {fmtCurrency(quotaTarget)}</span>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Kvóta není nastavena
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setQuotaOpen(true)}
                  >
                    Nastavit kvótu
                  </Button>
                </div>
              )}
            </div>

            {/* Stage Distribution */}
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Activity className="h-4 w-4 text-blue-600" /> Rozložení fází
              </h2>
              <div className="space-y-2">
                {stageDistribution
                  .filter(s => s.count > 0)
                  .map(s => (
                    <div key={s.key} className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_COLORS[s.key]}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-foreground">{s.label}</span>
                          <span className="text-muted-foreground">
                            {s.count}×
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full rounded-full ${STAGE_COLORS[s.key]}`}
                            style={{
                              width: `${deals.length > 0 ? (s.count / deals.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                      {s.value > 0 && (
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          {fmtCurrency(s.value)}
                        </span>
                      )}
                    </div>
                  ))}
                {stageDistribution.every(s => s.count === 0) && (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Zatím žádné dealy
                  </p>
                )}
              </div>
            </div>

            {/* Won This Month */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <Trophy className="w-4 h-4" /> Vyhráno tento měsíc
              </h2>
              {wonThisMonth.length > 0 ? (
                <div className="space-y-2">
                  {wonThisMonth.map((d: any) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span className="line-clamp-1 text-xs text-foreground">
                          {d.title}
                        </span>
                      </div>
                      <span className="text-xs text-emerald-400 font-semibold flex-shrink-0 ml-2">
                        {fmtCurrency(parseFloat(d.value ?? "0"), d.currency)}
                      </span>
                    </div>
                  ))}
                  <p className="mt-2 border-t border-emerald-200 pt-2 text-xs font-bold text-emerald-700">
                    Celkem:{" "}
                    {fmtCurrency(
                      wonThisMonth.reduce(
                        (s: number, d: any) => s + parseFloat(d.value ?? "0"),
                        0
                      )
                    )}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Zatím žádné vyhráno
                </p>
              )}
            </div>
          </div>

          {/* Right: Recent Deals */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Activity className="h-4 w-4 text-violet-600" /> Nedávné dealy
                </h2>
                <Link href="/deal-pipeline">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-violet-700 hover:text-violet-800"
                  >
                    Zobrazit pipeline →
                  </Button>
                </Link>
              </div>
              {dealsLoading ? (
                <div className="py-10 text-center text-muted-foreground">
                  Načítám...
                </div>
              ) : recentDeals.length === 0 ? (
                <div className="text-center py-10">
                  <p className="mb-3 text-muted-foreground">
                    Zatím žádné dealy
                  </p>
                  <Link href="/deal-pipeline">
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                    >
                      <Plus className="w-4 h-4" /> Přidat první deal
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                          Deal
                        </th>
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                          Fáze
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          Hodnota
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          Uzavření
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          %
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentDeals.map((deal: any) => (
                        <tr
                          key={deal.id}
                          className="transition-colors hover:bg-muted/50"
                        >
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-2">
                              {deal.stage === "won" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                              ) : deal.stage === "lost" ? (
                                <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                              ) : (
                                <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                              )}
                              <span className="line-clamp-1 max-w-[180px] text-foreground">
                                {deal.title}
                              </span>
                            </div>
                            {deal.nextAction && (
                              <p className="ml-5 line-clamp-1 text-xs text-muted-foreground">
                                → {deal.nextAction}
                              </p>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${STAGE_COLORS[deal.stage]}`}
                              />
                              <span className="text-xs text-foreground">
                                {STAGE_LABELS[deal.stage]}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-right">
                            <span
                              className={`text-sm font-semibold ${deal.stage === "won" ? "text-emerald-700" : "text-foreground"}`}
                            >
                              {parseFloat(deal.value ?? "0") > 0
                                ? fmtCurrency(
                                    parseFloat(deal.value),
                                    deal.currency
                                  )
                                : "—"}
                            </span>
                          </td>
                          <td className="py-2.5 text-right text-xs text-muted-foreground">
                            {fmtDate(deal.expectedCloseDate)}
                          </td>
                          <td className="py-2.5 text-right">
                            <span className="text-xs text-foreground">
                              {deal.probability ?? 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Commissions table */}
            {commissions.length > 0 && (
              <div className="mt-6 rounded-lg border border-border bg-card p-5 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <DollarSign className="h-4 w-4 text-amber-600" /> Provize
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-left text-xs font-medium text-muted-foreground">
                          Deal ID
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          Sazba
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          Částka
                        </th>
                        <th className="pb-2 text-right text-xs font-medium text-muted-foreground">
                          Datum
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {commissions.slice(0, 5).map((c: any) => (
                        <tr key={c.id}>
                          <td className="py-2 text-foreground">#{c.dealId}</td>
                          <td className="py-2 text-right text-foreground">
                            {c.rate}%
                          </td>
                          <td className="py-2 text-right font-semibold text-amber-700">
                            {fmtCurrency(parseFloat(c.amount), c.currency)}
                          </td>
                          <td className="py-2 text-right text-xs text-muted-foreground">
                            {fmtDate(c.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quota Dialog */}
        <Dialog open={quotaOpen} onOpenChange={setQuotaOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Nastavit kvótu</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Období (RRRR-MM)</Label>
                <Input
                  value={quotaForm.period}
                  onChange={e =>
                    setQuotaForm({ ...quotaForm, period: e.target.value })
                  }
                  placeholder={currentPeriod}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Typ</Label>
                <Select
                  value={quotaForm.periodType}
                  onValueChange={(v: any) =>
                    setQuotaForm({ ...quotaForm, periodType: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Měsíční</SelectItem>
                    <SelectItem value="quarterly">Čtvrtletní</SelectItem>
                    <SelectItem value="yearly">Roční</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cílová hodnota (CZK)</Label>
                <Input
                  value={quotaForm.targetValue}
                  onChange={e =>
                    setQuotaForm({ ...quotaForm, targetValue: e.target.value })
                  }
                  type="number"
                  placeholder="500000"
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setQuotaOpen(false)}>
                Zrušit
              </Button>
              <Button
                onClick={() =>
                  upsertQuota.mutate({
                    ...quotaForm,
                    period: quotaForm.period || currentPeriod,
                  })
                }
                disabled={upsertQuota.isPending || !quotaForm.targetValue}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                Uložit kvótu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
