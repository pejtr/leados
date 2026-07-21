import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Radio,
  Layers,
  Brain,
  LineChart,
  Workflow,
  Blocks,
  Globe,
  Bot,
  Zap,
  Sparkles,
  BarChart3,
  Webhook,
  Database,
  Telescope,
} from "lucide-react";

const MODULE_ICONS: Record<string, typeof Radio> = {
  hub: Radio,
  cms: Globe,
  seo: Telescope,
  affiliate: Zap,
  marketplace: Blocks,
  "ai-assistants": Brain,
  leadgen: Bot,
  analytics: BarChart3,
  automation: Workflow,
  integrations: Webhook,
  "telegram-bridge": Zap,
  "data-harmonizer": Database,
};

function OmnicoreHubPage() {
  const { user } = useAuth();
  const { data: info, isLoading: infoLoading } = trpc.omnicore.info.useQuery();
  const { data: modules, isLoading: modulesLoading } = trpc.omnicore.modules.useQuery();
  const { data: hubStatus } = trpc.omnicore.hubStatus.useQuery();

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 p-6">
        <div className="space-y-2">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
            <Sparkles className="h-8 w-8 text-indigo-400" />
            OMNICORE
          </h1>
          {infoLoading ? (
            <Skeleton className="h-5 w-96 bg-white/5" />
          ) : (
            <p className="text-sm text-slate-400">{info?.tagline}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
                Active Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-emerald-400">
                {infoLoading ? "…" : info?.activeModules ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
                Total Modules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-white">
                {infoLoading ? "…" : info?.totalModules ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
                Planned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-400">
                {infoLoading ? "…" : info?.plannedModules ?? 0}
              </p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-slate-400">
                Provenance Entries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-indigo-400">
                {hubStatus?.provenance?.totalEntries ?? 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-white">Module Registry</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modulesLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <Skeleton className="mb-2 h-5 w-32 bg-white/10" />
                    <Skeleton className="h-4 w-full bg-white/5" />
                  </div>
                ))
              : modules?.map((mod) => {
                  const Icon = MODULE_ICONS[mod.id] ?? Layers;
                  return (
                    <div
                      key={mod.id}
                      className="group rounded-lg border border-white/10 bg-white/5 p-4 transition hover:border-indigo-500/50 hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 text-indigo-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">
                              {mod.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={`border-0 px-1.5 py-0 text-[10px] ${
                                mod.status === "active"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-slate-500/20 text-slate-400"
                              }`}
                            >
                              {mod.status}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {mod.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default OmnicoreHubPage;
