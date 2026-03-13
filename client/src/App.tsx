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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/dashboard" component={Home} />
      <Route path="/generate" component={Generate} />
      <Route path="/history" component={History} />
      <Route path="/stats" component={Stats} />
      <Route path="/templates" component={Templates} />
      <Route path="/team" component={Team} />
      <Route path="/kanban" component={Kanban} />
      <Route path="/roi" component={ROI} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
