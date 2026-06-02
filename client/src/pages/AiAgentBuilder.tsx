import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Bot, Plus, Trash2, Loader2, Play, History, Sparkles, Settings, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";


const AGENT_TYPES = [
  { value: "lead_qualifier", label: "Lead Qualifier", desc: "Automatically qualify leads based on criteria" },
  { value: "email_writer", label: "Email Writer", desc: "Generate personalized outreach emails" },
  { value: "data_enricher", label: "Data Enricher", desc: "Enrich lead data with additional info" },
  { value: "meeting_scheduler", label: "Meeting Scheduler", desc: "Schedule meetings with qualified leads" },
  { value: "custom", label: "Custom Agent", desc: "Build your own custom AI agent" },
] as const;

export default function AiAgentBuilder() {
  const [open, setOpen] = useState(false);
  const [executeOpen, setExecuteOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [executeInput, setExecuteInput] = useState("");
  const [executeResult, setExecuteResult] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", agentType: "custom" as string, config: '{"systemPrompt":"You are a helpful AI agent.","temperature":0.7}' });

  const utils = trpc.useUtils();
  const { data: agents = [], isLoading } = trpc.aiAgents.list.useQuery();
  const { data: logs = [] } = trpc.aiAgents.logs.useQuery({ agentId: selectedAgent || 0 }, { enabled: !!selectedAgent && logsOpen });
  const createMutation = trpc.aiAgents.create.useMutation({
    onSuccess: () => { utils.aiAgents.list.invalidate(); setOpen(false); setForm({ name: "", description: "", agentType: "custom", config: '{"systemPrompt":"You are a helpful AI agent.","temperature":0.7}' }); toast.success("Agent created"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.aiAgents.delete.useMutation({
    onSuccess: () => { utils.aiAgents.list.invalidate(); toast.success("Agent deleted"); },
  });
  const toggleMutation = trpc.aiAgents.update.useMutation({
    onSuccess: () => { utils.aiAgents.list.invalidate(); },
  });
  const executeMutation = trpc.aiAgents.execute.useMutation({
    onSuccess: (data) => { setExecuteResult(data.output); toast.success(`Executed in ${data.durationMs}ms`); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bot className="h-6 w-6 text-emerald-500" /> AI Agent Builder</h1>
          <p className="text-muted-foreground mt-1">Build and orchestrate custom AI agents for your lead pipeline</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Agent</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create AI Agent</DialogTitle>
              <DialogDescription>Configure a new AI agent for your pipeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Agent Name</Label><Input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Lead Qualifier Pro" /></div>
              <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Qualifies inbound leads based on ICP criteria" /></div>
              <div>
                <Label>Agent Type</Label>
                <Select value={form.agentType} onValueChange={(v) => setForm(p => ({ ...p, agentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{AGENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">{AGENT_TYPES.find(t => t.value === form.agentType)?.desc}</p>
              </div>
              <div><Label>Config (JSON)</Label><Textarea value={form.config} onChange={(e) => setForm(p => ({ ...p, config: e.target.value }))} rows={4} className="font-mono text-xs" /></div>
            </div>
            <DialogFooter>
              <Button onClick={() => createMutation.mutate(form as any)} disabled={createMutation.isPending || !form.name || !form.config}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Create Agent
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Bot className="h-8 w-8 text-emerald-500" /><div><p className="text-sm text-muted-foreground">Total Agents</p><p className="text-2xl font-bold">{agents.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Play className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Total Executions</p><p className="text-2xl font-bold">{agents.reduce((s, a) => s + a.totalExecutions, 0)}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Sparkles className="h-8 w-8 text-amber-500" /><div><p className="text-sm text-muted-foreground">Active Agents</p><p className="text-2xl font-bold">{agents.filter(a => a.isActive).length}</p></div></div></CardContent></Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : agents.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-lg font-medium">No AI agents yet</p><p className="text-muted-foreground">Create your first agent to automate your lead pipeline</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">{agent.name} <Badge variant="outline">{AGENT_TYPES.find(t => t.value === agent.agentType)?.label}</Badge></CardTitle>
                    {agent.description && <CardDescription>{agent.description}</CardDescription>}
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={agent.isActive} onCheckedChange={(v) => toggleMutation.mutate({ id: agent.id, isActive: v })} />
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: agent.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="secondary">{agent.totalExecutions} runs</Badge>
                  {agent.successRate !== null && <Badge variant="secondary">{agent.successRate}% success</Badge>}
                  {agent.lastExecutedAt && <Badge variant="outline">Last: {new Date(agent.lastExecutedAt).toLocaleDateString()}</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAgent(agent.id); setExecuteOpen(true); setExecuteResult(null); setExecuteInput(""); }}><Play className="h-3 w-3 mr-1" /> Execute</Button>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedAgent(agent.id); setLogsOpen(true); }}><History className="h-3 w-3 mr-1" /> Logs</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Execute Dialog */}
      <Dialog open={executeOpen} onOpenChange={setExecuteOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Execute Agent</DialogTitle></DialogHeader>
          <Textarea placeholder="Enter input for the agent..." value={executeInput} onChange={(e) => setExecuteInput(e.target.value)} rows={3} />
          {executeResult && <div className="bg-muted rounded-lg p-3 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">{executeResult}</div>}
          <DialogFooter>
            <Button onClick={() => executeMutation.mutate({ agentId: selectedAgent!, input: executeInput })} disabled={executeMutation.isPending || !executeInput}>
              {executeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />} Run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logs Dialog */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Agent Execution Logs</DialogTitle></DialogHeader>
          {logs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No logs yet</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {log.status === "success" ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />}
                    <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                    <span className="text-xs text-muted-foreground">{log.durationMs}ms</span>
                    <span className="text-xs text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</span>
                  </div>
                  {log.input && <div className="bg-muted rounded p-2 text-xs mb-1"><strong>Input:</strong> {log.input}</div>}
                  {log.output && <div className="bg-muted rounded p-2 text-xs"><strong>Output:</strong> {log.output.substring(0, 500)}</div>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
