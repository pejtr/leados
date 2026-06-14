import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, Download, ChevronDown, ChevronUp, Target, Calendar, Brain, LayoutDashboard, Sparkles, TrendingUp, Wallet, ArrowRight, FolderKanban } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { TechSupportWidget } from "@/components/TechSupportWidget";
import { OptivioLogo } from "@/components/OptivioLogo";

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 10) return "Dobré ráno";
  if (h < 18) return "Dobrý den";
  return "Dobrý večer";
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  const { data: projects, isLoading: projectsLoading } = trpc.projects.myProjects.useQuery();
  const { data: payments } = trpc.payments.listByUser.useQuery();
  const { data: brief } = trpc.dashboard.nowBrief.useQuery();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Přihlaste se</h2>
            <p className="text-slate-600 mb-4">Pro zobrazení vašich projektů se musíte přihlásit.</p>
            <Button className="w-full bg-violet-600 hover:bg-violet-700">Přihlásit se</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getOrderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending:      { label: "Čekající",         className: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="w-3 h-3" /> },
      deposit_paid: { label: "Záloha zaplacena", className: "bg-blue-100 text-blue-800 border-blue-200",       icon: <CheckCircle className="w-3 h-3" /> },
      completed:    { label: "Hotovo",            className: "bg-green-100 text-green-800 border-green-200",    icon: <CheckCircle className="w-3 h-3" /> },
      cancelled:    { label: "Zrušeno",           className: "bg-red-100 text-red-800 border-red-200",          icon: <AlertCircle className="w-3 h-3" /> },
    };
    const cfg = map[status] ?? map.pending;
    return <Badge className={`${cfg.className} border flex items-center gap-1 font-medium`}>{cfg.icon}{cfg.label}</Badge>;
  };

  const getProjectStatusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      pending:     { label: "Příprava",    className: "bg-slate-100 text-slate-700 border-slate-200" },
      in_progress: { label: "Ve výrobě",   className: "bg-blue-100 text-blue-800 border-blue-200" },
      completed:   { label: "Dokončeno",   className: "bg-green-100 text-green-800 border-green-200" },
      failed:      { label: "Pozastaveno", className: "bg-red-100 text-red-800 border-red-200" },
    };
    const cfg = map[status] ?? map.pending;
    return <Badge className={`${cfg.className} border font-medium`}>{cfg.label}</Badge>;
  };

  const getMilestoneIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />;
    if (status === "in_progress") return <Clock className="w-4 h-4 text-blue-500 shrink-0" />;
    return <div className="w-4 h-4 rounded-full border-2 border-slate-300 shrink-0" />;
  };

  const formatPrice = (price: number) => `${(price / 100).toLocaleString("cs-CZ")} Kč`;

  const formatPackageName = (pkg: string) => {
    const names: Record<string, string> = {
      lite: "Lite Web", basic: "Basic Web",
      lead_gen: "Web + Lead Gen", automation: "Web + Automatizace",
    };
    return names[pkg] ?? pkg;
  };

  // Progress steps based on order status + project status
  const getProgressSteps = (orderStatus: string, projectStatus?: string, pct?: number) => {
    const steps = [
      { label: "Objednávka přijata",  done: true },
      { label: "Záloha zaplacena",    done: orderStatus !== "pending" },
      { label: "Ve výrobě",           done: projectStatus === "in_progress" || projectStatus === "completed" || (pct ?? 0) > 0 },
      { label: "Kontrola klienta",    done: (pct ?? 0) >= 90 || projectStatus === "completed" },
      { label: "Projekt dokončen",    done: orderStatus === "completed" || projectStatus === "completed" },
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" aria-label="OPTIVIO" className="hover:opacity-80 transition-opacity"><OptivioLogo className="h-7" /></a>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <LayoutDashboard className="w-4 h-4 text-violet-600" /> ADMIN
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="/agents" className="text-xs text-violet-600 hover:text-violet-800 font-medium flex items-center gap-1">
              <Brain className="w-3.5 h-3.5" /> AI Asistenti
            </a>
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium text-slate-900">{user.name || user.email}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Now Brief — přehled dne ── */}
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-violet-600 via-violet-700 to-indigo-800 text-white p-6 md:p-8 shadow-lg shadow-violet-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 text-violet-200 text-xs font-medium mb-2">
              <Sparkles className="w-4 h-4" />
              <span>{new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-1">
              {greetingForNow()}, {brief?.firstName || (user.name || "").split(" ")[0] || "vítejte"}!
            </h2>
            <p className="text-violet-100/80 text-sm mb-6">Tady je váš dnešní přehled.</p>

            {/* Metric chips */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-violet-200 text-xs mb-1"><FolderKanban className="w-3.5 h-3.5" /> Projekty</div>
                <div className="text-2xl font-bold">{brief?.counts.projects ?? 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-violet-200 text-xs mb-1"><Clock className="w-3.5 h-3.5" /> Ve výrobě</div>
                <div className="text-2xl font-bold">{brief?.counts.inProgress ?? 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-violet-200 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" /> Dokončeno</div>
                <div className="text-2xl font-bold">{brief?.counts.completed ?? 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
                <div className="flex items-center gap-1.5 text-violet-200 text-xs mb-1"><Wallet className="w-3.5 h-3.5" /> Doplatek</div>
                <div className="text-2xl font-bold">{((brief?.outstanding ?? 0)).toLocaleString("cs-CZ")} Kč</div>
              </div>
            </div>

            {/* Active project progress */}
            {brief?.activeProject && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-violet-200" /> {brief.activeProject.title}</span>
                  <span className="text-sm font-bold">{brief.activeProject.completionPercentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-300 to-white rounded-full transition-all" style={{ width: `${brief.activeProject.completionPercentage}%` }} />
                </div>
              </div>
            )}

            {/* Recommended action */}
            {brief?.recommendedAction && (
              <div className="flex items-start gap-3 bg-white text-slate-800 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide mb-0.5">Doporučení na dnešek</p>
                  <p className="text-sm text-slate-700">{brief.recommendedAction}</p>
                </div>
                {brief.nextMilestone && (
                  <a href="#projekty" className="hidden md:flex items-center self-center text-violet-600 hover:text-violet-800">
                    <ArrowRight className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary cards */}
        {projects && projects.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Celkem projektů</p>
                <p className="text-2xl font-bold text-slate-900">{projects.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Dokončeno</p>
                <p className="text-2xl font-bold text-green-600">{projects.filter(p => p.status === "completed").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Ve výrobě</p>
                <p className="text-2xl font-bold text-blue-600">{projects.filter(p => p.status === "in_progress").length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Celkem zaplaceno</p>
                <p className="text-2xl font-bold text-violet-600">
                  {formatPrice(payments?.filter(p => p.status === "succeeded").reduce((s, p) => s + p.amount, 0) ?? 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="projects">
          <TabsList className="mb-6">
            <TabsTrigger value="projects">Projekty</TabsTrigger>
            <TabsTrigger value="payments">Platby</TabsTrigger>
          </TabsList>

          {/* ── Projects Tab ── */}
          <TabsContent value="projects" className="space-y-4">
            {projectsLoading ? (
              <Card><CardContent className="p-10 text-center text-slate-500">Načítám projekty...</CardContent></Card>
            ) : projects && projects.length > 0 ? (
              projects.map((project) => {
                const pct = project.completionPercentage ?? 0;
                const steps = getProgressSteps(project.order?.status ?? "pending", project.status, pct);
                const isExpanded = expandedProject === project.id;
                const daysLeft = project.deadline
                  ? Math.ceil((project.deadline - Date.now()) / (1000 * 60 * 60 * 24))
                  : null;

                return (
                  <Card key={project.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg">{project.title}</CardTitle>
                          <CardDescription className="mt-0.5">
                            {formatPackageName(project.packageType)} · Objednávka #{project.orderId}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {getProjectStatusBadge(project.status)}
                          {project.order && getOrderStatusBadge(project.order.status)}
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-5">
                      {/* Progress bar */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Postup projektu</span>
                          <span className="text-sm font-bold text-violet-600">{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>

                      {/* Step timeline */}
                      <div className="flex items-center gap-0">
                        {steps.map((step, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10
                              ${step.done ? "bg-violet-600 text-white" : "bg-slate-200 text-slate-400"}`}>
                              {step.done ? "✓" : i + 1}
                            </div>
                            {i < steps.length - 1 && (
                              <div className={`absolute h-0.5 w-full mt-3 ${step.done ? "bg-violet-300" : "bg-slate-200"}`} />
                            )}
                            <span className="text-xs text-slate-500 text-center mt-1 leading-tight hidden md:block">{step.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Price + deadline row */}
                      <div className="flex flex-wrap gap-4 text-sm">
                        {project.order && (
                          <>
                            <div>
                              <span className="text-slate-500">Cena:</span>
                              <span className="ml-1 font-semibold">{formatPrice(project.order.totalPrice)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Záloha:</span>
                              <span className="ml-1 font-semibold text-blue-600">{formatPrice(project.order.depositAmount)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Zbývá:</span>
                              <span className="ml-1 font-semibold">{formatPrice(project.order.remainingAmount)}</span>
                            </div>
                          </>
                        )}
                        {daysLeft !== null && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500">Termín:</span>
                            <span className={`ml-1 font-semibold ${daysLeft < 0 ? "text-red-600" : daysLeft < 7 ? "text-orange-500" : "text-slate-700"}`}>
                              {daysLeft < 0 ? `Překročen o ${Math.abs(daysLeft)} dní` : `za ${daysLeft} dní`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Milestones (expandable) */}
                      {project.milestones && project.milestones.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedProject(isExpanded ? null : project.id)}
                            className="flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-700"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            Milníky projektu ({project.milestones.filter(m => m.status === "completed").length}/{project.milestones.length})
                          </button>

                          {isExpanded && (
                            <div className="mt-3 space-y-2 pl-2 border-l-2 border-violet-100">
                              {project.milestones.map((m) => (
                                <div key={m.id} className={`flex items-start gap-3 p-2 rounded-md ${
                                  m.status === "completed" ? "bg-green-50" :
                                  m.status === "in_progress" ? "bg-blue-50" : "bg-white"}`}>
                                  {getMilestoneIcon(m.status)}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${m.status === "completed" ? "line-through text-slate-400" : "text-slate-800"}`}>
                                      {m.title}
                                    </p>
                                    {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                                    {m.dueDate && (
                                      <p className="text-xs text-slate-400 mt-0.5">
                                        Termín: {new Date(m.dueDate).toLocaleDateString("cs-CZ")}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA for pending payment */}
                      {project.order?.status === "pending" && (
                        <div className="pt-2 border-t">
                          <Button className="bg-violet-600 hover:bg-violet-700 w-full md:w-auto">
                            Zaplatit zálohu {project.order && formatPrice(project.order.depositAmount)}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card>
                <CardContent className="p-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-violet-50 flex items-center justify-center mx-auto mb-3">
                    <Target className="w-7 h-7 text-violet-400" />
                  </div>
                  <p className="text-slate-600 mb-4">Zatím nemáte žádné projekty.</p>
                  <Button variant="outline" onClick={() => window.location.href = "/#contact"}>Objednat web</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Payments Tab ── */}
          <TabsContent value="payments" className="space-y-4">
            {payments && payments.length > 0 ? (
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Datum</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Typ</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Částka</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stav</th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Doklad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-600">
                            {new Date(payment.createdAt).toLocaleDateString("cs-CZ")}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-700">
                            {payment.type === "deposit" ? "Záloha" : payment.type === "final" ? "Finální platba" : "Vrácení"}
                          </td>
                          <td className="py-3 px-4 text-sm font-semibold text-slate-900">{formatPrice(payment.amount)}</td>
                          <td className="py-3 px-4">
                            {payment.status === "succeeded" && <Badge className="bg-green-100 text-green-700 border border-green-200">Zaplaceno</Badge>}
                            {payment.status === "pending"   && <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">Čekající</Badge>}
                            {payment.status === "failed"    && <Badge className="bg-red-100 text-red-700 border border-red-200">Selhalo</Badge>}
                            {payment.status === "refunded"  && <Badge className="bg-slate-100 text-slate-700 border border-slate-200">Vráceno</Badge>}
                          </td>
                          <td className="py-3 px-4">
                            {payment.invoiceUrl && (
                              <a href={payment.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" className="gap-1 text-violet-600 hover:text-violet-700">
                                  <Download className="w-3.5 h-3.5" />Faktura
                                </Button>
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-10 text-center text-slate-500">Žádné platby</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <TechSupportWidget />
    </div>
  );
}
