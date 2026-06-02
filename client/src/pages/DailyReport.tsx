import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

import {
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  TrendingUp,
  Users,
  Megaphone,
  RefreshCw,
  Info,
} from "lucide-react";

export default function DailyReport() {
  const { data: config, isLoading, refetch } = trpc.dailyReport.get.useQuery();

  const [email, setEmail] = useState("");
  const [sendHour, setSendHour] = useState(8);
  const [includeProjects, setIncludeProjects] = useState(true);
  const [includeCampaigns, setIncludeCampaigns] = useState(true);
  const [includeLeads, setIncludeLeads] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize form from loaded config
  if (config && !initialized) {
    setEmail(config.email);
    setSendHour(config.sendHour);
    setIncludeProjects(config.includeProjects);
    setIncludeCampaigns(config.includeCampaigns);
    setIncludeLeads(config.includeLeads);
    setInitialized(true);
  }

  const saveMutation = trpc.dailyReport.save.useMutation({
    onSuccess: () => {
      toast.success("Nastavení reportu uloženo");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.dailyReport.toggle.useMutation({
    onSuccess: () => {
      toast.success("Stav reportu aktualizován");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const sendNowMutation = trpc.dailyReport.sendNow.useMutation({
    onSuccess: () => {
      toast.success("Testovací report odeslán! Zkontrolujte svůj email a Manus notifikace.");
      refetch();
    },
    onError: (err) => toast.error(`Chyba: ${err.message}`),
  });

  const handleSave = () => {
    if (!email) {
      toast.error("Zadejte emailovou adresu");
      return;
    }
    saveMutation.mutate({
      email,
      isActive: config?.isActive ?? true,
      sendHour,
      includeProjects,
      includeCampaigns,
      includeLeads,
    });
  };

  const handleToggle = (active: boolean) => {
    if (!config) {
      toast.error("Nejprve uložte nastavení reportu");
      return;
    }
    toggleMutation.mutate({ isActive: active });
  };

  const formatLastSent = (ts: number | null | undefined) => {
    if (!ts) return "Nikdy";
    return new Date(ts).toLocaleString("cs-CZ", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getHourLabel = (hour: number) => {
    const h = hour.toString().padStart(2, "0");
    return `${h}:00 UTC (${(hour + 1) % 24}:00 SEČ)`;
  };

  if (isLoading) {
    return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    </DashboardLayout>
  );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-cyan-400" />
            Denní Sales Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Automatický email s přehledem prodejů, leadů a ROAS metrik každý den.
          </p>
        </div>
        {config && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {config.isActive ? "Aktivní" : "Neaktivní"}
            </span>
            <Switch
              checked={config.isActive}
              onCheckedChange={handleToggle}
              disabled={toggleMutation.isPending}
            />
          </div>
        )}
      </div>

      {/* Status Card */}
      {config && (
        <Card className="border-cyan-500/20 bg-cyan-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                {config.isActive ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {config.isActive ? "Report je aktivní" : "Report je pozastaven"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Naposledy odesláno: {formatLastSent(config.lastSentAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Odesílá se v {getHourLabel(config.sendHour)}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nastavení reportu</CardTitle>
          <CardDescription>Kam a kdy odesílat denní report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              Email příjemce
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="petr.matej@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="max-w-sm"
            />
            <p className="text-xs text-muted-foreground">
              Report bude odeslán na tuto adresu. Pokud email selže, přijde Manus push notifikace.
            </p>
          </div>

          <Separator />

          {/* Send Hour */}
          <div className="space-y-2">
            <Label htmlFor="sendHour" className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Čas odeslání (UTC hodina)
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="sendHour"
                type="number"
                min={0}
                max={23}
                value={sendHour}
                onChange={(e) => setSendHour(parseInt(e.target.value) || 0)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                = {getHourLabel(sendHour)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Doporučeno: 7 UTC = 8:00 SEČ (ráno před prací)
            </p>
          </div>

          <Separator />

          {/* Content toggles */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Obsah reportu</Label>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-sm font-medium">Projekty & Revenue</p>
                  <p className="text-xs text-muted-foreground">Prodeje a příjmy za posledních 24h</p>
                </div>
              </div>
              <Switch
                checked={includeProjects}
                onCheckedChange={setIncludeProjects}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-sm font-medium">Ad Kampaně & ROAS</p>
                  <p className="text-xs text-muted-foreground">Výdaje, ROAS a PNO metrik</p>
                </div>
              </div>
              <Switch
                checked={includeCampaigns}
                onCheckedChange={setIncludeCampaigns}
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-sm font-medium">Nové Leady</p>
                  <p className="text-xs text-muted-foreground">Počet nově přidaných leadů</p>
                </div>
              </div>
              <Switch
                checked={includeLeads}
                onCheckedChange={setIncludeLeads}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-cyan-500 hover:bg-cyan-600 text-black"
            >
              {saveMutation.isPending ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 mr-2" />
              )}
              Uložit nastavení
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Send */}
      <Card className="border-emerald-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-400" />
            Testovací odeslání
          </CardTitle>
          <CardDescription>
            Odešle report okamžitě bez čekání na naplánovaný čas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-3">
                Kliknutím odešlete testovací report na <strong>{config?.email || email || "váš email"}</strong>.
                Report bude obsahovat aktuální data z posledních 24 hodin.
              </p>
              <Button
                onClick={() => sendNowMutation.mutate()}
                disabled={sendNowMutation.isPending || !config}
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
              >
                {sendNowMutation.isPending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Odeslat testovací report
              </Button>
              {!config && (
                <p className="text-xs text-amber-400 mt-2">
                  Nejprve uložte nastavení reportu
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            Ukázka obsahu reportu
          </CardTitle>
          <CardDescription>Co bude report obsahovat</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">KPI Přehled</p>
                <p className="text-xs text-muted-foreground">Revenue, počet prodejů, ROAS za posledních 24h</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs">🧠</span>
              </div>
              <div>
                <p className="text-sm font-medium">AI Shrnutí</p>
                <p className="text-xs text-muted-foreground">2-3 věty od AI analytika s doporučením v češtině</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Megaphone className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Ad Metriky</p>
                <p className="text-xs text-muted-foreground">PNO, Ad Spend, top projekt a top kampaň podle ROAS</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium">CTA odkaz</p>
                <p className="text-xs text-muted-foreground">Přímý odkaz na Portfolio ROAS dashboard</p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg border border-cyan-500/20 bg-cyan-500/5">
            <p className="text-xs text-cyan-300 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              Report je odesílán přes Manus Forge Email API. Pokud email selže (např. limit), přijde
              push notifikace přímo do Manus. Doporučujeme otestovat před aktivací.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
