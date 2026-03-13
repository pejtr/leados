import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import {
  Zap, Shield, TrendingUp, Users, Mail, BarChart3, CheckCircle2,
  ArrowRight, Star, Building2, Target, Sparkles, Globe,
  Phone, MessageSquare, UserCheck, Lightbulb, Ear, Bot,
  Menu, X, Play, ChevronRight, Cpu, Database, Workflow,
} from "lucide-react";

export default function LandingB() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCTA = () => {
    if (user) navigate("/dashboard");
    else window.location.href = getLoginUrl();
  };

  return (
    <div className="min-h-screen bg-[#030308] text-white">
      {/* ── Nav — Variant B: Transparent, minimal ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LeadGen AI</span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm text-white/50">
            <a href="#process" className="hover:text-white transition-colors">Process</a>
            <a href="#capabilities" className="hover:text-white transition-colors">Capabilities</a>
            <a href="#pricing-b" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="flags" />
            <Button
              size="sm"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/20"
              onClick={handleCTA}
            >
              {user ? "Dashboard" : "Start Free"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="flags" className="scale-90" />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-white/10">
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-[#030308]/95 backdrop-blur-xl border-t border-white/5 px-4 py-4 space-y-3">
            <a href="#process" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 py-2">Process</a>
            <a href="#capabilities" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 py-2">Capabilities</a>
            <a href="#pricing-b" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 py-2">Pricing</a>
            <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 mt-2" onClick={handleCTA}>
              {user ? "Dashboard" : "Start Free"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </nav>

      {/* ── Hero — Variant B: Asymmetric split with floating elements ── */}
      <section className="pt-28 sm:pt-36 pb-20 sm:pb-32 px-4 sm:px-6 relative overflow-hidden">
        {/* Background: warm gradient mesh */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-[180px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[150px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-violet-600/3 rounded-full blur-[200px]" />
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-mono text-amber-300 tracking-wider">NEURAL LEAD ENGINE</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] mb-6">
                <span className="text-white">Turn signals</span>
                <br />
                <span className="text-white">into </span>
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">revenue</span>
              </h1>

              <p className="text-lg text-white/50 max-w-lg mb-8 leading-relaxed">
                Our AI pipeline captures buying intent from LinkedIn, enriches contacts in real-time, and delivers warm leads to your CRM in under 5 minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 h-12 text-base font-semibold shadow-xl shadow-amber-500/25"
                  onClick={handleCTA}
                >
                  Start generating leads <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/10 text-white/70 hover:bg-white/5 px-6 h-12 gap-2"
                >
                  <Play className="w-4 h-4" /> Watch demo
                </Button>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-white/30">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> No credit card</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 50 free leads</span>
              </div>
            </div>

            {/* Right: Floating tech dashboard mockup */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main card */}
                <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono text-white/30">LIVE PIPELINE</span>
                    <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> PROCESSING
                    </span>
                  </div>

                  {/* Simulated pipeline rows */}
                  {[
                    { company: "TechCorp GmbH", score: 94, status: "Enriched", color: "text-emerald-400" },
                    { company: "DataFlow Solutions", score: 87, status: "Scoring", color: "text-amber-400" },
                    { company: "CloudBase Inc.", score: 72, status: "Captured", color: "text-blue-400" },
                    { company: "FinServ Partners", score: 91, status: "Enriched", color: "text-emerald-400" },
                  ].map((row) => (
                    <div key={row.company} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white/80">{row.company}</p>
                        <p className="text-[10px] text-white/30 font-mono mt-0.5">{row.status}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full" style={{ width: `${row.score}%` }} />
                        </div>
                        <span className={`text-xs font-mono font-bold ${row.color}`}>{row.score}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Floating metric cards */}
                <div className="absolute -top-4 -right-4 bg-white/[0.05] border border-white/[0.1] rounded-xl p-3 backdrop-blur-sm shadow-xl">
                  <p className="text-[10px] text-white/40 font-mono">TODAY</p>
                  <p className="text-xl font-black text-amber-400">847</p>
                  <p className="text-[10px] text-white/30">leads captured</p>
                </div>

                <div className="absolute -bottom-3 -left-3 bg-white/[0.05] border border-white/[0.1] rounded-xl p-3 backdrop-blur-sm shadow-xl">
                  <p className="text-[10px] text-white/40 font-mono">AVG SCORE</p>
                  <p className="text-xl font-black text-emerald-400">86.4</p>
                  <p className="text-[10px] text-white/30">quality index</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process — Variant B: Horizontal scroll cards with connection lines ── */}
      <section id="process" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#050510] border-y border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
              <Workflow className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-mono text-white/50 tracking-wider">ARCHITECTURE</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black mb-3">How the engine works</h2>
            <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto">Four autonomous stages. Zero manual intervention.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {[
              {
                step: "01", title: "Signal Capture", desc: "AI scans LinkedIn, websites, and intent databases to identify companies showing buying signals.",
                icon: <Database className="w-5 h-5" />, color: "amber",
                tags: ["LinkedIn API", "Web Scraping", "Intent Data"],
              },
              {
                step: "02", title: "Neural Enrichment", desc: "GPT-4 analyzes each lead, verifies emails, generates personalized icebreakers and scores quality.",
                icon: <Cpu className="w-5 h-5" />, color: "orange",
                tags: ["GPT-4 Analysis", "Email Verify", "Quality Score"],
              },
              {
                step: "03", title: "Smart Routing", desc: "Leads are automatically sequenced into multi-channel campaigns with A/B tested messaging.",
                icon: <Workflow className="w-5 h-5" />, color: "rose",
                tags: ["Auto-Sequence", "A/B Testing", "Multi-Channel"],
              },
              {
                step: "04", title: "Revenue Capture", desc: "Closed-loop tracking syncs with your CRM, measures ROI, and optimizes the pipeline continuously.",
                icon: <TrendingUp className="w-5 h-5" />, color: "emerald",
                tags: ["CRM Sync", "ROI Tracking", "Auto-Optimize"],
              },
            ].map((item) => {
              const colors: Record<string, { bg: string; text: string; border: string; tagBg: string }> = {
                amber: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", tagBg: "bg-amber-500/10" },
                orange: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", tagBg: "bg-orange-500/10" },
                rose: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", tagBg: "bg-rose-500/10" },
                emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", tagBg: "bg-emerald-500/10" },
              };
              const c = colors[item.color];
              return (
                <div key={item.step} className="relative group">
                  <div className={`p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all h-full`}>
                    <div className={`w-11 h-11 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center mb-4`}>
                      <div className={c.text}>{item.icon}</div>
                    </div>
                    <span className={`text-[10px] font-mono ${c.text} tracking-[0.2em] opacity-60`}>STAGE {item.step}</span>
                    <h3 className="font-bold text-white text-base mt-2 mb-2">{item.title}</h3>
                    <p className="text-xs text-white/40 leading-relaxed mb-4">{item.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className={`text-[9px] font-mono px-2 py-0.5 rounded-full ${c.tagBg} ${c.text} opacity-70`}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 text-[10px] sm:text-xs font-mono text-white/20 tracking-wider">
            <span>LATENCY: &lt;200ms</span>
            <span>THROUGHPUT: 10K/hr</span>
            <span>UPTIME: 99.97%</span>
          </div>
        </div>
      </section>

      {/* ── Capabilities — Variant B: Bento grid layout ── */}
      <section id="capabilities" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">Capabilities</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3">Everything you need to dominate</h2>
            <p className="text-white/40 text-sm sm:text-base max-w-lg mx-auto">21 integrated tools. One unified platform.</p>
          </div>

          {/* Bento grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Target, label: "AI Lead Scoring", span: "" },
              { icon: Mail, label: "Email Verification", span: "" },
              { icon: Sparkles, label: "AI Icebreakers", span: "lg:col-span-2" },
              { icon: Users, label: "B2B Matching", span: "" },
              { icon: Lightbulb, label: "Next Best Action", span: "lg:col-span-2" },
              { icon: Bot, label: "AI SDR Agent", span: "" },
              { icon: Ear, label: "Social Listening", span: "" },
              { icon: Shield, label: "Smart Alerts", span: "" },
              { icon: Zap, label: "Speed-to-Lead", span: "" },
              { icon: BarChart3, label: "Tech Stack Detection", span: "lg:col-span-2" },
              { icon: Globe, label: "Agency Panel", span: "" },
              { icon: UserCheck, label: "ICP Builder", span: "" },
            ].map((item) => (
              <div
                key={item.label}
                className={`${item.span} p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-amber-500/20 hover:bg-amber-500/[0.02] transition-all group cursor-pointer`}
                onClick={handleCTA}
              >
                <item.icon className="w-5 h-5 text-white/30 group-hover:text-amber-400 transition-colors mb-2" />
                <span className="text-xs sm:text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ── */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 border-y border-white/5 bg-white/[0.01]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {[
            { value: "32,000+", label: "Leads generated" },
            { value: "94%", label: "Enrichment accuracy" },
            { value: "< 5 min", label: "Average delivery" },
            { value: "12+", label: "Industries served" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent mb-1">{s.value}</div>
              <div className="text-xs sm:text-sm text-white/40">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing — Variant B: Horizontal comparison ── */}
      <section id="pricing-b" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="mb-4 bg-amber-500/20 text-amber-300 border-amber-500/30">Pricing</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3">Simple, transparent pricing</h2>
            <p className="text-white/40 text-sm sm:text-base">Start free. Scale as you grow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {[
              { name: "Starter", price: "Free", desc: "For testing the waters", features: ["50 leads/month", "Basic enrichment", "CSV export", "Email support"], highlighted: false },
              { name: "Professional", price: "$79", desc: "For serious prospectors", features: ["2,000 leads/month", "AI icebreakers", "CRM integrations", "Autopilot mode", "Priority support", "Smart alerts", "Campaign rules"], highlighted: true },
              { name: "Enterprise", price: "$249", desc: "For scaling teams", features: ["Unlimited leads", "Agency panel", "Custom AI models", "Dedicated account manager", "SLA guarantee", "API access"], highlighted: false },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted
                  ? "bg-gradient-to-b from-amber-600/15 to-orange-900/10 border-amber-500/30 shadow-xl shadow-amber-500/10"
                  : "bg-white/[0.02] border-white/[0.06]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-5 sm:p-6">
                  <h3 className="font-bold text-lg text-white mb-1">{plan.name}</h3>
                  <p className="text-xs text-white/40 mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                    {plan.price !== "Free" && <span className="text-white/30 text-sm">/month</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                        <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.highlighted ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600" : "bg-white/10 hover:bg-white/15 text-white"}`}
                    onClick={handleCTA}
                  >
                    Get started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — Variant B ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-amber-500/10 rounded-full blur-[150px]" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <h2 className="text-2xl sm:text-4xl font-black mb-4">Ready to 10x your pipeline?</h2>
          <p className="text-white/40 text-sm sm:text-lg mb-8">Join 500+ B2B teams already using LeadGen AI to crush their quotas.</p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-10 h-12 text-base font-semibold shadow-xl shadow-amber-500/25"
            onClick={handleCTA}
          >
            Start free trial <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-0 sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">LeadGen AI</span>
          </div>
          <p className="text-xs text-white/30">© 2026 LeadGen AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher variant="flags" />
            <div className="flex gap-6 text-xs text-white/30">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── A/B Test Indicator ── */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-mono text-amber-300 tracking-wider">VARIANT B</span>
        </div>
      </div>
    </div>
  );
}
