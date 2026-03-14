import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DollarSign, TrendingUp, Target, CheckCircle2, Loader2, Building2, ThumbsUp, ThumbsDown } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const CURRENCIES = ["USD", "EUR", "GBP", "CZK", "PLN", "CHF"];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-slate-500/15 text-slate-300",
  contacted: "bg-blue-500/15 text-blue-300",
  replied: "bg-amber-500/15 text-amber-300",
  qualified: "bg-emerald-500/15 text-emerald-300",
  disqualified: "bg-red-500/15 text-red-300",
};

export default function ROI() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.leads.list.useQuery({ limit: 200, offset: 0, status: "qualified" });
  const { data: allData } = trpc.leads.list.useQuery({ limit: 200, offset: 0 });

  const closeDealMutation = trpc.leads.closeDeal.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      toast.success(t("roi.dealClosed", "Obchod uzavřen! 🎉"));
      setDealModal(null);
      setDealValue("");
    },
    onError: (e) => toast.error(e.message),
  });

  const rateQuality = trpc.leads.rateQuality.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); toast.success(t("roi.qualitySaved", "Hodnocení kvality uloženo")); },
    onError: (e) => toast.error(e.message),
  });

  const [dealModal, setDealModal] = useState<{ id: number; company: string } | null>(null);
  const [dealValue, setDealValue] = useState("");
  const [currency, setCurrency] = useState("EUR");

  const allLeads = allData?.items ?? [];
  const qualifiedLeads = data?.items ?? [];
  const closedLeads = allLeads.filter((l) => l.dealClosed);

  // Stats
  const totalRevenue = closedLeads.reduce((sum, l) => {
    const v = parseFloat(l.dealValue ?? "0");
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const conversionRate = allLeads.length > 0
    ? Math.round((closedLeads.length / allLeads.length) * 100)
    : 0;
  const avgDealValue = closedLeads.length > 0
    ? Math.round(totalRevenue / closedLeads.length)
    : 0;

  // Revenue by industry chart
  const revenueByIndustry: Record<string, number> = {};
  closedLeads.forEach((l) => {
    const v = parseFloat(l.dealValue ?? "0");
    if (!isNaN(v)) {
      revenueByIndustry[l.industry] = (revenueByIndustry[l.industry] ?? 0) + v;
    }
  });
  const chartData = Object.entries(revenueByIndustry)
    .map(([industry, revenue]) => ({ industry, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);

  const CHART_COLORS = [
    "oklch(0.62 0.19 264)", "oklch(0.68 0.18 180)", "oklch(0.72 0.17 140)",
    "oklch(0.75 0.18 60)", "oklch(0.65 0.2 320)", "oklch(0.70 0.18 30)",
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("roi.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t("roi.subtitle")}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("roi.closedRevenue")}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {totalRevenue.toLocaleString()} {closedLeads[0]?.currency ?? "EUR"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{closedLeads.length} {t("roi.dealsCount", "uzavřených obchodů")}</p>
                </div>
                <div className="p-2 rounded-lg text-emerald-400 bg-emerald-400/10">
                  <DollarSign className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("roi.closeRate")}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{conversionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("roi.leadsToDeals", "leady → uzavřené obchody")}</p>
                </div>
                <div className="p-2 rounded-lg text-violet-400 bg-violet-400/10">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("roi.avgDealValue")}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {avgDealValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{t("roi.perDeal", "za uzavřený obchod")}</p>
                </div>
                <div className="p-2 rounded-lg text-amber-400 bg-amber-400/10">
                  <Target className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("roi.totalPipeline")}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{qualifiedLeads.length}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t("roi.readyToClose", "připraveno k uzavření")}</p>
                </div>
                <div className="p-2 rounded-lg text-blue-400 bg-blue-400/10">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Industry Chart */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("roi.revenueByIndustry", "Tržby podle odvětví")}</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <DollarSign className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">{t("roi.noClosedDeals", "Zatím žádné uzavřené obchody")}</p>
                  <p className="text-xs mt-1">{t("roi.closeDealsHint", "Uzavřete obchody níže pro přehled tržeb")}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 40 }}>
                    <XAxis
                      dataKey="industry"
                      tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }}
                      angle={-30}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.17 0.015 264)",
                        border: "1px solid oklch(0.26 0.015 264)",
                        borderRadius: "8px",
                        color: "oklch(0.93 0.01 264)",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Closed Deals List */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">{t("roi.closedDeals", "Uzavřené obchody")}</CardTitle>
            </CardHeader>
            <CardContent>
              {closedLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <CheckCircle2 className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm">{t("roi.noClosedDeals", "Zatím žádné uzavřené obchody")}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {closedLeads.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{l.companyName}</p>
                        <p className="text-xs text-muted-foreground">{l.industry}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-emerald-400">
                          {parseFloat(l.dealValue ?? "0").toLocaleString()} {l.currency}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(l.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Qualified Leads — Ready to Close */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-400" />
              {t("roi.qualifiedLeads", "Kvalifikované leady — připraveno k uzavření")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : qualifiedLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Building2 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">{t("roi.noLeads")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {qualifiedLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{lead.companyName}</p>
                          <Badge className={`text-xs ${STATUS_COLORS[lead.status] ?? "bg-zinc-500/15 text-zinc-300"}`}>
                            {t(`status.${lead.status}`, lead.status)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{lead.industry} · {lead.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        onClick={() => rateQuality.mutate({ leadId: lead.id, rating: "good" })}
                        className={`p-1.5 rounded-lg transition-colors ${lead.qualityRating === "good" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:text-emerald-400"}`}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => rateQuality.mutate({ leadId: lead.id, rating: "bad" })}
                        className={`p-1.5 rounded-lg transition-colors ${lead.qualityRating === "bad" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:text-red-400"}`}
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                      {lead.dealClosed ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">{t("roi.closed")}</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-7 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => setDealModal({ id: lead.id, company: lead.companyName })}
                        >
                          {t("roi.markClosed")}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Close Deal Modal */}
      <Dialog open={!!dealModal} onOpenChange={() => setDealModal(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("roi.closeDealTitle", "Uzavřít obchod")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{dealModal?.company}</p>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("roi.dealValue")}</Label>
              <Input
                type="number"
                placeholder="0"
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">{t("roi.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-secondary border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-foreground">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDealModal(null)} className="border-border text-foreground">
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => {
                if (dealModal) {
                  closeDealMutation.mutate({
                    id: dealModal.id,
                    dealValue: dealValue || "0",
                    currency,
                  });
                }
              }}
              disabled={closeDealMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {closeDealMutation.isPending ? t("common.loading") : t("roi.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
