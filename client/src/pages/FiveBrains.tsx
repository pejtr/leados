import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Brain, Plus, Download, Trash2, Clock, CheckCircle, AlertCircle, Loader2, ChevronRight, Sparkles, BarChart2, TrendingUp, Shield, Zap, Rocket } from "lucide-react";

// ─── Expert config (mirrors server) ─────────────────────────────────────────
const EXPERTS = [
  { key: "pragmaticArchitect", name: "Pragmatický Architekt", emoji: "🏗️", color: "#6366f1", icon: Shield, desc: "Systémy, škálovatelnost, realizovatelnost" },
  { key: "creativeVisionary",  name: "Kreativní Vizionář",   emoji: "🎨", color: "#ec4899", icon: Sparkles, desc: "Inovace, diferenciace, blue-ocean příležitosti" },
  { key: "criticalInvestor",   name: "Kritický Investor",    emoji: "💰", color: "#f59e0b", icon: BarChart2, desc: "ROI, unit economics, kapitálová efektivita" },
  { key: "technicalPurist",    name: "Technický Purista",    emoji: "⚙️", color: "#10b981", icon: Zap, desc: "Kvalita kódu, bezpečnost, technická excelence" },
  { key: "growthHacker",       name: "Growth Hacker",        emoji: "🚀", color: "#3b82f6", icon: Rocket, desc: "GTM, akvizice, virální smyčky, retence" },
] as const;

type ExpertKey = typeof EXPERTS[number]["key"];

