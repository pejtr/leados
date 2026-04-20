import { useState } from "react";
import { useTranslation } from "react-i18next";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { useGoogleAds } from "@/hooks/useGoogleAds";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trophy, X, TrendingUp, DollarSign, Target, Activity, Phone, Mail, Users, FileText, CheckSquare, Monitor, Clock, ChevronDown, ChevronUp, Send, Sparkles, AlertTriangle, CheckCircle2, Zap, RefreshCw } from "lucide-react";

const STAGES = [
  { key: "new", label: "Nový", color: "bg-slate-500", light: "bg-slate-50 border-slate-200" },
  { key: "qualified", label: "Kvalifikován", color: "bg-blue-500", light: "bg-blue-50 border-blue-200" },
  { key: "presentation", label: "Prezentace", color: "bg-indigo-500", light: "bg-indigo-50 border-indigo-200" },
  { key: "proposal", label: "Nabídka", color: "bg-violet-500", light: "bg-violet-50 border-violet-200" },
  { key: "negotiation", label: "Vyjednávání", color: "bg-amber-500", light: "bg-amber-50 border-amber-200" },
  { key: "won", label: "Vyhráno 🏆", color: "bg-emerald-500", light: "bg-emerald-50 border-emerald-200" },
  { key: "lost", label: "Prohráno", color: "bg-red-400", light: "bg-red-50 border-red-200" },
] as const;

type Stage = typeof STAGES[number]["key"];
type ActivityType = "call" | "email" | "meeting" | "note" | "task" | "demo";

const ACTIVITY_TYPES: { key: ActivityType; label: string; icon: React.ElementType; color: string }[] = [
  { key: "call", label: "Hovor", icon: Phone, color: "text-green-400" },
  { key: "email", label: "E-mail", icon: Mail, color: "text-blue-400" },
  { key: "meeting", label: "Schůzka", icon: Users, color: "text-violet-400" },
  { key: "note", label: "Poznámka", icon: FileText, color: "text-slate-400" },
  { key: "task", label: "Úkol", icon: CheckSquare, color: "text-amber-400" },
  { key: "demo", label: "Demo", icon: Monitor, color: "text-cyan-400" },
];

interface DealFormData {
  title: string;
  value: string;
  currency: string;
  stage: Stage;
  probability: number;
  expectedCloseDate: string;
  notes: string;
  nextAction: string;
}

const EMPTY_FORM: DealFormData = {
  title: "",
  value: "",
  currency: "CZK",
  stage: "new",
  probability: 20,
  expectedCloseDate: "",
  notes: "",
  nextAction: "",
};

