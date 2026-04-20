import { useAuth } from "@/_core/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getLoginUrl } from "@/const";
import {
  LayoutDashboard, LogOut, Zap, History, BarChart3, Mail, Users,
  Kanban, DollarSign, Bot, Webhook, Target, UserCheck, Lightbulb, Ear, Code,
  Bell, ListFilter, ShieldCheck, GitBranch, Building, Timer, Cpu, MailOpen,
  CheckSquare, Crosshair, Globe, BookOpen, Map, Brain, Calendar, Phone,
  TrendingUp, Trophy, Link2, Megaphone, FileBarChart, Scroll, FlaskConical, Sparkles, Moon,
  CircleDollarSign, TrendingUp as TrendUp, Activity, Inbox, ChevronRight, Wifi, Battery,
  Volume2, Search, Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import OnboardingWizard from "./OnboardingWizard";
import AIChatWidget from "./AIChatWidget";
import { trpc } from "@/lib/trpc";

// ─── Dock item definitions (ordered by business impact DESC) ─────────────────
const dockItems = [
  // TIER 1 — Revenue & Pipeline (přímý dopad na příjmy)
  { icon: Zap,          path: "/generate",        label: "Generovat leady",  color: "oklch(0.65 0.20 150)" },
  { icon: Kanban,       path: "/kanban",          label: "Pipeline",         color: "oklch(0.58 0.18 200)" },
  { icon: TrendingUp,   path: "/deal-pipeline",   label: "Obchody",          color: "oklch(0.60 0.20 140)" },
  { icon: UserCheck,    path: "/sdr",             label: "SDR Agent",        color: "oklch(0.62 0.22 192)" },
  { icon: Bot,          path: "/autopilot",       label: "Autopilot",        color: "oklch(0.55 0.22 270)" },
  // TIER 2 — Intelligence & Targeting
  { icon: Target,       path: "/icp",             label: "ICP Builder",      color: "oklch(0.60 0.20 20)" },
  { icon: MailOpen,     path: "/sequences",       label: "E-mail sekvence",  color: "oklch(0.58 0.18 230)" },
  { icon: Megaphone,    path: "/ad-campaigns",    label: "Reklamy",          color: "oklch(0.60 0.22 30)" },
  { icon: ListFilter,   path: "/smart-lists",     label: "Smart Lists",      color: "oklch(0.58 0.16 180)" },
  { icon: Inbox,        path: "/external-leads",  label: "Ext. Leady",       color: "oklch(0.60 0.18 160)" },
  // TIER 3 — Analytics & Insights
  { icon: Trophy,       path: "/sales-dashboard", label: "Sales",            color: "oklch(0.65 0.20 60)" },
  { icon: BarChart3,    path: "/stats",           label: "Statistiky",       color: "oklch(0.58 0.18 240)" },
  { icon: TrendingUp,   path: "/roi-audit",       label: "ROI Audit",        color: "oklch(0.60 0.22 160)" },
  { icon: Link2,        path: "/projects",        label: "Projekty",         color: "oklch(0.58 0.16 200)" },
  // TIER 4 — AI & Knowledge
  { icon: Cpu,          path: "/computer-flow",  label: "Computer Flow",   color: "oklch(0.62 0.22 190)" },
  { icon: Sparkles,     path: "/hermes",          label: "HERMES",           color: "oklch(0.65 0.22 280)" },
  { icon: Brain,        path: "/chat-agent",      label: "AI Poradce",       color: "oklch(0.60 0.22 260)" },
  { icon: BookOpen,     path: "/ai-skills",       label: "AI Skills",        color: "oklch(0.62 0.22 300)" },
  { icon: History,      path: "/history",         label: "Historie",         color: "oklch(0.60 0.15 220)" },
  // TIER 5 — System & Settings
  { icon: LayoutDashboard, path: "/dashboard",   label: "Dashboard",        color: "oklch(0.55 0.20 192)" },
  { icon: Webhook,      path: "/integrations",    label: "Integrace",        color: "oklch(0.55 0.18 280)" },
  { icon: Users,        path: "/team",            label: "Tým",              color: "oklch(0.58 0.16 220)" },
  { icon: DollarSign,   path: "/billing",         label: "Billing",          color: "oklch(0.62 0.20 140)" },
  { icon: Settings,     path: "/ai-constitution", label: "Nastavení",        color: "oklch(0.52 0.12 250)" },
];

// Full sidebar items (ordered by business impact DESC within groups)
const allMenuItems = [
  // TIER 1 — Revenue & Pipeline
  { icon: Zap,          labelKey: "sidebar.generateLeads",    path: "/generate",        group: "revenue" },
  { icon: Kanban,       labelKey: "sidebar.pipelineBoard",    path: "/kanban",          group: "revenue" },
  { icon: TrendingUp,   labelKey: "sidebar.dealPipeline",     path: "/deal-pipeline",   group: "revenue" },
  { icon: UserCheck,    labelKey: "sidebar.aiSdrAgent",       path: "/sdr",             group: "revenue" },
  { icon: Bot,          labelKey: "sidebar.autopilot",        path: "/autopilot",       group: "revenue" },
  { icon: MailOpen,     labelKey: "sidebar.emailSequences",   path: "/sequences",       group: "revenue" },
  { icon: Megaphone,    labelKey: "sidebar.adCampaigns",      path: "/ad-campaigns",    group: "revenue" },
  // TIER 2 — Intelligence & Targeting
  { icon: Target,       labelKey: "sidebar.icpBuilder",       path: "/icp",             group: "intelligence" },
  { icon: ListFilter,   labelKey: "sidebar.smartLists",       path: "/smart-lists",     group: "intelligence" },
  { icon: Inbox,        labelKey: "sidebar.externalLeads",    path: "/external-leads",  group: "intelligence" },
  { icon: ShieldCheck,  labelKey: "sidebar.emailVerify",      path: "/email-verify",    group: "intelligence" },
  { icon: Code,         labelKey: "sidebar.trackingPixel",    path: "/tracking",        group: "intelligence" },
  { icon: Cpu,          labelKey: "sidebar.techStack",        path: "/tech-stack",      group: "intelligence" },
  { icon: Globe,        labelKey: "sidebar.marketIntel",      path: "/market-intel",    group: "intelligence" },
  { icon: Map,          labelKey: "sidebar.competitiveMap",   path: "/competitive",     group: "intelligence" },
  // TIER 3 — Analytics & ROI
  { icon: Trophy,       labelKey: "sidebar.salesDashboard",   path: "/sales-dashboard", group: "analytics" },
  { icon: BarChart3,    labelKey: "sidebar.statistics",       path: "/stats",           group: "analytics" },
  { icon: TrendingUp,   labelKey: "sidebar.roiAudit",         path: "/roi-audit",       group: "analytics" },
  { icon: DollarSign,   labelKey: "sidebar.roiTracker",       path: "/roi",             group: "analytics" },
  { icon: Trophy,       labelKey: "sidebar.portfolioROAS",    path: "/portfolio-roas",  group: "analytics" },
  { icon: Link2,        labelKey: "sidebar.projectsHub",      path: "/projects",        group: "analytics" },
  { icon: History,      labelKey: "sidebar.leadHistory",      path: "/history",         group: "analytics" },
  // TIER 4 — AI & Knowledge
  { icon: Cpu,          labelKey: "sidebar.computerFlow",    path: "/computer-flow",  group: "ai" },
  { icon: Sparkles,     labelKey: "sidebar.hermes",           path: "/hermes",          group: "ai" },
  { icon: Brain,        labelKey: "sidebar.aiAdvisor",        path: "/chat-agent",      group: "ai" },
  { icon: BookOpen,     labelKey: "sidebar.aiSkills",         path: "/ai-skills",       group: "ai" },
  { icon: Brain,        labelKey: "sidebar.fiveBrains",       path: "/five-brains",     group: "ai" },
  { icon: BookOpen,     labelKey: "sidebar.knowledgeBase",    path: "/knowledge",       group: "ai" },
  // TIER 5 — Outreach & Automation
  { icon: GitBranch,    labelKey: "sidebar.campaigns",        path: "/campaigns",       group: "outreach" },
  { icon: Timer,        labelKey: "sidebar.speedToLead",      path: "/speed-to-lead",   group: "outreach" },
  { icon: Lightbulb,    labelKey: "sidebar.nextActions",      path: "/next-actions",    group: "outreach" },
  { icon: Bell,         labelKey: "sidebar.smartAlerts",      path: "/alerts",          group: "outreach" },
  { icon: Calendar,     labelKey: "sidebar.meetingScheduler", path: "/meetings",        group: "outreach" },
  { icon: Phone,        labelKey: "sidebar.callIntelligence", path: "/calls",           group: "outreach" },
  { icon: CheckSquare,  labelKey: "sidebar.activityTracker",  path: "/tasks",           group: "outreach" },
  { icon: Crosshair,    labelKey: "sidebar.capturePlanning",  path: "/capture",         group: "outreach" },
  { icon: Ear,          labelKey: "sidebar.socialListening",  path: "/social",          group: "outreach" },
  { icon: Target,       labelKey: "sidebar.b2bMatching",      path: "/matching",        group: "outreach" },
  { icon: Bot,          labelKey: "sidebar.aiAgents",         path: "/ai-agents",       group: "outreach" },
  // TIER 6 — System & Settings
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard",     path: "/dashboard",       group: "settings" },
  { icon: Webhook,      labelKey: "sidebar.integrations",     path: "/integrations",    group: "settings" },
  { icon: Users,        labelKey: "sidebar.team",             path: "/team",            group: "settings" },
  { icon: Building,     labelKey: "sidebar.agencyPanel",      path: "/agency",          group: "settings" },
  { icon: DollarSign,   labelKey: "sidebar.billingPlans",     path: "/billing",         group: "settings" },
  { icon: FileBarChart, labelKey: "sidebar.dailyReport",      path: "/daily-report",    group: "settings" },
  { icon: Mail,         labelKey: "sidebar.emailTemplates",   path: "/templates",       group: "settings" },
  { icon: Scroll,       labelKey: "sidebar.aiConstitution",   path: "/ai-constitution", group: "settings" },
  { icon: FlaskConical, labelKey: "sidebar.agentBenchmark",   path: "/agent-benchmark", group: "settings" },
  { icon: Moon,         labelKey: "sidebar.deepSleep",        path: "/deep-sleep",      group: "settings" },
];

const groupLabels: Record<string, string> = {
  revenue:      "💰 Revenue & Pipeline",
  intelligence: "🎯 Intelligence",
  analytics:    "📊 Analytics & ROI",
  ai:           "🧠 AI & Knowledge",
  outreach:     "📧 Outreach",
  settings:     "⚙️ System",
};

// ─── macOS MenuBar ─────────────────────────────────────────────────────────
function MacMenuBar({ user, logout, onAppsClick }: { user: any; logout: () => void; onAppsClick: () => void }) {
  const [time, setTime] = useState(() => new Date());
  const { data: earningsData } = trpc.globalEarnings.summary.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 1 USD ≈ 25 CZK — earnings stored in USD cents, displayed in CZK
  const USD_TO_CZK = 25;
  const fmtCZK = (cents: number) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format((cents / 100) * USD_TO_CZK);

  const timeStr = time.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  const dateStr = time.toLocaleDateString("cs-CZ", { weekday: "short", day: "numeric", month: "short" });

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-8 select-none"
      style={{
        background: "oklch(0.97 0.006 240 / 88%)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid oklch(0.88 0.010 240 / 60%)",
        boxShadow: "0 1px 0 oklch(0 0 0 / 6%), 0 2px 8px oklch(0 0 0 / 4%)",
      }}
    >
      {/* Left: Apple logo + app name */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAppsClick}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all text-xs font-semibold"
          style={{ color: "oklch(0.25 0.04 250)", fontFamily: "'Space Grotesk', sans-serif" }}
          onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.20 192 / 10%)")}
          onMouseLeave={e => (e.currentTarget.style.background = "")}
        >
          <div className="h-4 w-4 rounded flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 192), oklch(0.52 0.24 220))" }}>
            <Zap className="h-2.5 w-2.5 text-white" />
          </div>
          Lead<span style={{ color: "oklch(0.50 0.22 192)" }}>OS</span>
        </button>

        {/* Live earnings pill */}
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full ml-1"
          style={{ background: "oklch(0.55 0.20 150 / 10%)", border: "1px solid oklch(0.55 0.20 150 / 20%)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "oklch(0.65 0.20 150)" }} />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5"
              style={{ background: "oklch(0.65 0.20 150)" }} />
          </span>
          <span className="text-[10px] font-medium tabular-nums" style={{ color: "oklch(0.45 0.18 150)", fontFamily: "'Space Grotesk', sans-serif" }}>
            {earningsData ? fmtCZK(earningsData.todayRevenueCents) : "…"} dnes
            {earningsData && earningsData.totalRevenueCents > 0 && (
              <span className="ml-1.5 opacity-60">| celkem {fmtCZK(earningsData.totalRevenueCents)}</span>
            )}
          </span>
        </div>
      </div>

      {/* Center: date */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        <span className="text-[11px] font-medium" style={{ color: "oklch(0.42 0.04 250)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {dateStr}
        </span>
      </div>

      {/* Right: status icons + time + user */}
      <div className="flex items-center gap-2">
        <Wifi className="h-3 w-3" style={{ color: "oklch(0.50 0.04 250)" }} />
        <Battery className="h-3 w-3" style={{ color: "oklch(0.50 0.04 250)" }} />
        <Volume2 className="h-3 w-3" style={{ color: "oklch(0.50 0.04 250)" }} />

        <span className="text-[11px] font-semibold tabular-nums" style={{ color: "oklch(0.25 0.04 250)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {timeStr}
        </span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md transition-all focus:outline-none"
              onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.20 192 / 10%)")}
              onMouseLeave={e => (e.currentTarget.style.background = "")}>
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px] font-bold"
                  style={{ background: "linear-gradient(135deg, oklch(0.55 0.20 192 / 25%), oklch(0.55 0.24 278 / 20%))", color: "oklch(0.40 0.20 192)" }}>
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-[11px] font-medium hidden sm:block" style={{ color: "oklch(0.30 0.04 250)" }}>
                {user?.name?.split(" ")[0] ?? "User"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 mt-1"
            style={{ background: "oklch(0.98 0.004 240 / 95%)", backdropFilter: "blur(20px)", border: "1px solid oklch(0.88 0.012 240)", boxShadow: "0 8px 32px oklch(0 0 0 / 12%)" }}>
            <div className="px-3 py-2 border-b" style={{ borderColor: "oklch(0.90 0.010 240)" }}>
              <p className="text-xs font-semibold truncate" style={{ color: "oklch(0.25 0.04 250)" }}>{user?.name}</p>
              <p className="text-[10px] truncate mt-0.5" style={{ color: "oklch(0.55 0.04 250)" }}>{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={logout} className="cursor-pointer mt-1 text-red-600 focus:text-red-600 focus:bg-red-50">
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs">Sign out</span>
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
  const { t } = useTranslation();

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
      className="fixed left-0 top-8 bottom-0 z-40 flex flex-col items-center py-3 gap-1 overflow-y-auto"
      style={{
        width: 56,
        background: "oklch(0.97 0.006 240 / 92%)",
        backdropFilter: "blur(24px) saturate(200%)",
        WebkitBackdropFilter: "blur(24px) saturate(200%)",
        borderRight: "1px solid oklch(0.88 0.012 240 / 70%)",
        boxShadow: "2px 0 16px oklch(0 0 0 / 6%)",
        scrollbarWidth: "none",
      }}
    >
      {dockItems.map((item, idx) => {
        const isActive = location === item.path;
        const scale = getScale(idx);
        const Icon = item.icon;

        return (
          <div key={item.path} className="relative flex flex-col items-center"
            style={{ transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)", transform: `scale(${scale})`, transformOrigin: "center left" }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Tooltip */}
            {hoveredIdx === idx && (
              <div className="absolute left-12 z-50 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none"
                style={{ background: "oklch(0.20 0.04 250 / 90%)", color: "white", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px oklch(0 0 0 / 20%)" }}>
                {item.label}
              </div>
            )}

            <button
              onClick={() => setLocation(item.path)}
              className="relative flex items-center justify-center rounded-xl transition-all focus:outline-none"
              style={{
                width: 40,
                height: 40,
                background: isActive
                  ? `linear-gradient(135deg, ${item.color}22, ${item.color}15)`
                  : "oklch(0.94 0.008 240)",
                border: isActive
                  ? `1.5px solid ${item.color}44`
                  : "1.5px solid oklch(0.88 0.010 240 / 50%)",
                boxShadow: isActive
                  ? `0 0 12px ${item.color}30, 0 2px 8px oklch(0 0 0 / 8%)`
                  : "0 2px 6px oklch(0 0 0 / 6%)",
              }}
            >
              <Icon className="h-[18px] w-[18px]" style={{ color: isActive ? item.color : "oklch(0.45 0.06 250)" }} />
            </button>

            {/* Active dot */}
            {isActive && (
              <div className="absolute left-0 w-0.5 h-6 rounded-r-full"
                style={{ background: item.color, boxShadow: `0 0 4px ${item.color}` }} />
            )}
          </div>
        );
      })}

      {/* Separator */}
      <div className="w-6 h-px my-1 rounded-full" style={{ background: "oklch(0.80 0.012 240)" }} />

      {/* All Apps button */}
      <div className="relative flex flex-col items-center"
        style={{ transition: "transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)", transform: `scale(${hoveredIdx === dockItems.length ? 1.55 : 1})`, transformOrigin: "bottom center" }}
        onMouseEnter={() => setHoveredIdx(dockItems.length)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {hoveredIdx === dockItems.length && (
          <div className="absolute left-12 z-50 px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap pointer-events-none"
            style={{ background: "oklch(0.20 0.04 250 / 90%)", color: "white" }}>
            All Apps
          </div>
        )}
        <button
          onClick={onAppsClick}
          className="flex items-center justify-center rounded-xl focus:outline-none"
          style={{
            width: 40,
            height: 40,
            background: "linear-gradient(135deg, oklch(0.55 0.20 192 / 12%), oklch(0.55 0.24 278 / 10%))",
            border: "1.5px solid oklch(0.55 0.20 192 / 25%)",
          }}
        >
          <div className="grid grid-cols-2 gap-0.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-sm" style={{ background: "oklch(0.55 0.20 192)" }} />
            ))}
          </div>
        </button>
      </div>
    </div>
  );
}

// ─── All Apps Slide-over Panel ─────────────────────────────────────────────
function AppsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();
  const menuItems = allMenuItems.map(item => ({ ...item, label: t(item.labelKey) }));

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
          style={{ background: "oklch(0 0 0 / 20%)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className="fixed left-0 top-8 bottom-0 z-40 w-72 overflow-y-auto"
        style={{
          background: "oklch(0.97 0.006 240 / 95%)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          borderRight: "1px solid oklch(0.88 0.012 240 / 70%)",
          boxShadow: "4px 0 24px oklch(0 0 0 / 10%)",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Search bar */}
        <div className="sticky top-0 px-4 py-3 border-b"
          style={{ borderColor: "oklch(0.88 0.012 240 / 60%)", background: "oklch(0.97 0.006 240 / 95%)", backdropFilter: "blur(20px)" }}>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "oklch(0.92 0.008 240)", border: "1px solid oklch(0.86 0.010 240)" }}>
            <Search className="h-3.5 w-3.5" style={{ color: "oklch(0.55 0.04 250)" }} />
            <span className="text-xs" style={{ color: "oklch(0.60 0.04 250)" }}>Hledat aplikaci…</span>
          </div>
        </div>

        <div className="px-3 py-2">
          {(["core", "intelligence", "automation", "outreach", "insights", "settings"] as const).map(group => {
            const groupItems = menuItems.filter(i => i.group === group);
            if (!groupItems.length) return null;
            return (
              <div key={group} className="mb-4">
                {groupLabels[group] && (
                  <div className="px-2 pt-3 pb-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
                      style={{ color: "oklch(0.55 0.20 192 / 70%)" }}>
                      {groupLabels[group]}
                    </span>
                  </div>
                )}
                {groupItems.map(item => {
                  const isActive = location === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left"
                      style={isActive ? {
                        background: "oklch(0.55 0.20 192 / 10%)",
                        border: "1px solid oklch(0.55 0.20 192 / 20%)",
                      } : {}}
                      onMouseEnter={e => !isActive && (e.currentTarget.style.background = "oklch(0.90 0.008 240)")}
                      onMouseLeave={e => !isActive && (e.currentTarget.style.background = "")}
                    >
                      <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: isActive ? "oklch(0.55 0.20 192 / 15%)" : "oklch(0.92 0.008 240)" }}>
                        <item.icon className="h-3.5 w-3.5"
                          style={{ color: isActive ? "oklch(0.50 0.20 192)" : "oklch(0.50 0.06 250)" }} />
                      </div>
                      <span className="text-xs font-medium truncate"
                        style={{ color: isActive ? "oklch(0.40 0.20 192)" : "oklch(0.35 0.04 250)" }}>
                        {item.label}
                      </span>
                      {isActive && <ChevronRight className="h-3 w-3 ml-auto shrink-0" style={{ color: "oklch(0.55 0.20 192)" }} />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main Layout ───────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
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
      <div className="flex items-center justify-center min-h-screen mesh-bg">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 192), oklch(0.52 0.24 220))", boxShadow: "0 0 30px oklch(0.55 0.20 192 / 35%)" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.04 250)" }}>
              Lead<span style={{ color: "oklch(0.50 0.22 192)" }}>OS</span>
            </span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight section-header-premium">{t('home.signInToContinue')}</h1>
            <p className="text-sm text-muted-foreground">{t('home.signInDesc')}</p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="w-full btn-premium h-12 text-base"
          >
            {t('home.signInButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "oklch(0.965 0.008 240)" }}>
      {/* macOS top menubar */}
      <MacMenuBar user={user} logout={logout} onAppsClick={() => setAppsOpen(v => !v)} />

      {/* Apps slide-over panel */}
      <AppsPanel open={appsOpen} onClose={() => setAppsOpen(false)} />

      {/* Main content — padded for menubar (top 8) and dock (bottom ~80px) */}
      <main
        className="flex-1 overflow-y-auto p-5 md:p-6"
        style={{ paddingTop: "calc(2rem + 16px)", paddingBottom: "24px", paddingLeft: "56px" }}
      >
        {children}
      </main>

      {/* macOS Dock */}
      <MacDock onAppsClick={() => setAppsOpen(v => !v)} />

      {showOnboarding && (
        <OnboardingWizard
          userName={user?.name ?? undefined}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {user && <AIChatWidget />}
    </div>
  );
}
