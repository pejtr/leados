import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Cpu,
  Play,
  Trophy,
  Target,
  Zap,
  Shield,
  Brain,
  BarChart3,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Layers,
  FlaskConical,
} from "lucide-react";

const C = {
  teal: "#00D4C8",
  indigo: "#6B4FE8",
  bgLight: "#F4F6FB",
  bgCard: "#FFFFFF",
  bgDark: "#0D1B2A",
  textPrimary: "#0D1B2A",
  textSecondary: "#64748B",
  emerald: "#4ECBA0",
  amber: "#F59E0B",
  rose: "#F43F5E",
};

const AGENT_OPTIONS = [
  { id: "prospector", label: "Lead Prospector", icon: Target, color: C.teal, description: "Lead qualification & signal analysis" },
  { id: "copywriter", label: "Outreach Copywriter", icon: Zap, color: C.indigo, description: "Icebreaker & email generation" },
  { id: "analyst", label: "Data Analyst", icon: BarChart3, color: C.emerald, description: "Pattern recognition & scoring" },
  { id: "strategist", label: "Strategic Orchestrator", icon: Brain, color: "#8B5CF6", description: "ICP & go-to-market strategy" },
  { id: "advisor", label: "Sales Advisor", icon: Shield, color: "#F59E0B", description: "Deal coaching & objection handling" },
  { id: "synthesizer", label: "Master Synthesizer", icon: Layers, color: "#EC4899", description: "Multi-agent synthesis" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: C.emerald,
  medium: C.amber,
  hard: C.rose,
  expert: "#8B5CF6",
};

const TIER_LABELS: Record<number, string> = {
  1: "Lead Qualification",
  2: "Icebreaker Quality",
  3: "Multi-Signal Reasoning",
  4: "Adversarial Robustness",
};

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (score / 100) * circumference;
  const color = score >= 80 ? C.emerald : score >= 60 ? C.amber : C.rose;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: size * 0.22, fontWeight: 700, color: C.textPrimary, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.14, color: C.textSecondary }}>/ 100</span>
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onRun,
  isRunning,
  result,
}: {
  task: any;
  onRun: () => void;
  isRunning: boolean;
  result?: any;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: C.bgCard,
        borderRadius: 12,
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        marginBottom: 12,
      }}
    >
      <div
        style={{
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          cursor: "pointer",
        }}
        onClick={() => result && setExpanded(!expanded)}
      >
        {/* Tier badge */}
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: `${C.teal}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: C.teal }}>T{task.tier}</span>
        </div>

        {/* Task info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary }}>{task.name}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 20,
                background: `${DIFFICULTY_COLORS[task.difficulty]}20`,
                color: DIFFICULTY_COLORS[task.difficulty],
              }}
            >
              {task.difficulty}
            </span>
          </div>
          <span style={{ fontSize: 12, color: C.textSecondary }}>{task.category}</span>
        </div>

        {/* Score or run button */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {result ? (
            <>
              <ScoreRing score={result.score} size={52} />
              {result.passed ? (
                <CheckCircle2 size={18} color={C.emerald} />
              ) : (
                <XCircle size={18} color={C.rose} />
              )}
              {expanded ? <ChevronUp size={16} color={C.textSecondary} /> : <ChevronDown size={16} color={C.textSecondary} />}
            </>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRun();
              }}
              disabled={isRunning}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: isRunning ? "#E2E8F0" : `linear-gradient(135deg, ${C.teal}, ${C.indigo})`,
                color: isRunning ? C.textSecondary : "#fff",
                border: "none",
                cursor: isRunning ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {isRunning ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Play size={14} />}
              {isRunning ? "Running..." : "Run Test"}
            </button>
          )}
        </div>
      </div>

      {/* Expanded result */}
      <AnimatePresence>
        {expanded && result && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F1F5F9" }}>
              {/* Breakdown */}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Score Breakdown
                </p>
                {Object.entries(result.breakdown).map(([criterion, score]: [string, any]) => (
                  <div key={criterion} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color: C.textPrimary }}>{criterion}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: score >= 70 ? C.emerald : C.rose }}>{score}%</span>
                    </div>
                    <div style={{ height: 4, background: "#E2E8F0", borderRadius: 2 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${score}%`,
                          background: score >= 70 ? C.emerald : score >= 50 ? C.amber : C.rose,
                          borderRadius: 2,
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#F8FAFC",
                  borderRadius: 8,
                  borderLeft: `3px solid ${C.teal}`,
                }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 4 }}>Evaluator Feedback</p>
                <p style={{ fontSize: 13, color: C.textPrimary, lineHeight: 1.6 }}>{result.feedback}</p>
              </div>

              {/* Agent response preview */}
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary, marginBottom: 6 }}>Agent Response</p>
                <div
                  style={{
                    background: C.bgDark,
                    borderRadius: 8,
                    padding: 12,
                    maxHeight: 200,
                    overflowY: "auto",
                  }}
                >
                  <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {result.agentResponse}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AgentBenchmark() {
  const [selectedAgent, setSelectedAgent] = useState<string>("prospector");
  const [taskResults, setTaskResults] = useState<Record<string, any>>({});
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [suiteResult, setSuiteResult] = useState<any>(null);
  const [runningSuite, setRunningSuite] = useState(false);

  const { data: tasks, isLoading: tasksLoading } = trpc.benchmark.listTasks.useQuery();

  const runTask = trpc.benchmark.runTask.useMutation({
    onSuccess: (data) => {
      setTaskResults((prev) => ({ ...prev, [data.taskId]: data }));
      setRunningTaskId(null);
      toast.success(`Task "${data.taskName}" completed — Score: ${data.score}/100`);
    },
    onError: (err) => {
      setRunningTaskId(null);
      toast.error(`Task failed: ${err.message}`);
    },
  });

  const runSuite = trpc.benchmark.runFullSuite.useMutation({
    onSuccess: (data) => {
      setSuiteResult(data);
      setRunningSuite(false);
      // Populate individual task results from suite
      data.results.forEach((r: any) => {
        setTaskResults((prev) => ({ ...prev, [r.taskId]: r }));
      });
      toast.success(`Full benchmark complete — Overall score: ${data.totalScore}/100`);
    },
    onError: (err) => {
      setRunningSuite(false);
      toast.error(`Suite failed: ${err.message}`);
    },
  });

  const handleRunTask = (taskId: string) => {
    setRunningTaskId(taskId);
    runTask.mutate({ taskId, agentId: selectedAgent as any });
  };

  const handleRunSuite = () => {
    setRunningSuite(true);
    setSuiteResult(null);
    setTaskResults({});
    runSuite.mutate({ agentId: selectedAgent as any });
  };

  const selectedAgentInfo = AGENT_OPTIONS.find((a) => a.id === selectedAgent);

  return (
    <div style={{ padding: "32px 40px", background: C.bgLight, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: `linear-gradient(135deg, ${C.teal}, ${C.indigo})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FlaskConical size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, margin: 0 }}>Agent Benchmark</h1>
            <p style={{ fontSize: 14, color: C.textSecondary, margin: 0 }}>ARC-AGI inspired evaluation framework for LeadOS agents</p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
        {/* Left panel — Agent selector + suite controls */}
        <div>
          {/* Agent selector */}
          <div
            style={{
              background: C.bgCard,
              borderRadius: 16,
              padding: 20,
              border: "1px solid #E2E8F0",
              marginBottom: 16,
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Select Agent
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {AGENT_OPTIONS.map((agent) => {
                const Icon = agent.icon;
                const isSelected = selectedAgent === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 10,
                      border: isSelected ? `2px solid ${agent.color}` : "2px solid transparent",
                      background: isSelected ? `${agent.color}10` : "#F8FAFC",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "left",
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: `${agent.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} color={agent.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, margin: 0 }}>{agent.label}</p>
                      <p style={{ fontSize: 11, color: C.textSecondary, margin: 0 }}>{agent.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run full suite button */}
          <button
            onClick={handleRunSuite}
            disabled={runningSuite}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 12,
              background: runningSuite
                ? "#E2E8F0"
                : `linear-gradient(135deg, ${C.teal}, ${C.indigo})`,
              color: runningSuite ? C.textSecondary : "#fff",
              border: "none",
              cursor: runningSuite ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            {runningSuite ? (
              <>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Running Full Suite...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Run Full Benchmark Suite
              </>
            )}
          </button>

          {/* Suite result summary */}
          {suiteResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: C.bgDark,
                borderRadius: 16,
                padding: 20,
                color: "#fff",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#94A3B8", margin: 0 }}>Overall Score</p>
                <Trophy size={18} color={C.amber} />
              </div>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <ScoreRing score={suiteResult.totalScore} size={100} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                <div style={{ background: "#ffffff10", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.teal, margin: 0 }}>{suiteResult.passRate}%</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>Pass Rate</p>
                </div>
                <div style={{ background: "#ffffff10", borderRadius: 8, padding: "10px 12px", textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.indigo, margin: 0 }}>{suiteResult.arcAgiEquivalent}</p>
                  <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>ARC-AGI Score</p>
                </div>
              </div>
              {/* Tier breakdown */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Tier Breakdown
                </p>
                {suiteResult.tierBreakdown.map((tier: any) => (
                  <div key={tier.tier} style={{ marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "#94A3B8" }}>
                        T{tier.tier}: {TIER_LABELS[tier.tier]}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: tier.avgScore >= 70 ? C.emerald : C.rose }}>
                        {tier.avgScore}/100
                      </span>
                    </div>
                    <div style={{ height: 3, background: "#ffffff15", borderRadius: 2 }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${tier.avgScore}%`,
                          background: tier.avgScore >= 70 ? C.emerald : tier.avgScore >= 50 ? C.amber : C.rose,
                          borderRadius: 2,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right panel — Task list */}
        <div>
          {/* Tier sections */}
          {[1, 2, 3, 4].map((tier) => {
            const tierTasks = tasks?.filter((t) => t.tier === tier) ?? [];
            return (
              <div key={tier} style={{ marginBottom: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    style={{
                      padding: "4px 12px",
                      borderRadius: 20,
                      background: `${C.teal}15`,
                      border: `1px solid ${C.teal}30`,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.teal }}>TIER {tier}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>{TIER_LABELS[tier]}</span>
                  <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  <span style={{ fontSize: 12, color: C.textSecondary }}>{tierTasks.length} tasks</span>
                </div>

                {tasksLoading ? (
                  <div style={{ padding: 20, textAlign: "center" }}>
                    <Loader2 size={20} color={C.teal} style={{ animation: "spin 1s linear infinite" }} />
                  </div>
                ) : (
                  tierTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onRun={() => handleRunTask(task.id)}
                      isRunning={runningTaskId === task.id}
                      result={taskResults[task.id]}
                    />
                  ))
                )}
              </div>
            );
          })}

          {/* ARC-AGI info banner */}
          <div
            style={{
              background: `linear-gradient(135deg, ${C.bgDark}, #1a2d45)`,
              borderRadius: 16,
              padding: 20,
              display: "flex",
              gap: 16,
              alignItems: "flex-start",
            }}
          >
            <Cpu size={24} color={C.teal} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: "0 0 6px" }}>
                ARC-AGI 3 Inspired Methodology
              </p>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>
                This benchmark adapts ARC-AGI 3 principles to B2B sales intelligence: novel task environments,
                skill-acquisition efficiency, long-horizon reasoning, and adversarial robustness testing.
                A 100% score means the agent performs at human expert level across all task types.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
