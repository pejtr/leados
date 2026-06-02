import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  Plus, Link2, Trash2, RefreshCw, Copy, CheckCircle2, Globe,
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Eye, Users,
  ChevronDown, ChevronUp, Code2, ExternalLink, Zap, BarChart3,
  Megaphone, Target, ArrowRight, Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";


// ─── Types ────────────────────────────────────────────────────────
type Project = {
  id: number;
  name: string;
  description: string | null;
  url: string | null;
  category: string | null;
  apiKey: string;
  isActive: boolean;
  currency: string;
  createdAt: Date;
};

// ─── SDK Snippet ─────────────────────────────────────────────────
function getSdkSnippet(apiKey: string, baseUrl: string) {
  return `<!-- LeadOS Analytics SDK — paste before </body> -->
<script>
(function(w,d,k){
  w._lpos = w._lpos || { q: [], track: function(e,v,m){ w._lpos.q.push([e,v,m,new Date()]); } };
  var s = d.createElement('script'); s.async = true;
  s.src = '${baseUrl}/api/ingest-sdk.js?key=' + k;
  d.head.appendChild(s);
})(window, document, '${apiKey}');
</script>

<!-- Manual tracking examples -->
<script>
// Track a sale
fetch('${baseUrl}/api/ingest/${apiKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'sale',
    value: 120,          // amount in CZK
    currency: 'CZK',
    metadata: { orderId: 'ORD-001', product: 'Deep Sleep Reset' }
  })
});

// Track a pageview
fetch('${baseUrl}/api/ingest/${apiKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ eventType: 'pageview', value: 0 })
});

// Track ad spend (call from your server after Meta/Google billing)
fetch('${baseUrl}/api/ingest/${apiKey}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventType: 'adspend',
    value: 500,
    currency: 'CZK',
    metadata: { platform: 'meta', campaign: 'reels-tier2' }
  })
});
</script>`;
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = "text-foreground", icon: Icon }: {
  label: string; value: string; sub?: string; color?: string; icon: any;
}) {
  return (
    <div className="bg-muted/30 border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className={`text-2xl font-black ${color}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

// ─── Ad ROAS Widget ───────────────────────────────────────────────
function AdRoasWidget({ projectId, currency }: { projectId: number; currency: string }) {
  const { data: adSummary } = trpc.projects.getAdSummary.useQuery({ id: projectId });
  const { data: allCampaigns = [] } = trpc.adCampaigns.list.useQuery();
  const linkMutation = trpc.projects.linkCampaign.useMutation({
    onSuccess: () => {
      utils.projects.getAdSummary.invalidate({ id: projectId });
      utils.adCampaigns.list.invalidate();
      toast.success("Kampaň propojena s projektem");
    },
    onError: (e) => toast.error(e.message),
  });
  const utils = trpc.useUtils();

  const unlinkedCampaigns = allCampaigns.filter((c) => !c.projectId || c.projectId === projectId);
  const linkedCampaigns = allCampaigns.filter((c) => c.projectId === projectId);

  const [showLinkMenu, setShowLinkMenu] = useState(false);

  if (!adSummary && linkedCampaigns.length === 0) {
    return (
      <div className="border-t border-border px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Megaphone className="w-3.5 h-3.5" /> Ad Campaigns — ROAS
          </span>
          <Button size="sm" variant="outline" className="h-6 text-xs gap-1 px-2" onClick={() => setShowLinkMenu(!showLinkMenu)}>
            <Link2 className="w-3 h-3" /> Propojit
          </Button>
        </div>
        {showLinkMenu && unlinkedCampaigns.length > 0 ? (
          <div className="space-y-1 mt-2">
            {unlinkedCampaigns.map((c) => (
              <button key={c.id}
                className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 flex items-center justify-between gap-2"
                onClick={() => { linkMutation.mutate({ campaignId: c.id, projectId }); setShowLinkMenu(false); }}>
                <span className="truncate font-medium">{c.name}</span>
                <span className="text-muted-foreground flex-shrink-0">{c.platform}</span>
              </button>
            ))}
          </div>
        ) : showLinkMenu ? (
          <p className="text-xs text-muted-foreground mt-2">
            Nejdřív přidejte kampaně v <Link href="/ad-campaigns" className="text-primary underline">Ad Campaigns</Link>.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Žádné propojené kampaně.{" "}
            <Link href="/ad-campaigns" className="text-primary underline">Přidat kampaň →</Link>
          </p>
        )}
      </div>
    );
  }

  const roas = adSummary?.roas;
  const pno = adSummary?.pno;

  return (
    <div className="border-t border-border px-5 py-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Megaphone className="w-3.5 h-3.5" /> Ad Campaigns — ROAS
        </span>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2" onClick={() => setShowLinkMenu(!showLinkMenu)}>
            <Link2 className="w-3 h-3" /> Přidat
          </Button>
          <Link href="/ad-campaigns">
            <Button size="sm" variant="ghost" className="h-6 text-xs gap-1 px-2">
              <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ROAS / PNO summary */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <div className={`text-lg font-black ${roas !== null && roas !== undefined ? (roas >= 2 ? "text-green-500" : roas >= 1 ? "text-yellow-500" : "text-red-500") : "text-muted-foreground"}`}>
            {roas !== null && roas !== undefined ? `${roas.toFixed(2)}×` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">ROAS</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <div className={`text-lg font-black ${pno !== null && pno !== undefined ? (pno <= 30 ? "text-green-500" : pno <= 60 ? "text-yellow-500" : "text-red-500") : "text-muted-foreground"}`}>
            {pno !== null && pno !== undefined ? `${pno.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">PNO</div>
        </div>
        <div className="bg-muted/30 rounded-lg p-2.5 text-center">
          <div className="text-lg font-black text-foreground">
            {adSummary ? adSummary.campaignCount : linkedCampaigns.length}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Kampaně</div>
        </div>
      </div>

      {/* Ad spend vs revenue row */}
      {adSummary && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Ad Spend: <strong className="text-foreground">{adSummary.totalSpend.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} {currency}</strong></span>
          <span>Revenue: <strong className="text-green-500">{adSummary.totalRevenue.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} {currency}</strong></span>
        </div>
      )}

      {/* Campaign list */}
      {linkedCampaigns.length > 0 && (
        <div className="mt-3 space-y-1">
          {linkedCampaigns.map((c) => {
            const cSpend = parseFloat(c.adSpend as string) || 0;
            const cRev = parseFloat(c.revenue as string) || 0;
            const cRoas = cSpend > 0 ? cRev / cSpend : null;
            return (
              <div key={c.id} className="flex items-center justify-between text-xs px-2 py-1.5 rounded-lg bg-muted/20 hover:bg-muted/40">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.platform === "meta" ? "bg-blue-500" : c.platform === "google" ? "bg-yellow-500" : "bg-purple-500"}`} />
                  <span className="truncate font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <span className={`font-bold ${cRoas !== null ? (cRoas >= 2 ? "text-green-500" : cRoas >= 1 ? "text-yellow-500" : "text-red-500") : "text-muted-foreground"}`}>
                    {cRoas !== null ? `${cRoas.toFixed(1)}×` : "—"}
                  </span>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    title="Odpojit kampaň"
                    onClick={() => linkMutation.mutate({ campaignId: c.id, projectId: null })}>
                    <Unlink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link menu */}
      {showLinkMenu && (
        <div className="mt-2 space-y-1">
          {unlinkedCampaigns.filter((c) => !c.projectId).map((c) => (
            <button key={c.id}
              className="w-full text-left text-xs px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-between gap-2 border border-primary/20"
              onClick={() => { linkMutation.mutate({ campaignId: c.id, projectId }); setShowLinkMenu(false); }}>
              <span className="truncate font-medium">{c.name}</span>
              <span className="text-muted-foreground flex-shrink-0">{c.platform}</span>
            </button>
          ))}
          {unlinkedCampaigns.filter((c) => !c.projectId).length === 0 && (
            <p className="text-xs text-muted-foreground px-1">
              Všechny kampaně jsou propojeny. <Link href="/ad-campaigns" className="text-primary underline">Přidat novou →</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────
function ProjectCard({ project, onDelete, onRegenKey }: {
  project: Project;
  onDelete: (id: number) => void;
  onRegenKey: (id: number) => void;
}) {
  const [showKey, setShowKey] = useState(false);
  const [showSdk, setShowSdk] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: stats } = trpc.projects.getStats.useQuery({ id: project.id, days: 30 });

  const baseUrl = window.location.origin;

  const copyKey = () => {
    navigator.clipboard.writeText(project.apiKey);
    setCopied(true);
    toast.success("API klíč zkopírován");
    setTimeout(() => setCopied(false), 2000);
  };

  const copySdk = () => {
    navigator.clipboard.writeText(getSdkSnippet(project.apiKey, baseUrl));
    toast.success("SDK snippet zkopírován");
  };

  const categoryColors: Record<string, string> = {
    ecommerce: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    saas: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    content: "bg-green-500/10 text-green-400 border-green-500/20",
    affiliate: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    other: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };

  const profit = stats ? stats.netRevenue - stats.totalAdSpend : null;
  const roas = stats?.roas;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-bold text-base truncate">{project.name}</h3>
              <Badge variant="outline" className={`text-xs border ${categoryColors[project.category ?? "other"] ?? categoryColors.other}`}>
                {project.category}
              </Badge>
            </div>
            {project.url && (
              <a href={project.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary truncate">
                <Globe className="w-3 h-3 flex-shrink-0" />
                {project.url.replace(/^https?:\/\//, "")}
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
              </a>
            )}
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowSdk(!showSdk)} title="Zobrazit SDK">
              <Code2 className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setDeleteConfirm(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* API Key row */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-muted/50 rounded-lg px-3 py-1.5 font-mono text-xs text-muted-foreground truncate">
            {showKey ? project.apiKey : project.apiKey.slice(0, 12) + "••••••••••••••••••••••••"}
          </div>
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={() => setShowKey(!showKey)} title="Zobrazit/skrýt klíč">
            {showKey ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0" onClick={copyKey} title="Kopírovat klíč">
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 text-muted-foreground" onClick={() => onRegenKey(project.id)} title="Regenerovat klíč">
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Stats (last 30 days) */}
      {stats && (
        <div className="p-5 grid grid-cols-2 gap-3">
          <StatCard label="Tržby / 30d" value={`${stats.netRevenue.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} ${project.currency}`}
            sub={`${stats.salesCount} prodejů`} color="text-foreground" icon={DollarSign} />
          <StatCard label="Zisk / 30d"
            value={`${profit !== null ? (profit >= 0 ? "+" : "") + profit.toLocaleString("cs-CZ", { maximumFractionDigits: 0 }) : "—"} ${project.currency}`}
            color={profit !== null ? (profit >= 0 ? "text-green-500" : "text-red-500") : "text-muted-foreground"}
            icon={profit !== null && profit >= 0 ? TrendingUp : TrendingDown} />
          <StatCard label="ROAS (events)" value={roas !== null && roas !== undefined ? `${roas.toFixed(2)}×` : "—"}
            color={roas !== null && roas !== undefined ? (roas >= 1 ? "text-green-500" : "text-red-500") : "text-muted-foreground"}
            icon={BarChart3} />
          <StatCard label="Pageviews" value={stats.pageviewCount.toLocaleString("cs-CZ")}
            sub={stats.cvr !== null ? `CVR ${stats.cvr.toFixed(1)}%` : undefined}
            icon={Eye} />
        </div>
      )}
      {!stats && (
        <div className="p-5 text-center text-sm text-muted-foreground py-8">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Žádná data ještě. Přidejte SDK snippet do vašeho projektu.</p>
        </div>
      )}

      {/* Ad Campaigns ROAS Widget */}
      <AdRoasWidget projectId={project.id} currency={project.currency} />

      {/* SDK Snippet */}
      {showSdk && (
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Integration snippet</span>
            <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={copySdk}>
              <Copy className="w-3 h-3" /> Kopírovat
            </Button>
          </div>
          <pre className="bg-muted/50 rounded-lg p-3 text-xs font-mono overflow-x-auto text-muted-foreground whitespace-pre-wrap break-all">
            {getSdkSnippet(project.apiKey, baseUrl)}
          </pre>
        </div>
      )}

      {/* Delete confirm */}
      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat projekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Tato akce smaže projekt <strong>{project.name}</strong> a všechna jeho analytická data. Nelze vrátit zpět.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Zrušit</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => onDelete(project.id)}>
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ProjectsHub() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", url: "", category: "ecommerce", currency: "CZK" });

  const utils = trpc.useUtils();
  const { data: projects = [], isLoading } = trpc.projects.list.useQuery();
  const { data: allStats } = trpc.projects.getAllStats.useQuery({ days: 30 });

  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      utils.projects.list.invalidate();
      setShowCreate(false);
      setForm({ name: "", description: "", url: "", category: "ecommerce", currency: "CZK" });
      toast.success("Projekt přidán! Zkopírujte API klíč a přidejte snippet do vašeho webu.");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("Projekt smazán"); },
    onError: (e) => toast.error(e.message),
  });

  const regenKeyMutation = trpc.projects.regenerateKey.useMutation({
    onSuccess: () => { utils.projects.list.invalidate(); toast.success("Nový API klíč vygenerován"); },
    onError: (e) => toast.error(e.message),
  });

  // Aggregate totals
  const totals = allStats?.reduce((acc, { stats }) => ({
    revenue: acc.revenue + stats.netRevenue,
    adspend: acc.adspend + stats.totalAdSpend,
    sales: acc.sales + stats.salesCount,
    profit: acc.profit + (stats.netRevenue - stats.totalAdSpend),
  }), { revenue: 0, adspend: 0, sales: 0, profit: 0 });

  const totalRoas = totals && totals.adspend > 0 ? totals.revenue / totals.adspend : null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">Projekty — Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Napojte libovolný projekt přes API klíč a sledujte vše na jednom místě. Propojte Ad Campaigns pro ROAS/PNO přímo na kartě projektu.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/ad-campaigns">
            <Button variant="outline" className="gap-2">
              <Megaphone className="w-4 h-4" /> Ad Campaigns
            </Button>
          </Link>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Přidat projekt
          </Button>
        </div>
      </div>

      {/* Aggregate KPIs */}
      {totals && projects.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Celkové tržby / 30d" value={`${totals.revenue.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`}
            sub={`${projects.length} projektů`} icon={DollarSign} />
          <StatCard label="Celkový zisk / 30d"
            value={`${totals.profit >= 0 ? "+" : ""}${totals.profit.toLocaleString("cs-CZ", { maximumFractionDigits: 0 })} Kč`}
            color={totals.profit >= 0 ? "text-green-500" : "text-red-500"}
            icon={totals.profit >= 0 ? TrendingUp : TrendingDown} />
          <StatCard label="Celkový ROAS"
            value={totalRoas !== null ? `${totalRoas.toFixed(2)}×` : "—"}
            color={totalRoas !== null ? (totalRoas >= 1 ? "text-green-500" : "text-red-500") : "text-muted-foreground"}
            icon={BarChart3} />
          <StatCard label="Celkem prodejů / 30d" value={totals.sales.toLocaleString("cs-CZ")}
            sub="všechny projekty" icon={ShoppingCart} />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && projects.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
          <Link2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-bold mb-2">Žádné projekty</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Přidejte svůj první projekt (Deep Sleep Reset, e-shop, SaaS...) a získejte API klíč pro sledování prodejů, tržeb a ROAS v reálném čase.
          </p>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Přidat první projekt
          </Button>
        </div>
      )}

      {/* Project cards */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p as Project}
              onDelete={(id) => deleteMutation.mutate({ id })}
              onRegenKey={(id) => regenKeyMutation.mutate({ id })}
            />
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-muted/20 border border-border rounded-2xl p-6">
        <h2 className="font-bold text-base mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Jak to funguje
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          {[
            { step: "1", title: "Přidejte projekt", desc: "Klikněte na 'Přidat projekt', zadejte název a URL vašeho webu. Dostanete unikátní API klíč." },
            { step: "2", title: "Vložte snippet", desc: "Zkopírujte JS snippet a vložte ho do vašeho webu. Volejte track() při každém prodeji, pageview nebo ad spend." },
            { step: "3", title: "Propojte kampaně", desc: "V Ad Campaigns přidejte Meta/Google kampaně s ad spend a revenue. Propojte je s projektem jedním klikem." },
            { step: "4", title: "Sledujte ROAS", desc: "ROAS, PNO a zisk všech projektů na jednom místě. Analyticky zvyšujte ziskovost každé kampaně." },
          ].map((item) => (
            <div key={item.step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-sm flex items-center justify-center flex-shrink-0">
                {item.step}
              </div>
              <div>
                <div className="font-semibold mb-1">{item.title}</div>
                <div className="text-muted-foreground text-xs leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Přidat nový projekt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Název projektu *</Label>
              <Input placeholder="Deep Sleep Reset" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>URL webu</Label>
              <Input placeholder="https://deepsleepreset.manus.space" value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>Popis (volitelný)</Label>
              <Input placeholder="$5 sleep program, DTC e-commerce" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Kategorie</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="content">Content / Blog</SelectItem>
                    <SelectItem value="affiliate">Affiliate</SelectItem>
                    <SelectItem value="other">Ostatní</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Měna</Label>
                <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CZK">CZK</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Zrušit</Button>
            <Button disabled={!form.name || createMutation.isPending}
              onClick={() => createMutation.mutate(form)}>
              {createMutation.isPending ? "Vytváří se..." : "Vytvořit projekt"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
