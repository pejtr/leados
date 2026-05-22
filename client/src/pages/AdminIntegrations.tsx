/**
 * Admin Integrations Dashboard — Deep Sleep Admin style
 * Integration cards, API key management, webhook config, REST API docs
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard, Mail, BarChart2, Target, Music, Link2, Key, Copy,
  CheckCircle, XCircle, Clock, ExternalLink, ChevronRight, Zap,
  RefreshCw, Plus, Eye, EyeOff, Trash2, Activity, Webhook,
} from "lucide-react";

// ─── Integration Definitions ────────────────────────────────────────────────
const INTEGRATIONS = [
  {
    id: "stripe",
    name: "Stripe",
    description: "Platební brána — live i test mode",
    Icon: CreditCard,
    iconColor: "text-[#635BFF]",
    bgColor: "bg-[#635BFF]/10",
    docsUrl: "https://dashboard.stripe.com",
    isBuiltIn: true,
    category: "Platby",
  },
  {
    id: "brevo",
    name: "Brevo",
    description: "Email marketing a automatizace",
    Icon: Mail,
    iconColor: "text-[#0B996E]",
    bgColor: "bg-[#0B996E]/10",
    docsUrl: "https://app.brevo.com/settings/keys/api",
    isBuiltIn: false,
    category: "Email",
    keyLabel: "API Key",
    keyPlaceholder: "xkeysib-...",
    keyHint: "Najdeš v Brevo → Settings → API Keys",
  },
  {
    id: "meta-pixel",
    name: "Meta Pixel",
    description: "Conversion tracking + CAPI",
    Icon: BarChart2,
    iconColor: "text-[#1877F2]",
    bgColor: "bg-[#1877F2]/10",
    docsUrl: "https://business.facebook.com/events_manager",
    isBuiltIn: false,
    category: "Reklama",
    keyLabel: "Pixel ID",
    keyPlaceholder: "123456789012345",
    keyHint: "Najdeš v Meta Events Manager → Pixel ID",
  },
  {
    id: "reddit-ads",
    name: "Reddit Ads",
    description: "Reklamní platforma",
    Icon: Target,
    iconColor: "text-[#FF4500]",
    bgColor: "bg-[#FF4500]/10",
    docsUrl: "https://ads.reddit.com",
    isBuiltIn: false,
    category: "Reklama",
    keyLabel: "Client ID",
    keyPlaceholder: "reddit_client_id",
    keyHint: "Najdeš v Reddit Ads → App Settings",
  },
  {
    id: "tiktok-ads",
    name: "TikTok Ads",
    description: "Reklamní platforma",
    Icon: Music,
    iconColor: "text-[#69C9D0]",
    bgColor: "bg-[#69C9D0]/10",
    docsUrl: "https://ads.tiktok.com",
    isBuiltIn: false,
    category: "Reklama",
    keyLabel: "Access Token",
    keyPlaceholder: "tiktok_access_token",
    keyHint: "Najdeš v TikTok Ads → Developer → Apps",
  },
  {
    id: "leados-crm",
    name: "LeadOS CRM",
    description: "REST API pro CRM integraci",
    Icon: Link2,
    iconColor: "text-[#6366F1]",
    bgColor: "bg-[#6366F1]/10",
    docsUrl: "#docs",
    isBuiltIn: true,
    category: "CRM",
  },
] as const;

type IntegrationId = typeof INTEGRATIONS[number]["id"];

const API_ENDPOINTS = [
  { method: "GET",  path: "/api/external/leads",           desc: "Seznam leadů" },
  { method: "GET",  path: "/api/external/orders",          desc: "Seznam objednávek" },
  { method: "GET",  path: "/api/external/analytics",       desc: "KPI metriky" },
  { method: "POST", path: "/api/external/leads",           desc: "Vytvořit lead" },
  { method: "POST", path: "/api/external/email/send",      desc: "Odeslat email" },
  { method: "GET",  path: "/api/external/email-sequences", desc: "Email sekvence" },
];

// ─── Status Badge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: "active" | "inactive" | "error" | "builtin" | "pending" | "configure" }) {
  const map = {
    active:    { icon: CheckCircle, label: "Aktivní",        cls: "text-emerald-400" },
    builtin:   { icon: CheckCircle, label: "Aktivní",        cls: "text-emerald-400" },
    error:     { icon: XCircle,     label: "Chyba",          cls: "text-red-400" },
    pending:   { icon: Clock,       label: "Čeká na klíče",  cls: "text-amber-400" },
    configure: { icon: Zap,         label: "Konfigurace",    cls: "text-sky-400" },
    inactive:  { icon: Clock,       label: "Neaktivní",      cls: "text-zinc-500" },
  };
  const { icon: Icon, label, cls } = map[status];
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

// ─── Config Modal ────────────────────────────────────────────────────────────
function ConfigModal({
  integration,
  open,
  onClose,
  onSaved,
}: {
  integration: typeof INTEGRATIONS[number] | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const saveMutation = trpc.integrations.save.useMutation({
    onSuccess: (data) => {
      toast({ title: data.action === "created" ? "Integrace uložena" : "Aktualizováno", description: `${integration?.name} nakonfigurován.` });
      setApiKey(""); onClose(); onSaved();
    },
    onError: (err) => toast({ title: "Chyba", description: err.message, variant: "destructive" }),
  });

  const testMutation = trpc.integrations.test.useMutation({
    onSuccess: (data) => {
      if (data.success) toast({ title: "Test OK", description: (data as any).message });
      else toast({ title: "Test selhal", description: (data as any).error, variant: "destructive" });
    },
  });

  if (!integration) return null;
  const hasKeyLabel = "keyLabel" in integration;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1623] border border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-white">
            <div className={`w-8 h-8 rounded-lg ${integration.bgColor} flex items-center justify-center`}>
              <integration.Icon className={`w-4 h-4 ${integration.iconColor}`} />
            </div>
            {integration.name} — Konfigurace
          </DialogTitle>
          <DialogDescription className="text-white/40">{integration.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-1">
          {hasKeyLabel && (
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">{(integration as any).keyLabel}</Label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={(integration as any).keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-white/5 border-white/10 text-white pr-10 text-sm"
                />
                <button type="button" onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {(integration as any).keyHint && (
                <p className="text-xs text-white/25">{(integration as any).keyHint}</p>
              )}
            </div>
          )}
          <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300">
            <ExternalLink className="w-3.5 h-3.5" />
            Otevřít {integration.name} dashboard
          </a>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm"
              onClick={() => testMutation.mutate({ integrationId: integration.id as any })}
              disabled={testMutation.isPending || !apiKey}
              className="border-white/10 text-white/60 hover:text-white bg-transparent">
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${testMutation.isPending ? "animate-spin" : ""}`} />
              Test
            </Button>
            <Button onClick={() => saveMutation.mutate({ integrationId: integration.id as any, apiKey: apiKey.trim() })}
              disabled={saveMutation.isPending || !apiKey}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white">
              {saveMutation.isPending ? "Ukládám..." : "Uložit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function AdminIntegrations() {
  const [configTarget, setConfigTarget] = useState<IntegrationId | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPerms, setNewKeyPerms] = useState("read");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showNewWebhook, setShowNewWebhook] = useState(false);
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("new_lead,new_order");
  const { toast } = useToast();

  const { data: integrationsList, refetch: refetchIntegrations } = trpc.integrations.list.useQuery();
  const { data: apiKeys, refetch: refetchKeys } = trpc.apiKeys.list.useQuery();
  const { data: webhooks, refetch: refetchWebhooks } = trpc.webhooks.list.useQuery();

  const createKeyMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setCreatedKey(data.key); setNewKeyName(""); setShowNewKey(false); refetchKeys();
    },
    onError: (err) => toast({ title: "Chyba", description: err.message, variant: "destructive" }),
  });
  const revokeKeyMutation = trpc.apiKeys.revoke.useMutation({
    onSuccess: () => { toast({ title: "Klíč zrušen" }); refetchKeys(); },
  });
  const createWebhookMutation = trpc.webhooks.create.useMutation({
    onSuccess: () => { toast({ title: "Webhook vytvořen" }); setNewWebhookName(""); setNewWebhookUrl(""); setShowNewWebhook(false); refetchWebhooks(); },
    onError: (err) => toast({ title: "Chyba", description: err.message, variant: "destructive" }),
  });
  const testWebhookMutation = trpc.webhooks.test.useMutation({
    onSuccess: (data) => {
      if (data.success) toast({ title: `Test OK (HTTP ${data.statusCode})` });
      else toast({ title: "Test selhal", description: data.error, variant: "destructive" });
    },
  });
  const deleteWebhookMutation = trpc.webhooks.delete.useMutation({
    onSuccess: () => { toast({ title: "Webhook smazán" }); refetchWebhooks(); },
  });

  const getStatus = (id: string) => {
    if (!integrationsList) return null;
    return integrationsList.find((s) => s.integrationId === id)?.status as "active" | "inactive" | "error" | null;
  };

  const copyToClipboard = (text: string, label = "Zkopírováno") => {
    navigator.clipboard.writeText(text);
    toast({ title: label });
  };

  const activeIntegration = INTEGRATIONS.find((i) => i.id === configTarget) || null;
  const categories = ["Platby", "Email", "Reklama", "CRM"] as const;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Integrace &amp; API</h1>
          <p className="text-white/40 mt-1 text-sm">Propoj LeadOS s externími nástroji a platformami.</p>
        </div>

        <Tabs defaultValue="integrations">
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger value="integrations">Integrace</TabsTrigger>
            <TabsTrigger value="api-keys">API Klíče</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooky</TabsTrigger>
            <TabsTrigger value="docs">REST API Docs</TabsTrigger>
          </TabsList>

          {/* ── INTEGRATIONS ── */}
          <TabsContent value="integrations" className="mt-6 space-y-6">
            {categories.map((cat) => {
              const items = INTEGRATIONS.filter((i) => i.category === cat);
              if (!items.length) return null;
              return (
                <div key={cat}>
                  <h2 className="text-xs font-semibold text-white/25 uppercase tracking-widest mb-3">{cat}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {items.map((intg) => {
                      const savedStatus = getStatus(intg.id);
                      let displayStatus: any = intg.isBuiltIn ? "builtin" : savedStatus === "active" ? "active" : savedStatus === "error" ? "error" : savedStatus === null ? "pending" : "configure";
                      return (
                        <div key={intg.id}
                          className={`flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.03] transition-colors ${!intg.isBuiltIn ? "hover:bg-white/[0.06] cursor-pointer" : ""}`}
                          onClick={!intg.isBuiltIn ? () => setConfigTarget(intg.id as IntegrationId) : undefined}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg ${intg.bgColor} flex items-center justify-center flex-shrink-0`}>
                              <intg.Icon className={`w-5 h-5 ${intg.iconColor}`} />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-white">{intg.name}</div>
                              <div className="text-xs text-white/35 mt-0.5">{intg.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={displayStatus} />
                            {!intg.isBuiltIn && <ChevronRight className="w-4 h-4 text-white/15" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          {/* ── API KEYS ── */}
          <TabsContent value="api-keys" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">Bearer token autentizace pro REST API přístup.</p>
              <Button size="sm" onClick={() => setShowNewKey(!showNewKey)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nový klíč
              </Button>
            </div>

            {showNewKey && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Název</Label>
                    <Input placeholder="Např. DSR Integration" value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Oprávnění</Label>
                    <select value={newKeyPerms} onChange={(e) => setNewKeyPerms(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-md h-8 text-sm px-2">
                      <option value="read">read</option>
                      <option value="write">write</option>
                      <option value="email">email</option>
                      <option value="admin">admin</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewKey(false)}
                    className="border-white/10 text-white/50 bg-transparent h-8 text-xs">Zrušit</Button>
                  <Button size="sm" onClick={() => createKeyMutation.mutate({ name: newKeyName, permissions: newKeyPerms })}
                    disabled={!newKeyName || createKeyMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs">
                    {createKeyMutation.isPending ? "Vytvářím..." : "Vytvořit"}
                  </Button>
                </div>
              </div>
            )}

            {createdKey && (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                <p className="text-xs text-emerald-400 mb-2 font-medium">✓ Klíč vytvořen — zkopíruj ho hned!</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-black/30 rounded px-2 py-1.5 text-emerald-300 break-all font-mono">{createdKey}</code>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdKey, "Klíč zkopírován")}
                    className="text-emerald-400 h-8 w-8 p-0">
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <button onClick={() => setCreatedKey(null)} className="text-xs text-white/25 mt-2 hover:text-white/50">Zavřít</button>
              </div>
            )}

            <div className="space-y-2">
              {!apiKeys || (apiKeys as any[]).length === 0 ? (
                <div className="text-center py-10 text-white/25 text-sm">
                  <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádné API klíče. Vytvoř první klíč výše.
                </div>
              ) : (
                (apiKeys as any[]).map((key) => (
                  <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div>
                      <div className="text-sm font-medium text-white">{key.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs border-white/10 text-white/35 py-0">{key.permissions}</Badge>
                        <span className={`text-xs ${key.status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
                          {key.status === "active" ? "Aktivní" : key.status === "revoked" ? "Zrušen" : "Vypršel"}
                        </span>
                      </div>
                    </div>
                    {key.status === "active" && (
                      <Button size="sm" variant="ghost"
                        onClick={() => revokeKeyMutation.mutate({ keyId: key.id })}
                        className="text-red-400/50 hover:text-red-400 h-7 text-xs">
                        Zrušit
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── WEBHOOKS ── */}
          <TabsContent value="webhooks" className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">Real-time notifikace s HMAC-SHA256 podpisem.</p>
              <Button size="sm" onClick={() => setShowNewWebhook(!showNewWebhook)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nový webhook
              </Button>
            </div>

            {showNewWebhook && (
              <div className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">Název</Label>
                    <Input placeholder="Např. DSR Orders" value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-white/50">URL</Label>
                    <Input placeholder="https://example.com/webhook" value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                      className="bg-white/5 border-white/10 text-white h-8 text-sm" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-white/50">Události (comma-separated)</Label>
                  <Input value={newWebhookEvents} onChange={(e) => setNewWebhookEvents(e.target.value)}
                    className="bg-white/5 border-white/10 text-white h-8 text-sm font-mono" />
                  <p className="text-xs text-white/25">Dostupné: new_lead, new_order, quiz_completed, status_change</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setShowNewWebhook(false)}
                    className="border-white/10 text-white/50 bg-transparent h-8 text-xs">Zrušit</Button>
                  <Button size="sm"
                    onClick={() => createWebhookMutation.mutate({ name: newWebhookName, url: newWebhookUrl, events: newWebhookEvents })}
                    disabled={!newWebhookName || !newWebhookUrl || createWebhookMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white h-8 text-xs">
                    {createWebhookMutation.isPending ? "Vytvářím..." : "Vytvořit"}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {!webhooks || (webhooks as any[]).length === 0 ? (
                <div className="text-center py-10 text-white/25 text-sm">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Žádné webhooky. Vytvoř první webhook výše.
                </div>
              ) : (
                (webhooks as any[]).map((wh) => (
                  <div key={wh.id} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white">{wh.name}</div>
                      <div className="text-xs text-white/30 truncate font-mono mt-0.5">{wh.url}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-xs py-0 border-white/10 ${wh.status === "active" ? "text-emerald-400" : "text-zinc-500"}`}>
                          {wh.status}
                        </Badge>
                        <span className="text-xs text-white/25 font-mono">{wh.events}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-3">
                      <Button size="sm" variant="ghost"
                        onClick={() => testWebhookMutation.mutate({ id: wh.id })}
                        disabled={testWebhookMutation.isPending}
                        className="text-blue-400/60 hover:text-blue-400 h-7 w-7 p-0">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost"
                        onClick={() => deleteWebhookMutation.mutate({ id: wh.id })}
                        className="text-red-400/40 hover:text-red-400 h-7 w-7 p-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ── REST API DOCS ── */}
          <TabsContent value="docs" className="mt-6 space-y-4">
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">LeadOS REST API</h3>
                <p className="text-xs text-white/40">Přístup k datům přes REST API s Bearer token autentizací.</p>
              </div>
              <div className="space-y-2">
                {API_ENDPOINTS.map((ep) => (
                  <div key={ep.path + ep.method}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-black/20 border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold font-mono w-10 ${ep.method === "GET" ? "text-emerald-400" : "text-blue-400"}`}>
                        {ep.method}
                      </span>
                      <code className="text-xs text-white/60 font-mono">{ep.path}</code>
                    </div>
                    <span className="text-xs text-white/25">{ep.desc}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                <p className="text-xs text-white/25 font-mono">Authorization header:</p>
                <code className="text-xs text-indigo-300 font-mono">Authorization: Bearer YOUR_API_KEY</code>
              </div>
              <div className="rounded-lg bg-black/40 border border-white/5 p-3 space-y-2">
                <p className="text-xs text-white/25 font-mono">Webhook signature verification:</p>
                <code className="text-xs text-purple-300 font-mono">X-LeadOS-Signature: sha256=HMAC_SHA256(secret, body)</code>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Config Modal */}
      <ConfigModal
        integration={activeIntegration}
        open={!!configTarget && !activeIntegration?.isBuiltIn}
        onClose={() => setConfigTarget(null)}
        onSaved={refetchIntegrations}
      />
    </DashboardLayout>
  );
}
