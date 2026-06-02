/**
 * Webhook Activity Dashboard
 * Real-time delivery logs, retry attempts, failure reasons, and manual retry
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Webhook, CheckCircle, AlertCircle, Clock, RefreshCw, Trash2, Search,
  Filter, Download, Activity, TrendingUp, Eye, EyeOff,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function WebhookActivity() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "success" | "failed" | "pending">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Fetch webhook logs
  const logsQuery = trpc.webhooks.getLogs.useQuery({ limit: 100 });
  const retryMutation = trpc.webhooks.retryDelivery.useMutation();

  // Sample webhook logs data
  const webhookLogs = [
    {
      id: 1,
      webhookName: "Affiliate Sync",
      event: "new_lead",
      status: "success",
      statusCode: 200,
      attempt: 1,
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
      response: '{"status":"received","leadId":"12345"}',
      error: null,
    },
    {
      id: 2,
      webhookName: "Deep Sleep Reset",
      event: "new_order",
      status: "success",
      statusCode: 200,
      attempt: 1,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      response: '{"orderId":"DSR-2026-0512"}',
      error: null,
    },
    {
      id: 3,
      webhookName: "CRM Integration",
      event: "new_lead",
      status: "retrying",
      statusCode: 500,
      attempt: 2,
      timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
      response: null,
      error: "Internal Server Error",
      nextRetryAt: new Date(Date.now() + 5 * 60000).toISOString(),
    },
    {
      id: 4,
      webhookName: "Email Notification",
      event: "quiz_completed",
      status: "success",
      statusCode: 200,
      attempt: 1,
      timestamp: new Date(Date.now() - 1 * 60000).toISOString(),
      response: '{"emailId":"email_abc123"}',
      error: null,
    },
    {
      id: 5,
      webhookName: "Analytics Tracker",
      event: "new_lead",
      status: "failed",
      statusCode: 0,
      attempt: 3,
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
      response: null,
      error: "Connection timeout after 3 retries",
    },
  ];

  // Filter logs
  const filteredLogs = webhookLogs.filter((log) => {
    if (filter !== "all" && log.status !== filter) return false;
    if (searchTerm && !log.webhookName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case "retrying":
        return <Clock className="w-5 h-5 text-amber-600" />;
      case "pending":
        return <Activity className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "retrying":
        return <Badge className="bg-amber-100 text-amber-800">Retrying</Badge>;
      case "pending":
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return null;
    }
  };

  const handleRetry = async (logId: number) => {
    try {
      await retryMutation.mutateAsync({ logId });
      // Refetch logs
      logsQuery.refetch();
    } catch (error) {
      console.error("Failed to retry webhook:", error);
    }
  };

  // Statistics
  const stats = {
    total: webhookLogs.length,
    success: webhookLogs.filter((l) => l.status === "success").length,
    failed: webhookLogs.filter((l) => l.status === "failed").length,
    retrying: webhookLogs.filter((l) => l.status === "retrying").length,
    successRate: ((webhookLogs.filter((l) => l.status === "success").length / webhookLogs.length) * 100).toFixed(1),
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Webhook className="w-8 h-8 text-teal-600" />
              Webhook Activity
            </h1>
            <p className="text-muted-foreground mt-1">Real-time delivery logs and retry management</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Logs
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Successful</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Retrying</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.retrying}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Logs</CardTitle>
            <CardDescription>Filter and search webhook delivery attempts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filter Bar */}
            <div className="flex gap-2 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search webhook name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-1">
                {(["all", "success", "failed", "pending", "retrying"] as const).map((status) => (
                  <Button
                    key={status}
                    variant={filter === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(status)}
                    className="text-xs capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webhook</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP Code</TableHead>
                    <TableHead>Attempt</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium">{log.webhookName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.event}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            {getStatusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                            {log.statusCode || "—"}
                          </code>
                        </TableCell>
                        <TableCell>{log.attempt}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                              className="text-xs"
                            >
                              {expandedLog === log.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </Button>
                            {(log.status === "failed" || log.status === "retrying") && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRetry(log.id)}
                                className="text-xs text-blue-600 hover:text-blue-700"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No webhook logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Expanded Log Details */}
            {expandedLog !== null && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg border">
                {(() => {
                  const log = webhookLogs.find((l) => l.id === expandedLog);
                  if (!log) return null;

                  return (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Response</p>
                        <pre className="bg-card p-3 rounded border text-xs overflow-x-auto mt-1">
                          {log.response || "No response"}
                        </pre>
                      </div>
                      {log.error && (
                        <div>
                          <p className="text-sm font-medium text-red-600">Error</p>
                          <p className="bg-card p-3 rounded border text-xs mt-1">{log.error}</p>
                        </div>
                      )}
                      {log.nextRetryAt && (
                        <div>
                          <p className="text-sm font-medium text-amber-600">Next Retry</p>
                          <p className="text-xs mt-1">{new Date(log.nextRetryAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Webhook Health Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Webhook Health Summary</CardTitle>
            <CardDescription>Performance by webhook endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Affiliate Sync", "Deep Sleep Reset", "CRM Integration", "Email Notification", "Analytics Tracker"].map((name, idx) => {
                const webhookLogs_ = webhookLogs.filter((l) => l.webhookName === name);
                const successCount = webhookLogs_.filter((l) => l.status === "success").length;
                const successRate = webhookLogs_.length > 0 ? ((successCount / webhookLogs_.length) * 100).toFixed(0) : 0;

                return (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{webhookLogs_.length} deliveries</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-32 bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{successRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
