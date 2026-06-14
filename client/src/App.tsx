import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import HomeVariantB from "./pages/HomeVariantB";
import HomeVariantC from "./pages/HomeVariantC";
import HomeVariantD from "./pages/HomeVariantD";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProjects from "./pages/AdminProjects";
import ClientDashboard from "./pages/ClientDashboard";
import AgentsHub from "./pages/AgentsHub";
import IBotsPage from "./pages/IBotsPage";
import DemoPage from "./pages/DemoPage";
import DotaznikPage from "./pages/DotaznikPage";
import ABTestingDashboard from "./pages/ABTestingDashboard";
import { useEffect, useState } from "react";
import { getVariant } from "./lib/ab-test";

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
      const trackVariantView = async () => {
        try {
          await fetch('/api/trpc/ab.trackConversion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              json: { variant, event: 'page_view', metadata: { path: '/' } },
            }),
          });
        } catch (error) {
          console.error('Failed to track variant view:', error);
        }
      };
      trackVariantView();
    }
  }, [variant, loading]);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div></div>;

  const HomeComponent = variant === 'B' ? HomeVariantB : variant === 'C' ? HomeVariantC : variant === 'D' ? HomeVariantD : Home;

  return (
    <Switch>
      <Route path="/" component={HomeComponent} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/projects" component={AdminProjects} />
      <Route path="/dashboard" component={ClientDashboard} />
      <Route path="/agents" component={AgentsHub} />
      <Route path="/ibots" component={IBotsPage} />
      <Route path="/demo" component={DemoPage} />
      <Route path="/dotaznik" component={DotaznikPage} />
      <Route path="/ab-testing" component={ABTestingDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
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
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
