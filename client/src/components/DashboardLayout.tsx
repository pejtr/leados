import { useAuth } from "@/_core/hooks/useAuth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard, LogOut, PanelLeft, Zap, History, BarChart3, Mail, Users,
  Kanban, DollarSign, Bot, Webhook, Target, UserCheck, Lightbulb, Ear, Code,
  Bell, ListFilter, ShieldCheck, GitBranch, Building, Timer, Cpu, MailOpen,
  CheckSquare, Crosshair, Globe, BookOpen, Map, Brain, ChevronRight, Calendar, Phone,
  TrendingUp, Trophy, Link2, Megaphone, FileBarChart, Scroll, FlaskConical,
} from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import OnboardingWizard from "./OnboardingWizard";
import AIChatWidget from "./AIChatWidget";
import { trpc } from "@/lib/trpc";

const menuItemDefs = [
  { icon: LayoutDashboard, labelKey: "sidebar.dashboard", path: "/dashboard", group: "core" },
  { icon: Brain, labelKey: "sidebar.aiAdvisor", path: "/chat-agent", group: "core" },
  { icon: Zap, labelKey: "sidebar.generateLeads", path: "/generate", group: "core" },
  { icon: History, labelKey: "sidebar.leadHistory", path: "/history", group: "core" },
  { icon: Kanban, labelKey: "sidebar.pipelineBoard", path: "/kanban", group: "core" },
  { icon: Target, labelKey: "sidebar.icpBuilder", path: "/icp", group: "intelligence" },
  { icon: Code, labelKey: "sidebar.trackingPixel", path: "/tracking", group: "intelligence" },
  { icon: Cpu, labelKey: "sidebar.techStack", path: "/tech-stack", group: "intelligence" },
  { icon: ListFilter, labelKey: "sidebar.smartLists", path: "/smart-lists", group: "intelligence" },
  { icon: ShieldCheck, labelKey: "sidebar.emailVerify", path: "/email-verify", group: "intelligence" },
  { icon: UserCheck, labelKey: "sidebar.aiSdrAgent", path: "/sdr", group: "automation" },
  { icon: Bot, labelKey: "sidebar.aiAgents", path: "/ai-agents", group: "automation" },
  { icon: Bot, labelKey: "sidebar.autopilot", path: "/autopilot", group: "automation" },
  { icon: GitBranch, labelKey: "sidebar.campaigns", path: "/campaigns", group: "automation" },
  { icon: Timer, labelKey: "sidebar.speedToLead", path: "/speed-to-lead", group: "automation" },
  { icon: Lightbulb, labelKey: "sidebar.nextActions", path: "/next-actions", group: "automation" },
  { icon: Bell, labelKey: "sidebar.smartAlerts", path: "/alerts", group: "automation" },
  { icon: MailOpen, labelKey: "sidebar.emailSequences", path: "/sequences", group: "outreach" },
  { icon: Calendar, labelKey: "sidebar.meetingScheduler", path: "/meetings", group: "outreach" },
  { icon: Phone, labelKey: "sidebar.callIntelligence", path: "/calls", group: "outreach" },
  { icon: CheckSquare, labelKey: "sidebar.activityTracker", path: "/tasks", group: "outreach" },
  { icon: Crosshair, labelKey: "sidebar.capturePlanning", path: "/capture", group: "outreach" },
  { icon: Globe, labelKey: "sidebar.marketIntel", path: "/market-intel", group: "outreach" },
  { icon: BookOpen, labelKey: "sidebar.knowledgeBase", path: "/knowledge", group: "outreach" },
  { icon: Map, labelKey: "sidebar.competitiveMap", path: "/competitive", group: "outreach" },
  { icon: TrendingUp, labelKey: "sidebar.dealPipeline", path: "/deal-pipeline", group: "insights" },
  { icon: Trophy, labelKey: "sidebar.salesDashboard", path: "/sales-dashboard", group: "insights" },
  { icon: Link2, labelKey: "sidebar.projectsHub", path: "/projects", group: "insights" },
  { icon: Ear, labelKey: "sidebar.socialListening", path: "/social", group: "insights" },
  { icon: Target, labelKey: "sidebar.b2bMatching", path: "/matching", group: "insights" },
  { icon: BarChart3, labelKey: "sidebar.statistics", path: "/stats", group: "insights" },
  { icon: DollarSign, labelKey: "sidebar.roiTracker", path: "/roi", group: "insights" },
  { icon: Megaphone, labelKey: "sidebar.adCampaigns", path: "/ad-campaigns", group: "insights" },
  { icon: Trophy, labelKey: "sidebar.portfolioROAS", path: "/portfolio-roas", group: "insights" },
  { icon: Brain, labelKey: "sidebar.fiveBrains", path: "/five-brains", group: "insights" },
  { icon: FileBarChart, labelKey: "sidebar.dailyReport", path: "/daily-report", group: "settings" },
  { icon: Scroll, labelKey: "sidebar.aiConstitution", path: "/ai-constitution", group: "settings" },
  { icon: FlaskConical, labelKey: "sidebar.agentBenchmark", path: "/agent-benchmark", group: "settings" },
  { icon: Mail, labelKey: "sidebar.emailTemplates", path: "/templates", group: "settings" },
  { icon: Users, labelKey: "sidebar.team", path: "/team", group: "settings" },
  { icon: Building, labelKey: "sidebar.agencyPanel", path: "/agency", group: "settings" },
  { icon: Webhook, labelKey: "sidebar.integrations", path: "/integrations", group: "settings" },
  { icon: DollarSign, labelKey: "sidebar.billingPlans", path: "/billing", group: "settings" },
];

