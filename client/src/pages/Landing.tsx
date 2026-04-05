import { useState, useEffect, useRef } from "react";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import UrgencyBanner from "@/components/UrgencyBanner";
import SocialProofCounter from "@/components/SocialProofCounter";
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

// ── Color tokens ──────────────────────────────────────────────────────────────
const C = {
  bg: "#f0f4f8",
  bgAlt: "#e8eef5",
  bgCard: "#ffffff",
  bgDark: "#0d1b2a",
  teal: "#00c4b4",
  tealDark: "#009e91",
  indigo: "#5b4fe8",
  indigoDark: "#4338ca",
  violet: "#7c3aed",
  green: "#10b981",
  amber: "#f59e0b",
  text: "#0f172a",
  textMuted: "#64748b",
  textLight: "#94a3b8",
  border: "#dde4ef",
  borderStrong: "#c7d2e4",
};

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
  const scoreColor = lead.score >= 90 ? C.green : lead.score >= 75 ? C.amber : "#ef4444";

  return (
    <motion.div
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl p-4"
      style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 4px 24px rgba(0,196,180,0.10)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 rounded-full" style={{ background: C.green }} />
          <span className="text-xs font-medium" style={{ color: C.textMuted }}>New Lead Detected</span>
        </div>
        <div className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${scoreColor}18`, color: scoreColor, border: `1px solid ${scoreColor}40` }}>
          AI {lead.score}
        </div>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm text-white"
          style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, fontFamily: "'Space Grotesk', sans-serif" }}>
          {lead.name.split(" ").map(n => n[0]).join("")}
        </div>
        <div>
          <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{lead.name}</div>
          <div className="text-xs" style={{ color: C.textMuted }}>{lead.title} @ {lead.company}</div>
        </div>
        <div className="ml-auto">
          <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.indigo}12`, color: C.indigo, border: `1px solid ${C.indigo}25` }}>{lead.industry}</div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl" style={{ background: `${C.teal}0d`, border: `1px solid ${C.teal}25` }}>
        <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.teal }} />
        <span className="text-xs" style={{ color: C.textMuted }}>Signal: <span style={{ color: C.tealDark }}>{lead.signal}</span></span>
      </div>
      <div className="text-xs leading-relaxed mb-3" style={{ color: C.textMuted }}>
        <span style={{ color: C.indigo }}>✦ AI Icebreaker: </span>
        "Hi {lead.name.split(" ")[0]}, I noticed {lead.company} is scaling fast in {lead.industry}. We helped similar companies 3x their pipeline — worth a quick call?"
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: C.textLight }}>Lead Score</span>
        <div className="flex-1 h-1.5 rounded-full" style={{ background: C.bgAlt }}>
          <motion.div className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${scoreColor}, ${scoreColor}99)` }}
            initial={{ width: 0 }} animate={{ width: `${lead.score}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }} />
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

// ── Section Reveal ────────────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

// ── Atlantis Orb ──────────────────────────────────────────────────────────────
function AtlantisOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, filter: "blur(40px)" }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 6 + delay, repeat: Infinity, delay, ease: "easeInOut" }} />
  );
}

