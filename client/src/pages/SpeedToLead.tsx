import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Zap, Loader2, Clock, Mail, MessageSquare, Timer } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SpeedToLead() {
  const { data: config, isLoading } = trpc.speedToLead.get.useQuery();
  const upsertMutation = trpc.speedToLead.upsert.useMutation({
    onSuccess: () => toast.success("Speed-to-Lead config saved"),
    onError: (e) => toast.error(e.message),
  });

  const [form, setForm] = useState({
    isActive: true,
    autoEmailEnabled: true,
    responseDelaySeconds: 60,
    notifyOnNewLead: true,
    notifyChannel: "email" as "email" | "slack" | "both",
    notifyTarget: "",
  });

  useEffect(() => {
    if (config) {
      setForm({
        isActive: config.isActive,
        autoEmailEnabled: config.autoEmailEnabled,
        responseDelaySeconds: config.responseDelaySeconds,
        notifyOnNewLead: config.notifyOnNewLead,
        notifyChannel: config.notifyChannel || "email",
        notifyTarget: config.notifyTarget || "",
      });
    }
  }, [config]);

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Zap className="h-6 w-6 text-yellow-500" /> Speed-to-Lead</h1>
        <p className="text-muted-foreground mt-1">Instant follow-up automation — respond to new leads in seconds</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Timer className="h-8 w-8 text-yellow-500" /><div><p className="text-sm text-muted-foreground">Avg Response Time</p><p className="text-2xl font-bold">{config?.avgResponseTime ? `${config.avgResponseTime}s` : "—"}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Mail className="h-8 w-8 text-blue-500" /><div><p className="text-sm text-muted-foreground">Auto-Responses Sent</p><p className="text-2xl font-bold">{config?.totalAutoResponses || 0}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Zap className="h-8 w-8 text-green-500" /><div><p className="text-sm text-muted-foreground">Status</p><p className="text-2xl font-bold">{form.isActive ? "Active" : "Paused"}</p></div></div></CardContent></Card>
      </div>

      {/* Config */}
      <Card>
        <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div><Label className="text-base">Enable Speed-to-Lead</Label><p className="text-sm text-muted-foreground">Automatically respond to new leads</p></div>
            <Switch checked={form.isActive} onCheckedChange={(v) => setForm(p => ({ ...p, isActive: v }))} />
          </div>

          <div className="flex items-center justify-between">
            <div><Label className="text-base">Auto-Email Response</Label><p className="text-sm text-muted-foreground">Send automated email to new leads</p></div>
            <Switch checked={form.autoEmailEnabled} onCheckedChange={(v) => setForm(p => ({ ...p, autoEmailEnabled: v }))} />
          </div>

          <div>
            <Label>Response Delay (seconds)</Label>
            <div className="flex items-center gap-3 mt-1">
              <Input type="number" min={10} max={3600} value={form.responseDelaySeconds} onChange={(e) => setForm(p => ({ ...p, responseDelaySeconds: parseInt(e.target.value) || 60 }))} className="w-32" />
              <span className="text-sm text-muted-foreground">= {Math.floor(form.responseDelaySeconds / 60)}m {form.responseDelaySeconds % 60}s</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div><Label className="text-base">Notify on New Lead</Label><p className="text-sm text-muted-foreground">Get notified when a new lead arrives</p></div>
            <Switch checked={form.notifyOnNewLead} onCheckedChange={(v) => setForm(p => ({ ...p, notifyOnNewLead: v }))} />
          </div>

          {form.notifyOnNewLead && (
            <>
              <div>
                <Label>Notification Channel</Label>
                <Select value={form.notifyChannel} onValueChange={(v: any) => setForm(p => ({ ...p, notifyChannel: v }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="slack">Slack</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notification Target</Label>
                <Input placeholder="email@company.com or Slack webhook URL" value={form.notifyTarget} onChange={(e) => setForm(p => ({ ...p, notifyTarget: e.target.value }))} />
              </div>
            </>
          )}

          <Button onClick={() => upsertMutation.mutate(form)} disabled={upsertMutation.isPending}>
            {upsertMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
