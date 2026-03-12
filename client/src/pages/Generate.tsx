import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface Lead {
  id: number;
  companyName: string;
  email: string | null;
  website: string | null;
  industry: string;
  location: string | null;
  companySize: string | null;
  seniorityLevel: string | null;
  contactName: string | null;
  linkedinUrl: string | null;
  icebreaker: string | null;
  isEnriched: boolean;
  createdAt: Date;
}

const SENIORITY_LEVELS = ["Manager", "Director", "VP", "C-Level", "Head of"];

export default function Generate() {
  const [industry, setIndustry] = useState("Technology");
  const [location, setLocation] = useState("United States");
  const [count, setCount] = useState(10);
  const [seniorityLevel, setSeniorityLevel] = useState("Manager");
  const [apifyToken, setApifyToken] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);

  const { data: industries } = trpc.leads.industries.useQuery();
  const utils = trpc.useUtils();

  const generate = trpc.leads.generate.useMutation({
    onSuccess: (data) => {
      setResults(data.leads as Lead[]);
      setSessionId(data.sessionId);
      toast.success(`Generated ${data.count} leads successfully!`);
      utils.leads.stats.invalidate();
      utils.leads.sessions.invalidate();
    },
    onError: (err) => {
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults([]);
    generate.mutate({
      industry,
      location,
      count: Math.min(50, Math.max(1, count)),
      seniorityLevel,
      apifyToken: apifyToken || undefined,
    });
  };

  const handleExport = () => {
    if (!results.length) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${industry.toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported as JSON");
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Generate Leads</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure your target criteria and let AI generate and enrich your leads.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
          {/* Form */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry" className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(industries ?? []).map((ind) => (
                        <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. United States, Germany"
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="count">Number of Leads (1–50)</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={50}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 10)}
                    className="bg-input border-border"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="seniority">Seniority Level</Label>
                  <Select value={seniorityLevel} onValueChange={setSeniorityLevel}>
                    <SelectTrigger id="seniority" className="bg-input border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SENIORITY_LEVELS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Advanced */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Advanced options
                  </button>
                  {showAdvanced && (
                    <div className="mt-3 space-y-1.5">
                      <Label htmlFor="apify">Apify Token (optional)</Label>
                      <Input
                        id="apify"
                        type="password"
                        value={apifyToken}
                        onChange={(e) => setApifyToken(e.target.value)}
                        placeholder="apify_api_... (leave blank for demo data)"
                        className="bg-input border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Without a token, realistic demo data is used.
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={generate.isPending}
                >
                  {generate.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Leads
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="space-y-4">
            {/* Progress indicator */}
            {generate.isPending && (
              <Card className="bg-card border-border border-primary/30">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        AI is generating and enriching your leads...
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Validating industry → Scraping leads → Generating AI icebreakers
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {["Validating industry with AI", "Scraping lead data", "Generating personalized icebreakers"].map(
                      (step, i) => (
                        <div key={step} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                          {step}
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results header */}
            {results.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground">
                    {results.length} leads generated
                  </span>
                  <span className="text-xs text-muted-foreground">
                    · {results.filter((l) => l.isEnriched).length} enriched with AI
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                  <Download className="h-3.5 w-3.5" />
                  Export JSON
                </Button>
              </div>
            )}

            {/* Lead cards */}
            {results.length > 0 ? (
              <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
                {results.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            ) : !generate.isPending ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Zap className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No leads yet</p>
                  <p className="text-xs mt-1">Configure your criteria and click Generate Leads</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function LeadCard({ lead }: { lead: Lead }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-foreground">{lead.companyName}</h3>
              {lead.isEnriched && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI Enriched
                </span>
              )}
            </div>
            {lead.contactName && (
              <p className="text-xs text-muted-foreground mt-0.5">
                <Users className="inline h-3 w-3 mr-1" />
                {lead.contactName}
              </p>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground shrink-0">
            {lead.seniorityLevel}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          {lead.industry && (
            <MetaTag icon={<Building2 className="h-3 w-3" />} label={lead.industry} />
          )}
          {lead.location && (
            <MetaTag icon={<MapPin className="h-3 w-3" />} label={lead.location} />
          )}
          {lead.companySize && (
            <MetaTag icon={<Users className="h-3 w-3" />} label={lead.companySize} />
          )}
        </div>

        {lead.email && (
          <p className="text-xs text-primary mt-2 truncate">{lead.email}</p>
        )}

        {lead.website && (
          <a
            href={lead.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            {lead.website.replace(/^https?:\/\//, "")}
          </a>
        )}

        {lead.icebreaker && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              <MessageSquare className="h-3 w-3" />
              {expanded ? "Hide icebreaker" : "Show AI icebreaker"}
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            {expanded && (
              <div className="mt-2 pl-3 border-l-2 border-violet-500/30 text-xs text-muted-foreground italic leading-relaxed">
                {lead.icebreaker}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetaTag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
      {icon}
      {label}
    </span>
  );
}
