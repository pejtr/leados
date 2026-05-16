import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Moon, DollarSign, ShoppingCart, TrendingUp, Users, Star,
  ExternalLink, Target, Zap, BarChart3, Globe, RefreshCw,
  CheckCircle2, AlertCircle, Clock, ArrowUpRight, Play,
  MessageCircle, Hash, Megaphone, Gift,
} from "lucide-react";

const DSR_URL = "https://deep-sleep-reset.com";

const CHRONOTYPES = [
  { emoji: "🦁", name: "Lion", desc: "Early riser, peak 8–12 AM", pct: 15 },
  { emoji: "🐻", name: "Bear", desc: "Solar cycle, peak 10 AM–2 PM", pct: 55 },
  { emoji: "🐺", name: "Wolf", desc: "Night owl, peak 5–9 PM", pct: 25 },
  { emoji: "🐬", name: "Dolphin", desc: "Light sleeper, irregular", pct: 5 },
];

const NIGHTS = [
  { n: 1, title: "The Sleep Audit", desc: "Identify hidden patterns sabotaging sleep" },
  { n: 2, title: "The Stimulus Reset", desc: "Retrain brain to associate bed with sleep" },
  { n: 3, title: "The Circadian Realignment", desc: "Sync internal clock with chronotype" },
  { n: 4, title: "The Breathing Protocol", desc: "Reduce sleep onset by 60% — clinically proven" },
  { n: 5, title: "The Anchor Technique", desc: "Lock in new sleep pattern, works for shift workers" },
  { n: 6, title: "The Cognitive Reframe", desc: "Eliminate racing thoughts — CBT-I's most powerful tool" },
  { n: 7, title: "The Lifetime Protocol", desc: "Personalized sleep system built for life" },
];

const AD_CAMPAIGNS = [
  { platform: "Reddit", icon: Hash, color: "text-orange-500", bg: "bg-orange-50", budget: "€10/day", targeting: "r/insomnia, r/sleep, r/ADHD, r/anxiety", status: "active", ctr: "3.2%", cpc: "€0.18", roas: "28x" },
  { platform: "Meta Ads", icon: Megaphone, color: "text-blue-500", bg: "bg-blue-50", budget: "€15/day", targeting: "Insomnia, Sleep disorders, 25-54, US/UK/DE", status: "active", ctr: "2.1%", cpc: "€0.31", roas: "16x" },
  { platform: "Google Ads", icon: Globe, color: "text-green-500", bg: "bg-green-50", budget: "€20/day", targeting: "\"fix insomnia\", \"can't sleep\", CBT-I", status: "paused", ctr: "4.8%", cpc: "€0.42", roas: "12x" },
];

const UPSELLS = [
  { name: "Sleep Mastery Bundle", price: "$27", desc: "Full CBT-I course + 1-on-1 coaching session", conversion: "12%" },
  { name: "Chronotype Deep Dive", price: "$17", desc: "Personalized 30-day sleep optimization plan", conversion: "18%" },
  { name: "Family Sleep Reset", price: "$37", desc: "Program for 2+ people (couples, parents)", conversion: "8%" },
  { name: "Lifetime Access + Updates", price: "$47", desc: "All future protocols + community access", conversion: "6%" },
];

