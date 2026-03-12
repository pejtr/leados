import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  ExternalLink,
  Loader2,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZE = 20;

export default function History() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: industries } = trpc.leads.industries.useQuery();
  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    industry: industry === "all" ? undefined : industry,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  });

  const { data: sessions } = trpc.leads.sessions.useQuery();

  const deleteSession = trpc.leads.deleteSession.useMutation({
    onSuccess: () => {
      toast.success("Session deleted");
      utils.leads.list.invalidate();
      utils.leads.sessions.invalidate();
      utils.leads.stats.invalidate();
    },
    onError: (err) => toast.error(`Delete failed: ${err.message}`),
  });

  const exportQuery = trpc.leads.export.useQuery(
    { industry: industry === "all" ? undefined : industry },
    { enabled: false }
  );

  const handleExport = async () => {
    const result = await exportQuery.refetch();
    if (!result.data?.length) { toast.error("No leads to export"); return; }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.data.length} leads`);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead History</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse, search, and export all previously generated leads.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export All
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search company, email, contact..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9 bg-input border-border"
            />
          </div>
          <Select value={industry} onValueChange={(v) => { setIndustry(v); setPage(0); }}>
            <SelectTrigger className="w-[180px] bg-input border-border">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {(industries ?? []).map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sessions sidebar + leads */}
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
          {/* Sessions panel */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Generation Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {!sessions?.length ? (
                <p className="text-xs text-muted-foreground text-center py-4">No sessions yet</p>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{s.industry}</p>
                        <p className="text-xs text-muted-foreground">{s.generatedCount} leads · {new Date(s.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm("Delete this session and all its leads?")) {
                            deleteSession.mutate({ sessionId: s.id });
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads list */}
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !data?.items.length ? (
              <Card className="bg-card border-border border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Search className="h-10 w-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">No leads found</p>
                  <p className="text-xs mt-1">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{data.total} leads total</span>
                  <span>Page {page + 1} of {Math.max(1, totalPages)}</span>
                </div>

                <div className="space-y-2">
                  {data.items.map((lead) => (
                    <HistoryLeadRow
                      key={lead.id}
                      lead={lead}
                      expanded={expandedId === lead.id}
                      onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="gap-1"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <span className="text-xs text-muted-foreground px-2">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function HistoryLeadRow({
  lead,
  expanded,
  onToggle,
}: {
  lead: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <Card className="bg-card border-border hover:border-border/60 transition-colors">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{lead.companyName}</span>
              {lead.isEnriched && (
                <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              )}
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {lead.seniorityLevel}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
              {lead.contactName && (
                <span className="text-xs text-muted-foreground">
                  <Users className="inline h-3 w-3 mr-0.5" />{lead.contactName}
                </span>
              )}
              {lead.email && (
                <span className="text-xs text-primary truncate max-w-[200px]">{lead.email}</span>
              )}
              {lead.location && (
                <span className="text-xs text-muted-foreground">
                  <MapPin className="inline h-3 w-3 mr-0.5" />{lead.location}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                <Building2 className="inline h-3 w-3 mr-0.5" />{lead.industry}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            {lead.icebreaker && (
              <button
                onClick={onToggle}
                className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-violet-400 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onToggle}
              className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border space-y-2">
            {lead.companySize && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Company size:</strong> {lead.companySize}
              </p>
            )}
            {lead.linkedinUrl && (
              <p className="text-xs">
                <a href={lead.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  LinkedIn Profile
                </a>
              </p>
            )}
            {lead.companyDescription && (
              <p className="text-xs text-muted-foreground leading-relaxed">{lead.companyDescription}</p>
            )}
            {lead.icebreaker && (
              <div className="pl-3 border-l-2 border-violet-500/30">
                <p className="text-xs font-medium text-violet-400 mb-1">
                  <Sparkles className="inline h-3 w-3 mr-1" />
                  AI Icebreaker
                </p>
                <p className="text-xs text-muted-foreground italic leading-relaxed">{lead.icebreaker}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Generated: {new Date(lead.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
