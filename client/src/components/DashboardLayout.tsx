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
import { LayoutDashboard, LogOut, PanelLeft, Zap, History, BarChart3, Mail, Users, Kanban, DollarSign, Bot, Webhook, Target, UserCheck, Lightbulb, Ear, Code, Bell, ListFilter, ShieldCheck, GitBranch, Building, Timer, Cpu, MailOpen, CheckSquare, Crosshair, Globe, BookOpen, Map } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import OnboardingWizard from "./OnboardingWizard";
import AIChatWidget from "./AIChatWidget";
import { trpc } from "@/lib/trpc";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", group: "core" },
  { icon: Zap, label: "Generate Leads", path: "/generate", group: "core" },
  { icon: History, label: "Lead History", path: "/history", group: "core" },
  { icon: Kanban, label: "Pipeline Board", path: "/kanban", group: "core" },
  { icon: Target, label: "ICP Builder", path: "/icp", group: "intelligence" },
  { icon: Code, label: "Tracking Pixel", path: "/tracking", group: "intelligence" },
  { icon: Cpu, label: "Tech Stack", path: "/tech-stack", group: "intelligence" },
  { icon: ListFilter, label: "Smart Lists", path: "/smart-lists", group: "intelligence" },
  { icon: ShieldCheck, label: "Email Verify", path: "/email-verify", group: "intelligence" },
  { icon: UserCheck, label: "AI SDR Agent", path: "/sdr", group: "automation" },
  { icon: Bot, label: "AI Agents", path: "/ai-agents", group: "automation" },
  { icon: Bot, label: "Autopilot", path: "/autopilot", group: "automation" },
  { icon: GitBranch, label: "Campaigns", path: "/campaigns", group: "automation" },
  { icon: Timer, label: "Speed-to-Lead", path: "/speed-to-lead", group: "automation" },
  { icon: Lightbulb, label: "Next Actions", path: "/next-actions", group: "automation" },
  { icon: Bell, label: "Smart Alerts", path: "/alerts", group: "automation" },
  { icon: Ear, label: "Social Listening", path: "/social", group: "insights" },
  { icon: Target, label: "B2B Matching", path: "/matching", group: "insights" },
  { icon: BarChart3, label: "Statistics", path: "/stats", group: "insights" },
  { icon: DollarSign, label: "ROI Tracker", path: "/roi", group: "insights" },
  { icon: Mail, label: "Email Templates", path: "/templates", group: "settings" },
  { icon: Users, label: "Team", path: "/team", group: "settings" },
  { icon: Building, label: "Agency Panel", path: "/agency", group: "settings" },
  { icon: Webhook, label: "Integrations", path: "/integrations", group: "settings" },
  { icon: MailOpen, label: "Email Sequences", path: "/sequences", group: "outreach" },
  { icon: CheckSquare, label: "Activity Tracker", path: "/tasks", group: "outreach" },
  { icon: Crosshair, label: "Capture Planning", path: "/capture", group: "outreach" },
  { icon: Globe, label: "Market Intel", path: "/market-intel", group: "outreach" },
  { icon: BookOpen, label: "Knowledge Base", path: "/knowledge", group: "outreach" },
  { icon: Map, label: "Competitive Map", path: "/competitive", group: "outreach" },
  { icon: DollarSign, label: "Billing & Plans", path: "/billing", group: "settings" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
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
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <span className="font-semibold tracking-tight truncate text-foreground">
                    LeadGen AI
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0 overflow-y-auto">
            <SidebarMenu className="px-2 py-1">
              {(["core", "intelligence", "automation", "outreach", "insights", "settings"] as const).map((group) => {
                const groupLabels: Record<string, string> = { core: "", intelligence: "Intelligence", automation: "Automation", outreach: "Outreach & BD", insights: "Insights", settings: "Settings" };
                const groupItems = menuItems.filter(i => i.group === group);
                if (groupItems.length === 0) return null;
                return (
                  <div key={group}>
                    {groupLabels[group] && !isCollapsed && (
                      <div className="px-3 pt-4 pb-1">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">{groupLabels[group]}</span>
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
                            className="h-9 transition-all font-normal"
                          >
                            <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-3">
            {!isCollapsed && (
              <div className="px-1 pb-2">
                <LanguageSwitcher variant="pills" className="w-full justify-center" />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-9 w-9 border shrink-0">
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-1.5">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
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
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      {showOnboarding && (
        <OnboardingWizard
          userName={user?.name ?? undefined}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
            <LanguageSwitcher variant="pills" className="mr-2" />
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
      {/* Floating AI Chat Widget */}
      {user && <AIChatWidget />}
    </>
  );
}
