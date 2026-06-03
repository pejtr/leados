import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, Building2, CreditCard, ExternalLink, Phone, ArrowRight, TrendingUp, Calculator, Clock, Flame } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";
import { useGoogleAds } from "@/hooks/useGoogleAds";

const PLANS = [
  {
    key: "starter" as const,
    nameKey: "billing.plan1Name",
    icon: Zap,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    badge: null,
    priceMonthly: 3490,
    priceYearly: 27900,
    featuresKey: [
      "billing.plan1f1",
      "billing.plan1f2",
      "billing.plan1f3",
      "billing.plan1f4",
      "billing.plan1f5",
    ],
  },
  {
    key: "growth" as const,
    nameKey: "billing.plan2Name",
    icon: Star,
    color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    badge: "billing.mostPopular",
    priceMonthly: 9490,
    priceYearly: 75900,
    featuresKey: [
      "billing.plan2f1",
      "billing.plan2f2",
      "billing.plan2f3",
      "billing.plan2f4",
      "billing.plan2f5",
      "billing.plan2f6",
      "billing.plan2f7",
    ],
  },
  {
    key: "pro" as const,
    nameKey: "billing.plan3Name",
    icon: Building2,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    badge: "billing.bestValue",
    priceMonthly: 18990,
    priceYearly: 151900,
    featuresKey: [
      "billing.plan3f1",
      "billing.plan3f2",
      "billing.plan3f3",
      "billing.plan3f4",
      "billing.plan3f5",
      "billing.plan3f6",
      "billing.plan3f7",
      "billing.plan3f8",
    ],
  },
];

const COMPETITOR_TABLE = [
  { feature: "billing.cmpAiIcebreakers", leados: true, hubspot: false, apollo: false, salesforce: false },
  { feature: "billing.cmpAiSdr", leados: true, hubspot: false, apollo: false, salesforce: false },
  { feature: "billing.cmpLinkedinScraping", leados: true, hubspot: false, apollo: true, salesforce: false },
  { feature: "billing.cmpEmailVerification", leados: true, hubspot: true, apollo: true, salesforce: true },
  { feature: "billing.cmpCrmPipeline", leados: true, hubspot: true, apollo: true, salesforce: true },
  { feature: "billing.cmpSocialListening", leados: true, hubspot: false, apollo: false, salesforce: false },
  { feature: "billing.cmpAiAdvisors", leados: true, hubspot: false, apollo: false, salesforce: false },
  { feature: "billing.cmpCzechSlovak", leados: true, hubspot: false, apollo: false, salesforce: false },
  { feature: "billing.cmpPriceFrom", leados: "3 490 Kč", hubspot: "19 000+ Kč", apollo: "2 400 Kč", salesforce: "28 000+ Kč" },
];

