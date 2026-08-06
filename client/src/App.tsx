import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import { useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { lazy, Suspense, useEffect, useState } from "react";
import { getVariant, trackEvent, type Variant } from "./lib/ab-test";
import { captureAttributionFromUrl } from "./lib/attribution";
import { trackSklikRetargeting } from "./lib/sklik";
import { CookieConsentBanner } from "./components/CookieConsentBanner";
import { CONSENT_UPDATED_EVENT, getConsentChannels } from "./lib/consent";
import { ensureLinkedInInsight } from "./lib/linkedin";
import { usePageSeo } from "./hooks/usePageSeo";
import { CORE_OFFERS, SOLUTION_PACKAGES, WEB_PACKAGES } from "@shared/service-catalog";
import { DEFAULT_SEO, ROUTE_SEO } from "@shared/seo-config";
import { PUBLIC_SITE_URL } from "@shared/brand-config";

const NotFound = lazy(() => import("@/pages/NotFound"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Home = lazy(() => import("./pages/Home"));
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
const AuditZdarma = lazy(() => import("./pages/AuditZdarma"));
const CrmLeadSystem = lazy(() => import("./pages/CrmLeadSystem"));
const VerticalLanding = lazy(() => import("./pages/VerticalLanding"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const PortfolioPage = lazy(() => import("./pages/PortfolioPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const KalkulackaPage = lazy(() => import("./pages/KalkulackaPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const RoiKalkulackaPage = lazy(() => import("./pages/RoiKalkulackaPage"));
const PartnerPage = lazy(() => import("./pages/PartnerPage"));
const SalesChatWidget = lazy(() => import("./components/SalesChatWidget").then(m => ({ default: m.SalesChatWidget })));

function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="h-12 w-12 rounded-full border-t-2 border-b-2 border-sky-400 animate-spin" />
    </div>
  );
}

function AnalyticsScript() {
  useEffect(() => {
    const initializeConsentBasedTracking = () => {
      const consent = getConsentChannels();

      if (consent.google) {
        const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
        const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
        if (endpoint && websiteId && !document.querySelector("script[data-website-id]")) {
          const script = document.createElement("script");
          script.defer = true;
          script.src = `${endpoint.replace(/\/$/, "")}/umami`;
          script.dataset.websiteId = websiteId;
          document.body.appendChild(script);
        }

        const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
        if (gaId && !document.querySelector('script[data-optimateo-ga]')) {
          const gaScript = document.createElement("script");
          gaScript.async = true;
          gaScript.dataset.optimateoGa = "true";
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(gaScript);

          window.dataLayer = window.dataLayer || [];
          window.gtag = (...args: unknown[]) => window.dataLayer.push(args);
          window.gtag("js", new Date());
          window.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted" });
          window.gtag("config", gaId);
        }
      } else {
        window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
        document.querySelector("script[data-website-id]")?.remove();
      }

      ensureLinkedInInsight();
    };

    initializeConsentBasedTracking();
    window.addEventListener(CONSENT_UPDATED_EVENT, initializeConsentBasedTracking);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, initializeConsentBasedTracking);
  }, []);

  return null;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: unknown[]) => void;
  }
}

function TrackingLayer() {
  const [location] = useLocation();

  useEffect(() => {
    const trackCurrentPage = () => {
      captureAttributionFromUrl();
      void trackEvent("page_view", {
        path: location,
        page_location: window.location.href,
      });

      const category = location.startsWith("/lp/")
        ? `sklik-${location.replace("/lp/", "")}`
        : location === "/"
          ? "homepage"
          : location.replace(/^\//, "") || "homepage";

      void trackSklikRetargeting({
        pageType: location.startsWith("/lp/") ? "landing" : "other",
        category,
        rtgUrl: window.location.href,
      });
    };

    trackCurrentPage();
    window.addEventListener(CONSENT_UPDATED_EVENT, trackCurrentPage);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, trackCurrentPage);
  }, [location]);

  return null;
}

function PageSeo() {
  const [location] = useLocation();
  const routeSeo = ROUTE_SEO[location];
  const seo = routeSeo || DEFAULT_SEO;
  const noIndex = routeSeo?.noIndex ?? !routeSeo;
  const schema = routeSeo?.schemaType === "OfferCatalog"
    ? {
      "@context": "https://schema.org",
      "@type": "OfferCatalog",
      name: "Ceník služeb OPTIMATEO",
      url: `${PUBLIC_SITE_URL}/pricing`,
      itemListElement: [
        ...Object.values(CORE_OFFERS),
        ...Object.values(WEB_PACKAGES),
        {
          name: SOLUTION_PACKAGES.ONYX_ESHOP.name,
          description: SOLUTION_PACKAGES.ONYX_ESHOP.description,
          priceInCzk: SOLUTION_PACKAGES.ONYX_ESHOP.priceFromInCzk,
        },
      ].map((offer) => ({
        "@type": "Offer",
        priceCurrency: "CZK",
        price: offer.priceInCzk,
        itemOffered: { "@type": "Service", name: offer.name, description: offer.description },
      })),
    }
    : routeSeo?.schemaType === "Service"
      ? {
        "@context": "https://schema.org",
        "@type": "Service",
        name: seo.title.split("|")[0].trim(),
        description: seo.description,
        url: PUBLIC_SITE_URL + location,
        areaServed: { "@type": "Country", name: "Česko" },
        provider: { "@type": "ProfessionalService", name: "OPTIMATEO", url: PUBLIC_SITE_URL },
      }
      : routeSeo?.schemaType === "WebPage"
        ? {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: seo.title.split("|")[0].trim(),
          description: seo.description,
          url: PUBLIC_SITE_URL + location,
        }
        : undefined;

  usePageSeo({ ...seo, path: location, noIndex, schema });
  return null;
}

function Router() {
  const [variant, setVariant] = useState<Variant>("A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVariant = () => getVariant().then((v) => {
      setVariant(v);
      setLoading(false);
    });
    void loadVariant();
    window.addEventListener(CONSENT_UPDATED_EVENT, loadVariant);
    return () => window.removeEventListener(CONSENT_UPDATED_EVENT, loadVariant);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/">{() => <Home variant={variant} />}</Route>
        <Route path="/v/:segment" component={VerticalLanding} />
        <Route path="/lp/:segment" component={SklikLandingPage} />
        <Route path="/admin/invoices" component={AdminDashboard} />
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
        <Route path="/audit-zdarma" component={AuditZdarma} />
        <Route path="/crm-lead-system" component={CrmLeadSystem} />
        <Route path="/pricing" component={PricingPage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/kalkulacka" component={KalkulackaPage} />
        <Route path="/onboarding" component={OnboardingPage} />
        <Route path="/roi-kalkulacka" component={RoiKalkulackaPage} />
        <Route path="/partner" component={PartnerPage} />
        <Route path="/ochrana-osobnich-udaju" component={LegalPage} />
        <Route path="/cookies" component={LegalPage} />
        <Route path="/obchodni-podminky" component={LegalPage} />
        <Route path="/payment-success" component={PaymentSuccess} />
        <Route path="/payment-cancel" component={PaymentCancel} />
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
          <PageSeo />
          <Toaster />
          <CookieConsentBanner />
          <Router />
          <Suspense fallback={null}>
            <SalesChatWidget />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
