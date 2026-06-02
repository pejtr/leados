import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Bell, Plus, Trash2, Loader2, Mail, MessageSquare, Webhook, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


const CONDITION_TYPES = [
  { value: "high_intent_visitor", label: "High Intent Visitor", icon: "🔥" },
  { value: "new_lead_generated", label: "New Lead Generated", icon: "✨" },
  { value: "lead_status_change", label: "Lead Status Change", icon: "🔄" },
  { value: "deal_closed", label: "Deal Closed", icon: "🎯" },
  { value: "visitor_returning", label: "Returning Visitor", icon: "👋" },
  { value: "keyword_match", label: "Keyword Match", icon: "🔍" },
] as const;

const CHANNELS = [
  { value: "email", label: "Email", icon: Mail },
  { value: "slack", label: "Slack", icon: MessageSquare },
  { value: "webhook", label: "Webhook", icon: Webhook },
] as const;

export default function SmartAlerts() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", conditionType: "" as string, conditionValue: "", channel: "" as string, channelTarget: "" });

  const utils = trpc.useUtils();
  const { data: rules = [], isLoading } = trpc.alertRules.list.useQuery();
  const createMutation = trpc.alertRules.create.useMutation({
    onSuccess: () => { utils.alertRules.list.invalidate(); setOpen(false); setForm({ name: "", conditionType: "", conditionValue: "", channel: "", channelTarget: "" }); toast.success("Alert rule created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.alertRules.delete.useMutation({
    onSuccess: () => { utils.alertRules.list.invalidate(); toast.success("Rule deleted"); },
  });
  const toggleMutation = trpc.alertRules.update.useMutation({
    onSuccess: () => { utils.alertRules.list.invalidate(); },
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-amber-500" /> Smart Alert Rules</h1>
          <p className="text-muted-foreground mt-1">Get notified via Slack, email, or webhook when important events happen</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Alert Rule</DialogTitle>
              <DialogDescription>Set up automated notifications for key events</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Rule Name</Label><Input placeholder="High intent visitor alert" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div>
                <Label>Condition</Label>
                <Select value={form.conditionType} onValueChange={(v) => setForm(p => ({ ...p, conditionType: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select condition..." /></SelectTrigger>
                  <SelectContent>{CONDITION_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Condition Value (optional)</Label><Input placeholder="e.g. intent score > 80" value={form.conditionValue} onChange={(e) => setForm(p => ({ ...p, conditionValue: e.target.value }))} /></div>
              <div>
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(v) => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select channel..." /></SelectTrigger>
                  <SelectContent>{CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Target (email/URL)</Label><Input placeholder="alerts@company.com or webhook URL" value={form.channelTarget} onChange={(e) => setForm(p => ({ ...p, channelTarget: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending || !form.name || !form.conditionType || !form.channel || !form.channelTarget}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bell className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-muted-foreground">Active Rules</p><p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Zap className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Total Fired</p><p className="text-2xl font-bold">{rules.reduce((s, r) => s + r.totalFired, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><MessageSquare className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Channels Used</p><p className="text-2xl font-bold">{new Set(rules.map(r => r.channel)).size}</p></div></div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No alert rules yet</p><p className="text-muted-foreground">Create your first rule to get notified about important events</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div>
                      <p className="font-medium">{rule.name}</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline">{CONDITION_TYPES.find(c => c.value === rule.conditionType)?.icon} {CONDITION_TYPES.find(c => c.value === rule.conditionType)?.label}</Badge>
                        <Badge variant="secondary">{rule.channel}</Badge>
                        {rule.conditionValue && <Badge variant="outline">{rule.conditionValue}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Fired {rule.totalFired} times{rule.lastFiredAt ? ` · Last: ${new Date(rule.lastFiredAt).toLocaleDateString()}` : ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={rule.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: rule.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: rule.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
