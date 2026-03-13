import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import {
  Zap, Shield, TrendingUp, Users, Mail, BarChart3, CheckCircle2,
  ArrowRight, Star, Building2, Target, Download, Sparkles, Globe,
  ChevronRight, Phone, MessageSquare,
} from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Lead Generation",
    description: "Generate hundreds of qualified B2B leads in minutes using LinkedIn data scraped via Apify, enriched with AI-written icebreakers tailored to each company.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Target,
    title: "Industry Segment Presets",
    description: "Pre-configured templates for Finance (insurance, mortgages, investments), Real Estate, MLM, and B2B — each with optimized prompts and targeting defaults.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Shield,
    title: "Lead Quality Rating",
    description: "Rate each lead as good or bad, log rejection reasons, and track your quality score over time. Replace bad leads with a single click.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: TrendingUp,
    title: "ROI & Deal Tracking",
    description: "Mark deals as closed, log deal values, and see your total revenue, average deal size, and close rate — all in one dashboard.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Mail,
    title: "Email Outreach Templates",
    description: "Save reusable outreach templates with smart variables ({{companyName}}, {{icebreaker}}, {{industry}}) that auto-fill with each lead's data.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members, assign leads to agents, and manage your entire sales team from one platform with role-based access control.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
];

const STEPS = [
  { number: "01", title: "Choose Your Segment", description: "Select from Finance, Real Estate, MLM, B2B, or configure a custom industry target with your preferred location and seniority level." },
  { number: "02", title: "AI Scrapes LinkedIn", description: "Our pipeline connects to LinkedIn via Apify, finds matching companies, and automatically discovers contact emails from their websites." },
  { number: "03", title: "AI Writes Icebreakers", description: "Each lead gets a unique, personalized icebreaker message written by GPT-4 based on the company's actual website content and description." },
  { number: "04", title: "Close Deals & Track ROI", description: "Manage your pipeline in Kanban view, export to CSV/Excel, use email templates, and track revenue from every closed deal." },
];

