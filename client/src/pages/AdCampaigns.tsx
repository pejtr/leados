import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
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
import {
  TrendingUp, TrendingDown, DollarSign, Target, MousePointerClick,
  Eye, Plus, Pencil, Trash2, Loader2, RefreshCw, BarChart3, Zap,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid,
} from "recharts";

const PLATFORM_COLORS: Record<string, string> = {
  meta: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  google: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  linkedin: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  other: "bg-slate-500/15 text-slate-300 border-slate-500/30",
};

const PLATFORM_LABELS: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  linkedin: "LinkedIn Ads",
  other: "Other",
};

const CHART_COLORS = [
  "oklch(0.62 0.19 264)", "oklch(0.68 0.18 180)", "oklch(0.72 0.17 140)",
  "oklch(0.75 0.18 60)", "oklch(0.65 0.2 320)", "oklch(0.70 0.18 30)",
];

const CURRENCIES = ["EUR", "USD", "GBP", "CZK", "PLN", "CHF"];

type CampaignForm = {
  name: string;
  platform: "meta" | "google" | "linkedin" | "other";
  adSpend: string;
  revenue: string;
  conversions: string;
  clicks: string;
  impressions: string;
  currency: string;
  notes: string;
};

const emptyForm: CampaignForm = {
  name: "",
  platform: "meta",
  adSpend: "",
  revenue: "",
  conversions: "",
  clicks: "",
  impressions: "",
  currency: "EUR",
  notes: "",
};

function roasColor(roas: number) {
  if (roas >= 4) return "text-emerald-400";
  if (roas >= 2) return "text-amber-400";
  return "text-red-400";
}

function pnoColor(pno: number) {
  if (pno <= 25) return "text-emerald-400";
  if (pno <= 50) return "text-amber-400";
  return "text-red-400";
}

