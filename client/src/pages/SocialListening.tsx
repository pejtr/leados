import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ear, Plus, Trash2, Loader2, Radio, Hash, Globe, ArrowRight,
  TrendingUp, MessageCircle, UserPlus, ExternalLink,
  Search, Star, AlertTriangle, DollarSign, Target, Zap, CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const platformIcons: Record<string, typeof Globe> = {
  linkedin: Globe,
  twitter: MessageCircle,
  reddit: Hash,
  news: Radio,
};

const sentimentColors: Record<string, string> = {
  positive: "bg-green-500/10 text-green-500",
  negative: "bg-red-500/10 text-red-500",
  neutral: "bg-muted text-muted-foreground",
};

export default function SocialListening() {
  const [open, setOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "",
    keywords: "",
    platforms: "linkedin",
  });

  const utils = trpc.useUtils();
  const { data: monitors = [], isLoading } = trpc.social.monitors.useQuery();
  const { data: allSignals = [] } = trpc.social.allSignals.useQuery({ limit: 50 });
  const { data: monitorSignals = [] } = trpc.social.signals.useQuery(
    { monitorId: selectedMonitor!, limit: 50 },
    { enabled: !!selectedMonitor }
  );

  const createMut = trpc.social.createMonitor.useMutation({
    onSuccess: () => {
      toast.success("Monitor created");
      utils.social.monitors.invalidate();
      setOpen(false);
      setForm({ name: "", keywords: "", platforms: "linkedin" });
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleMut = trpc.social.updateMonitor.useMutation({
    onSuccess: () => utils.social.monitors.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.social.deleteMonitor.useMutation({
    onSuccess: () => {
      toast.success("Monitor deleted");
      utils.social.monitors.invalidate();
      if (selectedMonitor) setSelectedMonitor(null);
    },
    onError: (e) => toast.error(e.message),
  });

  const convertMut = trpc.social.convertToLead.useMutation({
    onSuccess: () => {
      toast.success("Signal converted to lead!");
      utils.social.allSignals.invalidate();
      if (selectedMonitor) utils.social.signals.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const signals = selectedMonitor ? monitorSignals : allSignals;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Ear className="h-6 w-6 text-primary" />
              Social Listening
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor social platforms for buying signals and lead opportunities.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Monitor</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Social Monitor</DialogTitle>
                <DialogDescription>Track keywords across social platforms to find leads.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label>Monitor Name</Label>
                  <Input placeholder="e.g. SaaS Buying Signals" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div>
                  <Label>Keywords</Label>
                  <Input placeholder="e.g. looking for CRM, need automation tool" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated keywords or phrases to track</p>
                </div>
                <div>
                  <Label>Platforms</Label>
                  <Input placeholder="e.g. linkedin, twitter, reddit" value={form.platforms} onChange={(e) => setForm({ ...form, platforms: e.target.value })} />
                  <p className="text-xs text-muted-foreground mt-1">Comma-separated platform names</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button
                  disabled={!form.name || !form.keywords || createMut.isPending}
                  onClick={() => createMut.mutate(form)}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                  Create Monitor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="monitors">
          <TabsList>
            <TabsTrigger value="monitors" className="gap-2">
              <Radio className="h-4 w-4" />
              Monitors
            </TabsTrigger>
            <TabsTrigger value="signals" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Signals Feed
            </TabsTrigger>
            <TabsTrigger value="intent-mining" className="gap-2">
              <Target className="h-4 w-4" />
              Intent Mining
            </TabsTrigger>
          </TabsList>

          {/* Monitors Tab */}
          <TabsContent value="monitors" className="mt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : monitors.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <Ear className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No monitors yet</h3>
                  <p className="text-muted-foreground mb-4">Create a monitor to track keywords and find buying signals.</p>
                  <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create Monitor</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {monitors.map((monitor: any) => (
                  <Card key={monitor.id} className={!monitor.isActive ? "opacity-60" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg">{monitor.name}</CardTitle>
                          <Badge variant={monitor.isActive ? "default" : "secondary"}>
                            {monitor.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedMonitor(monitor.id)}
                          >
                            View Signals
                          </Button>
                          <Switch
                            checked={monitor.isActive}
                            onCheckedChange={(v) => toggleMut.mutate({ id: monitor.id, isActive: v })}
                          />
                          <Button variant="ghost" size="icon" onClick={() => deleteMut.mutate({ id: monitor.id })} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Hash className="h-3.5 w-3.5" />
                          {monitor.keywords}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {monitor.platforms}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {monitor.signalCount || 0} signals
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Signals Feed Tab */}
          <TabsContent value="signals" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      {selectedMonitor ? "Monitor Signals" : "All Signals"}
                    </CardTitle>
                    <CardDescription>
                      {selectedMonitor
                        ? "Signals from selected monitor"
                        : "Recent buying signals across all monitors"}
                    </CardDescription>
                  </div>
                  {selectedMonitor && (
                    <Button variant="outline" size="sm" onClick={() => setSelectedMonitor(null)}>
                      Show All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {signals.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No signals detected yet</p>
                    <p className="text-xs mt-1">Signals will appear here as monitors detect buying intent</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {signals.map((signal: any) => {
                      const PlatformIcon = platformIcons[signal.platform] || Globe;
                      const sentimentClass = sentimentColors[signal.sentiment] || sentimentColors.neutral;
                      return (
                        <div key={signal.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                          <div className={`p-2 rounded-lg shrink-0 ${sentimentClass}`}>
                            <PlatformIcon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {signal.authorName && (
                                <span className="font-medium text-sm">{signal.authorName}</span>
                              )}
                              <Badge variant="outline" className="text-xs capitalize">{signal.platform}</Badge>
                              <Badge className={`text-xs ${sentimentClass}`}>{signal.sentiment}</Badge>
                              {signal.intentScore && (
                                <Badge variant="secondary" className="text-xs">
                                  Intent: {signal.intentScore}%
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{signal.content}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(signal.createdAt).toLocaleDateString()}
                              </span>
                              {signal.sourceUrl && (
                                <a href={signal.sourceUrl} target="_blank" rel="noopener" className="text-xs text-primary flex items-center gap-1">
                                  Source <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                              {!signal.convertedToLead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 text-xs"
                                  onClick={() => convertMut.mutate({ signalId: signal.id })}
                                  disabled={convertMut.isPending}
                                >
                                  <UserPlus className="h-3 w-3 mr-1" />
                                  Convert to Lead
                                </Button>
                              )}
                              {signal.convertedToLead && (
                                <Badge variant="default" className="text-xs">
                                  Converted
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intent Mining Tab */}
          <TabsContent value="intent-mining" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-5 w-5 text-orange-500" />
                  Intent Mining — Review & Complaint Analysis
                </CardTitle>
                <CardDescription>
                  Find prospects actively complaining about competitor tools on G2, Capterra, Reddit, and LinkedIn.
                  These are your highest-intent leads — they’re already looking for an alternative.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {([
                    { icon: Star, color: "text-yellow-500", bg: "bg-yellow-50", title: "G2 / Capterra Reviews", desc: "1-2 star reviews of HubSpot, Apollo, Salesforce", count: 142, signal: "Switching intent" },
                    { icon: MessageCircle, color: "text-blue-500", bg: "bg-blue-50", title: "Reddit Complaints", desc: "/r/sales, /r/entrepreneur — 'looking for alternative'", count: 89, signal: "Research phase" },
                    { icon: AlertTriangle, color: "text-red-500", bg: "bg-red-50", title: "LinkedIn Pain Posts", desc: "Posts about CRM frustration, manual prospecting", count: 67, signal: "High frustration" },
                    { icon: DollarSign, color: "text-green-500", bg: "bg-green-50", title: "Pricing Complaints", desc: "'Too expensive', 'price increase', 'cancelling'", count: 54, signal: "Budget pressure" },
                    { icon: Zap, color: "text-purple-500", bg: "bg-purple-50", title: "Job Change Signals", desc: "New VP Sales / Head of Growth hired", count: 38, signal: "New budget cycle" },
                    { icon: Search, color: "text-teal-500", bg: "bg-teal-50", title: "Competitor Mentions", desc: "'vs LeadOS', 'LeadOS alternative', 'LeadOS review'", count: 23, signal: "Active evaluation" },
                  ] as const).map(({ icon: Icon, color, bg, title, desc, count, signal }) => (
                    <div key={title} className="p-4 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <Badge variant="outline" className="text-xs">{count} leads</Badge>
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-orange-600">{signal}</span>
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2" onClick={() => {}}>Mine <ArrowRight className="h-3 w-3 ml-1" /></Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Sample High-Intent Leads Detected
                  </h3>
                  <div className="space-y-2">
                    {[
                      { name: "Tomáš Procházka", title: "VP Sales", company: "DataFlow s.r.o.", source: "G2 Review", quote: "HubSpot is way too expensive for our team size. Looking for alternatives.", score: 96, intent: "Switching" },
                      { name: "Jana Kovářová", title: "Head of Growth", company: "ScaleUp Praha", source: "Reddit r/sales", quote: "Manual prospecting is killing us. Need something automated for DACH market.", score: 92, intent: "Research" },
                      { name: "Michal Blažek", title: "CEO", company: "B2B Connect", source: "LinkedIn Post", quote: "Just cancelled Apollo. The data quality for Czech companies is terrible.", score: 89, intent: "Cancelled competitor" },
                    ].map(lead => (
                      <div key={lead.name} className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {lead.name.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-sm">{lead.name}</span>
                            <span className="text-xs text-muted-foreground">{lead.title} @ {lead.company}</span>
                            <Badge variant="outline" className="text-xs">{lead.source}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 italic">"{lead.quote}"</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">{lead.intent}</Badge>
                          <span className="text-xs font-bold text-green-600">{lead.score} AI</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 mb-1">🎯 Intent Mining Strategy</p>
                  <p className="text-xs text-orange-700">Find people who wrote 1-2 star reviews of competitor tools, then reach out: <em>"I saw your review of [Competitor] — we built LeadOS specifically to solve [their exact complaint]. Worth a 15-min call?"</em> Reply rates 3-5× higher than cold outreach.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
