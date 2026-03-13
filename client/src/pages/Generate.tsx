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
  Linkedin,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Users,
  Zap,
  Database,
  Globe,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
  companyDescription: string | null;
  icebreaker: string | null;
  isEnriched: boolean;
  dataSource: string;
  createdAt: Date;
}

const SENIORITY_LEVELS = ["Manager", "Director", "VP", "C-Level", "Head of"];

const PIPELINE_STEPS_APIFY = [
  "Validating industry with AI",
  "Connecting to LinkedIn via Apify",
  "Scraping company profiles",
  "Generating personalized icebreakers",
];

const PIPELINE_STEPS_MOCK = [
  "Validating industry with AI",
  "Generating demo lead data",
  "Generating personalized icebreakers",
];

export default function Generate() {
  const [industry, setIndustry] = useState("Technology");
  const [location, setLocation] = useState("United States");
  const [count, setCount] = useState(10);
  const [seniorityLevel, setSeniorityLevel] = useState("Manager");
  const [apifyToken, setApifyToken] = useState("");
  const [useApify, setUseApify] = useState(true);
  const [enrichEmails, setEnrichEmails] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  const { data: industries } = trpc.leads.industries.useQuery();
  const utils = trpc.useUtils();

  const generate = trpc.leads.generate.useMutation({
    onSuccess: (data) => {
      setResults(data.leads as Lead[]);
      setSessionId(data.sessionId);
      setCurrentStep(0);
      toast.success(`Generated ${data.count} leads successfully!`);
      utils.leads.stats.invalidate();
      utils.leads.sessions.invalidate();
    },
    onError: (err) => {
      setCurrentStep(0);
      toast.error(`Generation failed: ${err.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResults([]);
    setCurrentStep(1);
    generate.mutate({
      industry,
      location,
      count: Math.min(50, Math.max(1, count)),
      seniorityLevel,
      apifyToken: apifyToken || undefined,
      useApify,
      enrichEmails,
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

  const handleExportCsv = () => {
    if (!results.length) return;
    const headers = ["Company Name", "Email", "Website", "Industry", "Location", "Company Size", "Seniority Level", "Contact Name", "LinkedIn URL", "Status", "Data Source", "AI Enriched", "Icebreaker"];
    const escape = (v: string | null | undefined | boolean | Date) => {
      if (v === null || v === undefined) return "";
      const s = v instanceof Date ? v.toISOString() : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = results.map((l) => [
      escape(l.companyName), escape(l.email), escape(l.website),
      escape(l.industry), escape(l.location), escape(l.companySize),
      escape(l.seniorityLevel), escape(l.contactName), escape(l.linkedinUrl),
      "new", escape(l.dataSource), escape(l.isEnriched), escape(l.icebreaker),
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${industry.toLowerCase()}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported as CSV");
  };

  const emailsFound = results.filter((l) => l.email).length;
  const steps = useApify ? PIPELINE_STEPS_APIFY : PIPELINE_STEPS_MOCK;
  const linkedInLeads = results.filter((l) => l.dataSource === "linkedin_apify").length;
  const mockLeads = results.filter((l) => l.dataSource === "mock").length;

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

        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 items-start">
          {/* Form */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Data Source Selector */}
                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setUseApify(true)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                        useApify
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-input text-muted-foreground hover:border-border/80"
                      )}
                    >
                      <Linkedin className="h-4 w-4" />
                      <span>LinkedIn</span>
                      <span className={cn("text-[10px]", useApify ? "text-primary/70" : "text-muted-foreground/60")}>
                        via Apify · Live data
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseApify(false)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs font-medium transition-all",
                        !useApify
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-input text-muted-foreground hover:border-border/80"
                      )}
                    >
                      <Database className="h-4 w-4" />
                      <span>Demo Data</span>
                      <span className={cn("text-[10px]", !useApify ? "text-primary/70" : "text-muted-foreground/60")}>
                        Mock · No token needed
                      </span>
                    </button>
                  </div>
                  {useApify && (
                    <div className="space-y-2">
                      <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Apify token configured — live LinkedIn scraping enabled
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <div
                          role="checkbox"
                          aria-checked={enrichEmails}
                          onClick={() => setEnrichEmails(!enrichEmails)}
                          className={cn(
                            "h-4 w-4 rounded border flex items-center justify-center transition-colors cursor-pointer",
                            enrichEmails ? "bg-primary border-primary" : "border-border bg-input"
                          )}
                        >
                          {enrichEmails && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          Find contact emails via website scraping
                        </span>
                      </label>
                    </div>
                  )}
                </div>

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
                    placeholder="e.g. United States, Germany, London"
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
                      <Label htmlFor="apify">Override Apify Token</Label>
                      <Input
                        id="apify"
                        type="password"
                        value={apifyToken}
                        onChange={(e) => setApifyToken(e.target.value)}
                        placeholder="apify_api_... (uses server token by default)"
                        className="bg-input border-border"
                      />
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the server-configured Apify token.
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
                  <div className="flex items-center gap-3 mb-4">
                    <div className="relative">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {useApify ? "Scraping LinkedIn & enriching leads with AI..." : "Generating & enriching leads with AI..."}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This may take 1–3 minutes for live LinkedIn data
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {steps.map((step, i) => (
                      <div key={step} className="flex items-center gap-2 text-xs">
                        <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />
                        <span className="text-muted-foreground">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results header */}
            {results.length > 0 && (
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-medium text-foreground">
                      {results.length} leads generated
                    </span>
                  </div>
                  {linkedInLeads > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-2 py-0.5">
                      <Linkedin className="h-3 w-3" />
                      {linkedInLeads} from LinkedIn
                    </span>
                  )}
                  {mockLeads > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-2 py-0.5">
                      <Database className="h-3 w-3" />
                      {mockLeads} demo
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                     {results.filter((l) => l.isEnriched).length} enriched with AI
                  </span>
                  {emailsFound > 0 && (
                    <span className="text-xs text-muted-foreground">· {emailsFound} emails found</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
                    <Download className="h-3.5 w-3.5" />
                    JSON
                  </Button>
                </div>
              </div>
            )}

            {/* Lead cards */}
            {results.length > 0 ? (
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1">
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
  const isLinkedIn = lead.dataSource === "linkedin_apify";

  return (
    <Card className="bg-card border-border hover:border-border/80 transition-colors">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-foreground truncate">{lead.companyName}</span>
                {isLinkedIn ? (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                    <Linkedin className="h-2.5 w-2.5" />
                    LinkedIn
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-muted text-muted-foreground border border-border rounded-full px-1.5 py-0.5 shrink-0">
                    Demo
                  </span>
                )}
                {lead.isEnriched && (
                  <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                    <Sparkles className="h-2.5 w-2.5" />
                    AI enriched
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-xs text-muted-foreground">{lead.industry}</span>
                {lead.location && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {lead.location}
                  </span>
                )}
                {lead.companySize && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    {lead.companySize} employees
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Visit website"
              >
                <Globe className="h-3.5 w-3.5" />
              </a>
            )}
            {lead.linkedinUrl && (
              <a
                href={lead.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md text-muted-foreground hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="View on LinkedIn"
              >
                <Linkedin className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 border-t border-border pt-3">
            {lead.email && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-20 shrink-0">Email</span>
                <span className="text-foreground font-mono">{lead.email}</span>
              </div>
            )}
            {lead.contactName && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-20 shrink-0">Contact</span>
                <span className="text-foreground">{lead.contactName} · {lead.seniorityLevel}</span>
              </div>
            )}
            {lead.companyDescription && (
              <div className="flex gap-2 text-xs">
                <span className="text-muted-foreground w-20 shrink-0">About</span>
                <span className="text-foreground/80 leading-relaxed">{lead.companyDescription.slice(0, 300)}{lead.companyDescription.length > 300 ? "..." : ""}</span>
              </div>
            )}
            {lead.icebreaker && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Icebreaker</span>
                </div>
                <p className="text-xs text-foreground/90 leading-relaxed italic">"{lead.icebreaker}"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
