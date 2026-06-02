import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BarChart2, Loader2, ChevronDown, ChevronUp, Sparkles, Users, TrendingUp, Target, Zap, Globe } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";


interface ReportData {
  overview?: { size?: string; growth?: string; trends?: string[] };
  competitors?: Array<{ name: string; strengths?: string[]; weaknesses?: string[]; marketPosition?: string }>;
  buyerPersonas?: Array<{ title?: string; painPoints?: string[]; triggers?: string[] }>;
  salesSignals?: string[];
  outreachStrategy?: { channels?: string[]; timing?: string; messaging?: string };
  opportunities?: string[];
}

export default function MarketIntel() {
  
  const [industry, setIndustry] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: reports = [], refetch } = trpc.marketIntel.list.useQuery();
  const generateMut = trpc.marketIntel.generate.useMutation({
    onSuccess: (report) => {
      refetch();
      setExpandedId(report.id);
      setIndustry("");
      toast.success(`Market intelligence for ${report.industry} is ready.`);
    },
    onError: () => toast.error("Failed to generate report."),
  });

  function parseReport(data: string): ReportData {
    try { return JSON.parse(data); } catch { return {}; }
  }

  const QUICK_INDUSTRIES = ["SaaS", "Real Estate", "Insurance", "Healthcare", "Finance", "E-commerce", "Manufacturing", "Logistics"];

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <BarChart2 className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Market Intelligence</h1>
      </div>
      <p className="text-white/50 text-sm mb-6">AI-generated competitive intelligence reports for any industry</p>

      {/* Generate Form */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">Generate New Report</h2>
        <div className="flex gap-3 mb-3">
          <Input
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            placeholder="Enter industry (e.g. SaaS, Real Estate, Healthcare...)"
            className="bg-white/5 border-white/20 text-white flex-1"
            onKeyDown={e => e.key === "Enter" && industry && generateMut.mutate({ industry })}
          />
          <Button onClick={() => generateMut.mutate({ industry })} disabled={!industry || generateMut.isPending} className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6">
            {generateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_INDUSTRIES.map(ind => (
            <button key={ind} onClick={() => setIndustry(ind)} className="px-3 py-1 rounded-full text-xs bg-card/10 text-white/60 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all border border-white/10 hover:border-emerald-500/30">
              {ind}
            </button>
          ))}
        </div>
        {generateMut.isPending && (
          <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI is analyzing the {industry} market... This may take 15-30 seconds.
          </div>
        )}
      </div>

      {/* Reports List */}
      {reports.length === 0 && !generateMut.isPending && (
        <div className="text-center py-16 text-white/30 border border-white/10 rounded-xl">
          <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No reports yet — generate your first market intelligence report above</p>
        </div>
      )}

      <div className="space-y-4">
        {reports.map(report => {
          const data = parseReport(report.reportData);
          const isExpanded = expandedId === report.id;
          return (
            <div key={report.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
              <button
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{report.industry} Market Intelligence</p>
                    <p className="text-xs text-white/40">{new Date(report.generatedAt).toLocaleDateString()} · AI-generated report</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                  {/* Overview */}
                  {data.overview && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5" /> Market Overview</h3>
                      {data.overview.size && <p className="text-white/70 text-sm mb-1"><span className="text-white/40">Size:</span> {data.overview.size}</p>}
                      {data.overview.growth && <p className="text-white/70 text-sm mb-2"><span className="text-white/40">Growth:</span> {data.overview.growth}</p>}
                      {data.overview.trends && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {data.overview.trends.map((t, i) => <Badge key={i} variant="outline" className="text-xs border-emerald-500/30 text-emerald-400 bg-emerald-500/10">{t}</Badge>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Competitors */}
                  {data.competitors && data.competitors.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Target className="w-3.5 h-3.5" /> Competitors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.competitors.map((comp, i) => (
                          <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="font-semibold text-white text-sm mb-1">{comp.name}</p>
                            {comp.marketPosition && <p className="text-white/40 text-xs mb-2">{comp.marketPosition}</p>}
                            {comp.strengths && comp.strengths.length > 0 && (
                              <div className="mb-1">
                                <span className="text-xs text-emerald-400">✓ </span>
                                <span className="text-xs text-white/60">{comp.strengths[0]}</span>
                              </div>
                            )}
                            {comp.weaknesses && comp.weaknesses.length > 0 && (
                              <div>
                                <span className="text-xs text-red-400">✗ </span>
                                <span className="text-xs text-white/60">{comp.weaknesses[0]}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Buyer Personas */}
                  {data.buyerPersonas && data.buyerPersonas.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Buyer Personas</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.buyerPersonas.map((persona, i) => (
                          <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <p className="font-semibold text-white text-sm mb-2">{persona.title}</p>
                            {persona.painPoints && persona.painPoints.slice(0, 2).map((pain, j) => (
                              <p key={j} className="text-xs text-white/50 mb-0.5">• {pain}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Opportunities */}
                  {data.opportunities && data.opportunities.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Key Opportunities</h3>
                      <div className="space-y-2">
                        {data.opportunities.map((opp, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="text-emerald-400 text-sm font-bold mt-0.5">{i + 1}.</span>
                            <p className="text-white/70 text-sm">{opp}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Outreach Strategy */}
                  {data.outreachStrategy && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Outreach Strategy</h3>
                      {data.outreachStrategy.channels && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {data.outreachStrategy.channels.map((c, i) => <Badge key={i} variant="outline" className="text-xs border-blue-500/30 text-blue-400 bg-blue-500/10">{c}</Badge>)}
                        </div>
                      )}
                      {data.outreachStrategy.messaging && <p className="text-white/60 text-sm">{data.outreachStrategy.messaging}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
    </DashboardLayout>
  );
}
