import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Generate from "./pages/Generate";
import History from "./pages/History";
import Stats from "./pages/Stats";
import Templates from "./pages/Templates";
import Team from "./pages/Team";
import Kanban from "./pages/Kanban";
import ROI from "./pages/ROI";
import Autopilot from "./pages/Autopilot";
import Integrations from "./pages/Integrations";
import Matching from "./pages/Matching";
import SdrAgent from "./pages/SdrAgent";
import NextActions from "./pages/NextActions";
import SocialListening from "./pages/SocialListening";
import TrackingPixel from "./pages/TrackingPixel";
import SmartAlerts from "./pages/SmartAlerts";
import SmartLists from "./pages/SmartLists";
import EmailVerification from "./pages/EmailVerification";
import CampaignRules from "./pages/CampaignRules";
import AgencyPanel from "./pages/AgencyPanel";
import SpeedToLead from "./pages/SpeedToLead";
import IcpBuilder from "./pages/IcpBuilder";
import TechStack from "./pages/TechStack";
import AiAgentBuilder from "./pages/AiAgentBuilder";
import LandingB from "./pages/LandingB";
import Sequences from "./pages/Sequences";
import Tasks from "./pages/Tasks";
import CapturePlanning from "./pages/CapturePlanning";
import MarketIntel from "./pages/MarketIntel";
import KnowledgeBase from "./pages/KnowledgeBase";
import CompetitiveMap from "./pages/CompetitiveMap";
import Billing from "./pages/Billing";
import AiAdvisor from "./pages/AiAdvisor";
import MeetingScheduler from "./pages/MeetingScheduler";
import CallIntelligence from "./pages/CallIntelligence";
import DealPipeline from "./pages/DealPipeline";
import SalesDashboard from "./pages/SalesDashboard";
import ProjectsHub from "./pages/ProjectsHub";
import AdCampaigns from "./pages/AdCampaigns";
import PortfolioROAS from "./pages/PortfolioROAS";
import PublicPortfolioROAS from "./pages/PublicPortfolioROAS";
import FiveBrains from "./pages/FiveBrains";
import DailyReport from "./pages/DailyReport";
import AIConstitution from "./pages/AIConstitution";
import AgentBenchmark from "./pages/AgentBenchmark";
import Hermes from "./pages/Hermes";
import DeepSleepDashboard from "./pages/DeepSleepDashboard";
import IngestSources from "./pages/IngestSources";
import Datenschutz from "./pages/Datenschutz";
import AiSkills from "./pages/AiSkills";
import RoiAudit from "./pages/RoiAudit";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/landing-b" component={LandingB} />
      <Route path="/dashboard" component={Home} />
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
      <Route path="/chat-agent" component={AiAdvisor} />
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
      <Route path="/hermes" component={Hermes} />
      <Route path="/deep-sleep" component={DeepSleepDashboard} />
      <Route path="/external-leads" component={IngestSources} />
      <Route path="/datenschutz" component={Datenschutz} />
      <Route path="/ai-skills" component={AiSkills} />
      <Route path="/roi-audit" component={RoiAudit} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
