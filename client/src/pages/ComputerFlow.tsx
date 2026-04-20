/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  COMPUTER FLOW — Live Multi-Brain Orchestration UI                          ║
 * ║  Perplexity-style parallel execution with real-time visual graph            ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Streamdown } from "streamdown";
import {
  Cpu, Zap, Brain, BarChart2, Target, Link2, Send, Download,
  ChevronDown, ChevronUp, Loader2, Sparkles, Clock, CheckCircle2,
  AlertCircle, Play, Settings2, Info
} from "lucide-react";

// ─── Brain Layer Config (mirrors server) ─────────────────────────────────────

const BRAIN_META: Record<string, { label: string; emoji: string; color: string; description: string; icon: React.ReactNode }> = {
  scout: {
    label: "Scout",
    emoji: "🔍",
    color: "#06b6d4",
    description: "Rychlá klasifikace a routing",
    icon: <Target className="h-4 w-4" />,
  },
  analyst: {
    label: "Analyst",
    emoji: "📊",
    color: "#818cf8",
    description: "Hloubková datová analýza",
    icon: <BarChart2 className="h-4 w-4" />,
  },
  strategist: {
    label: "Strategist",
    emoji: "🧠",
    color: "#c084fc",
    description: "Strategická doporučení",
    icon: <Brain className="h-4 w-4" />,
  },
  deep_think: {
    label: "Deep Think",
    emoji: "⚡",
    color: "#fb923c",
    description: "Gemini 2.5 Pro — komplexní reasoning",
    icon: <Zap className="h-4 w-4" />,
  },
  synthesizer: {
    label: "Synthesizer",
    emoji: "🔗",
    color: "#34d399",
    description: "Finální unifikace výstupů",
    icon: <Link2 className="h-4 w-4" />,
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FlowPhase = "idle" | "decomposing" | "executing" | "synthesizing" | "done" | "error";

interface SubTaskState {
  id: string;
  title: string;
  layer: string;
  description?: string;
  status: "pending" | "running" | "done" | "error";
  content?: string;
  durationMs?: number;
  expanded: boolean;
}

const DOMAIN_OPTIONS = [
  { value: "general", label: "Obecné", emoji: "🌐" },
  { value: "lead_gen", label: "Lead Generation", emoji: "🎯" },
  { value: "strategy", label: "Strategie", emoji: "♟️" },
  { value: "analysis", label: "Analýza dat", emoji: "📊" },
  { value: "outreach", label: "Outreach", emoji: "✉️" },
  { value: "dach", label: "DACH Expanze", emoji: "🇩🇪" },
];

// ─── Animated Brain Node ──────────────────────────────────────────────────────

function BrainNode({
  layer,
  status,
  durationMs,
  index,
  total,
}: {
  layer: string;
  status: "pending" | "running" | "done" | "error";
  durationMs?: number;
  index: number;
  total: number;
}) {
  const meta = BRAIN_META[layer] ?? BRAIN_META.analyst;
  const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
  const radius = 110;
  const cx = 160 + radius * Math.cos(angle);
  const cy = 160 + radius * Math.sin(angle);

  return (
    <g>
      {/* Connection line to center */}
      <line
        x1="160" y1="160"
        x2={cx} y2={cy}
        stroke={status === "done" ? meta.color : status === "running" ? meta.color : "#1e293b"}
        strokeWidth={status === "running" ? 2 : 1}
        strokeDasharray={status === "running" ? "4 4" : undefined}
        opacity={status === "pending" ? 0.3 : 0.8}
      >
        {status === "running" && (
          <animate attributeName="stroke-dashoffset" from="0" to="8" dur="0.5s" repeatCount="indefinite" />
        )}
      </line>

      {/* Node circle */}
      <circle
        cx={cx} cy={cy} r={28}
        fill={status === "done" ? `${meta.color}22` : status === "running" ? `${meta.color}33` : "#0f172a"}
        stroke={status === "pending" ? "#1e293b" : meta.color}
        strokeWidth={status === "running" ? 2 : 1}
        opacity={status === "pending" ? 0.5 : 1}
      >
        {status === "running" && (
          <animate attributeName="r" values="28;30;28" dur="1s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Emoji */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="16" dominantBaseline="middle">
        {meta.emoji}
      </text>

      {/* Label */}
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={meta.color} fontWeight="600">
        {meta.label}
      </text>

      {/* Duration badge */}
      {durationMs && (
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="8" fill="#64748b">
          {(durationMs / 1000).toFixed(1)}s
        </text>
      )}
    </g>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ComputerFlow() {
  const [query, setQuery] = useState("");
  const [domain, setDomain] = useState("general");
  const [maxSubTasks, setMaxSubTasks] = useState(4);
  const [enableDeepThink, setEnableDeepThink] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [phase, setPhase] = useState<FlowPhase>("idle");
  const [subTasks, setSubTasks] = useState<SubTaskState[]>([]);
  const [synthesis, setSynthesis] = useState("");
  const [totalMs, setTotalMs] = useState(0);
  const [decompositionMs, setDecompositionMs] = useState(0);
  const [executionMs, setExecutionMs] = useState(0);
  const [synthesisMs, setSynthesisMs] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [flowId, setFlowId] = useState("");

  const synthRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef<HTMLTextAreaElement>(null);

  const flowMutation = trpc.hermes.computerFlow.useMutation({
    onSuccess: (data) => {
      // Update sub-tasks with results
      setSubTasks(data.subTasks.map((t, i) => {
        const result = data.results.find((r) => r.taskId === t.id);
        return {
          id: t.id,
          title: t.title,
          layer: t.layer,
          description: t.description,
          status: "done",
          content: result?.content,
          durationMs: result?.durationMs,
          expanded: false,
        };
      }));
      setSynthesis(data.synthesis);
      setTotalMs(data.totalDurationMs);
      setDecompositionMs(data.decompositionMs);
      setExecutionMs(data.executionMs);
      setSynthesisMs(data.synthesisMs);
      setFlowId(data.flowId);
      setPhase("done");
    },
    onError: (err) => {
      setErrorMsg(err.message);
      setPhase("error");
    },
    onMutate: () => {
      setPhase("decomposing");
      setSubTasks([]);
      setSynthesis("");
      setErrorMsg("");

      // Simulate phase transitions
      setTimeout(() => setPhase("executing"), 2500);
      setTimeout(() => setPhase("synthesizing"), 8000);
    },
  });

  const handleRun = useCallback(() => {
    if (!query.trim() || flowMutation.isPending) return;
    flowMutation.mutate({
      query: query.trim(),
      domain,
      maxSubTasks,
      enableDeepThink,
    });
  }, [query, domain, maxSubTasks, enableDeepThink, flowMutation]);

  // Scroll synthesis into view when done
  useEffect(() => {
    if (phase === "done" && synthRef.current) {
      setTimeout(() => synthRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }
  }, [phase]);

  const handleDownload = () => {
    if (!synthesis) return;
    const content = `# Computer Flow Result\n\n**Query:** ${query}\n**Flow ID:** ${flowId}\n**Total time:** ${(totalMs / 1000).toFixed(1)}s\n\n---\n\n## Brain Layer Outputs\n\n${subTasks.map(t => {
      const meta = BRAIN_META[t.layer] ?? BRAIN_META.analyst;
      return `### ${meta.emoji} ${meta.label}: ${t.title}\n${t.content ?? ""}`;
    }).join("\n\n---\n\n")}\n\n---\n\n## Synthesis\n\n${synthesis}`;

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `computer-flow-${flowId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isRunning = flowMutation.isPending;

  // Render sub-task nodes for the graph
  const graphTasks: SubTaskState[] = subTasks.length > 0 ? subTasks : (
    phase === "decomposing" ? [] : []
  );

  // Placeholder nodes while decomposing
  const placeholderLayers = ["scout", "analyst", "strategist", "analyst"];
  const graphNodes = graphTasks.length > 0
    ? graphTasks
    : (isRunning ? placeholderLayers.slice(0, maxSubTasks).map((l, i) => ({
        id: `p${i}`, title: "...", layer: l, status: "pending" as const, expanded: false,
      })) : []);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full min-h-0 bg-slate-950">
        {/* ── Header ── */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Cpu className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Computer Flow</h1>
                <p className="text-xs text-slate-500">Perplexity-style multi-brain parallel orchestration</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {phase === "done" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="h-8 gap-1.5 text-xs border-slate-700 text-slate-300 hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export MD
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className={cn("h-8 w-8 p-0", showSettings ? "text-cyan-400" : "text-slate-500")}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Domain:</span>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-cyan-500/50"
                >
                  {DOMAIN_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Sub-tasks:</span>
                <div className="flex gap-1">
                  {[2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMaxSubTasks(n)}
                      className={cn(
                        "w-7 h-7 rounded-lg text-xs font-semibold transition-all",
                        maxSubTasks === n
                          ? "bg-cyan-600 text-white"
                          : "bg-slate-900 border border-slate-700 text-slate-400 hover:border-cyan-500/50"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEnableDeepThink(!enableDeepThink)}
                  className={cn(
                    "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all",
                    enableDeepThink
                      ? "border-orange-500/50 bg-orange-900/20 text-orange-300"
                      : "border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-600"
                  )}
                >
                  <Zap className="h-3 w-3" />
                  Deep Think (Gemini 2.5 Pro)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

            {/* ── Query Input ── */}
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10 blur-xl" />
              <div className="relative bg-slate-900/80 border border-slate-700/60 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <textarea
                      ref={queryRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleRun();
                        }
                      }}
                      placeholder="Zadej komplexní otázku nebo úkol... (Ctrl+Enter pro spuštění)"
                      rows={3}
                      disabled={isRunning}
                      className="w-full bg-transparent text-slate-200 placeholder-slate-600 text-sm resize-none focus:outline-none leading-relaxed"
                    />
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800">
                      <div className="flex gap-2 flex-wrap">
                        {[
                          "Jak maximalizovat konverzní poměr mých leadů z DACH trhu?",
                          "Analyzuj moji pipeline a navrhni 3 quick wins pro tento týden",
                          "Jaká je optimální cena pro B2B SaaS v segmentu fintech?",
                          "Vytvoř GTM strategii pro expanzi do Německa",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() => setQuery(q)}
                            disabled={isRunning}
                            className="text-xs text-slate-500 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/30 rounded-lg px-2 py-1 bg-slate-950/50 transition-all truncate max-w-[200px]"
                          >
                            {q.slice(0, 35)}...
                          </button>
                        ))}
                      </div>
                      <Button
                        onClick={handleRun}
                        disabled={!query.trim() || isRunning}
                        className="h-9 px-4 bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white border-0 rounded-xl shrink-0 gap-1.5"
                      >
                        {isRunning ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Probíhá...</>
                        ) : (
                          <><Play className="h-4 w-4" /> Spustit Flow</>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Flow Visualization ── */}
            {(isRunning || phase === "done") && (
              <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <Cpu className="h-4 w-4 text-cyan-400" />
                    Execution Graph
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    {phase === "decomposing" && (
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Decomposing...
                      </span>
                    )}
                    {phase === "executing" && (
                      <span className="flex items-center gap-1 text-violet-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Parallel execution...
                      </span>
                    )}
                    {phase === "synthesizing" && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Loader2 className="h-3 w-3 animate-spin" /> Synthesizing...
                      </span>
                    )}
                    {phase === "done" && (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /> Done in {(totalMs / 1000).toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 items-start">
                  {/* SVG Graph */}
                  <div className="shrink-0">
                    <svg width="320" height="320" viewBox="0 0 320 320">
                      {/* Background grid */}
                      <defs>
                        <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#0f172a" stopOpacity="0" />
                          <stop offset="100%" stopColor="#020617" stopOpacity="0.8" />
                        </radialGradient>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Outer ring */}
                      <circle cx="160" cy="160" r="140" fill="none" stroke="#1e293b" strokeWidth="1" />
                      <circle cx="160" cy="160" r="110" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="4 4" />

                      {/* Brain nodes */}
                      {graphNodes.map((task, i) => (
                        <BrainNode
                          key={task.id}
                          layer={task.layer}
                          status={phase === "done" ? "done" : phase === "executing" ? "running" : "pending"}
                          durationMs={task.durationMs}
                          index={i}
                          total={graphNodes.length}
                        />
                      ))}

                      {/* Center orchestrator */}
                      <circle cx="160" cy="160" r="36"
                        fill={phase === "synthesizing" ? "#06b6d422" : phase === "done" ? "#34d39922" : "#0f172a"}
                        stroke={phase === "done" ? "#34d399" : phase === "synthesizing" ? "#06b6d4" : "#334155"}
                        strokeWidth="2"
                        filter="url(#glow)"
                      >
                        {isRunning && (
                          <animate attributeName="r" values="36;38;36" dur="2s" repeatCount="indefinite" />
                        )}
                      </circle>
                      <text x="160" y="154" textAnchor="middle" fontSize="20" dominantBaseline="middle">
                        {phase === "done" ? "✅" : phase === "synthesizing" ? "🔗" : "🧬"}
                      </text>
                      <text x="160" y="174" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="600">
                        HERMES
                      </text>
                      <text x="160" y="184" textAnchor="middle" fontSize="8" fill="#475569">
                        Computer Flow
                      </text>
                    </svg>
                  </div>

                  {/* Sub-task list */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Timing stats */}
                    {phase === "done" && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: "Decompose", value: decompositionMs, color: "text-cyan-400" },
                          { label: "Execute", value: executionMs, color: "text-violet-400" },
                          { label: "Synthesize", value: synthesisMs, color: "text-emerald-400" },
                        ].map((s) => (
                          <div key={s.label} className="bg-slate-950/60 rounded-xl p-2.5 text-center">
                            <p className={cn("text-sm font-bold tabular-nums", s.color)}>
                              {(s.value / 1000).toFixed(1)}s
                            </p>
                            <p className="text-xs text-slate-600">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Sub-task cards */}
                    {graphNodes.map((task) => {
                      const meta = BRAIN_META[task.layer] ?? BRAIN_META.analyst;
                      const isDone = task.status === "done";
                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "rounded-xl border transition-all",
                            isDone
                              ? "border-slate-700/60 bg-slate-950/60"
                              : "border-slate-800/40 bg-slate-950/40"
                          )}
                        >
                          <button
                            className="w-full flex items-center gap-2.5 p-3 text-left"
                            onClick={() => {
                              if (!isDone) return;
                              setSubTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id ? { ...t, expanded: !t.expanded } : t
                                )
                              );
                            }}
                          >
                            <span className="text-base leading-none">{meta.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-300 truncate">
                                {task.title || meta.label}
                              </p>
                              <p className="text-xs text-slate-600">{meta.label} layer</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {task.durationMs && (
                                <span className="text-xs text-slate-600 flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" />
                                  {(task.durationMs / 1000).toFixed(1)}s
                                </span>
                              )}
                              {isDone ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                              ) : isRunning ? (
                                <Loader2 className="h-3.5 w-3.5 text-slate-500 animate-spin" />
                              ) : null}
                              {isDone && task.content && (
                                task.expanded
                                  ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                                  : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
                              )}
                            </div>
                          </button>
                          {task.expanded && task.content && (
                            <div className="px-3 pb-3 border-t border-slate-800/60">
                              <div className="mt-2 text-xs text-slate-400 leading-relaxed max-h-48 overflow-y-auto">
                                <Streamdown>{task.content}</Streamdown>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Synthesizer node */}
                    {(phase === "synthesizing" || phase === "done") && (
                      <div className={cn(
                        "rounded-xl border p-3 flex items-center gap-2.5",
                        phase === "done"
                          ? "border-emerald-500/30 bg-emerald-900/10"
                          : "border-slate-700/60 bg-slate-950/60"
                      )}>
                        <span className="text-base">🔗</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-300">Synthesizer</p>
                          <p className="text-xs text-slate-600">Finální unifikace výstupů</p>
                        </div>
                        {phase === "synthesizing" ? (
                          <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Error ── */}
            {phase === "error" && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Flow Error</p>
                  <p className="text-xs text-red-400 mt-1">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* ── Synthesis Result ── */}
            {synthesis && (
              <div ref={synthRef} className="bg-slate-900/60 border border-slate-700/60 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-gradient-to-r from-emerald-900/20 to-cyan-900/20">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-white">Synthesized Result</span>
                    <span className="text-xs text-slate-500">— unified output from {subTasks.length} brain layers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {(totalMs / 1000).toFixed(1)}s total
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-slate-300"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="px-6 py-5 text-sm text-slate-200 leading-relaxed">
                  <Streamdown>{synthesis}</Streamdown>
                </div>
              </div>
            )}

            {/* ── Idle state ── */}
            {phase === "idle" && (
              <div className="text-center py-16">
                <div className="relative inline-block mb-6">
                  {/* Circular brain visualization */}
                  <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                    <defs>
                      <radialGradient id="idleGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.05" />
                      </radialGradient>
                    </defs>
                    <circle cx="100" cy="100" r="90" fill="url(#idleGrad)" stroke="#1e293b" strokeWidth="1" />
                    <circle cx="100" cy="100" r="60" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3 3" />
                    {Object.entries(BRAIN_META).filter(([k]) => k !== "synthesizer").map(([key, meta], i, arr) => {
                      const angle = (i / arr.length) * 2 * Math.PI - Math.PI / 2;
                      const r = 65;
                      const x = 100 + r * Math.cos(angle);
                      const y = 100 + r * Math.sin(angle);
                      return (
                        <g key={key}>
                          <line x1="100" y1="100" x2={x} y2={y} stroke="#1e293b" strokeWidth="1" />
                          <circle cx={x} cy={y} r="20" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                          <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="14">{meta.emoji}</text>
                        </g>
                      );
                    })}
                    <circle cx="100" cy="100" r="28" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <text x="100" y="96" textAnchor="middle" dominantBaseline="middle" fontSize="18">🧬</text>
                    <text x="100" y="114" textAnchor="middle" fontSize="8" fill="#64748b">HERMES</text>
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Computer Flow</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto mb-1">
                  Zadej komplexní otázku. HERMES ji rozloží na specializované sub-úkoly,
                  spustí je paralelně přes různé brain vrstvy a syntetizuje dokonalý výsledek.
                </p>
                <p className="text-slate-600 text-xs max-w-sm mx-auto">
                  Inspirováno Perplexity Computer Use · Powered by Gemini 2.5 Flash + Pro
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