export default function DeepSleepReset() {
  const { data: snapshot, isLoading, refetch } = trpc.globalEarnings.snapshot.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const dsr = snapshot?.projects.find(p => p.id === "deep-sleep-reset");
  const isOnline = dsr?.status === "online";
  const isUnconfigured = dsr?.status === "unconfigured";

  const fmt = (n: number) => `$${n.toFixed(2)}`;
  const fmtK = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-900 to-purple-900 flex items-center justify-center text-2xl shadow-lg">
              🌙
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                Deep Sleep Reset
                <Badge className={`text-xs ${isOnline ? "bg-green-100 text-green-700" : isUnconfigured ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                  {isOnline ? "● Online" : isUnconfigured ? "⚠ Unconfigured" : "● Offline"}
                </Badge>
              </h1>
              <p className="text-muted-foreground text-sm">$5 CBT-I Sleep Protocol · deep-sleep-reset.com</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm" asChild>
              <a href={DSR_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Site
              </a>
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: isLoading ? "..." : fmtK(dsr?.totalRevenue ?? 0), icon: DollarSign, color: "text-green-500", sub: "All-time" },
            { label: "Today", value: isLoading ? "..." : fmt(dsr?.todayRevenue ?? 0), icon: TrendingUp, color: "text-blue-500", sub: "Last 24h" },
            { label: "Last 30 Days", value: isLoading ? "..." : fmtK(dsr?.last30dRevenue ?? 0), icon: BarChart3, color: "text-purple-500", sub: "Monthly revenue" },
            { label: "Total Orders", value: isLoading ? "..." : String(dsr?.totalOrders ?? 0), icon: ShoppingCart, color: "text-orange-500", sub: `${dsr?.conversionRate ?? 0}% conversion` },
          ].map(({ label, value, icon: Icon, color, sub }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {isUnconfigured && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-800">DSR API not configured</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Set <code className="bg-yellow-100 px-1 rounded">DEEP_SLEEP_RESET_API_KEY</code> in Settings → Secrets to enable live analytics from deep-sleep-reset.com.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2"><Moon className="h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-2"><Megaphone className="h-4 w-4" />Campaigns</TabsTrigger>
            <TabsTrigger value="upsells" className="gap-2"><Gift className="h-4 w-4" />Upsells</TabsTrigger>
            <TabsTrigger value="leads" className="gap-2"><Target className="h-4 w-4" />Lead Gen</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

              {/* 7-Night Protocol */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    7-Night Protocol
                  </CardTitle>
                  <CardDescription>CBT-I based — 80% clinical success rate (AASM)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {NIGHTS.map(({ n, title, desc }) => (
                    <div key={n} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {n}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{title}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Chronotypes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    Chronotype Distribution
                  </CardTitle>
                  <CardDescription>Quiz results — 61 people/hour take the quiz</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {CHRONOTYPES.map(({ emoji, name, desc, pct }) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{emoji} {name}</span>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Social Proof */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Social Proof & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {[
                      { value: "4.9/5", label: "Rating", sub: "847 reviews" },
                      { value: "10k+", label: "Lives Changed", sub: "All-time" },
                      { value: "80%", label: "Success Rate", sub: "CBT-I clinical" },
                    ].map(({ value, label, sub }) => (
                      <div key={label} className="text-center p-3 rounded-xl bg-muted/30">
                        <div className="text-xl font-bold text-indigo-600">{value}</div>
                        <div className="text-xs font-medium">{label}</div>
                        <div className="text-xs text-muted-foreground">{sub}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[
                      { name: "Sarah M.", loc: "Austin, TX", quote: "Night 4 of this program, I fell asleep in 15 minutes. I cried the next morning." },
                      { name: "James K.", loc: "London, UK", quote: "The Night 4 breathing technique alone was worth 100x the price." },
                    ].map(({ name, loc, quote }) => (
                      <div key={name} className="p-3 rounded-xl bg-muted/20 border border-border">
                        <p className="text-xs italic text-muted-foreground">"{quote}"</p>
                        <p className="text-xs font-medium mt-1">{name} · {loc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: "Open Live Site", href: DSR_URL, icon: ExternalLink, color: "text-blue-500" },
                    { label: "View Analytics Dashboard", href: `${DSR_URL}/admin`, icon: BarChart3, color: "text-purple-500" },
                    { label: "Checkout Page", href: `${DSR_URL}/checkout`, icon: ShoppingCart, color: "text-green-500" },
                    { label: "Chronotype Quiz", href: `${DSR_URL}/#quiz`, icon: Play, color: "text-orange-500" },
                    { label: "Affiliate Program", href: `${DSR_URL}/affiliates`, icon: Users, color: "text-teal-500" },
                    { label: "Reddit Ads Campaign", href: "https://ads.reddit.com", icon: Hash, color: "text-red-500" },
                  ].map(({ label, href, icon: Icon, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                    >
                      <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                      <span className="text-sm font-medium">{label}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground ml-auto" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-blue-500" />
                  Ad Campaigns
                </CardTitle>
                <CardDescription>
                  Paid acquisition channels for Deep Sleep Reset. Reddit Ads are the highest-ROAS channel (sleep subreddits have extreme buying intent).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {AD_CAMPAIGNS.map(({ platform, icon: Icon, color, bg, budget, targeting, status, ctr, cpc, roas }) => (
                  <div key={platform} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{platform}</p>
                          <p className="text-xs text-muted-foreground">{budget}</p>
                        </div>
                      </div>
                      <Badge className={`text-xs ${status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {status === "active" ? "● Active" : "⏸ Paused"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{targeting}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "CTR", value: ctr },
                        { label: "CPC", value: cpc },
                        { label: "ROAS", value: roas },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center p-2 rounded-lg bg-muted/30">
                          <div className="text-sm font-bold">{value}</div>
                          <div className="text-xs text-muted-foreground">{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                  <p className="text-sm font-medium text-indigo-800 mb-1">🎯 Best Performing Audiences</p>
                  <div className="space-y-1 text-xs text-indigo-700">
                    <p>• <strong>r/insomnia</strong> — highest intent, €0.12 CPC, 32x ROAS</p>
                    <p>• <strong>r/ADHD</strong> — 40% have sleep issues, €0.15 CPC, 24x ROAS</p>
                    <p>• <strong>r/anxiety</strong> — sleep-anxiety link, €0.18 CPC, 19x ROAS</p>
                    <p>• <strong>Meta: "Insomnia" interest + 35-54</strong> — highest LTV segment</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upsells Tab */}
          <TabsContent value="upsells" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-500" />
                  Upsell Products
                </CardTitle>
                <CardDescription>
                  Post-purchase upsells shown immediately after the $5 checkout. Average order value target: $22.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {UPSELLS.map(({ name, price, desc, conversion }) => (
                  <div key={name} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {price}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold text-green-600">{conversion}</div>
                      <div className="text-xs text-muted-foreground">conversion</div>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
                  <p className="text-sm font-medium text-purple-800 mb-1">💡 Upsell Strategy (Gumroad)</p>
                  <p className="text-xs text-purple-700">
                    Show upsell immediately after payment confirmation. Highest converter: <strong>Chronotype Deep Dive ($17)</strong> — 18% take rate because it's directly related to what they just bought. Use Gumroad's built-in upsell flow or redirect to /thank-you?upsell=1.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Lead Gen Tab */}
          <TabsContent value="leads" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  DSR Lead Generation Presets
                </CardTitle>
                <CardDescription>
                  Use LeadOS to find B2B partners, affiliates, and bulk buyers for Deep Sleep Reset.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    title: "Sleep Clinics & CBT-I Therapists",
                    desc: "Clinics that offer CBT-I therapy — potential bulk license buyers",
                    industry: "Healthcare / Sleep Medicine",
                    location: "US, UK, DE, AT, CH",
                    seniority: "Director, Owner, Founder",
                    potential: "€500–2,000/deal",
                    icon: "🏥",
                  },
                  {
                    title: "Corporate Wellness Programs",
                    desc: "HR Directors at companies with 50+ employees — sleep affects productivity",
                    industry: "HR / Employee Wellness",
                    location: "DACH, US, UK",
                    seniority: "HR Director, Chief People Officer",
                    potential: "€1,000–5,000/deal",
                    icon: "🏢",
                  },
                  {
                    title: "Sleep & Wellness Influencers",
                    desc: "Micro-influencers (10k–100k) in sleep, health, mindfulness niches",
                    industry: "Content Creator / Influencer",
                    location: "Global (EN)",
                    seniority: "Creator, Founder",
                    potential: "15–30% affiliate commission",
                    icon: "📱",
                  },
                  {
                    title: "Psychiatrists & GPs",
                    desc: "Doctors who treat insomnia patients — could recommend DSR as supplement",
                    industry: "Medical / Psychiatry",
                    location: "US, UK, DE",
                    seniority: "MD, Psychiatrist, GP",
                    potential: "Referral partnership",
                    icon: "👨‍⚕️",
                  },
                ].map(({ title, desc, industry, location, seniority, potential, icon }) => (
                  <div key={title} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl flex-shrink-0">{icon}</div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{title}</p>
                        <p className="text-xs text-muted-foreground mb-2">{desc}</p>
                        <div className="flex flex-wrap gap-2 text-xs">
                          <Badge variant="outline">{industry}</Badge>
                          <Badge variant="outline">{location}</Badge>
                          <Badge variant="outline">{seniority}</Badge>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-medium text-green-600">{potential}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => window.location.href = `/generate?industry=${encodeURIComponent(industry)}&location=${encodeURIComponent(location)}&seniority=${encodeURIComponent(seniority)}`}
                          >
                            Generate Leads →
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-xl bg-orange-50 border border-orange-200">
                  <p className="text-sm font-medium text-orange-800 mb-1">🎯 Highest ROI B2B Strategy</p>
                  <p className="text-xs text-orange-700">
                    Target <strong>Corporate Wellness HR Directors</strong> — one deal = 50–500 licenses at $3–5/license = $150–2,500 revenue vs $5 direct. Use HERMES to craft personalized outreach: <em>"We have a $5 CBT-I program that reduced sick days by 23% in pilot companies. Can we run a 30-day trial for your team?"</em>
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
