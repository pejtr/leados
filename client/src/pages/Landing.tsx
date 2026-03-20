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
  Bell, Building2, Factory, ShoppingCart, Code2, Stethoscope,
  TrendingDown, Activity, BadgeCheck, Flame, Play,
} from "lucide-react";

// ── Animated Lead Card Demo ──────────────────────────────────────────────────
function AnimatedLeadCard() {
  const leads = [
    { name: "Jan Novák", title: "CEO", company: "TechCorp s.r.o.", score: 94, industry: "SaaS", signal: "Visited pricing page 3x" },
    { name: "Petra Dvořák", title: "Head of Sales", company: "Logistika CZ", score: 87, industry: "Logistics", signal: "Downloaded case study" },
    { name: "Martin Kříž", title: "CTO", company: "FinTech Praha", score: 91, industry: "FinTech", signal: "LinkedIn profile viewed" },
    { name: "Eva Horáčková", title: "VP Marketing", company: "E-shop Pro", score: 78, industry: "E-commerce", signal: "Opened email sequence" },
  ];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIdx(prev => (prev + 1) % leads.length);
        setIsVisible(true);
      }, 400);
    }, 3200);
    return () => clearInterval(interval);
  }, []);

  const lead = leads[currentIdx];
  const scoreColor = lead.score >= 90 ? "#10b981" : lead.score >= 75 ? "#f59e0b" : "#ef4444";

  return (
    <motion.div
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(139,92,246,0.25)", backdropFilter: "blur(12px)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full"
            style={{ background: "#10b981" }}
          />
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>New Lead Detected</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${scoreColor}20`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>
            AI {lead.score}
          </div>
        </div>
      </div>
      {/* Lead info */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", fontFamily: "'Space Grotesk', sans-serif" }}>
          {lead.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{lead.name}</div>
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{lead.title} @ {lead.company}</div>
        </div>
        <div className="ml-auto">
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>{lead.industry}</div>
        </div>
      </div>
      {/* AI Signal */}
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.15)" }}>
        <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#06b6d4" }} />
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Signal: <span style={{ color: "#06b6d4" }}>{lead.signal}</span></span>
      </div>
      {/* AI Icebreaker */}
      <div className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>
        <span style={{ color: "#a78bfa" }}>✦ AI Icebreaker: </span>
        "Hi {lead.name.split(" ")[0]}, I noticed {lead.company} is scaling fast in {lead.industry}. We helped similar companies 3x their pipeline — worth a quick call?"
      </div>
      {/* Score bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>Lead Score</span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }}
            initial={{ width: 0 }}
            animate={{ width: `${lead.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="text-xs font-bold" style={{ color: scoreColor }}>{lead.score}%</span>
      </div>
    </motion.div>
  );
}

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

// ── Case Study Section with Industry Filters ────────────────────────────────
const CASE_STUDIES = [
  { industry: "SaaS", icon: Code2, color: "#8b5cf6", company: "TechScale s.r.o.", result: "47 qualified leads", period: "in 3 days", detail: "SaaS startup targeting Czech enterprise market. LeadOS identified decision-makers via LinkedIn signals and delivered personalized icebreakers with 28% reply rate.", metric1: "28%", metric1Label: "Reply rate", metric2: "47", metric2Label: "Leads / 3 days" },
  { industry: "Logistics", icon: Factory, color: "#06b6d4", company: "LogiCzech a.s.", result: "+1,200 contacts", period: "in 6 months", detail: "B2B logistics provider targeting warehouse managers and procurement directors. LeadOS filtered by company size and tech stack to find ideal buyers.", metric1: "1,200+", metric1Label: "Contacts", metric2: "€340K", metric2Label: "Pipeline value" },
  { industry: "E-commerce", icon: ShoppingCart, color: "#f59e0b", company: "ShopBoost CZ", result: "3× pipeline growth", period: "in 90 days", detail: "E-commerce agency scaling outbound. LeadOS automated prospecting for online store owners with >€500K revenue, cutting research time by 80%.", metric1: "3×", metric1Label: "Pipeline growth", metric2: "80%", metric2Label: "Less research time" },
  { industry: "Manufacturing", icon: Building2, color: "#10b981", company: "Průmysl Pro s.r.o.", result: "90 warm leads", period: "in 8 months", detail: "Industrial equipment supplier targeting plant managers. LeadOS identified companies with recent expansion signals and delivered context-aware outreach.", metric1: "90", metric1Label: "Warm leads", metric2: "23%", metric2Label: "Meeting rate" },
  { industry: "FinTech", icon: TrendingUp, color: "#ec4899", company: "PayFlow Praha", result: "€1.2M pipeline", period: "in 4 months", detail: "B2B payments startup targeting CFOs and finance directors. LeadOS scored leads by company revenue and tech stack compatibility.", metric1: "€1.2M", metric1Label: "Pipeline", metric2: "94", metric2Label: "Avg AI score" },
  { industry: "Healthcare", icon: Stethoscope, color: "#a78bfa", company: "MedTech Solutions", result: "35 demo bookings", period: "in 6 weeks", detail: "Healthcare SaaS targeting hospital procurement managers. LeadOS navigated complex org structures to identify true decision-makers.", metric1: "35", metric1Label: "Demo bookings", metric2: "41%", metric2Label: "Demo-to-deal rate" },
];

