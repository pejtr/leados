import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, CheckCircle2, Circle, Phone, Mail, Users, Calendar, Bell, Trash2, Clock } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";


const TYPE_ICONS: Record<string, React.ReactNode> = {
  call: <Phone className="w-3.5 h-3.5" />,
  email: <Mail className="w-3.5 h-3.5" />,
  meeting: <Users className="w-3.5 h-3.5" />,
  follow_up: <Bell className="w-3.5 h-3.5" />,
  other: <Calendar className="w-3.5 h-3.5" />,
};

const TYPE_COLORS: Record<string, string> = {
  call: "text-blue-400 bg-blue-500/20",
  email: "text-purple-400 bg-purple-500/20",
  meeting: "text-amber-400 bg-amber-500/20",
  follow_up: "text-emerald-400 bg-emerald-500/20",
  other: "text-white/50 bg-white/10",
};

export default function Tasks() {
  
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [form, setForm] = useState({ title: "", description: "", type: "other" as const, dueAt: "", reminderAt: "" });

  const { data: tasks = [], refetch } = trpc.tasks.list.useQuery();
  const createMut = trpc.tasks.create.useMutation({
    onSuccess: () => { refetch(); setCreating(false); setForm({ title: "", description: "", type: "other", dueAt: "", reminderAt: "" }); toast.success("Task created"); },
  });
  const updateMut = trpc.tasks.update.useMutation({ onSuccess: () => refetch() });
  const deleteMut = trpc.tasks.delete.useMutation({ onSuccess: () => { refetch(); toast.success("Task deleted"); } });

  const filtered = tasks.filter(t => filter === "all" ? true : t.status === filter);
  const pendingCount = tasks.filter(t => t.status === "pending").length;
  const overdueCount = tasks.filter(t => t.status === "pending" && t.dueAt && new Date(t.dueAt) < new Date()).length;

  function toggleDone(task: typeof tasks[0]) {
    updateMut.mutate({ id: task.id, status: task.status === "done" ? "pending" : "done" });
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Activity Tracker</h1>
          <p className="text-white/50 text-sm mt-1">Tasks, follow-ups, calls, and meetings linked to your pipeline</p>
        </div>
        <Button onClick={() => setCreating(true)} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
          <Plus className="w-4 h-4 mr-2" /> Add Task
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending", value: pendingCount, color: "text-amber-400" },
          { label: "Overdue", value: overdueCount, color: "text-red-400" },
          { label: "Completed", value: tasks.filter(t => t.status === "done").length, color: "text-emerald-400" },
        ].map(stat => (
          <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-white/40 text-xs mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(["all", "pending", "done"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${filter === f ? "bg-emerald-500 text-black" : "bg-white/5 text-white/50 hover:bg-white/10"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-white/30 border border-white/10 rounded-xl">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No tasks yet — add your first task above</p>
          </div>
        )}
        {filtered.map(task => {
          const isOverdue = task.status === "pending" && task.dueAt && new Date(task.dueAt) < new Date();
          return (
            <div key={task.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${task.status === "done" ? "border-white/5 bg-white/2 opacity-60" : isOverdue ? "border-red-500/30 bg-red-500/5" : "border-white/10 bg-white/5"}`}>
              <button onClick={() => toggleDone(task)} className="mt-0.5 flex-shrink-0">
                {task.status === "done" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-white/30 hover:text-emerald-400 transition-colors" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${task.status === "done" ? "line-through text-white/40" : "text-white"}`}>{task.title}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[task.type]}`}>
                    {TYPE_ICONS[task.type]} {task.type.replace("_", " ")}
                  </span>
                  {isOverdue && <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Overdue</Badge>}
                </div>
                {task.description && <p className="text-white/40 text-xs mt-0.5">{task.description}</p>}
                <div className="flex items-center gap-4 mt-1.5">
                  {task.dueAt && (
                    <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-400" : "text-white/40"}`}>
                      <Clock className="w-3 h-3" /> Due {new Date(task.dueAt).toLocaleDateString()}
                    </span>
                  )}
                  {task.reminderAt && (
                    <span className="flex items-center gap-1 text-xs text-white/40">
                      <Bell className="w-3 h-3" /> Reminder {new Date(task.reminderAt).toLocaleDateString()}
                    </span>
                  )}
                  {task.leadId && <span className="text-xs text-white/30">Lead #{task.leadId}</span>}
                </div>
              </div>
              <button onClick={() => deleteMut.mutate({ id: task.id })} className="text-white/20 hover:text-red-400 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Dialog */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="bg-[#0f1117] border-white/10 text-white">
          <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-1 block">Title *</label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Follow up with Acme Corp" className="bg-white/5 border-white/20 text-white" />
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Type</label>
              <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as any })}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1d2e] border-white/10 text-white">
                  {["call", "email", "meeting", "follow_up", "other"].map(t => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1 block">Description</label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Notes about this task..." className="bg-white/5 border-white/20 text-white resize-none" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-white/60 mb-1 block">Due Date</label>
                <Input type="date" value={form.dueAt} onChange={e => setForm({ ...form, dueAt: e.target.value })} className="bg-white/5 border-white/20 text-white" />
              </div>
              <div>
                <label className="text-sm text-white/60 mb-1 block">Reminder</label>
                <Input type="date" value={form.reminderAt} onChange={e => setForm({ ...form, reminderAt: e.target.value })} className="bg-white/5 border-white/20 text-white" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)} className="border-white/20 text-white/70">Zrušit</Button>
            <Button onClick={() => createMut.mutate({ title: form.title, description: form.description || undefined, type: form.type, dueAt: form.dueAt ? new Date(form.dueAt) : undefined, reminderAt: form.reminderAt ? new Date(form.reminderAt) : undefined })} disabled={!form.title || createMut.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-black">
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
