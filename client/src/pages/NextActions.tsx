import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb, CheckCircle2, XCircle, Loader2, Phone, Mail, Linkedin,
  ThumbsUp, ThumbsDown, Clock, Sparkles, ArrowRight, Zap,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

const actionIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  linkedin: Linkedin,
  qualify: ThumbsUp,
  disqualify: ThumbsDown,
  wait: Clock,
};

const actionColors: Record<string, string> = {
  call: "bg-blue-500/10 text-blue-500",
  email: "bg-green-500/10 text-green-500",
  linkedin: "bg-indigo-500/10 text-indigo-500",
  qualify: "bg-emerald-500/10 text-emerald-500",
  disqualify: "bg-red-500/10 text-red-500",
  wait: "bg-yellow-500/10 text-yellow-500",
};

export default function NextActions() {
  const [tab, setTab] = useState("pending");
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const statusFilter = tab === "all" ? undefined : tab;
  const { data: recommendations = [], isLoading } = trpc.nba.list.useQuery(
    { status: statusFilter, limit: 50 }
  );

  // Get some leads for generating recommendations
  const { data: leadsData } = trpc.leads.list.useQuery(
    { limit: 20, status: "new" }
  );

  const leads = useMemo(() => leadsData?.items ?? [], [leadsData]);

  const generateMut = trpc.nba.generate.useMutation({
    onSuccess: (data) => {
      toast.success(`Generated ${data.count} recommendations!`);
      utils.nba.list.invalidate();
      setSelectedLeadIds([]);
    },
    onError: (e) => toast.error(e.message),
  });

  const actionMut = trpc.nba.action.useMutation({
    onSuccess: () => {
      toast.success("Action marked as done");
      utils.nba.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const dismissMut = trpc.nba.dismiss.useMutation({
    onSuccess: () => {
      toast.info("Recommendation dismissed");
      utils.nba.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerateAll = () => {
    if (leads.length === 0) {
      toast.error("No leads available. Generate some leads first.");
      return;
    }
    const ids = leads.slice(0, 20).map((l: any) => l.id);
    setSelectedLeadIds(ids);
    generateMut.mutate({ leadIds: ids });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Lightbulb className="h-6 w-6 text-primary" />
              Next Best Action
            </h1>
            <p className="text-muted-foreground mt-1">
              AI-powered recommendations for your next move on each lead.
            </p>
          </div>
          <Button
            onClick={handleGenerateAll}
            disabled={generateMut.isPending || leads.length === 0}
          >
            {generateMut.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Analyze Leads
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="actioned">Actioned</TabsTrigger>
            <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recommendations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">
                    {tab === "pending" ? "No pending recommendations" : `No ${tab} recommendations`}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Click "Analyze Leads" to get AI-powered next best action recommendations.
                  </p>
                  {tab === "pending" && leads.length > 0 && (
                    <Button onClick={handleGenerateAll} disabled={generateMut.isPending}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyze {Math.min(leads.length, 20)} Leads
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {recommendations.map((rec: any) => {
                  const ActionIcon = actionIcons[rec.action] || Zap;
                  const colorClass = actionColors[rec.action] || "bg-muted text-muted-foreground";
                  return (
                    <Card key={rec.id}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className={`p-2.5 rounded-lg shrink-0 ${colorClass}`}>
                          <ActionIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm capitalize">{rec.action}</span>
                            <Badge variant="outline" className="text-xs">
                              Priority: {rec.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              AI Score: {rec.aiScore}
                            </Badge>
                            {rec.status !== "pending" && (
                              <Badge variant={rec.status === "actioned" ? "default" : "secondary"} className="text-xs capitalize">
                                {rec.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rec.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Lead #{rec.leadId} &middot; {new Date(rec.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {rec.status === "pending" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => actionMut.mutate({ id: rec.id })}
                              disabled={actionMut.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Done
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismissMut.mutate({ id: rec.id })}
                              disabled={dismissMut.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
