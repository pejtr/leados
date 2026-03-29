import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Scroll,
  Building2,
  Target,
  MessageSquare,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Info,
  ChevronRight,
  Zap,
} from "lucide-react";

// ── Section wrapper ────────────────────────────────────────────────────────────
function Section({
  icon: Icon,
  title,
  description,
  children,
  accent = "teal",
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
  accent?: "teal" | "indigo" | "violet" | "emerald";
}) {
  const accentMap = {
    teal: "text-[#00D4C8] bg-[#00D4C8]/10 border-[#00D4C8]/20",
    indigo: "text-[#6B4FE8] bg-[#6B4FE8]/10 border-[#6B4FE8]/20",
    violet: "text-[#8B5CF6] bg-[#8B5CF6]/10 border-[#8B5CF6]/20",
    emerald: "text-[#4ECBA0] bg-[#4ECBA0]/10 border-[#4ECBA0]/20",
  };
  const iconColor = {
    teal: "text-[#00D4C8]",
    indigo: "text-[#6B4FE8]",
    violet: "text-[#8B5CF6]",
    emerald: "text-[#4ECBA0]",
  };

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white/80 backdrop-blur-sm p-6 shadow-sm">
      <div className="flex items-start gap-4 mb-6">
        <div className={`p-2.5 rounded-xl border ${accentMap[accent]}`}>
          <Icon className={`w-5 h-5 ${iconColor[accent]}`} />
        </div>
        <div>
          <h3 className="font-semibold text-[#0D1B2A] text-base">{title}</h3>
          <p className="text-sm text-[#64748B] mt-0.5">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ── Field row ─────────────────────────────────────────────────────────────────
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-[#334155]">{label}</Label>
      {children}
      {hint && <p className="text-xs text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

// ── Tag input (comma-separated → badges) ─────────────────────────────────────
function TagInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const tags = value
    ? value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const [inputVal, setInputVal] = useState("");

  const addTag = (raw: string) => {
    const newTag = raw.trim();
    if (!newTag) return;
    const updated = [...tags, newTag];
    onChange(updated.join(", "));
    setInputVal("");
  };

  const removeTag = (idx: number) => {
    const updated = tags.filter((_, i) => i !== idx);
    onChange(updated.join(", "));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {tags.map((tag, i) => (
          <Badge
            key={i}
            variant="secondary"
            className="bg-[#F0FDF9] text-[#00A89E] border border-[#00D4C8]/30 cursor-pointer hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors text-xs"
            onClick={() => removeTag(i)}
          >
            {tag} ×
          </Badge>
        ))}
      </div>
      <Input
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(inputVal);
          }
        }}
        onBlur={() => {
          if (inputVal.trim()) addTag(inputVal);
        }}
        placeholder={placeholder ?? "Type and press Enter to add..."}
        className="border-[#E2E8F0] focus:border-[#00D4C8] focus:ring-[#00D4C8]/20 text-sm"
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIConstitution() {
  const { data: existing, isLoading } = trpc.constitution.get.useQuery();
  const saveMutation = trpc.constitution.save.useMutation({
    onSuccess: () => {
      toast.success("AI Constitution saved — all AI calls will now use this context.");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Company
    companyName: "",
    companyDescription: "",
    industry: "",
    companySize: "",
    website: "",
    // ICP
    icpIndustries: "",
    icpCompanySize: "",
    icpSeniority: "",
    icpGeography: "",
    icpPainPoints: "",
    icpBuyingTriggers: "",
    // Value prop
    uniqueValueProp: "",
    topCompetitors: "",
    differentiators: "",
    // Communication
    communicationTone: "professional" as "professional" | "casual" | "bold" | "empathetic",
    languageStyle: "direct" as "direct" | "storytelling" | "data-driven" | "consultative",
    forbiddenWords: "",
    // Goals
    primaryGoal: "generate_leads",
    monthlyLeadTarget: "",
    avgDealValue: "",
    salesCycleLength: "",
    // Custom
    customContext: "",
  });

  // Populate from DB when loaded
  useEffect(() => {
    if (existing) {
      setForm({
        companyName: existing.companyName ?? "",
        companyDescription: existing.companyDescription ?? "",
        industry: existing.industry ?? "",
        companySize: existing.companySize ?? "",
        website: existing.website ?? "",
        icpIndustries: existing.icpIndustries ?? "",
        icpCompanySize: existing.icpCompanySize ?? "",
        icpSeniority: existing.icpSeniority ?? "",
        icpGeography: existing.icpGeography ?? "",
        icpPainPoints: existing.icpPainPoints ?? "",
        icpBuyingTriggers: existing.icpBuyingTriggers ?? "",
        uniqueValueProp: existing.uniqueValueProp ?? "",
        topCompetitors: existing.topCompetitors ?? "",
        differentiators: existing.differentiators ?? "",
        communicationTone: (existing.communicationTone as any) ?? "professional",
        languageStyle: (existing.languageStyle as any) ?? "direct",
        forbiddenWords: existing.forbiddenWords ?? "",
        primaryGoal: existing.primaryGoal ?? "generate_leads",
        monthlyLeadTarget: existing.monthlyLeadTarget?.toString() ?? "",
        avgDealValue: existing.avgDealValue?.toString() ?? "",
        salesCycleLength: existing.salesCycleLength ?? "",
        customContext: existing.customContext ?? "",
      });
    }
  }, [existing]);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSave = () => {
    saveMutation.mutate({
      ...form,
      monthlyLeadTarget: form.monthlyLeadTarget ? parseInt(form.monthlyLeadTarget) : undefined,
      avgDealValue: form.avgDealValue ? parseInt(form.avgDealValue) : undefined,
    });
  };

  // Completeness score
  const fields = [
    form.companyName, form.companyDescription, form.industry,
    form.icpIndustries, form.icpPainPoints, form.uniqueValueProp,
    form.differentiators, form.customContext,
  ];
  const filled = fields.filter(Boolean).length;
  const pct = Math.round((filled / fields.length) * 100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#00D4C8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#00D4C8]/20 to-[#6B4FE8]/20 border border-[#00D4C8]/30">
            <Scroll className="w-6 h-6 text-[#00D4C8]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0D1B2A]">AI Constitution</h1>
            <p className="text-[#64748B] mt-1 text-sm max-w-xl">
              Define your company context once — it gets automatically injected into every AI call
              across the platform. Leads, icebreakers, SDR campaigns, 5 Brains analyses, and more
              will all speak your language.
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-[#00D4C8] to-[#6B4FE8] text-white hover:opacity-90 shrink-0 gap-2"
        >
          {saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Save Constitution
        </Button>
      </div>

      {/* ── Completeness bar ── */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white/80 p-4 flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm font-medium text-[#334155]">Constitution completeness</span>
            <span className="text-sm font-bold text-[#00D4C8]">{pct}%</span>
          </div>
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00D4C8] to-[#6B4FE8] rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {pct === 100 ? (
          <CheckCircle2 className="w-5 h-5 text-[#4ECBA0] shrink-0" />
        ) : (
          <Info className="w-5 h-5 text-[#94A3B8] shrink-0" />
        )}
        <p className="text-xs text-[#94A3B8] max-w-[200px] shrink-0">
          {pct < 50
            ? "Add more context to improve AI output quality."
            : pct < 80
            ? "Good start! Fill remaining fields for best results."
            : "Excellent! Your AI is well-calibrated."}
        </p>
      </div>

      {/* ── How it works banner ── */}
      <div className="rounded-xl bg-gradient-to-r from-[#0D1B2A] to-[#1a2d47] p-4 flex items-center gap-3 text-white">
        <Sparkles className="w-5 h-5 text-[#00D4C8] shrink-0" />
        <p className="text-sm">
          <span className="font-semibold text-[#00D4C8]">How it works:</span> This constitution is
          prepended as a system prompt to every AI call — lead icebreakers, 5 Brains analyses, SDR
          emails, market intelligence, and the AI chatbot. The more context you provide, the more
          personalized and accurate the outputs.
        </p>
        <ChevronRight className="w-4 h-4 text-[#00D4C8] shrink-0" />
      </div>

      {/* ── Section 1: Company Identity ── */}
      <Section
        icon={Building2}
        title="Company Identity"
        description="Basic information about your company that provides context for all AI outputs."
        accent="teal"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Company Name">
            <Input
              value={form.companyName}
              onChange={(e) => set("companyName")(e.target.value)}
              placeholder="e.g. Acme Corp s.r.o."
              className="border-[#E2E8F0] focus:border-[#00D4C8]"
            />
          </Field>
          <Field label="Website">
            <Input
              value={form.website}
              onChange={(e) => set("website")(e.target.value)}
              placeholder="https://yourcompany.com"
              className="border-[#E2E8F0] focus:border-[#00D4C8]"
            />
          </Field>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Industry">
            <Input
              value={form.industry}
              onChange={(e) => set("industry")(e.target.value)}
              placeholder="e.g. B2B SaaS, Financial Services"
              className="border-[#E2E8F0] focus:border-[#00D4C8]"
            />
          </Field>
          <Field label="Company Size">
            <Select value={form.companySize} onValueChange={set("companySize")}>
              <SelectTrigger className="border-[#E2E8F0] focus:border-[#00D4C8]">
                <SelectValue placeholder="Select size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1–10 employees (Startup)</SelectItem>
                <SelectItem value="11-50">11–50 employees (Small)</SelectItem>
                <SelectItem value="51-200">51–200 employees (Mid-market)</SelectItem>
                <SelectItem value="201-500">201–500 employees</SelectItem>
                <SelectItem value="500+">500+ employees (Enterprise)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field
          label="Company Description"
          hint="2–3 sentences about what your company does, for whom, and what problem it solves."
        >
          <Textarea
            value={form.companyDescription}
            onChange={(e) => set("companyDescription")(e.target.value)}
            placeholder="We help B2B companies in financial services automate their lead generation using AI, reducing time-to-pipeline by 80%..."
            rows={3}
            className="border-[#E2E8F0] focus:border-[#00D4C8] resize-none"
          />
        </Field>
      </Section>

      {/* ── Section 2: Ideal Customer Profile ── */}
      <Section
        icon={Target}
        title="Ideal Customer Profile (ICP)"
        description="Define exactly who your best customers are. AI will use this to score and qualify leads."
        accent="indigo"
      >
        <Field label="Target Industries" hint="Press Enter or comma to add each industry.">
          <TagInput
            value={form.icpIndustries}
            onChange={set("icpIndustries")}
            placeholder="e.g. SaaS, Insurance, Real Estate..."
          />
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Target Company Size">
            <Select value={form.icpCompanySize} onValueChange={set("icpCompanySize")}>
              <SelectTrigger className="border-[#E2E8F0]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-50">1–50 (SMB)</SelectItem>
                <SelectItem value="50-200">50–200 (Mid-market)</SelectItem>
                <SelectItem value="200-1000">200–1,000</SelectItem>
                <SelectItem value="1000+">1,000+ (Enterprise)</SelectItem>
                <SelectItem value="any">Any size</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Target Seniority">
            <Input
              value={form.icpSeniority}
              onChange={(e) => set("icpSeniority")(e.target.value)}
              placeholder="e.g. CEO, CMO, Head of Sales"
              className="border-[#E2E8F0] focus:border-[#6B4FE8]"
            />
          </Field>
        </div>
        <Field label="Target Geography">
          <Input
            value={form.icpGeography}
            onChange={(e) => set("icpGeography")(e.target.value)}
            placeholder="e.g. Czech Republic, Slovakia, Germany, CEE region"
            className="border-[#E2E8F0] focus:border-[#6B4FE8]"
          />
        </Field>
        <Field
          label="Customer Pain Points"
          hint="What problems do your ideal customers struggle with? AI will reference these in icebreakers."
        >
          <Textarea
            value={form.icpPainPoints}
            onChange={(e) => set("icpPainPoints")(e.target.value)}
            placeholder="They spend too much time manually prospecting, have low reply rates on cold outreach, can't scale their sales team..."
            rows={3}
            className="border-[#E2E8F0] focus:border-[#6B4FE8] resize-none"
          />
        </Field>
        <Field
          label="Buying Triggers"
          hint="What events or signals indicate a prospect is ready to buy?"
        >
          <Textarea
            value={form.icpBuyingTriggers}
            onChange={(e) => set("icpBuyingTriggers")(e.target.value)}
            placeholder="Recently raised funding, hired a new VP of Sales, expanding to new markets, missed quarterly targets..."
            rows={2}
            className="border-[#E2E8F0] focus:border-[#6B4FE8] resize-none"
          />
        </Field>
      </Section>

      {/* ── Section 3: Value Proposition ── */}
      <Section
        icon={Sparkles}
        title="Value Proposition & Positioning"
        description="What makes you unique? AI will use this to craft compelling messages and competitive analysis."
        accent="emerald"
      >
        <Field
          label="Unique Value Proposition"
          hint="One or two sentences that capture your core value. What do you do better than anyone else?"
        >
          <Textarea
            value={form.uniqueValueProp}
            onChange={(e) => set("uniqueValueProp")(e.target.value)}
            placeholder="We're the only platform that combines LinkedIn scraping, AI email enrichment, and CRM automation in one workflow — cutting lead-to-pipeline time from weeks to hours."
            rows={2}
            className="border-[#E2E8F0] focus:border-[#4ECBA0] resize-none"
          />
        </Field>
        <Field label="Top Competitors" hint="Press Enter to add each competitor.">
          <TagInput
            value={form.topCompetitors}
            onChange={set("topCompetitors")}
            placeholder="e.g. HubSpot, Apollo.io, Salesforce..."
          />
        </Field>
        <Field
          label="Key Differentiators"
          hint="What specific features, results, or approaches set you apart from competitors?"
        >
          <Textarea
            value={form.differentiators}
            onChange={(e) => set("differentiators")(e.target.value)}
            placeholder="10x faster setup than HubSpot, GDPR-compliant by design, Czech/Slovak market expertise, AI icebreakers with 3x higher reply rates..."
            rows={2}
            className="border-[#E2E8F0] focus:border-[#4ECBA0] resize-none"
          />
        </Field>
      </Section>

      {/* ── Section 4: Communication Style ── */}
      <Section
        icon={MessageSquare}
        title="Communication Style"
        description="How should the AI write? This affects all generated emails, icebreakers, and reports."
        accent="violet"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Communication Tone">
            <Select
              value={form.communicationTone}
              onValueChange={(v) => set("communicationTone")(v)}
            >
              <SelectTrigger className="border-[#E2E8F0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional — formal, trustworthy</SelectItem>
                <SelectItem value="casual">Casual — friendly, approachable</SelectItem>
                <SelectItem value="bold">Bold — direct, confident, punchy</SelectItem>
                <SelectItem value="empathetic">Empathetic — warm, understanding</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Language Style">
            <Select value={form.languageStyle} onValueChange={(v) => set("languageStyle")(v)}>
              <SelectTrigger className="border-[#E2E8F0]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="direct">Direct — short sentences, clear CTAs</SelectItem>
                <SelectItem value="storytelling">Storytelling — narrative, examples</SelectItem>
                <SelectItem value="data-driven">Data-driven — numbers, proof points</SelectItem>
                <SelectItem value="consultative">Consultative — questions, advisory</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <Field
          label="Forbidden Words / Phrases"
          hint="Comma-separated. AI will avoid these in all generated content."
        >
          <Input
            value={form.forbiddenWords}
            onChange={(e) => set("forbiddenWords")(e.target.value)}
            placeholder="e.g. synergy, leverage, disruptive, game-changing, touch base"
            className="border-[#E2E8F0] focus:border-[#8B5CF6]"
          />
        </Field>
      </Section>

      {/* ── Section 5: Goals & Metrics ── */}
      <Section
        icon={TrendingUp}
        title="Business Goals & Metrics"
        description="Help AI understand your targets so it can prioritize and contextualize recommendations."
        accent="teal"
      >
        <Field label="Primary Goal">
          <Select value={form.primaryGoal} onValueChange={set("primaryGoal")}>
            <SelectTrigger className="border-[#E2E8F0]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="generate_leads">Generate qualified leads</SelectItem>
              <SelectItem value="close_deals">Close more deals</SelectItem>
              <SelectItem value="expand_accounts">Expand existing accounts</SelectItem>
              <SelectItem value="enter_new_market">Enter new market</SelectItem>
              <SelectItem value="increase_mrr">Increase MRR</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field label="Monthly Lead Target">
            <Input
              type="number"
              value={form.monthlyLeadTarget}
              onChange={(e) => set("monthlyLeadTarget")(e.target.value)}
              placeholder="e.g. 200"
              className="border-[#E2E8F0] focus:border-[#00D4C8]"
            />
          </Field>
          <Field label="Avg. Deal Value (USD)">
            <Input
              type="number"
              value={form.avgDealValue}
              onChange={(e) => set("avgDealValue")(e.target.value)}
              placeholder="e.g. 5000"
              className="border-[#E2E8F0] focus:border-[#00D4C8]"
            />
          </Field>
          <Field label="Sales Cycle Length">
            <Select value={form.salesCycleLength} onValueChange={set("salesCycleLength")}>
              <SelectTrigger className="border-[#E2E8F0]">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-7 days">1–7 days (transactional)</SelectItem>
                <SelectItem value="1-4 weeks">1–4 weeks (short)</SelectItem>
                <SelectItem value="1-3 months">1–3 months (medium)</SelectItem>
                <SelectItem value="3-6 months">3–6 months (long)</SelectItem>
                <SelectItem value="6+ months">6+ months (enterprise)</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </Section>

      {/* ── Section 6: Custom Context ── */}
      <Section
        icon={Scroll}
        title="Custom Instructions"
        description="Anything else the AI should always know or do. This is your free-form override."
        accent="indigo"
      >
        <Field
          label="Additional Context"
          hint="Free-form instructions. Examples: language preferences, regional nuances, specific product lines to focus on, compliance requirements, or anything else."
        >
          <Textarea
            value={form.customContext}
            onChange={(e) => set("customContext")(e.target.value)}
            placeholder={`Examples:\n- Always write in Czech when the lead is from Czech Republic or Slovakia\n- Never mention pricing in first outreach\n- Focus on ROI and time savings in all messaging\n- Our main product is LeadOS — always reference it by name`}
            rows={5}
            className="border-[#E2E8F0] focus:border-[#6B4FE8] resize-none font-mono text-sm"
          />
        </Field>
      </Section>

      {/* ── Save button (bottom) ── */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          size="lg"
          className="bg-gradient-to-r from-[#00D4C8] to-[#6B4FE8] text-white hover:opacity-90 gap-2 px-8"
        >
          {saveMutation.isPending ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Save AI Constitution
        </Button>
      </div>
    </div>
  );
}
