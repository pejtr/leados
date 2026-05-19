/**
 * Admin Integrations Dashboard
 * Manage API keys, webhooks, and view delivery logs
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Copy, Eye, EyeOff, Trash2, Plus, RefreshCw, Check, AlertCircle, 
  Key, Webhook, Activity, ExternalLink, Shield, Clock,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminIntegrations() {
  const [showApiKey, setShowApiKey] = useState<Record<number, boolean>>({});
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState("read");
  const [newWebhookName, setNewWebhookName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState("new_lead,new_order");

  // API Keys
  const apiKeysQuery = trpc.apiKeys.list.useQuery();
  const createApiKeyMutation = trpc.apiKeys.create.useMutation();
  const revokeApiKeyMutation = trpc.apiKeys.revoke.useMutation();
  const deleteApiKeyMutation = trpc.apiKeys.delete.useMutation();

  // Webhooks
  const webhooksQuery = trpc.webhooks.list.useQuery();
  const createWebhookMutation = trpc.webhooks.create.useMutation();
  const testWebhookMutation = trpc.webhooks.test.useMutation();
  const deleteWebhookMutation = trpc.webhooks.delete.useMutation();
  const toggleWebhookMutation = trpc.webhooks.toggleStatus.useMutation();

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    try {
      const result = await createApiKeyMutation.mutateAsync({
        name: newKeyName,
        permissions: newKeyPermissions,
      });

      toast.success(result.message);
      setNewKeyName("");
      setNewKeyPermissions("read");
      apiKeysQuery.refetch();

      // Copy to clipboard
      navigator.clipboard.writeText(result.key);
      toast.success("API key copied to clipboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create API key");
    }
  };

  const handleCreateWebhook = async () => {
    if (!newWebhookName.trim() || !newWebhookUrl.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const result = await createWebhookMutation.mutateAsync({
        name: newWebhookName,
        url: newWebhookUrl,
        events: newWebhookEvents,
      });

      toast.success("Webhook created successfully");
      setNewWebhookName("");
      setNewWebhookUrl("");
      setNewWebhookEvents("new_lead,new_order");
      webhooksQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create webhook");
    }
  };

  const handleTestWebhook = async (webhookId: number) => {
    try {
      const result = await testWebhookMutation.mutateAsync({ id: webhookId });

      if (result.success) {
        toast.success(`Webhook test successful (HTTP ${result.statusCode})`);
      } else {
        toast.error(`Webhook test failed: ${result.error}`);
      }
    } catch (error) {
      toast.error("Failed to test webhook");
    }
  };

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const handleRevokeApiKey = async (keyId: number) => {
    if (!confirm("Are you sure? This will revoke the API key immediately.")) return;

    try {
      await revokeApiKeyMutation.mutateAsync({ keyId });
      toast.success("API key revoked");
      apiKeysQuery.refetch();
    } catch (error) {
      toast.error("Failed to revoke API key");
    }
  };

  const handleDeleteApiKey = async (keyId: number) => {
    if (!confirm("Are you sure? This will permanently delete the API key.")) return;

    try {
      await deleteApiKeyMutation.mutateAsync({ keyId });
      toast.success("API key deleted");
      apiKeysQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete API key");
    }
  };

  const handleDeleteWebhook = async (webhookId: number) => {
    if (!confirm("Are you sure? This will permanently delete the webhook.")) return;

    try {
      await deleteWebhookMutation.mutateAsync({ id: webhookId });
      toast.success("Webhook deleted");
      webhooksQuery.refetch();
    } catch (error) {
      toast.error("Failed to delete webhook");
    }
  };

  const handleToggleWebhook = async (webhookId: number) => {
    try {
      await toggleWebhookMutation.mutateAsync({ id: webhookId });
      webhooksQuery.refetch();
    } catch (error) {
      toast.error("Failed to toggle webhook status");
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8 text-teal-600" />
              Integrations & API
            </h1>
            <p className="text-muted-foreground mt-1">Manage API keys, webhooks, and external integrations</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api-keys" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="flex items-center gap-2">
              <Webhook className="w-4 h-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="documentation" className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Documentation
            </TabsTrigger>
          </TabsList>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Create and manage API keys for external integrations</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create API Key
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New API Key</DialogTitle>
                        <DialogDescription>
                          Generate a new API key for external integrations. You'll only see it once.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="key-name">Key Name</Label>
                          <Input
                            id="key-name"
                            placeholder="e.g., Zapier Integration"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="permissions">Permissions</Label>
                          <select
                            id="permissions"
                            className="w-full px-3 py-2 border rounded-md"
                            value={newKeyPermissions}
                            onChange={(e) => setNewKeyPermissions(e.target.value)}
                          >
                            <option value="read">Read Only</option>
                            <option value="read,write">Read & Write</option>
                            <option value="read,write,email">Full Access</option>
                          </select>
                        </div>
                        <Button onClick={handleCreateApiKey} className="w-full">
                          Create Key
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {apiKeysQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
                ) : apiKeysQuery.data && apiKeysQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeysQuery.data.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                        <div className="flex-1">
                          <p className="font-medium">{key.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {key.permissions}
                            </Badge>
                            <Badge
                              variant={key.status === "active" ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {key.status}
                            </Badge>
                            {key.lastUsedAt && (
                              <span className="text-xs text-muted-foreground">
                                Last used: {new Date(key.lastUsedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeApiKey(key.id)}
                            className="text-amber-600 hover:text-amber-700"
                          >
                            Revoke
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApiKey(key.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No API keys yet. Create one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>Configure webhooks for real-time event notifications</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Create Webhook
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Webhook</DialogTitle>
                        <DialogDescription>
                          Set up a webhook to receive real-time notifications for events.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="webhook-name">Webhook Name</Label>
                          <Input
                            id="webhook-name"
                            placeholder="e.g., Affiliate Sync"
                            value={newWebhookName}
                            onChange={(e) => setNewWebhookName(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="webhook-url">Webhook URL</Label>
                          <Input
                            id="webhook-url"
                            placeholder="https://example.com/webhooks/leadgen"
                            value={newWebhookUrl}
                            onChange={(e) => setNewWebhookUrl(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="webhook-events">Events</Label>
                          <div className="space-y-2 mt-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newWebhookEvents.includes("new_lead")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhookEvents((prev) => prev + ",new_lead");
                                  } else {
                                    setNewWebhookEvents((prev) => prev.replace(",new_lead", ""));
                                  }
                                }}
                              />
                              <span className="text-sm">New Lead</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newWebhookEvents.includes("new_order")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhookEvents((prev) => prev + ",new_order");
                                  } else {
                                    setNewWebhookEvents((prev) => prev.replace(",new_order", ""));
                                  }
                                }}
                              />
                              <span className="text-sm">New Order</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newWebhookEvents.includes("quiz_completed")}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewWebhookEvents((prev) => prev + ",quiz_completed");
                                  } else {
                                    setNewWebhookEvents((prev) => prev.replace(",quiz_completed", ""));
                                  }
                                }}
                              />
                              <span className="text-sm">Quiz Completed</span>
                            </label>
                          </div>
                        </div>
                        <Button onClick={handleCreateWebhook} className="w-full">
                          Create Webhook
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {webhooksQuery.isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading webhooks...</div>
                ) : webhooksQuery.data && webhooksQuery.data.length > 0 ? (
                  <div className="space-y-3">
                    {webhooksQuery.data.map((webhook) => (
                      <div key={webhook.id} className="p-4 border rounded-lg bg-slate-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <p className="font-medium">{webhook.name}</p>
                            <p className="text-sm text-muted-foreground break-all">{webhook.url}</p>
                          </div>
                          <Badge
                            variant={webhook.status === "active" ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {webhook.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-3">
                          <span className="text-muted-foreground">Events:</span>
                          <span className="font-mono text-xs bg-white px-2 py-1 rounded">
                            {webhook.events}
                          </span>
                        </div>

                        {webhook.failureCount > 0 && (
                          <div className="flex items-center gap-2 text-sm text-amber-600 mb-3">
                            <AlertCircle className="w-4 h-4" />
                            {webhook.failureCount} failed attempts
                          </div>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestWebhook(webhook.id)}
                            disabled={testWebhookMutation.isPending}
                            className="gap-1"
                          >
                            <RefreshCw className={`w-4 h-4 ${testWebhookMutation.isPending ? "animate-spin" : ""}`} />
                            Test
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleWebhook(webhook.id)}
                          >
                            {webhook.status === "active" ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWebhook(webhook.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No webhooks yet. Create one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="documentation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>Integration guide for external systems</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Authentication</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    All API requests require Bearer token authentication:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    Authorization: Bearer leadOS_your_api_key_here
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Available Endpoints</h3>
                  <div className="space-y-3">
                    <div className="border rounded-lg p-3">
                      <p className="font-mono text-sm text-teal-600">GET /api/external/leads</p>
                      <p className="text-sm text-muted-foreground">Fetch all leads for authenticated user</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-mono text-sm text-teal-600">GET /api/external/leads/:id</p>
                      <p className="text-sm text-muted-foreground">Fetch specific lead by ID</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-mono text-sm text-teal-600">PUT /api/external/leads/:id</p>
                      <p className="text-sm text-muted-foreground">Update lead status, notes, or deal value</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="font-mono text-sm text-teal-600">GET /api/external/analytics</p>
                      <p className="text-sm text-muted-foreground">Get aggregated analytics and KPIs</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Webhook Events</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Webhooks are signed with HMAC-SHA256. Verify the signature using the secret provided:
                  </p>
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    X-LeadOS-Signature: sha256=...
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