export default function AdCampaigns() {
  const utils = trpc.useUtils();
  const { data: campaigns = [], isLoading } = trpc.adCampaigns.list.useQuery();
  const { data: summary } = trpc.adCampaigns.summary.useQuery();

  const createMutation = trpc.adCampaigns.create.useMutation({
    onSuccess: () => {
      utils.adCampaigns.list.invalidate();
      utils.adCampaigns.summary.invalidate();
      toast.success("Campaign added ✓");
      setModal(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.adCampaigns.update.useMutation({
    onSuccess: () => {
      utils.adCampaigns.list.invalidate();
      utils.adCampaigns.summary.invalidate();
      toast.success("Campaign updated ✓");
      setModal(null);
      setEditId(null);
      setForm(emptyForm);
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.adCampaigns.delete.useMutation({
    onSuccess: () => {
      utils.adCampaigns.list.invalidate();
      utils.adCampaigns.summary.invalidate();
      toast.success("Campaign deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<CampaignForm>(emptyForm);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setModal("add");
  }

  function openEdit(c: (typeof campaigns)[0]) {
    setForm({
      name: c.name,
      platform: c.platform as CampaignForm["platform"],
      adSpend: String(c.adSpend ?? ""),
      revenue: String(c.revenue ?? ""),
      conversions: String(c.conversions),
      clicks: String(c.clicks),
      impressions: String(c.impressions),
      currency: c.currency,
      notes: c.notes ?? "",
    });
    setEditId(c.id);
    setModal("edit");
  }

  function handleSubmit() {
    const payload = {
      name: form.name,
      platform: form.platform,
      adSpend: parseFloat(form.adSpend) || 0,
      revenue: parseFloat(form.revenue) || 0,
      conversions: parseInt(form.conversions) || 0,
      clicks: parseInt(form.clicks) || 0,
      impressions: parseInt(form.impressions) || 0,
      currency: form.currency,
      notes: form.notes || undefined,
    };
    if (modal === "add") {
      createMutation.mutate(payload);
    } else if (modal === "edit" && editId !== null) {
      updateMutation.mutate({ id: editId, data: payload });
    }
  }

  // Chart data
  const roasChartData = campaigns.map((c) => ({
    name: c.name.length > 16 ? c.name.slice(0, 14) + "…" : c.name,
    roas: parseFloat(c.roas.toFixed(2)),
    pno: parseFloat(c.pno.toFixed(1)),
  }));

  const spendRevenueData = campaigns.map((c) => ({
    name: c.name.length > 14 ? c.name.slice(0, 12) + "…" : c.name,
    spend: parseFloat(String(c.adSpend)) || 0,
    revenue: parseFloat(String(c.revenue)) || 0,
  }));

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-violet-400" />
              Ad Campaigns — ROAS / PNO
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track Meta Ads, Google Ads & LinkedIn spend vs. revenue. ROAS ≥ 4× = profitable. PNO ≤ 25% = excellent.
            </p>
          </div>
          <Button onClick={openAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Campaign
          </Button>
        </div>

        {/* Summary KPI Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Ad Spend</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {summary.totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg text-red-400 bg-red-400/10">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg text-emerald-400 bg-emerald-400/10">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">ROAS</p>
                    <p className={`text-xl font-bold mt-1 ${roasColor(summary.roas)}`}>
                      {summary.roas.toFixed(2)}×
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Return on Ad Spend</p>
                  </div>
                  <div className="p-2 rounded-lg text-violet-400 bg-violet-400/10">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">PNO</p>
                    <p className={`text-xl font-bold mt-1 ${pnoColor(summary.pno)}`}>
                      {summary.pno.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Cost-to-Revenue ratio</p>
                  </div>
                  <div className="p-2 rounded-lg text-amber-400 bg-amber-400/10">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">CPA</p>
                    <p className="text-xl font-bold text-foreground mt-1">
                      {summary.cpa.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Cost per Conversion</p>
                  </div>
                  <div className="p-2 rounded-lg text-blue-400 bg-blue-400/10">
                    <MousePointerClick className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ROAS Benchmark Banner */}
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold text-violet-300">ROAS benchmark: </span>
            <span className="text-muted-foreground">
              ≥ 4× = excellent (Černovský case: ~20× on high-ticket) · 2–4× = profitable · &lt; 2× = optimize or pause.{" "}
            </span>
            <span className="font-semibold text-amber-300">PNO: </span>
            <span className="text-muted-foreground">
              ≤ 25% = excellent · 25–50% = acceptable · &gt; 50% = unprofitable.
            </span>
          </div>
        </div>

        {/* Charts */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">ROAS by Campaign</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={roasChartData} margin={{ top: 5, right: 10, left: -15, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.17 0.015 264)", border: "1px solid oklch(0.26 0.015 264)", borderRadius: "8px", color: "oklch(0.93 0.01 264)", fontSize: "12px" }}
                      formatter={(v: number) => [`${v}×`, "ROAS"]}
                    />
                    <Bar dataKey="roas" radius={[4, 4, 0, 0]}>
                      {roasChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.roas >= 4 ? "oklch(0.68 0.18 180)" : entry.roas >= 2 ? "oklch(0.75 0.18 60)" : "oklch(0.62 0.22 25)"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Spend vs. Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={spendRevenueData} margin={{ top: 5, right: 10, left: -15, bottom: 40 }}>
                    <XAxis dataKey="name" tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fill: "oklch(0.58 0.015 264)", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "oklch(0.17 0.015 264)", border: "1px solid oklch(0.26 0.015 264)", borderRadius: "8px", color: "oklch(0.93 0.01 264)", fontSize: "12px" }}
                    />
                    <Bar dataKey="spend" name="Ad Spend" fill="oklch(0.62 0.22 25)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="revenue" name="Revenue" fill="oklch(0.68 0.18 180)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Campaign Table */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold">All Campaigns</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => utils.adCampaigns.list.invalidate()} className="gap-1 text-xs">
              <RefreshCw className="h-3 w-3" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading campaigns…
              </div>
            ) : campaigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-sm">No campaigns yet</p>
                <p className="text-xs mt-1">Add your first Meta Ads or Google Ads campaign to track ROAS & PNO</p>
                <Button size="sm" className="mt-3 gap-1" onClick={openAdd}>
                  <Plus className="h-3 w-3" /> Add Campaign
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left pb-3 pr-4">Campaign</th>
                      <th className="text-left pb-3 pr-4">Platform</th>
                      <th className="text-right pb-3 pr-4">Ad Spend</th>
                      <th className="text-right pb-3 pr-4">Revenue</th>
                      <th className="text-right pb-3 pr-4">ROAS</th>
                      <th className="text-right pb-3 pr-4">PNO</th>
                      <th className="text-right pb-3 pr-4">CPA</th>
                      <th className="text-right pb-3 pr-4">CTR</th>
                      <th className="text-right pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-foreground truncate max-w-[180px]">{c.name}</p>
                          {c.notes && <p className="text-xs text-muted-foreground truncate max-w-[180px]">{c.notes}</p>}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="outline" className={`text-xs ${PLATFORM_COLORS[c.platform]}`}>
                            {PLATFORM_LABELS[c.platform]}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {parseFloat(String(c.adSpend)).toLocaleString()} {c.currency}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-emerald-400">
                          {parseFloat(String(c.revenue)).toLocaleString()} {c.currency}
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`font-bold ${roasColor(c.roas)}`}>{c.roas.toFixed(2)}×</span>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <span className={`font-bold ${pnoColor(c.pno)}`}>{c.pno.toFixed(1)}%</span>
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {c.cpa > 0 ? c.cpa.toFixed(2) : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right text-muted-foreground">
                          {c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-300"
                              onClick={() => deleteMutation.mutate({ id: c.id })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deep Sleep Reset Alpha Case Study Banner */}
        <Card className="bg-gradient-to-r from-violet-900/30 to-blue-900/20 border-violet-500/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-500/20 shrink-0">
                <Zap className="h-6 w-6 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-foreground">Alpha Case Study: Deep Sleep Reset × LeadOS</p>
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30 text-xs">LIVE</Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  $37 digital product · Meta Ads funnel · Email sequences · Affiliate backend. 
                  Target: 100K+ CZK revenue tracked through LeadOS ROAS dashboard.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Product Price", value: "$37", color: "text-emerald-400" },
                    { label: "Target ROAS", value: "≥ 4×", color: "text-violet-400" },
                    { label: "Target PNO", value: "≤ 25%", color: "text-amber-400" },
                    { label: "Revenue Goal", value: "100K+ CZK", color: "text-blue-400" },
                  ].map((item) => (
                    <div key={item.label} className="bg-background/30 rounded-lg p-3 text-center">
                      <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Add "Deep Sleep Reset — Meta Ads" as a campaign above to start tracking. 
                  Once Meta Ads connector is re-authorized, data will sync automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add/Edit Modal */}
        <Dialog open={modal !== null} onOpenChange={(o) => !o && setModal(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{modal === "add" ? "Add Ad Campaign" : "Edit Campaign"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="col-span-2">
                <Label>Campaign Name *</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g. Deep Sleep Reset — Meta Ads"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <Label>Platform</Label>
                <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v as CampaignForm["platform"] }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meta">Meta Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="linkedin">LinkedIn Ads</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Currency</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ad Spend</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0.00" value={form.adSpend} onChange={(e) => setForm((f) => ({ ...f, adSpend: e.target.value }))} />
              </div>
              <div>
                <Label>Revenue</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0.00" value={form.revenue} onChange={(e) => setForm((f) => ({ ...f, revenue: e.target.value }))} />
              </div>
              <div>
                <Label>Conversions</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={form.conversions} onChange={(e) => setForm((f) => ({ ...f, conversions: e.target.value }))} />
              </div>
              <div>
                <Label>Clicks</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={form.clicks} onChange={(e) => setForm((f) => ({ ...f, clicks: e.target.value }))} />
              </div>
              <div>
                <Label>Impressions</Label>
                <Input className="mt-1" type="number" min="0" placeholder="0" value={form.impressions} onChange={(e) => setForm((f) => ({ ...f, impressions: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <Label>Notes (optional)</Label>
                <Input className="mt-1" placeholder="e.g. Targeting: 25-45, interests: sleep, wellness" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            {/* Live ROAS preview */}
            {form.adSpend && form.revenue && (
              <div className="rounded-lg bg-secondary/40 p-3 grid grid-cols-3 gap-3 text-center text-sm">
                <div>
                  <p className={`text-lg font-bold ${roasColor(parseFloat(form.revenue) / parseFloat(form.adSpend))}`}>
                    {(parseFloat(form.revenue) / parseFloat(form.adSpend)).toFixed(2)}×
                  </p>
                  <p className="text-xs text-muted-foreground">ROAS</p>
                </div>
                <div>
                  <p className={`text-lg font-bold ${pnoColor((parseFloat(form.adSpend) / parseFloat(form.revenue)) * 100)}`}>
                    {((parseFloat(form.adSpend) / parseFloat(form.revenue)) * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">PNO</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {(parseFloat(form.revenue) - parseFloat(form.adSpend)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-muted-foreground">Net Profit</p>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.name || isMutating}>
                {isMutating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {modal === "add" ? "Add Campaign" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
