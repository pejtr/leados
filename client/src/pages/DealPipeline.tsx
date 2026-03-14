import { useState } from "react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trophy, X, TrendingUp, DollarSign, Target, Activity } from "lucide-react";

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

export default function DealPipeline() {
  const { t } = useTranslation();
  const utils = trpc.useUtils();

  const { data: deals = [], isLoading } = trpc.crm.listDeals.useQuery();
  const { data: stats } = trpc.crm.getDealStats.useQuery();

  const [createOpen, setCreateOpen] = useState(false);
  const [editDeal, setEditDeal] = useState<any>(null);
  const [form, setForm] = useState<DealFormData>(EMPTY_FORM);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const createMutation = trpc.crm.createDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      toast({ title: "Deal vytvořen!" });
    },
    onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const updateMutation = trpc.crm.updateDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      setEditDeal(null);
      toast({ title: "Deal aktualizován!" });
    },
    onError: (e) => toast({ title: "Chyba", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = trpc.crm.deleteDeal.useMutation({
    onSuccess: () => {
      utils.crm.listDeals.invalidate();
      utils.crm.getDealStats.invalidate();
      toast({ title: "Deal smazán." });
    },
  });

  const handleCreate = () => {
    if (!form.title.trim()) return;
    createMutation.mutate({
      ...form,
      value: form.value || "0",
      probability: form.probability,
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

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Deal Pipeline</h1>
          <p className="text-slate-400 text-sm mt-1">Správa obchodních příležitostí — přetahujte dealy mezi fázemi</p>
        </div>
        <Button
          onClick={() => { setForm(EMPTY_FORM); setCreateOpen(true); }}
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
        >
          <Plus className="w-4 h-4" /> Nový deal
        </Button>
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
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage(stage.key);
            const stageValue = stageDeals.reduce((s: number, d: any) => s + parseFloat(d.value ?? "0"), 0);
            return (
              <div
                key={stage.key}
                className={`flex-shrink-0 w-64 rounded-xl border ${dragOver === stage.key ? "border-violet-500 bg-violet-900/20" : "border-slate-800 bg-slate-900/40"} transition-colors`}
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
                      {deal.probability > 0 && (
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

      {/* Create / Edit Dialog */}
      <Dialog open={createOpen || !!editDeal} onOpenChange={(open) => { if (!open) { setCreateOpen(false); setEditDeal(null); } }}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">{editDeal ? "Upravit deal" : "Nový deal"}</DialogTitle>
          </DialogHeader>
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
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setCreateOpen(false); setEditDeal(null); }} className="border-slate-700 text-slate-300">
              Zrušit
            </Button>
            <Button
              onClick={editDeal ? handleUpdate : handleCreate}
              disabled={createMutation.isPending || updateMutation.isPending || !form.title.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {editDeal ? "Uložit změny" : "Vytvořit deal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
