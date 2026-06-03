import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Webhook, Plus, Trash2, TestTube, CheckCircle2, XCircle,
  Clock, ExternalLink, Slack, SquareKanban, Globe, Loader2,
  Activity, Send, Settings2, ShieldCheck, AlertTriangle, Lock, Eye, Zap, ArrowRight, Bot,
} from "lucide-react";

type IntegrationType = "generic" | "clickup" | "slack";

interface CreateFormData {
  name: string;
  type: IntegrationType;
  webhookUrl: string;
  clickupApiKey: string;
  clickupListId: string;
  slackWebhookUrl: string;
  triggerOnGenerate: boolean;
  triggerOnStatusChange: boolean;
  triggerOnDealClose: boolean;
}

const defaultForm: CreateFormData = {
  name: "",
  type: "generic",
  webhookUrl: "",
  clickupApiKey: "",
  clickupListId: "",
  slackWebhookUrl: "",
  triggerOnGenerate: true,
  triggerOnStatusChange: false,
  triggerOnDealClose: false,
};

const typeInfo: Record<IntegrationType, { icon: typeof Webhook; label: string; color: string; description: string }> = {
  generic: {
    icon: Globe,
    label: "Webhook",
    color: "bg-blue-500/10 text-blue-500",
    description: "Odesílej data leadů na libovolnou URL (Zapier, Make, n8n, vlastní)",
  },
  clickup: {
    icon: SquareKanban,
    label: "ClickUp",
    color: "bg-purple-500/10 text-purple-500",
    description: "Automaticky vytvářej úkoly v ClickUp z leadů",
  },
  slack: {
    icon: Slack,
    label: "Slack",
    color: "bg-green-500/10 text-green-500",
    description: "Dostávej notifikace o leadech do Slack kanálu",
  },
};