const groupConfigBase = {
  core: { labelKey: "", color: "violet" },
  intelligence: { labelKey: "sidebar.groups.intelligence", color: "cyan" },
  automation: { labelKey: "sidebar.groups.automation", color: "violet" },
  outreach: { labelKey: "sidebar.groups.outreach", color: "emerald" },
  insights: { labelKey: "sidebar.groups.insights", color: "amber" },
  settings: { labelKey: "sidebar.groups.settings", color: "muted" },
} as const;

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

      if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen mesh-bg">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 192), oklch(0.52 0.24 220))", boxShadow: "0 0 30px oklch(0.55 0.20 192 / 35%)" }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.04 250)" }}>
              Lead<span className="gradient-text-atlantis">OS</span>
            </span>
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight section-header-premium">{t('home.signInToContinue')}</h1>
            <p className="text-sm text-muted-foreground">{t('home.signInDesc')}</p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full btn-premium h-12 text-base"
          >
            {t('home.signInButton')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const menuItems = menuItemDefs.map(item => ({ ...item, label: t(item.labelKey) }));
  const groupConfig = Object.fromEntries(
    Object.entries(groupConfigBase).map(([k, v]) => [k, { ...v, label: v.labelKey ? t(v.labelKey) : "" }])
  ) as Record<string, { label: string; color: string }>;
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { data: onboardingData } = trpc.onboarding.status.useQuery(undefined, {
    enabled: !!user,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (onboardingData && onboardingData.completed === false) {
      setShowOnboarding(true);
    }
  }, [onboardingData]);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
          style={{ background: "oklch(0.955 0.010 240)" }}
        >
          {/* Sidebar top teal accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, transparent, oklch(0.55 0.20 192 / 60%), transparent)" }} />

          <SidebarHeader className="h-16 justify-center border-b" style={{ borderColor: "oklch(0.86 0.012 240)" }}>
            <div className="flex items-center gap-3 px-2 w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg transition-all focus:outline-none shrink-0"
                style={{ color: "oklch(0.52 0.02 250)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.20 192 / 8%)")}
                onMouseLeave={e => (e.currentTarget.style.background = "")}
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
              {!isCollapsed && (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "linear-gradient(135deg, oklch(0.50 0.22 192), oklch(0.52 0.24 220))",
                      boxShadow: "0 0 16px oklch(0.55 0.20 192 / 35%)"
                    }}>
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="font-bold tracking-tight truncate text-sm"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.04 250)" }}>
                    Lead<span className="gradient-text-atlantis">OS</span>
                  </span>
                </div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto py-2">
            <SidebarMenu className="px-2">
              {(["core", "intelligence", "automation", "outreach", "insights", "settings"] as const).map((group) => {
                const { label } = groupConfig[group];
                const groupItems = menuItems.filter(i => i.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group}>
                    {label && !isCollapsed && (
                      <div className="px-3 pt-5 pb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-[0.12em]"
                          style={{ color: "oklch(0.55 0.20 192 / 70%)" }}>
                          {label}
                        </span>
                      </div>
                    )}
                    {groupItems.map(item => {
                      const isActive = location === item.path;
                      return (
                        <SidebarMenuItem key={item.path}>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => setLocation(item.path)}
                            tooltip={item.label}
                            className="h-8 transition-all font-normal text-[13px] relative"
                            style={isActive ? {
                              background: "oklch(0.55 0.20 192 / 10%)",
                              border: "1px solid oklch(0.55 0.20 192 / 22%)",
                              color: "oklch(0.40 0.20 192)",
                            } : {
                              color: "oklch(0.42 0.025 250)",
                            }}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
                                style={{
                                  background: "oklch(0.55 0.20 192)",
                                  boxShadow: "0 0 8px oklch(0.55 0.20 192 / 70%)"
                                }} />
                            )}
                            <item.icon className="h-3.5 w-3.5 shrink-0"
                              style={isActive ? { color: "oklch(0.50 0.20 192)" } : {}} />
                            <span className="truncate">{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3 border-t" style={{ borderColor: "oklch(0.86 0.012 240)" }}>
            {!isCollapsed && (
              <div className="px-1 pb-2">
                <LanguageSwitcher variant="pills" className="w-full justify-center" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-xl px-2 py-2 transition-all w-full text-left focus:outline-none group" style={{ }} onMouseEnter={e => (e.currentTarget.style.background = "oklch(0.55 0.20 192 / 6%)")} onMouseLeave={e => (e.currentTarget.style.background = "")}>
                  <Avatar className="h-8 w-8 shrink-0 ring-1" style={{ ringColor: "oklch(0.55 0.20 192 / 20%)" }}>
                    <AvatarFallback className="text-xs font-semibold"
                      style={{
                        background: "linear-gradient(135deg, oklch(0.55 0.20 192 / 20%), oklch(0.55 0.24 278 / 15%))",
                        color: "oklch(0.40 0.20 192)",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate leading-none text-foreground">
                        {user?.name || "User"}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate mt-1">
                        {user?.email || ""}
                      </p>
                    </div>
                  )}
                  {!isCollapsed && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48"
                style={{ background: "oklch(0.99 0.004 240)", border: "1px solid oklch(0.88 0.012 240)", boxShadow: "0 4px 20px oklch(0 0 0 / 8%)" }}>
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Resize handle */}
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-colors hover:bg-primary/20 ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      {showOnboarding && (
        <OnboardingWizard
          userName={user?.name ?? undefined}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      <SidebarInset style={{ background: "oklch(0.965 0.008 240)" }}>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between px-3 backdrop-blur sticky top-0 z-40"
            style={{ background: "oklch(0.965 0.008 240 / 95%)", borderColor: "oklch(0.88 0.012 240)" }}>
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8 rounded-lg" />
              <span className="text-sm font-semibold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
            <LanguageSwitcher variant="pills" className="mr-1" />
          </div>
        )}
        <main className="flex-1 p-5 md:p-6">{children}</main>
      </SidebarInset>

      {user && <AIChatWidget />}
    </>
  );
}
