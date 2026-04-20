import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Globe, Mail, Phone, Tag, ExternalLink, Search, Filter, RefreshCw, Users, CheckCircle2, Star, XCircle, Inbox } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  contacted: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  qualified: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  disqualified: "bg-red-500/20 text-red-400 border-red-500/30",
};

const STATUS_ICONS: Record<string, any> = {
  new: Inbox,
  contacted: Mail,
  qualified: Star,
  disqualified: XCircle,
};

export default function IngestSources() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const { data: stats, refetch: refetchStats } = trpc.ingestedLeads.stats.useQuery();
  const { data: leadsData, isLoading, refetch } = trpc.ingestedLeads.list.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    projectId: projectFilter !== "all" ? parseInt(projectFilter) : undefined,
    page,
    limit: 50,
  });

  const updateStatus = trpc.ingestedLeads.updateStatus.useMutation({
    onSuccess: () => { refetch(); refetchStats(); },
    onError: (e) => toast.error(e.message),
  });

  const deleteLead = trpc.ingestedLeads.delete.useMutation({
    onSuccess: () => { refetch(); refetchStats(); toast.success("Lead smazán"); },
    onError: (e) => toast.error(e.message),
  });

  const leads = leadsData?.leads ?? [];
  const total = leadsData?.total ?? 0;
  const bySource = stats?.bySource ?? [];
  const totalLeads = stats?.total ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Globe className="w-6 h-6 text-emerald-400" />
              External Leads Inbox
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Leads captured from all connected projects via <code className="text-emerald-400 bg-slate-800 px-1 rounded text-xs">POST /api/leads/ingest</code>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { refetch(); refetchStats(); }} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Source Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Total card */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Total Leads</span>
            </div>
            <div className="text-3xl font-bold text-white">{totalLeads}</div>
            <div className="text-xs text-emerald-400 mt-1">{bySource.length} sources</div>
          </div>

          {/* Per-source cards */}
          {bySource.slice(0, 5).map((src) => (
            <div
              key={src.projectId}
              className={`bg-slate-800/60 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 ${projectFilter === String(src.projectId) ? "border-emerald-500/60 bg-emerald-500/10" : "border-slate-700/50"}`}
              onClick={() => setProjectFilter(projectFilter === String(src.projectId) ? "all" : String(src.projectId))}
            >
              <div className="text-xs text-slate-400 truncate mb-1">{src.projectName}</div>
              <div className="text-2xl font-bold text-white">{Number(src.total)}</div>
              <div className="flex gap-2 mt-1">
                <span className="text-xs text-blue-400">{Number(src.newCount)} new</span>
                <span className="text-xs text-emerald-400">{Number(src.qualifiedCount)} qual.</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by email or name..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-slate-800/60 border-slate-700 text-white"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="disqualified">Disqualified</SelectItem>
            </SelectContent>
          </Select>
          <Select value={projectFilter} onValueChange={(v) => { setProjectFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-slate-800/60 border-slate-700 text-white">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All projects</SelectItem>
              {bySource.map((src) => (
                <SelectItem key={src.projectId} value={String(src.projectId)}>
                  {src.projectName} ({Number(src.total)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(search || statusFilter !== "all" || projectFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setProjectFilter("all"); setPage(1); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
              <Inbox className="w-8 h-8 opacity-40" />
              <p className="text-sm">No leads yet. Connect your first project and start capturing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/60">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Contact</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Interest</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">UTM</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Date</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const StatusIcon = STATUS_ICONS[lead.status ?? "new"] ?? Inbox;
                    return (
                      <tr key={lead.id} className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{lead.name || "—"}</div>
                          <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                          {lead.phone && (
                            <div className="flex items-center gap-1 text-slate-400 text-xs">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-emerald-400 font-medium text-xs">{lead.projectName}</div>
                          <div className="text-slate-500 text-xs">{lead.source}</div>
                          {lead.pageUrl && (
                            <a href={lead.pageUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 text-xs flex items-center gap-1 hover:text-slate-300 mt-0.5">
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{lead.pageUrl.replace(/^https?:\/\//, "")}</span>
                            </a>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {lead.interest ? (
                            <div className="flex items-center gap-1 text-slate-300 text-xs">
                              <Tag className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[140px]">{lead.interest}</span>
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {lead.utmSource ? (
                            <div className="text-xs space-y-0.5">
                              <div className="text-slate-400"><span className="text-slate-500">src:</span> {lead.utmSource}</div>
                              {lead.utmMedium && <div className="text-slate-400"><span className="text-slate-500">med:</span> {lead.utmMedium}</div>}
                              {lead.utmCampaign && <div className="text-slate-400"><span className="text-slate-500">cmp:</span> {lead.utmCampaign}</div>}
                            </div>
                          ) : <span className="text-slate-600 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={lead.status ?? "new"}
                            onValueChange={(v) => updateStatus.mutate({ id: lead.id, status: v as any })}
                          >
                            <SelectTrigger className={`h-7 text-xs border px-2 py-0 w-32 ${STATUS_COLORS[lead.status ?? "new"]}`}>
                              <div className="flex items-center gap-1">
                                <StatusIcon className="w-3 h-3" />
                                <SelectValue />
                              </div>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="new">New</SelectItem>
                              <SelectItem value="contacted">Contacted</SelectItem>
                              <SelectItem value="qualified">Qualified</SelectItem>
                              <SelectItem value="disqualified">Disqualified</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(lead.createdAt ?? 0).toLocaleDateString("cs-CZ")}
                          <div className="text-slate-600">{new Date(lead.createdAt ?? 0).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}</div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={() => deleteLead.mutate({ id: lead.id })}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {total > 50 && (
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Showing {(page - 1) * 50 + 1}–{Math.min(page * 50, total)} of {total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={page * 50 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          </div>
        )}

        {/* Integration Guide */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            How to connect a project
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div>
              <p className="text-slate-300 font-medium mb-1">1. Get your project API key</p>
              <p>Go to <a href="/projects" className="text-emerald-400 hover:underline">Projects Hub</a> → select project → copy API key</p>
            </div>
            <div>
              <p className="text-slate-300 font-medium mb-1">2. POST lead from your website</p>
              <pre className="bg-slate-900 rounded p-2 text-emerald-300 overflow-x-auto mt-1">{`fetch("https://www.ai-lead-gen.com/api/leads/ingest", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-LeadOS-Key": "YOUR_PROJECT_API_KEY"
  },
  body: JSON.stringify({
    email: "user@example.com",
    name: "Jan Novák",
    source: "newsletter-form",
    interest: "recepty bez masa",
    url: window.location.href,
    utm_source: "google",
    utm_medium: "cpc"
  })
})`}</pre>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
