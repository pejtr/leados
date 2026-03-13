import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import {
  Webhook, Plus, Trash2, TestTube, CheckCircle2, XCircle,
  Clock, ExternalLink, Slack, SquareKanban, Globe, Loader2,
  Activity, Send, Settings2,
} from "lucide-react";

type IntegrationType = "generic" | "clickup" | "slack";

interface CreateFormData {
  name: string;
  type: IntegrationType;
  webhookUrl: string;
  clickupApiKey: string;
  clickupListId: string;
  slackWebhookUrl: string;
  triggerOnGenerate: boolean;
  triggerOnStatusChange: boolean;
  triggerOnDealClose: boolean;
}

const defaultForm: CreateFormData = {
  name: "",
  type: "generic",
  webhookUrl: "",
  clickupApiKey: "",
  clickupListId: "",
  slackWebhookUrl: "",
  triggerOnGenerate: true,
  triggerOnStatusChange: false,
  triggerOnDealClose: false,
};

const typeInfo: Record<IntegrationType, { icon: typeof Webhook; label: string; color: string; description: string }> = {
  generic: {
    icon: Globe,
    label: "Webhook",
    color: "bg-blue-500/10 text-blue-500",
    description: "Send lead data to any URL (Zapier, Make, n8n, custom)",
  },
  clickup: {
    icon: SquareKanban,
    label: "ClickUp",
    color: "bg-purple-500/10 text-purple-500",
    description: "Create tasks in ClickUp from your leads",
  },
  slack: {
    icon: Slack,
    label: "Slack",
    color: "bg-green-500/10 text-green-500",
    description: "Get lead notifications in your Slack channel",
  },
};

