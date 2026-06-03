/**
 * HERA Command Center — Core AI Orchestration Interface
 * Aesthetic: Stargate Atlantis / Návštěvníci — deep space command center,
 * circular HUD elements, teal/cyan energy lines, dark void background
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Streamdown } from "streamdown";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Zap, Send, Bot, Brain, Target, BarChart3, Shield, Cpu, Swords,
  ChevronRight, Play, Clock, CheckCircle2, AlertCircle, Loader2,
  MessageSquare, History, Rocket, FlaskConical, Layers, Activity,
  RefreshCw, Plus, X, ChevronDown, ChevronUp, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HERMES_EXPERTS, buildMastermindPrompt, DEFAULT_MASTERMIND_IDS, type HermesExpert } from "../../../shared/hermesMastermind";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  id: number;
  role: "user" | "hermes" | "sub_agent";
  content: string;
  agentName?: string;
  metadata?: {
    intent?: string;
    agentsUsed?: string[];
    routingDecision?: string;
    missionType?: string;
  };
  createdAt: number;
}

interface MissionTemplate {
  type: string;
  title: string;
  description: string;
  emoji: string;
  estimatedMinutes: number;
  stepCount: number;
}

interface SubAgent {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

// ─── Sub-Agent Icon Map ───────────────────────────────────────────────────────

const AGENT_ICONS: Record<string, React.ReactNode> = {
  prospector: <Target className="h-4 w-4" />,
  copywriter: <MessageSquare className="h-4 w-4" />,
  analyst: <BarChart3 className="h-4 w-4" />,
  strategist: <Brain className="h-4 w-4" />,
  advisor: <Shield className="h-4 w-4" />,
  synthesizer: <Layers className="h-4 w-4" />,
  ninja: <Swords className="h-4 w-4" />,
  hermes: <Zap className="h-4 w-4" />,
};

const INTENT_COLORS: Record<string, string> = {
  lead_gen: "text-cyan-400",
  outreach: "text-violet-400",
  analysis: "text-emerald-400",
  strategy: "text-purple-400",
  deal_coaching: "text-amber-400",
  pentest: "text-red-400",
  synthesis: "text-pink-400",
  mission: "text-orange-400",
  general: "text-slate-400",
};

const INTENT_LABELS: Record<string, string> = {
  lead_gen: "leady",
  outreach: "outreach",
  analysis: "analýza",
  strategy: "strategie",
  deal_coaching: "deal coaching",
  pentest: "pentest",
  synthesis: "syntéza",
  mission: "mise",
  general: "obecné",
};

// ─── Circular HUD Background ──────────────────────────────────────────────────

function HermesHUD() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Outer ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-cyan-500/10 animate-[spin_60s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-cyan-400/8 animate-[spin_40s_linear_infinite_reverse]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-teal-400/10 animate-[spin_25s_linear_infinite]" />
      {/* Donut glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full bg-cyan-500/3 blur-3xl" />
      {/* Grid lines */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #00D4C8 1px, transparent 1px), linear-gradient(to bottom, #00D4C8 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
    </div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────

