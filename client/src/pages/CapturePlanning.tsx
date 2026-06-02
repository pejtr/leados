import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Target, ChevronRight, DollarSign, TrendingUp, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";


const STAGES = [
  { key: "identify", label: "Identify", color: "bg-slate-500", light: "bg-slate-500/20 text-slate-300 border-slate-500/30", desc: "Opportunity discovered" },
  { key: "research", label: "Research", color: "bg-blue-500", light: "bg-blue-500/20 text-blue-300 border-blue-500/30", desc: "Gathering intel" },
  { key: "outreach", label: "Outreach", color: "bg-purple-500", light: "bg-purple-500/20 text-purple-300 border-purple-500/30", desc: "Making contact" },
  { key: "qualify", label: "Qualify", color: "bg-amber-500", light: "bg-amber-500/20 text-amber-300 border-amber-500/30", desc: "Validating fit" },
  { key: "propose", label: "Propose", color: "bg-orange-500", light: "bg-orange-500/20 text-orange-300 border-orange-500/30", desc: "Proposal sent" },
  { key: "close", label: "Close", color: "bg-emerald-500", light: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30", desc: "Deal closing" },
] as const;

type Stage = typeof STAGES[number]["key"];

export default function CapturePlanning() {
  
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", companyName: "", stage: "identify" as Stage, notes: "", estimatedValue: "", probability: "10", expectedCloseAt: "" });

  const { data: plans = [], refetch } = trpc.capturePlans.list.useQuery();
  const createMut = trpc.capturePlans.create.useMutation({
    onSuccess: () => { refetch(); setCreating(false); setForm({ title: "", companyName: "", stage: "identify", notes: "", estimatedValue: "", probability: "10", expectedCloseAt: "" }); toast.success("Capture plan created"); },
  });
  const updateMut = trpc.capturePlans.update.useMutation({ onSuccess: () => { refetch(); toast.success("Stage updated"); } });
  const deleteMut = trpc.capturePlans.delete.useMutation({ onSuccess: () => { refetch(); setSelected(null); } });

  const selectedPlan = plans.find(p => p.id === selected);
  const totalPipeline = plans.reduce((sum, p) => sum + (parseFloat(p.estimatedValue ?? "0") || 0), 0);
  const weightedPipeline = plans.reduce((sum, p) => sum + ((parseFloat(p.estimatedValue ?? "0") || 0) * (p.probability ?? 10) / 100), 0);

  function advanceStage(plan: typeof plans[0]) {
    const idx = STAGES.findIndex(s => s.key === plan.stage);
    if (idx < STAGES.length - 1) {
      updateMut.mutate({ id: plan.id, stage: STAGES[idx + 1].key });
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Capture Planning</h1>
          <p className="text-white/50 text-sm mt-1">GrowthLab-inspired structured workflow from opportunity to close</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Capture Plan
        </Button>
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-white/40 mb-1">Total Pipeline</div>
          <div className="text-xl font-bold text-white">${totalPipeline.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-white/40 mb-1">Weighted Pipeline</div>
          <div className="text-xl font-bold text-emerald-400">${Math.round(weightedPipeline).toLocaleString()}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="text-xs text-white/40 mb-1">Active Opportunities</div>
          <div className="text-xl font-bold text-white">{plans.filter(p => p.stage !== "close").length}</div>
        </div>
      </div>

      {/* Stage Pipeline View */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-3 min-w-max pb-2">
          {STAGES.map(stage => {
            const stagePlans = plans.filter(p => p.stage === stage.key);
            const stageValue = stagePlans.reduce((sum, p) => sum + (parseFloat(p.estimatedValue ?? "0") || 0), 0);
            return (
              <div key={stage.key} className="w-52 flex-shrink-0">
                <div className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg border ${stage.light}`}>
                  <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                  <span className="text-xs font-semibold">{stage.label}</span>
                  <Badge variant="outline" className="ml-auto text-xs border-0 bg-white/10 text-white/60">{stagePlans.length}</Badge>
                </div>
                {stageValue > 0 && <p className="text-xs text-white/30 px-1 mb-2">${stageValue.toLocaleString()}</p>}
                <div className="space-y-2">
                  {stagePlans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setSelected(plan.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${selected === plan.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
                    >
                      <p className="text-white text-xs font-semibold line-clamp-1">{plan.title}</p>
                      {plan.companyName && <p className="text-white/40 text-xs mt-0.5">{plan.companyName}</p>}
                      {plan.estimatedValue && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-xs font-medium">{parseFloat(plan.estimatedValue).toLocaleString()}</span>
                          <span className="text-white/30 text-xs ml-auto">{plan.probability}%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Plan Detail */}
      {selectedPlan && (
        <div className="border border-white/10 rounded-xl p-6 bg-white/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white">{selectedPlan.title}</h2>
              {selectedPlan.companyName && <p className="text-white/50 text-sm">{selectedPlan.companyName}</p>}
            </div>
            <div className="flex gap-2">
              {selectedPlan.stage !== "close" && (
                <Button size="sm" onClick={() => advanceStage(selectedPlan)} className="bg-emerald-500 hover:bg-emerald-600 text-black text-xs">
                  <ChevronRight className="w-3.5 h-3.5 mr-1" /> Advance Stage
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => deleteMut.mutate({ id: selectedPlan.id })} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Stage Progress */}
          <div className="flex items-center gap-1 mb-4">
            {STAGES.map((stage, i) => {
              const currentIdx = STAGES.findIndex(s => s.key === selectedPlan.stage);
              const isPast = i <= currentIdx;
              return (
                <div key={stage.key} className="flex items-center flex-1">
                  <div className={`flex-1 h-1.5 rounded-full ${isPast ? stage.color : "bg-white/10"}`} />
                  {i < STAGES.length - 1 && <div className="w-1" />}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mb-4">
            {STAGES.map(stage => (
              <span key={stage.key} className={`text-xs ${selectedPlan.stage === stage.key ? "text-white font-semibold" : "text-white/30"}`}>{stage.label}</span>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {selectedPlan.estimatedValue && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/40 mb-1">Est. Value</div>
                <div className="text-white font-semibold">${parseFloat(selectedPlan.estimatedValue).toLocaleString()}</div>
              </div>
            )}
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-white/40 mb-1">Win Probability</div>
              <div className="text-white font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />{selectedPlan.probability}%
              </div>
            </div>
            {selectedPlan.expectedCloseAt && (
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs text-white/40 mb-1">Expected Close</div>
                <div className="text-white font-semibold">{new Date(selectedPlan.expectedCloseAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          {selectedPlan.notes && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <div className="text-xs text-white/40 mb-1">Notes</div>
              <p className="text-white/70 text-sm whitespace-pre-wrap">{selectedPlan.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-[#0f1117] border-white/10 text-white max-w-lg">
          <DialogHeader><DialogTitle>New Capture Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Opportunity Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Acme Corp — Enterprise Deal" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Company Name</label>
              <Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} placeholder="Acme Corp" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Stage</label>
                <Select value={form.stage} onValueChange={v => setForm({ ...form, stage: v as Stage })}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1d2e] border-white/10 text-white">
                    {STAGES.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Win Probability %</label>
                <Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm({ ...form, probability: e.target.value })} className="bg-white/5 border-white/20 text-white" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Estimated Value ($)</label>
                <Input type="number" value={form.estimatedValue} onChange={e => setForm({ ...form, estimatedValue: e.target.value })} placeholder="50000" className="bg-white/5 border-white/20 text-white" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Expected Close</label>
                <Input type="date" value={form.expectedCloseAt} onChange={e => setForm({ ...form, expectedCloseAt: e.target.value })} className="bg-white/5 border-white/20 text-white" />
              </div>
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Notes</label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Key contacts, requirements, competitive notes..." className="bg-white/5 border-white/20 text-white resize-none" rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} className="border-white/20 text-white/70">Zrušit</Button>
            <Button
              onClick={() => createMut.mutate({ title: form.title, companyName: form.companyName || undefined, stage: form.stage, notes: form.notes || undefined, estimatedValue: form.estimatedValue || undefined, probability: parseInt(form.probability) || 10, expectedCloseAt: form.expectedCloseAt ? new Date(form.expectedCloseAt) : undefined })}
              disabled={!form.title || createMut.isPending}
              className="bg-emerald-500 hover:bg-emerald-600 text-black"
            >
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
