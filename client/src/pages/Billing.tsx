import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Star, Building2, CreditCard, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useLocation } from "wouter";

const PLANS = [
  {
    key: "starter" as const,
    name: "Starter",
    icon: Zap,
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    badge: null,
    priceMonthly: 49,
    priceYearly: 390,
    features: [
      "500 leads/month",
      "AI icebreakers",
      "Email verification",
      "CSV export",
      "1 user",
    ],
  },
  {
    key: "growth" as const,
    name: "Growth",
    icon: Star,
    color: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    badge: "Most Popular",
    priceMonthly: 99,
    priceYearly: 790,
    features: [
      "2,500 leads/month",
      "AI SDR Agent",
      "Email sequences",
      "Capture planning",
      "Market intelligence",
      "5 users",
      "CRM integrations",
    ],
  },
  {
    key: "pro" as const,
    name: "Pro",
    icon: Building2,
    color: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    badge: "Best Value",
    priceMonthly: 249,
    priceYearly: 1990,
    features: [
      "Unlimited leads",
      "All AI features",
      "Competitive intelligence",
      "Knowledge base",
      "Autopilot campaigns",
      "Unlimited users",
      "Agency panel",
      "Priority support",
    ],
  },
];

export default function Billing() {
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
    toast.success("Subscription activated! Welcome to AI LeadGen.");
    refetch();
    navigate("/billing", { replace: true });
  }
  if (canceled) {
    toast.error("Checkout canceled. No charges were made.");
    navigate("/billing", { replace: true });
  }

  const handleCheckout = async (plan: "starter" | "growth" | "pro") => {
    setLoadingPlan(plan);
    try {
      toast.info("Redirecting to secure checkout...");
      const result = await checkoutMut.mutateAsync({
        plan,
        interval,
        origin: window.location.origin,
      });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to create checkout session.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    try {
      toast.info("Opening billing portal...");
      const result = await portalMut.mutateAsync({ origin: window.location.origin });
      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Failed to open billing portal.");
    }
  };

  const currentPlan = subscription?.plan ?? "free";
  const currentStatus = subscription?.status ?? "free";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Billing & Plans</h1>
          <p className="text-zinc-400 text-sm">Upgrade your plan to unlock more leads and AI features.</p>
        </div>

        {/* Current Plan Banner */}
        {currentPlan !== "free" && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white font-medium">Current Plan: <span className="text-emerald-400 capitalize">{currentPlan}</span></p>
                <p className="text-zinc-400 text-xs capitalize">Status: {currentStatus}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePortal} className="gap-2 text-zinc-300 border-zinc-600 hover:border-zinc-400">
              <ExternalLink className="w-3.5 h-3.5" />
              Manage Subscription
            </Button>
          </div>
        )}

        {/* Billing Interval Toggle */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setInterval("monthly")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === "monthly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval("yearly")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === "yearly" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-zinc-300"}`}
          >
            Yearly
            <span className="ml-2 text-xs text-emerald-400 font-semibold">Save ~33%</span>
          </button>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                    <Badge className="bg-amber-500 text-black text-xs font-semibold px-3">{plan.badge}</Badge>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <Icon className="w-5 h-5 text-zinc-300" />
                  <h3 className="text-white font-semibold text-lg">{plan.name}</h3>
                  {isCurrentPlan && <Badge variant="outline" className="text-emerald-400 border-emerald-500/40 text-xs">Current</Badge>}
                </div>

                <div className="mb-5">
                  <span className="text-3xl font-bold text-white">${price}</span>
                  <span className="text-zinc-400 text-sm">/mo</span>
                  {interval === "yearly" && (
                    <p className="text-xs text-zinc-500 mt-0.5">Billed ${plan.priceYearly}/year</p>
                  )}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={isCurrentPlan ? "outline" : "default"}
                  disabled={isCurrentPlan || loadingPlan === plan.key}
                  onClick={() => !isCurrentPlan && handleCheckout(plan.key)}
                >
                  {loadingPlan === plan.key ? "Loading..." : isCurrentPlan ? "Current Plan" : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Test Card Notice */}
        <div className="mt-8 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
          <p className="text-zinc-400 text-xs text-center">
            <span className="text-zinc-300 font-medium">Test mode:</span> Use card <code className="bg-zinc-700 px-1.5 py-0.5 rounded text-zinc-200">4242 4242 4242 4242</code> with any future expiry and CVC.
            Stripe sandbox must be claimed at{" "}
            <a href="https://dashboard.stripe.com/claim_sandbox/YWNjdF8xVDluSXJCSGs5eFhselpHLDE3NzQwNTQwNzMv100uAkiM3mP" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
              Stripe Dashboard
            </a>{" "}
            before May 13, 2026.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
