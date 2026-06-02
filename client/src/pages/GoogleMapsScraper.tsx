import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

import {
  MapPin, Search, Globe, Phone, Star, TrendingUp, CheckCircle, XCircle, ArrowRight, Loader2, Building2, Filter
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-zinc-700 text-zinc-200",
  contacted: "bg-blue-900 text-blue-200",
  interested: "bg-yellow-900 text-yellow-200",
  converted: "bg-green-900 text-green-200",
  rejected: "bg-red-900 text-red-200",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Nový",
  contacted: "Osloven",
  interested: "Zájem",
  converted: "Konvertován",
  rejected: "Odmítnut",
};

export default function GoogleMapsScraper() {
  const [searchTerm, setSearchTerm] = useState("restaurace");
  const [location, setLocation] = useState("Praha");
  const [maxResults, setMaxResults] = useState(20);
  const [filterNoWebsite, setFilterNoWebsite] = useState(false);
  const [filterLowScore, setFilterLowScore] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(null);

  const searchMutation = trpc.googleMaps.search.useMutation({
    onSuccess: (data) => {
      setActiveSession(data.sessionId);
      toast.success(`Nalezeno ${data.count} firem`);
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: results, refetch: refetchResults } = trpc.googleMaps.getBySession.useQuery(
    { sessionId: activeSession! },
    { enabled: !!activeSession }
  );

  const { data: sessions } = trpc.googleMaps.getSessions.useQuery();

  const updateStatus = trpc.googleMaps.updateStatus.useMutation({
    onSuccess: () => refetchResults(),
  });

  const convertToLead = trpc.googleMaps.convertToLead.useMutation({
    onSuccess: (data) => {
      toast.success("Lead vytvořen v CRM!");
      if (data.icebreaker) toast.info(`AI Icebreaker: ${data.icebreaker.slice(0, 80)}...`);
      refetchResults();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSearch = () => {
    if (!searchTerm.trim() || !location.trim()) {
      toast.error("Vyplňte hledaný výraz a město");
      return;
    }
    searchMutation.mutate({ searchTerm, location, maxResults, filterNoWebsite, filterLowScore });
  };

  const noWebsiteCount = results?.filter(r => !r.hasWebsite).length ?? 0;
  const lowScoreCount = results?.filter(r => (r.webQualityScore ?? 0) < 40).length ?? 0;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MapPin className="w-6 h-6 text-emerald-400" />
            Google Maps Scraper
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Najdi firmy bez webu nebo se slabým webem — ideální pro web agency outreach
          </p>
        </div>
        {sessions && sessions.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {sessions.length} předchozích vyhledávání
          </div>
        )}
      </div>

      {/* Search Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Typ firmy</label>
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="restaurace, kavárna, autoservis..."
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Město / Region</label>
            <Input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Praha, Brno, Ostrava..."
              className="bg-background"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Max výsledků</label>
            <Input
              type="number"
              value={maxResults}
              onChange={e => setMaxResults(Number(e.target.value))}
              min={5}
              max={100}
              className="bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterNoWebsite}
              onChange={e => setFilterNoWebsite(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Pouze bez webu</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterLowScore}
              onChange={e => setFilterLowScore(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">Pouze slabý web (skóre &lt; 40)</span>
          </label>
        </div>

        <Button
          onClick={handleSearch}
          disabled={searchMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {searchMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Hledám na Google Maps...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" /> Spustit vyhledávání</>
          )}
        </Button>
      </div>

      {/* Previous Sessions */}
      {sessions && sessions.length > 0 && !activeSession && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Filter className="w-4 h-4" /> Předchozí vyhledávání
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sessions.slice(0, 6).map(s => (
              <button
                key={s.sessionId}
                onClick={() => setActiveSession(s.sessionId)}
                className="bg-card border border-border rounded-lg p-3 text-left hover:border-emerald-500 transition-colors"
              >
                <div className="font-medium text-sm text-foreground">{s.city}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {s.count} firem · {s.noWebsite} bez webu
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{results.length}</div>
              <div className="text-xs text-muted-foreground">Celkem firem</div>
            </div>
            <div className="bg-card border border-red-900/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{noWebsiteCount}</div>
              <div className="text-xs text-muted-foreground">Bez webu</div>
            </div>
            <div className="bg-card border border-yellow-900/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-400">{lowScoreCount}</div>
              <div className="text-xs text-muted-foreground">Slabý web</div>
            </div>
            <div className="bg-card border border-emerald-900/40 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {results.filter(r => r.status === "converted").length}
              </div>
              <div className="text-xs text-muted-foreground">Konvertováno</div>
            </div>
          </div>

          {/* Results table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 text-muted-foreground font-medium">Firma</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Web</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Skóre</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Hodnocení</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
                    <th className="text-left p-3 text-muted-foreground font-medium">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          {r.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {r.address || r.city}
                        </div>
                        {r.phone && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {r.phone}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {r.hasWebsite ? (
                          <a href={r.website || "#"} target="_blank" rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs">
                            <Globe className="w-3 h-3" />
                            {(r.website || "").replace(/^https?:\/\//, "").slice(0, 25)}
                          </a>
                        ) : (
                          <span className="text-red-400 text-xs flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Nemá web
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-zinc-700 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${(r.webQualityScore ?? 0) >= 60 ? "bg-emerald-500" : (r.webQualityScore ?? 0) >= 30 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${r.webQualityScore ?? 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{r.webQualityScore ?? 0}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {r.rating ? (
                          <div className="flex items-center gap-1 text-xs">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-foreground">{r.rating}</span>
                            <span className="text-muted-foreground">({r.reviewsCount})</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <select
                          value={r.status}
                          onChange={e => updateStatus.mutate({ id: r.id, status: e.target.value as "new" | "contacted" | "interested" | "converted" | "rejected" })}
                          className={`text-xs rounded px-2 py-1 border-0 cursor-pointer ${STATUS_COLORS[r.status]}`}
                        >
                          {Object.entries(STATUS_LABELS).map(([v, l]) => (
                            <option key={v} value={v}>{l}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        {r.status !== "converted" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => convertToLead.mutate({ id: r.id })}
                            disabled={convertToLead.isPending}
                            className="text-xs h-7 border-emerald-700 text-emerald-400 hover:bg-emerald-900/30"
                          >
                            {convertToLead.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <><TrendingUp className="w-3 h-3 mr-1" /> Do CRM</>
                            )}
                          </Button>
                        )}
                        {r.status === "converted" && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> V CRM
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!results && !searchMutation.isPending && (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Zadej hledaný výraz a město</p>
          <p className="text-sm mt-1">Systém najde firmy na Google Maps a ohodnotí kvalitu jejich webu</p>
        </div>
      )}
    </div>
    </DashboardLayout>
  );
}
