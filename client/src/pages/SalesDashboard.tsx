import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Trophy, TrendingUp, Target, DollarSign, Activity, Plus,
  CheckCircle2, Clock, XCircle, BarChart3, Percent
} from "lucide-react";
import { Link } from "wouter";

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
  return new Intl.NumberFormat("cs-CZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(val);
}

function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("cs-CZ");
}

export default function SalesDashboard() {
  const utils = trpc.useUtils();

  const { data: deals = [], isLoading: dealsLoading } = trpc.crm.listDeals.useQuery();
  const { data: stats } = trpc.crm.getDealStats.useQuery();
  const { data: quotas = [] } = trpc.crm.listQuotas.useQuery();
  const { data: commissions = [] } = trpc.crm.listCommissions.useQuery();

  const [quotaOpen, setQuotaOpen] = useState(false);
  const [quotaForm, setQuotaForm] = useState({ period: "", periodType: "monthly" as const, targetValue: "", currency: "CZK" });

  const upsertQuota = trpc.crm.upsertQuota.useMutation({
    onSuccess: () => {
      utils.crm.listQuotas.invalidate();
      setQuotaOpen(false);
      toast({ title: "Kvóta uložena!" });
    },
  });

  // Current month quota
  const currentPeriod = new Date().toISOString().slice(0, 7); // "2026-03"
  const currentQuota = quotas.find((q: any) => q.period === currentPeriod);
  const quotaTarget = parseFloat(currentQuota?.targetValue ?? "0");
  const quotaAchieved = parseFloat(currentQuota?.achievedValue ?? "0");
  const quotaPercent = quotaTarget > 0 ? Math.min(100, Math.round((quotaAchieved / quotaTarget) * 100)) : 0;

  // Stage distribution
  const stageDistribution = Object.entries(STAGE_LABELS).map(([key, label]) => ({
    key,
    label,
    count: deals.filter((d: any) => d.stage === key).length,
    value: deals.filter((d: any) => d.stage === key).reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0),
  }));

  // Recent deals
  const recentDeals = [...deals].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 8);

  // Won deals this month
  const wonThisMonth = deals.filter((d: any) => {
    if (d.stage !== "won" || !d.wonAt) return false;
    const wonDate = new Date(d.wonAt);
    const now = new Date();
    return wonDate.getMonth() === now.getMonth() && wonDate.getFullYear() === now.getFullYear();
  });

  const totalCommissions = commissions.reduce((s: number, c: any) => s + parseFloat(c.amount ?? "0"), 0);

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Sales Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Přehled obchodní výkonnosti, kvót a provizí</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 gap-2" onClick={() => setQuotaOpen(true)}>
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
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
          {
            icon: Trophy,
            label: "Vyhráno celkem",
            value: fmtCurrency(stats?.wonValue ?? 0),
            sub: `${stats?.won ?? 0} dealů`,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            icon: Percent,
            label: "Win rate",
            value: `${stats?.total ? Math.round(((stats?.won ?? 0) / stats.total) * 100) : 0} %`,
            sub: `${stats?.total ?? 0} celkem`,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            icon: DollarSign,
            label: "Provize celkem",
            value: fmtCurrency(totalCommissions),
            sub: `${commissions.length} záznamů`,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map(({ icon: Icon, label, value, sub, color, bg }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Quota + Stage Distribution */}
        <div className="space-y-6">
          {/* Monthly Quota */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-400" /> Měsíční kvóta
              </h2>
              <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                {currentPeriod}
              </Badge>
            </div>
            {quotaTarget > 0 ? (
              <>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Dosaženo</span>
                  <span className="text-white font-semibold">{quotaPercent}%</span>
                </div>
                <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all ${quotaPercent >= 100 ? "bg-emerald-500" : quotaPercent >= 70 ? "bg-amber-500" : "bg-violet-500"}`}
                    style={{ width: `${quotaPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{fmtCurrency(quotaAchieved)}</span>
                  <span>cíl: {fmtCurrency(quotaTarget)}</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">Kvóta není nastavena</p>
                <Button size="sm" variant="outline" className="border-slate-700 text-slate-300" onClick={() => setQuotaOpen(true)}>
                  Nastavit kvótu
                </Button>
              </div>
            )}
          </div>

          {/* Stage Distribution */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" /> Rozložení fází
            </h2>
            <div className="space-y-2">
              {stageDistribution.filter(s => s.count > 0).map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_COLORS[s.key]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{s.label}</span>
                      <span className="text-slate-400">{s.count}×</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${STAGE_COLORS[s.key]}`}
                        style={{ width: `${deals.length > 0 ? (s.count / deals.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  {s.value > 0 && <span className="text-xs text-slate-400 flex-shrink-0">{fmtCurrency(s.value)}</span>}
                </div>
              ))}
              {stageDistribution.every(s => s.count === 0) && (
                <p className="text-slate-500 text-sm text-center py-4">Zatím žádné dealy</p>
              )}
            </div>
          </div>

          {/* Won This Month */}
          <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" /> Vyhráno tento měsíc
            </h2>
            {wonThisMonth.length > 0 ? (
              <div className="space-y-2">
                {wonThisMonth.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs text-white line-clamp-1">{d.title}</span>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold flex-shrink-0 ml-2">
                      {fmtCurrency(parseFloat(d.value ?? "0"), d.currency)}
                    </span>
                  </div>
                ))}
                <p className="text-xs text-emerald-400 font-bold mt-2 pt-2 border-t border-emerald-800/40">
                  Celkem: {fmtCurrency(wonThisMonth.reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0))}
                </p>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Zatím žádné vyhráno</p>
            )}
          </div>
        </div>

        {/* Right: Recent Deals */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" /> Nedávné dealy
              </h2>
              <Link href="/deal-pipeline">
                <Button variant="ghost" size="sm" className="text-violet-400 hover:text-violet-300 text-xs">
                  Zobrazit pipeline →
                </Button>
              </Link>
            </div>
            {dealsLoading ? (
              <div className="text-center text-slate-400 py-10">Načítám...</div>
            ) : recentDeals.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500 mb-3">Zatím žádné dealy</p>
                <Link href="/deal-pipeline">
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
                    <Plus className="w-4 h-4" /> Přidat první deal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs text-slate-400 pb-2 font-medium">Deal</th>
                      <th className="text-left text-xs text-slate-400 pb-2 font-medium">Fáze</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">Hodnota</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">Uzavření</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {recentDeals.map((deal: any) => (
                      <tr key={deal.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-2">
                            {deal.stage === "won" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                            ) : deal.stage === "lost" ? (
                              <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                            )}
                            <span className="text-white line-clamp-1 max-w-[180px]">{deal.title}</span>
                          </div>
                          {deal.nextAction && (
                            <p className="text-xs text-slate-500 ml-5 line-clamp-1">→ {deal.nextAction}</p>
                          )}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${STAGE_COLORS[deal.stage]}`} />
                            <span className="text-xs text-slate-300">{STAGE_LABELS[deal.stage]}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`text-sm font-semibold ${deal.stage === "won" ? "text-emerald-400" : "text-white"}`}>
                            {parseFloat(deal.value ?? "0") > 0 ? fmtCurrency(parseFloat(deal.value), deal.currency) : "—"}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-xs text-slate-400">
                          {fmtDate(deal.expectedCloseDate)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span className="text-xs text-slate-300">{deal.probability ?? 0}%</span>
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
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 mt-6">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" /> Provize
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left text-xs text-slate-400 pb-2 font-medium">Deal ID</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">Sazba</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">Částka</th>
                      <th className="text-right text-xs text-slate-400 pb-2 font-medium">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {commissions.slice(0, 5).map((c: any) => (
                      <tr key={c.id}>
                        <td className="py-2 text-slate-300">#{c.dealId}</td>
                        <td className="py-2 text-right text-slate-300">{c.rate}%</td>
                        <td className="py-2 text-right text-amber-400 font-semibold">{fmtCurrency(parseFloat(c.amount), c.currency)}</td>
                        <td className="py-2 text-right text-slate-400 text-xs">{fmtDate(c.createdAt)}</td>
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
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Nastavit kvótu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-slate-300">Období (RRRR-MM)</Label>
              <Input
                value={quotaForm.period}
                onChange={(e) => setQuotaForm({ ...quotaForm, period: e.target.value })}
                placeholder={currentPeriod}
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-300">Typ</Label>
              <Select value={quotaForm.periodType} onValueChange={(v: any) => setQuotaForm({ ...quotaForm, periodType: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="monthly" className="text-white">Měsíční</SelectItem>
                  <SelectItem value="quarterly" className="text-white">Čtvrtletní</SelectItem>
                  <SelectItem value="yearly" className="text-white">Roční</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-300">Cílová hodnota (CZK)</Label>
              <Input
                value={quotaForm.targetValue}
                onChange={(e) => setQuotaForm({ ...quotaForm, targetValue: e.target.value })}
                type="number"
                placeholder="500000"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotaOpen(false)} className="border-slate-700 text-slate-300">Zrušit</Button>
            <Button
              onClick={() => upsertQuota.mutate({ ...quotaForm, period: quotaForm.period || currentPeriod })}
              disabled={upsertQuota.isPending || !quotaForm.targetValue}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Uložit kvótu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
