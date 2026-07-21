import { useAuth } from "@/_core/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard,
  LogOut,
  Zap,
  History,
  BarChart3,
  Mail,
  Users,
  Kanban,
  DollarSign,
  Bot,
  Webhook,
  Target,
  UserCheck,
  Lightbulb,
  Ear,
  Code,
  Bell,
  ListFilter,
  ShieldCheck,
  GitBranch,
  Building,
  Timer,
  Cpu,
  MailOpen,
  CheckSquare,
  Crosshair,
  Globe,
  BookOpen,
  Map,
  Brain,
  Calendar,
  Phone,
  TrendingUp,
  Trophy,
  Link2,
  Megaphone,
  FileBarChart,
  Scroll,
  FlaskConical,
  Sparkles,
  Moon,
  Sun,
  CircleDollarSign,
  TrendingUp as TrendUp,
  Activity,
  Inbox,
  ChevronRight,
  Wifi,
  Battery,
  Volume2,
  Search,
  Settings,
  Gift,
  MapPin,
  Layers,
  Building2,
  Radio,
  Command,
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import { trpc } from "@/lib/trpc";

const OnboardingWizard = lazy(() => import("./OnboardingWizard"));
const AIChatWidget = lazy(() => import("./AIChatWidget"));

// ─── Dock item definitions (ordered by business impact DESC) ─────────────────
const dockItems = [
  {
    icon: LayoutDashboard,
    path: "/dashboard",
    label: "Dnes",
    color: "oklch(0.68 0.16 205)",
    desc: "Úkoly, schválení a změny v pipeline",
  },
  {
    icon: Kanban,
    path: "/kanban",
    label: "Leady",
    color: "oklch(0.65 0.20 150)",
    desc: "CRM pipeline a další obchodní krok",
  },
  {
    icon: Megaphone,
    path: "/campaigns",
    label: "Kampaně",
    color: "oklch(0.68 0.18 55)",
    desc: "Sekvence, kampaně a plánované aktivity",
  },
  {
    icon: Command,
    path: "/command-center",
    label: "HERMES",
    color: "oklch(0.68 0.16 205)",
    desc: "Šablony, běhy workflow a schvalování",
  },
  {
    icon: BarChart3,
    path: "/sales-dashboard",
    label: "Analytika",
    color: "oklch(0.62 0.18 255)",
    desc: "Výkon pipeline, kampaní a tržeb",
  },
  {
    icon: Settings,
    path: "/integrations",
    label: "Nastavení",
    color: "oklch(0.62 0.08 250)",
    desc: "Integrace, přístupy a systémové volby",
  },
];

