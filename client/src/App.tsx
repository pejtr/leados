import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { FloatingUpgradeNudge } from "./components/UpgradeNudge";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Today = lazy(() => import("./pages/Today"));
const Generate = lazy(() => import("./pages/Generate"));
const History = lazy(() => import("./pages/History"));
const Stats = lazy(() => import("./pages/Stats"));
const Templates = lazy(() => import("./pages/Templates"));
const Team = lazy(() => import("./pages/Team"));
const Kanban = lazy(() => import("./pages/Kanban"));
const ROI = lazy(() => import("./pages/ROI"));
const Autopilot = lazy(() => import("./pages/Autopilot"));
const Integrations = lazy(() => import("./pages/Integrations"));
const Matching = lazy(() => import("./pages/Matching"));
const SdrAgent = lazy(() => import("./pages/SdrAgent"));
const NextActions = lazy(() => import("./pages/NextActions"));
const SocialListening = lazy(() => import("./pages/SocialListening"));
const TrackingPixel = lazy(() => import("./pages/TrackingPixel"));
const SmartAlerts = lazy(() => import("./pages/SmartAlerts"));
const SmartLists = lazy(() => import("./pages/SmartLists"));
const EmailVerification = lazy(() => import("./pages/EmailVerification"));
const CampaignRules = lazy(() => import("./pages/CampaignRules"));
const AgencyPanel = lazy(() => import("./pages/AgencyPanel"));
const SpeedToLead = lazy(() => import("./pages/SpeedToLead"));
const IcpBuilder = lazy(() => import("./pages/IcpBuilder"));
const TechStack = lazy(() => import("./pages/TechStack"));
const AiAgentBuilder = lazy(() => import("./pages/AiAgentBuilder"));
const LandingB = lazy(() => import("./pages/LandingB"));
const Sequences = lazy(() => import("./pages/Sequences"));
const Tasks = lazy(() => import("./pages/Tasks"));
const CapturePlanning = lazy(() => import("./pages/CapturePlanning"));
const MarketIntel = lazy(() => import("./pages/MarketIntel"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const CompetitiveMap = lazy(() => import("./pages/CompetitiveMap"));
const Billing = lazy(() => import("./pages/Billing"));
const MeetingScheduler = lazy(() => import("./pages/MeetingScheduler"));
const CallIntelligence = lazy(() => import("./pages/CallIntelligence"));
const DealPipeline = lazy(() => import("./pages/DealPipeline"));
const SalesDashboard = lazy(() => import("./pages/SalesDashboard"));
const ProjectsHub = lazy(() => import("./pages/ProjectsHub"));
const AdCampaigns = lazy(() => import("./pages/AdCampaigns"));
const PortfolioROAS = lazy(() => import("./pages/PortfolioROAS"));
const PublicPortfolioROAS = lazy(() => import("./pages/PublicPortfolioROAS"));
const FiveBrains = lazy(() => import("./pages/FiveBrains"));
const DailyReport = lazy(() => import("./pages/DailyReport"));
const AIConstitution = lazy(() => import("./pages/AIConstitution"));
const AgentBenchmark = lazy(() => import("./pages/AgentBenchmark"));
const DeepSleepDashboard = lazy(() => import("./pages/DeepSleepDashboard"));
const DeepSleepReset = lazy(() => import("./pages/DeepSleepReset"));
const IngestSources = lazy(() => import("./pages/IngestSources"));
const Datenschutz = lazy(() => import("./pages/Datenschutz"));
const AiSkills = lazy(() => import("./pages/AiSkills"));
const RoiAudit = lazy(() => import("./pages/RoiAudit"));
const ComputerFlow = lazy(() => import("./pages/ComputerFlow"));
const GlobalEarnings = lazy(() =>
  import("./pages/GlobalEarnings").then(module => ({ default: module.GlobalEarnings }))
);
const AdminIntegrations = lazy(() => import("./pages/AdminIntegrations"));
const AffiliateDashboard = lazy(() => import("./pages/AffiliateDashboard"));
const RevenueIntelligence = lazy(() => import("./pages/RevenueIntelligence"));
const ProfessionalDashboard = lazy(() => import("./pages/ProfessionalDashboard"));
const WebhookActivity = lazy(() => import("./pages/WebhookActivity"));
const GoogleMapsScraper = lazy(() => import("./pages/GoogleMapsScraper"));
const WebAudit = lazy(() => import("./pages/WebAudit"));
const Sluzby = lazy(() => import("./pages/Sluzby"));
const AresSearch = lazy(() => import("./pages/AresSearch"));
const DailyRoutines = lazy(() => import("./pages/DailyRoutines"));
const GlobalSignalDesk = lazy(() => import("./pages/GlobalSignalDesk"));
const MasterCommandCenter = lazy(() => import("./pages/MasterCommandCenter"));
const Governance = lazy(() => import("./pages/Governance"));
const OmnicoreHub = lazy(() => import("./pages/OmnicoreHub"));

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Today} />
      <Route path="/landing" component={Landing} />
      <Route path="/landing-b" component={LandingB} />
      <Route path="/dashboard" component={Today} />
      <Route path="/overview" component={Home} />
      <Route path="/generate" component={Generate} />
      <Route path="/history" component={History} />
      <Route path="/stats" component={Stats} />
      <Route path="/templates" component={Templates} />
      <Route path="/team" component={Team} />
      <Route path="/kanban" component={Kanban} />
      <Route path="/roi" component={ROI} />
      <Route path="/autopilot" component={Autopilot} />
      <Route path="/integrations" component={Integrations} />
      <Route path="/matching" component={Matching} />
      <Route path="/sdr" component={SdrAgent} />
      <Route path="/next-actions" component={NextActions} />
      <Route path="/social" component={SocialListening} />
      <Route path="/tracking" component={TrackingPixel} />
      <Route path="/alerts" component={SmartAlerts} />
      <Route path="/smart-lists" component={SmartLists} />
      <Route path="/email-verify" component={EmailVerification} />
      <Route path="/campaigns" component={CampaignRules} />
      <Route path="/agency" component={AgencyPanel} />
      <Route path="/speed-to-lead" component={SpeedToLead} />
      <Route path="/icp" component={IcpBuilder} />
      <Route path="/tech-stack" component={TechStack} />
      <Route path="/ai-agents" component={AiAgentBuilder} />
      <Route path="/sequences" component={Sequences} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/capture" component={CapturePlanning} />
      <Route path="/market-intel" component={MarketIntel} />
      <Route path="/knowledge" component={KnowledgeBase} />
      <Route path="/competitive" component={CompetitiveMap} />
      <Route path="/billing" component={Billing} />
      <Route path="/chat-agent" component={MasterCommandCenter} />
      <Route path="/meetings" component={MeetingScheduler} />
      <Route path="/calls" component={CallIntelligence} />
      <Route path="/deal-pipeline" component={DealPipeline} />
      <Route path="/sales-dashboard" component={SalesDashboard} />
      <Route path="/projects" component={ProjectsHub} />
      <Route path="/ad-campaigns" component={AdCampaigns} />
      <Route path="/portfolio-roas" component={PortfolioROAS} />
      <Route path="/portfolio/share/:token" component={PublicPortfolioROAS} />
      <Route path="/five-brains" component={FiveBrains} />
      <Route path="/daily-report" component={DailyReport} />
      <Route path="/ai-constitution" component={AIConstitution} />
      <Route path="/agent-benchmark" component={AgentBenchmark} />
      <Route path="/hermio" component={MasterCommandCenter} />
      <Route path="/hermes" component={MasterCommandCenter} />
      <Route path="/deep-sleep" component={DeepSleepDashboard} />
      <Route path="/dsr" component={DeepSleepReset} />
      <Route path="/external-leads" component={IngestSources} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/ai-skills" component={AiSkills} />
      <Route path="/roi-audit" component={RoiAudit} />
      <Route path="/computer-flow" component={ComputerFlow} />
      <Route path="/global-earnings" component={GlobalEarnings} />
      <Route path="/admin/integrations" component={AdminIntegrations} />
      <Route path="/affiliate" component={AffiliateDashboard} />
      <Route path="/revenue-intelligence" component={RevenueIntelligence} />
      <Route path="/analytics/professional" component={ProfessionalDashboard} />
      <Route path="/webhooks/activity" component={WebhookActivity} />
      <Route path="/google-maps-scraper" component={GoogleMapsScraper} />
      <Route path="/web-audit" component={WebAudit} />
      <Route path="/sluzby" component={Sluzby} />
      <Route path="/ares" component={AresSearch} />
      <Route path="/daily-routines" component={DailyRoutines} />
      <Route path="/global-signal-desk" component={GlobalSignalDesk} />
      <Route path="/command-center" component={MasterCommandCenter} />
      <Route path="/governance" component={Governance} />
      <Route path="/omnicore" component={OmnicoreHub} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <ScrollToTop />
          <FloatingUpgradeNudge />
          <Suspense fallback={<div className="min-h-screen bg-background" aria-label="Načítání stránky" />}>
            <Router />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