// Score color helper
function scoreColor(score: number) {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function scoreBg(score: number) {
  if (score >= 70) return "bg-emerald-500/20 border-emerald-500/40";
  if (score >= 40) return "bg-amber-500/20 border-amber-500/40";
  return "bg-red-500/20 border-red-500/40";
}

// AI Score Panel in edit modal
function AiScorePanel({ deal, onScored }: { deal: any; onScored: () => void }) {
  const utils = trpc.useUtils();
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [showPanel, setShowPanel] = useState(true);

  const scoreMutation = trpc.crm.scoreDeal.useMutation({
    onSuccess: (data) => {
      setScoreResult(data);
      utils.crm.listDeals.invalidate();
      onScored();
      toast.success(`AI Score: ${data.score}%`);
    },
    onError: (e) => toast.error("Chyba při AI scoringu: " + e.message),
  });

  const currentScore = scoreResult?.score ?? deal.aiScore ?? null;
  const currentReasoning = scoreResult?.reasoning ?? deal.aiScoreReasoning ?? null;
  const riskFactors = scoreResult?.riskFactors ?? null;
  const positiveSignals = scoreResult?.positiveSignals ?? null;
  const nextAction = scoreResult?.nextAction ?? deal.nextAction ?? null;
  const scoredAt = deal.aiScoredAt ? new Date(deal.aiScoredAt) : null;

  return (
    <div className="border-t border-slate-700 pt-4 mt-2">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white w-full mb-3"
      >
        <Sparkles className="w-4 h-4 text-violet-400" />
        AI Deal Score
        {currentScore !== null && currentScore > 0 && (
          <span className={`text-sm font-bold ${scoreColor(currentScore)} ml-1`}>{currentScore}%</span>
        )}
        {showPanel ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {showPanel && (
        <div className="space-y-3">
          {/* Score display */}
          {currentScore !== null && currentScore > 0 ? (
            <div className={`rounded-xl border p-4 ${scoreBg(currentScore)}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`text-3xl font-black ${scoreColor(currentScore)}`}>{currentScore}%</div>
                  <div>
                    <p className="text-xs text-slate-400">Pravděpodobnost uzavření</p>
                    {scoredAt && (
                      <p className="text-xs text-slate-600">
                        Scored {scoredAt.toLocaleDateString("cs-CZ")}
                      </p>
                    )}
                  </div>
                </div>
                {/* Score gauge */}
                <div className="w-16 h-16 relative">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke={currentScore >= 70 ? "#10b981" : currentScore >= 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="3"
                      strokeDasharray={`${currentScore} ${100 - currentScore}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-bold ${scoreColor(currentScore)}`}>{currentScore}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${currentScore >= 70 ? "bg-emerald-500" : currentScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${currentScore}%` }}
                />
              </div>

              {/* Reasoning */}
              {currentReasoning && (
                <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-line">
                  {currentReasoning.split("\n\nNext action:")[0]}
                </p>
              )}

              {/* Signals grid */}
              {(positiveSignals || riskFactors) && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {positiveSignals && positiveSignals.length > 0 && (
                    <div className="bg-emerald-900/20 rounded-lg p-2">
                      <p className="text-xs font-semibold text-emerald-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Silné stránky
                      </p>
                      {positiveSignals.map((s: string, i: number) => (
                        <p key={i} className="text-xs text-slate-300 leading-relaxed">• {s}</p>
                      ))}
                    </div>
                  )}
                  {riskFactors && riskFactors.length > 0 && (
                    <div className="bg-red-900/20 rounded-lg p-2">
                      <p className="text-xs font-semibold text-red-400 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Rizika
                      </p>
                      {riskFactors.map((r: string, i: number) => (
                        <p key={i} className="text-xs text-slate-300 leading-relaxed">• {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Next action from AI */}
              {nextAction && (
                <div className="mt-2 bg-violet-900/20 border border-violet-700/30 rounded-lg p-2 flex items-start gap-2">
                  <Zap className="w-3 h-3 text-violet-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-violet-300 leading-relaxed">{nextAction}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-800/60 rounded-xl border border-slate-700 p-4 text-center">
              <Sparkles className="w-8 h-8 text-violet-400 mx-auto mb-2 opacity-50" />
              <p className="text-sm text-slate-400 mb-1">Deal ještě nebyl ohodnocen AI</p>
              <p className="text-xs text-slate-600">AI analyzuje fázi, hodnotu, aktivitu a doporučí next step</p>
            </div>
          )}

          {/* Score button */}
          <Button
            onClick={() => scoreMutation.mutate({ dealId: deal.id })}
            disabled={scoreMutation.isPending}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white gap-2"
            size="sm"
          >
            {scoreMutation.isPending ? (
              <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> AI analyzuje deal...</>
            ) : currentScore !== null && currentScore > 0 ? (
              <><RefreshCw className="w-3.5 h-3.5" /> Re-score s AI</>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Ohodnotit deal s AI</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

// Activity Log component for the edit modal
function ActivityLog({ dealId }: { dealId: number }) {
  const utils = trpc.useUtils();
  const { data: activities = [], isLoading } = trpc.crm.getDealActivities.useQuery({ dealId });
  const [showLog, setShowLog] = useState(true);
  const [activityType, setActivityType] = useState<ActivityType>("note");
  const [activityContent, setActivityContent] = useState("");
  const [activityOutcome, setActivityOutcome] = useState("");
  const [activityDuration, setActivityDuration] = useState("");

  const addActivity = trpc.crm.addActivity.useMutation({
    onSuccess: () => {
      utils.crm.getDealActivities.invalidate({ dealId });
      setActivityContent("");
      setActivityOutcome("");
      setActivityDuration("");
      toast.success("Aktivita přidána");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleAdd = () => {
    if (!activityContent.trim()) return;
    addActivity.mutate({
      dealId,
      type: activityType,
      content: activityContent,
      outcome: activityOutcome || undefined,
      duration: activityDuration ? parseInt(activityDuration) : undefined,
    });
  };

  const getActivityMeta = (type: ActivityType) => ACTIVITY_TYPES.find((a) => a.key === type) ?? ACTIVITY_TYPES[3];

  return (
    <div className="border-t border-slate-700 pt-4 mt-2">
      <button
        onClick={() => setShowLog(!showLog)}
        className="flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white w-full mb-3"
      >
        <Activity className="w-4 h-4 text-violet-400" />
        Časová osa aktivit
        <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-xs ml-1">{activities.length}</Badge>
        {showLog ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      {showLog && (
        <div className="space-y-3">
          {/* Add activity form */}
          <div className="bg-slate-800/60 rounded-lg p-3 space-y-2">
            <div className="flex gap-2 flex-wrap">
              {ACTIVITY_TYPES.map((at) => {
                const Icon = at.icon;
                return (
                  <button
                    key={at.key}
                    onClick={() => setActivityType(at.key)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${activityType === at.key ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-400 hover:text-white"}`}
                  >
                    <Icon className={`w-3 h-3 ${activityType === at.key ? "text-white" : at.color}`} />
                    {at.label}
                  </button>
                );
              })}
            </div>
            <Textarea
              value={activityContent}
              onChange={(e) => setActivityContent(e.target.value)}
              placeholder={`Popis aktivity (${ACTIVITY_TYPES.find(a => a.key === activityType)?.label ?? "Poznámka"})...`}
              className="bg-slate-700 border-slate-600 text-white text-sm resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              {(activityType === "call" || activityType === "meeting" || activityType === "demo") && (
                <Input
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  placeholder="Délka (min)"
                  type="number"
                  className="bg-slate-700 border-slate-600 text-white text-sm w-28"
                />
              )}
              <Input
                value={activityOutcome}
                onChange={(e) => setActivityOutcome(e.target.value)}
                placeholder="Výsledek / outcome..."
                className="bg-slate-700 border-slate-600 text-white text-sm flex-1"
              />
              <Button
                onClick={handleAdd}
                disabled={addActivity.isPending || !activityContent.trim()}
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
              >
                <Send className="w-3 h-3" />
                Přidat
              </Button>
            </div>
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="text-xs text-slate-500 text-center py-2">Načítám...</div>
          ) : activities.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-3">Zatím žádné aktivity. Přidejte první!</div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {[...activities].reverse().map((act: any) => {
                const meta = getActivityMeta(act.type);
                const Icon = meta.icon;
                return (
                  <div key={act.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0`}>
                        <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      </div>
                      <div className="w-px flex-1 bg-slate-700/50 mt-1" />
                    </div>
                    <div className="pb-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-xs font-semibold ${meta.color}`}>{meta.label}</span>
                        {act.duration && (
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />{act.duration} min
                          </span>
                        )}
                        <span className="text-xs text-slate-600 ml-auto">
                          {new Date(act.createdAt).toLocaleDateString("cs-CZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {act.content && <p className="text-xs text-slate-300 leading-relaxed">{act.content}</p>}
                      {act.outcome && <p className="text-xs text-emerald-400 mt-0.5">→ {act.outcome}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DealPipeline() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: deals = [], isLoading, refetch: refetchDeals } = trpc.crm.listDeals.useQuery();
  const { data: stats } = trpc.crm.getDealStats.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<any>(null);
  const [form, setForm] = useState<DealFormData>(EMPTY_FORM);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const batchScore = trpc.crm.batchScoreDeals.useMutation({
    onSuccess: (data) => {
      utils.crm.listDeals.invalidate();
      toast.success(`${data.scored} dealů ohodnoceno baseline AI score`);
    },
    onError: (e) => toast.error(e.message),
  });

  const { track } = useGoogleAds();

  const createMutation = trpc.crm.createDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      toast.success("Deal vytvořen!");
      track('deal_created', { value: parseFloat(form.value || '0'), currency: form.currency || 'CZK' });
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.crm.updateDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      setEditDeal(null);
      toast.success("Deal aktualizován!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.crm.deleteDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      toast.success("Deal smazán.");
    },
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      title: form.title,
      stage: form.stage,
      value: form.value || "0",
      currency: form.currency,
      probability: form.probability,
      notes: form.notes,
      nextAction: form.nextAction,
      expectedCloseDate: form.expectedCloseDate || undefined,
    });
  };

  const handleUpdate = () => {
    if (!editDeal) return;
    updateMutation.mutate({
      id: editDeal.id,
      ...form,
      value: form.value || "0",
      probability: form.probability,
      expectedCloseDate: form.expectedCloseDate || undefined,
    });
  };

  const openEdit = (deal: any) => {
    setEditDeal(deal);
    setForm({
      title: deal.title,
      value: deal.value ?? "",
      currency: deal.currency ?? "CZK",
      stage: deal.stage,
      probability: deal.probability ?? 20,
      expectedCloseDate: deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toISOString().split("T")[0] : "",
      notes: deal.notes ?? "",
      nextAction: deal.nextAction ?? "",
    });
  };

  // Drag & drop
  const handleDragStart = (id: number) => setDraggingId(id);
  const handleDrop = (stage: string) => {
    if (draggingId) {
      track('deal_stage_changed', { new_stage: stage });
      if (stage === 'won') track('deal_won', { value: 1 });
      if (stage === 'lost') track('deal_lost');
    }
    if (draggingId == null) return;
    updateMutation.mutate({ id: draggingId, stage: stage as Stage });
    setDraggingId(null);
    setDragOver(null);
  };

  const dealsByStage = (stage: string) => deals.filter((d: any) => d.stage === stage);

  const fmtCurrency = (val: string | null, currency: string) => {
    const n = parseFloat(val ?? "0");
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: currency || "CZK", maximumFractionDigits: 0 }).format(n);
  };

  const totalPipeline = stats?.pipelineValue ?? 0;
  const wonValue = stats?.wonValue ?? 0;
  const winRate = stats?.total ? Math.round(((stats?.won ?? 0) / stats.total) * 100) : 0;
  const unscoredCount = deals.filter((d: any) => !d.aiScoredAt && d.stage !== "won" && d.stage !== "lost").length;

  return (
    <DashboardLayout>
    <div className="text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Správa obchodních příležitostí — přetahujte dealy mezi fázemi</p>
        </div>
        <div className="flex items-center gap-2">
          {unscoredCount > 0 && (
            <Button
              onClick={() => batchScore.mutate()}
              disabled={batchScore.isPending}
              variant="outline"
              size="sm"
              className="border-violet-700 text-violet-300 hover:bg-violet-900/30 gap-1.5"
            >
              {batchScore.isPending ? (
                <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Scoring...</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> AI Score ({unscoredCount})</>
              )}
            </Button>
          )}
          <Button
            onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" /> Nový deal
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TrendingUp, label: "Pipeline", value: fmtCurrency(String(totalPipeline), "CZK"), color: "text-violet-400" },
          { icon: Trophy, label: "Vyhráno", value: fmtCurrency(String(wonValue), "CZK"), color: "text-emerald-400" },
          { icon: Target, label: "Win rate", value: `${winRate} %`, color: "text-blue-400" },
          { icon: Activity, label: "Celkem dealů", value: String(stats?.total ?? 0), color: "text-amber-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg bg-slate-800 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className={`text-lg font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-20">Načítám...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 pb-4">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage(stage.key);
            const stageValue = stageDeals.reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0);
            return (
              <div
                key={stage.key}
                className={`rounded-xl border ${dragOver === stage.key ? "border-violet-500 bg-violet-900/20" : "border-slate-800 bg-slate-900/40"} transition-colors`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(stage.key); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={() => handleDrop(stage.key)}
              >
                {/* Column header */}
                <div className="p-3 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold text-white">{stage.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs bg-slate-800 text-slate-300">
                      {stageDeals.length}
                    </Badge>
                  </div>
                  {stageValue > 0 && (
                    <p className="text-xs text-slate-400 mt-1">{fmtCurrency(String(stageValue), "CZK")}</p>
                  )}
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2 min-h-[200px]">
                  {stageDeals.map((deal: any) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                      onClick={() => openEdit(deal)}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg p-3 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-sm font-medium text-white leading-tight line-clamp-2">{deal.title}</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: deal.id }); }}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-opacity flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {parseFloat(deal.value ?? "0") > 0 && (
                        <p className="text-xs text-emerald-400 font-semibold mt-1">
                          {fmtCurrency(deal.value, deal.currency)}
                        </p>
                      )}

                      {/* AI Score badge */}
                      {deal.aiScore > 0 && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Sparkles className="w-3 h-3 text-violet-400" />
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${deal.aiScore >= 70 ? "bg-emerald-500" : deal.aiScore >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${deal.aiScore}%` }}
                            />
                          </div>
                          <span className={`text-xs font-bold ${scoreColor(deal.aiScore)}`}>{deal.aiScore}%</span>
                        </div>
                      )}

                      {deal.probability > 0 && !deal.aiScore && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>Pravděpodobnost</span>
                            <span>{deal.probability}%</span>
                          </div>
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-violet-500 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {deal.nextAction && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-1">→ {deal.nextAction}</p>
                      )}
                    </div>
                  ))}

                  {stageDeals.length === 0 && (
                    <div className="text-center text-slate-600 text-xs py-6">Žádné dealy</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { if (!open) setCreateOpen(false); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Nový deal</DialogTitle>
          </DialogHeader>
          <DealFormFields form={form} setForm={setForm} />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-700 text-slate-300">
              Zrušit
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.title.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Vytvořit deal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog — includes AI Score Panel + Activity Log */}
      <Dialog open={!!editDeal} onOpenChange={(open) => { if (!open) setEditDeal(null); }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              Upravit deal
              {editDeal?.aiScore > 0 && (
                <span className={`text-sm font-bold px-2 py-0.5 rounded-full border ${scoreBg(editDeal.aiScore)} ${scoreColor(editDeal.aiScore)}`}>
                  AI {editDeal.aiScore}%
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <DealFormFields form={form} setForm={setForm} />
          {editDeal && (
            <AiScorePanel
              deal={editDeal}
              onScored={() => {
                utils.crm.listDeals.invalidate();
              }}
            />
          )}
          {editDeal && <ActivityLog dealId={editDeal.id} />}
          <DialogFooter className="gap-2 sticky bottom-0 bg-slate-900 pt-2">
            <Button variant="outline" onClick={() => setEditDeal(null)} className="border-slate-700 text-slate-300">
              Zrušit
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateMutation.isPending || !form.title.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              Uložit změny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}

// Extracted form fields component to avoid duplication
function DealFormFields({ form, setForm }: { form: DealFormData; setForm: (f: DealFormData) => void }) {
  return (
    <div className="space-y-4 py-2">
      <div>
        <Label className="text-slate-300">Název dealu *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="např. TechCorp — roční licence"
          className="bg-slate-800 border-slate-700 text-white mt-1"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-300">Hodnota</Label>
          <Input
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            placeholder="0"
            type="number"
            className="bg-slate-800 border-slate-700 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-slate-300">Měna</Label>
          <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {["CZK", "EUR", "USD", "GBP"].map((c) => (
                <SelectItem key={c} value={c} className="text-white">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-slate-300">Fáze</Label>
          <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as Stage })}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {STAGES.map((s) => (
                <SelectItem key={s.key} value={s.key} className="text-white">{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-slate-300">Pravděpodobnost (%)</Label>
          <Input
            value={form.probability}
            onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) || 0 })}
            type="number"
            min={0}
            max={100}
            className="bg-slate-800 border-slate-700 text-white mt-1"
          />
        </div>
      </div>
      <div>
        <Label className="text-slate-300">Datum uzavření</Label>
        <Input
          value={form.expectedCloseDate}
          onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
          type="date"
          className="bg-slate-800 border-slate-700 text-white mt-1"
        />
      </div>
      <div>
        <Label className="text-slate-300">Další krok</Label>
        <Input
          value={form.nextAction}
          onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
          placeholder="např. Demo call v pátek"
          className="bg-slate-800 border-slate-700 text-white mt-1"
        />
      </div>
      <div>
        <Label className="text-slate-300">Poznámky</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Interní poznámky k dealu..."
          className="bg-slate-800 border-slate-700 text-white mt-1 resize-none"
          rows={3}
        />
      </div>
    </div>
  );
}