// Full sidebar items (ordered by business impact DESC within groups)
const allMenuItems = [
  // TIER 0 — HERA AI (always first)
  { icon: Sparkles, labelKey: "sidebar.hera", path: "/hermio", group: "ai" },
  {
    icon: Command,
    labelKey: "sidebar.commandCenter",
    path: "/command-center",
    group: "ai",
  },
  // TIER 0 — Services
  {
    icon: Layers,
    labelKey: "sidebar.sluzby",
    path: "/sluzby",
    group: "revenue",
  },
  {
    icon: Building2,
    labelKey: "sidebar.aresSearch",
    path: "/ares",
    group: "intelligence",
  },
  // TIER 1 — Revenue & Pipeline
  {
    icon: Zap,
    labelKey: "sidebar.generateLeads",
    path: "/generate",
    group: "revenue",
  },
  {
    icon: Kanban,
    labelKey: "sidebar.pipelineBoard",
    path: "/kanban",
    group: "revenue",
  },
  {
    icon: TrendingUp,
    labelKey: "sidebar.dealPipeline",
    path: "/deal-pipeline",
    group: "revenue",
  },
  {
    icon: UserCheck,
    labelKey: "sidebar.aiSdrAgent",
    path: "/sdr",
    group: "revenue",
  },
  {
    icon: Bot,
    labelKey: "sidebar.autopilot",
    path: "/autopilot",
    group: "revenue",
  },
  {
    icon: MailOpen,
    labelKey: "sidebar.emailSequences",
    path: "/sequences",
    group: "revenue",
  },
  {
    icon: Megaphone,
    labelKey: "sidebar.adCampaigns",
    path: "/ad-campaigns",
    group: "revenue",
  },
  // TIER 2 — Intelligence & Targeting
  {
    icon: Target,
    labelKey: "sidebar.icpBuilder",
    path: "/icp",
    group: "intelligence",
  },
  {
    icon: ListFilter,
    labelKey: "sidebar.smartLists",
    path: "/smart-lists",
    group: "intelligence",
  },
  {
    icon: Inbox,
    labelKey: "sidebar.externalLeads",
    path: "/external-leads",
    group: "intelligence",
  },
  {
    icon: MapPin,
    labelKey: "sidebar.googleMapsScraper",
    path: "/google-maps-scraper",
    group: "intelligence",
  },
  {
    icon: Globe,
    labelKey: "sidebar.webAudit",
    path: "/web-audit",
    group: "intelligence",
  },
  {
    icon: ShieldCheck,
    labelKey: "sidebar.emailVerify",
    path: "/email-verify",
    group: "intelligence",
  },
  {
    icon: Code,
    labelKey: "sidebar.trackingPixel",
    path: "/tracking",
    group: "intelligence",
  },
  {
    icon: Cpu,
    labelKey: "sidebar.techStack",
    path: "/tech-stack",
    group: "intelligence",
  },
  {
    icon: Globe,
    labelKey: "sidebar.marketIntel",
    path: "/market-intel",
    group: "intelligence",
  },
  {
    icon: Map,
    labelKey: "sidebar.competitiveMap",
    path: "/competitive",
    group: "intelligence",
  },
  {
    icon: Radio,
    labelKey: "sidebar.globalSignalDesk",
    path: "/global-signal-desk",
    group: "intelligence",
  },
  // TIER 3 — Analytics & ROI
  {
    icon: Trophy,
    labelKey: "sidebar.salesDashboard",
    path: "/sales-dashboard",
    group: "analytics",
  },
  {
    icon: BarChart3,
    labelKey: "sidebar.statistics",
    path: "/stats",
    group: "analytics",
  },
  {
    icon: TrendingUp,
    labelKey: "sidebar.roiAudit",
    path: "/roi-audit",
    group: "analytics",
  },
  {
    icon: DollarSign,
    labelKey: "sidebar.roiTracker",
    path: "/roi",
    group: "analytics",
  },
  {
    icon: Trophy,
    labelKey: "sidebar.portfolioROAS",
    path: "/portfolio-roas",
    group: "analytics",
  },
  {
    icon: Link2,
    labelKey: "sidebar.projectsHub",
    path: "/projects",
    group: "analytics",
  },
  {
    icon: DollarSign,
    labelKey: "sidebar.globalEarnings",
    path: "/global-earnings",
    group: "analytics",
  },
  {
    icon: Activity,
    labelKey: "sidebar.proAnalytics",
    path: "/analytics/professional",
    group: "analytics",
  },
  {
    icon: History,
    labelKey: "sidebar.leadHistory",
    path: "/history",
    group: "analytics",
  },
  // TIER 4 — AI & Knowledge
  {
    icon: Cpu,
    labelKey: "sidebar.computerFlow",
    path: "/computer-flow",
    group: "ai",
  },
  {
    icon: Brain,
    labelKey: "sidebar.aiAdvisor",
    path: "/chat-agent",
    group: "ai",
  },
  {
    icon: BookOpen,
    labelKey: "sidebar.aiSkills",
    path: "/ai-skills",
    group: "ai",
  },
  {
    icon: Brain,
    labelKey: "sidebar.fiveBrains",
    path: "/five-brains",
    group: "ai",
  },
  {
    icon: BookOpen,
    labelKey: "sidebar.knowledgeBase",
    path: "/knowledge",
    group: "ai",
  },
  // TIER 5 — Outreach & Automation
  {
    icon: GitBranch,
    labelKey: "sidebar.campaigns",
    path: "/campaigns",
    group: "outreach",
  },
  {
    icon: Timer,
    labelKey: "sidebar.speedToLead",
    path: "/speed-to-lead",
    group: "outreach",
  },
  {
    icon: Lightbulb,
    labelKey: "sidebar.nextActions",
    path: "/next-actions",
    group: "outreach",
  },
  {
    icon: Bell,
    labelKey: "sidebar.smartAlerts",
    path: "/alerts",
    group: "outreach",
  },
  {
    icon: Calendar,
    labelKey: "sidebar.meetingScheduler",
    path: "/meetings",
    group: "outreach",
  },
  {
    icon: Phone,
    labelKey: "sidebar.callIntelligence",
    path: "/calls",
    group: "outreach",
  },
  {
    icon: CheckSquare,
    labelKey: "sidebar.activityTracker",
    path: "/tasks",
    group: "outreach",
  },
  {
    icon: Crosshair,
    labelKey: "sidebar.capturePlanning",
    path: "/capture",
    group: "outreach",
  },
  {
    icon: Ear,
    labelKey: "sidebar.socialListening",
    path: "/social",
    group: "outreach",
  },
  {
    icon: Target,
    labelKey: "sidebar.b2bMatching",
    path: "/matching",
    group: "outreach",
  },
  {
    icon: Bot,
    labelKey: "sidebar.aiAgents",
    path: "/ai-agents",
    group: "outreach",
  },
  // TIER 6 — System & Settings
  {
    icon: LayoutDashboard,
    labelKey: "sidebar.dashboard",
    path: "/dashboard",
    group: "settings",
  },
  {
    icon: Webhook,
    labelKey: "sidebar.integrations",
    path: "/integrations",
    group: "settings",
  },
  {
    icon: Webhook,
    labelKey: "sidebar.webhookActivity",
    path: "/webhooks/activity",
    group: "settings",
  },
  {
    icon: Code,
    labelKey: "sidebar.apiKeys",
    path: "/admin/integrations",
    group: "settings",
  },
  { icon: Users, labelKey: "sidebar.team", path: "/team", group: "settings" },
  {
    icon: Building,
    labelKey: "sidebar.agencyPanel",
    path: "/agency",
    group: "settings",
  },
  {
    icon: DollarSign,
    labelKey: "sidebar.billingPlans",
    path: "/billing",
    group: "settings",
  },
  {
    icon: FileBarChart,
    labelKey: "sidebar.dailyReport",
    path: "/daily-report",
    group: "settings",
  },
  {
    icon: Mail,
    labelKey: "sidebar.emailTemplates",
    path: "/templates",
    group: "settings",
  },
  {
    icon: Scroll,
    labelKey: "sidebar.aiConstitution",
    path: "/ai-constitution",
    group: "settings",
  },
  {
    icon: FlaskConical,
    labelKey: "sidebar.agentBenchmark",
    path: "/agent-benchmark",
    group: "settings",
  },
  {
    icon: Moon,
    labelKey: "sidebar.deepSleep",
    path: "/deep-sleep",
    group: "settings",
  },
  { icon: Moon, labelKey: "sidebar.dsrHub", path: "/dsr", group: "settings" },
  {
    icon: Gift,
    labelKey: "sidebar.affiliate",
    path: "/affiliate",
    group: "settings",
  },
  {
    icon: TrendingUp,
    labelKey: "sidebar.revenueIntelligence",
    path: "/revenue-intelligence",
    group: "settings",
  },
  {
    icon: Sun,
    labelKey: "sidebar.dailyRoutines",
    path: "/daily-routines",
    group: "ai",
  },
];

