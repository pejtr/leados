import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Mail, ChevronRight, Users, Edit2, Save, Linkedin, Sparkles, Loader2, Phone } from "lucide-react";
import { useGoogleAds } from "@/hooks/useGoogleAds";

const STEP_ICONS: Record<string, string> = {
  email: "📧",
  linkedin_connect: "🔗",
  linkedin_message: "💬",
  call: "📞",
};

const STEP_TYPE_CONFIG: Record<string, { label: string; color: string; borderColor: string }> = {
  email: { label: "Email", color: "text-emerald-400", borderColor: "border-emerald-500/40" },
  linkedin_connect: { label: "LinkedIn Connect", color: "text-blue-400", borderColor: "border-blue-500/40" },
  linkedin_message: { label: "LinkedIn Message", color: "text-blue-300", borderColor: "border-blue-400/40" },
  call: { label: "Call", color: "text-amber-400", borderColor: "border-amber-500/40" },
};

type Step = { stepNumber: number; delayDays: number; subject: string; body: string; stepType: string };

export default function Sequences() {
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [selectedSeq, setSelectedSeq] = useState<number | null>(null);
  const [editingSteps, setEditingSteps] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [generatingLinkedIn, setGeneratingLinkedIn] = useState<number | null>(null);

  const { data: sequences = [], refetch } = trpc.sequences.list.useQuery();
  const { data: stepsData = [], refetch: refetchSteps } = trpc.sequences.getSteps.useQuery(
    { sequenceId: selectedSeq! },
    { enabled: !!selectedSeq }
  );
  const { data: enrollments = [] } = trpc.sequences.enrollments.useQuery();
  const { track } = useGoogleAds();

  const createMut = trpc.sequences.create.useMutation({ onSuccess: () => { refetch(); setCreating(false); setNewName(""); setNewDesc(""); track('sequence_created'); } });
  const deleteMut = trpc.sequences.delete.useMutation({ onSuccess: () => { refetch(); setSelectedSeq(null); } });
  const saveStepsMut = trpc.sequences.saveSteps.useMutation({
    onSuccess: () => {
      refetchSteps();
      setEditingSteps(false);
      toast.success("Steps saved successfully.");
      track('sequence_steps_saved', { step_count: steps.length });
    },
  });
  const generateLinkedIn = trpc.sequences.generateLinkedInMessage.useMutation({
    onSuccess: () => { track('linkedin_message_generated'); },
    onError: (e) => { setGeneratingLinkedIn(null); toast.error(e.message); },
  });

  const selectedSequence = sequences.find(s => s.id === selectedSeq);
  const seqEnrollments = enrollments.filter(e => e.sequenceId === selectedSeq);

  function startEditing() {
    setSteps(stepsData.length > 0
      ? stepsData.map(s => ({ stepNumber: s.stepNumber, delayDays: s.delayDays, subject: s.subject ?? "", body: s.body ?? "", stepType: (s as any).stepType ?? "email" }))
      : [{ stepNumber: 1, delayDays: 0, subject: "Introduction: {{companyName}}", body: "Hi {{firstName}},\n\nI noticed {{companyName}} is in the {{industry}} space and wanted to reach out...\n\nBest,\n{{senderName}}", stepType: "email" }]
    );
    setEditingSteps(true);
  }

  function addStep(type: string = "email") {
    const last = steps[steps.length - 1];
    setSteps([...steps, { stepNumber: steps.length + 1, delayDays: (last?.delayDays ?? 0) + 3, subject: "", body: "", stepType: type }]);
  }

  function removeStep(idx: number) {
    setSteps(steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  }

  async function handleGenerateLinkedIn(idx: number) {
    const step = steps[idx];
    setGeneratingLinkedIn(idx);
    try {
      const result = await generateLinkedIn.mutateAsync({
        leadContext: "B2B SaaS decision maker in tech industry",
        messageType: step.stepType === "linkedin_connect" ? "connect" : "message",
      });
      setSteps(steps.map((s, i) => i === idx ? {
        ...s,
        body: result.message,
        subject: step.stepType === "linkedin_connect" ? "LinkedIn Connection Request" : "LinkedIn Follow-up",
      } : s));
      toast.success("LinkedIn message generated ✨");
    } finally {
      setGeneratingLinkedIn(null);
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Outreach Sequences</h1>
          <p className="text-white/50 text-sm mt-1">Multi-channel automated outreach — Email, LinkedIn, and Calls</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New Sequence
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sequence List */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Your Sequences</h2>
          {sequences.length === 0 && (
            <div className="text-center py-12 text-white/30 border border-white/10 rounded-xl">
              <Mail className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No sequences yet</p>
            </div>
          )}
          {sequences.map(seq => {
            const count = enrollments.filter(e => e.sequenceId === seq.id).length;
            return (
              <div
                key={seq.id}
                onClick={() => setSelectedSeq(seq.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedSeq === seq.id ? "border-emerald-500 bg-emerald-500/10" : "border-white/10 bg-white/5 hover:border-white/20"}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{seq.name}</p>
                    {seq.description && <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{seq.description}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs border-white/20 text-white/50">
                    <Users className="w-3 h-3 mr-1" />{count} enrolled
                  </Badge>
                  <Badge variant={seq.isActive ? "default" : "secondary"} className={`text-xs ${seq.isActive ? "bg-emerald-500/20 text-emerald-400 border-0" : ""}`}>
                    {seq.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sequence Detail */}
        <div className="lg:col-span-2">
          {!selectedSequence ? (
            <div className="flex items-center justify-center h-64 border border-white/10 rounded-xl text-white/30">
              <div className="text-center">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Select a sequence to view details</p>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 rounded-xl p-6 bg-white/5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedSequence.name}</h2>
                  {selectedSequence.description && <p className="text-white/40 text-sm">{selectedSequence.description}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={startEditing} className="border-white/20 text-white/70 hover:bg-white/10">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Steps
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteMut.mutate({ id: selectedSequence.id })} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Steps display */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Steps ({stepsData.length})</h3>
                {stepsData.length === 0 && (
                  <p className="text-white/30 text-sm py-4 text-center border border-dashed border-white/10 rounded-lg">
                    No steps yet — click "Edit Steps" to add email or LinkedIn steps
                  </p>
                )}
                {stepsData.map((step, i) => {
                  const sType = (step as any).stepType ?? "email";
                  const cfg = STEP_TYPE_CONFIG[sType] ?? STEP_TYPE_CONFIG.email;
                  return (
                    <div key={step.id} className={`flex gap-3 p-3 bg-white/5 rounded-lg border ${cfg.borderColor}`}>
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm flex-shrink-0">
                        {STEP_ICONS[sType] ?? "📧"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/40">Day {step.delayDays}</span>
                          <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-white text-sm font-medium truncate">{step.subject}</span>
                        </div>
                        <p className="text-white/40 text-xs mt-0.5 line-clamp-1">{step.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enrollments */}
              <div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">Enrolled Leads ({seqEnrollments.length})</h3>
                {seqEnrollments.length === 0 ? (
                  <p className="text-white/30 text-sm py-3 text-center border border-dashed border-white/10 rounded-lg">
                    No leads enrolled — enroll leads from the History page
                  </p>
                ) : (
                  <div className="space-y-2">
                    {seqEnrollments.map(e => (
                      <div key={e.id} className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm">
                        <span className="text-white/70">Lead #{e.leadId}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white/40 text-xs">Step {e.currentStep}</span>
                          <Badge variant="outline" className={`text-xs border-0 ${e.status === "active" ? "bg-emerald-500/20 text-emerald-400" : e.status === "completed" ? "bg-blue-500/20 text-blue-400" : "bg-white/10 text-white/40"}`}>
                            {e.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-[#0f1117] border-white/10 text-white">
          <DialogHeader><DialogTitle>New Outreach Sequence</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Sequence Name *</label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. SaaS Cold Outreach" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Description</label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="What is this sequence for?" className="bg-white/5 border-white/20 text-white resize-none" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} className="border-white/20 text-white/70">Cancel</Button>
            <Button onClick={() => createMut.mutate({ name: newName, description: newDesc })} disabled={!newName || createMut.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              Create Sequence
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Steps Dialog */}
      <Dialog open={editingSteps} onOpenChange={setEditingSteps}>
        <DialogContent className="bg-[#0f1117] border-white/10 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Sequence Steps</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {steps.map((step, i) => {
              const cfg = STEP_TYPE_CONFIG[step.stepType] ?? STEP_TYPE_CONFIG.email;
              const isLinkedIn = step.stepType === "linkedin_connect" || step.stepType === "linkedin_message";
              return (
                <div key={i} className={`p-4 border rounded-lg space-y-3 ${cfg.borderColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{STEP_ICONS[step.stepType] ?? "📧"}</span>
                      <span className={`text-sm font-semibold ${cfg.color}`}>Step {step.stepNumber} — {cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-white/50">Day</label>
                        <Input type="number" value={step.delayDays} onChange={e => setSteps(steps.map((s, j) => j === i ? { ...s, delayDays: parseInt(e.target.value) || 0 } : s))} className="w-16 bg-white/5 border-white/20 text-white text-xs h-7" />
                      </div>
                      {steps.length > 1 && (
                        <Button size="sm" variant="ghost" onClick={() => removeStep(i)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Step Type Pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {Object.entries(STEP_TYPE_CONFIG).map(([type, tcfg]) => (
                      <button
                        key={type}
                        onClick={() => setSteps(steps.map((s, j) => j === i ? { ...s, stepType: type } : s))}
                        className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                          step.stepType === type
                            ? `bg-white/10 ${tcfg.borderColor} ${tcfg.color}`
                            : "border-white/10 text-white/30 hover:border-white/20 hover:text-white/50"
                        }`}
                      >
                        {STEP_ICONS[type]} {tcfg.label}
                      </button>
                    ))}
                  </div>

                  {/* Subject (email only) */}
                  {step.stepType === "email" && (
                    <Input
                      value={step.subject}
                      onChange={e => setSteps(steps.map((s, j) => j === i ? { ...s, subject: e.target.value } : s))}
                      placeholder="Email subject..."
                      className="bg-white/5 border-white/20 text-white text-sm"
                    />
                  )}

                  {/* Body */}
                  <div className="relative">
                    <Textarea
                      value={step.body}
                      onChange={e => setSteps(steps.map((s, j) => j === i ? { ...s, body: e.target.value } : s))}
                      placeholder={
                        step.stepType === "email"
                          ? "Email body... Use {{firstName}}, {{companyName}}, {{industry}}"
                          : step.stepType === "linkedin_connect"
                          ? "Connection request note (max 300 chars)..."
                          : step.stepType === "linkedin_message"
                          ? "LinkedIn message..."
                          : "Call script / talking points..."
                      }
                      className="bg-white/5 border-white/20 text-white text-sm resize-none"
                      rows={isLinkedIn ? 3 : 4}
                    />
                    {isLinkedIn && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleGenerateLinkedIn(i)}
                        disabled={generatingLinkedIn === i}
                        className="absolute bottom-2 right-2 h-6 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1"
                      >
                        {generatingLinkedIn === i ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                        AI Generate
                      </Button>
                    )}
                    {isLinkedIn && step.stepType === "linkedin_connect" && (
                      <span className={`absolute bottom-2 left-2 text-[10px] ${step.body.length > 300 ? "text-red-400" : "text-white/30"}`}>
                        {step.body.length}/300
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Step Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => addStep("email")} className="border-dashed border-white/20 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400">
                <Mail className="w-4 h-4 mr-2" /> Add Email Step
              </Button>
              <Button variant="outline" onClick={() => addStep("linkedin_connect")} className="border-dashed border-white/20 text-white/50 hover:border-blue-500/50 hover:text-blue-400">
                <Linkedin className="w-4 h-4 mr-2" /> Add LinkedIn Step
              </Button>
              <Button variant="outline" onClick={() => addStep("linkedin_message")} className="border-dashed border-white/20 text-white/50 hover:border-blue-400/50 hover:text-blue-300">
                <Linkedin className="w-4 h-4 mr-2" /> LinkedIn Message
              </Button>
              <Button variant="outline" onClick={() => addStep("call")} className="border-dashed border-white/20 text-white/50 hover:border-amber-500/50 hover:text-amber-400">
                <Phone className="w-4 h-4 mr-2" /> Add Call Step
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSteps(false)} className="border-white/20 text-white/70">Cancel</Button>
            <Button onClick={() => saveStepsMut.mutate({ sequenceId: selectedSeq!, steps })} disabled={saveStepsMut.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              <Save className="w-4 h-4 mr-2" /> Save Steps
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
