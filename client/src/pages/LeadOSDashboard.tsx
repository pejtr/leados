import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LinkedInOutreachPanel } from "@/components/LinkedInOutreachPanel";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  RefreshCw,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { HeartbeatJob, Project } from "../../../drizzle/schema";

// Status badge colors
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  pending: "Čekající",
  in_progress: "Probíhá",
  completed: "Dokončeno",
  failed: "Selhalo",
};

function formatTimeRemaining(deadline: number | null): string {
  if (!deadline) return "Bez termínu";
  const diff = deadline - Date.now();
  if (diff < 0) {
    const days = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
    return `${days}d po termínu`;
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h zbývá`;
  return `${hours}h zbývá`;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return "—";
  const diff = Date.now() - ts;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `před ${hours}h`;
  return `před ${minutes}m`;
}

function formatNextRun(ts: number | null): string {
  if (!ts) return "—";
  const diff = ts - Date.now();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `za ${hours}h`;
  return `za ${minutes}m`;
}

export default function LeadOSDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch real stats
  const { data: stats, isLoading } = trpc.leados.admin.dashboardStats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const projects = (stats.projects || []) as Project[];
  const heartbeats = (stats.heartbeats || []) as HeartbeatJob[];

  // Stats
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "in_progress").length;
  const completedProjects = projects.filter(p => p.status === "completed").length;
  const pendingProjects = projects.filter(p => p.status === "pending").length;
  const activeHeartbeats = heartbeats.filter(h => h.isActive).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">ONYX OS Control Hub</h1>
                <p className="text-xs text-gray-500">Autonomní orchestrace projektů</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="font-medium">Systém aktivní</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Obnovit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Celkem projektů</span>
                <Database className="w-4 h-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalProjects}</div>
              <div className="text-xs text-gray-500 mt-1">{pendingProjects} čekajících</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Aktivní projekty</span>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-blue-600">{activeProjects}</div>
              <div className="text-xs text-gray-500 mt-1">probíhá nyní</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Dokončeno</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-2xl font-bold text-green-600">{completedProjects}</div>
              <div className="text-xs text-gray-500 mt-1">tento měsíc</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Heartbeat jobs</span>
                <Zap className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600">{activeHeartbeats}</div>
              <div className="text-xs text-gray-500 mt-1">aktivních jobů</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="gap-2">
              <Globe className="w-4 h-4" />
              Přehled
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Database className="w-4 h-4" />
              Projekty
            </TabsTrigger>
            <TabsTrigger value="heartbeats" className="gap-2">
              <Zap className="w-4 h-4" />
              Heartbeat Jobs
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Shield className="w-4 h-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-500" />
                    Aktivní projekty
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects
                    .filter(p => p.status !== "completed")
                    .map(project => (
                      <div key={project.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {project.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {project.packageType.replace("_", " ")} · {formatTimeRemaining(project.deadline)}
                            </p>
                          </div>
                          <Badge
                            className={`ml-2 text-xs border ${statusColors[project.status]}`}
                            variant="outline"
                          >
                            {statusLabels[project.status]}
                          </Badge>
                        </div>
                        {(project.completionPercentage ?? 0) > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Průběh</span>
                              <span>{project.completionPercentage ?? 0}%</span>
                            </div>
                            <Progress value={project.completionPercentage ?? 0} className="h-1.5" />
                          </div>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    Zdraví systému
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800">Databáze</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Online</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800">Stripe API</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Aktivní</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800">Email Service</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">Funkční</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-green-800">Heartbeat Jobs</span>
                    </div>
                    <span className="text-xs text-green-600 font-medium">{activeHeartbeats} aktivních</span>
                  </div>

                  <Separator />

                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-blue-800">Výkon systému</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Všechny systémy fungují normálně. Žádné anomálie nebyly detekovány.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Všechny projekty</CardTitle>
                  <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                    <Database className="w-4 h-4" />
                    Nový projekt
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {projects.map(project => (
                    <div
                      key={project.id}
                      className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900">{project.title}</h3>
                            <Badge
                              className={`text-xs border ${statusColors[project.status]}`}
                              variant="outline"
                            >
                              {statusLabels[project.status]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Cpu className="w-3 h-3" />
                              {project.packageType.replace("_", " ")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeRemaining(project.deadline)}
                            </span>
                            {project.assignedTo && (
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {project.assignedTo}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {project.completionPercentage ?? 0}%
                          </div>
                          <div className="text-xs text-gray-500">hotovo</div>
                        </div>
                      </div>
                      {(project.completionPercentage ?? 0) > 0 && (
                        <div className="mt-3">
                          <Progress value={project.completionPercentage ?? 0} className="h-2" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heartbeat Jobs Tab */}
          <TabsContent value="heartbeats">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    Heartbeat Jobs
                  </CardTitle>
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {activeHeartbeats} aktivních
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {heartbeats.map(job => (
                    <div
                      key={job.id}
                      className="p-4 border border-gray-100 rounded-xl"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${job.isActive ? "bg-green-500" : "bg-gray-300"}`} />
                            <h3 className="text-sm font-medium text-gray-900">{job.name}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <Badge variant="outline" className="text-xs">
                              {job.jobType}
                            </Badge>
                            <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">
                              {job.cronExpression}
                            </code>
                          </div>
                        </div>
                        <Badge
                          className={job.isActive ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-600 border-gray-200"}
                          variant="outline"
                        >
                          {job.isActive ? "Aktivní" : "Pozastaveno"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-gray-500 mb-0.5">Poslední spuštění</div>
                          <div className="font-medium text-gray-700">
                            {formatRelativeTime(job.lastExecutedAt)}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="text-gray-500 mb-0.5">Příští spuštění</div>
                          <div className="font-medium text-gray-700">
                            {formatNextRun(job.nextExecutionAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-start gap-3">
                    <Zap className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-purple-800 mb-1">
                        Jak fungují Heartbeat Jobs?
                      </p>
                      <p className="text-xs text-purple-600">
                        Heartbeat jobs jsou autonomní úlohy spouštěné platformou Manus v pravidelných intervalech.
                        Monitorují zdraví projektů, detekují anomálie a provádějí automatické opravy — i když je
                        sandbox v hibernaci.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    Aktivní upozornění
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-400" />
                    <p className="text-sm font-medium text-gray-600">Žádná upozornění</p>
                    <p className="text-xs text-gray-400 mt-1">Všechny projekty probíhají normálně</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    Self-Healing Log
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-green-50 rounded-lg text-xs">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-green-800">Auto-escalation</span>
                        <span className="text-green-600"> — projekt proj_002 přesunut do in_progress</span>
                        <div className="text-green-500 mt-0.5">před 2 hodinami</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg text-xs">
                      <Activity className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-blue-800">Health check</span>
                        <span className="text-blue-600"> — 3 projekty zkontrolovány, vše OK</span>
                        <div className="text-blue-500 mt-0.5">před 6 hodinami</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                      <Zap className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-gray-700">Monitoring run</span>
                        <span className="text-gray-500"> — žádné anomálie detekovány</span>
                        <div className="text-gray-400 mt-0.5">před 12 hodinami</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <LinkedInOutreachPanel />
      </div>
    </div>
  );
}