const TESTIMONIALS = [
  {
    name: "Martin Novák",
    role: "Financial Advisor, Prague",
    text: "I generate 30–40 qualified finance leads every week. The AI icebreakers are so good that my reply rate doubled in the first month.",
    rating: 5,
  },
  {
    name: "Jana Horáková",
    role: "Real Estate Broker, Brno",
    text: "The Real Estate segment preset is perfect. I get exactly the right companies in my target region, and the email templates save me hours every week.",
    rating: 5,
  },
  {
    name: "Tomáš Blažek",
    role: "B2B Sales Director",
    text: "We replaced three separate tools with this platform. LinkedIn scraping, email enrichment, CRM pipeline, and ROI tracking — all in one place.",
    rating: 5,
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for individual sales professionals",
    features: ["100 leads/month", "AI icebreakers", "CSV & JSON export", "Email templates", "Lead status tracking"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/month",
    description: "For growing sales teams",
    features: ["500 leads/month", "LinkedIn live scraping", "Email enrichment", "Kanban pipeline", "ROI tracking", "Team collaboration (5 users)", "Priority support"],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For large teams and agencies",
    features: ["Unlimited leads", "Custom segment presets", "Dedicated Apify quota", "API access", "Unlimited team members", "SLA & dedicated support", "Custom integrations"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const STATS = [
  { value: "32,000+", label: "Leads Generated" },
  { value: "94%", label: "AI Enrichment Rate" },
  { value: "30–40%", label: "Avg. Meeting Rate" },
  { value: "7 segments", label: "Industry Presets" },
];

export default function Landing() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      window.location.href = getLoginUrl();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">LeadGen AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Testimonials</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate("/dashboard")} size="sm" className="bg-violet-600 hover:bg-violet-700">
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white" onClick={() => window.location.href = getLoginUrl()}>
                  Sign In
                </Button>
                <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleCTA}>
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-24 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-5xl mx-auto text-center relative">
          <Badge className="mb-6 bg-violet-500/20 text-violet-300 border-violet-500/30 px-4 py-1.5 text-sm">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            32,000+ leads generated in 2025
          </Badge>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            The{" "}
            <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              smartest
            </span>{" "}
            B2B lead generation platform
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Generate qualified leads from LinkedIn, enrich them with verified emails and AI-written icebreakers, manage your pipeline, and track ROI — all in one platform built to outperform any agency.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 text-white px-8 h-12 text-base font-semibold shadow-lg shadow-violet-500/25"
              onClick={handleCTA}
            >
              Start Generating Leads Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white/80 hover:bg-white/5 px-8 h-12 text-base"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              See How It Works
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/30">No credit card required · First 50 leads free</p>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="py-12 px-6 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-black text-white mb-1">{s.value}</div>
              <div className="text-sm text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30">Features</Badge>
            <h2 className="text-4xl font-black mb-4">Everything you need to dominate B2B sales</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              Built to replace your entire lead generation stack — from prospecting to pipeline management to ROI reporting.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="bg-white/[0.03] border-white/[0.06] hover:border-white/10 transition-all hover:bg-white/[0.05] group">
                <CardContent className="p-6">
                  <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <h3 className="font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-500/20 text-green-300 border-green-500/30">Process</Badge>
            <h2 className="text-4xl font-black mb-4">From zero to qualified leads in minutes</h2>
            <p className="text-white/50 text-lg">Our fully automated pipeline handles every step of the lead generation process.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center">
                  <span className="text-sm font-black text-violet-400">{step.number}</span>
                </div>
                <div>
                  <h3 className="font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Segment Presets ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-orange-500/20 text-orange-300 border-orange-500/30">Industry Presets</Badge>
            <h2 className="text-4xl font-black mb-4">Specialized for your industry</h2>
            <p className="text-white/50 text-lg">Pre-configured targeting for the highest-converting B2B segments.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: "Insurance & Finance", color: "from-blue-500/20 to-blue-600/10 border-blue-500/20" },
              { icon: Building2, label: "Real Estate", color: "from-green-500/20 to-green-600/10 border-green-500/20" },
              { icon: Users, label: "MLM & Recruitment", color: "from-purple-500/20 to-purple-600/10 border-purple-500/20" },
              { icon: Globe, label: "B2B Products", color: "from-orange-500/20 to-orange-600/10 border-orange-500/20" },
            ].map((seg) => (
              <div
                key={seg.label}
                className={`p-5 rounded-xl bg-gradient-to-br ${seg.color} border flex flex-col items-center gap-3 text-center cursor-pointer hover:scale-105 transition-transform`}
                onClick={handleCTA}
              >
                <seg.icon className="w-7 h-7 text-white/70" />
                <span className="text-sm font-semibold text-white/80">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">Testimonials</Badge>
            <h2 className="text-4xl font-black mb-4">Trusted by sales professionals</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="bg-white/[0.03] border-white/[0.06]">
                <CardContent className="p-6">
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-4">"{t.text}"</p>
                  <div>
                    <div className="font-semibold text-sm text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-violet-500/20 text-violet-300 border-violet-500/30">Pricing</Badge>
            <h2 className="text-4xl font-black mb-4">Simple, transparent pricing</h2>
            <p className="text-white/50 text-lg">Start free, scale as you grow. No hidden fees.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
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
                    <Badge className="bg-violet-600 text-white border-0 px-3">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="font-bold text-lg text-white mb-1">{plan.name}</h3>
                    <p className="text-sm text-white/50 mb-4">{plan.description}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white">{plan.price}</span>
                      <span className="text-white/40 text-sm">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full ${plan.highlighted ? "bg-violet-600 hover:bg-violet-700" : "bg-white/10 hover:bg-white/15 text-white"}`}
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
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-4">Ready to generate your first leads?</h2>
          <p className="text-white/50 text-lg mb-8">Join hundreds of sales professionals who generate qualified B2B leads every day with LeadGen AI.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-violet-600 hover:bg-violet-700 px-10 h-12 text-base font-semibold"
              onClick={handleCTA}
            >
              Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white/10 text-white/70 hover:bg-white/5 px-8 h-12"
              onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-white/5 bg-white/[0.01]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">LeadGen AI</span>
          </div>
          <p className="text-xs text-white/30">© 2026 LeadGen AI. All rights reserved.</p>
          <div className="flex gap-6 text-xs text-white/30">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white/60 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