export default function Integrations() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormData>({ ...defaultForm });
  const [testingId, setTestingId] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const utils = trpc.useUtils();
  const { data: configs = [], isLoading } = trpc.integrations.list.useQuery();
  const { data: logs = [] } = trpc.integrations.logs.useQuery({ limit: 50 });

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      toast.success("Integrace úspěšně vytvořena");
      setCreateOpen(false);
      setForm({ ...defaultForm });
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Integrace smazána");
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.integrations.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Test webhooku úspěšný! ✅");
      } else {
        toast.error(`Test selhal: HTTP ${result.status} — ${result.error || result.body}`);
      }
      setTestingId(null);
      utils.integrations.logs.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setTestingId(null);
    },
  });

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Název je povinný");
      return;
    }
    if (form.type === "generic" && !form.webhookUrl.trim()) {
      toast.error("Webhook URL je povinná");
      return;
    }
    if (form.type === "clickup" && (!form.clickupApiKey.trim() || !form.clickupListId.trim())) {
      toast.error("ClickUp API klíč a List ID jsou povinné");
      return;
    }
    if (form.type === "slack" && !form.slackWebhookUrl.trim()) {
      toast.error("Slack webhook URL je povinná");
      return;
    }

    createMutation.mutate({
      name: form.name,
      type: form.type,
      webhookUrl: form.type === "generic" ? form.webhookUrl : undefined,
      clickupApiKey: form.type === "clickup" ? form.clickupApiKey : undefined,
      clickupListId: form.type === "clickup" ? form.clickupListId : undefined,
      slackWebhookUrl: form.type === "slack" ? form.slackWebhookUrl : undefined,
      triggerOnGenerate: form.triggerOnGenerate,
      triggerOnStatusChange: form.triggerOnStatusChange,
      triggerOnDealClose: form.triggerOnDealClose,
    });
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testMutation.mutate({ id });
  };

  const handleHermesAutomate = () => {
    // Navigate to HERA/HERMES with pre-filled automation request
    navigate("/hermio");
    setTimeout(() => {
      // Store the automation request for HERA to pick up
      sessionStorage.setItem("hera_auto_task", JSON.stringify({
        type: "build_integration",
        message: "Postav mi automatizaci integrací: navrhni optimální webhook workflow pro moje leady. Analyzuj moje aktuální pipeline a doporuč, které integrace (Zapier, Make, n8n, Slack, ClickUp) by nejvíce zvýšily ROI. Pak mi krok za krokem pomoz je nastavit.",
        timestamp: Date.now(),
      }));
    }, 100);
    toast.info("🤖 HERMES přebírá — automatizuji integrační workflow...", {
      description: "Přesměrovávám na HERA Command Center",
    });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Webhook className="h-6 w-6 text-primary" />
              Integrace
            </h1>
            <p className="text-muted-foreground mt-1">
              Propoj svůj lead pipeline se Zapier, Make, ClickUp, Slack a dalšími nástroji
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* HERMES Automation Button */}
            <Button
              variant="outline"
              className="gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
              onClick={handleHermesAutomate}
            >
              <Bot className="h-4 w-4" />
              HERMES automatizuje
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Přidat integraci
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nová integrace</DialogTitle>
                  <DialogDescription>
                    Propoj své leady s externími nástroji a službami
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Název</Label>
                    <Input
                      placeholder="např. Můj Zapier Webhook"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Typ</Label>
                    <Select
                      value={form.type}
                      onValueChange={(v) => setForm({ ...form, type: v as IntegrationType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="generic">
                          <span className="flex items-center gap-2">
                            <Globe className="h-4 w-4" /> Webhook (Zapier/Make/n8n)
                          </span>
                        </SelectItem>
                        <SelectItem value="clickup">
                          <span className="flex items-center gap-2">
                            <SquareKanban className="h-4 w-4" /> ClickUp
                          </span>
                        </SelectItem>
                        <SelectItem value="slack">
                          <span className="flex items-center gap-2">
                            <Slack className="h-4 w-4" /> Slack
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Type-specific fields */}
                  {form.type === "generic" && (
                    <div>
                      <Label>Webhook URL</Label>
                      <Input
                        placeholder="https://hooks.zapier.com/..."
                        value={form.webhookUrl}
                        onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Leady budou odesílány jako JSON POST na tuto URL
                      </p>
                    </div>
                  )}

                  {form.type === "clickup" && (
                    <>
                      <div>
                        <Label>ClickUp API Token</Label>
                        <Input
                          type="password"
                          placeholder="pk_..."
                          value={form.clickupApiKey}
                          onChange={(e) => setForm({ ...form, clickupApiKey: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Získej token v{" "}
                          <a href="https://app.clickup.com/settings/apps" target="_blank" rel="noopener" className="text-primary underline">
                            ClickUp Nastavení → Aplikace
                          </a>
                        </p>
                      </div>
                      <div>
                        <Label>ClickUp List ID</Label>
                        <Input
                          placeholder="901234567"
                          value={form.clickupListId}
                          onChange={(e) => setForm({ ...form, clickupListId: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Najdi List ID v ClickUp → Nastavení seznamu → Kopírovat ID
                        </p>
                      </div>
                    </>
                  )}

                  {form.type === "slack" && (
                    <div>
                      <Label>Slack Webhook URL</Label>
                      <Input
                        placeholder="https://hooks.slack.com/services/..."
                        value={form.slackWebhookUrl}
                        onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Vytvoř{" "}
                        <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener" className="text-primary underline">
                          Incoming Webhook
                        </a>{" "}
                        ve svém Slack workspace
                      </p>
                    </div>
                  )}

                  {/* Trigger events */}
                  <div className="space-y-3 pt-2 border-t">
                    <Label className="text-sm font-semibold">Spouštěcí události</Label>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Nové vygenerované leady</Label>
                      <Switch
                        checked={form.triggerOnGenerate}
                        onCheckedChange={(v) => setForm({ ...form, triggerOnGenerate: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Změna stavu leadu</Label>
                      <Switch
                        checked={form.triggerOnStatusChange}
                        onCheckedChange={(v) => setForm({ ...form, triggerOnStatusChange: v })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-normal">Uzavřený deal</Label>
                      <Switch
                        checked={form.triggerOnDealClose}
                        onCheckedChange={(v) => setForm({ ...form, triggerOnDealClose: v })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Zrušit
                  </Button>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Vytvořit
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* HERMES Automation Banner */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center shrink-0">
            <Bot className="h-5 w-5 text-cyan-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">HERMES umí integraci postavit automaticky</p>
            <p className="text-xs text-white/60 mt-0.5">Řekni HERMES co potřebuješ propojit — navrhne workflow, pomůže s konfigurací a otestuje spojení za tebe.</p>
          </div>
          <Button
            size="sm"
            className="shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white gap-2"
            onClick={handleHermesAutomate}
          >
            <Zap className="h-3.5 w-3.5" />
            Spustit
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Tabs defaultValue="configs">
          <TabsList>
            <TabsTrigger value="configs" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Konfigurace
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Logy doručení
            </TabsTrigger>
            <TabsTrigger value="n8n-gateway" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              n8n Security Gateway
            </TabsTrigger>
          </TabsList>

          {/* Configurations Tab */}
          <TabsContent value="configs" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : configs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold">Zatím žádné integrace</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Propoj svůj lead pipeline se Zapier, Make, ClickUp, Slack nebo libovolným webhook endpointem.
                    Leady budou automaticky odesílány při generování.
                  </p>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" className="gap-2 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10" onClick={handleHermesAutomate}>
                      <Bot className="h-4 w-4" />
                      HERMES mi pomůže
                    </Button>
                    <Button onClick={() => setCreateOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Přidat první integraci
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => {
                  const info = typeInfo[config.type as IntegrationType] || typeInfo.generic;
                  const Icon = info.icon;
                  return (
                    <Card key={config.id} className={!config.isActive ? "opacity-60" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${info.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{config.name}</CardTitle>
                              <CardDescription>{info.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={config.isActive}
                              onCheckedChange={(v) =>
                                toggleMutation.mutate({ id: config.id, isActive: v })
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTest(config.id)}
                              disabled={testingId === config.id}
                            >
                              {testingId === config.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              <span className="ml-1">Test</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Smazat tuto integraci?")) {
                                  deleteMutation.mutate({ id: config.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {config.triggerOnGenerate && (
                            <Badge variant="secondary" className="text-xs">
                              <Send className="h-3 w-3 mr-1" />
                              Při generování
                            </Badge>
                          )}
                          {config.triggerOnStatusChange && (
                            <Badge variant="secondary" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              Při změně stavu
                            </Badge>
                          )}
                          {config.triggerOnDealClose && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Při uzavření dealu
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {info.label}
                          </Badge>
                        </div>
                        {config.type === "generic" && config.webhookUrl && (
                          <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
                            {config.webhookUrl}
                          </p>
                        )}
                        {config.type === "clickup" && config.clickupListId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            List ID: <span className="font-mono">{config.clickupListId}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Setup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Zapier / Make / n8n
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Propoj s 5 000+ aplikacemi. Vytvoř Webhook trigger v Zapier/Make, vlož URL sem.
                  </p>
                  <a
                    href="https://zapier.com/apps/webhook/integrations"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Průvodce nastavením <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SquareKanban className="h-4 w-4 text-purple-500" />
                    ClickUp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Automaticky vytváří úkoly z leadů. Získej API token v ClickUp Nastavení → Aplikace.
                  </p>
                  <a
                    href="https://clickup.com/api/developer-portal/authentication/"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Získat API Token <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Slack className="h-4 w-4 text-green-500" />
                    Slack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Okamžité notifikace. Vytvoř Incoming Webhook ve svém Slack workspace.
                  </p>
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Vytvořit Webhook <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Nedávná doručení webhooků</CardTitle>
                <CardDescription>Posledních 50 webhook událostí a jejich stav</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>Zatím žádná doručení webhooků</p>
                    <p className="text-xs mt-1">Události se zobrazí po prvním generování leadů</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <div>
                            <span className="font-medium capitalize">
                              {log.eventType.replace("_", " ")}
                            </span>
                            {log.responseStatus && (
                              <Badge
                                variant={log.success ? "secondary" : "destructive"}
                                className="ml-2 text-xs"
                              >
                                HTTP {log.responseStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString("cs-CZ")}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* n8n Security Gateway Tab */}
          <TabsContent value="n8n-gateway" className="mt-4 space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 shrink-0">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground">n8n Security Gateway</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Best practice z AI OS videa: AI nikdy nekomunikuje přímo s citlivými systémy (CRM, banka, ERP). Všechna automatizace prochází přes n8n jako Security Gateway s Human-in-the-Loop schválením.
                  </p>
                </div>
              </div>

              {/* Architecture diagram */}
              <div className="bg-muted/40 rounded-xl p-4">
                <div className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Architektura Security Gateway</div>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { icon: <Zap className="h-4 w-4" />, label: "LeadOS AI", color: "bg-blue-100 text-blue-700 border-blue-200" },
                    { icon: <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />, label: "", color: "" },
                    { icon: <ShieldCheck className="h-4 w-4" />, label: "n8n Gateway", color: "bg-orange-100 text-orange-700 border-orange-200" },
                    { icon: <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />, label: "", color: "" },
                    { icon: <Eye className="h-4 w-4" />, label: "Lidská kontrola", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
                    { icon: <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />, label: "", color: "" },
                    { icon: <Lock className="h-4 w-4" />, label: "CRM / ERP / Banka", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
                  ].map((item, i) => (
                    item.label ? (
                      <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${item.color}`}>
                        {item.icon}{item.label}
                      </div>
                    ) : (
                      <div key={i}>{item.icon}</div>
                    )
                  ))}
                </div>
              </div>

              {/* Best practices */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    title: "Režim konceptu",
                    desc: "Všechny akce z AI jsou nejprve uloženy jako koncept. Žádná akce se neprovede bez explicitního schválení.",
                    icon: <Eye className="h-4 w-4" />,
                    color: "bg-blue-50 border-blue-200 text-blue-800",
                    iconColor: "text-blue-600",
                    status: "Aktivní v LeadOS",
                    statusColor: "bg-emerald-100 text-emerald-700",
                  },
                  {
                    title: "Sandboxing webhooků",
                    desc: "Webhooky do externích systémů procházejí validací payloadu a rate limitingem před odesíláním.",
                    icon: <ShieldCheck className="h-4 w-4" />,
                    color: "bg-orange-50 border-orange-200 text-orange-800",
                    iconColor: "text-orange-600",
                    status: "Doporučeno",
                    statusColor: "bg-yellow-100 text-yellow-700",
                  },
                  {
                    title: "Člověk v smyčce",
                    desc: "SDR kampaně vyžadují manuální schválení před aktivací. AI připraví, člověk rozhodne.",
                    icon: <CheckCircle2 className="h-4 w-4" />,
                    color: "bg-emerald-50 border-emerald-200 text-emerald-800",
                    iconColor: "text-emerald-600",
                    status: "Implementováno",
                    statusColor: "bg-emerald-100 text-emerald-700",
                  },
                  {
                    title: "Audit log",
                    desc: "Každá akce AI agenta je logována s timestampem, uživatelem a výsledkem pro plnou auditovatelnost.",
                    icon: <Activity className="h-4 w-4" />,
                    color: "bg-violet-50 border-violet-200 text-violet-800",
                    iconColor: "text-violet-600",
                    status: "Logy doručení",
                    statusColor: "bg-violet-100 text-violet-700",
                  },
                ].map(bp => (
                  <div key={bp.title} className={`border rounded-xl p-4 ${bp.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`flex items-center gap-1.5 font-semibold text-sm ${bp.iconColor}`}>
                        {bp.icon}{bp.title}
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${bp.statusColor}`}>{bp.status}</span>
                    </div>
                    <p className="text-xs opacity-80">{bp.desc}</p>
                  </div>
                ))}
              </div>

              {/* n8n setup guide */}
              <div className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-semibold">Jak nastavit n8n Security Gateway</span>
                </div>
                <ol className="space-y-2">
                  {[
                    { step: "1", text: "Nainstaluj n8n (cloud nebo self-hosted): n8n.io" },
                    { step: "2", text: "Vytvoř Webhook trigger workflow v n8n" },
                    { step: "3", text: "Přidej Webhook URL do LeadOS Integrace → Nový Webhook (typ: generic)" },
                    { step: "4", text: "V n8n přidej IF node: pokud data.security.requires_approval = true → pošli Slack notifikaci" },
                    { step: "5", text: "Schválení přes Slack button spustí další akce (CRM update, email, task)" },
                  ].map(item => (
                    <li key={item.step} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{item.step}</span>
                      {item.text}
                    </li>
                  ))}
                </ol>
                <a
                  href="https://n8n.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Otevřít n8n.io
                </a>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-800">
                  <strong>Bezpečnostní tip:</strong> Nikdy nepřipojuj AI agenta přímo k bankovnímu API nebo produkčnímu CRM. Vždy použij n8n nebo Make jako buffer vrstvu s manuálním schválením pro kritické akce.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
