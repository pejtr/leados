import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Zap,
  Target,
  Plug,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Users,
  TrendingUp,
  Globe,
  Building2,
  BarChart3,
  Webhook,
  ArrowRight,
  Star,
} from "lucide-react";

interface OnboardingWizardProps {
  userName?: string;
  onComplete: () => void;
}

const STEPS = [
  { id: 1, label: "Welcome", icon: Sparkles },
  { id: 2, label: "Your ICP", icon: Target },
  { id: 3, label: "Integrations", icon: Plug },
  { id: 4, label: "All Set!", icon: CheckCircle2 },
];

const INDUSTRIES = [
  "SaaS / Software",
  "Finance & Insurance",
  "Real Estate",
  "Healthcare",
  "E-commerce",
  "Marketing Agency",
  "Consulting",
  "Manufacturing",
  "Recruiting / HR",
  "Other",
];

const COMPANY_SIZES = [
  "1–10 (Startup)",
  "11–50 (Small)",
  "51–200 (Mid-Market)",
  "201–1000 (Enterprise)",
  "1000+ (Large Enterprise)",
];

const SENIORITY_LEVELS = [
  "C-Suite (CEO, CTO, CFO)",
  "VP / Director",
  "Manager",
  "Individual Contributor",
  "Founder / Owner",
];

const FEATURES = [
  { icon: Zap, title: "AI Lead Generation", desc: "Generate 100s of qualified B2B leads in seconds from LinkedIn" },
  { icon: Target, title: "ICP Matching", desc: "AI matches leads to your ideal customer profile automatically" },
  { icon: TrendingUp, title: "Pipeline Tracking", desc: "Kanban board, ROI tracking, and deal management built-in" },
  { icon: Users, title: "AI SDR Agent", desc: "Autonomous outreach agent that generates and sends personalized emails" },
];

