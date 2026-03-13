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
  ArrowRight, Star, Building2, Target, Download, Sparkles, Globe,
  ChevronRight, Phone, MessageSquare, UserCheck, Lightbulb, Ear, Bot,
  Menu, X,
} from "lucide-react";

export default function Landing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  const FEATURES = [
    { icon: Zap, title: t("landing.feature1Title"), description: t("landing.feature1Desc"), color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { icon: Target, title: t("landing.feature2Title"), description: t("landing.feature2Desc"), color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: Shield, title: t("landing.feature3Title"), description: t("landing.feature3Desc"), color: "text-green-400", bg: "bg-green-400/10" },
    { icon: TrendingUp, title: t("landing.feature4Title"), description: t("landing.feature4Desc"), color: "text-purple-400", bg: "bg-purple-400/10" },
    { icon: Mail, title: t("landing.feature5Title"), description: t("landing.feature5Desc"), color: "text-pink-400", bg: "bg-pink-400/10" },
    { icon: Users, title: t("landing.feature6Title"), description: t("landing.feature6Desc"), color: "text-orange-400", bg: "bg-orange-400/10" },
    { icon: Target, title: t("landing.feature7Title"), description: t("landing.feature7Desc"), color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { icon: UserCheck, title: t("landing.feature8Title"), description: t("landing.feature8Desc"), color: "text-rose-400", bg: "bg-rose-400/10" },
    { icon: Lightbulb, title: t("landing.feature9Title"), description: t("landing.feature9Desc"), color: "text-amber-400", bg: "bg-amber-400/10" },
    { icon: Ear, title: t("landing.feature10Title"), description: t("landing.feature10Desc"), color: "text-teal-400", bg: "bg-teal-400/10" },
    { icon: Bot, title: t("landing.feature11Title"), description: t("landing.feature11Desc"), color: "text-indigo-400", bg: "bg-indigo-400/10" },
  ];

  const STEPS = [
    { number: "01", title: t("landing.step1Title"), description: t("landing.step1Desc") },
    { number: "02", title: t("landing.step2Title"), description: t("landing.step2Desc") },
    { number: "03", title: t("landing.step3Title"), description: t("landing.step3Desc") },
    { number: "04", title: t("landing.step4Title"), description: t("landing.step4Desc") },
  ];

  const TESTIMONIALS = [
    { name: t("landing.testimonial1Name"), role: t("landing.testimonial1Role"), text: t("landing.testimonial1Text"), rating: 5 },
    { name: t("landing.testimonial2Name"), role: t("landing.testimonial2Role"), text: t("landing.testimonial2Text"), rating: 5 },
    { name: t("landing.testimonial3Name"), role: t("landing.testimonial3Role"), text: t("landing.testimonial3Text"), rating: 5 },
  ];

  const PRICING = [
    {
      name: t("landing.plan1Name"),
      price: t("landing.plan1Price"),
      period: ["Free", "Zdarma", "Kostenlos"].includes(t("landing.plan1Price")) ? "" : t("landing.pricingMonthly"),
      description: t("landing.plan1Desc"),
      features: [t("landing.plan1Feature1"), t("landing.plan1Feature2"), t("landing.plan1Feature3"), t("landing.plan1Feature4")],
      cta: t("landing.plan1Cta"),
      highlighted: false,
    },
    {
      name: t("landing.plan2Name"),
      price: t("landing.plan2Price"),
      period: t("landing.pricingMonthly"),
      description: t("landing.plan2Desc"),
      features: [t("landing.plan2Feature1"), t("landing.plan2Feature2"), t("landing.plan2Feature3"), t("landing.plan2Feature4"), t("landing.plan2Feature5"), t("landing.plan2Feature6"), t("landing.plan2Feature7")],
      cta: t("landing.plan2Cta"),
      highlighted: true,
    },
    {
      name: t("landing.plan3Name"),
      price: t("landing.plan3Price"),
      period: t("landing.pricingMonthly"),
      description: t("landing.plan3Desc"),
      features: [t("landing.plan3Feature1"), t("landing.plan3Feature2"), t("landing.plan3Feature3"), t("landing.plan3Feature4"), t("landing.plan3Feature5"), t("landing.plan3Feature6")],
      cta: t("landing.plan3Cta"),
      highlighted: false,
    },
  ];

  const STATS = [
    { value: "32,000+", label: t("landing.statsLeads") },
    { value: "94%", label: t("landing.statsEnrichment") },
    { value: "12+", label: t("landing.statsIndustries") },
    { value: "<5", label: t("landing.statsTime") },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LeadGen AI</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">{t("nav.features")}</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">{t("nav.howItWorks")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
            <a href="#testimonials" className="hover:text-white transition-colors">{t("nav.testimonials")}</a>
          </div>

          {/* Desktop right side */}
          <div className="hidden md:flex items-center gap-2">
            <LanguageSwitcher variant="flags" />
            {user ? (
              <Button onClick={() => navigate("/dashboard")} size="sm" className="bg-violet-600 hover:bg-violet-700">
                {t("nav.goToDashboard")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => window.location.href = getLoginUrl()}>
                  {t("nav.login")}
                </Button>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-xs sm:text-sm whitespace-nowrap" onClick={handleCTA}>
                  {t("landing.ctaPrimary")}
                </Button>
              </>
            )}
          </div>

          {/* Mobile: language flags + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="flags" className="scale-90" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0f]/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">{t("nav.features")}</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">{t("nav.howItWorks")}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">{t("nav.pricing")}</a>
              <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-white/60 hover:text-white py-2">{t("nav.testimonials")}</a>
              <div className="pt-3 border-t border-white/5 flex flex-col gap-2">
                {user ? (
                  <Button onClick={() => { navigate("/dashboard"); setMobileMenuOpen(false); }} size="sm" className="bg-violet-600 hover:bg-violet-700 w-full">
                    {t("nav.goToDashboard")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" className="text-white/70 hover:text-white w-full justify-center" onClick={() => window.location.href = getLoginUrl()}>
                      {t("nav.login")}
                    </Button>
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 w-full" onClick={handleCTA}>
                      {t("landing.ctaPrimary")}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] sm:w-[800px] h-[300px] sm:h-[400px] bg-violet-600/20 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-4 sm:mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
            {t("landing.badge")}
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4 sm:mb-6 leading-[1.1] sm:leading-[1.05]">
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {t("landing.heroTitle")}
            </span>
          </h1>
          <p className="text-base sm:text-xl text-white/60 max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed px-2">
            {t("landing.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base font-semibold shadow-lg shadow-violet-500/25 w-full sm:w-auto"
              onClick={handleCTA}
            >
              {t("landing.ctaPrimary")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white/80 hover:bg-white/5 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base w-full sm:w-auto"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              {t("landing.ctaSecondary")}
            </Button>
          </div>
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/30">{t("landing.ctaNote")}</p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-xs sm:text-sm text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">Features</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">{t("landing.featuresTitle")}</h2>
            <p className="text-white/50 text-sm sm:text-lg max-w-2xl mx-auto">{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-white/[0.03] border-white/[0.06] hover:border-white/10 transition-all hover:bg-white/[0.05] group">
                <CardContent className="p-4 sm:p-6">
                  <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl ${f.bg} flex items-center justify-center mb-3 sm:mb-4`}>
                    <f.icon className={`w-4 sm:w-5 h-4 sm:h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-1.5 sm:mb-2 text-sm sm:text-base">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-white/50 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works — Quantum Process Diagram ── */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#060610] border-y border-white/5 relative overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[150px]" />
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-12 sm:mb-20">
            <Badge className="mb-3 sm:mb-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-mono text-[10px] sm:text-xs tracking-widest">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2 animate-pulse" />
              QUANTUM PIPELINE v3.0
            </Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">{t("landing.howTitle")}</h2>
            <p className="text-white/40 text-sm sm:text-base max-w-xl mx-auto font-light">Multi-stage AI orchestration with real-time data fusion</p>
          </div>

          {/* ── Desktop: Horizontal Pipeline ── */}
          <div className="hidden lg:block">
            {/* Connection line */}
            <div className="absolute top-[calc(50%+20px)] left-[10%] right-[10%] h-px">
              <div className="h-full bg-gradient-to-r from-violet-500/0 via-violet-500/40 to-cyan-500/0" />
              <div className="absolute inset-0 h-full bg-gradient-to-r from-violet-500/0 via-white/20 to-cyan-500/0 animate-pulse" />
            </div>

            <div className="grid grid-cols-4 gap-6 relative">
              {/* Node 1: Signal Capture */}
              <ProcessNode
                step="01"
                title={t("landing.step1Title")}
                description={t("landing.step1Desc")}
                icon={<Target className="w-5 h-5" />}
                color="violet"
                metrics={["LinkedIn API", "Web Scraping", "Intent Data"]}
                delay={0}
              />
              {/* Node 2: AI Enrichment */}
              <ProcessNode
                step="02"
                title={t("landing.step2Title")}
                description={t("landing.step2Desc")}
                icon={<Sparkles className="w-5 h-5" />}
                color="blue"
                metrics={["GPT-4 Analysis", "Email Verify", "Score: 0→100"]}
                delay={1}
              />
              {/* Node 3: Smart Routing */}
              <ProcessNode
                step="03"
                title={t("landing.step3Title")}
                description={t("landing.step3Desc")}
                icon={<Zap className="w-5 h-5" />}
                color="cyan"
                metrics={["Auto-Sequence", "A/B Testing", "Multi-Channel"]}
                delay={2}
              />
              {/* Node 4: Revenue */}
              <ProcessNode
                step="04"
                title={t("landing.step4Title")}
                description={t("landing.step4Desc")}
                icon={<TrendingUp className="w-5 h-5" />}
                color="emerald"
                metrics={["CRM Sync", "ROI Track", "Auto-Report"]}
                delay={3}
              />
            </div>
          </div>

          {/* ── Mobile: Vertical Pipeline ── */}
          <div className="lg:hidden space-y-4 relative">
            {/* Vertical connection line */}
            <div className="absolute left-6 top-8 bottom-8 w-px bg-gradient-to-b from-violet-500/40 via-cyan-500/30 to-emerald-500/40" />

            <MobileProcessNode
              step="01"
              title={t("landing.step1Title")}
              description={t("landing.step1Desc")}
              icon={<Target className="w-4 h-4" />}
              color="violet"
              metrics={["LinkedIn API", "Web Scraping", "Intent Data"]}
            />
            <MobileProcessNode
              step="02"
              title={t("landing.step2Title")}
              description={t("landing.step2Desc")}
              icon={<Sparkles className="w-4 h-4" />}
              color="blue"
              metrics={["GPT-4 Analysis", "Email Verify", "Score: 0→100"]}
            />
            <MobileProcessNode
              step="03"
              title={t("landing.step3Title")}
              description={t("landing.step3Desc")}
              icon={<Zap className="w-4 h-4" />}
              color="cyan"
              metrics={["Auto-Sequence", "A/B Testing", "Multi-Channel"]}
            />
            <MobileProcessNode
              step="04"
              title={t("landing.step4Title")}
              description={t("landing.step4Desc")}
              icon={<TrendingUp className="w-4 h-4" />}
              color="emerald"
              metrics={["CRM Sync", "ROI Track", "Auto-Report"]}
            />
          </div>

          {/* Data throughput bar */}
          <div className="mt-12 sm:mt-16 flex items-center justify-center gap-4 sm:gap-8 text-[10px] sm:text-xs font-mono text-white/25 tracking-wider">
            <span>LATENCY: &lt;200ms</span>
            <span className="hidden sm:inline">|</span>
            <span>THROUGHPUT: 10K leads/hr</span>
            <span className="hidden sm:inline">|</span>
            <span>UPTIME: 99.97%</span>
          </div>
        </div>
      </section>

      {/* ── Segment Presets ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">Industry Presets</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">Specialized for your industry</h2>
            <p className="text-white/50 text-sm sm:text-lg">Pre-configured targeting for the highest-converting B2B segments.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: Shield, label: "Insurance & Finance", color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
              { icon: Building2, label: "Real Estate", color: "from-green-500/20 to-green-600/10 border-green-500/20" },
              { icon: Users, label: "MLM & Recruitment", color: "from-purple-500/20 to-purple-600/10 border-purple-500/20" },
              { icon: Globe, label: "B2B Products", color: "from-orange-500/20 to-orange-600/10 border-orange-500/20" },
            ].map((seg) => (
              <div
                key={seg.label}
                className={`p-3 sm:p-5 rounded-xl bg-gradient-to-br ${seg.color} border flex flex-col items-center gap-2 sm:gap-3 text-center cursor-pointer hover:scale-105 transition-transform`}
                onClick={handleCTA}
              >
                <seg.icon className="w-5 sm:w-7 h-5 sm:h-7 text-white/70" />
                <span className="text-xs sm:text-sm font-semibold text-white/80">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-16 sm:py-24 px-4 sm:px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Testimonials</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">{t("landing.testimonialsTitle")}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {TESTIMONIALS.map((testimonial) => (
              <Card key={testimonial.name} className="bg-white/[0.03] border-white/[0.06]">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-0.5 mb-3 sm:mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed mb-3 sm:mb-4">"{testimonial.text}"</p>
                  <div>
                    <div className="font-semibold text-xs sm:text-sm text-white">{testimonial.name}</div>
                    <div className="text-[10px] sm:text-xs text-white/40">{testimonial.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-16">
            <Badge className="mb-3 sm:mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">Pricing</Badge>
            <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">{t("landing.pricingTitle")}</h2>
            <p className="text-white/50 text-sm sm:text-lg">{t("landing.pricingSubtitle")}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {PRICING.map((plan) => (
              <Card
                key={plan.name}
                className={`relative ${plan.highlighted
                  ? "bg-gradient-to-b from-violet-600/20 to-violet-900/10 border-violet-500/40 shadow-xl shadow-violet-500/10"
                  : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-violet-600 text-white border-0 px-3 text-xs">{t("common.mostPopular")}</Badge>
                  </div>
                )}
                <CardContent className="p-4 sm:p-6">
                  <div className="mb-4 sm:mb-6">
                    <h3 className="font-bold text-base sm:text-lg text-white mb-1">{plan.name}</h3>
                    <p className="text-xs sm:text-sm text-white/50 mb-3 sm:mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-white/40 text-xs sm:text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2 sm:space-y-2.5 mb-4 sm:mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs sm:text-sm text-white/70">
                        <CheckCircle2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full text-sm ${plan.highlighted ? "bg-violet-600 hover:bg-violet-700" : "bg-white/10 hover:bg-white/15 text-white"}`}
                    onClick={handleCTA}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black mb-3 sm:mb-4">{t("landing.ctaTitle")}</h2>
          <p className="text-white/50 text-sm sm:text-lg mb-6 sm:mb-8">{t("landing.ctaSubtitle")}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 px-8 sm:px-10 h-11 sm:h-12 text-sm sm:text-base font-semibold w-full sm:w-auto"
              onClick={handleCTA}
            >
              {t("landing.ctaButton")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 px-6 sm:px-8 h-11 sm:h-12 w-full sm:w-auto"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              {t("landing.plan3Cta")}
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 sm:gap-0 sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">LeadGen AI</span>
          </div>
          <p className="text-xs text-white/30 order-3 sm:order-2">© 2026 LeadGen AI. {t("landing.footerRights")}</p>
          <div className="flex items-center gap-3 sm:gap-4 order-2 sm:order-3 flex-wrap justify-center">
            <LanguageSwitcher variant="flags" />
            <div className="flex gap-4 sm:gap-6 text-xs text-white/30">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


// ─── Quantum Process Diagram Components ─────────────────────

function ProcessNode({
  step, title, description, icon, color, metrics, delay,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "violet" | "blue" | "cyan" | "emerald";
  metrics: string[];
  delay: number;
}) {
  const colorMap = {
    violet: {
      glow: "shadow-violet-500/20",
      border: "border-violet-500/30",
      bg: "bg-violet-500/10",
      text: "text-violet-400",
      dot: "bg-violet-400",
      ring: "ring-violet-500/20",
      metricBg: "bg-violet-500/10",
      metricText: "text-violet-300",
    },
    blue: {
      glow: "shadow-blue-500/20",
      border: "border-blue-500/30",
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      dot: "bg-blue-400",
      ring: "ring-blue-500/20",
      metricBg: "bg-blue-500/10",
      metricText: "text-blue-300",
    },
    cyan: {
      glow: "shadow-cyan-500/20",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      dot: "bg-cyan-400",
      ring: "ring-cyan-500/20",
      metricBg: "bg-cyan-500/10",
      metricText: "text-cyan-300",
    },
    emerald: {
      glow: "shadow-emerald-500/20",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
      ring: "ring-emerald-500/20",
      metricBg: "bg-emerald-500/10",
      metricText: "text-emerald-300",
    },
  };
  const c = colorMap[color];

  return (
    <div
      className={`relative group`}
      style={{ animationDelay: `${delay * 200}ms` }}
    >
      {/* Hexagonal node indicator */}
      <div className="flex justify-center mb-5">
        <div className={`relative w-14 h-14 rounded-2xl ${c.bg} ${c.border} border flex items-center justify-center shadow-lg ${c.glow} ring-1 ${c.ring}`}>
          <div className={c.text}>{icon}</div>
          {/* Pulse ring */}
          <div className={`absolute inset-0 rounded-2xl ${c.border} border animate-ping opacity-20`} />
        </div>
      </div>

      {/* Step number */}
      <div className="text-center mb-3">
        <span className={`font-mono text-[10px] tracking-[0.3em] ${c.text} opacity-60`}>STEP {step}</span>
      </div>

      {/* Content card */}
      <div className={`p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 transition-all group-hover:bg-white/[0.04]`}>
        <h3 className="font-bold text-white text-sm mb-2 text-center">{title}</h3>
        <p className="text-xs text-white/40 leading-relaxed text-center mb-4">{description}</p>

        {/* Tech metrics */}
        <div className="space-y-1.5">
          {metrics.map((m) => (
            <div key={m} className="flex items-center gap-2">
              <div className={`w-1 h-1 rounded-full ${c.dot}`} />
              <span className={`text-[10px] font-mono ${c.metricText} opacity-70`}>{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Data flow indicator */}
      <div className="flex justify-center mt-3">
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${c.metricBg}`}>
          <div className={`w-1 h-1 rounded-full ${c.dot} animate-pulse`} />
          <span className={`text-[9px] font-mono ${c.metricText} opacity-50`}>ACTIVE</span>
        </div>
      </div>
    </div>
  );
}

function MobileProcessNode({
  step, title, description, icon, color, metrics,
}: {
  step: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: "violet" | "blue" | "cyan" | "emerald";
  metrics: string[];
}) {
  const colorMap = {
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-400", dot: "bg-violet-400", metricText: "text-violet-300" },
    blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400", metricText: "text-blue-300" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-400", dot: "bg-cyan-400", metricText: "text-cyan-300" },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400", metricText: "text-emerald-300" },
  };
  const c = colorMap[color];

  return (
    <div className="flex gap-4 relative pl-2">
      {/* Node dot on the vertical line */}
      <div className="flex-shrink-0 relative z-10">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
          <div className={c.text}>{icon}</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-mono text-[9px] tracking-[0.2em] ${c.text} opacity-60`}>STEP {step}</span>
        </div>
        <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
        <p className="text-xs text-white/40 leading-relaxed mb-2">{description}</p>
        <div className="flex flex-wrap gap-1.5">
          {metrics.map((m) => (
            <span key={m} className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${c.bg} ${c.metricText} opacity-70`}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
