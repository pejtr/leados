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
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, CheckSquare, Square, Minus, Sheet } from "lucide-react";
import SheetsExportModal from "@/components/SheetsExportModal";

const PAGE_SIZE = 20;

type LeadStatus = "new" | "contacted" | "replied" | "qualified" | "disqualified";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; bg: string; border: string }> = {
  new:          { label: "New",          color: "text-sky-400",    bg: "bg-sky-500/10",    border: "border-sky-500/20" },
  contacted:    { label: "Contacted",    color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  replied:      { label: "Replied",      color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  qualified:    { label: "Qualified",    color: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  disqualified: { label: "Disqualified", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20" },
};

export default function History() {
  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<LeadStatus>("contacted");
  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [sheetsLeadIds, setSheetsLeadIds] = useState<number[] | undefined>(undefined);

  const { data: industries } = trpc.leads.industries.useQuery();
  const utils = trpc.useUtils();
  const { data: predictiveScores } = trpc.leads.getPredictiveScores.useQuery();
  const computeScores = trpc.leads.computePredictiveScores.useMutation({
    onSuccess: (r) => { toast.success(`✨ Scored ${r.scored} leads with AI`); utils.leads.getPredictiveScores.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const scoreMap = Object.fromEntries((predictiveScores ?? []).map((s) => [s.leadId, s]));

  const { data, isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    industry: industry === "all" ? undefined : industry,
    status: statusFilter === "all" ? undefined : statusFilter,
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

  const exportCsvQuery = trpc.leads.exportCsv.useQuery(
    {
      industry: industry === "all" ? undefined : industry,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: false }
  );

  const exportJsonQuery = trpc.leads.export.useQuery(
    {
      industry: industry === "all" ? undefined : industry,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    { enabled: false }
  );

  const handleExportCsv = async () => {
    const result = await exportCsvQuery.refetch();
    if (!result.data) { toast.error("No leads to export"); return; }
    const blob = new Blob([result.data], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-history-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  const handleExportJson = async () => {
    const result = await exportJsonQuery.refetch();
    if (!result.data?.length) { toast.error("No leads to export"); return; }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${result.data.length} leads as JSON`);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const pageIds = useMemo(() => (data?.items ?? []).map((l) => l.id), [data]);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someSelected = pageIds.some((id) => selectedIds.has(id)) && !allSelected;

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); pageIds.forEach((id) => n.delete(id)); return n; });
    } else {
      setSelectedIds((prev) => { const n = new Set(prev); pageIds.forEach((id) => n.add(id)); return n; });
    }
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const bulkUpdateStatus = trpc.leads.bulkUpdateStatus.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Updated ${vars.leadIds.length} leads to "${STATUS_CONFIG[vars.status as LeadStatus]?.label ?? vars.status}"`);
      setSelectedIds(new Set());
      utils.leads.list.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const bulkDelete = trpc.leads.bulkDelete.useMutation({
    onSuccess: (_, vars) => {
      toast.success(`Deleted ${vars.leadIds.length} leads`);
      setSelectedIds(new Set());
      utils.leads.list.invalidate();
      utils.leads.stats.invalidate();
      utils.leads.sessions.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleBulkExportCsv = () => {
    const selected = (data?.items ?? []).filter((l) => selectedIds.has(l.id));
    if (!selected.length) { toast.error("No leads selected"); return; }
    const headers = ["Company Name","Email","Website","Industry","Location","Company Size","Seniority","Contact","Status","Data Source","AI Enriched","Icebreaker"];
    const escape = (v: any) => { if (v == null) return ""; const s = String(v); return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s; };
    const rows = selected.map((l) => [l.companyName,l.email,l.website,l.industry,l.location,l.companySize,l.seniorityLevel,l.contactName,l.status,l.dataSource,l.isEnriched,l.icebreaker].map(escape).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leads-selected-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${selected.length} leads as CSV`);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lead History</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Browse, search, manage pipeline status, and export all generated leads.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCsv} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportJson} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSheetsLeadIds(undefined); setSheetsModalOpen(true); }}
              className="gap-1.5 border-green-600/40 text-green-500 hover:bg-green-600/10"
            >
              <Sheet className="h-3.5 w-3.5" />
              Sheets
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => computeScores.mutate()}
              disabled={computeScores.isPending}
              className="gap-1.5 border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
            >
              {computeScores.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              Score Leads
            </Button>
          </div>
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
            <SelectTrigger className="w-[170px] bg-input border-border">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All industries</SelectItem>
              {(industries ?? []).map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[150px] bg-input border-border">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
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
                {/* Bulk actions toolbar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <button onClick={toggleAll} className="p-1 rounded hover:bg-secondary transition-colors" title="Select all on page">
                      {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : someSelected ? <Minus className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                    </button>
                    <span>{data.total} leads total</span>
                    {selectedIds.size > 0 && (
                      <span className="text-primary font-medium">· {selectedIds.size} selected</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedIds.size > 0 && (
                      <>
                        <Select value={bulkStatus} onValueChange={(v) => setBulkStatus(v as LeadStatus)}>
                          <SelectTrigger className="h-6 text-[10px] w-[110px] bg-input border-border">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                              <SelectItem key={s} value={s} className="text-xs">{STATUS_CONFIG[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          disabled={bulkUpdateStatus.isPending}
                          onClick={() => bulkUpdateStatus.mutate({ leadIds: Array.from(selectedIds), status: bulkStatus })}>
                          Set Status
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={handleBulkExportCsv}>
                          Export CSV
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                          disabled={bulkDelete.isPending}
                          onClick={() => { if (confirm(`Delete ${selectedIds.size} leads?`)) bulkDelete.mutate({ leadIds: Array.from(selectedIds) }); }}>
                          Delete
                        </Button>
                      </>
                    )}
                    <span className="ml-2">Page {page + 1} of {Math.max(1, totalPages)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {data.items.map((lead) => (
                    <HistoryLeadRow
                      key={lead.id}
                      lead={lead}
                      score={scoreMap[lead.id]}
                      expanded={expandedId === lead.id}
                      onToggle={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      selected={selectedIds.has(lead.id)}
                      onSelect={() => toggleOne(lead.id)}
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
      <SheetsExportModal
        open={sheetsModalOpen}
        onClose={() => setSheetsModalOpen(false)}
        leadIds={sheetsLeadIds}
        label={sheetsLeadIds ? `${sheetsLeadIds.length} selected leads` : "all leads"}
      />
    </DashboardLayout>
  );
}

function HistoryLeadRow({
  lead,
  score,
  expanded,
  onToggle,
  selected,
  onSelect,
}: {
  lead: any;
  score?: any;
  expanded: boolean;
  onToggle: () => void;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const [status, setStatus] = useState<LeadStatus>((lead.status as LeadStatus) ?? "new");
  const [quality, setQuality] = useState<string | null>(lead.qualityRating ?? null);
  const utils = trpc.useUtils();

  const rateQuality = trpc.leads.rateQuality.useMutation({
    onSuccess: (_, vars) => {
      setQuality(vars.rating);
      toast.success(vars.rating === "good" ? "Marked as good lead" : "Marked as bad lead");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: (_, vars) => {
      setStatus(vars.status);
      utils.leads.list.invalidate();
      toast.success(`Status updated to "${STATUS_CONFIG[vars.status].label}"`);
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`),
  });

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
  const isLinkedIn = lead.dataSource === "linkedin_apify";

  return (
    <Card className={cn("bg-card border-border hover:border-border/60 transition-colors", selected && "border-primary/40 bg-primary/5")}>
      <CardContent className="pt-3 pb-3">
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <button
            onClick={(e) => { e.stopPropagation(); onSelect?.(); }}
            className="mt-0.5 shrink-0 p-0.5 rounded text-muted-foreground hover:text-primary transition-colors"
          >
            {selected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">{lead.companyName}</span>
              {isLinkedIn && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                  <Linkedin className="h-2.5 w-2.5" />
                  LinkedIn
                </span>
              )}
              {lead.isEnriched && (
                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              )}
              {lead.email && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-1.5 py-0.5 shrink-0">
                  <Mail className="h-2.5 w-2.5" />
                  Email found
                </span>
              )}
              {score && (
                <span className={cn(
                  "inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 shrink-0 font-semibold border",
                  score.scoreLabel === 'hot' && "bg-orange-500/15 text-orange-400 border-orange-500/30",
                  score.scoreLabel === 'warm' && "bg-amber-500/15 text-amber-400 border-amber-500/30",
                  score.scoreLabel === 'cold' && "bg-slate-500/15 text-slate-400 border-slate-500/30",
                )}>
                  {score.scoreLabel === 'hot' ? '🔥' : score.scoreLabel === 'warm' ? '⚡' : '❄️'}
                  {Math.round(Number(score.score))}
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

          {/* Status selector + actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Inline status dropdown */}
            <Select
              value={status}
              onValueChange={(v) => {
                updateStatus.mutate({ leadId: lead.id, status: v as LeadStatus });
              }}
            >
              <SelectTrigger
                className={cn(
                  "h-6 text-[10px] px-2 py-0 rounded-full border font-medium w-auto gap-1",
                  cfg.color, cfg.bg, cfg.border
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    <span className={STATUS_CONFIG[s].color}>{STATUS_CONFIG[s].label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
            {lead.email && (
              <p className="text-xs text-muted-foreground">
                <strong className="text-foreground">Email:</strong>{" "}
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
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
            {/* Quality rating */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-muted-foreground">Lead quality:</span>
              <button
                onClick={() => rateQuality.mutate({ leadId: lead.id, rating: "good" })}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors",
                  quality === "good"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "border-border text-muted-foreground hover:text-emerald-400 hover:border-emerald-500/30"
                )}
              >
                <ThumbsUp className="h-3 w-3" /> Good
              </button>
              <button
                onClick={() => rateQuality.mutate({ leadId: lead.id, rating: "bad" })}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors",
                  quality === "bad"
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                    : "border-border text-muted-foreground hover:text-rose-400 hover:border-rose-500/30"
                )}
              >
                <ThumbsDown className="h-3 w-3" /> Bad
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Generated: {new Date(lead.createdAt).toLocaleString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