// ─── Markdown renderer (simple) ──────────────────────────────────────────────
function MarkdownBlock({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<[h|l])/gm, '')
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(Boolean);
      return '<tr>' + cells.map(c => `<td class="border border-border px-2 py-1 text-sm">${c.trim()}</td>`).join('') + '</tr>';
    });
  return (
    <div
      className="prose prose-sm max-w-none text-foreground/90 leading-relaxed text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
    />
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "done") return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Hotovo</Badge>;
  if (status === "running") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzuji…</Badge>;
  if (status === "error") return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Chyba</Badge>;
  return <Badge className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Čeká</Badge>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FiveBrains() {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("master");
  const [title, setTitle] = useState("");
  const [contextType, setContextType] = useState<"project" | "campaign" | "custom">("custom");
  const [contextData, setContextData] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const { data: analyses, refetch } = trpc.fiveBrains.list.useQuery(undefined, { refetchInterval: 5000 });
  const { data: selected, refetch: refetchSelected } = trpc.fiveBrains.get.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId, refetchInterval: (data) => data?.status === "running" ? 3000 : false }
  );
  const startMutation = trpc.fiveBrains.start.useMutation();
  const deleteMutation = trpc.fiveBrains.delete.useMutation();

  // Auto-select first analysis
  useEffect(() => {
    if (analyses && analyses.length > 0 && !selectedId) {
      setSelectedId(analyses[0].id);
    }
  }, [analyses]);

  // Refetch list when selected analysis completes
  useEffect(() => {
    if (selected?.status === "done") refetch();
  }, [selected?.status]);

  const handleStart = async () => {
    if (!title.trim() || !contextData.trim()) {
      toast.error("Vyplň název a kontext analýzy");
      return;
    }
    setIsStarting(true);
    try {
      const result = await startMutation.mutateAsync({ title, contextType, contextData });
      setSelectedId(result.id);
      setNewDialogOpen(false);
      setTitle("");
      setContextData("");
      setActiveTab("master");
      toast.success("5 mozků spuštěno — analýza probíhá…");
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Chyba při spuštění analýzy");
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    if (selectedId === id) setSelectedId(null);
    refetch();
    toast.success("Analýza smazána");
  };

  const handleDownload = () => {
    if (!selected) return;
    const content = [
      `# ${selected.title}`,
      `Datum: ${new Date(selected.createdAt).toLocaleString("cs-CZ")}`,
      `Status: ${selected.status}`,
      "",
      "---",
      "",
      "## 🧠 Master Report",
      selected.masterReport || "N/A",
      "",
      ...EXPERTS.map(e => [
        `## ${e.emoji} ${e.name}`,
        (selected as any)[e.key] || "N/A",
        ""
      ]).flat()
    ].join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `5brains-${selected.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report stažen jako Markdown");
  };

  const quickContextTemplates = [
    {
      label: "LeadOS — celkový projekt",
      value: `Projekt: LeadOS (crmleadsystem.com)
Typ: B2B SaaS platforma pro AI-driven lead generation
Stack: React 19 + tRPC + Drizzle ORM + MySQL + Gemini AI
Funkce: Lead scraping (Apify), AI scoring, icebreaker generování, CRM pipeline, Ad Campaigns ROAS tracking, Portfolio ROAS dashboard, 5 Brains analytics, Projects Hub (Command Center), Autopilot, Email sequences, Webhook integrace
Cílový trh: Česká republika a střední Evropa, B2B sales týmy, freelanceři, agentury
Monetizace: Freemium + Starter/Pro/Growth plány (Stripe)
Aktuální fáze: MVP live na crmleadsystem.com, alpha case study = Deep Sleep Reset ($37 info-produkt)
Cíl: 100k+ CZK MRR do konce roku 2026`
    },
    {
      label: "Deep Sleep Reset — alpha case study",
      value: `Projekt: Deep Sleep Reset
Typ: Digitální info-produkt ($37 one-time)
Platforma: deepsleepreset.manus.space
Funnel: Meta Ads → Landing page → Stripe checkout → Email sekvence
Ad spend: Meta Ads (Facebook/Instagram)
Cíl: Demonstrovat LeadOS ROAS tracking jako alpha case study pro 100k+ CZK revenue
Integrace: LeadOS ingest API (dsr_96c230...) pro real-time sale eventy
Výzvy: Nízká cena produktu = potřeba vysokého volume, ROAS musí být >3×`
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-[720px]">
        {/* ── Sidebar: list of analyses ── */}
        <div className="w-72 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">5 Brains</span>
            </div>
            <Button size="sm" onClick={() => setNewDialogOpen(true)} className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />Nová
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!analyses || analyses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs px-4">
                <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Zatím žádné analýzy.</p>
                <p className="mt-1">Klikni "Nová" a spusť 5 mozků.</p>
              </div>
            ) : (
              analyses.map((a) => (
                <div
                  key={a.id}
                  onClick={() => setSelectedId(a.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${selectedId === a.id ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50"}`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <p className="text-xs font-medium leading-tight line-clamp-2 flex-1">{a.title}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge status={a.status} />
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("cs-CZ")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">5 Brains — Multispektrální analýza</h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                5 AI expertů analyzuje tvůj projekt, kampaň nebo libovolný kontext paralelně z různých perspektiv a syntetizuje výsledky do master reportu.
              </p>
              <div className="grid grid-cols-5 gap-3 mb-8 max-w-2xl">
                {EXPERTS.map((e) => (
                  <div key={e.key} className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border bg-card">
                    <span className="text-2xl">{e.emoji}</span>
                    <span className="text-[10px] font-medium text-center leading-tight">{e.name}</span>
                  </div>
                ))}
              </div>
              <Button onClick={() => setNewDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />Spustit první analýzu
              </Button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Brain className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h2 className="font-semibold text-sm">{selected.title}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={selected.status} />
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(selected.createdAt).toLocaleString("cs-CZ")}
                      </span>
                    </div>
                  </div>
                </div>
                {selected.status === "done" && (
                  <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 text-xs">
                    <Download className="w-3 h-3 mr-1" />Stáhnout MD
                  </Button>
                )}
              </div>

              {/* Running state */}
              {selected.status === "running" && (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                    <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold">5 mozků analyzuje…</p>
                    <p className="text-sm text-muted-foreground mt-1">Paralelní volání AI expertů probíhá. Obvykle 30–90 sekund.</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2 max-w-lg">
                    {EXPERTS.map((e) => {
                      const isDone = !!(selected as any)[e.key];
                      return (
                        <div key={e.key} className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${isDone ? "border-emerald-500/40 bg-emerald-500/10" : "border-border bg-muted/30"}`}>
                          <span className="text-xl">{e.emoji}</span>
                          {isDone ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Error state */}
              {selected.status === "error" && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-3" />
                    <p className="font-semibold">Analýza selhala</p>
                    <p className="text-sm text-muted-foreground mt-1">Zkus spustit novou analýzu se stejným kontextem.</p>
                  </div>
                </div>
              )}

              {/* Done state — tabs */}
              {selected.status === "done" && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 pt-3 border-b border-border">
                    <TabsList className="h-8">
                      <TabsTrigger value="master" className="text-xs px-3 h-7">🧠 Master Report</TabsTrigger>
                      {EXPERTS.map((e) => (
                        <TabsTrigger key={e.key} value={e.key} className="text-xs px-2 h-7">
                          {e.emoji} <span className="hidden lg:inline ml-1">{e.name.split(" ")[0]}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5">
                    <TabsContent value="master" className="mt-0">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">Syntetizovaný Master Report</h3>
                            <p className="text-xs text-muted-foreground">Syntéza pohledů všech 5 expertů</p>
                          </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                          <MarkdownBlock content={selected.masterReport || "Master report není dostupný."} />
                        </div>
                      </div>
                    </TabsContent>

                    {EXPERTS.map((e) => (
                      <TabsContent key={e.key} value={e.key} className="mt-0">
                        <div className="max-w-3xl">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: `${e.color}20` }}>
                              {e.emoji}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm">{e.name}</h3>
                              <p className="text-xs text-muted-foreground">{e.desc}</p>
                            </div>
                          </div>
                          <div className="bg-card border border-border rounded-xl p-5" style={{ borderColor: `${e.color}30` }}>
                            <MarkdownBlock content={(selected as any)[e.key] || "Analýza není dostupná."} />
                          </div>
                        </div>
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── New Analysis Dialog ── */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Nová 5 Brains analýza
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">Název analýzy</Label>
              <Input
                placeholder="např. LeadOS Q2 2026 — strategická analýza"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-sm"
              />
            </div>

            <div>
              <Label className="text-xs font-medium mb-1.5 block">Kontext pro experty</Label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {quickContextTemplates.map((t) => (
                  <button
                    key={t.label}
                    onClick={() => { setContextData(t.value); setTitle(t.label); }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3 inline mr-0.5" />{t.label}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Popiš projekt, kampaň nebo situaci, kterou chceš analyzovat. Čím více detailů, tím kvalitnější analýza. (min. 10 znaků)"
                value={contextData}
                onChange={(e) => setContextData(e.target.value)}
                className="text-sm min-h-[160px] font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">{contextData.length} / 8000 znaků</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium mb-2">5 expertů bude analyzovat paralelně:</p>
              <div className="grid grid-cols-5 gap-2">
                {EXPERTS.map((e) => (
                  <div key={e.key} className="flex flex-col items-center gap-1 text-center">
                    <span className="text-lg">{e.emoji}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{e.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Zrušit</Button>
            <Button onClick={handleStart} disabled={isStarting || !title.trim() || contextData.length < 10}>
              {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Spustit 5 mozků
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
