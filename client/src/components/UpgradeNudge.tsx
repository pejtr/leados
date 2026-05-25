import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { X, Zap, TrendingUp, Lock, ArrowRight, Star, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Feature Gate Wrapper ────────────────────────────────────────────────────
interface FeatureGateProps {
  feature: string;
  requiredPlan: "starter" | "growth" | "pro";
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const PLAN_HIERARCHY = { free: 0, starter: 1, growth: 2, pro: 3 };

export function FeatureGate({ feature, requiredPlan, children, fallback }: FeatureGateProps) {
  const { user } = useAuth();
  const plan = (user?.subscriptionPlan ?? "free") as keyof typeof PLAN_HIERARCHY;
  const required = requiredPlan as keyof typeof PLAN_HIERARCHY;

  if (PLAN_HIERARCHY[plan] >= PLAN_HIERARCHY[required]) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : (
    <LockedFeatureCard feature={feature} requiredPlan={requiredPlan} />
  );
}

// ─── Locked Feature Card ─────────────────────────────────────────────────────
function LockedFeatureCard({ feature, requiredPlan }: { feature: string; requiredPlan: string }) {
  const [, navigate] = useLocation();
  const planColors: Record<string, string> = {
    starter: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    growth: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
    pro: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
  };

  return (
    <div className={cn(
      "relative rounded-xl border bg-gradient-to-br p-6 text-center",
      planColors[requiredPlan] ?? planColors.starter
    )}>
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-white/60" />
        </div>
        <div>
          <p className="font-semibold text-white">{feature}</p>
          <p className="text-sm text-white/60 mt-1">
            Dostupné v plánu <span className="font-bold capitalize text-white/80">{requiredPlan}</span>
          </p>
        </div>
        <Button
          size="sm"
          className="bg-white/20 hover:bg-white/30 text-white border-white/20"
          onClick={() => navigate("/billing")}
        >
          <Zap className="w-3 h-3 mr-1" />
          Upgradovat
        </Button>
      </div>
    </div>
  );
}

// ─── Inline Upgrade Banner ────────────────────────────────────────────────────
interface UpgradeBannerProps {
  title: string;
  description: string;
  ctaLabel?: string;
  variant?: "info" | "warning" | "urgent";
  dismissible?: boolean;
  storageKey?: string;
}

export function UpgradeBanner({
  title,
  description,
  ctaLabel = "Upgradovat plán",
  variant = "info",
  dismissible = true,
  storageKey,
}: UpgradeBannerProps) {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (storageKey && localStorage.getItem(storageKey)) {
      setDismissed(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    setDismissed(true);
  };

  if (dismissed) return null;

  const variantStyles = {
    info: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    warning: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    urgent: "bg-rose-500/10 border-rose-500/30 text-rose-300",
  };

  const iconMap = {
    info: <Zap className="w-4 h-4 shrink-0" />,
    warning: <TrendingUp className="w-4 h-4 shrink-0" />,
    urgent: <Timer className="w-4 h-4 shrink-0" />,
  };

  return (
    <div className={cn(
      "flex items-center gap-3 rounded-lg border px-4 py-3 mb-4 text-sm",
      variantStyles[variant]
    )}>
      {iconMap[variant]}
      <div className="flex-1 min-w-0">
        <span className="font-semibold">{title}</span>
        <span className="ml-2 opacity-80">{description}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="shrink-0 text-current hover:bg-white/10 h-7 px-3 text-xs font-semibold"
        onClick={() => navigate("/billing")}
      >
        {ctaLabel}
        <ArrowRight className="w-3 h-3 ml-1" />
      </Button>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ─── Usage Limit Indicator ────────────────────────────────────────────────────
interface UsageLimitProps {
  used: number;
  limit: number;
  label: string;
  upgradeMessage?: string;
}

export function UsageLimitIndicator({ used, limit, label, upgradeMessage }: UsageLimitProps) {
  const [, navigate] = useLocation();
  const pct = Math.min((used / limit) * 100, 100);
  const isNearLimit = pct >= 80;
  const isAtLimit = pct >= 100;

  return (
    <div className={cn(
      "rounded-lg border p-3 text-sm",
      isAtLimit ? "border-rose-500/40 bg-rose-500/5" :
      isNearLimit ? "border-amber-500/40 bg-amber-500/5" :
      "border-white/10 bg-white/5"
    )}>
      <div className="flex items-center justify-between mb-2">
        <span className={cn(
          "font-medium",
          isAtLimit ? "text-rose-400" : isNearLimit ? "text-amber-400" : "text-white/70"
        )}>
          {label}
        </span>
        <span className={cn(
          "text-xs font-mono",
          isAtLimit ? "text-rose-400" : isNearLimit ? "text-amber-400" : "text-white/50"
        )}>
          {used} / {limit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isAtLimit ? "bg-rose-500" : isNearLimit ? "bg-amber-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {(isNearLimit || isAtLimit) && upgradeMessage && (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-white/50">{upgradeMessage}</span>
          <button
            onClick={() => navigate("/billing")}
            className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1"
          >
            <Zap className="w-3 h-3" />
            Upgradovat
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Floating Upgrade Nudge (appears after X seconds for free users) ──────────
export function FloatingUpgradeNudge() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [countdown, setCountdown] = useState(15);

  const isFree = !user || user.subscriptionPlan === "free" || !user.subscriptionPlan;

  useEffect(() => {
    if (!isFree) return;
    const dismissed = sessionStorage.getItem("upgrade_nudge_dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 45_000); // show after 45s
    return () => clearTimeout(timer);
  }, [isFree]);

  useEffect(() => {
    if (!visible) return;
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [visible, countdown]);

  const handleDismiss = () => {
    sessionStorage.setItem("upgrade_nudge_dismissed", "1");
    setDismissed(true);
  };

  if (!isFree || !visible || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-violet-500/30 bg-[#0D1B2A]/95 backdrop-blur-xl shadow-2xl shadow-violet-500/20 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
            <Star className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Odemkni plný výkon</p>
            <p className="text-xs text-white/50">LeadOS Pro</p>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-white/30 hover:text-white/60">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        {[
          "Neomezené AI leady",
          "Email sekvence autopilot",
          "Webhook integrace",
          "Priority scraping",
        ].map(item => (
          <div key={item} className="flex items-center gap-2 text-xs text-white/70">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            {item}
          </div>
        ))}
      </div>

      <Button
        className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm"
        onClick={() => { navigate("/billing"); handleDismiss(); }}
      >
        <Zap className="w-3.5 h-3.5 mr-2" />
        Začít zdarma — 14 dní trial
        <ArrowRight className="w-3.5 h-3.5 ml-2" />
      </Button>

      {countdown > 0 && (
        <p className="text-center text-xs text-white/30 mt-2">
          Tato nabídka zmizí za {countdown}s
        </p>
      )}
    </div>
  );
}

// ─── Plan Badge ───────────────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; className: string }> = {
    free: { label: "Free", className: "bg-white/10 text-white/50" },
    starter: { label: "Starter", className: "bg-blue-500/20 text-blue-300" },
    growth: { label: "Growth", className: "bg-violet-500/20 text-violet-300" },
    pro: { label: "Pro", className: "bg-amber-500/20 text-amber-300" },
  };
  const cfg = config[plan] ?? config.free;
  return (
    <Badge className={cn("text-xs font-semibold border-0", cfg.className)}>
      {cfg.label}
    </Badge>
  );
}