function CaseStudySection({ onCTA }: { onCTA: () => void }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", ...CASE_STUDIES.map(c => c.industry)];
  const filtered = activeFilter === "All" ? CASE_STUDIES : CASE_STUDIES.filter(c => c.industry === activeFilter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: activeFilter === f ? "linear-gradient(135deg, #8b5cf6, #06b6d4)" : "rgba(255,255,255,0.05)",
              border: activeFilter === f ? "none" : "1px solid rgba(255,255,255,0.1)",
              color: activeFilter === f ? "white" : "rgba(255,255,255,0.55)",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Case study cards */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeFilter}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {filtered.map(({ industry, icon: Icon, color, company, result, period, detail, metric1, metric1Label, metric2, metric2Label }) => (
            <motion.div
              key={company}
              whileHover={{ y: -5, scale: 1.01 }}
              className="p-5 rounded-2xl flex flex-col"
              style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${color}25` }}
            >
              {/* Top */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>{industry}</span>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>Verified</div>
              </div>
              {/* Company */}
              <div className="font-bold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{company}</div>
              {/* Result headline */}
              <div className="mb-3">
                <span className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${color}, #06b6d4)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{result}</span>
                <span className="text-sm ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>{period}</span>
              </div>
              {/* Detail */}
              <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>{detail}</p>
              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <div className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>{metric1}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{metric1Label}</div>
                </div>
                <div>
                  <div className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#06b6d4" }}>{metric2}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{metric2Label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* CTA below */}
      <div className="text-center mt-10">
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>Want results like these for your business?</p>
        <Button onClick={onCTA} style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
          Start Generating Leads <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
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
    { step: "01", icon: Target, titleKey: "landing.howStep1Title", descKey: "landing.howStep1Desc", color: "#8b5cf6" },
    { step: "02", icon: Zap, titleKey: "landing.howStep2Title", descKey: "landing.howStep2Desc", color: "#06b6d4" },
    { step: "03", icon: Mail, titleKey: "landing.howStep3Title", descKey: "landing.howStep3Desc", color: "#10b981" },
    { step: "04", icon: TrendingUp, titleKey: "landing.howStep4Title", descKey: "landing.howStep4Desc", color: "#f59e0b" },
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
            <a href="#case-studies" className="hover:text-white transition-colors">Results</a>
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
            <Button onClick={handleCTA} size="lg" className="h-13 px-8 text-base font-bold" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none", boxShadow: "0 0 30px rgba(139,92,246,0.35)", height: "52px" }}>
              {t("landing.ctaPrimary") || "Start Generating Leads"} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} variant="outline" size="lg" className="h-13 px-8 text-base" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.15)", color: "white", height: "52px" }}>
              <Play className="w-4 h-4 mr-2" style={{ color: "#8b5cf6" }} />
              {t("landing.ctaSecondary") || "How does it work?"}
            </Button>
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

        {/* Animated Lead Card — floating right side on desktop */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="hidden xl:block absolute right-16 top-1/2 -translate-y-1/2 w-80 z-20"
        >
          {/* Notification pop */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3"
            style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", backdropFilter: "blur(12px)" }}
          >
            <Bell className="w-4 h-4 flex-shrink-0" style={{ color: "#10b981" }} />
            <div>
              <div className="text-xs font-semibold" style={{ color: "#10b981" }}>New qualified lead!</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>AI score 94 · SaaS · Prague</div>
            </div>
          </motion.div>
          <AnimatedLeadCard />
          {/* Stats below card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="grid grid-cols-3 gap-2 mt-3"
          >
            {[
              { label: "Leads today", value: "47", color: "#8b5cf6" },
              { label: "Avg score", value: "87%", color: "#06b6d4" },
              { label: "Replies", value: "23%", color: "#10b981" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center px-2 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-sm font-bold" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</div>
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
                {t("landing.howSectionTitle")} <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{t("landing.howSectionTitleHighlight")}</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("landing.howSectionSubtitle")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, titleKey, descKey, color }, i) => (
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
                  <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{t(titleKey)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>{t(descKey)}</p>
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

      {/* ── Case Studies with Industry Filters ─────────────────────────────── */}
      <section id="case-studies" className="py-24 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <Badge className="mb-4 text-xs px-3 py-1 border" style={{ background: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.3)", color: "#10b981" }}>
                Real Results
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Proven Results Across{" "}
                <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Every Industry</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                Filter by your industry to see how LeadOS performs for businesses like yours.
              </p>
            </div>
          </Reveal>

          <CaseStudySection onCTA={handleCTA} />
        </div>
      </section>

      {/* ── What is a LeadOS Lead? ────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full" style={{ background: "radial-gradient(ellipse, rgba(139,92,246,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
        </div>
        <div className="max-w-6xl mx-auto relative">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1 border" style={{ background: "rgba(139,92,246,0.1)", borderColor: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                Lead Quality Standard
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                What Makes a{" "}
                <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LeadOS Lead?</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                Not all leads are equal. LeadOS only delivers leads that meet strict quality criteria — so your sales team spends time closing, not chasing.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: criteria */}
            <Reveal>
              <div className="space-y-4">
                {[
                  { icon: BadgeCheck, color: "#10b981", title: "AI Score ≥ 70", desc: "Every lead is scored by our AI on 12 signals including intent, company fit, and decision-maker authority. Only high-probability leads pass." },
                  { icon: Mail, color: "#06b6d4", title: "Verified Contact Data", desc: "Email, LinkedIn, phone — all verified before delivery. Zero bounced emails, zero wasted outreach." },
                  { icon: Activity, color: "#8b5cf6", title: "Behavioral Signal Detected", desc: "Leads show real buying intent: visited pricing page, downloaded content, searched for your solution, or engaged with competitors." },
                  { icon: MessageSquare, color: "#f59e0b", title: "Personalized AI Icebreaker", desc: "Each lead comes with a custom opening message written by AI — referencing their company, role, and recent activity. Ready to send in one click." },
                  { icon: Target, color: "#ec4899", title: "ICP Match Confirmed", desc: "Filtered against your Ideal Customer Profile: industry, company size, geography, tech stack, and seniority level." },
                ].map(({ icon: Icon, color, title, desc }, i) => (
                  <Reveal key={title} delay={i * 0.08}>
                    <div className="flex gap-4 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            {/* Right: live lead card example */}
            <Reveal delay={0.2}>
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(139,92,246,0.15) 0%, transparent 70%)", filter: "blur(30px)" }} />
                <div className="relative rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(139,92,246,0.2)" }}>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: "#10b981" }} />
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>LeadOS Quality Report</span>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(16,185,129,0.15)", color: "#10b981", border: "1px solid rgba(16,185,129,0.3)" }}>
                      ✓ Qualified
                    </div>
                  </div>

                  {/* Lead profile */}
                  <div className="flex items-center gap-4 mb-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", fontFamily: "'Space Grotesk', sans-serif" }}>JN</div>
                    <div className="flex-1">
                      <div className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Jan Novák</div>
                      <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>CEO @ TechCorp s.r.o.</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa" }}>SaaS</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(6,182,212,0.12)", color: "#06b6d4" }}>Prague</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>50-200 emp.</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Score gauge */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>AI Lead Score</span>
                      <span className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: "linear-gradient(135deg, #10b981, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>94 / 100</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981)" }}
                        initial={{ width: 0 }}
                        whileInView={{ width: "94%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs mt-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                      <span>0</span><span>50</span><span>100</span>
                    </div>
                  </div>

                  {/* Quality checks */}
                  <div className="space-y-2 mb-5">
                    {[
                      { label: "Email verified", ok: true },
                      { label: "ICP match: SaaS CEO, 50-200 emp.", ok: true },
                      { label: "Signal: Visited pricing page 3×", ok: true },
                      { label: "LinkedIn profile active", ok: true },
                      { label: "Decision-maker authority", ok: true },
                    ].map(({ label, ok }) => (
                      <div key={label} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: ok ? "#10b981" : "#ef4444" }} />
                        <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Icebreaker */}
                  <div className="p-4 rounded-xl" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
                      <span className="text-xs font-semibold" style={{ color: "#a78bfa" }}>AI-Generated Icebreaker</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                      "Hi Jan, I noticed TechCorp has been growing rapidly in the Czech SaaS market. We've helped 3 similar companies in Prague reduce their lead acquisition cost by 60% using AI outreach. Worth a 15-min call this week?"
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" className="h-7 text-xs px-3" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", border: "none" }}>
                        Copy & Send <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>or edit in 1 click</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
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

          {/* ── Competitor Comparison Table ── */}
          <Reveal>
            <div className="mt-20">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  How LeadOS Compares
                </h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>vs. HubSpot, Apollo.io &amp; Salesforce</p>
              </div>
              <div className="overflow-x-auto rounded-2xl" style={{ border: "1px solid rgba(139,92,246,0.2)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(139,92,246,0.08)", borderBottom: "1px solid rgba(139,92,246,0.2)" }}>
                      <th className="text-left px-5 py-4 font-semibold" style={{ color: "rgba(255,255,255,0.5)", width: "28%" }}>Feature</th>
                      <th className="px-5 py-4 font-bold text-center" style={{ fontFamily: "'Space Grotesk', sans-serif", background: "rgba(139,92,246,0.12)" }}>
                        <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LeadOS</span>
                      </th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: "rgba(255,255,255,0.45)" }}>HubSpot</th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: "rgba(255,255,255,0.45)" }}>Apollo.io</th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: "rgba(255,255,255,0.45)" }}>Salesforce</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["AI Lead Generation", true, false, true, false],
                      ["CRM Pipeline", true, true, false, true],
                      ["Email Sequences", true, true, true, true],
                      ["AI Follow-up Bot", true, false, false, false],
                      ["33 AI Expert Advisors", true, false, false, false],
                      ["Predictive Lead Scoring", true, false, true, true],
                      ["Call Intelligence", true, false, false, true],
                      ["LinkedIn Scraping", true, false, true, false],
                      ["Starting Price", "Free", "€45/mo", "€39/mo", "€75/mo"],
                    ].map(([feature, leados, hubspot, apollo, salesforce], ri) => (
                      <tr key={String(feature)} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: ri % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent" }}>
                        <td className="px-5 py-3.5 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>{feature}</td>
                        {[leados, hubspot, apollo, salesforce].map((val, ci) => (
                          <td key={ci} className="px-5 py-3.5 text-center" style={{ background: ci === 0 ? "rgba(139,92,246,0.05)" : "transparent" }}>
                            {typeof val === "boolean" ? (
                              val
                                ? <span style={{ color: ci === 0 ? "#8b5cf6" : "#10b981", fontSize: 18 }}>✓</span>
                                : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 18 }}>✗</span>
                            ) : (
                              <span className="text-xs font-semibold" style={{ color: ci === 0 ? "#a78bfa" : "rgba(255,255,255,0.5)" }}>{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>Prices as of Q1 2026. Feature availability based on publicly available information.</p>
            </div>
          </Reveal>
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

       {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="pt-16 pb-10 px-4 sm:px-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", background: "rgba(5,5,16,0.95)" }}>
        {/* Footer tagline */}
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Build trust.{" "}
            <span style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Close deals.</span>
          </h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>The AI-powered platform that turns cold prospects into warm conversations.</p>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "2rem" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #06b6d4)" }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>LeadOS</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
            <a href="#features" className="hover:text-white transition-colors">{t("nav.features")}</a>
            <a href="#case-studies" className="hover:text-white transition-colors">Results</a>
            <a href="#pricing" className="hover:text-white transition-colors">{t("nav.pricing")}</a>
            <span>© 2026 LeadOS — crmleadsystem.com</span>
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
