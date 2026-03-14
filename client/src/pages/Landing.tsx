import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from "react-i18next";
import {
  Zap, Shield, TrendingUp, Users, Mail, BarChart3, CheckCircle2,
  ArrowRight, Star, Target, Sparkles, Globe,
  ChevronRight, MessageSquare, UserCheck, Lightbulb, Ear, Bot,
  Menu, X, Rocket, Brain, Calendar, Phone, Award,
} from "lucide-react";

// ── Animated Counter ──────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isInView, value]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ── Floating Particle ─────────────────────────────────────────────────────────
function Particle({ delay, x, y, size }: { delay: number; x: number; y: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-violet-400/20 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2], scale: [1, 1.2, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

// ── Section Reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    document.title = "LeadGen CRM Automation — B2B Lead Generation Platform";
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = () => {
    if (user) navigate("/dashboard");
    else window.location.href = getLoginUrl();
  };

  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i, delay: i * 0.4,
    x: Math.random() * 100, y: Math.random() * 100,
    size: 4 + Math.random() * 8,
  }));

  const FEATURES = [
    { icon: Zap, title: t("landing.feature1Title"), description: t("landing.feature1Desc"), color: "#f59e0b", glow: "rgba(245,158,11,0.15)" },
    { icon: Target, title: t("landing.feature2Title"), description: t("landing.feature2Desc"), color: "#3b82f6", glow: "rgba(59,130,246,0.15)" },
    { icon: Shield, title: t("landing.feature3Title"), description: t("landing.feature3Desc"), color: "#10b981", glow: "rgba(16,185,129,0.15)" },
    { icon: TrendingUp, title: t("landing.feature4Title"), description: t("landing.feature4Desc"), color: "#8b5cf6", glow: "rgba(139,92,246,0.15)" },
    { icon: Mail, title: t("landing.feature5Title"), description: t("landing.feature5Desc"), color: "#ec4899", glow: "rgba(236,72,153,0.15)" },
    { icon: Users, title: t("landing.feature6Title"), description: t("landing.feature6Desc"), color: "#f97316", glow: "rgba(249,115,22,0.15)" },
    { icon: Brain, title: t("landing.feature7Title"), description: t("landing.feature7Desc"), color: "#06b6d4", glow: "rgba(6,182,212,0.15)" },
    { icon: UserCheck, title: t("landing.feature8Title"), description: t("landing.feature8Desc"), color: "#f43f5e", glow: "rgba(244,63,94,0.15)" },
    { icon: Lightbulb, title: t("landing.feature9Title"), description: t("landing.feature9Desc"), color: "#fbbf24", glow: "rgba(251,191,36,0.15)" },
    { icon: Ear, title: t("landing.feature10Title"), description: t("landing.feature10Desc"), color: "#14b8a6", glow: "rgba(20,184,166,0.15)" },
    { icon: Bot, title: t("landing.feature11Title"), description: t("landing.feature11Desc"), color: "#6366f1", glow: "rgba(99,102,241,0.15)" },
    { icon: Calendar, title: "Meeting Scheduler", description: "AI follow-up bot that books meetings automatically — no manual chasing.", color: "#a78bfa", glow: "rgba(167,139,250,0.15)" },
  ];

  const TESTIMONIALS = [
    { name: t("landing.testimonial1Name"), role: t("landing.testimonial1Role"), text: t("landing.testimonial1Text"), rating: 5, metric: t("landing.testimonialMetric1"), metricLabel: t("landing.testimonialMetricLabel1") },
    { name: t("landing.testimonial2Name"), role: t("landing.testimonial2Role"), text: t("landing.testimonial2Text"), rating: 5, metric: t("landing.testimonialMetric2"), metricLabel: t("landing.testimonialMetricLabel2") },
    { name: t("landing.testimonial3Name"), role: t("landing.testimonial3Role"), text: t("landing.testimonial3Text"), rating: 5, metric: t("landing.testimonialMetric3"), metricLabel: t("landing.testimonialMetricLabel3") },
  ];

  const PRICING = [
    { name: t("landing.plan1Name"), price: t("landing.plan1Price"), period: "", description: t("landing.plan1Desc"), features: [t("landing.plan1Feature1"), t("landing.plan1Feature2"), t("landing.plan1Feature3"), t("landing.plan1Feature4")], cta: t("landing.plan1Cta"), highlighted: false },
    { name: t("landing.plan2Name"), price: t("landing.plan2Price"), period: t("landing.pricingMonthly"), description: t("landing.plan2Desc"), features: [t("landing.plan2Feature1"), t("landing.plan2Feature2"), t("landing.plan2Feature3"), t("landing.plan2Feature4"), t("landing.plan2Feature5"), t("landing.plan2Feature6"), t("landing.plan2Feature7")], cta: t("landing.plan2Cta"), highlighted: true },
    { name: t("landing.plan3Name"), price: t("landing.plan3Price"), period: t("landing.pricingMonthly"), description: t("landing.plan3Desc"), features: [t("landing.plan3Feature1"), t("landing.plan3Feature2"), t("landing.plan3Feature3"), t("landing.plan3Feature4"), t("landing.plan3Feature5"), t("landing.plan3Feature6")], cta: t("landing.plan3Cta"), highlighted: false },
  ];

  const HOW_IT_WORKS = [
    { step: "01", icon: Target, title: "Define Your ICP", desc: "Tell the AI your ideal customer profile — industry, company size, seniority, tech stack.", color: "#8b5cf6" },
    { step: "02", icon: Zap, title: "AI Generates Leads", desc: "Our AI scrapes, enriches, and verifies 50–500 leads in under 5 minutes.", color: "#06b6d4" },
    { step: "03", icon: Mail, title: "Personalized Outreach", desc: "AI writes unique icebreakers for each lead and launches multi-channel sequences.", color: "#10b981" },
    { step: "04", icon: TrendingUp, title: "Close More Deals", desc: "Track pipeline, score leads, and let the AI advisor coach you to close faster.", color: "#f59e0b" },
  ];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: "#050510" }}>

      {/* ── Floating Nav ─────────────────────────────────────────────────────── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(5,5,16,0.85)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(139,92,246,0.15)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Lead<span style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OS</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            <a href="#features" className="hover:text-white transition-colors">{t("nav.features")}</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">{t("nav.howItWorks")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="flags" />
            {user ? (
              <Button onClick={() => navigate("/dashboard")} size="sm" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                {t("nav.goToDashboard")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCTA} style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                {t("landing.ctaPrimary")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="flags" className="scale-90" />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t" style={{ borderColor: "rgba(139,92,246,0.15)", background: "rgba(5,5,16,0.95)", backdropFilter: "blur(20px)" }}
            >
              <div className="px-4 py-4 space-y-3">
                {["features", "how-it-works", "pricing"].map(id => (
                  <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm py-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                    {id === "features" ? t("nav.features") : id === "how-it-works" ? t("nav.howItWorks") : t("nav.pricing")}
                  </a>
                ))}
                <div className="pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <Button size="sm" className="w-full" onClick={() => { handleCTA(); setMobileMenuOpen(false); }} style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                    {t("landing.ctaPrimary")}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" style={{ background: "#050510" }}>
        {/* Queen of Leads hero image — right side */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute right-0 top-0 bottom-0 w-full md:w-[55%]" style={{
            backgroundImage: "url('https://d2xsxph8kpxj0f.cloudfront.net/310419663032296198/KYtwaRBAJcsE9tGSZfVrb7/queen-of-leads-hero-dpYdMDaUjtRRh3bRvzqxtN.webp')",
            backgroundSize: "cover",
            backgroundPosition: "center top",
            maskImage: "linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
            opacity: 0.75,
          }} />
          {/* Dark overlay to keep text readable */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(5,5,16,1) 0%, rgba(5,5,16,0.85) 40%, rgba(5,5,16,0.2) 70%, transparent 100%)" }} />
        </div>
        {/* Animated gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute rounded-full"
            style={{ width: 700, height: 700, top: "10%", left: "50%", x: "-50%", background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)", filter: "blur(40px)" }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 500, height: 500, top: "30%", left: "10%", background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)", filter: "blur(60px)" }}
            animate={{ scale: [1, 1.2, 1], x: [0, 40, 0], opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{ width: 400, height: 400, top: "20%", right: "10%", background: "radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)", filter: "blur(60px)" }}
            animate={{ scale: [1, 1.3, 1], x: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
          {/* Particles */}
          {particles.map(p => <Particle key={p.id} {...p} />)}
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 md:pl-16 text-left md:max-w-[55%] md:ml-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Badge className="mb-6 text-xs font-medium px-4 py-1.5 border" style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
              <Sparkles className="w-3 h-3 mr-1.5" />
              AI-Powered B2B Lead Generation
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Lead<span style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 50%, #10b981 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OS</span><br />
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.65em", fontWeight: 600 }}>LeadGen CRM Automation</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg sm:text-xl max-w-xl mb-10 leading-relaxed"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            {t("landing.heroSubtitle") || "LeadOS — LeadGen CRM Automation finds, enriches, and personalizes outreach to your ideal B2B customers — fully automated, GDPR compliant, and ready in minutes."}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 justify-start items-start mb-12"
          >
            <div className="flex w-full sm:w-auto">
              <input
                type="email" placeholder="your@company.com" value={email} onChange={e => setEmail(e.target.value)}
                className="flex-1 sm:w-72 h-12 px-4 rounded-l-xl text-sm outline-none"
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(139,92,246,0.3)", borderRight: "none", color: "white" }}
              />
              <Button onClick={handleCTA} className="h-12 px-6 rounded-l-none rounded-r-xl font-semibold whitespace-nowrap" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                {t("landing.ctaPrimary") || "Start Free"} <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </motion.div>

          {/* Social proof row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-wrap justify-start items-center gap-6 text-sm"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {[
              { icon: CheckCircle2, text: "No credit card required", color: "#10b981" },
              { icon: Shield, text: "GDPR Compliant", color: "#3b82f6" },
              { icon: Rocket, text: "Setup in 2 minutes", color: "#8b5cf6" },
            ].map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span>{text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border flex items-start justify-center pt-2" style={{ borderColor: "rgba(139,92,246,0.3)" }}>
            <motion.div className="w-1.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }} animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ── Animated Stats Bar ───────────────────────────────────────────────── */}
      <section className="py-16 px-4 relative" style={{ borderTop: "1px solid rgba(139,92,246,0.1)", borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.04), rgba(6,182,212,0.04), rgba(139,92,246,0.04))" }} />
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          {[
            { value: 32000, suffix: "+", label: t("landing.statsLeads") || "Leads Generated" },
            { value: 94, suffix: "%", label: t("landing.statsEnrichment") || "Enrichment Rate" },
            { value: 12, suffix: "+", label: t("landing.statsIndustries") || "Industries" },
            { value: 5, suffix: "min", label: t("landing.statsTime") || "Avg. Setup Time" },
          ].map(({ value, suffix, label }, i) => (
            <Reveal key={label} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <div className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1 border" style={{ background: "rgba(6,182,212,0.1)", borderColor: "rgba(6,182,212,0.3)", color: "#06b6d4" }}>
                {t("nav.howItWorks") || "How It Works"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                From Zero to Pipeline in <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>4 Steps</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                No complex setup. No data science degree required. Just results.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, title, desc, color }, i) => (
              <Reveal key={step} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="relative p-6 rounded-2xl h-full"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="text-6xl font-black mb-4 leading-none" style={{ color: "rgba(255,255,255,0.04)", fontFamily: "'Space Grotesk', sans-serif" }}>{step}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                      <ChevronRight className="w-5 h-5" style={{ color: "rgba(139,92,246,0.4)" }} />
                    </div>
                  )}
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.06) 0%, transparent 70%)", filter: "blur(40px)" }} />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1 border" style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                {t("nav.features") || "Features"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Everything You Need to <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dominate</span> Your Market
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color, glow }, i) => (
              <Reveal key={title} delay={i * 0.05}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  className="p-5 rounded-2xl h-full group cursor-default"
                  style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110" style={{ background: glow, border: `1px solid ${color}30` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{description}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("landing.testimonialsTitle") || "Trusted by"} <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sales Leaders</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating, metric, metricLabel }, i) => (
              <Reveal key={name} delay={i * 0.12}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="p-6 rounded-2xl h-full flex flex-col"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed flex-1 mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>"{text}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{metric}</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{metricLabel}</div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px]" style={{ background: "radial-gradient(ellipse, rgba(6,182,212,0.08) 0%, transparent 70%)", filter: "blur(40px)" }} />
        </div>
        <div className="max-w-5xl mx-auto relative">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1 border" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}>
                {t("nav.pricing") || "Pricing"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {t("landing.pricingTitle") || "Simple, Transparent Pricing"}
              </h2>
              <p className="text-lg" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("landing.pricingSubtitle") || "Start free. Scale as you grow."}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING.map(({ name, price, period, description, features, cta, highlighted }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -6 }}
                  className="p-6 rounded-2xl relative"
                  style={{
                    background: highlighted ? "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))" : "rgba(255,255,255,0.03)",
                    border: highlighted ? "1px solid rgba(139,92,246,0.4)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="text-xs px-3 py-0.5" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none", color: "white" }}>
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{name}</h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: highlighted ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "none", WebkitBackgroundClip: highlighted ? "text" : "unset", WebkitTextFillColor: highlighted ? "transparent" : "white" }}>{price}</span>
                      {period && <span className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>/{period}</span>}
                    </div>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: highlighted ? "#8b5cf6" : "#10b981" }} />
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleCTA} className="w-full h-10 font-semibold" style={highlighted ? { background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "white" }}>
                    {cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 60%)" }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <div className="absolute inset-0" style={{
            backgroundImage: "linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <Reveal>
            <motion.div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Rocket className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready to <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>10x Your Pipeline?</span>
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
              Join thousands of sales teams who generate qualified B2B leads in minutes, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleCTA} size="lg" className="h-14 px-10 text-base font-bold" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none", boxShadow: "0 0 40px rgba(139,92,246,0.4)" }}>
                {t("landing.ctaPrimary") || "Start Free Today"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })} variant="outline" size="lg" className="h-14 px-8 text-base" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "white" }}>
                See All Features <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <p className="mt-6 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No credit card required · GDPR compliant · Cancel anytime
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>LeadGen CRM Automation</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            <a href="#features" className="hover:text-white transition-colors">{t("nav.features")}</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
            <span>© 2025 LeadGen CRM Automation</span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
            <Shield className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
            <span>GDPR Compliant</span>
            <Globe className="w-3.5 h-3.5 ml-2" style={{ color: "#3b82f6" }} />
            <span>SOC 2 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
