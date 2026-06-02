import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Sparkles, Target, ChevronDown, ChevronUp, Shield, AlertTriangle, Zap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";


interface MapData {
  competitors?: Array<{
    name: string;
    strengths?: string[];
    weaknesses?: string[];
    marketShare?: number;
    pricePosition?: "budget" | "mid" | "premium";
    targetSegment?: string;
  }>;
  positioning?: {
    xAxis?: string;
    yAxis?: string;
    ourPosition?: { x: number; y: number };
  };
  differentiators?: string[];
  threats?: string[];
  opportunities?: string[];
}

const PRICE_COLORS: Record<string, string> = {
  budget: "bg-emerald-500/20 text-emerald-400",
  mid: "bg-amber-500/20 text-amber-400",
  premium: "bg-purple-500/20 text-purple-400",
};

export default function CompetitiveMap() {
  
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: maps = [], refetch } = trpc.competitiveMap.list.useQuery();
  const generateMut = trpc.competitiveMap.generate.useMutation({
    onSuccess: (map) => {
      refetch();
      setExpandedId(map.id);
      setCompanyName("");
      setIndustry("");
      toast.success(`Analysis for ${map.companyName} is ready.`);
    },
    onError: () => toast.error("Failed to generate competitive map."),
  });

  function parseMap(data: string): MapData {
    try { return JSON.parse(data); } catch { return {}; }
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Target className="w-6 h-6 text-emerald-400" />
        <h1 className="text-2xl font-bold text-white">Competitive Landscape</h1>
      </div>
      <p className="text-white/50 text-sm mb-6">AI-powered competitive analysis and positioning maps</p>

      {/* Generate Form */}
      <div className="bg-gradient-to-br from-purple-500/10 to-emerald-500/10 border border-purple-500/20 rounded-2xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-white mb-3">Analyze Competitive Landscape</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-white/50 mb-1 block">Your Company Name</label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Acme Corp" className="bg-white/5 border-white/20 text-white" />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Industry</label>
            <Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. SaaS CRM, Real Estate Tech" className="bg-white/5 border-white/20 text-white" />
          </div>
        </div>
        <Button
          onClick={() => generateMut.mutate({ companyName, industry })}
          disabled={!companyName || !industry || generateMut.isPending}
          className="bg-purple-500 hover:bg-purple-600 text-white font-semibold"
        >
          {generateMut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Generate Competitive Map
        </Button>
        {generateMut.isPending && (
          <p className="text-purple-400 text-sm mt-3 flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Analyzing competitive landscape... 15-30 seconds
          </p>
        )}
      </div>

      {/* Maps List */}
      {maps.length === 0 && !generateMut.isPending && (
        <div className="text-center py-16 text-white/30 border border-white/10 rounded-xl">
          <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No competitive maps yet — generate your first analysis above</p>
        </div>
      )}

      <div className="space-y-4">
        {maps.map(map => {
          const data = parseMap(map.mapData);
          const isExpanded = expandedId === map.id;
          return (
            <div key={map.id} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
              <button
                onClick={() => setExpandedId(isExpanded ? null : map.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <Target className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{map.companyName}</p>
                    <p className="text-xs text-white/40">{map.industry} · {new Date(map.generatedAt).toLocaleDateString()} · {data.competitors?.length ?? 0} competitors</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                  {/* Visual Positioning Map */}
                  {data.competitors && data.competitors.length > 0 && (
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-4">Competitor Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.competitors.map((comp, i) => (
                          <div key={i} className="p-3 bg-white/5 rounded-lg border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-semibold text-white text-sm">{comp.name}</p>
                              {comp.pricePosition && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${PRICE_COLORS[comp.pricePosition]}`}>
                                  {comp.pricePosition}
                                </span>
                              )}
                            </div>
                            {comp.targetSegment && <p className="text-white/40 text-xs mb-2">{comp.targetSegment}</p>}
                            {comp.marketShare !== undefined && (
                              <div className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white/40">Market Share</span>
                                  <span className="text-white/60">{comp.marketShare}%</span>
                                </div>
                                <div className="h-1.5 bg-card/10 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(comp.marketShare, 100)}%` }} />
                                </div>
                              </div>
                            )}
                            {comp.strengths && comp.strengths.slice(0, 1).map((s, j) => (
                              <p key={j} className="text-xs text-emerald-400/70">✓ {s}</p>
                            ))}
                            {comp.weaknesses && comp.weaknesses.slice(0, 1).map((w, j) => (
                              <p key={j} className="text-xs text-red-400/70">✗ {w}</p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Differentiators */}
                    {data.differentiators && data.differentiators.length > 0 && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5" /> Your Advantages
                        </h3>
                        <div className="space-y-2">
                          {data.differentiators.map((d, i) => (
                            <p key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                              <span className="text-emerald-400 mt-0.5">✓</span>{d}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Threats */}
                    {data.threats && data.threats.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" /> Threats
                        </h3>
                        <div className="space-y-2">
                          {data.threats.map((t, i) => (
                            <p key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                              <span className="text-red-400 mt-0.5">!</span>{t}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Opportunities */}
                    {data.opportunities && data.opportunities.length > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5" /> Opportunities
                        </h3>
                        <div className="space-y-2">
                          {data.opportunities.map((o, i) => (
                            <p key={i} className="text-xs text-white/70 flex items-start gap-1.5">
                              <span className="text-amber-400 mt-0.5">→</span>{o}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