export default function Integrations() {
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateFormData>({ ...defaultForm });
  const [testingId, setTestingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: configs = [], isLoading } = trpc.integrations.list.useQuery();
  const { data: logs = [] } = trpc.integrations.logs.useQuery({ limit: 50 });

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      toast.success("Integration created successfully");
      setCreateOpen(false);
      setForm({ ...defaultForm });
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      toast.success("Integration deleted");
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const testMutation = trpc.integrations.test.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Webhook test successful! ✅");
      } else {
        toast.error(`Test failed: HTTP ${result.status} — ${result.error || result.body}`);
      }
      setTestingId(null);
      utils.integrations.logs.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
      setTestingId(null);
    },
  });

  const handleCreate = () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (form.type === "generic" && !form.webhookUrl.trim()) {
      toast.error("Webhook URL is required");
      return;
    }
    if (form.type === "clickup" && (!form.clickupApiKey.trim() || !form.clickupListId.trim())) {
      toast.error("ClickUp API key and List ID are required");
      return;
    }
    if (form.type === "slack" && !form.slackWebhookUrl.trim()) {
      toast.error("Slack webhook URL is required");
      return;
    }

    createMutation.mutate({
      name: form.name,
      type: form.type,
      webhookUrl: form.type === "generic" ? form.webhookUrl : undefined,
      clickupApiKey: form.type === "clickup" ? form.clickupApiKey : undefined,
      clickupListId: form.type === "clickup" ? form.clickupListId : undefined,
      slackWebhookUrl: form.type === "slack" ? form.slackWebhookUrl : undefined,
      triggerOnGenerate: form.triggerOnGenerate,
      triggerOnStatusChange: form.triggerOnStatusChange,
      triggerOnDealClose: form.triggerOnDealClose,
    });
  };

  const handleTest = (id: number) => {
    setTestingId(id);
    testMutation.mutate({ id });
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Webhook className="h-6 w-6 text-primary" />
              Integrations
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect your lead pipeline to Zapier, Make, ClickUp, Slack, and more
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Integration
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Integration</DialogTitle>
                <DialogDescription>
                  Connect your leads to external tools and services
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., My Zapier Webhook"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as IntegrationType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">
                        <span className="flex items-center gap-2">
                          <Globe className="h-4 w-4" /> Webhook (Zapier/Make/n8n)
                        </span>
                      </SelectItem>
                      <SelectItem value="clickup">
                        <span className="flex items-center gap-2">
                          <SquareKanban className="h-4 w-4" /> ClickUp
                        </span>
                      </SelectItem>
                      <SelectItem value="slack">
                        <span className="flex items-center gap-2">
                          <Slack className="h-4 w-4" /> Slack
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Type-specific fields */}
                {form.type === "generic" && (
                  <div>
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://hooks.zapier.com/..."
                      value={form.webhookUrl}
                      onChange={(e) => setForm({ ...form, webhookUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Leads will be POSTed as JSON to this URL
                    </p>
                  </div>
                )}

                {form.type === "clickup" && (
                  <>
                    <div>
                      <Label>ClickUp API Token</Label>
                      <Input
                        type="password"
                        placeholder="pk_..."
                        value={form.clickupApiKey}
                        onChange={(e) => setForm({ ...form, clickupApiKey: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Get your token from{" "}
                        <a href="https://app.clickup.com/settings/apps" target="_blank" rel="noopener" className="text-primary underline">
                          ClickUp Settings → Apps
                        </a>
                      </p>
                    </div>
                    <div>
                      <Label>ClickUp List ID</Label>
                      <Input
                        placeholder="901234567"
                        value={form.clickupListId}
                        onChange={(e) => setForm({ ...form, clickupListId: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Find List ID in ClickUp → List Settings → Copy ID
                      </p>
                    </div>
                  </>
                )}

                {form.type === "slack" && (
                  <div>
                    <Label>Slack Webhook URL</Label>
                    <Input
                      placeholder="https://hooks.slack.com/services/..."
                      value={form.slackWebhookUrl}
                      onChange={(e) => setForm({ ...form, slackWebhookUrl: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Create an{" "}
                      <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener" className="text-primary underline">
                        Incoming Webhook
                      </a>{" "}
                      in your Slack workspace
                    </p>
                  </div>
                )}

                {/* Trigger events */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-semibold">Trigger Events</Label>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">New leads generated</Label>
                    <Switch
                      checked={form.triggerOnGenerate}
                      onCheckedChange={(v) => setForm({ ...form, triggerOnGenerate: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Lead status changed</Label>
                    <Switch
                      checked={form.triggerOnStatusChange}
                      onCheckedChange={(v) => setForm({ ...form, triggerOnStatusChange: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-normal">Deal closed</Label>
                    <Switch
                      checked={form.triggerOnDealClose}
                      onCheckedChange={(v) => setForm({ ...form, triggerOnDealClose: v })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="configs">
          <TabsList>
            <TabsTrigger value="configs" className="gap-2">
              <Settings2 className="h-4 w-4" />
              Configurations
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="h-4 w-4" />
              Delivery Logs
            </TabsTrigger>
          </TabsList>

          {/* Configurations Tab */}
          <TabsContent value="configs" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : configs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Webhook className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold">No integrations yet</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Connect your lead pipeline to Zapier, Make, ClickUp, Slack, or any webhook endpoint.
                    Leads will be automatically sent when generated.
                  </p>
                  <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Integration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {configs.map((config) => {
                  const info = typeInfo[config.type as IntegrationType] || typeInfo.generic;
                  const Icon = info.icon;
                  return (
                    <Card key={config.id} className={!config.isActive ? "opacity-60" : ""}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${info.color}`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{config.name}</CardTitle>
                              <CardDescription>{info.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={config.isActive}
                              onCheckedChange={(v) =>
                                toggleMutation.mutate({ id: config.id, isActive: v })
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTest(config.id)}
                              disabled={testingId === config.id}
                            >
                              {testingId === config.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                              <span className="ml-1">Test</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Delete this integration?")) {
                                  deleteMutation.mutate({ id: config.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {config.triggerOnGenerate && (
                            <Badge variant="secondary" className="text-xs">
                              <Send className="h-3 w-3 mr-1" />
                              On Generate
                            </Badge>
                          )}
                          {config.triggerOnStatusChange && (
                            <Badge variant="secondary" className="text-xs">
                              <Activity className="h-3 w-3 mr-1" />
                              On Status Change
                            </Badge>
                          )}
                          {config.triggerOnDealClose && (
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              On Deal Close
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {info.label}
                          </Badge>
                        </div>
                        {config.type === "generic" && config.webhookUrl && (
                          <p className="text-xs text-muted-foreground mt-2 font-mono truncate">
                            {config.webhookUrl}
                          </p>
                        )}
                        {config.type === "clickup" && config.clickupListId && (
                          <p className="text-xs text-muted-foreground mt-2">
                            List ID: <span className="font-mono">{config.clickupListId}</span>
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Quick Setup Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                    Zapier / Make / n8n
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Connect to 5,000+ apps. Create a Webhook trigger in Zapier/Make, paste the URL here.
                  </p>
                  <a
                    href="https://zapier.com/apps/webhook/integrations"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Setup Guide <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SquareKanban className="h-4 w-4 text-purple-500" />
                    ClickUp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Auto-create tasks from leads. Get your API token from ClickUp Settings → Apps.
                  </p>
                  <a
                    href="https://clickup.com/api/developer-portal/authentication/"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Get API Token <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
              <Card className="border-dashed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Slack className="h-4 w-4 text-green-500" />
                    Slack
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">
                    Get instant notifications. Create an Incoming Webhook in your Slack workspace.
                  </p>
                  <a
                    href="https://api.slack.com/messaging/webhooks"
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-primary flex items-center gap-1 mt-2"
                  >
                    Create Webhook <ExternalLink className="h-3 w-3" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Delivery Logs Tab */}
          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Webhook Deliveries</CardTitle>
                <CardDescription>Last 50 webhook events and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No webhook deliveries yet</p>
                    <p className="text-xs mt-1">Events will appear here after your first lead generation</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          {log.success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive shrink-0" />
                          )}
                          <div>
                            <span className="font-medium capitalize">
                              {log.eventType.replace("_", " ")}
                            </span>
                            {log.responseStatus && (
                              <Badge
                                variant={log.success ? "secondary" : "destructive"}
                                className="ml-2 text-xs"
                              >
                                HTTP {log.responseStatus}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground text-xs">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
