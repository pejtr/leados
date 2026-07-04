import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect, useState } from "react";
import { getVariant, trackEvent } from "./lib/ab-test";
import { trackSklikRetargeting } from "./lib/sklik";
import { MarketingConsentBanner } from "./components/MarketingConsentBanner";

const NotFound = lazy(() => import("@/pages/NotFound"));
const Home = lazy(() => import("./pages/Home"));
const HomeVariantB = lazy(() => import("./pages/HomeVariantB"));
const HomeVariantC = lazy(() => import("./pages/HomeVariantC"));
const HomeVariantD = lazy(() => import("./pages/HomeVariantD"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProjects = lazy(() => import("./pages/AdminProjects"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const AgentsHub = lazy(() => import("./pages/AgentsHub"));
const IBotsPage = lazy(() => import("./pages/IBotsPage"));
const DemoPage = lazy(() => import("./pages/DemoPage"));
const DotaznikPage = lazy(() => import("./pages/DotaznikPage"));
const AiCorePage = lazy(() => import("./pages/AiCorePage"));
const WebLandingPage = lazy(() => import("./pages/WebLandingPage"));
const SklikLandingPage = lazy(() => import("./pages/SklikLandingPage"));
const ABTestingDashboard = lazy(() => import("./pages/ABTestingDashboard"));

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-violet-400 animate-spin" />
    </div>
  );
}

function AnalyticsScript() {
  useEffect(() => {
    const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
    const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;

    if (!endpoint || !websiteId || document.querySelector("script[data-website-id]")) {
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = `${endpoint.replace(/\/$/, "")}/umami`;
    script.dataset.websiteId = websiteId;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}

function TrackingLayer() {
  const [location] = useLocation();

  useEffect(() => {
    const category = location.startsWith("/lp/")
      ? `sklik-${location.replace("/lp/", "")}`
      : location === "/"
        ? "homepage"
        : location.replace(/^\//, "") || "homepage";

    trackSklikRetargeting({
      pageType: location.startsWith("/lp/") ? "landing" : "other",
      category,
      rtgUrl: window.location.href,
    });
  }, [location]);

  return null;
}

function Router() {
  const [variant, setVariant] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getVariant().then((v) => {
      setVariant(v);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) {
      trackEvent("page_view", { path: "/" });
    }
  }, [variant, loading]);

  if (loading) return <PageLoader />;

  const HomeComponent = variant === 'B' ? HomeVariantB : variant === 'C' ? HomeVariantC : variant === 'D' ? HomeVariantD : Home;

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={HomeComponent} />
        <Route path="/lp/:segment" component={SklikLandingPage} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/projects" component={AdminProjects} />
        <Route path="/dashboard" component={ClientDashboard} />
        <Route path="/agents" component={AgentsHub} />
        <Route path="/ibots" component={IBotsPage} />
        <Route path="/demo" component={DemoPage} />
        <Route path="/ai-core" component={AiCorePage} />
        <Route path="/web" component={WebLandingPage} />
        <Route path="/dotaznik" component={DotaznikPage} />
        <Route path="/ab-testing" component={ABTestingDashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <AnalyticsScript />
          <TrackingLayer />
          <Toaster />
          <MarketingConsentBanner />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