const groupLabels: Record<string, string> = {
  revenue: "REVENUE & PIPELINE",
  intelligence: "MARKETING",
  analytics: "ANALYTICS",
  ai: "AI & ZNALOSTI",
  outreach: "AUTOMATIZACE",
  settings: "SYSTÉM",
};

// ─── macOS MenuBar ─────────────────────────────────────────────────────────
function MacMenuBar({
  user,
  logout,
  onAppsClick,
}: {
  user: any;
  logout: () => void;
  onAppsClick: () => void;
}) {
  const [time, setTime] = useState(() => new Date());
  const { data: earningsData } = trpc.globalEarnings.summary.useQuery(
    undefined,
    {
      refetchInterval: 60_000,
      staleTime: 30_000,
    }
  );

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Values are stored in CZK haléře (cents) — divide by 100 to get Kč, no USD conversion needed
  const fmtCZK = (cents: number) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const timeStr = time.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = time.toLocaleDateString("cs-CZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 select-none"
      style={{
        background: "var(--shell-surface)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid var(--shell-border)",
        boxShadow: "0 2px 18px var(--shell-glow)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        height: "calc(2rem + env(safe-area-inset-top, 0px))",
      }}
    >
      {/* Left: Apple logo + app name */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAppsClick}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all text-xs font-semibold"
          style={{
            color: "oklch(0.82 0.012 240)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
          onMouseEnter={e =>
            (e.currentTarget.style.background = "oklch(0.55 0.20 192 / 10%)")
          }
          onMouseLeave={e => (e.currentTarget.style.background = "")}
        >
          <Logo variant="lockup" size={17} theme="dark" />
        </button>

        {/* Live earnings pill */}
        <div
          className="hidden items-center gap-1 px-2 py-0.5 rounded-full ml-1 sm:flex"
          style={{
            background: "oklch(0.55 0.20 150 / 10%)",
            border: "1px solid oklch(0.55 0.20 150 / 20%)",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "oklch(0.65 0.20 150)" }}
            />
            <span
              className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: "oklch(0.65 0.20 150)" }}
            />
          </span>
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{
              color: "oklch(0.45 0.18 150)",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            {earningsData ? fmtCZK(earningsData.todayRevenueCents) : "…"} dnes
            {earningsData && earningsData.totalRevenueCents > 0 && (
              <span className="ml-1.5 opacity-60">
                | celkem {fmtCZK(earningsData.totalRevenueCents)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Center: date */}
      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1.5 md:flex">
        <span
          className="text-[11px] font-medium"
          style={{
            color: "oklch(0.65 0.04 250)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {dateStr}
        </span>
      </div>

      {/* Right: status icons + time + user */}
      <div className="flex items-center gap-2">
        <Wifi className="hidden h-3 w-3 sm:block" style={{ color: "oklch(0.65 0.04 250)" }} />
        <Battery
          className="hidden h-3 w-3 sm:block"
          style={{ color: "oklch(0.65 0.04 250)" }}
        />
        <Volume2
          className="hidden h-3 w-3 sm:block"
          style={{ color: "oklch(0.65 0.04 250)" }}
        />

        <span
          className="text-[11px] font-semibold tabular-nums"
          style={{
            color: "oklch(0.82 0.012 240)",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          {timeStr}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md transition-all focus:outline-none"
              onMouseEnter={e =>
                (e.currentTarget.style.background =
                  "oklch(0.55 0.20 192 / 10%)")
              }
              onMouseLeave={e => (e.currentTarget.style.background = "")}
            >
              <Avatar className="h-5 w-5">
                <AvatarFallback
                  className="text-[9px] font-bold"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.20 192 / 25%), oklch(0.55 0.24 278 / 20%))",
                    color: "oklch(0.40 0.20 192)",
                  }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-[11px] font-medium hidden sm:block"
                style={{ color: "oklch(0.30 0.04 250)" }}
              >
                {user?.name?.split(" ")[0] ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 mt-1"
            style={{
              background: "oklch(0.13 0.04 248 / 97%)",
              backdropFilter: "blur(20px)",
              border: "1px solid oklch(1 0 0 / 10%)",
              boxShadow: "0 8px 32px oklch(0 0 0 / 40%)",
            }}
          >
            <div
              className="px-3 py-2 border-b"
              style={{ borderColor: "oklch(1 0 0 / 8%)" }}
            >
              <p
                className="text-xs font-semibold truncate"
                style={{ color: "oklch(0.93 0.008 240)" }}
              >
                {user?.name}
              </p>
              <p
                className="text-[10px] truncate mt-0.5"
                style={{ color: "oklch(0.65 0.04 250)" }}
              >
                {user?.email}
              </p>
            </div>
            <DropdownMenuItem
              onClick={logout}
              className="cursor-pointer mt-1 text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs">Odhlásit se</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// ─── macOS Dock ────────────────────────────────────────────────────────────
function MacDock({ onAppsClick }: { onAppsClick: () => void }) {
  const [location, setLocation] = useLocation();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const getScale = (idx: number) => {
    if (hoveredIdx === null) return 1;
    const dist = Math.abs(idx - hoveredIdx);
    if (dist === 0) return 1.55;
    if (dist === 1) return 1.28;
    if (dist === 2) return 1.12;
    return 1;
  };

  return (
    <div
      className="fixed left-0 bottom-0 z-[9999] hidden py-8 md:block"
      style={{
        top: "calc(2rem + env(safe-area-inset-top, 0px))",
        width: 300,
        pointerEvents: "none",
        overflow: "visible",
      }}
    >
      {/* Background layer */}
      <div
        className="absolute left-0 top-0 bottom-0 z-0"
        style={{
          width: 56,
          background: "var(--shell-surface-strong)",
          backdropFilter: "blur(24px) saturate(200%)",
          WebkitBackdropFilter: "blur(24px) saturate(200%)",
          borderRight: "1px solid var(--shell-border)",
          boxShadow: "4px 0 22px var(--shell-glow)",
          pointerEvents: "auto",
        }}
      />
      {/* Items Container */}
      <div className="relative z-10 flex flex-col items-center gap-1 w-[56px] pointer-events-auto">
        {/* All Apps button — TOP */}
        <div
          className="relative flex flex-col items-center"
          style={{
            transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          onMouseEnter={() => setHoveredIdx(-1)}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {hoveredIdx === -1 && (
            <div
              className="absolute left-12 top-1/2 z-[99999] -translate-y-1/2 px-3 py-2 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none"
              style={{
                background: "var(--shell-elevated)",
                color: "white",
                backdropFilter: "blur(8px)",
                boxShadow: "0 8px 24px var(--shell-shadow), 0 0 18px var(--shell-glow)",
                border: "1px solid var(--shell-border)",
              }}
            >
              Všechny aplikace
            </div>
          )}
          <button
            onClick={() => {
              setHoveredIdx(null);
              onAppsClick();
            }}
            className="flex items-center justify-center rounded-xl transition-transform focus:outline-none"
            style={{
              width: 40,
              height: 40,
              transform: `scale(${hoveredIdx === -1 ? 1.28 : 1})`,
              background:
                "linear-gradient(135deg, oklch(0.99 0.01 245), oklch(0.93 0.045 235))",
              border: "1.5px solid oklch(0.84 0.06 235)",
            }}
          >
            <div className="grid grid-cols-2 gap-0.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-sm"
                  style={{ background: "oklch(0.48 0.16 245)" }}
                />
              ))}
            </div>
          </button>
        </div>

        {/* Separator */}
        <div
          className="w-6 h-px my-1 rounded-full"
          style={{ background: "oklch(1 0 0 / 12%)" }}
        />

        {dockItems.map((item, idx) => {
          const isActive = location === item.path;
          const scale = getScale(idx);
          const Icon = item.icon;

          return (
            <div
              key={item.path}
              className="relative flex flex-col items-center"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {hoveredIdx === idx && (
                <div
                  className="absolute left-12 top-1/2 z-[99999] -translate-y-1/2 px-3 py-2 rounded-lg pointer-events-none flex w-[220px] flex-col gap-0.5"
                  style={{
                    background: "oklch(0.99 0.01 245)",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 24px var(--shell-shadow), 0 0 18px var(--shell-glow)",
                    border: "1px solid oklch(0.84 0.06 235)",
                  }}
                >
                  <span
                    className="text-[12px] font-semibold"
                    style={{ color: "oklch(0.30 0.10 250)" }}
                  >
                    {item.label}
                  </span>
                  {"desc" in item && (
                    <span
                      className="text-[11px]"
                      style={{ color: "oklch(0.48 0.035 250)" }}
                    >
                      {(item as any).desc}
                    </span>
                  )}
                </div>
              )}

              <button
                onClick={() => setLocation(item.path)}
                className="relative flex items-center justify-center rounded-xl transition-all focus:outline-none"
                style={{
                  width: 40,
                  height: 40,
                  transform: `scale(${scale})`,
                  background: isActive
                    ? "linear-gradient(135deg, oklch(0.62 0.18 240), oklch(0.52 0.20 250))"
                    : "oklch(0.99 0.01 245)",
                  border: isActive
                    ? "1.5px solid oklch(0.76 0.13 230)"
                    : "1.5px solid oklch(0.84 0.06 235)",
                  boxShadow: isActive
                    ? `0 0 12px ${item.color}30, 0 2px 8px oklch(0 0 0 / 8%)`
                    : "0 2px 6px oklch(0 0 0 / 6%)",
                }}
              >
                <Icon
                  className="h-[18px] w-[18px]"
                  style={{
                    color: isActive ? "white" : "oklch(0.48 0.16 245)",
                  }}
                />
              </button>

              {/* Active dot */}
              {isActive && (
                <div
                  className="absolute left-0 w-0.5 h-6 rounded-r-full"
                  style={{
                    background: item.color,
                    boxShadow: `0 0 4px ${item.color}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── All Apps Slide-over Panel ─────────────────────────────────────────────
function AppsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { t } = useTranslation();
  const normalizedQuery = query.trim().toLocaleLowerCase("cs");
  const menuItems = allMenuItems
    .map(item => ({ ...item, label: t(item.labelKey) }))
    .filter(item =>
      normalizedQuery
        ? `${item.label} ${groupLabels[item.group] ?? ""}`
            .toLocaleLowerCase("cs")
            .includes(normalizedQuery)
        : true
    );

  const navigate = (path: string) => {
    setLocation(path);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{
            background: "oklch(0 0 0 / 20%)",
            backdropFilter: "blur(2px)",
          }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed bottom-0 left-0 z-[9998] w-full overflow-y-auto md:left-14 md:w-[min(960px,calc(100vw-56px))]"
        style={{
          top: "calc(2rem + env(safe-area-inset-top, 0px))",
          background: "var(--shell-surface-strong)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid var(--shell-border)",
          boxShadow: "6px 0 30px var(--shell-shadow), 0 0 24px var(--shell-glow)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Search bar */}
        <div
          className="sticky top-0 z-10 border-b px-4 py-3"
          style={{
            borderColor: "var(--shell-border)",
            background: "var(--shell-surface-strong)",
            backdropFilter: "blur(20px)",
          }}
        >
          <label
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: "var(--shell-control)",
              border: "1px solid var(--shell-border)",
            }}
          >
            <Search
              className="h-3.5 w-3.5"
              style={{ color: "oklch(0.76 0.13 230)" }}
            />
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Hledat aplikaci…"
              aria-label="Hledat aplikaci"
              className="min-w-0 flex-1 bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="px-4 py-3">
          {(
            [
              "revenue",
              "intelligence",
              "analytics",
              "ai",
              "outreach",
              "settings",
            ] as const
          ).map(group => {
            const groupItems = menuItems.filter(i => i.group === group);
            if (!groupItems.length) return null;
            return (
              <section key={group} className="mb-6">
                {groupLabels[group] && (
                  <div className="px-1 pb-2 pt-3">
                    <span
                      className="text-[10px] font-bold uppercase"
                      style={{ color: "oklch(0.76 0.13 230 / 82%)" }}
                    >
                      {groupLabels[group]}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
                  {groupItems.map(item => {
                    const isActive = location === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="flex min-h-14 w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors"
                        style={{
                          background: isActive
                            ? "oklch(0.55 0.19 245)"
                            : "oklch(0.99 0.01 245)",
                          borderColor: isActive
                            ? "oklch(0.72 0.15 235)"
                            : "oklch(0.84 0.06 235)",
                        }}
                        onMouseEnter={e => {
                          if (!isActive) {
                            e.currentTarget.style.background =
                              "oklch(0.94 0.045 235)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (!isActive) {
                            e.currentTarget.style.background =
                              "oklch(0.99 0.01 245)";
                          }
                        }}
                      >
                        <div
                          className="flex size-9 shrink-0 items-center justify-center rounded-md"
                          style={{
                            background: isActive
                              ? "oklch(0.78 0.14 230 / 22%)"
                              : "oklch(0.91 0.045 235)",
                          }}
                        >
                          <item.icon
                            className="size-4"
                            style={{
                              color: isActive
                                ? "white"
                                : "oklch(0.48 0.16 245)",
                            }}
                          />
                        </div>
                        <span
                          className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-5"
                          style={{
                            color: isActive
                              ? "white"
                              : "oklch(0.25 0.055 255)",
                          }}
                        >
                          {item.label}
                        </span>
                        {isActive && (
                          <ChevronRight
                            className="size-3 shrink-0"
                            style={{ color: "white" }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {menuItems.length === 0 && (
            <div className="px-3 py-10 text-center text-xs text-slate-500">
              Žádná aplikace neodpovídá hledání „{query}“.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function MobileNav({ onAppsClick }: { onAppsClick: () => void }) {
  const [location, setLocation] = useLocation();
  const mobileItems = dockItems.slice(0, 4);

  return (
    <nav
      aria-label="Hlavní mobilní navigace"
      className="fixed inset-x-0 bottom-0 z-[9999] grid grid-cols-5 border-t px-1 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-xl md:hidden"
      style={{
        background: "var(--shell-surface-strong)",
        borderColor: "var(--shell-border)",
        boxShadow: "0 -4px 20px var(--shell-glow)",
      }}
    >
      {mobileItems.map(item => {
        const Icon = item.icon;
        const isActive = location === item.path;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => setLocation(item.path)}
            className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium"
            style={{ color: isActive ? item.color : "oklch(0.62 0.04 250)" }}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className="size-[18px]" />
            <span className="max-w-full truncate">{item.label}</span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAppsClick}
        className="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium text-slate-400"
      >
        <Search className="size-[18px]" />
        <span>Aplikace</span>
      </button>
    </nav>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const [location] = useLocation();
  const [appsOpen, setAppsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: onboardingData } = trpc.onboarding.status.useQuery(undefined, {
    enabled: !!user,
    staleTime: Infinity,
  });
  const { logout } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (onboardingData && onboardingData.completed === false) {
      setShowOnboarding(true);
    }
  }, [onboardingData]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-slate-950 text-slate-100">
        {/* Animated Aurora Neon Glow Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden h-full w-full">
          <div
            className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-600/40 rounded-full blur-[120px] mix-blend-screen animate-pulse"
            style={{ animationDuration: "4s" }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen animate-pulse"
            style={{ animationDuration: "5s", animationDelay: "1s" }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-[150px] mix-blend-screen animate-pulse"
            style={{ animationDuration: "6s", animationDelay: "2s" }}
          />
        </div>

        {/* Login Card */}
        <div className="relative z-10 flex flex-col items-center gap-8 p-10 max-w-md w-full bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-3xl shadow-2xl shadow-indigo-900/20">
          <div className="flex flex-col items-center gap-3 mb-2">
            <div className="h-28 w-28 flex items-center justify-center relative group">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full drop-shadow-[0_0_20px_rgba(34,211,238,0.7)] animate-[spin_20s_linear_infinite]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  {/* Core glowing red sphere */}
                  <radialGradient id="coreSphere" cx="35%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#ff8a8a" />
                    <stop offset="50%" stopColor="#ff0000" />
                    <stop offset="100%" stopColor="#660000" />
                  </radialGradient>

                  {/* Deep blue glowing rings */}
                  <linearGradient
                    id="blueRing"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#818cf8" />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>

                  {/* Electron silver spheres */}
                  <radialGradient id="electron" cx="30%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="50%" stopColor="#94a3b8" />
                    <stop offset="100%" stopColor="#334155" />
                  </radialGradient>

                  {/* Drop shadow for core glow */}
                  <filter
                    id="coreGlow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite
                      in="SourceGraphic"
                      in2="blur"
                      operator="over"
                    />
                  </filter>
                </defs>

                {/* Orbital rings */}
                <g stroke="url(#blueRing)" strokeWidth="1.5">
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="14"
                    ry="46"
                    transform="rotate(0 50 50)"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="14"
                    ry="46"
                    transform="rotate(60 50 50)"
                  />
                  <ellipse
                    cx="50"
                    cy="50"
                    rx="14"
                    ry="46"
                    transform="rotate(-60 50 50)"
                  />
                </g>

                {/* Electrons */}
                <circle
                  cx="50"
                  cy="4"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />
                <circle
                  cx="50"
                  cy="96"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />
                <circle
                  cx="10"
                  cy="73"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />
                <circle
                  cx="90"
                  cy="27"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />
                <circle
                  cx="90"
                  cy="73"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />
                <circle
                  cx="10"
                  cy="27"
                  r="3.5"
                  fill="url(#electron)"
                  filter="drop-shadow(0 0 2px rgba(255,255,255,0.8))"
                />

                {/* Nucleus massive red core */}
                <circle
                  cx="50"
                  cy="50"
                  r="13"
                  fill="url(#coreSphere)"
                  filter="url(#coreGlow)"
                />
              </svg>
            </div>

            <div className="flex flex-col items-center gap-1 mt-2 text-center">
              <span
                className="text-4xl font-black tracking-[0.1em] text-transparent bg-clip-text bg-gradient-to-br from-blue-300 via-white to-cyan-300 uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                ONYX <span className="opacity-70">OS</span>
              </span>
              <span className="text-[10px] font-bold text-cyan-400/80 tracking-[0.4em] uppercase drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">
                Revenue Operations
              </span>
            </div>
          </div>

          <div className="text-center space-y-3">
            <h1 className="text-xl font-bold tracking-tight text-white">
              {t("home.signInToContinue")}
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px] mx-auto">
              {t("home.signInDesc")}
            </p>
          </div>

          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            className="w-full h-12 text-base font-bold tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.4)] border border-white/10 transition-all hover:scale-[1.02]"
          >
            {t("home.signInButton")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* macOS top menubar */}
      <MacMenuBar
        user={user}
        logout={logout}
        onAppsClick={() => setAppsOpen(v => !v)}
      />

      {/* Apps slide-over panel */}
      <AppsPanel open={appsOpen} onClose={() => setAppsOpen(false)} />

      {/* Main content — padded for menubar (top 8) and dock (bottom ~80px) */}
      <main
        className="onyx-workspace flex-1 overflow-y-auto p-4 md:p-6 md:pl-[84px]"
        style={{
          paddingTop: "calc(2rem + env(safe-area-inset-top, 0px) + 16px)",
          paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        {children}
      </main>

      {/* macOS Dock */}
      <MacDock onAppsClick={() => setAppsOpen(v => !v)} />
      <MobileNav onAppsClick={() => setAppsOpen(v => !v)} />

      <Suspense fallback={null}>
        {showOnboarding && (
          <OnboardingWizard
            userName={user?.name ?? undefined}
            onComplete={() => setShowOnboarding(false)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {user &&
          !["/command-center", "/hermio", "/hermes", "/chat-agent"].includes(
            location
          ) && <AIChatWidget />}
      </Suspense>
    </div>
  );
}