// ── Case Study Section ────────────────────────────────────────────────────────
const CASE_STUDIES = [
  { industry: "SaaS", icon: Code2, color: C.indigo, company: "TechScale s.r.o.", result: "47 qualified leads", period: "in 3 days", detail: "SaaS startup targeting Czech enterprise market. LeadOS identified decision-makers via LinkedIn signals and delivered personalized icebreakers with 28% reply rate.", metric1: "28%", metric1Label: "Reply rate", metric2: "47", metric2Label: "Leads / 3 days" },
  { industry: "Logistics", icon: Factory, color: C.teal, company: "LogiCzech a.s.", result: "+1,200 contacts", period: "in 6 months", detail: "B2B logistics provider targeting warehouse managers and procurement directors. LeadOS filtered by company size and tech stack to find ideal buyers.", metric1: "1,200+", metric1Label: "Contacts", metric2: "€340K", metric2Label: "Pipeline value" },
  { industry: "E-commerce", icon: ShoppingCart, color: C.amber, company: "ShopBoost CZ", result: "3× pipeline growth", period: "in 90 days", detail: "E-commerce agency scaling outbound. LeadOS automated prospecting for online store owners with >€500K revenue, cutting research time by 80%.", metric1: "3×", metric1Label: "Pipeline growth", metric2: "80%", metric2Label: "Less research time" },
  { industry: "Manufacturing", icon: Building2, color: C.green, company: "Průmysl Pro s.r.o.", result: "90 warm leads", period: "in 8 months", detail: "Industrial equipment supplier targeting plant managers. LeadOS identified companies with recent expansion signals and delivered context-aware outreach.", metric1: "90", metric1Label: "Warm leads", metric2: "23%", metric2Label: "Meeting rate" },
  { industry: "FinTech", icon: TrendingUp, color: "#ec4899", company: "PayFlow Praha", result: "€1.2M pipeline", period: "in 4 months", detail: "B2B payments startup targeting CFOs and finance directors. LeadOS scored leads by company revenue and tech stack compatibility.", metric1: "€1.2M", metric1Label: "Pipeline", metric2: "94", metric2Label: "Avg AI score" },
  { industry: "Healthcare", icon: Stethoscope, color: C.violet, company: "MedTech Solutions", result: "35 demo bookings", period: "in 6 weeks", detail: "Healthcare SaaS targeting hospital procurement managers. LeadOS navigated complex org structures to identify true decision-makers.", metric1: "35", metric1Label: "Demo bookings", metric2: "41%", metric2Label: "Demo-to-deal rate" },
];

