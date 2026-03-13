import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GitBranch, Plus, Trash2, Loader2, ArrowRight, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const TRIGGERS = [
  { value: "lead_created", label: "Lead Created" },
  { value: "status_changed", label: "Status Changed" },
  { value: "email_opened", label: "Email Opened" },
  { value: "email_replied", label: "Email Replied" },
  { value: "intent_score_above", label: "Intent Score Above" },
  { value: "visitor_returned", label: "Visitor Returned" },
  { value: "deal_value_above", label: "Deal Value Above" },
] as const;

const ACTIONS = [
  { value: "send_email", label: "Send Email" },
  { value: "change_status", label: "Change Status" },
  { value: "assign_to", label: "Assign To" },
  { value: "add_to_list", label: "Add To List" },
  { value: "send_webhook", label: "Send Webhook" },
  { value: "send_slack", label: "Send Slack" },
  { value: "create_task", label: "Create Task" },
] as const;

export default function CampaignRules() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", triggerType: "" as string, triggerValue: "", actionType: "" as string, actionValue: "" });

  const utils = trpc.useUtils();
  const { data: rules = [], isLoading } = trpc.campaignRules.list.useQuery();
  const createMutation = trpc.campaignRules.create.useMutation({
    onSuccess: () => { utils.campaignRules.list.invalidate(); setOpen(false); setForm({ name: "", triggerType: "", triggerValue: "", actionType: "", actionValue: "" }); toast.success("Campaign rule created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.campaignRules.delete.useMutation({
    onSuccess: () => { utils.campaignRules.list.invalidate(); toast.success("Rule deleted"); },
  });
  const toggleMutation = trpc.campaignRules.update.useMutation({
    onSuccess: () => { utils.campaignRules.list.invalidate(); },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GitBranch className="h-6 w-6 text-orange-500" /> Campaign Rules</h1>
          <p className="text-muted-foreground mt-1">Condition-based If/Then automation for your lead pipeline</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Rule</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Campaign Rule</DialogTitle>
              <DialogDescription>Set up IF trigger THEN action automation</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Rule Name</Label><Input placeholder="Auto-assign hot leads" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>IF (Trigger)</Label>
                  <Select value={form.triggerType} onValueChange={(v) => setForm(p => ({ ...p, triggerType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>{TRIGGERS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Trigger Value</Label><Input placeholder="e.g. 80" value={form.triggerValue} onChange={(e) => setForm(p => ({ ...p, triggerValue: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>THEN (Action)</Label>
                  <Select value={form.actionType} onValueChange={(v) => setForm(p => ({ ...p, actionType: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select action..." /></SelectTrigger>
                    <SelectContent>{ACTIONS.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Action Value</Label><Input placeholder="e.g. john@team.com" value={form.actionValue} onChange={(e) => setForm(p => ({ ...p, actionValue: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending || !form.name || !form.triggerType || !form.actionType}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><GitBranch className="h-8 w-8 text-orange-500" /><div><p className="text-sm text-muted-foreground">Active Rules</p><p className="text-2xl font-bold">{rules.filter(r => r.isActive).length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Zap className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Total Executions</p><p className="text-2xl font-bold">{rules.reduce((s, r) => s + r.totalExecutions, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><ArrowRight className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Unique Triggers</p><p className="text-2xl font-bold">{new Set(rules.map(r => r.triggerType)).size}</p></div></div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : rules.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No campaign rules yet</p><p className="text-muted-foreground">Create If/Then rules to automate your lead pipeline</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium">{rule.name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <Badge variant="outline">IF: {TRIGGERS.find(t => t.value === rule.triggerType)?.label}</Badge>
                      {rule.triggerValue && <Badge variant="secondary">{rule.triggerValue}</Badge>}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">THEN: {ACTIONS.find(a => a.value === rule.actionType)?.label}</Badge>
                      {rule.actionValue && <Badge variant="secondary">{rule.actionValue}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Executed {rule.totalExecutions} times</p>
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
  );
}
