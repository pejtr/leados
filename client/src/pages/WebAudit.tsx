import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Globe, Search, Shield, ShieldAlert, Smartphone, BarChart2, Zap,
  CheckCircle, XCircle, AlertTriangle, Info, Loader2, Clock, History
} from "lucide-react";

type AuditResult = {
  url: string;
  businessName?: string;
  scores: { overall: number; performance: number; seo: number; mobile: number; design: number };
  issues: Array<{ severity: "critical" | "warning" | "info"; category: string; message: string }>;
  recommendations: Array<{ priority: number; title: string; description: string; impact: string }>;
  techStack: string[];
  meta: {
    hasSsl?: boolean;
    hasContactForm?: boolean;
    hasMobileMenu?: boolean;
    hasOnlineBooking?: boolean;
    hasGoogleAnalytics?: boolean;
    title?: string;
    speedMs?: number;
  };
  aiSummary: string;
};

function ScoreCircle({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#27272a" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="40" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">{score}</text>
      </svg>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 70) return "#10b981";
  if (score >= 40) return "#f59e0b";
  return "#ef4444";
}

const SEVERITY_ICON = {
  critical: <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
};

export default function WebAudit() {
  const [url, setUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [result, setResult] = useState<AuditResult | null>(null);

  const auditMutation = trpc.webAudit.audit.useMutation({
    onSuccess: (data) => {
      setResult(data as AuditResult);
      toast.success("Audit dokončen!");
    },
    onError: (err) => toast.error(err.message),
  });

  const { data: history } = trpc.webAudit.getHistory.useQuery();

  const handleAudit = () => {
    if (!url.trim()) { toast.error("Zadej URL webu"); return; }
    auditMutation.mutate({ url, businessName: businessName || undefined });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Globe className="w-6 h-6 text-blue-400" />
          Web Audit Tool
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          AI analýza kvality webu — ideální jako lead magnet pro web agency
        </p>
      </div>

      {/* Input */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">URL webu *</label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://restaurace-napoli.cz"
              className="bg-background"
              onKeyDown={e => e.key === "Enter" && handleAudit()}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Název firmy (volitelné)</label>
            <Input
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Restaurace Napoli"
              className="bg-background"
            />
          </div>
        </div>
        <Button
          onClick={handleAudit}
          disabled={auditMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {auditMutation.isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzuji web...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" /> Spustit audit</>
          )}
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          {/* Score overview */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-foreground">{result.businessName || result.url}</h2>
                <a href={result.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline">{result.url}</a>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${result.scores.overall >= 70 ? "text-emerald-400" : result.scores.overall >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                  {result.scores.overall}/100
                </div>
                <div className="text-xs text-muted-foreground">Celkové skóre</div>
              </div>
            </div>

            <div className="flex justify-around">
              <ScoreCircle score={result.scores.seo} label="SEO" color={scoreColor(result.scores.seo)} />
              <ScoreCircle score={result.scores.mobile} label="Mobil" color={scoreColor(result.scores.mobile)} />
              <ScoreCircle score={result.scores.performance} label="Výkon" color={scoreColor(result.scores.performance)} />
              <ScoreCircle score={result.scores.design} label="Design" color={scoreColor(result.scores.design)} />
            </div>

            {/* Quick checks */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-5">
              {[
                { label: "SSL", ok: result.meta.hasSsl, icon: <Shield className="w-3.5 h-3.5" /> },
                { label: "Kontakt", ok: result.meta.hasContactForm, icon: <CheckCircle className="w-3.5 h-3.5" /> },
                { label: "Mobil", ok: result.meta.hasMobileMenu, icon: <Smartphone className="w-3.5 h-3.5" /> },
                { label: "Rezervace", ok: result.meta.hasOnlineBooking, icon: <Clock className="w-3.5 h-3.5" /> },
                { label: "Analytics", ok: result.meta.hasGoogleAnalytics, icon: <BarChart2 className="w-3.5 h-3.5" /> },
              ].map(({ label, ok, icon }) => (
                <div key={label} className={`flex items-center gap-2 rounded-lg p-2 text-xs ${ok ? "bg-emerald-900/20 text-emerald-400" : "bg-red-900/20 text-red-400"}`}>
                  {ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  {label}
                </div>
              ))}
            </div>

            {result.meta.speedMs && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="w-3.5 h-3.5" />
                Rychlost načtení: {result.meta.speedMs}ms
                {result.techStack.length > 0 && (
                  <span className="ml-3">Technologie: {result.techStack.join(", ")}</span>
                )}
              </div>
            )}
          </div>

          {/* AI Summary */}
          {result.aiSummary && (
            <div className="bg-blue-950/30 border border-blue-900/40 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-blue-300 mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> AI Shrnutí
              </h3>
              <p className="text-sm text-foreground leading-relaxed">{result.aiSummary}</p>
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">
                Nalezené problémy ({result.issues.length})
              </h3>
              <div className="space-y-2">
                {result.issues.map((issue, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-muted/20">
                    {SEVERITY_ICON[issue.severity]}
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">{issue.category}</span>
                      <p className="text-sm text-foreground">{issue.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Doporučení pro klienta</h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border/50">
                    <div className="w-6 h-6 rounded-full bg-blue-900/40 text-blue-300 text-xs flex items-center justify-center shrink-0 font-bold">
                      {rec.priority}
                    </div>
                    <div>
                      <div className="font-medium text-sm text-foreground">{rec.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rec.description}</div>
                      <div className="text-xs text-emerald-400 mt-1">📈 {rec.impact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history && history.length > 0 && !result && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <History className="w-4 h-4" /> Historie auditů
          </h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-3 text-muted-foreground font-medium">Web</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Skóre</th>
                  <th className="text-left p-3 text-muted-foreground font-medium">Datum</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 10).map((h) => (
                  <tr key={h.id} className="border-b border-border/50">
                    <td className="p-3">
                      <div className="font-medium text-foreground">{h.businessName || h.url}</div>
                      <div className="text-xs text-muted-foreground">{h.url}</div>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${h.overallScore >= 70 ? "text-emerald-400" : h.overallScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                        {h.overallScore}/100
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(h.createdAt).toLocaleDateString("cs-CZ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !auditMutation.isPending && (!history || history.length === 0) && (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg font-medium">Zadej URL webu pro audit</p>
          <p className="text-sm mt-1">Systém analyzuje SEO, mobilní verzi, výkon a konverzní prvky</p>
        </div>
      )}
    </div>
  );
}
