import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Plus, Edit, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Project = {
  id: string;
  title: string;
  status: string;
  completionPercentage: number | null;
  packageType: string;
  orderId: number;
  assignedTo: string | null;
  deadline: number | null;
  description: string | null;
  milestones: Array<{ id: string; title: string; status: string; description?: string | null; dueDate?: number | null }>;
  order: { id: number; status: string; totalPrice: number; depositAmount: number; remainingAmount: number } | null;
};

export default function AdminProjects() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [newMilestoneProjectId, setNewMilestoneProjectId] = useState<string | null>(null);
  const [createProjectOrderId, setCreateProjectOrderId] = useState<number | null>(null);

  const { data: projects, refetch } = trpc.projects.admin.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const updateMutation = trpc.projects.admin.update.useMutation({ onSuccess: () => refetch() });
  const addMilestoneMutation = trpc.projects.admin.addMilestone.useMutation({ onSuccess: () => { refetch(); setNewMilestoneProjectId(null); } });
  const updateMilestoneMutation = trpc.projects.admin.updateMilestone.useMutation({ onSuccess: () => refetch() });
  const createMutation = trpc.projects.admin.create.useMutation({ onSuccess: () => { refetch(); setCreateProjectOrderId(null); } });

  // Form state
  const [editForm, setEditForm] = useState<{ status: string; completionPercentage: number; assignedTo: string }>({ status: "", completionPercentage: 0, assignedTo: "" });
  const [milestoneForm, setMilestoneForm] = useState({ title: "", description: "", dueDays: "" });
  const [createForm, setCreateForm] = useState({ title: "", description: "", assignedTo: "", deadlineDays: "14" });

  if (!user || user.role !== "admin") {
    return <div className="p-8 text-center text-slate-500">Přístup odepřen</div>;
  }

  const formatPrice = (v: number) => `${(v / 100).toLocaleString("cs-CZ")} Kč`;

  const statusLabel: Record<string, string> = {
    pending: "Příprava", in_progress: "Ve výrobě", completed: "Dokončeno", failed: "Pozastaveno",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-slate-100 text-slate-700", in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800", failed: "bg-red-100 text-red-800",
  };

  const openEdit = (p: Project) => {
    setEditProject(p);
    setEditForm({ status: p.status, completionPercentage: p.completionPercentage ?? 0, assignedTo: p.assignedTo ?? "" });
  };

  const saveEdit = () => {
    if (!editProject) return;
    updateMutation.mutate({
      projectId: editProject.id,
      status: editForm.status as "pending" | "in_progress" | "completed" | "failed",
      completionPercentage: editForm.completionPercentage,
      assignedTo: editForm.assignedTo,
    });
    setEditProject(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Správa projektů</h2>
          <p className="text-slate-500 text-sm mt-0.5">Přehled všech projektů a jejich postupu</p>
        </div>
        <div className="flex gap-2 text-sm text-slate-500">
          <span className="font-medium text-slate-900">{projects?.length ?? 0}</span> projektů celkem
        </div>
      </div>

      {/* Stats row */}
      {projects && projects.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {(["pending", "in_progress", "completed", "failed"] as const).map(s => (
            <Card key={s} className="p-3">
              <p className="text-xs text-slate-500 mb-1">{statusLabel[s]}</p>
              <p className="text-xl font-bold text-slate-900">{projects.filter(p => p.status === s).length}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Project list */}
      <div className="space-y-3">
        {!projects ? (
          <Card><CardContent className="p-8 text-center text-slate-500">Načítám...</CardContent></Card>
        ) : projects.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-slate-500">Žádné projekty</CardContent></Card>
        ) : (
          projects.map((p) => {
            const pct = p.completionPercentage ?? 0;
            const isOpen = expandedId === p.id;
            const daysLeft = p.deadline ? Math.ceil((p.deadline - Date.now()) / 86400000) : null;

            return (
              <Card key={p.id} className="overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedId(isOpen ? null : p.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Status + title */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 truncate">{p.title}</span>
                        <Badge className={`${statusColor[p.status]} text-xs`}>{statusLabel[p.status]}</Badge>
                        <span className="text-xs text-slate-400">#{p.orderId}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500">{p.packageType}</span>
                        {p.assignedTo && <span className="text-xs text-slate-500">→ {p.assignedTo}</span>}
                        {daysLeft !== null && (
                          <span className={`text-xs font-medium ${daysLeft < 0 ? "text-red-500" : daysLeft < 7 ? "text-orange-500" : "text-slate-400"}`}>
                            {daysLeft < 0 ? `⚠ Termín překročen` : `${daysLeft} dní`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="w-32 hidden md:block">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Postup</span><span className="font-bold text-violet-600">{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>

                    {/* Price */}
                    {p.order && (
                      <div className="text-right hidden md:block text-sm">
                        <p className="font-semibold text-slate-900">{formatPrice(p.order.totalPrice)}</p>
                        <p className="text-xs text-slate-400">{formatPrice(p.order.depositAmount)} záloha</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(p as Project)}>
                        <Edit className="w-4 h-4 text-slate-500" />
                      </Button>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>
                </div>

                {/* Expanded: milestones */}
                {isOpen && (
                  <div className="border-t bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-700">
                        Milníky ({(p.milestones ?? []).filter(m => m.status === "completed").length}/{(p.milestones ?? []).length})
                      </h4>
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={() => setNewMilestoneProjectId(p.id)}
                      >
                        <Plus className="w-3 h-3" /> Přidat milník
                      </Button>
                    </div>

                    {(p.milestones ?? []).length === 0 ? (
                      <p className="text-xs text-slate-400">Žádné milníky</p>
                    ) : (
                      <div className="space-y-2">
                        {(p.milestones ?? []).map(m => (
                          <div key={m.id} className="flex items-center gap-3 bg-white rounded-md px-3 py-2 border border-slate-100">
                            <div>
                              {m.status === "completed" ? <CheckCircle className="w-4 h-4 text-green-500" />
                               : m.status === "in_progress" ? <Clock className="w-4 h-4 text-blue-500" />
                               : <AlertCircle className="w-4 h-4 text-slate-300" />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${m.status === "completed" ? "line-through text-slate-400" : "text-slate-700"}`}>{m.title}</p>
                              {m.description && <p className="text-xs text-slate-400">{m.description}</p>}
                            </div>
                            <Select
                              value={m.status}
                              onValueChange={(val) => updateMilestoneMutation.mutate({
                                milestoneId: m.id,
                                status: val as "pending" | "in_progress" | "completed",
                              })}
                            >
                              <SelectTrigger className="h-7 w-32 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Čeká</SelectItem>
                                <SelectItem value="in_progress">Probíhá</SelectItem>
                                <SelectItem value="completed">Hotovo</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add milestone form inline */}
                    {newMilestoneProjectId === p.id && (
                      <div className="bg-white border border-violet-200 rounded-md p-3 space-y-2">
                        <p className="text-sm font-medium text-slate-700">Nový milník</p>
                        <Input
                          placeholder="Název milníku"
                          value={milestoneForm.title}
                          onChange={e => setMilestoneForm(f => ({ ...f, title: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder="Popis (volitelný)"
                          value={milestoneForm.description}
                          onChange={e => setMilestoneForm(f => ({ ...f, description: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm" className="bg-violet-600 hover:bg-violet-700 h-7 text-xs"
                            disabled={!milestoneForm.title || addMilestoneMutation.isPending}
                            onClick={() => addMilestoneMutation.mutate({
                              projectId: p.id,
                              title: milestoneForm.title,
                              description: milestoneForm.description || undefined,
                            })}
                          >
                            Uložit
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs"
                            onClick={() => { setNewMilestoneProjectId(null); setMilestoneForm({ title: "", description: "", dueDays: "" }); }}>
                            Zrušit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Edit project dialog */}
      <Dialog open={!!editProject} onOpenChange={(open) => !open && setEditProject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upravit projekt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-sm">Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Příprava</SelectItem>
                  <SelectItem value="in_progress">Ve výrobě</SelectItem>
                  <SelectItem value="completed">Dokončeno</SelectItem>
                  <SelectItem value="failed">Pozastaveno</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Postup: {editForm.completionPercentage}%</Label>
              <input
                type="range" min={0} max={100} value={editForm.completionPercentage}
                onChange={e => setEditForm(f => ({ ...f, completionPercentage: +e.target.value }))}
                className="w-full mt-1 accent-violet-600"
              />
            </div>
            <div>
              <Label className="text-sm">Přiřazeno komu</Label>
              <Input
                placeholder="email nebo jméno"
                value={editForm.assignedTo}
                onChange={e => setEditForm(f => ({ ...f, assignedTo: e.target.value }))}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                disabled={updateMutation.isPending}
                onClick={saveEdit}
              >
                Uložit změny
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setEditProject(null)}>Zrušit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