// ─── ROI Calculator Component ─────────────────────────────────────────────
function ROICalculator({ interval }: { interval: "monthly" | "yearly" }) {
  const [leadsPerMonth, setLeadsPerMonth] = useState(50);
  const [conversionRate, setConversionRate] = useState(5);
  const [dealSize, setDealSize] = useState(2000);
  const [plan, setPlan] = useState<"starter" | "growth" | "pro">("growth");

  const planCost = {
    starter: interval === "monthly" ? 3490 : Math.round(27900 / 12),
    growth: interval === "monthly" ? 9490 : Math.round(75900 / 12),
    pro: interval === "monthly" ? 18990 : Math.round(151900 / 12),
  }[plan];

  const closedDeals = Math.round(leadsPerMonth * (conversionRate / 100));
  const monthlyRevenue = closedDeals * dealSize;
  const roi = planCost > 0 ? Math.round(((monthlyRevenue - planCost) / planCost) * 100) : 0;
  const roiLabel = roi >= 888 ? "🔥 888%+ ROI" : roi >= 500 ? "🚀 Výborné" : roi >= 200 ? "✅ Dobré" : roi >= 100 ? "👍 Pozitivní" : "⚠️ Nízké";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Leady za měsíc: <span className="text-white font-semibold">{leadsPerMonth}</span></label>
          <input type="range" min="10" max="500" step="10" value={leadsPerMonth} onChange={e => setLeadsPerMonth(+e.target.value)}
            className="w-full accent-violet-500" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Konverzní poměr: <span className="text-white font-semibold">{conversionRate}%</span></label>
          <input type="range" min="1" max="30" step="1" value={conversionRate} onChange={e => setConversionRate(+e.target.value)}
            className="w-full accent-violet-500" />
        </div>
        <div>
          <label className="text-xs text-zinc-400 mb-1 block">Průměrná hodnota obchodu: <span className="text-white font-semibold">{dealSize.toLocaleString()} Kč</span></label>
          <input type="range" min="500" max="50000" step="500" value={dealSize} onChange={e => setDealSize(+e.target.value)}
            className="w-full accent-violet-500" />
        </div>
        <div className="flex gap-2">
          {(["starter", "growth", "pro"] as const).map(p => (
            <button key={p} onClick={() => setPlan(p)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                plan === p ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}>{p}</button>
          ))}
        </div>
      </div>
      <div className="bg-zinc-800/60 rounded-xl p-5 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Uzavřené obchody/měsíc</span>
            <span className="text-white font-semibold">{closedDeals}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Měsíční příjmy</span>
            <span className="text-emerald-400 font-semibold">{monthlyRevenue.toLocaleString()} Kč</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Náklady na LeadOS</span>
            <span className="text-zinc-300">{planCost.toLocaleString()} Kč/měs</span>
          </div>
          <div className="h-px bg-zinc-700" />
          <div className="flex justify-between">
            <span className="text-zinc-300 font-medium">Čistý zisk</span>
            <span className="text-emerald-400 font-bold text-lg">{(monthlyRevenue - planCost).toLocaleString()} Kč</span>
          </div>
        </div>
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-violet-600/20 to-emerald-600/10 border border-violet-500/20 text-center">
          <div className="text-2xl font-black text-white">{roi.toLocaleString()}% ROI</div>
          <div className="text-sm text-zinc-300 mt-0.5">{roiLabel}</div>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const { data: subscription, refetch } = trpc.billing.getSubscription.useQuery();
  const checkoutMut = trpc.billing.createCheckout.useMutation();
  const portalMut = trpc.billing.createPortal.useMutation();
  const { track } = useGoogleAds();

  // Track billing page view once
  useEffect(() => { track('billing_page_viewed'); }, []);

  // Check for success/canceled params
  const params = new URLSearchParams(window.location.search);
  const success = params.get("success");
  const canceled = params.get("canceled");

  if (success) {
    toast.success(t("billing.subscriptionActivated", "Předplatné aktivováno! Vítejte v LeadOS."));
    refetch();
    navigate("/billing", { replace: true });
  }
  if (canceled) {
    toast.error(t("billing.checkoutCanceled", "Objednávka zrušena. Nic nebylo účtováno."));
    navigate("/billing", { replace: true });
  }

  const handleCheckout = async (plan: "starter" | "growth" | "pro") => {
    setLoadingPlan(plan);
    // Track checkout intent with plan value
    const planValues = { starter: 3490, growth: 9490, pro: 18990 };
    const planValue = interval === 'yearly' ? planValues[plan] * 12 * 0.67 : planValues[plan];
    track('subscription_checkout_started', { value: planValue, currency: 'CZK', plan, interval });
    try {
      toast.info(t("billing.redirectingCheckout", "Přesměrovávám na bezpečnou platbu..."));
      const result = await checkoutMut.mutateAsync({
        plan,
        interval,
        origin: window.location.origin,
      });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message ?? t("billing.checkoutFailed", "Nepodařilo se vytvořit platební relaci."));
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    track('billing_portal_opened');
    try {
      toast.info(t("billing.openingPortal", "Otevírám fakturační portál..."));
      const result = await portalMut.mutateAsync({ origin: window.location.origin });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message ?? t("billing.portalFailed", "Nepodařilo se otevřít fakturační portál."));
    }
  };

  const currentPlan = subscription?.plan ?? "free";
  const currentStatus = subscription?.status ?? "free";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-10">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-white mb-1">{t("billing.title", "Fakturace & plány")}</h1>
          <p className="text-zinc-400 text-sm">{t("billing.subtitle", "Vyberte plán, který odpovídá vašemu obchodnímu cíli.")}</p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan !== "free" && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium">{t("billing.currentPlan", "Aktuální plán")}: <span className="text-emerald-400 capitalize">{currentPlan}</span></p>
                <p className="text-zinc-400 text-xs capitalize">{t("billing.status", "Status")}: {currentStatus}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} className="gap-2 text-zinc-300 border-zinc-600 hover:border-zinc-400">
              <ExternalLink className="w-3.5 h-3.5" />
              {t("billing.manageSubscription", "Spravovat předplatné")}
            </Button>
          </div>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === "monthly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            {t("billing.monthly", "Měsíčně")}
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === "yearly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            {t("billing.yearly", "Ročně")}
            <span className="ml-2 text-xs text-emerald-400 font-semibold">{t("billing.savePercent", "Ušetřete ~33%")}</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = interval === "monthly" ? plan.priceMonthly : Math.round(plan.priceYearly / 12);
            const isCurrentPlan = currentPlan === plan.key;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl border bg-gradient-to-b p-5 flex flex-col ${plan.color}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white text-xs font-semibold px-3">{t(plan.badge)}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-white font-semibold text-lg">{t(plan.nameKey)}</h3>
                  {isCurrentPlan && <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">{t("billing.current", "Aktuální")}</Badge>}
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-white">{price.toLocaleString()} Kč</span>
                  <span className="text-zinc-400 text-sm">/měs</span>
                  {interval === "yearly" && (
                    <p className="text-xs text-zinc-500 mt-0.5">{t("billing.billedYearly", "Účtováno ročně")} {plan.priceYearly.toLocaleString()} Kč</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.featuresKey.map((fk) => (
                    <li key={fk} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {t(fk)}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan || loadingPlan === plan.key}
                  onClick={() => !isCurrentPlan && handleCheckout(plan.key)}
                >
                  {loadingPlan === plan.key
                    ? t("common.loading")
                    : isCurrentPlan
                    ? t("billing.current", "Aktuální plán")
                    : t("billing.upgradeTo", "Upgradovat na") + " " + t(plan.nameKey)}
                </Button>
              </div>
            );
          })}

          {/* Enterprise Card */}
          <div className="relative rounded-2xl border border-zinc-600/40 bg-gradient-to-b from-zinc-800/40 to-zinc-900/20 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-zinc-400" />
              <h3 className="text-white font-semibold text-lg">{t("billing.enterprise", "Enterprise")}</h3>
            </div>
            <div className="mb-5">
              <span className="text-2xl font-bold text-white">{t("billing.contactSales", "Cena na dotaz")}</span>
            </div>
            <ul className="space-y-2 mb-6 flex-1">
              {["billing.entf1", "billing.entf2", "billing.entf3", "billing.entf4", "billing.entf5"].map((fk) => (
                <li key={fk} className="flex items-center gap-2 text-sm text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  {t(fk)}
                </li>
              ))}
            </ul>
            <Button
              className="w-full gap-2 bg-zinc-700 hover:bg-zinc-600 text-white"
              onClick={() => window.open("mailto:sales@crmleads.io?subject=LeadOS Enterprise", "_blank")}
            >
              <Phone className="w-3.5 h-3.5" />
              {t("billing.bookDemo", "Domluvit demo")}
            </Button>
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-900/80 border border-violet-500/20">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">ROI Kalkulátor — Kolik vyděláš?</h2>
          </div>
          <ROICalculator interval={interval} />
        </div>

        {/* Annual Urgency Banner */}
        {interval === "monthly" && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/10 border border-amber-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <div>
                <p className="text-white font-semibold text-sm">Přejdi na roční plán a ušetři až 76 000 Kč ročně</p>
                <p className="text-zinc-400 text-xs mt-0.5">Roční fakturace = 4 měsíce zdarma. Nabídka platí jen tento měsíc.</p>
              </div>
            </div>
            <button
              onClick={() => setInterval("yearly")}
              className="shrink-0 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors"
            >
              Přejít na roční →
            </button>
          </div>
        )}

        {/* Competitor Comparison Table */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">{t("billing.comparisonTitle", "LeadOS vs. konkurence")}</h2>
          <div className="overflow-x-auto rounded-xl border border-zinc-700/50">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700/50 bg-zinc-800/50">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">{t("billing.feature", "Funkce")}</th>
                  <th className="text-center py-3 px-4 text-violet-400 font-bold">LeadOS</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">HubSpot</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">Apollo.io</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">Salesforce</th>
                </tr>
              </thead>
              <tbody>
                {COMPETITOR_TABLE.map((row, i) => (
                  <tr key={i} className={`border-b border-zinc-700/30 ${i % 2 === 0 ? "bg-zinc-800/20" : ""}`}>
                    <td className="py-3 px-4 text-zinc-300">{t(row.feature)}</td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.leados === "boolean"
                        ? row.leados ? <Check className="w-4 h-4 text-emerald-400 mx-auto" /> : <span className="text-zinc-600">—</span>
                        : <span className="text-violet-400 font-bold">{row.leados}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.hubspot === "boolean"
                        ? row.hubspot ? <Check className="w-4 h-4 text-zinc-400 mx-auto" /> : <span className="text-zinc-600">—</span>
                        : <span className="text-zinc-400">{row.hubspot}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.apollo === "boolean"
                        ? row.apollo ? <Check className="w-4 h-4 text-zinc-400 mx-auto" /> : <span className="text-zinc-600">—</span>
                        : <span className="text-zinc-400">{row.apollo}</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {typeof row.salesforce === "boolean"
                        ? row.salesforce ? <Check className="w-4 h-4 text-zinc-400 mx-auto" /> : <span className="text-zinc-600">—</span>
                        : <span className="text-zinc-400">{row.salesforce}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demo CTA */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-violet-600/20 to-blue-600/10 border border-violet-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-white font-semibold text-lg">{t("billing.demoTitle", "Chcete vidět LeadOS v akci?")}</h3>
            <p className="text-zinc-400 text-sm mt-1">{t("billing.demoSubtitle", "Naplánujte si 30minutové demo s naším týmem a uvidíte, jak LeadOS transformuje váš B2B pipeline.")}</p>
          </div>
          <Button
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shrink-0"
            onClick={() => window.open("mailto:sales@crmleads.io?subject=LeadOS Demo Request", "_blank")}
          >
            {t("billing.bookDemoNow", "Domluvit demo zdarma")}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Test Card Notice */}
        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-zinc-400 text-xs text-center">
            <span className="text-zinc-300 font-medium">{t("billing.testMode", "Testovací režim")}:</span> {t("billing.testCard", "Použijte kartu")} <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-200">4242 4242 4242 4242</code> {t("billing.testCardHint", "s libovolným budoucím datem expirace a CVC.")}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