export default function OnboardingWizard({ userName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [, navigate] = useLocation();

  // ICP form state
  const [icpName, setIcpName] = useState("My First ICP");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [location, setLocation] = useState("United States");
  const [seniorityLevel, setSeniorityLevel] = useState("");

  // Integration state
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("My Webhook");
  const [skipIntegrations, setSkipIntegrations] = useState(false);

  const [saving, setSaving] = useState(false);

  const saveIcpMut = trpc.onboarding.saveIcp.useMutation();
  const saveWebhookMut = trpc.onboarding.saveWebhook.useMutation();
  const completeMut = trpc.onboarding.complete.useMutation();

  const handleNext = async () => {
    if (step === 2) {
      // Validate ICP
      if (!industry) {
        toast.error("Please select your target industry.");
        return;
      }
      setSaving(true);
      try {
        await saveIcpMut.mutateAsync({
          name: icpName,
          industry,
          companySize: companySize || undefined,
          location: location || undefined,
          seniorityLevel: seniorityLevel || undefined,
        });
      } catch {
        toast.error("Failed to save ICP. You can set it up later in ICP Builder.");
      } finally {
        setSaving(false);
      }
    }

    if (step === 3) {
      // Save webhook if provided and not skipped
      if (!skipIntegrations && webhookUrl.trim()) {
        setSaving(true);
        try {
          await saveWebhookMut.mutateAsync({
            name: webhookName || "My Webhook",
            url: webhookUrl.trim(),
            type: "webhook",
          });
          toast.success("Webhook integration saved!");
        } catch {
          toast.error("Invalid webhook URL. Skipping integration setup.");
        } finally {
          setSaving(false);
        }
      }
      // Mark onboarding complete
      setSaving(true);
      try {
        await completeMut.mutateAsync();
      } catch {
        // ignore
      } finally {
        setSaving(false);
      }
    }

    if (step < 4) {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = async () => {
    if (step === 3) {
      setSaving(true);
      try { await completeMut.mutateAsync(); } catch { /* ignore */ } finally { setSaving(false); }
    }
    if (step < 4) {
      setStep((s) => s + 1);
    }
  };

  const handleDismiss = async () => {
    try { await completeMut.mutateAsync(); } catch { /* ignore */ }
    onComplete();
  };

  const handleFinish = (path: string) => {
    onComplete();
    navigate(path);
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700/60 rounded-2xl shadow-2xl overflow-hidden">

        {/* Progress bar */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isActive = s.id === step;
              const isDone = s.id < step;
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                      isDone
                        ? "bg-emerald-500 text-white"
                        : isActive
                        ? "bg-violet-500 text-white"
                        : "bg-zinc-700 text-zinc-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs hidden sm:block ${isActive ? "text-white font-medium" : "text-zinc-500"}`}>
                    {s.label}
                  </span>
                  {s.id < STEPS.length && <ChevronRight className="w-3 h-3 text-zinc-600 hidden sm:block" />}
                </div>
              );
            })}
          </div>

          {/* Skip/Close */}
          {step < 4 && (
            <button
              onClick={handleDismiss}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-lg hover:bg-zinc-800"
              title="Skip setup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 pb-6">

          {/* ── Step 1: Welcome ─────────────────────────────────── */}
          {step === 1 && (
            <div className="text-center pt-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}! 👋
              </h2>
              <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Let's get you set up in under 2 minutes. AI LeadGen will help you generate qualified B2B leads, enrich them with AI, and automate your outreach.
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex gap-3 p-3 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                      <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-violet-400" />
                      </div>
                      <div>
                        <p className="text-white text-xs font-semibold">{f.title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-zinc-400 text-xs ml-1">Trusted by 500+ B2B teams</span>
              </div>
            </div>
          )}

          {/* ── Step 2: ICP Definition ───────────────────────────── */}
          {step === 2 && (
            <div className="pt-2">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white mb-1">Define Your Ideal Customer</h2>
                <p className="text-zinc-400 text-sm">
                  This helps AI LeadGen generate leads that match your exact target profile.
                </p>
              </div>

              <div className="space-y-4">
                {/* ICP Name */}
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">Profile Name</Label>
                  <Input
                    value={icpName}
                    onChange={(e) => setIcpName(e.target.value)}
                    placeholder="e.g. SaaS Decision Makers"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>

                {/* Industry */}
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    Target Industry <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {INDUSTRIES.map((ind) => (
                      <button
                        key={ind}
                        onClick={() => setIndustry(ind)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          industry === ind
                            ? "bg-violet-500 border-violet-400 text-white"
                            : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {ind}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Company Size */}
                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">Company Size</Label>
                    <div className="space-y-1.5">
                      {COMPANY_SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setCompanySize(size)}
                          className={`w-full px-3 py-1.5 rounded-lg text-xs text-left border transition-all ${
                            companySize === size
                              ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Seniority */}
                  <div>
                    <Label className="text-zinc-300 text-sm mb-1.5 block">Decision Maker Level</Label>
                    <div className="space-y-1.5">
                      {SENIORITY_LEVELS.map((level) => (
                        <button
                          key={level}
                          onClick={() => setSeniorityLevel(level)}
                          className={`w-full px-3 py-1.5 rounded-lg text-xs text-left border transition-all ${
                            seniorityLevel === level
                              ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <Label className="text-zinc-300 text-sm mb-1.5 block">
                    <Globe className="w-3.5 h-3.5 inline mr-1" />
                    Target Location
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. United States, New York, Europe"
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Integrations ─────────────────────────────── */}
          {step === 3 && (
            <div className="pt-2">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-white mb-1">Connect Your Tools</h2>
                <p className="text-zinc-400 text-sm">
                  Optionally connect a webhook to push leads to Zapier, Make, n8n, or your CRM automatically.
                </p>
              </div>

              {!skipIntegrations ? (
                <div className="space-y-4">
                  {/* Webhook option */}
                  <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/40">
                    <div className="flex items-center gap-2 mb-3">
                      <Webhook className="w-4 h-4 text-violet-400" />
                      <span className="text-white text-sm font-medium">Webhook / Zapier / Make</span>
                      <Badge variant="outline" className="text-zinc-400 border-zinc-600 text-xs">Optional</Badge>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-zinc-400 text-xs mb-1 block">Webhook Name</Label>
                        <Input
                          value={webhookName}
                          onChange={(e) => setWebhookName(e.target.value)}
                          placeholder="e.g. Zapier Lead Handler"
                          className="bg-zinc-900 border-zinc-700 text-white text-sm h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-zinc-400 text-xs mb-1 block">Webhook URL</Label>
                        <Input
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://hooks.zapier.com/hooks/catch/..."
                          className="bg-zinc-900 border-zinc-700 text-white text-sm h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other integrations preview */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "ClickUp", desc: "Export as tasks", color: "text-pink-400" },
                      { name: "Google Sheets", desc: "Auto-sync leads", color: "text-emerald-400" },
                      { name: "Slack", desc: "Lead alerts", color: "text-amber-400" },
                    ].map((int) => (
                      <div key={int.name} className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30 text-center opacity-60">
                        <p className={`text-xs font-semibold ${int.color}`}>{int.name}</p>
                        <p className="text-zinc-500 text-xs mt-0.5">{int.desc}</p>
                        <p className="text-zinc-600 text-xs mt-1">Set up later</p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => setSkipIntegrations(true)}
                    className="text-zinc-500 text-xs hover:text-zinc-300 transition-colors"
                  >
                    Skip integrations for now →
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-3">
                    <Plug className="w-5 h-5 text-zinc-400" />
                  </div>
                  <p className="text-zinc-400 text-sm">Integrations skipped.</p>
                  <p className="text-zinc-500 text-xs mt-1">You can set them up anytime in the Integrations page.</p>
                  <button
                    onClick={() => setSkipIntegrations(false)}
                    className="text-violet-400 text-xs mt-3 hover:text-violet-300 transition-colors"
                  >
                    ← Go back to integrations
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: Done ─────────────────────────────────────── */}
          {step === 4 && (
            <div className="text-center pt-4">
              {/* Animated success icon */}
              <div className="relative w-20 h-20 mx-auto mb-5">
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">You're all set! 🎉</h2>
              <p className="text-zinc-400 text-sm mb-6 max-w-md mx-auto">
                Your ICP is saved and AI LeadGen is ready to generate your first batch of qualified leads. Let's go!
              </p>

              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                {industry && (
                  <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                    <Target className="w-3 h-3 mr-1" />
                    {industry}
                  </Badge>
                )}
                {seniorityLevel && (
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                    <Users className="w-3 h-3 mr-1" />
                    {seniorityLevel}
                  </Badge>
                )}
                {location && (
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                    <Globe className="w-3 h-3 mr-1" />
                    {location}
                  </Badge>
                )}
                {companySize && (
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30">
                    <Building2 className="w-3 h-3 mr-1" />
                    {companySize}
                  </Badge>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleFinish("/generate")}
                  className="bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate First Leads
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleFinish("/dashboard")}
                  className="border-zinc-600 text-zinc-300 hover:border-zinc-400 gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </div>

              <button
                onClick={() => handleFinish("/icp-builder")}
                className="mt-3 text-zinc-500 text-xs hover:text-zinc-300 transition-colors flex items-center gap-1 mx-auto"
              >
                Fine-tune my ICP later <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Footer buttons */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep((s) => s - 1) : handleDismiss()}
                className="text-zinc-400 hover:text-zinc-200 gap-1"
                disabled={saving}
              >
                <ChevronLeft className="w-4 h-4" />
                {step === 1 ? "Skip setup" : "Back"}
              </Button>

              <div className="flex items-center gap-3">
                {step > 1 && step < 4 && (
                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-zinc-500 hover:text-zinc-300 text-sm"
                    disabled={saving}
                  >
                    Skip
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={saving}
                  className="bg-violet-600 hover:bg-violet-500 text-white gap-2 px-6"
                >
                  {saving ? "Saving..." : step === 3 ? "Finish Setup" : "Continue"}
                  {!saving && <ChevronRight className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
