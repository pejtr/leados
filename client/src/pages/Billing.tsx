import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, Building2, CreditCard, ExternalLink, Phone, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

const PLANS = [
  {
    key: "starter" as const,
    nameKey: "billing.plan1Name",
    icon: Zap,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    badge: null,
    priceMonthly: 149,
    priceYearly: 1190,
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
    priceMonthly: 399,
    priceYearly: 3190,
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
    priceMonthly: 799,
    priceYearly: 6390,
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
  { feature: "billing.cmpPriceFrom", leados: "€149", hubspot: "€800+", apollo: "€99", salesforce: "€1200+" },
];

export default function Billing() {
  const { t } = useTranslation();
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const { data: subscription, refetch } = trpc.billing.getSubscription.useQuery();
  const checkoutMut = trpc.billing.createCheckout.useMutation();
  const portalMut = trpc.billing.createPortal.useMutation();

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
                  <span className="text-3xl font-bold text-white">€{price}</span>
                  <span className="text-zinc-400 text-sm">/mo</span>
                  {interval === "yearly" && (
                    <p className="text-xs text-zinc-500 mt-0.5">{t("billing.billedYearly", "Účtováno ročně")} €{plan.priceYearly}</p>
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