function MissionCard({
  mission,
  onLaunch,
  isRunning,
}: {
  mission: MissionTemplate;
  onLaunch: (type: string) => void;
  isRunning: boolean;
}) {
  return (
    <button
      onClick={() => onLaunch(mission.type)}
      disabled={isRunning}
      className={cn(
        "group w-full text-left p-3 rounded-lg border transition-all duration-200",
        "bg-slate-900/60 border-slate-700/50 hover:border-cyan-500/40 hover:bg-slate-800/80",
        isRunning && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl leading-none mt-0.5">{mission.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
            {mission.title}
          </p>
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{mission.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{mission.estimatedMinutes}m
            </span>
            <span className="text-xs text-slate-600 flex items-center gap-1">
              <Layers className="h-3 w-3" />
              {mission.stepCount} kroků
            </span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 mt-1" />
      </div>
    </button>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const agentColor = msg.metadata?.agentsUsed?.includes("ninja")
    ? "border-red-500/30 bg-red-950/20"
    : "border-cyan-500/20 bg-slate-900/80";

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm border",
          isUser
            ? "bg-violet-900/60 border-violet-500/30 text-violet-300"
            : "bg-slate-900/80 border-cyan-500/30 text-cyan-400"
        )}
      >
        {isUser ? "U" : <img src="/manus-storage/hera-avatar-small_f7206405.png" alt="HERA" className="w-full h-full object-cover object-top rounded-full" />}
      </div>

      {/* Content */}
      <div className={cn("flex-1 min-w-0 max-w-[85%]", isUser ? "items-end" : "items-start")}>
        {/* Header */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-cyan-400 tracking-wider">HERA</span>
            {msg.metadata?.routingDecision && (
              <span className="text-xs text-slate-500 italic">
                {msg.metadata.routingDecision}
              </span>
            )}
            {msg.metadata?.intent && (
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0 border-slate-700",
                  INTENT_COLORS[msg.metadata.intent] ?? "text-slate-400"
                )}
              >
                {INTENT_LABELS[msg.metadata.intent] ?? msg.metadata.intent.replace("_", " ")}
              </Badge>
            )}
            {msg.metadata?.agentsUsed && msg.metadata.agentsUsed.length > 0 && (
              <div className="flex items-center gap-1">
                {msg.metadata.agentsUsed.map((a) => (
                  <span
                    key={a}
                    className="text-xs text-slate-500 flex items-center gap-0.5"
                    title={a}
                  >
                    {AGENT_ICONS[a] ?? <Bot className="h-3 w-3" />}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm border",
            isUser
              ? "bg-violet-900/40 border-violet-500/30 text-slate-200 rounded-tr-sm"
              : cn(agentColor, "text-slate-200 rounded-tl-sm")
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{msg.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              <Streamdown>{msg.content}</Streamdown>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className={cn("text-xs text-slate-600 mt-1", isUser ? "text-right" : "text-left")}>
          {new Date(msg.createdAt).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ─── Mission Result Panel ─────────────────────────────────────────────────────

function MissionResultPanel({
  result,
  onClose,
}: {
  result: any;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-cyan-500/30 rounded-xl bg-slate-900/90 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-semibold text-cyan-300">{result.title}</span>
          <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">
            {(result.totalDuration / 1000).toFixed(1)}s
          </Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-sm text-slate-300 leading-relaxed">
        <Streamdown>{result.synthesis}</Streamdown>
      </div>

      {result.keyInsights?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Key Insights</p>
          <ul className="space-y-1">
            {result.keyInsights.map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-cyan-500 mt-0.5 shrink-0">▸</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.nextActions?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Next Actions</p>
          <ul className="space-y-1">
            {result.nextActions.map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-500 mt-0.5 shrink-0">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? "Skrýt" : "Zobrazit"} kroky ({result.steps?.length} kroků)
      </button>

      {expanded && result.steps && (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          {result.steps.map((step: any, i: number) => (
            <div key={i} className="text-xs border border-slate-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-slate-500">{i + 1}.</span>
                <span className="text-slate-300 font-medium">{step.step}</span>
                <Badge variant="outline" className="text-xs border-slate-700 text-slate-500">
                  {AGENT_ICONS[step.agent]} {step.agent}
                </Badge>
              </div>
              <p className="text-slate-500 line-clamp-3">{step.output}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DSR Live Performance Panel ─────────────────────────────────────────────

function DsrLivePanel() {
  const { data, isLoading } = trpc.deepSleep.analytics.useQuery(undefined, {
    staleTime: 60_000,
    retry: false,
  });

  const kpis = (data as any)?.kpis ?? data;

  return (
    <div className="border-t border-slate-800 pt-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        DeepSleepReset
      </p>
      {isLoading ? (
        <div className="flex items-center gap-1.5 text-xs text-slate-600">
          <Loader2 className="h-3 w-3 animate-spin" />
          Načítám...
        </div>
      ) : kpis ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Tržby celkem</span>
            <span className="text-sm font-bold text-emerald-400">${parseFloat(kpis.totalRevenueUsd ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Dnes</span>
            <span className="text-sm font-bold text-cyan-400">${parseFloat(kpis.todayRevenueUsd ?? 0).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Objednávky</span>
            <span className="text-sm font-bold text-violet-400">{kpis.totalOrders ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Konverze</span>
            <span className="text-sm font-bold text-amber-400">{parseFloat(kpis.conversionRatePct ?? 0).toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Leady</span>
            <span className="text-sm font-bold text-slate-300">{kpis.totalLeads ?? 0}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-600">Data nedostupná</p>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Digest Panel ───────────────────────────────────────────────────────────

function DigestPanel({ sessionId, onMissionStart, onMissionComplete }: {
  sessionId: number | null;
  onMissionStart: () => void;
  onMissionComplete: (result: any) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const triggerDigest = trpc.hermes.triggerDigest.useMutation({
    onSuccess: () => toast.success("⚡ HERA Digest odeslán!"),
    onError: (err) => toast.error("Chyba při generování digestu", { description: err.message }),
  });

  const executeMission = trpc.hermes.executeMission.useMutation({
    onError: (err) => toast.error("Optimalizace selhala", { description: err.message }),
  });

  const { data: history, refetch } = trpc.hermes.getDigestHistory.useQuery(undefined, {
    enabled: expanded,
    staleTime: 30_000,
  });

  const handleOptimize = async () => {
    if (!sessionId || isOptimizing) return;
    setIsOptimizing(true);
    onMissionStart();
    toast.info("🚀 Spouštím optimalizaci...", { description: "HERA analyzuje všechny projekty a navrhuje akce" });
    try {
      const result = await executeMission.mutateAsync({
        missionType: "full_analysis",
        sessionId,
        customContext: "Zaměř se na konkrétní optimalizační kroky doporučené v ranním přehledu. Prioritizuj akce s nejvyšším ROI.",
      });
      onMissionComplete(result);
      toast.success("✅ Optimalizace dokončena!");
    } catch {
      // error handled by onError
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="border-t border-slate-800 pt-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Denní přehled
        </p>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-slate-600 hover:text-cyan-400 transition-colors"
        >
          {expanded ? "Skrýt" : "Historie"}
        </button>
      </div>

      {/* Generate digest button */}
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs border-cyan-900/50 text-cyan-400 hover:bg-cyan-900/20 hover:text-cyan-300"
        onClick={() => { triggerDigest.mutate(); refetch(); }}
        disabled={triggerDigest.isPending || isOptimizing}
      >
        {triggerDigest.isPending ? (
          <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Generuji...</>
        ) : (
          <><Zap className="h-3 w-3 mr-1.5" /> Spustit ranní přehled</>
        )}
      </Button>

      {/* Digest history */}
      {expanded && history && history.length > 0 && (
        <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
          {history.map((item) => (
            <div key={item.id} className="bg-slate-900/60 rounded p-2 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1">
                {item.createdAt ? new Date(item.createdAt).toLocaleString("cs-CZ", { timeZone: "Europe/Prague", dateStyle: "short", timeStyle: "short" }) : ""}
              </p>
              <p className="text-xs text-slate-300 line-clamp-3">{item.content}</p>
            </div>
          ))}
        </div>
      )}
      {expanded && history && history.length === 0 && (
        <p className="text-xs text-slate-600 mt-2 text-center">Žádné přehledy zatím.</p>
      )}

      {/* Confirm & Integrate button */}
      <Button
        size="sm"
        className="w-full mt-2 text-xs bg-gradient-to-r from-emerald-700 to-cyan-700 hover:from-emerald-600 hover:to-cyan-600 text-white border-0 font-semibold"
        onClick={handleOptimize}
        disabled={isOptimizing || triggerDigest.isPending || !sessionId}
        title="Spustí HERA Full Analysis misi — realizuje optimalizační kroky z přehledu"
      >
        {isOptimizing ? (
          <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> Optimalizuji...</>
        ) : (
          <><Sparkles className="h-3 w-3 mr-1.5" /> Potvrdit a integrovat</>
        )}
      </Button>
      {!sessionId && (
        <p className="text-xs text-slate-600 mt-1 text-center">Inicializuji sezení...</p>
      )}
    </div>
  );
}

export default function Hermes() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMissionRunning, setIsMissionRunning] = useState(false);
  const [missionResult, setMissionResult] = useState<any | null>(null);
  const [showMissions, setShowMissions] = useState(true);
  const [activeView, setActiveView] = useState<"chat" | "mastermind" | "hermes">("chat");
  // Mastermind state
  const [selectedExperts, setSelectedExperts] = useState<string[]>(DEFAULT_MASTERMIND_IDS);
  const [mastermindInput, setMastermindInput] = useState("");
  const [mastermindMessages, setMastermindMessages] = useState<{role: "user" | "ai"; content: string}[]>([]);
  const [isMastermindSending, setIsMastermindSending] = useState(false);
  const mastermindScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoBriefingFiredRef = useRef(false);

  // tRPC hooks
  const { data: identity } = trpc.hermes.getIdentity.useQuery(undefined, { staleTime: Infinity });
  const { data: status, refetch: refetchStatus } = trpc.hermes.getStatus.useQuery(undefined, { staleTime: 30_000 });
  const getOrCreateSession = trpc.hermes.getOrCreateSession.useMutation();
  const sendMessage = trpc.hermes.sendMessage.useMutation();
  const executeMission = trpc.hermes.executeMission.useMutation();
  const { data: dbMessages, refetch: refetchMessages } = trpc.hermes.getMessages.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId, staleTime: 5_000 }
  );

  // Initialize session on mount + auto-briefing
  useEffect(() => {
    getOrCreateSession.mutateAsync({}).then(async (session) => {
      setSessionId(session.id);
    });
  }, []);

  // Auto-briefing: fire once when session is ready and no existing messages loaded
  useEffect(() => {
    if (!sessionId || autoBriefingFiredRef.current) return;
    // Wait for dbMessages to load — if there are existing messages, skip briefing
    if (dbMessages === undefined) return; // still loading
    if (dbMessages.length > 0) {
      // Existing conversation — just load, no auto-briefing
      autoBriefingFiredRef.current = true;
      return;
    }
    // New session — fire auto-briefing
    autoBriefingFiredRef.current = true;
    const BRIEFING_QUERY = "Shrň mi aktuální výkon všech projektů — zejména DeepSleepReset. Jak si stojí tržby, objednávky, konverze a leady? Co je priorita dnes?";
    const briefingUserMsg: Message = {
      id: Date.now(),
      role: "user",
      content: BRIEFING_QUERY,
      createdAt: Date.now(),
    };
    setMessages([briefingUserMsg]);
    setIsSending(true);
    sendMessage.mutateAsync({
      sessionId,
      message: BRIEFING_QUERY,
      conversationHistory: [],
    }).then((result) => {
      const hermesMsg: Message = {
        id: Date.now() + 1,
        role: "hermes",
        content: result.content,
        agentName: result.agentsUsed.join(", "),
        metadata: {
          intent: result.intent,
          agentsUsed: result.agentsUsed,
          routingDecision: result.routingDecision,
        },
        createdAt: Date.now() + 1,
      };
      setMessages((prev) => [...prev, hermesMsg]);
    }).catch(() => {
      // Silently ignore auto-briefing errors
    }).finally(() => {
      setIsSending(false);
    });
  }, [sessionId, dbMessages]);

  // Load messages from DB when session changes
  useEffect(() => {
    if (dbMessages && messages.length === 0) {
      setMessages(dbMessages as Message[]);
    }
  }, [dbMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Set page title
  useEffect(() => {
    document.title = "HERA — Core AI | LeadOS";
    return () => { document.title = "LeadOS — AI Lead Generation Platform"; };
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending || !sessionId) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      createdAt: Date.now(),
    };

    const conversationHistory = messages.slice(-8).map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsSending(true);

    try {
      const result = await sendMessage.mutateAsync({
        sessionId,
        message: userMsg.content,
        conversationHistory,
      });

      const hermesMsg: Message = {
        id: Date.now() + 1,
        role: "hermes",
        content: result.content,
        agentName: result.agentsUsed.join(", "),
        metadata: {
          intent: result.intent,
          agentsUsed: result.agentsUsed,
          routingDecision: result.routingDecision,
        },
        createdAt: Date.now() + 1,
      };

      setMessages((prev) => [...prev, hermesMsg]);

      // If HERA suggests a mission, show the missions panel
      if (result.suggestedMission) {
        setShowMissions(true);
        toast.info(`Navrhovaná mise: ${result.suggestedMission.title}`, {
          description: "Vyber misi níže pro spuštění",
        });
      }
    } catch (err: any) {
      toast.error("Chyba komunikace s HEROU", { description: err.message });
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  }, [input, isSending, sessionId, messages, sendMessage]);

  const mastermindChatMutation = trpc.hermes.mastermindChat.useMutation();

  const handleMastermindSend = useCallback(async () => {
    if (!mastermindInput.trim() || isMastermindSending) return;
    const userMsg = { role: "user" as const, content: mastermindInput.trim() };
    setMastermindMessages(prev => [...prev, userMsg]);
    setMastermindInput("");
    setIsMastermindSending(true);
    try {
      const history = mastermindMessages.slice(-8).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
      const result = await mastermindChatMutation.mutateAsync({
        message: userMsg.content,
        expertIds: selectedExperts,
        conversationHistory: history,
      });
      setMastermindMessages(prev => [...prev, { role: "ai", content: result.content }]);
    } catch (err: any) {
      toast.error("Chyba Mastermind", { description: err.message });
    } finally {
      setIsMastermindSending(false);
    }
  }, [mastermindInput, isMastermindSending, mastermindMessages, selectedExperts, mastermindChatMutation]);

  useEffect(() => {
    if (mastermindScrollRef.current) {
      mastermindScrollRef.current.scrollTop = mastermindScrollRef.current.scrollHeight;
    }
  }, [mastermindMessages]);

  const handleLaunchMission = useCallback(async (missionType: string) => {
    if (!sessionId || isMissionRunning) return;

    setIsMissionRunning(true);
    setMissionResult(null);

    const template = identity?.missionTemplates.find((m) => m.type === missionType);
    toast.info(`🚀 Spouštím misi: ${template?.title ?? missionType}`, {
      description: `Odhadovaný čas: ~${template?.estimatedMinutes ?? 3} minuty`,
    });

    // Add a "launching" message
    const launchMsg: Message = {
      id: Date.now(),
      role: "hermes",
      content: `## 🚀 Mise zahájena: ${template?.title ?? missionType}\n\nSpouštím ${template?.stepCount ?? "?"} kroků přes ${template?.stepCount ?? "?"} sub-agentů. Čekejte prosím...`,
      createdAt: Date.now(),
    };
    setMessages((prev) => [...prev, launchMsg]);

    try {
      const result = await executeMission.mutateAsync({ missionType, sessionId });
      setMissionResult(result);
      refetchStatus();
      toast.success(`✅ Mise dokončena: ${result.title}`);
    } catch (err: any) {
      toast.error("Mise selhala", { description: err.message });
    } finally {
      setIsMissionRunning(false);
    }
  }, [sessionId, isMissionRunning, identity, executeMission, refetchStatus]);

  const handleNewSession = async () => {
    const session = await getOrCreateSession.mutateAsync({});
    setSessionId(session.id);
    setMessages([]);
    setMissionResult(null);
    toast.success("Nová HERA relace zahájena");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <DashboardLayout>
      <div className="relative flex flex-col bg-slate-950 overflow-hidden" style={{height: 'calc(100vh - 2.5rem)'}}>
        <HermesHUD />

        {/* ── Header ── */}
        <div className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* HERA logo */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full border border-cyan-500/40 overflow-hidden">
                <img src="/manus-storage/hera-avatar-small_f7206405.png" alt="HERA" className="w-full h-full object-cover object-top" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">HERA</h1>
                <Badge variant="outline" className="text-xs border-cyan-500/30 text-cyan-400 px-1.5 py-0">
                  CORE AI CTO
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {identity?.subAgents?.length ?? 7} sub-agentů ·{" "}
                {identity?.missionTemplates?.length ?? 5} misí ·{" "}
                {status?.completedMissions ?? 0} dokončeno
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View tabs */}
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 mr-2">
              <button
                onClick={() => setActiveView("chat")}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeView === "chat" ? "bg-cyan-600 text-white" : "text-slate-400 hover:text-slate-200")}
              >
                <Zap className="h-3 w-3 inline mr-1" />HERA
              </button>
              <button
                onClick={() => setActiveView("hermes")}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeView === "hermes" ? "bg-amber-600 text-white" : "text-slate-400 hover:text-slate-200")}
              >
                <MessageSquare className="h-3 w-3 inline mr-1" />HERMES
              </button>
              <button
                onClick={() => setActiveView("mastermind")}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all",
                  activeView === "mastermind" ? "bg-violet-600 text-white" : "text-slate-400 hover:text-slate-200")}
              >
                <Brain className="h-3 w-3 inline mr-1" />Mastermind
              </button>
            </div>
            {/* Sub-agent status dots */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              {identity?.subAgents?.map((agent) => (
                <div
                  key={agent.id}
                  title={agent.name}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: agent.color, opacity: 0.8 }}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNewSession}
              className="h-8 text-xs border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 bg-transparent"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Nová Relace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchStatus()}
              className="h-8 w-8 p-0 text-slate-500 hover:text-cyan-400"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Main Layout ── */}
        {activeView === "hermes" ? (
          /* ── HERMES WIDGET VIEW ── */
          <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden items-center justify-center bg-slate-950/60">
            <div className="flex flex-col items-center gap-6 max-w-lg w-full px-6">
              <div className="w-20 h-20 rounded-full border-2 border-amber-500/40 overflow-hidden">
                <img src="/manus-storage/hermes-avatar-small_dbbdbf58.png" alt="HERMES" className="w-full h-full object-cover object-top"
                  onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }}
                />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1">HERMES — Technický CEO</h2>
                <p className="text-slate-400 text-sm">Moudrý boss. Strategické rozhodnutí, business architektura, long-term vision.</p>
              </div>
              <div className="w-full bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-sm mb-3">HERMES běží jako globální chat widget — klikni na tlačítko vpravo dole pro otevření.</p>
                <div className="flex items-center justify-center gap-2 text-amber-400 text-xs">
                  <MessageSquare className="h-4 w-4" />
                  <span>Oba kontexty sdílejí data — HERA a HERMES vědí o sobě navzájem</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {[
                  { text: "Jaká je strategie na Q3?", icon: "🎯" },
                  { text: "Analyzuj MAGS architekturu", icon: "🧠" },
                  { text: "Prioritizuj projekty", icon: "⚡" },
                  { text: "Business model review", icon: "📊" },
                ].map(({ text, icon }) => (
                  <button
                    key={text}
                    onClick={() => {
                      setActiveView("chat");
                      setInput(text);
                    }}
                    className="text-left p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-amber-500/40 hover:bg-amber-900/10 transition-all text-xs text-slate-400"
                  >
                    <span className="mr-1.5">{icon}</span>{text}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : activeView === "mastermind" ? (
          /* ── MASTERMIND VIEW ── */
          <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
            {/* Expert selector sidebar */}
            <div className="shrink-0 w-64 border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-sm p-3 overflow-y-auto flex flex-col gap-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Brain className="h-3.5 w-3.5 text-violet-400" />
                Experti ({selectedExperts.length}/8)
              </p>
              {HERMES_EXPERTS.map((expert) => {
                const isSelected = selectedExperts.includes(expert.id);
                return (
                  <button
                    key={expert.id}
                    onClick={() => setSelectedExperts(prev =>
                      isSelected ? prev.filter(id => id !== expert.id) : prev.length < 8 ? [...prev, expert.id] : prev
                    )}
                    className={cn(
                      "w-full text-left p-2.5 rounded-lg border transition-all",
                      isSelected
                        ? "border-violet-500/50 bg-violet-900/20"
                        : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg leading-none">{expert.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-xs font-semibold truncate", isSelected ? "text-violet-300" : "text-slate-300")}>{expert.name}</p>
                        <p className="text-xs text-slate-600 truncate">{expert.title}</p>
                      </div>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />}
                    </div>
                  </button>
                );
              })}
              {selectedExperts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-1">Aktivní panel:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedExperts.map(id => {
                      const e = HERMES_EXPERTS.find(x => x.id === id);
                      return e ? <span key={id} className="text-sm">{e.emoji}</span> : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Mastermind chat */}
            <div className="flex-1 flex flex-col min-w-0">
              <div ref={mastermindScrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {mastermindMessages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-8 w-8 text-violet-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">HERA Mastermind</h2>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-4">
                      Virtuální poradní sbor světových business expertů. Vyber experty vlevo a zeptej se na cokoliv.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                      {["Jak maximalizovat ROI mých leadů?", "Jaká je nejlepší strategie pro DACH trh?", "Jak nastavit ceny pro B2B SaaS?", "Jak škálovat outreach?"].map(q => (
                        <button key={q} onClick={() => setMastermindInput(q)}
                          className="text-xs text-slate-400 hover:text-violet-300 border border-slate-800 hover:border-violet-500/30 rounded-lg px-3 py-1.5 bg-slate-900/50 transition-all">
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {mastermindMessages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "ai" && (
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                        <Brain className="h-3.5 w-3.5 text-violet-400" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-violet-600/20 border border-violet-500/30 text-slate-200 rounded-br-sm"
                        : "bg-slate-900/80 border border-slate-700/50 text-slate-200 rounded-bl-sm"
                    )}>
                      <Streamdown>{msg.content}</Streamdown>
                    </div>
                  </div>
                ))}
                {isMastermindSending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 flex items-center justify-center mr-2 shrink-0">
                      <Brain className="h-3.5 w-3.5 text-violet-400" />
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/50 rounded-xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mastermind input */}
              <div className="shrink-0 px-4 py-3 border-t border-slate-800/60 bg-slate-950/80">
                {selectedExperts.length === 0 && (
                  <p className="text-xs text-amber-400 mb-2 text-center">Vyber alespoň jednoho experta vlevo</p>
                )}
                <div className="flex gap-2">
                  <input
                    value={mastermindInput}
                    onChange={e => setMastermindInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleMastermindSend(); } }}
                    placeholder={selectedExperts.length === 0 ? "Vyber experty..." : `Zeptej se ${selectedExperts.length} expertů...`}
                    disabled={isMastermindSending || selectedExperts.length === 0}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                  />
                  <Button
                    onClick={handleMastermindSend}
                    disabled={isMastermindSending || !mastermindInput.trim() || selectedExperts.length === 0}
                    className="h-10 w-10 p-0 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shrink-0"
                  >
                    {isMastermindSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
        <div className="relative z-10 flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left: Missions Panel ── */}
          <div
            className={cn(
              "shrink-0 border-r border-slate-800/60 bg-slate-950/80 backdrop-blur-sm transition-all duration-300 overflow-hidden",
              showMissions ? "w-64" : "w-0"
            )}
          >
            <div className="p-3 h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Rocket className="h-3.5 w-3.5 text-cyan-400" />
                  Missions
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMissions(false)}
                  className="h-6 w-6 p-0 text-slate-600 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {identity?.missionTemplates?.map((mission) => (
                  <MissionCard
                    key={mission.type}
                    mission={mission}
                    onLaunch={handleLaunchMission}
                    isRunning={isMissionRunning}
                  />
                ))}
              </div>

              {/* Sub-agents legend */}
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Sub-Agenti
                </p>
                <div className="space-y-1">
                  {identity?.subAgents?.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-2 text-xs text-slate-500">
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: agent.color }}
                      />
                      <span>{agent.emoji}</span>
                      <span className="truncate">{agent.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Center: Chat ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Show missions toggle */}
            {!showMissions && (
              <button
                onClick={() => setShowMissions(true)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-slate-800 border border-slate-700 rounded-r-lg px-1.5 py-3 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-colors"
              >
                <Rocket className="h-4 w-4" />
              </button>
            )}

            {/* Messages */}
            <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef as any}>
              <div className="space-y-4 max-w-3xl mx-auto">
                {/* Welcome message */}
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full border border-cyan-500/30 overflow-hidden mx-auto mb-4">
                      <img src="/manus-storage/hera-avatar-small_f7206405.png" alt="HERA" className="w-full h-full object-cover object-top" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">HERA Online</h2>
                    <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
                      Core AI Orchestrační Agent připraven. Koordinuji všechny sub-agenty, směruji požadavky k optimálnímu expertovi a spouštím autonomní mise.
                    </p>
                    <div className="grid grid-cols-2 gap-2 max-w-sm mx-auto">
                      {[
                        { text: "Analyzuj můj pipeline", icon: <BarChart3 className="h-3.5 w-3.5" /> },
                        { text: "Generuj outreach texty", icon: <MessageSquare className="h-3.5 w-3.5" /> },
                        { text: "Spusť NINJA BOT pentest", icon: <Swords className="h-3.5 w-3.5" /> },
                        { text: "Vytvoř GTM strategii", icon: <Brain className="h-3.5 w-3.5" /> },
                      ].map((suggestion) => (
                        <button
                          key={suggestion.text}
                          onClick={() => setInput(suggestion.text)}
                          className="flex items-center gap-2 text-xs text-slate-400 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/30 rounded-lg px-3 py-2 transition-all bg-slate-900/50 hover:bg-slate-800/80"
                        >
                          <span className="text-cyan-500">{suggestion.icon}</span>
                          {suggestion.text}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} msg={msg} />
                ))}

                {/* Typing indicator */}
                {isSending && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900/80 border border-cyan-500/30 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div className="bg-slate-900/80 border border-cyan-500/20 rounded-xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Mission running indicator */}
                {isMissionRunning && (
                  <div className="flex items-center gap-3 p-4 border border-orange-500/30 rounded-xl bg-orange-950/20">
                    <Loader2 className="h-5 w-5 text-orange-400 animate-spin shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-orange-300">Mise probíhá...</p>
                      <p className="text-xs text-slate-500">Sub-agenti pracují. Může to trvat 1–4 minuty.</p>
                    </div>
                  </div>
                )}

                {/* Mission result */}
                {missionResult && (
                  <MissionResultPanel
                    result={missionResult}
                    onClose={() => setMissionResult(null)}
                  />
                )}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-sm px-4 py-3">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-end gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Zadej příkaz HEŘE — přesměruj na agenta, spusť misi, analyzuj pipeline..."
                      disabled={isSending || isMissionRunning || !sessionId}
                      className="bg-slate-900/80 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-cyan-500/20 pr-4 py-2.5 text-sm"
                    />
                  </div>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || isMissionRunning || !sessionId}
                    size="sm"
                    className="h-10 px-4 bg-cyan-600 hover:bg-cyan-500 text-white border-0 shrink-0"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 text-center">
                  HERA přesměruje na optimálního sub-agenta · Enter pro odeslání · Shift+Enter pro nový řádek
                </p>
              </div>
            </div>
          </div>

          {/* ── Right: Status Panel ── */}
          <div className="shrink-0 w-56 border-l border-slate-800/60 bg-slate-950/80 backdrop-blur-sm p-3 hidden lg:flex flex-col gap-3 overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Stav
            </p>

            {/* Stats */}
            <div className="space-y-2">
              {[
                { label: "Sezení", value: status?.totalSessions ?? 0, color: "text-cyan-400" },
                { label: "Zprávy", value: status?.totalMessages ?? 0, color: "text-violet-400" },
                { label: "Mise", value: status?.completedMissions ?? 0, color: "text-emerald-400" },
                { label: "Sub-Agenti", value: status?.subAgentCount ?? 7, color: "text-amber-400" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{stat.label}</span>
                  <span className={cn("text-sm font-bold tabular-nums", stat.color)}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {/* DSR Live Performance */}
            <DsrLivePanel />

            {/* Poslední mise */}
            {status?.recentMissions && status.recentMissions.length > 0 && (
              <div className="border-t border-slate-800 pt-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Poslední mise
                </p>
                <div className="space-y-1.5">
                  {status.recentMissions.slice(0, 4).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-1.5">
                      {m.status === "completed" ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                      ) : m.status === "failed" ? (
                        <AlertCircle className="h-3 w-3 text-red-400 shrink-0" />
                      ) : (
                        <Loader2 className="h-3 w-3 text-amber-400 animate-spin shrink-0" />
                      )}
                      <span className="text-xs text-slate-500 truncate">{m.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rychlé příkazy */}
            <div className="border-t border-slate-800 pt-3 mt-auto">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Rychlé příkazy
              </p>
              <div className="space-y-1">
                {[
                  { cmd: "Jak si stojí DeepSleepReset?", icon: "📊" },
                  { cmd: "Analyzuj pipeline", icon: "🎯" },
                  { cmd: "NINJA BOT test", icon: "⚡" },
                  { cmd: "Strategie růstu", icon: "🧠" },
                ].map((q) => (
                  <button
                    key={q.cmd}
                    onClick={() => setInput(q.cmd)}
                    className="w-full text-left text-xs text-slate-500 hover:text-cyan-300 flex items-center gap-1.5 py-1 px-2 rounded hover:bg-slate-800/50 transition-colors"
                  >
                    <span>{q.icon}</span>
                    {q.cmd}
                  </button>
                ))}
              </div>
              {/* Daily Digest trigger */}
              <DigestPanel
                sessionId={sessionId}
                onMissionStart={() => setIsMissionRunning(true)}
                onMissionComplete={(result) => {
                  setMissionResult(result);
                  setIsMissionRunning(false);
                  refetchStatus();
                }}
              />
            </div>
          </div>
        </div>)}
      </div>
    </DashboardLayout>
  );
}
