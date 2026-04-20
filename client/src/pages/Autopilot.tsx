import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Plus, Trash2, Clock, Zap, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useGoogleAds } from "@/hooks/useGoogleAds";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function Autopilot() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industry: "",
    location: "",
    seniorityLevel: "Manager",
    leadCount: 10,
    scheduleType: "weekly" as "daily" | "weekly" | "monthly",
    scheduleDayOfWeek: 1,
    scheduleHour: 9,
  });

  const utils = trpc.useUtils();
  const { data: configs, isLoading } = trpc.autopilot.list.useQuery();
  const { data: industries } = trpc.leads.industries.useQuery();
  const { track } = useGoogleAds();

  const createMut = trpc.autopilot.create.useMutation({
    onSuccess: () => {
      toast.success("Autopilot config created");
      utils.autopilot.list.invalidate();
      setOpen(false);
      track('autopilot_created', { schedule_type: form.scheduleType, industry: form.industry });
      setForm({ name: "", industry: "", location: "", seniorityLevel: "Manager", leadCount: 10, scheduleType: "weekly", scheduleDayOfWeek: 1, scheduleHour: 9 });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMut = trpc.autopilot.update.useMutation({
    onSuccess: () => utils.autopilot.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.autopilot.delete.useMutation({
    onSuccess: () => {
      toast.success("Config deleted");
      utils.autopilot.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              Autopilot
            </h1>
            <p className="text-muted-foreground mt-1">
              Schedule automatic lead generation on a recurring basis.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Schedule</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Autopilot Schedule</DialogTitle>
                <DialogDescription>Set up automatic lead generation on a recurring schedule.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Name</Label>
                  <Input placeholder="e.g. Weekly Tech Leads" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Industry</Label>
                    <Select value={form.industry} onValueChange={(v) => setForm({ ...form, industry: v })}>
                      <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {(industries || []).map((ind: string) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input placeholder="e.g. Czech Republic" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Seniority Level</Label>
                    <Select value={form.seniorityLevel} onValueChange={(v) => setForm({ ...form, seniorityLevel: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["Entry", "Manager", "Director", "VP", "C-Level"].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lead Count</Label>
                    <Input type="number" min={1} max={100} value={form.leadCount} onChange={(e) => setForm({ ...form, leadCount: parseInt(e.target.value) || 10 })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select value={form.scheduleType} onValueChange={(v: any) => setForm({ ...form, scheduleType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {form.scheduleType !== "daily" && form.scheduleType !== "monthly" && (
                    <div>
                      <Label>Day</Label>
                      <Select value={String(form.scheduleDayOfWeek)} onValueChange={(v) => setForm({ ...form, scheduleDayOfWeek: parseInt(v) })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d, i) => (
                            <SelectItem key={i} value={String(i)}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Hour (UTC)</Label>
                    <Select value={String(form.scheduleHour)} onValueChange={(v) => setForm({ ...form, scheduleHour: parseInt(v) })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => (
                          <SelectItem key={i} value={String(i)}>{String(i).padStart(2, "0")}:00</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  className="w-full"
                  disabled={!form.name || !form.industry || !form.location || createMut.isPending}
                  onClick={() => createMut.mutate(form)}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
                  Create Schedule
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !configs?.length ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bot className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Autopilot schedules yet</h3>
              <p className="text-muted-foreground mb-4">Create your first schedule to automatically generate leads on a recurring basis.</p>
              <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Schedule</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {configs.map((config: any) => (
              <AutopilotCard
                key={config.id}
                config={config}
                onToggle={(active) => toggleMut.mutate({ id: config.id, isActive: active })}
                onDelete={() => deleteMut.mutate({ id: config.id })}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function AutopilotCard({ config, onToggle, onDelete }: { config: any; onToggle: (active: boolean) => void; onDelete: () => void }) {
  const { data: runs } = trpc.autopilot.runs.useQuery({ configId: config.id, limit: 5 });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{config.name}</CardTitle>
            <Badge variant={config.isActive ? "default" : "secondary"}>
              {config.isActive ? "Active" : "Paused"}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.isActive} onCheckedChange={onToggle} />
            <Button variant="ghost" size="icon" onClick={onDelete} className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription>
          {config.industry} &middot; {config.location} &middot; {config.seniorityLevel} &middot; {config.leadCount} leads
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="capitalize">{config.scheduleType}</span>
            {config.scheduleType !== "daily" && config.scheduleType !== "monthly" && (
              <span>({DAYS[config.scheduleDayOfWeek]})</span>
            )}
            <span>at {String(config.scheduleHour).padStart(2, "0")}:00 UTC</span>
          </div>
          <span>Total runs: {config.totalRuns}</span>
          <span>Total leads: {config.totalLeadsGenerated}</span>
          {config.nextRunAt && (
            <span>Next: {new Date(config.nextRunAt).toLocaleDateString()}</span>
          )}
        </div>
        {runs && runs.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent Runs</p>
            {runs.map((run: any) => (
              <div key={run.id} className="flex items-center justify-between text-sm py-1 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-2">
                  {run.status === "completed" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  ) : run.status === "error" ? (
                    <XCircle className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                  )}
                  <span>{new Date(run.startedAt).toLocaleString()}</span>
                </div>
                <span className="text-muted-foreground">
                  {run.leadsGenerated} leads
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
