import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  TrendingUp, Plus, ChevronRight, ChevronLeft, Loader2, Trash2,
  CheckCircle2, Clock, Euro, Zap, BarChart2, Target, AlertCircle,
  ArrowRight, Lightbulb, Shield, X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Process {
  name: string;
  description: string;
  timePerWeekHours: number;
  valueRating: number;
}

interface FeasibilityResult {
  processName: string;
  feasibilityScore: number;
  roiScore: number;
  automationType: string;
  recommendation: string;
  tools: string[];
  estimatedTimeSavedHoursMonthly: number;
  estimatedCostSavingEurMonthly: number;
  implementationEffort: string;
  firstStep: string;
}

const STEP_LABELS = [
  "Mapování procesů",
  "Prioritizace",
  "AI Analýza",
  "Výsledky & ROI",
];

const EFFORT_COLORS: Record<string, string> = {
  low: "text-emerald-600 bg-emerald-50",
  medium: "text-yellow-600 bg-yellow-50",
  high: "text-red-600 bg-red-50",
};

const TYPE_COLORS: Record<string, string> = {
  full: "text-emerald-700 bg-emerald-100",
  partial: "text-blue-700 bg-blue-100",
  human_in_loop: "text-orange-700 bg-orange-100",
};

export default function RoiAudit() {
  const [step, setStep] = useState(0); // 0=list, 1=map, 2=prioritize, 3=analyzing, 4=results
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionTitle, setSessionTitle] = useState("");
  const [processes, setProcesses] = useState<Process[]>([
    { name: "", description: "", timePerWeekHours: 2, valueRating: 3 },
  ]);
  const [analysisResult, setAnalysisResult] = useState<FeasibilityResult[]>([]);
  const [totalTimeSaved, setTotalTimeSaved] = useState(0);
  const [totalSaving, setTotalSaving] = useState(0);
  const [topPriority, setTopPriority] = useState("");
  const [showNewAudit, setShowNewAudit] = useState(false);

  const { data: sessions = [], refetch: refetchSessions } = trpc.roiAudit.list.useQuery();

  const createMutation = trpc.roiAudit.create.useMutation({
    onSuccess: (data) => {
      setSessionId(data.id);
      setStep(1);
    },
    onError: (err) => toast.error(err.message),
  });

  const saveProcessesMutation = trpc.roiAudit.saveProcesses.useMutation({
    onSuccess: () => setStep(2),
    onError: (err) => toast.error(err.message),
  });

  const analyzeMutation = trpc.roiAudit.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysisResult(data.analysis);
      setTotalTimeSaved(data.totalTimeSavedHours);
      setTotalSaving(data.estimatedMonthlySavingEur);
      setTopPriority(data.topPriority);
      setStep(4);
      refetchSessions();
    },
    onError: (err) => {
      toast.error(err.message);
      setStep(2);
    },
  });

  const deleteMutation = trpc.roiAudit.delete.useMutation({
    onSuccess: () => { toast.success("Audit smazán"); refetchSessions(); },
  });

  const handleStartAudit = () => {
    if (!sessionTitle.trim()) return toast.error("Zadejte název auditu");
    createMutation.mutate({ title: sessionTitle });
  };

  const handleSaveProcesses = () => {
    const valid = processes.filter(p => p.name.trim() && p.description.trim());
    if (valid.length === 0) return toast.error("Přidejte alespoň jeden proces");
    if (!sessionId) return;
    saveProcessesMutation.mutate({ id: sessionId, processes: valid });
  };

  const handleAnalyze = () => {
    if (!sessionId) return;
    setStep(3);
    analyzeMutation.mutate({ id: sessionId });
  };

  const addProcess = () => {
    setProcesses(prev => [...prev, { name: "", description: "", timePerWeekHours: 2, valueRating: 3 }]);
  };

  const removeProcess = (i: number) => {
    setProcesses(prev => prev.filter((_, idx) => idx !== i));
  };

  const updateProcess = (i: number, field: keyof Process, value: string | number) => {
    setProcesses(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const resetWizard = () => {
    setStep(0);
    setSessionId(null);
    setSessionTitle("");
    setProcesses([{ name: "", description: "", timePerWeekHours: 2, valueRating: 3 }]);
    setAnalysisResult([]);
    setShowNewAudit(false);
  };

  // Session list view
  if (step === 0) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" />
                ROI Audit Wizard
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                4-krokový framework pro mapování procesů a AI feasibility analýzu. Inspirováno metodikou z videa.
              </p>
            </div>
            <Button onClick={() => setShowNewAudit(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Nový Audit
            </Button>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { step: 1, title: "Mapování", desc: "Zapiš všechny procesy co děláš", icon: <BarChart2 className="h-4 w-4" />, color: "bg-blue-50 text-blue-600" },
              { step: 2, title: "Prioritizace", desc: "Ohodnoť hodnotu a čas každého procesu", icon: <Target className="h-4 w-4" />, color: "bg-violet-50 text-violet-600" },
              { step: 3, title: "AI Analýza", desc: "AI vyhodnotí feasibility a ROI", icon: <Zap className="h-4 w-4" />, color: "bg-emerald-50 text-emerald-600" },
              { step: 4, title: "Výsledky", desc: "Dostaneš prioritizovaný akční plán", icon: <TrendingUp className="h-4 w-4" />, color: "bg-orange-50 text-orange-600" },
            ].map(s => (
              <div key={s.step} className="bg-card border border-border rounded-xl p-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", s.color)}>{s.icon}</div>
                <div className="text-xs font-semibold text-foreground">Krok {s.step}: {s.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</div>
              </div>
            ))}
          </div>

          {/* Past sessions */}
          {sessions.length > 0 ? (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Předchozí audity</h2>
              {sessions.map(s => (
                <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium text-sm text-foreground">{s.title}</div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
                      <span className={cn("px-2 py-0.5 rounded-full font-medium", s.status === "analyzed" ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700")}>
                        {s.status === "analyzed" ? "Analyzováno" : s.status === "processes_saved" ? "Procesy uloženy" : "Rozpracováno"}
                      </span>
                      {s.estimatedMonthlySavingEur && (
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <Euro className="h-3 w-3" />
                          {s.estimatedMonthlySavingEur} EUR/měs. úspora
                        </span>
                      )}
                      {s.totalTimeSavedHours && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {s.totalTimeSavedHours}h/měs. ušetřeno
                        </span>
                      )}
                      {s.topPriorityProcess && (
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-primary" />
                          Top: {s.topPriorityProcess}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                    if (confirm("Smazat audit?")) deleteMutation.mutate({ id: s.id });
                  }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
              <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Zatím žádné audity. Spusť první ROI analýzu!</p>
            </div>
          )}
        </div>

        {/* New Audit Modal */}
        {showNewAudit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Nový ROI Audit</h2>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowNewAudit(false)}><X className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-1.5">
                <Label>Název auditu</Label>
                <Input
                  value={sessionTitle}
                  onChange={e => setSessionTitle(e.target.value)}
                  placeholder="např. Q2 2026 — Lead Gen procesy"
                  className="bg-input border-border"
                  onKeyDown={e => e.key === "Enter" && handleStartAudit()}
                />
              </div>
              <Button onClick={handleStartAudit} disabled={createMutation.isPending} className="w-full gap-2">
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Spustit Audit
              </Button>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // Step 1: Process Mapping
  if (step === 1) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl space-y-6">
          <WizardProgress step={1} title={sessionTitle} onBack={resetWizard} />
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-800">
                <strong>Krok 1: Mapování procesů.</strong> Zapiš všechno co ty nebo tvůj tým děláte opakovaně. Neboj se být konkrétní — čím více detailů, tím přesnější AI analýza.
              </p>
            </div>
            {processes.map((p, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3 relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Proces #{i + 1}</span>
                  {processes.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeProcess(i)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Název procesu *</Label>
                    <Input value={p.name} onChange={e => updateProcess(i, "name", e.target.value)} placeholder="např. Ruční import leadů z LinkedIn" className="bg-input border-border text-sm h-8" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Čas/týden (hodiny)</Label>
                    <Input type="number" min={0.5} max={40} step={0.5} value={p.timePerWeekHours} onChange={e => updateProcess(i, "timePerWeekHours", parseFloat(e.target.value) || 1)} className="bg-input border-border text-sm h-8" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Popis (co přesně děláš) *</Label>
                  <Textarea value={p.description} onChange={e => updateProcess(i, "description", e.target.value)} placeholder="Popis kroků, nástrojů a výstupů..." className="bg-input border-border text-sm min-h-[70px]" />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addProcess} className="w-full gap-2 border-dashed">
              <Plus className="h-4 w-4" />
              Přidat další proces
            </Button>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={resetWizard}>Zrušit</Button>
            <Button onClick={handleSaveProcesses} disabled={saveProcessesMutation.isPending} className="flex-1 gap-2">
              {saveProcessesMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
              Pokračovat na Prioritizaci
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Step 2: Prioritization
  if (step === 2) {
    const validProcesses = processes.filter(p => p.name.trim());
    return (
      <DashboardLayout>
        <div className="max-w-3xl space-y-6">
          <WizardProgress step={2} title={sessionTitle} onBack={() => setStep(1)} />
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
              <Target className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
              <p className="text-xs text-violet-800">
                <strong>Krok 2: Prioritizace.</strong> Ohodnoť každý proces podle jeho business hodnoty (1 = nízká, 5 = kritická). AI pak vypočítá ROI skóre.
              </p>
            </div>
            {validProcesses.map((p, i) => (
              <div key={i} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium text-sm text-foreground">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <Clock className="h-3 w-3" />{p.timePerWeekHours}h/týden
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground mb-1">Business hodnota</div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateProcess(processes.indexOf(p), "valueRating", v)}
                          className={cn(
                            "w-7 h-7 rounded-lg text-xs font-bold transition-all",
                            p.valueRating >= v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                          )}
                        >{v}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.valueRating / 5) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)}><ChevronLeft className="h-4 w-4 mr-1" />Zpět</Button>
            <Button onClick={handleAnalyze} className="flex-1 gap-2">
              <Zap className="h-4 w-4" />
              Spustit AI Analýzu
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Step 3: Analyzing
  if (step === 3) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl">
          <WizardProgress step={3} title={sessionTitle} onBack={() => {}} />
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <Zap className="absolute inset-0 m-auto h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="font-semibold text-foreground">AI analyzuje tvoje procesy...</h2>
              <p className="text-sm text-muted-foreground mt-1">Vyhodnocuji feasibility, ROI a doporučené nástroje</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Step 4: Results
  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <WizardProgress step={4} title={sessionTitle} onBack={() => {}} />

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <Euro className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-emerald-700">{totalSaving} EUR</div>
            <div className="text-xs text-emerald-600">Odhadovaná úspora/měsíc</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <Clock className="h-6 w-6 text-blue-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-blue-700">{totalTimeSaved}h</div>
            <div className="text-xs text-blue-600">Ušetřených hodin/měsíc</div>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-center">
            <Target className="h-6 w-6 text-violet-600 mx-auto mb-1" />
            <div className="text-sm font-bold text-violet-700 leading-tight">{topPriority}</div>
            <div className="text-xs text-violet-600 mt-1">Nejvyšší priorita</div>
          </div>
        </div>

        {/* Results list */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Prioritizovaný akční plán (seřazeno dle ROI)</h2>
          {analysisResult.map((r, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{r.processName}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", TYPE_COLORS[r.automationType] || "bg-gray-100 text-gray-700")}>
                    {r.automationType === "full" ? "Plná automatizace" : r.automationType === "partial" ? "Částečná" : "Human-in-Loop"}
                  </span>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", EFFORT_COLORS[r.implementationEffort] || "bg-gray-100")}>
                    {r.implementationEffort === "low" ? "Nízká náročnost" : r.implementationEffort === "medium" ? "Střední" : "Vysoká náročnost"}
                  </span>
                </div>
              </div>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Feasibility</span>
                    <span className="font-semibold text-foreground">{r.feasibilityScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.feasibilityScore}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">ROI skóre</span>
                    <span className="font-semibold text-foreground">{r.roiScore}/100</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.roiScore}%` }} />
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">{r.recommendation}</p>

              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="text-[11px] text-muted-foreground mb-1.5">Doporučené nástroje</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.tools.map(t => (
                      <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-muted-foreground">Úspora</div>
                  <div className="text-sm font-bold text-emerald-600">{r.estimatedCostSavingEurMonthly} EUR/měs.</div>
                  <div className="text-[11px] text-muted-foreground">{r.estimatedTimeSavedHoursMonthly}h/měs.</div>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 bg-primary/5 rounded-lg">
                <ArrowRight className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <div>
                  <div className="text-[11px] font-semibold text-foreground">První krok:</div>
                  <div className="text-[11px] text-muted-foreground">{r.firstStep}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={resetWizard} className="flex-1">
            Nový Audit
          </Button>
          <Button onClick={resetWizard} className="flex-1 gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Hotovo
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}

function WizardProgress({ step, title, onBack }: { step: number; title: string; onBack: () => void }) {
  const steps = ["Mapování", "Prioritizace", "AI Analýza", "Výsledky"];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onBack}>
          <ChevronLeft className="h-3.5 w-3.5" />
          Zpět
        </Button>
        <h1 className="text-lg font-bold text-foreground">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all",
              i + 1 < step ? "bg-primary text-primary-foreground" :
              i + 1 === step ? "bg-primary/20 text-primary border border-primary/30" :
              "bg-muted text-muted-foreground"
            )}>
              {i + 1 < step ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < steps.length - 1 && <div className={cn("flex-1 h-0.5 rounded", i + 1 < step ? "bg-primary" : "bg-muted")} />}
          </div>
        ))}
      </div>
    </div>
  );
}
