import React, { useState, useEffect } from "react";
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
import {
  Brain, Plus, Download, Trash2, Clock, CheckCircle, AlertCircle,
  Loader2, ChevronRight, Sparkles, BarChart2, Shield, Zap, Rocket,
  ThumbsUp, ThumbsDown, ShieldCheck
} from "lucide-react";

// --- Markdown renderer ---
function MarkdownBlock({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-2 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">');
  return (
    <div
      className="prose prose-sm max-w-none text-foreground/90 leading-relaxed text-sm"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${html}</p>` }}
    />
  );
}

// --- Confidence Score Panel ---
function ConfidenceScorePanel({
  score,
  advocateAnalysis,
  skepticAnalysis,
  reasoning,
}: {
  score: number;
  advocateAnalysis: string;
  skepticAnalysis: string;
  reasoning: string;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label =
    score >= 80 ? "Vysok\u00e1 spolehlivost" : score >= 60 ? "St\u0159edn\u00ed spolehlivost" : "N\u00edzk\u00e1 spolehlivost";
  const circumference = 2 * Math.PI * 28;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="mb-5 rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-left"
      >
        {/* Circular progress */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
            <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
            <circle
              cx="32" cy="32" r="28" fill="none"
              stroke={color} strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color }}>{score}</span>
          </div>
        </div>
        {/* Label + reasoning */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4" style={{ color }} />
            <span className="font-semibold text-sm" style={{ color }}>{label}</span>
            <span className="text-xs text-muted-foreground ml-auto">{expanded ? "Skryt" : "Detail"}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{reasoning}</p>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {/* Advocate */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ThumbsUp className="w-3 h-3 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-emerald-400">Advok\u00e1t</span>
            </div>
            <MarkdownBlock content={advocateAnalysis} />
          </div>
          {/* Skeptic */}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <ThumbsDown className="w-3 h-3 text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-amber-400">Skeptik</span>
            </div>
            <MarkdownBlock content={skepticAnalysis} />
          </div>
        </div>
      )}
    </div>
  );
}

// --- Expert config ---
const EXPERTS = [
  { key: "pragmaticArchitect", name: "Pragmatick\u00fd Architekt",  emoji: "\ud83c\udfd7\ufe0f", color: "#6366f1", icon: Shield,   desc: "Syst\u00e9my, \u0161k\u00e1lovatelnost, realizovatelnost" },
  { key: "creativeVisionary",  name: "Kreativn\u00ed Vizion\u00e1\u0159", emoji: "\ud83c\udfa8", color: "#ec4899", icon: Sparkles, desc: "Inovace, diferenciace, blue-ocean p\u0159\u00edle\u017eitosti" },
  { key: "criticalInvestor",   name: "Kritick\u00fd Investor",      emoji: "\ud83d\udcb0", color: "#f59e0b", icon: BarChart2, desc: "ROI, unit economics, kapit\u00e1lov\u00e1 efektivita" },
  { key: "technicalPurist",    name: "Technick\u00fd Purista",      emoji: "\u2699\ufe0f",  color: "#10b981", icon: Zap,      desc: "Kvalita k\u00f3du, bezpe\u010dnost, technick\u00e1 excelence" },
  { key: "growthHacker",       name: "Growth Hacker",               emoji: "\ud83d\ude80", color: "#3b82f6", icon: Rocket,   desc: "GTM, akvi\u017eice, vir\u00e1ln\u00ed smy\u010dky, retence" },
] as const;

type ExpertKey = typeof EXPERTS[number]["key"];

// --- Status badge ---
function StatusBadge({ status }: { status: string }) {
  if (status === "done")    return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="w-3 h-3 mr-1" />Hotovo</Badge>;
  if (status === "running") return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analyzuji&hellip;</Badge>;
  if (status === "error")   return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="w-3 h-3 mr-1" />Chyba</Badge>;
  return <Badge className="bg-muted text-muted-foreground"><Clock className="w-3 h-3 mr-1" />Cek\u00e1</Badge>;
}

// --- Main component ---
export default function FiveBrains() {
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("master");
  const [title, setTitle] = useState("");
  const [contextData, setContextData] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const { data: analyses, refetch } = trpc.fiveBrains.list.useQuery(undefined, { refetchInterval: 5000 });
  const { data: selected } = trpc.fiveBrains.get.useQuery(
    { id: selectedId! },
    { enabled: !!selectedId, refetchInterval: (data) => data?.status === "running" ? 3000 : false }
  );
  const startMutation  = trpc.fiveBrains.start.useMutation();
  const deleteMutation = trpc.fiveBrains.delete.useMutation();

  useEffect(() => {
    if (analyses && analyses.length > 0 && !selectedId) setSelectedId(analyses[0].id);
  }, [analyses]);

  useEffect(() => {
    if (selected?.status === "done") refetch();
  }, [selected?.status]);

  const handleStart = async () => {
    if (!title.trim() || !contextData.trim()) { toast.error("Vypln n\u00e1zev a kontext anal\u00fdzy"); return; }
    setIsStarting(true);
    try {
      const result = await startMutation.mutateAsync({ title, contextType: "custom", contextData });
      setSelectedId(result.id);
      setNewDialogOpen(false);
      setTitle(""); setContextData(""); setActiveTab("master");
      toast.success("5 mozk\u016f spu\u0161t\u011bno \u2014 anal\u00fdza prob\u00edh\u00e1\u2026");
      refetch();
    } catch (e: any) {
      toast.error(e?.message || "Chyba p\u0159i spu\u0161t\u011bn\u00ed anal\u00fdzy");
    } finally {
      setIsStarting(false);
    }
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync({ id });
    if (selectedId === id) setSelectedId(null);
    refetch();
    toast.success("Anal\u00fdza smaz\u00e1na");
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
      "## Master Report",
      selected.masterReport || "N/A",
      "",
      ...EXPERTS.map(e => [`## ${e.emoji} ${e.name}`, (selected as any)[e.key] || "N/A", ""]).flat()
    ].join("\n");
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `5brains-${selected.title.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report sta\u017een jako Markdown");
  };

  const quickContextTemplates = [
    {
      label: "LeadOS \u2014 celkov\u00fd projekt",
      value: `Projekt: LeadOS (crmleadsystem.com)
Typ: B2B SaaS platforma pro AI-driven lead generation
Stack: React 19 + tRPC + Drizzle ORM + MySQL + Gemini AI
Funkce: Lead scraping (Apify), AI scoring, icebreaker generov\u00e1n\u00ed, CRM pipeline, Ad Campaigns ROAS tracking, Portfolio ROAS dashboard, 5 Brains analytics, Projects Hub, Autopilot, Email sequences, Webhook integrace
C\u00edlov\u00fd trh: \u010cesk\u00e1 republika a st\u0159edn\u00ed Evropa, B2B sales t\u00fdmy, freelance\u0159i, agentury
Monetizace: Freemium + Starter/Pro/Growth pl\u00e1ny (Stripe)
Aktu\u00e1ln\u00ed f\u00e1ze: MVP live na crmleadsystem.com
C\u00edl: 100k+ CZK MRR do konce roku 2026`
    },
    {
      label: "Deep Sleep Reset \u2014 alpha case study",
      value: `Projekt: Deep Sleep Reset
Typ: Digit\u00e1ln\u00ed info-produkt ($37 one-time)
Platforma: deepsleepreset.manus.space
Funnel: Meta Ads \u2192 Landing page \u2192 Stripe checkout \u2192 Email sekvence
C\u00edl: Demonstrovat LeadOS ROAS tracking jako alpha case study pro 100k+ CZK revenue`
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex h-full min-h-[720px]">
        {/* Sidebar: list of analyses */}
        <div className="w-72 border-r border-border flex flex-col shrink-0">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="font-semibold text-sm">5 Brains</span>
            </div>
            <Button size="sm" onClick={() => setNewDialogOpen(true)} className="h-7 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" />Nov\u00e1
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {!analyses || analyses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs px-4">
                <Brain className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p>Zat\u00edm \u017e\u00e1dn\u00e9 anal\u00fdzy.</p>
                <p className="mt-1">Klikni "Nov\u00e1" a spu\u0161\u0165 5 mozk\u016f.</p>
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

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">5 Brains &mdash; Multispektr\u00e1ln\u00ed anal\u00fdza</h2>
              <p className="text-muted-foreground text-sm max-w-md mb-6">
                5 AI expert\u016f analyzuje tv\u016fj projekt, kamp\u00e1\u0148 nebo libovoln\u00fd kontext paraleln\u011b z r\u016fzn\u00fdch perspektiv a syntetizuje v\u00fdsledky do master reportu.
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
                <Plus className="w-4 h-4 mr-2" />Spustit prvn\u00ed anal\u00fdzu
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
                      {selected.status === "done" && (selected as any).confidenceScore != null && (
                        <Badge
                          className="text-[10px] h-5"
                          style={{
                            background: `${(selected as any).confidenceScore >= 80 ? "#10b981" : (selected as any).confidenceScore >= 60 ? "#f59e0b" : "#ef4444"}20`,
                            color: (selected as any).confidenceScore >= 80 ? "#10b981" : (selected as any).confidenceScore >= 60 ? "#f59e0b" : "#ef4444",
                            borderColor: `${(selected as any).confidenceScore >= 80 ? "#10b981" : (selected as any).confidenceScore >= 60 ? "#f59e0b" : "#ef4444"}40`,
                          }}
                        >
                          <ShieldCheck className="w-2.5 h-2.5 mr-1" />
                          {(selected as any).confidenceScore}% spolehlivost
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {selected.status === "done" && (
                  <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 text-xs">
                    <Download className="w-3 h-3 mr-1" />St\u00e1hnout MD
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
                    <p className="font-semibold">5 mozk\u016f analyzuje&hellip;</p>
                    <p className="text-sm text-muted-foreground mt-1">Paraleln\u00ed vol\u00e1n\u00ed AI expert\u016f prob\u00edh\u00e1. Obvykle 30&ndash;90 sekund.</p>
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
                    <p className="font-semibold">Anal\u00fdza selhala</p>
                    <p className="text-sm text-muted-foreground mt-1">Zkus spustit novou anal\u00fdzu se stejn\u00fdm kontextem.</p>
                  </div>
                </div>
              )}

              {/* Done state with tabs */}
              {selected.status === "done" && (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 pt-3 border-b border-border">
                    <TabsList className="h-8">
                      <TabsTrigger value="master" className="text-xs px-3 h-7">&#129504; Master Report</TabsTrigger>
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
                        {/* Confidence Score Panel */}
                        {(selected as any).confidenceScore != null && (
                          <ConfidenceScorePanel
                            score={(selected as any).confidenceScore}
                            advocateAnalysis={(selected as any).advocateAnalysis || ""}
                            skepticAnalysis={(selected as any).skepticAnalysis || ""}
                            reasoning={(selected as any).confidenceReasoning || ""}
                          />
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm">Syntetizovan\u00fd Master Report</h3>
                            <p className="text-xs text-muted-foreground">Synt\u00e9za pohled\u016f v\u0161ech 5 expert\u016f</p>
                          </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-5">
                          <MarkdownBlock content={selected.masterReport || "Master report nen\u00ed dostupn\u00fd."} />
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
                            <MarkdownBlock content={(selected as any)[e.key] || "Anal\u00fdza nen\u00ed dostupn\u00e1."} />
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

      {/* New Analysis Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Nov\u00e1 5 Brains anal\u00fdza
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-medium mb-1.5 block">N\u00e1zev anal\u00fdzy</Label>
              <Input
                placeholder="nap\u0159. LeadOS Q2 2026 \u2014 strategick\u00e1 anal\u00fdza"
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
                placeholder="Popi\u0161 projekt, kamp\u00e1\u0148 nebo situaci, kterou chce\u0161 analyzovat. \u010c\u00edm v\u00edce detail\u016f, t\u00edm kvalitn\u011bj\u0161\u00ed anal\u00fdza. (min. 10 znak\u016f)"
                value={contextData}
                onChange={(e) => setContextData(e.target.value)}
                className="text-sm min-h-[160px] font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">{contextData.length} / 8000 znak\u016f</p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground font-medium mb-2">5 expert\u016f bude analyzovat paraleln\u011b:</p>
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
            <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Zru\u0161it</Button>
            <Button onClick={handleStart} disabled={isStarting || !title.trim() || contextData.length < 10}>
              {isStarting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              Spustit 5 mozk\u016f
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
