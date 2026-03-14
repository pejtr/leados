import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Phone, Upload, Mic, FileAudio, Brain, CheckCircle2, Clock,
  TrendingUp, MessageSquare, User, Building2, AlertTriangle,
  ChevronDown, ChevronUp, Sparkles, BarChart3, Zap, Play,
  X, RefreshCw, Copy, ArrowRight,
} from "lucide-react";

type CallRecording = {
  id: number;
  leadId?: number;
  leadName?: string;
  companyName?: string;
  duration?: number;
  transcription?: string;
  summary?: string;
  sentiment?: string;
  nextSteps?: string;
  objections?: string;
  crmUpdated?: boolean;
  createdAt: number;
  status: string;
};

const sentimentColor = (s?: string) => {
  if (!s) return "#6b7280";
  if (s === "positive") return "#10b981";
  if (s === "negative") return "#ef4444";
  return "#f59e0b";
};

const sentimentLabel = (s?: string) => {
  if (s === "positive") return "Positive";
  if (s === "negative") return "Negative";
  return "Neutral";
};

export default function CallIntelligence() {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [leadId, setLeadId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: recordings = [], refetch } = trpc.calls.list.useQuery();
  const { data: stats } = trpc.calls.getStats.useQuery();
  const analyzeCall = trpc.calls.analyze.useMutation({
    onSuccess: () => { toast.success("Call analyzed!", { description: "AI insights and CRM entry ready." }); refetch(); setAnalyzing(null); },
    onError: (e) => { toast.error("Analysis failed", { description: e.message }); setAnalyzing(null); },
  });
  const updateCRM = trpc.calls.updateCRM.useMutation({
    onSuccess: () => { toast.success("CRM updated!"); refetch(); },
    onError: (e) => toast.error("CRM update failed", { description: e.message }),
  });

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const maxSize = 16 * 1024 * 1024;
    if (file.size > maxSize) { toast.error("File too large", { description: "Max 16MB" }); return; }
    const allowed = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/webm", "video/mp4"];
    if (!allowed.includes(file.type)) { toast.error("Unsupported format", { description: "Use MP3, WAV, OGG, MP4, or WebM" }); return; }

    setUploading(true);
    try {
      // Upload via tRPC (server handles S3 + transcription)
      const formData = new FormData();
      formData.append("file", file);
      if (leadId) formData.append("leadId", leadId);
      if (leadName) formData.append("leadName", leadName);
      if (companyName) formData.append("companyName", companyName);

      const response = await fetch("/api/calls/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();
      toast.success("Call uploaded!", { description: "Transcription in progress..." });
      setShowUpload(false);
      setLeadId(""); setLeadName(""); setCompanyName("");
      refetch();
      // Auto-analyze after upload
      if (result.id) {
        setAnalyzing(result.id);
        analyzeCall.mutate({ id: result.id });
      }
    } catch (e: any) {
      toast.error("Upload failed", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const STAT_CARDS = [
    { icon: Phone, label: "Total Calls", value: stats?.total ?? 0, color: "#8b5cf6" },
    { icon: TrendingUp, label: "Avg. Sentiment", value: stats?.avgSentiment ?? "N/A", color: "#10b981" },
    { icon: CheckCircle2, label: "CRM Updated", value: stats?.crmUpdated ?? 0, color: "#06b6d4" },
    { icon: Clock, label: "Total Duration", value: stats?.totalDuration ? `${Math.round(stats.totalDuration / 60)}m` : "0m", color: "#f59e0b" },
  ];

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6 space-y-6" style={{ background: "#050510" }}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))", border: "1px solid rgba(139,92,246,0.3)" }}>
                <Phone className="w-4 h-4" style={{ color: "#a78bfa" }} />
              </div>
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #fff 60%, rgba(255,255,255,0.5))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Call Intelligence
              </h1>
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
              Upload sales call recordings — AI transcribes, analyzes, and updates your CRM automatically.
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="h-9 px-4 text-sm font-semibold" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
            <Upload className="w-4 h-4 mr-2" /> Upload Call
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STAT_CARDS.map(({ icon: Icon, label, value, color }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="p-4 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4" style={{ color }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
              </div>
              <div className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>{value}</div>
            </motion.div>
          ))}
        </div>

        {/* Upload Modal */}
        <AnimatePresence>
          {showUpload && (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowUpload(false)} />
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="relative w-full max-w-md p-6 rounded-2xl z-10"
                style={{ background: "rgba(10,10,20,0.95)", border: "1px solid rgba(139,92,246,0.3)" }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Upload Call Recording</h3>
                  <button onClick={() => setShowUpload(false)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Lead Name (optional)</label>
                      <Input value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="John Smith" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                    </div>
                    <div>
                      <label className="text-xs mb-1 block" style={{ color: "rgba(255,255,255,0.5)" }}>Company (optional)</label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Acme Corp" className="h-9 text-sm" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }} />
                    </div>
                  </div>

                  <div
                    className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all"
                    style={{ borderColor: "rgba(139,92,246,0.3)", background: "rgba(139,92,246,0.05)" }}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                  >
                    <FileAudio className="w-10 h-10 mx-auto mb-3" style={{ color: "#8b5cf6" }} />
                    <p className="text-sm font-medium mb-1">Drop your call recording here</p>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>MP3, WAV, OGG, MP4, WebM · Max 16MB</p>
                    <input ref={fileInputRef} type="file" className="hidden" accept="audio/*,video/mp4" onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                  </div>

                  {uploading && (
                    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
                      <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#8b5cf6" }} />
                      <span className="text-sm" style={{ color: "#a78bfa" }}>Uploading and transcribing...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recordings List */}
        <div className="space-y-3">
          <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Call Recordings</h2>

          {(recordings as CallRecording[]).length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <Phone className="w-12 h-12 mx-auto mb-4" style={{ color: "rgba(139,92,246,0.4)" }} />
              <h3 className="font-bold text-lg mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>No calls yet</h3>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Upload your first sales call recording to get AI-powered insights.</p>
              <Button onClick={() => setShowUpload(true)} style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                <Upload className="w-4 h-4 mr-2" /> Upload First Call
              </Button>
            </motion.div>
          ) : (
            (recordings as CallRecording[]).map((rec, i) => (
              <motion.div key={rec.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Row */}
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpanded(expanded === rec.id ? null : rec.id)}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <Mic className="w-5 h-5" style={{ color: "#a78bfa" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {rec.leadName || "Unknown Lead"} {rec.companyName ? `— ${rec.companyName}` : ""}
                      </span>
                      {rec.sentiment && (
                        <Badge className="text-xs px-2 py-0.5" style={{ background: `${sentimentColor(rec.sentiment)}20`, border: `1px solid ${sentimentColor(rec.sentiment)}40`, color: sentimentColor(rec.sentiment) }}>
                          {sentimentLabel(rec.sentiment)}
                        </Badge>
                      )}
                      {rec.crmUpdated && (
                        <Badge className="text-xs px-2 py-0.5" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
                          CRM Updated
                        </Badge>
                      )}
                      {rec.status === "processing" && (
                        <Badge className="text-xs px-2 py-0.5" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b" }}>
                          <RefreshCw className="w-2.5 h-2.5 mr-1 animate-spin" /> Processing
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
                      {rec.duration && <span><Clock className="w-3 h-3 inline mr-0.5" />{Math.round(rec.duration / 60)}m {rec.duration % 60}s</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rec.transcription && !rec.summary && (
                      <Button size="sm" className="h-7 text-xs px-3" disabled={analyzing === rec.id}
                        onClick={e => { e.stopPropagation(); setAnalyzing(rec.id); analyzeCall.mutate({ id: rec.id }); }}
                        style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                        {analyzing === rec.id ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Brain className="w-3 h-3 mr-1" />}
                        Analyze
                      </Button>
                    )}
                    {rec.summary && !rec.crmUpdated && (
                      <Button size="sm" variant="outline" className="h-7 text-xs px-3"
                        onClick={e => { e.stopPropagation(); updateCRM.mutate({ id: rec.id }); }}
                        style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)", color: "#10b981" }}>
                        <Zap className="w-3 h-3 mr-1" /> Update CRM
                      </Button>
                    )}
                    {expanded === rec.id ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} /> : <ChevronDown className="w-4 h-4" style={{ color: "rgba(255,255,255,0.4)" }} />}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {expanded === rec.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {rec.summary && (
                          <div className="p-4 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4" style={{ color: "#a78bfa" }} />
                              <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>AI Summary</span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{rec.summary}</p>
                          </div>
                        )}
                        {rec.nextSteps && (
                          <div className="p-4 rounded-xl" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <ArrowRight className="w-4 h-4" style={{ color: "#10b981" }} />
                              <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Next Steps</span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{rec.nextSteps}</p>
                          </div>
                        )}
                        {rec.objections && (
                          <div className="p-4 rounded-xl" style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)" }}>
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-4 h-4" style={{ color: "#f59e0b" }} />
                              <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Objections Detected</span>
                            </div>
                            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{rec.objections}</p>
                          </div>
                        )}
                        {rec.transcription && (
                          <div className="p-4 rounded-xl lg:col-span-2" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" style={{ color: "#06b6d4" }} />
                                <span className="text-sm font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Transcription</span>
                              </div>
                              <Button size="sm" variant="outline" className="h-6 text-xs px-2"
                                onClick={() => { navigator.clipboard.writeText(rec.transcription!); toast.success("Copied!"); }}
                                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}>
                                <Copy className="w-3 h-3 mr-1" /> Copy
                              </Button>
                            </div>
                            <p className="text-xs leading-relaxed max-h-40 overflow-y-auto" style={{ color: "rgba(255,255,255,0.55)" }}>{rec.transcription}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