function CaseStudySection({ onCTA }: { onCTA: () => void }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", ...CASE_STUDIES.map(c => c.industry)];
  const filtered = activeFilter === "All" ? CASE_STUDIES : CASE_STUDIES.filter(c => c.industry === activeFilter);

  return (
    <div>
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {filters.map(f => (
          <button key={f} onClick={() => setActiveFilter(f)}
            className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
            style={{
              background: activeFilter === f ? `linear-gradient(135deg, ${C.indigo}, ${C.teal})` : C.bgCard,
              border: activeFilter === f ? "none" : `1px solid ${C.border}`,
              color: activeFilter === f ? "white" : C.textMuted,
              boxShadow: activeFilter === f ? `0 4px 16px ${C.indigo}30` : "none",
            }}>
            {f}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeFilter} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(({ industry, icon: Icon, color, company, result, period, detail, metric1, metric1Label, metric2, metric2Label }) => (
            <motion.div key={company} whileHover={{ y: -5, scale: 1.01 }}
              className="p-5 rounded-2xl flex flex-col"
              style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: `0 2px 16px ${color}0d` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}28` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: C.textMuted }}>{industry}</span>
                </div>
                <div className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.green}14`, color: C.green, border: `1px solid ${C.green}28` }}>Verified</div>
              </div>
              <div className="font-bold text-sm mb-1" style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{company}</div>
              <div className="mb-3">
                <span className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${color}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{result}</span>
                <span className="text-sm ml-2" style={{ color: C.textLight }}>{period}</span>
              </div>
              <p className="text-xs leading-relaxed mb-4 flex-1" style={{ color: C.textMuted }}>{detail}</p>
              <div className="grid grid-cols-2 gap-3 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                <div>
                  <div className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color }}>{metric1}</div>
                  <div className="text-xs" style={{ color: C.textLight }}>{metric1Label}</div>
                </div>
                <div>
                  <div className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.teal }}>{metric2}</div>
                  <div className="text-xs" style={{ color: C.textLight }}>{metric2Label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
      <div className="text-center mt-10">
        <p className="text-sm mb-4" style={{ color: C.textMuted }}>Want results like these for your business?</p>
        <Button onClick={onCTA} style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", boxShadow: `0 4px 20px ${C.indigo}35` }}>
          Start Generating Leads <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Landing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    document.title = "LeadOS — AI-Powered B2B Lead Generation Platform";
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleCTA = () => {
    if (user) navigate("/dashboard");
    else window.location.href = getLoginUrl();
  };

  const FEATURES = [
    { icon: Zap, title: t("landing.feature1Title"), description: t("landing.feature1Desc"), color: C.amber },
    { icon: Target, title: t("landing.feature2Title"), description: t("landing.feature2Desc"), color: C.indigo },
    { icon: Shield, title: t("landing.feature3Title"), description: t("landing.feature3Desc"), color: C.green },
    { icon: TrendingUp, title: t("landing.feature4Title"), description: t("landing.feature4Desc"), color: C.violet },
    { icon: Mail, title: t("landing.feature5Title"), description: t("landing.feature5Desc"), color: "#ec4899" },
    { icon: Users, title: t("landing.feature6Title"), description: t("landing.feature6Desc"), color: "#f97316" },
    { icon: Brain, title: t("landing.feature7Title"), description: t("landing.feature7Desc"), color: C.teal },
    { icon: UserCheck, title: t("landing.feature8Title"), description: t("landing.feature8Desc"), color: "#f43f5e" },
    { icon: Lightbulb, title: t("landing.feature9Title"), description: t("landing.feature9Desc"), color: C.amber },
    { icon: Ear, title: t("landing.feature10Title"), description: t("landing.feature10Desc"), color: "#14b8a6" },
    { icon: Bot, title: t("landing.feature11Title"), description: t("landing.feature11Desc"), color: C.indigo },
    { icon: Calendar, title: "Meeting Scheduler", description: "AI follow-up bot that books meetings automatically — no manual chasing.", color: C.violet },
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
    { step: "01", icon: Target, titleKey: "landing.howStep1Title", descKey: "landing.howStep1Desc", color: C.indigo },
    { step: "02", icon: Zap, titleKey: "landing.howStep2Title", descKey: "landing.howStep2Desc", color: C.teal },
    { step: "03", icon: Mail, titleKey: "landing.howStep3Title", descKey: "landing.howStep3Desc", color: C.green },
    { step: "04", icon: TrendingUp, titleKey: "landing.howStep4Title", descKey: "landing.howStep4Desc", color: C.amber },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: C.bg, color: C.text }}>
      {/* ── Sales Conversion Components ─────────────────────────────────────── */}
      <ExitIntentPopup enabled={true} />
      {/* ── Urgency Banner ──────────────────────────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-[60]">
        <UrgencyBanner />
      </div>

      {/* ── Floating Nav ─────────────────────────────────────────────────────── */}
      <motion.nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(240,244,248,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.border}` : "1px solid transparent",
          boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, boxShadow: `0 0 16px ${C.teal}40` }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
              Lead<span style={{ background: `linear-gradient(90deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OS</span>
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-sm" style={{ color: C.textMuted }}>
            <a href="#features" className="hover:text-indigo-600 transition-colors">{t("nav.features")}</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">{t("nav.howItWorks")}</a>
            <a href="#case-studies" className="hover:text-indigo-600 transition-colors">Results</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t("nav.pricing")}</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher variant="flags" />
            {user ? (
              <Button onClick={() => navigate("/dashboard")} size="sm"
                style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", boxShadow: `0 4px 16px ${C.indigo}35` }}>
                {t("nav.goToDashboard")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCTA}
                style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", boxShadow: `0 4px 16px ${C.indigo}35` }}>
                {t("landing.ctaPrimary")} <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <LanguageSwitcher variant="flags" className="scale-90" />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg" style={{ background: C.bgCard, border: `1px solid ${C.border}` }}>
              {mobileMenuOpen ? <X className="w-5 h-5" style={{ color: C.text }} /> : <Menu className="w-5 h-5" style={{ color: C.text }} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t" style={{ borderColor: C.border, background: "rgba(240,244,248,0.97)", backdropFilter: "blur(20px)" }}>
              <div className="px-4 py-4 space-y-3">
                {["features", "how-it-works", "pricing"].map(id => (
                  <a key={id} href={`#${id}`} onClick={() => setMobileMenuOpen(false)} className="block text-sm py-2" style={{ color: C.textMuted }}>
                    {id === "features" ? t("nav.features") : id === "how-it-works" ? t("nav.howItWorks") : t("nav.pricing")}
                  </a>
                ))}
                <div className="pt-3" style={{ borderTop: `1px solid ${C.border}` }}>
                  <Button size="sm" className="w-full" onClick={() => { handleCTA(); setMobileMenuOpen(false); }}
                    style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none" }}>
                    {t("landing.ctaPrimary")}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ background: `linear-gradient(160deg, #e8f0fe 0%, #f0f4f8 40%, #e6faf8 100%)` }}>
        {/* Atlantis orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AtlantisOrb x="10%" y="15%" size={500} color={`${C.teal}28`} delay={0} />
          <AtlantisOrb x="65%" y="5%" size={600} color={`${C.indigo}1e`} delay={2} />
          <AtlantisOrb x="80%" y="55%" size={400} color={`${C.teal}20`} delay={4} />
          {/* ── Atlantis grid — výrazné linie ── */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${C.teal}30 1px, transparent 1px), linear-gradient(90deg, ${C.teal}30 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }} />
          {/* Tečky na průsečících */}
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle, ${C.teal}45 1.5px, transparent 1.5px)`,
            backgroundSize: "64px 64px",
            backgroundPosition: "0px 0px",
          }} />

          {/* ── Donut rings — velký dekorativní kruh ── */}
          {/* Outer ring */}
          <div className="absolute" style={{
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(1080px, 150vw)", height: "min(1080px, 150vw)",
            borderRadius: "50%",
            border: `1px solid ${C.teal}18`,
            pointerEvents: "none",
          }} />
          {/* Main donut ring */}
          <div className="absolute" style={{
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(860px, 120vw)", height: "min(860px, 120vw)",
            borderRadius: "50%",
            border: `2px solid ${C.teal}35`,
            boxShadow: `0 0 40px ${C.teal}12, inset 0 0 40px ${C.teal}06`,
            pointerEvents: "none",
          }} />
          {/* Inner ring */}
          <div className="absolute" style={{
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(640px, 90vw)", height: "min(640px, 90vw)",
            borderRadius: "50%",
            border: `1px solid ${C.indigo}28`,
            pointerEvents: "none",
          }} />
          {/* Innermost ring */}
          <div className="absolute" style={{
            left: "50%", top: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(420px, 60vw)", height: "min(420px, 60vw)",
            borderRadius: "50%",
            border: `1px dashed ${C.teal}22`,
            pointerEvents: "none",
          }} />
          {/* Donut arc glow — rotating arc highlight */}
          <motion.div
            className="absolute"
            style={{
              left: "50%", top: "50%",
              marginLeft: "calc(min(860px, 120vw) / -2)",
              marginTop: "calc(min(860px, 120vw) / -2)",
              width: "min(860px, 120vw)", height: "min(860px, 120vw)",
              borderRadius: "50%",
              background: `conic-gradient(from 0deg, transparent 0deg, ${C.teal}28 45deg, ${C.indigo}22 90deg, transparent 135deg, transparent 360deg)`,
              pointerEvents: "none",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
          {/* Second counter-rotating arc — slower, opposite direction */}
          <motion.div
            className="absolute"
            style={{
              left: "50%", top: "50%",
              marginLeft: "calc(min(860px, 120vw) / -2)",
              marginTop: "calc(min(860px, 120vw) / -2)",
              width: "min(860px, 120vw)", height: "min(860px, 120vw)",
              borderRadius: "50%",
              background: `conic-gradient(from 180deg, transparent 0deg, ${C.indigo}14 30deg, ${C.teal}10 60deg, transparent 90deg, transparent 360deg)`,
              pointerEvents: "none",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          />

          {/* Hexagonal Ancient tech pattern — top right */}
          <svg className="absolute top-0 right-0 w-96 h-96 opacity-[0.07]" viewBox="0 0 400 400" fill="none">
            {[0, 1, 2, 3].map(row => [0, 1, 2, 3].map(col => {
              const x = col * 80 + (row % 2) * 40;
              const y = row * 70;
              return <polygon key={`${row}-${col}`} points={`${x+40},${y} ${x+80},${y+20} ${x+80},${y+60} ${x+40},${y+80} ${x},${y+60} ${x},${y+20}`} stroke={C.teal} strokeWidth="1" />;
            }))}
          </svg>
        </div>

        <motion.div style={{ y: heroY, opacity: heroOpacity }}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left text */}
          <div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-6 text-xs font-medium px-4 py-1.5"
                style={{ background: `${C.teal}14`, border: `1px solid ${C.teal}35`, color: C.tealDark }}>
                <Sparkles className="w-3 h-3 mr-1.5" />
                AI-Powered B2B Lead Generation
              </Badge>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
              Lead<span style={{ background: `linear-gradient(135deg, ${C.indigo} 0%, ${C.teal} 60%, ${C.green} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>OS</span><br />
              <span style={{ color: C.textMuted, fontSize: "0.58em", fontWeight: 600 }}>LeadGen CRM Automation</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg sm:text-xl max-w-xl mb-10 leading-relaxed" style={{ color: C.textMuted }}>
              {t("landing.heroSubtitle") || "LeadOS finds, enriches, and personalizes outreach to your ideal B2B customers — fully automated, GDPR compliant, and ready in minutes."}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 justify-start items-start mb-12">
              <Button onClick={handleCTA} size="lg" className="h-13 px-8 text-base font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", boxShadow: `0 8px 30px ${C.indigo}40`, height: "52px" }}>
                {t("landing.ctaPrimary") || "Start Generating Leads"} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline" size="lg" className="h-13 px-8 text-base"
                style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, height: "52px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <Play className="w-4 h-4 mr-2" style={{ color: C.indigo }} />
                {t("landing.ctaSecondary") || "How does it work?"}
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap justify-start items-center gap-6 text-sm" style={{ color: C.textMuted }}>
              {[
                { icon: CheckCircle2, text: "No credit card required", color: C.green },
                { icon: Shield, text: "GDPR Compliant", color: C.indigo },
                { icon: Rocket, text: "Setup in 2 minutes", color: C.teal },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                  <span>{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Animated Lead Card */}
          <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block w-full max-w-sm mx-auto">
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl mb-3"
              style={{ background: `${C.green}12`, border: `1px solid ${C.green}28`, backdropFilter: "blur(12px)" }}>
              <Bell className="w-4 h-4 flex-shrink-0" style={{ color: C.green }} />
              <div>
                <div className="text-xs font-semibold" style={{ color: C.green }}>New qualified lead!</div>
                <div className="text-xs" style={{ color: C.textMuted }}>AI score 94 · SaaS · Prague</div>
              </div>
            </motion.div>
            <AnimatedLeadCard />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}
              className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: "Leads today", value: "47", color: C.indigo },
                { label: "Avg score", value: "87%", color: C.teal },
                { label: "Replies", value: "23%", color: C.green },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center px-2 py-2 rounded-xl"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="text-sm font-bold" style={{ color, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
                  <div className="text-xs" style={{ color: C.textLight }}>{label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="w-6 h-10 rounded-full border flex items-start justify-center pt-2" style={{ borderColor: `${C.teal}50` }}>
            <motion.div className="w-1.5 h-2.5 rounded-full" style={{ background: C.teal }}
              animate={{ y: [0, 12, 0] }} transition={{ duration: 2, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 relative" style={{ background: C.bgCard, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 relative">
          {[
            { value: 32000, suffix: "+", label: t("landing.statsLeads") || "Leads Generated" },
            { value: 94, suffix: "%", label: t("landing.statsEnrichment") || "Enrichment Rate" },
            { value: 12, suffix: "+", label: t("landing.statsIndustries") || "Industries" },
            { value: 5, suffix: "min", label: t("landing.statsTime") || "Avg. Setup Time" },
          ].map(({ value, suffix, label }, i) => (
            <Reveal key={label} delay={i * 0.1}>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-black mb-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  <AnimatedCounter value={value} suffix={suffix} />
                </div>
                <div className="text-sm" style={{ color: C.textMuted }}>{label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Social Proof Live Counter ─────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6" style={{ background: C.bgDark }}>
        <div className="max-w-5xl mx-auto">
          <SocialProofCounter />
        </div>
      </section>
      {/* ── How It Works ─────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6" style={{ background: C.bg }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.teal}12`, border: `1px solid ${C.teal}30`, color: C.tealDark }}>
                {t("nav.howItWorks") || "How It Works"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                {t("landing.howSectionTitle")}{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {t("landing.howSectionTitleHighlight")}
                </span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: C.textMuted }}>{t("landing.howSectionSubtitle")}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map(({ step, icon: Icon, titleKey, descKey, color }, i) => (
              <Reveal key={step} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6, scale: 1.02 }}
                  className="relative p-6 rounded-2xl h-full"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
                  <div className="text-6xl font-black mb-4 leading-none"
                    style={{ color: `${color}14`, fontFamily: "'Space Grotesk', sans-serif" }}>{step}</div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${color}14`, border: `1px solid ${color}30` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>{t(titleKey)}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>{t(descKey)}</p>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 z-10">
                      <ChevronRight className="w-5 h-5" style={{ color: `${C.teal}60` }} />
                    </div>
                  )}
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Case Studies ─────────────────────────────────────────────────────── */}
      <section id="case-studies" className="py-24 px-4 sm:px-6" style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-12">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.green}12`, border: `1px solid ${C.green}30`, color: "#059669" }}>
                Real Results
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                Proven Results Across{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Every Industry</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: C.textMuted }}>
                Filter by your industry to see how LeadOS performs for businesses like yours.
              </p>
            </div>
          </Reveal>
          <CaseStudySection onCTA={handleCTA} />
        </div>
      </section>

      {/* ── Lead Quality Standard ────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 relative" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto relative">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.indigo}10`, border: `1px solid ${C.indigo}28`, color: C.indigo }}>
                Lead Quality Standard
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                What Makes a{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LeadOS Lead?</span>
              </h2>
              <p className="text-lg max-w-2xl mx-auto" style={{ color: C.textMuted }}>
                Not all leads are equal. LeadOS only delivers leads that meet strict quality criteria — so your sales team spends time closing, not chasing.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <Reveal>
              <div className="space-y-4">
                {[
                  { icon: BadgeCheck, color: C.green, title: "AI Score ≥ 70", desc: "Every lead is scored by our AI on 12 signals including intent, company fit, and decision-maker authority. Only high-probability leads pass." },
                  { icon: Mail, color: C.teal, title: "Verified Contact Data", desc: "Email, LinkedIn, phone — all verified before delivery. Zero bounced emails, zero wasted outreach." },
                  { icon: Activity, color: C.indigo, title: "Behavioral Signal Detected", desc: "Leads show real buying intent: visited pricing page, downloaded content, searched for your solution, or engaged with competitors." },
                  { icon: MessageSquare, color: C.amber, title: "Personalized AI Icebreaker", desc: "Each lead comes with a custom opening message written by AI — referencing their company, role, and recent activity." },
                  { icon: Target, color: "#ec4899", title: "ICP Match Confirmed", desc: "Filtered against your Ideal Customer Profile: industry, company size, geography, tech stack, and seniority level." },
                ].map(({ icon: Icon, color, title, desc }, i) => (
                  <Reveal key={title} delay={i * 0.08}>
                    <div className="flex gap-4 p-4 rounded-2xl"
                      style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                        <Icon className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>{title}</div>
                        <div className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 rounded-3xl" style={{ background: `radial-gradient(ellipse at center, ${C.teal}18 0%, transparent 70%)`, filter: "blur(30px)" }} />
                <div className="relative rounded-3xl p-6"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: `0 8px 40px ${C.teal}14` }}>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: C.green }} />
                      <span className="text-xs font-semibold" style={{ color: C.textMuted }}>LeadOS Quality Report</span>
                    </div>
                    <div className="text-xs px-2.5 py-1 rounded-full font-bold"
                      style={{ background: `${C.green}14`, color: C.green, border: `1px solid ${C.green}28` }}>
                      ✓ Qualified
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-5 pb-5" style={{ borderBottom: `1px solid ${C.border}` }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg text-white"
                      style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, fontFamily: "'Space Grotesk', sans-serif" }}>JN</div>
                    <div className="flex-1">
                      <div className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>Jan Novák</div>
                      <div className="text-sm" style={{ color: C.textMuted }}>CEO @ TechCorp s.r.o.</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.indigo}12`, color: C.indigo }}>SaaS</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.teal}10`, color: C.tealDark }}>Prague</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${C.green}10`, color: C.green }}>50-200 emp.</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold" style={{ color: C.textMuted }}>AI Lead Score</span>
                      <span className="text-2xl font-black"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${C.green}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>94 / 100</span>
                    </div>
                    <div className="h-3 rounded-full overflow-hidden" style={{ background: C.bgAlt }}>
                      <motion.div className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${C.indigo}, ${C.teal}, ${C.green})` }}
                        initial={{ width: 0 }} whileInView={{ width: "94%" }} viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }} />
                    </div>
                  </div>
                  <div className="space-y-2 mb-5">
                    {["Email verified", "ICP match: SaaS CEO, 50-200 emp.", "Signal: Visited pricing page 3×", "LinkedIn profile active", "Decision-maker authority"].map(label => (
                      <div key={label} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: C.green }} />
                        <span className="text-xs" style={{ color: C.textMuted }}>{label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl" style={{ background: `${C.indigo}08`, border: `1px solid ${C.indigo}18` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-3.5 h-3.5" style={{ color: C.indigo }} />
                      <span className="text-xs font-semibold" style={{ color: C.indigo }}>AI-Generated Icebreaker</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
                      "Hi Jan, I noticed TechCorp has been growing rapidly in the Czech SaaS market. We've helped 3 similar companies in Prague reduce their lead acquisition cost by 60% using AI outreach. Worth a 15-min call this week?"
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" className="h-7 text-xs px-3 text-white"
                        style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none" }}>
                        Copy & Send <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                      <span className="text-xs" style={{ color: C.textLight }}>or edit in 1 click</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6" style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.indigo}10`, border: `1px solid ${C.indigo}28`, color: C.indigo }}>
                {t("nav.features") || "Features"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                Everything You Need to{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Dominate</span> Your Market
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description, color }, i) => (
              <Reveal key={title} delay={i * 0.05}>
                <motion.div whileHover={{ y: -4, scale: 1.01 }}
                  className="p-5 rounded-2xl h-full group cursor-default"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
                      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1.5" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>{title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{description}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.amber}14`, border: `1px solid ${C.amber}30`, color: "#b45309" }}>
                Customer Stories
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                Trusted by{" "}
                <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sales Leaders</span>
              </h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, role, text, rating, metric, metricLabel }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <div className="p-6 rounded-2xl h-full flex flex-col"
                  style={{ background: C.bgCard, border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-current" style={{ color: C.amber }} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: C.textMuted }}>"{text}"</p>
                  <div className="flex items-center justify-between pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
                    <div>
                      <div className="font-semibold text-sm" style={{ color: C.text, fontFamily: "'Space Grotesk', sans-serif" }}>{name}</div>
                      <div className="text-xs" style={{ color: C.textLight }}>{role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{metric}</div>
                      <div className="text-xs" style={{ color: C.textLight }}>{metricLabel}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4 sm:px-6" style={{ background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <Badge className="mb-4 text-xs px-3 py-1"
                style={{ background: `${C.green}12`, border: `1px solid ${C.green}30`, color: "#059669" }}>
                {t("nav.pricing") || "Pricing"}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-black mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
                {t("landing.pricingTitle") || "Simple, Transparent Pricing"}
              </h2>
              <p className="text-lg" style={{ color: C.textMuted }}>{t("landing.pricingSubtitle") || "Start free. Scale as you grow."}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING.map(({ name, price, period, description, features, cta, highlighted }, i) => (
              <Reveal key={name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6 }} className="p-6 rounded-2xl relative"
                  style={{
                    background: highlighted ? `linear-gradient(160deg, ${C.indigo}0d, ${C.teal}0a)` : C.bgCard,
                    border: highlighted ? `1px solid ${C.indigo}35` : `1px solid ${C.border}`,
                    boxShadow: highlighted ? `0 8px 40px ${C.indigo}18` : "0 2px 8px rgba(0,0,0,0.04)",
                  }}>
                  {highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="text-xs px-3 py-0.5 text-white"
                        style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none" }}>
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="mb-6">
                    <h3 className="font-bold text-base mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>{name}</h3>
                    <div className="flex items-end gap-1 mb-2">
                      <span className="text-4xl font-black"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", background: highlighted ? `linear-gradient(135deg, ${C.indigo}, ${C.teal})` : "none", WebkitBackgroundClip: highlighted ? "text" : "unset", WebkitTextFillColor: highlighted ? "transparent" : C.text }}>{price}</span>
                      {period && <span className="text-sm mb-1.5" style={{ color: C.textLight }}>/{period}</span>}
                    </div>
                    <p className="text-xs" style={{ color: C.textMuted }}>{description}</p>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: highlighted ? C.indigo : C.green }} />
                        <span style={{ color: C.textMuted }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={handleCTA} className="w-full h-10 font-semibold"
                    style={highlighted ? { background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", color: "white", boxShadow: `0 4px 20px ${C.indigo}35` } : { background: C.bg, border: `1px solid ${C.border}`, color: C.text }}>
                    {cta} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </motion.div>
              </Reveal>
            ))}
          </div>

          {/* Competitor Comparison */}
          <Reveal>
            <div className="mt-20">
              <div className="text-center mb-10">
                <h3 className="text-2xl font-black mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>How LeadOS Compares</h3>
                <p className="text-sm" style={{ color: C.textMuted }}>vs. HubSpot, Apollo.io &amp; Salesforce</p>
              </div>
              <div className="overflow-x-auto rounded-2xl" style={{ border: `1px solid ${C.border}`, boxShadow: "0 2px 16px rgba(0,0,0,0.04)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: `${C.indigo}08`, borderBottom: `1px solid ${C.border}` }}>
                      <th className="text-left px-5 py-4 font-semibold" style={{ color: C.textMuted, width: "28%" }}>Feature</th>
                      <th className="px-5 py-4 font-bold text-center" style={{ background: `${C.indigo}06` }}>
                        <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontFamily: "'Space Grotesk', sans-serif" }}>LeadOS</span>
                      </th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: C.textMuted }}>HubSpot</th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: C.textMuted }}>Apollo.io</th>
                      <th className="px-5 py-4 font-semibold text-center" style={{ color: C.textMuted }}>Salesforce</th>
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
                      <tr key={String(feature)} style={{ borderBottom: `1px solid ${C.border}`, background: ri % 2 === 0 ? `${C.indigo}03` : "transparent" }}>
                        <td className="px-5 py-3.5 font-medium" style={{ color: C.text }}>{feature}</td>
                        {[leados, hubspot, apollo, salesforce].map((val, ci) => (
                          <td key={ci} className="px-5 py-3.5 text-center" style={{ background: ci === 0 ? `${C.indigo}04` : "transparent" }}>
                            {typeof val === "boolean" ? (
                              val ? <span style={{ color: ci === 0 ? C.indigo : C.green, fontSize: 18 }}>✓</span>
                                : <span style={{ color: C.textLight, fontSize: 18 }}>✗</span>
                            ) : (
                              <span className="text-xs font-semibold" style={{ color: ci === 0 ? C.indigo : C.textMuted }}>{val}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-center text-xs mt-4" style={{ color: C.textLight }}>Prices as of Q1 2026. Feature availability based on publicly available information.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────────── */}
      <section className="py-32 px-4 sm:px-6 relative overflow-hidden"
        style={{ background: `linear-gradient(160deg, #e8f0fe 0%, #e6faf8 100%)`, borderTop: `1px solid ${C.border}` }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <AtlantisOrb x="20%" y="20%" size={400} color={`${C.teal}20`} delay={0} />
          <AtlantisOrb x="60%" y="40%" size={500} color={`${C.indigo}18`} delay={3} />
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(${C.teal}08 1px, transparent 1px), linear-gradient(90deg, ${C.teal}08 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }} />
        </div>
        <div className="max-w-3xl mx-auto text-center relative">
          <Reveal>
            <motion.div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
              style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, boxShadow: `0 8px 40px ${C.teal}40` }}
              animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }}>
              <Rocket className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
              Ready to{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal}, ${C.green})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>10x Your Pipeline?</span>
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: C.textMuted }}>
              Join thousands of sales teams who generate qualified B2B leads in minutes, not weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleCTA} size="lg" className="h-14 px-10 text-base font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, border: "none", boxShadow: `0 8px 40px ${C.indigo}40` }}>
                {t("landing.ctaPrimary") || "Start Free Today"} <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                variant="outline" size="lg" className="h-14 px-8 text-base"
                style={{ background: C.bgCard, border: `1px solid ${C.border}`, color: C.text, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                See All Features <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <p className="mt-6 text-sm" style={{ color: C.textLight }}>
              No credit card required · GDPR compliant · Cancel anytime
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="pt-16 pb-10 px-4 sm:px-6" style={{ borderTop: `1px solid ${C.border}`, background: C.bgCard }}>
        <div className="max-w-6xl mx-auto text-center mb-12">
          <h3 className="text-3xl sm:text-4xl font-black mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>
            Build trust.{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Close deals.</span>
          </h3>
          <p className="text-sm" style={{ color: C.textMuted }}>The AI-powered platform that turns cold prospects into warm conversations.</p>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ borderTop: `1px solid ${C.border}`, paddingTop: "2rem" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.teal})` }}>
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: C.text }}>LeadOS</span>
          </div>
          <div className="flex items-center gap-6 text-sm" style={{ color: C.textMuted }}>
            <a href="#features" className="hover:text-indigo-600 transition-colors">{t("nav.features")}</a>
            <a href="#case-studies" className="hover:text-indigo-600 transition-colors">Results</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">{t("nav.pricing")}</a>
            <span>© 2026 LeadOS — crmleadsystem.com</span>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: C.textLight }}>
            <Shield className="w-3.5 h-3.5" style={{ color: C.green }} />
            <span>GDPR Compliant</span>
            <Globe className="w-3.5 h-3.5 ml-2" style={{ color: C.indigo }} />
            <span>SOC 2 Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
