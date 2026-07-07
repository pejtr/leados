import { useState, useEffect, useRef, type ReactNode } from "react";
import { motion, useInView, animate, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, ArrowRight, Menu, X, ChevronDown, Star, Globe, BarChart3, Shield, TrendingUp, MessageSquare, LayoutDashboard, Bot, Calendar, Users, Megaphone, ShoppingBag, Sparkles, Gavel, Database, Rocket, Coffee, Scissors, Wrench, Dumbbell, Building2, Stethoscope, GraduationCap, Zap, Scale, Plane, Heart } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SalesChatWidget } from "@/components/SalesChatWidget";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { trackSklikConversion } from "@/lib/sklik";

// ─── Data ────────────────────────────────────────────────────────────────────

const niches = [
  { icon: Coffee, label: "Kavárny & restaurace", desc: "Rezervace, menu online, věrnostní program", color: "from-amber-500/20 to-orange-500/10", iconColor: "text-amber-600" },
  { icon: Scissors, label: "Kadeřnictví & salony", desc: "Online booking, galerie prací, recenze", color: "from-pink-500/20 to-rose-500/10", iconColor: "text-pink-600" },
  { icon: Wrench, label: "Elektrikáři & řemeslníci", desc: "Poptávkový formulář, reference, ceník", color: "from-yellow-500/20 to-amber-500/10", iconColor: "text-amber-600" },
  { icon: Dumbbell, label: "Fitness & wellness", desc: "Rozvrh hodin, členství, lektoři", color: "from-green-500/20 to-emerald-500/10", iconColor: "text-emerald-600" },
  { icon: Building2, label: "Reality & pronájmy", desc: "Katalog nemovitostí, kontaktní formulář", color: "from-blue-500/20 to-cyan-500/10", iconColor: "text-blue-600" },
  { icon: Stethoscope, label: "Lékaři & kliniky", desc: "Objednávkový systém, tým, ceník výkonů", color: "from-teal-500/20 to-cyan-500/10", iconColor: "text-teal-600" },
  { icon: GraduationCap, label: "Vzdělávání & kurzy", desc: "Přihlašování na kurzy, platby, certifikáty", color: "from-purple-500/20 to-violet-500/10", iconColor: "text-violet-600" },
  { icon: ShoppingBag, label: "E-shopy & obchody", desc: "Produktový katalog, košík, platební brána", color: "from-indigo-500/20 to-blue-500/10", iconColor: "text-indigo-600" },
];

const caseStudies = [
  {
    tag: "Kavárna", tagColor: "bg-amber-100 text-amber-800",
    title: "Kavárna Espresso Praha: +47% rezervací za 6 týdnů",
    desc: "Majitelka kavárny neměla web. Po spuštění nového webu s online rezervacemi přišlo za první měsíc 89 nových zákazníků přímo přes web.",
    metric: "+47%", metricLabel: "více rezervací",
    author: "Petra Svobodová", role: "Majitelka, Kavárna Espresso",
    quote: "Web nám přinesl zákazníky, které bychom jinak nikdy nezískali. Vrátil se nám za 3 týdny.",
  },
  {
    tag: "Řemeslník", tagColor: "bg-blue-100 text-blue-800",
    title: "Elektrikář Novák: 3× více poptávek bez reklamy",
    desc: "Pan Novák fungoval jen na doporučení. Nový web s poptávkovým formulářem a SEO mu přinesl 3× více zakázek — bez jediné koruny do reklamy.",
    metric: "3×", metricLabel: "více zakázek",
    author: "Jiří Novák", role: "OSVČ elektrikář, Praha",
    quote: "Investice 9 900 Kč se mi vrátila z první zakázky. Teď mám práci na 3 měsíce dopředu.",
  },
  {
    tag: "Salon", tagColor: "bg-pink-100 text-pink-800",
    title: "Beauty Salon Monika: Plný diář bez telefonátů",
    desc: "Kadeřnice Monika trávila hodiny denně přijímáním rezervací po telefonu. Po zavedení online bookingu se tento čas zkrátil na nulu.",
    metric: "0h", metricLabel: "ztracených telefonáty",
    author: "Monika Králová", role: "Majitelka, Beauty Salon Monika",
    quote: "Zákaznice si rezervují samy, já se mohu věnovat práci. Přesně to jsem potřebovala.",
  },
];

const testimonials = [
  { name: "Tomáš Veselý", role: "Majitel, Autoservis Veselý", text: "Za 4 dny jsme měli hotový web. Profesionální přístup, férová cena. Doporučuji každému živnostníkovi.", stars: 5, initial: "T" },
  { name: "Jana Procházková", role: "Ředitelka, Jazyková škola Lingua", text: "Přihlašování na kurzy přes web nám ušetřilo hodiny administrativy týdně. Skvělá investice.", stars: 5, initial: "J" },
  { name: "Martin Blažek", role: "OSVČ, Malíř pokojů", text: "Myslel jsem, že web pro malíře nepotřebuji. Teď mi přináší 5–8 poptávek měsíčně.", stars: 5, initial: "M" },
  { name: "Lucie Horáková", role: "Majitelka, Dětský koutek Sluníčko", text: "Krásný web, rychlá komunikace, vše jak bylo domluveno. Přesně takový partner jsem hledala.", stars: 5, initial: "L" },
];

const faqs = [
  { q: "Jak dlouho trvá vytvoření webu?", a: "Standardně 1–2 týdny od schválení návrhu. U složitějších projektů (e-shop, automatizace) 2–4 týdny. Vždy vám dáme přesný harmonogram předem." },
  { q: "Platím celou částku předem?", a: "Ne. Platíte pouze 30% zálohu po schválení návrhu. Zbývajících 70% hradíte až po spuštění webu, když jste spokojeni s výsledkem." },
  { q: "Co je zahrnuto v měsíčním poplatku 179 Kč?", a: "Hosting, SSL certifikát, zálohy, technická podpora a drobné úpravy obsahu. Žádné skryté poplatky." },
  { q: "Mohu web kdykoliv upravit?", a: "Ano. Máte přístup do administrace a můžete upravovat texty, fotky a obsah sami. Nebo nám napište — drobné úpravy jsou v ceně provozu." },
  { q: "Co je ONYX OS a potřebuji ho?", a: "ONYX OS je naše platforma pro automatizaci obchodu — automatické emaily, scoring leadů, CRM integrace. Hodí se firmám, které chtějí růst bez přijímání dalších lidí." },
  { q: "Děláte weby i pro firmy mimo Prahu?", a: "Ano, pracujeme plně online. Máme klienty po celé ČR i v zahraničí. Vše řešíme přes video hovory a email." },
];

const packages = [
  {
    name: "ONYX OS Audit",
    price: "4 900",
    monthly: "0",
    priceNote: "jednorázově",
    proKomu: "první konkrétní diagnóza vašeho webu",
    color: "border-slate-200",
    badge: null,
    isMonthlyOnly: false,
    highlight: false,
    features: [
      "Analýza 5 klíčových konverzních bodů",
      "Audit speed, mobilní UX a formulářů",
      "Přehledný PDF report s prioritami",
      "3 konkrétní ztráty + doporučení opravy",
      "Konzultace výsledků (30 min) v ceně",
      "Platí jako záloha při přechodu na Setup"
    ],
    cta: "Objednat audit",
    ctaHref: "/audit-zdarma",
  },
  {
    name: "ONYX OS Setup",
    price: "29 900",
    monthly: "0",
    priceNote: "jednorázově",
    proKohu: "firmy připravené na systematický růst",
    proKomu: "web + CRM + automatizace",
    color: "border-violet-500 border-2",
    badge: "Nejpopulárnější",
    isMonthlyOnly: false,
    highlight: true,
    features: [
      "Kompletní web na míru (5–15 podstránek)",
      "Poptávkový formulář napojený do ONYX CRM",
      "Automatický follow-up a e-mail sekvence",
      "Google Analytics + Meta Pixel integrace",
      "SEO základ + nastavení měření konverzí",
      "Předání reportu výsledků po 30 dnech"
    ],
    cta: "Poptat Setup",
    ctaHref: null,
  },
  {
    name: "ONYX OS Monitoring",
    price: "1 999",
    monthly: "0",
    priceNote: "za měsíc",
    proKomu: "trvalý dohled, data a optimalizace",
    color: "border-slate-200",
    badge: "Pasivní příjem",
    isMonthlyOnly: true,
    highlight: false,
    features: [
      "Měsíční report výkonu webu a leadů",
      "A/B testování landing pages a CTA",
      "Automatické follow-up sekvence v CRM",
      "Prioritní podpora a drobné úpravy",
      "Doporučení pro zlepšení konverzního poměru",
      "Správa hostingu, SSL a záloh"
    ],
    cta: "Aktivovat Monitoring",
    ctaHref: null,
  },
];

// ─── Motion helpers ───────────────────────────────────────────────────────────
// Sdílený jazyk animací napříč celou stránkou — scroll-reveal + stagger,
// stejný princip jako v hero a DNA sekci. Drží web živý bez ohrožení čitelnosti.

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </motion.div>
  );
}

function StaggerGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Interactive Demo Flow Component ───
function InteractiveDemoFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const steps = [
    {
      title: "1. Návštěvník",
      desc: "Zákazník přijde na váš nový rychlý web (mobilní i desktop verze).",
      detail: "Hledá služby a vidí jasnou přidanou hodnotu bez brandového šumu.",
      color: "border-blue-500 bg-blue-50/50 text-blue-800",
      activeColor: "bg-blue-600 text-white shadow-blue-200"
    },
    {
      title: "2. Formulář",
      desc: "Vyplní jednoduchý poptávkový formulář nebo přihlášku.",
      detail: "Formulář je optimalizovaný pro vysoký konverzní poměr (minimální tření).",
      color: "border-cyan-500 bg-cyan-50/50 text-cyan-800",
      activeColor: "bg-cyan-600 text-white shadow-cyan-200"
    },
    {
      title: "3. CRM evidence",
      desc: "Poptávka ihned zapisuje data do integrovaného CRM v ONYX OS.",
      detail: "Žádné ztracené e-maily nebo chaos. Vše vidíte přehledně v jedné tabulce.",
      color: "border-violet-500 bg-violet-50/50 text-violet-800",
      activeColor: "bg-violet-600 text-white shadow-violet-200"
    },
    {
      title: "4. E-mail follow-up",
      desc: "Systém automaticky odešle klientovi uvítací e-mail nebo nabídku.",
      detail: "Do 30 sekund dostane přehledný e-mail a vy dostanete upozornění na nový lead.",
      color: "border-pink-500 bg-pink-50/50 text-pink-800",
      activeColor: "bg-pink-600 text-white shadow-pink-200"
    },
    {
      title: "5. Výkonový report",
      desc: "Statistika okamžitě propisuje konverzi do dashboardu.",
      detail: "Vy přesně vidíte, kolik poptávek přišlo z jakého zdroje a jaký je výkon vašeho webu.",
      color: "border-emerald-500 bg-emerald-50/50 text-emerald-805",
      activeColor: "bg-emerald-600 text-white shadow-emerald-250"
    }
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center mb-12">
          <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
            Jak to funguje
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3 mb-4">
            Cesta zákazníka systémem ONYX OS
          </h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
            Klikněte na jednotlivé kroky a sledujte, jak data putují od prvního kliknutí až po automatické zapsání do CRM.
          </p>
        </Reveal>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Steps selector */}
          <div className="lg:col-span-5 space-y-3">
            {steps.map((s, idx) => (
              <button
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 ${activeStep === idx
                  ? `${s.activeColor} border-transparent scale-[1.02] font-semibold text-white shadow-lg`
                  : "border-slate-200 hover:border-slate-355 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm bg-violet-100 text-violet-700 ${activeStep === idx ? 'bg-white/20 text-white border border-white/25' : ''}`}>
                  {idx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide uppercase">{s.title}</h3>
                  <p className={`text-xs mt-1 leading-relaxed ${activeStep === idx ? "text-white/80" : "text-slate-500"}`}>
                    {s.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Visualizing dashboard/mockup area */}
          <div className="lg:col-span-7 bg-slate-950 rounded-3xl p-6 border border-slate-800 text-white min-h-[350px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.1),transparent_50%)]" />

            {/* Topbar of simulation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4 z-10">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-slate-550 ml-2 font-mono">simulation_onyx_os.bin</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-300 font-semibold uppercase tracking-wider">
                {steps[activeStep].title}
              </span>
            </div>

            {/* Displaying view depending on step */}
            <div className="flex-1 flex flex-col justify-center items-center py-6 z-10">
              {activeStep === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
                  <div className="w-16 h-16 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl animate-pulse">
                    👥
                  </div>
                  <h4 className="font-bold text-base text-white mb-2">Příchozí návštěvník</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-normal">
                    Potenciální zákazník přistane na vašem novém rychlém webu. Vše je strukturováno bez brandového šumu a šablon.
                  </p>
                </motion.div>
              )}

              {activeStep === 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-white mb-3 flex items-center gap-1">📝 Kontaktní formulář</h4>
                  <div className="space-y-2">
                    <div className="h-7 bg-slate-800 rounded px-2 text-[10px] flex items-center text-slate-400">Jméno: Petr Matěj</div>
                    <div className="h-7 bg-slate-800 rounded px-2 text-[10px] flex items-center text-slate-400">E-mail: petr.matej@email.cz</div>
                    <div className="h-7 bg-slate-800 rounded px-2 text-[10px] flex items-center text-slate-400">Cíl: Získat návrh zdarma</div>
                    <div className="h-8 bg-violet-600 rounded flex items-center justify-center text-xs font-bold text-white cursor-pointer select-none">
                      Odeslat poptávku ⚡️
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full bg-slate-900 border border-slate-800 rounded-xl overflow-hidden text-[10px]">
                  <div className="bg-slate-800 p-2 font-bold flex justify-between items-center text-slate-300 border-b border-slate-700">
                    <span>📂 ONYX OS — CRM</span>
                    <span className="text-[9px] text-green-400 animate-pulse">● Synchronizace aktivní</span>
                  </div>
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="bg-slate-800/50 text-slate-400 font-semibold border-b border-slate-800">
                        <th className="p-2">Jméno</th>
                        <th className="p-2">E-mail</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Hodnota</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-800 bg-violet-950/25">
                        <td className="p-2 font-semibold text-violet-300">Petr Matěj</td>
                        <td className="p-2 text-slate-350">petr.matej@email.cz</td>
                        <td className="p-2"><span className="bg-yellow-400/20 text-yellow-300 px-1.5 py-0.5 rounded text-[8px] font-bold">Nový lead</span></td>
                        <td className="p-2 font-semibold text-emerald-400">9 900 Kč</td>
                      </tr>
                      <tr className="border-b border-slate-800">
                        <td className="p-2">Anna Dvořáková</td>
                        <td className="p-2 text-slate-500">anna@salon-rose.cz</td>
                        <td className="p-2"><span className="bg-blue-400/20 text-blue-300 px-1.5 py-0.5 rounded text-[8px]">Vyřešeno</span></td>
                        <td className="p-2 text-slate-500">24 900 Kč</td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              )}

              {activeStep === 3 && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-3 text-left">
                  <div className="text-2xl">✉️</div>
                  <div>
                    <h5 className="font-bold text-xs text-white">E-mail odeslán automaty</h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">Příjemce: petr.matej@email.cz</p>
                    <div className="bg-slate-850 p-3 rounded mt-2 border border-slate-800">
                      <p className="text-[9px] font-semibold text-slate-300">„Dobrý den Petře, vaše poptávka dorazila..."</p>
                      <p className="text-[8px] text-slate-550 mt-1 leading-relaxed">Naši specialisté již analyzují váš požadavek. Do 24 hodin se ozveme s prvním návrhem.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeStep === 4 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white mb-1">Měsíční report konverzí</h4>
                      <p className="text-[10px] text-slate-500">Výkon a celková efektivita webu</p>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold text-emerald-400">+104 500 Kč</div>
                      <div className="text-[9px] text-slate-500">Obrat za 30 dní</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-base font-bold text-white">5.14 %</div>
                      <div className="text-[9px] text-slate-500">ÚSPĚŠNOST WEBU</div>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
                      <div className="text-base font-bold text-white">38</div>
                      <div className="text-[9px] text-slate-500">PŘIJATÉ POPTÁVKY</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Bottom notification banner */}
            <div className="border-t border-slate-800 pt-4 flex justify-between items-center text-[10px] text-slate-400 z-10">
              <span className="leading-relaxed pr-4 text-left">{steps[activeStep].detail}</span>
              <button
                type="button"
                onClick={() => setActiveStep((p) => (p + 1) % steps.length)}
                className="text-violet-400 hover:text-violet-300 font-bold flex items-center gap-0.5 shrink-0"
              >
                Dále <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", businessDescription: "", packageType: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Record<number, boolean>>({});
  const [scrolled, setScrolled] = useState(false);
  const [activeCase, setActiveCase] = useState(0);
  const [billingAnnual, setBillingAnnual] = useState(true);
  const contactRef = useRef<HTMLElement>(null);

  const [auditData, setAuditData] = useState({ webUrl: "", email: "", phone: "", businessType: "", mainGoal: "" });
  const [auditSubmitting, setAuditSubmitting] = useState(false);

  const createInquiry = trpc.inquiries.create.useMutation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToContact = () => contactRef.current?.scrollIntoView({ behavior: "smooth" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Vyplňte prosím vaše jméno");
    if (!formData.email.includes("@")) return toast.error("Zadejte platný email");
    if (!formData.packageType) return toast.error("Vyberte balíček");
    setIsSubmitting(true);
    try {
      await createInquiry.mutateAsync({ ...formData, details: undefined, source: "web-form" });
      trackSklikConversion({ orderId: `lead-${Date.now()}`, value: 900 });
      toast.success("Poptávka odeslána! Ozveme se do 24 hodin.");
      setFormData({ name: "", email: "", phone: "", businessDescription: "", packageType: "" });
    } catch { toast.error("Chyba při odesílání. Zkuste to znovu."); }
    finally { setIsSubmitting(false); }
  };

  const handleAuditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditData.webUrl.trim()) return toast.error("Zadejte prosím URL vašeho webu");
    if (!auditData.email.includes("@")) return toast.error("Zadejte platný email");
    setAuditSubmitting(true);
    try {
      await createInquiry.mutateAsync({
        name: `Audit: ${auditData.webUrl}`,
        email: auditData.email,
        phone: auditData.phone,
        businessDescription: `Audit webu ${auditData.webUrl}. Typ: ${auditData.businessType || 'Nezadáno'}. Cíl: ${auditData.mainGoal || 'Nezadáno'}`,
        packageType: "audit-zdarma",
        details: undefined,
        source: "audit-form"
      });
      trackSklikConversion({ orderId: `audit-${Date.now()}`, value: 500 });
      toast.success("Žádost o audit odeslána! Do 24 hodin vám zašleme analýzu.");
      setAuditData({ webUrl: "", email: "", phone: "", businessType: "", mainGoal: "" });
    } catch {
      toast.error("Chyba při odesílání žádosti. Zkuste to znovu.");
    } finally {
      setAuditSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen font-[Plus_Jakarta_Sans,Inter,sans-serif] bg-white text-slate-900">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-[#1a0a3c]/95 backdrop-blur-md shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <a href="/" aria-label="Optimateo"><OptimateoLogo className="h-9" light /></a>
          <div className="hidden md:flex items-center gap-8">
            {["Řešení", "Ceny", "Případové studie", "O nás"].map(item => (
              <a key={item} href={`#${item === "Ceny" ? "pricing" : item === "Případové studie" ? "cases" : item === "Řešení" ? "niche" : "contact"}`}
                className="text-white/80 hover:text-white text-sm font-medium transition-colors">{item}</a>
            ))}
            <a href="/demo" className="text-emerald-300 hover:text-emerald-100 text-sm font-medium transition-colors flex items-center gap-1">
              🎨 Demo
            </a>
            <a href="/agents" className="text-violet-300 hover:text-violet-100 text-sm font-medium transition-colors flex items-center gap-1">
              ✨ AI Asistenti
            </a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <a href={user?.role === "admin" ? "/admin" : "/dashboard"}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-violet-600/80 hover:bg-violet-600 px-4 py-2 rounded-full transition-colors border border-violet-400/30">
                <LayoutDashboard className="w-4 h-4" /> ADMIN
              </a>
            ) : (
              <>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 text-sm" onClick={scrollToContact}>
                  Domluvit konzultaci
                </Button>
                <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-sm font-semibold px-5 rounded-full" onClick={scrollToContact}>
                  14 dní zdarma →
                </Button>
              </>
            )}
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#1a0a3c] border-t border-white/10 px-4 py-4 flex flex-col gap-4">
            {["#niche", "#pricing", "#cases", "#contact"].map((href, i) => (
              <a key={i} href={href} className="text-white/80 text-sm" onClick={() => setMobileMenuOpen(false)}>
                {["Řešení", "Ceny", "Případové studie", "Kontakt"][i]}
              </a>
            ))}
            <a href="/agents" className="text-violet-300 text-sm font-medium">✨ AI Asistenti</a>
            {isAuthenticated ? (
              <a href={user?.role === "admin" ? "/admin" : "/dashboard"} className="flex items-center gap-1.5 text-sm font-semibold text-white bg-violet-600 px-4 py-2 rounded-full w-full justify-center">
                <LayoutDashboard className="w-4 h-4" /> ADMIN
              </a>
            ) : (
              <Button className="bg-[#7c3aed] text-white w-full rounded-full" onClick={() => { setMobileMenuOpen(false); scrollToContact(); }}>
                14 dní zdarma →
              </Button>
            )}
          </div>
        )}
      </nav>

      <div>

        {/* ── HERO ── */}
        <section className="relative bg-[#0f0628] text-white overflow-hidden">
          {/* Background — layered grid, beams, orbs, brand watermark */}
          <div className="absolute inset-0 pointer-events-none">
            {/* base depth gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1d0f45_0%,#0f0628_55%,#0a041d_100%)]" />

            {/* neon grid styles */}
            <style>{`
            @keyframes heroGridPan { from { background-position: 0 0, 0 0; } to { background-position: 52px 52px, 52px 52px; } }
            @keyframes heroFloorScroll { from { background-position: 0 0; } to { background-position: 0 60px; } }
            @keyframes heroNeonPulse { 0%,100% { opacity:.32; } 50% { opacity:.62; } }
            @keyframes heroTextGlow { 0%,100% { filter: drop-shadow(0 0 10px rgba(124,58,237,.35)); } 50% { filter: drop-shadow(0 0 22px rgba(34,211,238,.55)); } }
            .hero-neon-grid {
              background-image:
                linear-gradient(rgba(139,92,246,.20) 1px, transparent 1px),
                linear-gradient(90deg, rgba(34,211,238,.16) 1px, transparent 1px);
              background-size: 52px 52px;
              -webkit-mask-image: radial-gradient(ellipse 75% 60% at 50% 32%, #000 0%, transparent 72%);
              mask-image: radial-gradient(ellipse 75% 60% at 50% 32%, #000 0%, transparent 72%);
              animation: heroGridPan 7s linear infinite, heroNeonPulse 4s ease-in-out infinite;
            }
            .hero-neon-floor {
              transform: rotateX(74deg);
              background-image:
                linear-gradient(rgba(34,211,238,.55) 1px, transparent 1px),
                linear-gradient(90deg, rgba(139,92,246,.45) 1px, transparent 1px);
              background-size: 60px 60px;
              -webkit-mask-image: linear-gradient(to top, #000 8%, transparent 82%);
              mask-image: linear-gradient(to top, #000 8%, transparent 82%);
              animation: heroFloorScroll 1.6s linear infinite;
              filter: drop-shadow(0 0 6px rgba(34,211,238,.45));
            }
            .hero-neon-text { animation: heroTextGlow 3.5s ease-in-out infinite; }
            @keyframes heroLinePulse { 0%,100% { opacity:.18; } 50% { opacity:.65; } }
            .hero-line-pulse { animation: heroLinePulse 3.2s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) {
              .hero-neon-grid, .hero-neon-floor, .hero-neon-text, .hero-line-pulse { animation: none; }
            }
          `}</style>
            {/* animated neon grid — flat, pans + pulses */}
            <div className="absolute inset-0 hero-neon-grid" />

            {/* diagonal light beams */}
            <div className="absolute -top-40 left-[18%] w-[30rem] h-[110%] rotate-[24deg] bg-gradient-to-b from-violet-400/10 via-violet-500/[0.03] to-transparent blur-2xl" />
            <div className="absolute -top-52 right-[8%] w-[22rem] h-[110%] rotate-[-18deg] bg-gradient-to-b from-cyan-400/[0.07] via-transparent to-transparent blur-2xl" />

            {/* pulzující linky — po celé hero sekci, ne jen v rohu */}
            <div className="hero-line-pulse absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent" style={{ animationDelay: "0.4s" }} />
            <div className="hero-line-pulse absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-violet-400/40 to-transparent" style={{ animationDelay: "1.2s" }} />
            <div className="hero-line-pulse absolute top-[38%] inset-x-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/25 to-transparent" style={{ animationDelay: "2s" }} />
            <div className="hero-line-pulse absolute top-[64%] inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" style={{ animationDelay: "0.9s" }} />

            {/* glow orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 left-[12%] w-72 h-72 bg-cyan-500/[0.07] rounded-full blur-3xl" />

            {/* brand V-mark watermark */}
            <svg viewBox="0 0 100 100" className="absolute -right-28 top-1/2 -translate-y-1/2 w-[36rem] h-[36rem] opacity-[0.045]" aria-hidden="true">
              <defs>
                <linearGradient id="hero-mark" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              <path d="M6 14 L34 14 L57 86 L40 86 Z" fill="url(#hero-mark)" />
              <path d="M94 6 L66 6 L43 86 L57 86 Z" fill="url(#hero-mark)" />
            </svg>

            {/* corner accents + bottom fade */}
            <div className="hero-line-pulse absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" style={{ animationDelay: "0s" }} />
            {/* synthwave neon floor — mřížka scrolluje k divákovi */}
            <div className="absolute bottom-0 inset-x-0 h-[42%] overflow-hidden" style={{ perspective: "520px" }}>
              <div className="hero-neon-floor absolute inset-x-[-60%] bottom-0 h-[220%] origin-bottom" />
            </div>
            <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#0f0628] via-[#0f0628]/40 to-transparent" />
          </div>

          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20 grid gap-16 items-center ${viewportMode === 'mobile' ? '' : 'lg:grid-cols-2'}`}>
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-6 font-medium">
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
                Web · Automation · Data · Powered by ONYX OS
              </div>
              <h1 className={`font-extrabold leading-tight mb-6 ${viewportMode === 'mobile' ? 'text-4xl' : 'text-5xl lg:text-6xl'}`}>
                Web, který vám začne<br />
                <span className="hero-neon-text text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                  sbírat poptávky.
                </span>
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Postavíme vám moderní web napojený na formuláře, CRM, e-mail a automatizace. Nejen hezkou vizitku — systém, který pomáhá získávat zákazníky.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <a href="/audit-zdarma">
                  <Button size="lg" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-8 rounded-full text-base shadow-lg shadow-violet-900/40 active:scale-95 transition-transform">
                    Získat mini audit zdarma →
                  </Button>
                </a>
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full text-base" onClick={scrollToContact}>
                  Domluvit konzultaci
                </Button>
              </div>
              {/* Price list snippet under buttons */}
              <div className="text-xs text-white/50 mb-10 italic">
                Audit zdarma · ONYX OS Audit od 4 900 Kč · Monitoring od 1 999 Kč/měs.
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 text-sm text-white/60">
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Návrh zdarma</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> 30% záloha, zbytek po spuštění</span>
                <span className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Bez skrytých poplatků</span>
              </div>
            </div>

            {/* Right — mock dashboard */}
            <div className={viewportMode === 'mobile' ? 'hidden' : 'hidden lg:block relative'}>
              {/* main dashboard card */}
              <div className="relative bg-white/[0.04] backdrop-blur-sm border border-violet-500/40 rounded-2xl p-6 shadow-2xl shadow-violet-900/40">
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "0 0 60px -12px rgba(139,92,246,.5)" }} />
                <div className="relative flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <span className="ml-2 text-white/40 text-xs">optimateo.com/dashboard</span>
                </div>
                <div className="relative grid grid-cols-3 gap-3 mb-4">
                  {[["89", "Nové poptávky", "23"], ["3×", "Více poptávek", "180"], ["47%", "Růst rezervací", "32"]].map(([v, l, up]) => (
                    <div key={l} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="text-2xl font-bold text-white">{v}</div>
                      <div className="text-[11px] text-white/50 mt-1 leading-tight">{l}</div>
                      <div className="text-[11px] text-emerald-400 font-semibold mt-1">↑ {up} %</div>
                    </div>
                  ))}
                </div>
                <div className="relative bg-white/[0.03] border border-white/10 rounded-xl p-4">
                  <div className="text-sm font-semibold text-white/80 mb-3">Aktivní projekty</div>
                  <div className="space-y-2.5">
                    {["Kavárna Espresso — web spuštěn ✓", "Elektrikář Novák — 3 nové poptávky", "Beauty Salon — booking aktivní ✓"].map(t => (
                      <div key={t} className="flex items-center gap-2 text-xs text-white/70">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* overlapping chart card */}
              <div className="absolute -bottom-10 -right-6 w-64 bg-[#120a2e]/90 backdrop-blur-md border border-violet-500/40 rounded-2xl p-4 shadow-2xl shadow-violet-900/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-white/80">Růst výkonu</span>
                  <span className="text-[10px] text-white/40 border border-white/15 rounded-full px-2 py-0.5">12 měsíců ▾</span>
                </div>
                <div className="relative">
                  <span className="absolute right-0 -top-1 text-xs font-bold text-emerald-400">+247%</span>
                  <svg viewBox="0 0 220 90" className="w-full h-20" aria-hidden="true">
                    <defs>
                      <linearGradient id="heroChartStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                    <polyline points="4,78 30,70 52,74 76,58 100,62 124,44 150,50 174,30 200,34 216,8" fill="none" stroke="url(#heroChartStroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,.7))" }} />
                    <circle cx="216" cy="8" r="4" fill="#fff" style={{ filter: "drop-shadow(0 0 6px rgba(167,139,250,.9))" }} />
                  </svg>
                </div>
                <p className="text-[11px] text-white/50 mt-1">Měřitelný růst. Reálné výsledky.</p>
              </div>
            </div>
          </div>

          {/* Trust logos */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-6">
            <p className="text-center text-[11px] tracking-widest uppercase text-white/40 mb-5">Důvěřují nám firmy napříč obory</p>
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {[
                { icon: <Coffee className="w-5 h-5" />, label: "Kavárna Espresso" },
                { icon: <Zap className="w-5 h-5" />, label: "Elektrikář Novák" },
                { icon: <Scissors className="w-5 h-5" />, label: "Beauty Salon" },
                { icon: <Dumbbell className="w-5 h-5" />, label: "Fitness Club" },
                { icon: <Scale className="w-5 h-5" />, label: "Advokátní kancelář" },
                { icon: <Building2 className="w-5 h-5" />, label: "Realitní Pro" },
                { icon: <Stethoscope className="w-5 h-5" />, label: "DentalCare" },
                { icon: <Plane className="w-5 h-5" />, label: "TravelPoint" },
              ].map(t => (
                <div key={t.label} className="flex items-center gap-2 text-white/45 hover:text-white/70 transition-colors">
                  {t.icon}
                  <span className="text-sm font-medium leading-tight">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="relative bg-white/5 backdrop-blur-sm border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-3 gap-4 divide-x divide-white/10">
              {[
                { icon: <Zap className="w-6 h-6" />, v: "50+", l: "projektů dokončeno" },
                { icon: <Star className="w-6 h-6" />, v: "5 let", l: "zkušeností" },
                { icon: <Heart className="w-6 h-6" />, v: "98%", l: "spokojenost klientů" },
              ].map(s => (
                <div key={s.l} className="flex items-center justify-center gap-3">
                  <span className="text-violet-300">{s.icon}</span>
                  <div>
                    <div className="text-2xl font-extrabold text-violet-200">{s.v}</div>
                    <div className="text-xs text-white/50">{s.l}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI TÝM — pixelová foto, parallax ── */}
        <section
          className="relative h-[65vh] min-h-[420px] bg-fixed bg-cover bg-center bg-[#0b0620]"
          style={{ backgroundImage: "linear-gradient(to bottom, rgba(11,6,32,.62), rgba(11,6,32,.42)), url('/agents-pixel.jpg')" }}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="uppercase tracking-widest text-xs text-white/70 mb-3">Náš AI tým</span>
            <h2 className="text-3xl lg:text-5xl font-extrabold text-white max-w-3xl leading-tight drop-shadow-lg">
              Tři asistenti. Jeden systém.<br />Vaše firma běží dál i ve 3 ráno.
            </h2>
          </div>
        </section>

        {/* ── SECTION 2: PROBLÉM & ŘEŠENÍ ── */}
        <section className="relative py-24 bg-white overflow-hidden border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Column: Problem */}
              <Reveal>
                <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 text-sm text-red-700 font-medium mb-5">
                  ⚠️ Častý problém
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
                  Většina webů je jen<br />
                  <span className="text-red-600">drahá vizitka</span>
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Tradiční agentury vám postaví hezký design, ale tím to končí. Návštěvník na web přijde, rozhlédne se a odejde. Vy netušíte, kdo to byl, nemáte na něj kontakt a web vám nepřinesl žádnou reálnou hodnotu. Stál desítky tisíc, ale leží zapomenutý.
                </p>
                <ul className="space-y-3 text-sm text-slate-500">
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Nulové propojení na obchodní procesy
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Složité ruční přepisování poptávek
                  </li>
                  <li className="flex items-center gap-2">
                    <X className="w-4 h-4 text-red-500" /> Žádné automatické potvrzení klientovi
                  </li>
                </ul>
              </Reveal>

              {/* Right Column: Solution */}
              <Reveal>
                <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-4 py-1.5 text-sm text-emerald-700 font-medium mb-5">
                  ✨ Naše řešení
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-5">
                  Web + CRM + automatizace<br />
                  <span className="text-violet-600">v jednom systému</span>
                </h2>
                <p className="text-slate-600 mb-6 leading-relaxed">
                  Postavíme vám moderní web, který neslouží jako pasivní katalog. Okamžitě sbírá poptávky, zapisuje je do integrovaného CRM systému a automaticky spouští e-mailové sekvence pro zahřátí leadů. Celý systém běží na naší technologii <strong>ONYX OS</strong>.
                </p>
                <ul className="space-y-3 text-sm text-slate-800">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 font-bold" /> Poptávka jde okamžitě do přehledného CRM
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 font-bold" /> Automatický follow-up e-mail do 30 sekund
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-500 font-bold" /> Přehledné statistiky a reporting výkonu webu
                  </li>
                </ul>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: SPECIFICKÉ SCÉNÁŘE ── */}
        <section className="py-20 bg-slate-50 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                Jak to funguje ve vašem oboru
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Navrhujeme řešení přizpůsobená reálným situacím a vašim cílovým zákazníkům.
              </p>
            </Reveal>

            <StaggerGrid className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { title: "Pro zubaře", subtitle: "Rezervace", text: "Online kalendář, volné termíny a okamžité dotazy pacientů bez přetížení recepce." },
                { title: "Pro realitní služby", subtitle: "Poptávky", text: "Kontaktní formuláře u nemovitostí a automatická kvalifikace zájemců o prohlídku." },
                { title: "Pro lokální služby", subtitle: "Rychlý kontakt", text: "Snadné prokliknutí na telefonát, navigace na mapu a poptávka řemesel na pár kliknutí." },
                { title: "Pro e-shopy", subtitle: "Košíky", text: "Měření opuštěných košíků a automatické e-mailové připomínky s výhodnější nabídkou." },
                { title: "Pro poradce", subtitle: "Konzultace", text: "Rychlý sběr kontaktů přes e-book zdarma a přímé napojení na plánovač schůzek." }
              ].map((s, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col"
                >
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">{s.subtitle}</div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{s.text}</p>
                </motion.div>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── SECTION 4: INTERAKTIVNÍ DEMO FLOW ── */}
        <InteractiveDemoFlow />

        {/* ── NICHE SOLUTIONS ── */}
        <section id="niche" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-full px-4 py-2 mb-5 text-sm text-cyan-700 font-medium">
                📱 80% návštěv je z mobilů — navrhujeme primárně pro displeje
              </div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
                Řešení pro obory, kde web<br />
                <span className="text-violet-600">funguje nejlépe</span>
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">Specializujeme se na obory, kde záleží na prvním dojmu, rychlé odezvě a měřitelných výsledcích.</p>
            </Reveal>
            <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {niches.map(n => (
                <motion.button
                  key={n.label}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  onClick={scrollToContact}
                  className={`bg-gradient-to-br ${n.color} border border-slate-200 hover:border-violet-300 rounded-2xl p-5 text-left transition-colors hover:shadow-md group`}
                >
                  <div className={`w-12 h-12 mb-3 rounded-xl bg-white/70 backdrop-blur-sm border border-white/60 shadow-sm flex items-center justify-center ${n.iconColor} group-hover:scale-105 transition-transform`}>
                    <n.icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <div className="font-semibold text-slate-900 text-sm mb-1">{n.label}</div>
                  <div className="text-xs text-slate-500 leading-relaxed">{n.desc}</div>
                  <div className="mt-3 text-xs text-violet-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Zobrazit řešení →</div>
                </motion.button>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── PROČ NÁS + JAK PRACUJEME ── */}
        <section className="py-20 bg-[#0f0628] text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16">
            <Reveal>
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-6">
                Nejsme jen webová agentura.<br />
                <span className="text-violet-400">Jsme váš dlouhodobý partner.</span>
              </h2>
              <p className="text-white/70 mb-8 leading-relaxed">
                Rozumíme obchodu, automatizaci i tomu, jak české firmy skutečně fungují. Proto neděláme jen weby — stavíme systémy, které vám přinášejí zákazníky i ve 3 ráno.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  ["Vlastní nástroje a automatizace", "ONYX OS, chatbot, scoring leadů — vše pod jednou střechou."],
                  ["Silný důraz na výsledky", "Každý web měříme. Víme, co funguje a co ne."],
                  ["Zkušenosti z reálného prostředí", "50+ projektů pro české živnostníky a firmy."],
                ].map(([title, desc]) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-violet-500/20 border border-violet-400/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-violet-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white text-sm">{title}</div>
                      <div className="text-white/50 text-sm">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full px-8 font-bold" onClick={scrollToContact}>
                Domluvit konzultaci
              </Button>
            </Reveal>

            <div>
              <Reveal className="mb-6">
                <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-1.5 text-sm text-violet-300 mb-4">
                  Transparentní vývoj
                </div>
                <h3 className="text-2xl font-extrabold mb-2">Jak probíhá vývoj MVP?</h3>
                <p className="text-white/50 text-sm">Krátké iterace, viditelný postup, vy máte vždy kontrolu nad tím, co se vyvíjí a proč.</p>
              </Reveal>
              <StaggerGrid className="space-y-3">
                {[
                  { emoji: "🔍", step: "1. Analýza", desc: "Zmapujeme váš byznys, cíle a konkurenci. Navrhneme strukturu a obsah." },
                  { emoji: "💻", step: "2. Vývoj", desc: "Píšeme kód, designujeme, integrujeme. Průběžné náhledy pro vaše schválení." },
                  { emoji: "🚀", step: "3. Nasazení", desc: "Spustíme web live — hosting, SSL, rychlost, SEO. Vše nastaveno." },
                  { emoji: "📊", step: "4. Zpětná vazba", desc: "Sledujeme výsledky a ladíme. Každá iterace je lepší než předchozí." },
                ].map(({ emoji, step, desc }) => (
                  <motion.div
                    key={step}
                    variants={fadeUp}
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 hover:border-sky-400/30 transition-colors"
                  >
                    <div className="text-2xl flex-shrink-0">{emoji}</div>
                    <div>
                      <div className="font-bold text-sm text-sky-300">{step}</div>
                      <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                    </div>
                  </motion.div>
                ))}
              </StaggerGrid>
            </div>
          </div>
        </section>

        {/* ── ONYX WEB CORE — system architecture ── */}
        <section id="core" className="py-20 bg-[#080d1f] text-white relative overflow-hidden">
          {/* living neon "consciousness" background */}
          <div className="absolute inset-0 pointer-events-none">
            <style>{`
            @keyframes coreEnergyFlow { to { stroke-dashoffset: -180; } }
            @keyframes coreNodePulse { 0%,100% { opacity:.18; } 50% { opacity:1; } }
            @keyframes coreBreath { 0%,100% { box-shadow: 0 0 45px -14px rgba(245,158,11,.28), inset 0 0 34px -14px rgba(245,158,11,.16); border-color: rgba(245,158,11,.22); } 50% { box-shadow: 0 0 85px -8px rgba(245,158,11,.5), inset 0 0 50px -10px rgba(245,158,11,.32); border-color: rgba(245,158,11,.6); } }
            @keyframes corePillarGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); border-color: rgba(245,158,11,.4); } 50% { box-shadow: 0 0 26px 1px rgba(245,158,11,.55); border-color: rgba(245,158,11,.95); } }
            @keyframes coreAuraBreath { 0%,100% { opacity:.4; transform: scale(1); } 50% { opacity:.85; transform: scale(1.14); } }
            @keyframes coreLabelPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); } 50% { box-shadow: 0 0 22px 0 rgba(245,158,11,.45); } }
            .core-line { animation: coreEnergyFlow linear infinite; }
            .core-node { animation: coreNodePulse 3s ease-in-out infinite; filter: drop-shadow(0 0 4px rgba(251,191,36,.85)); }
            .core-breath { animation: coreBreath 5s ease-in-out infinite; }
            .core-pillar-icon { animation: corePillarGlow 3.2s ease-in-out infinite; }
            .core-aura { animation: coreAuraBreath 7s ease-in-out infinite; }
            .core-label { animation: coreLabelPulse 3s ease-in-out infinite; }
            @media (prefers-reduced-motion: reduce) { .core-line,.core-node,.core-breath,.core-pillar-icon,.core-aura,.core-label { animation: none !important; } }
          `}</style>
            {/* breathing auras */}
            <div className="core-aura absolute top-1/4 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            <div className="core-aura absolute bottom-0 right-1/4 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl" style={{ animationDelay: "2.5s" }} />
            <div className="core-aura absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-violet-600/10 rounded-full blur-3xl" style={{ animationDelay: "1.2s" }} />
            {/* neural plexus — energie putuje po linkách, uzly pulzují */}
            <svg className="absolute inset-0 w-full h-full opacity-70" viewBox="0 0 1200 600" preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="coreLineGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              {(() => {
                const N: [number, number][] = [[120, 120], [300, 300], [200, 470], [500, 170], [600, 410], [770, 130], [900, 330], [1080, 180], [1010, 500], [430, 540]];
                const E: [number, number][] = [[0, 1], [1, 2], [1, 3], [3, 4], [4, 2], [4, 6], [3, 5], [5, 6], [6, 7], [6, 8], [8, 4], [9, 4], [9, 2], [5, 7]];
                return (
                  <>
                    {E.map(([a, b], i) => (
                      <line key={`e${i}`} x1={N[a][0]} y1={N[a][1]} x2={N[b][0]} y2={N[b][1]} stroke="url(#coreLineGrad)" strokeWidth="1.2" strokeDasharray="5 13" className="core-line" style={{ animationDuration: `${3 + (i % 4)}s`, animationDelay: `${(i % 5) * 0.4}s` }} />
                    ))}
                    {N.map((n, i) => (
                      <circle key={`n${i}`} cx={n[0]} cy={n[1]} r="3.4" fill="#fbbf24" className="core-node" style={{ animationDelay: `${(i % 6) * 0.4}s` }} />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <Reveal className="text-center mb-14">
              <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/5 px-4 py-1.5 rounded-full text-xs font-medium text-amber-200 tracking-widest uppercase mb-5">
                Jeden systém · vše propojené
              </div>
              <h2 className="text-3xl lg:text-5xl font-extrabold mb-3 tracking-tight">
                ONYX WEB <span className="text-amber-300">AI Core</span>
              </h2>
              <p className="text-white/50 text-sm tracking-wide">booking · CRM · data · automatizace · MCP/API</p>
            </Reveal>

            {/* Core pillars */}
            <div className="core-breath rounded-3xl border border-amber-400/20 bg-gradient-to-b from-[#0c1430] to-[#0a1026] p-6 md:p-10 mb-10 shadow-2xl shadow-black/40">
              <StaggerGrid className="grid grid-cols-2 md:grid-cols-5 gap-6">
                {[
                  { icon: <Calendar className="w-6 h-6" />, title: "Booking", desc: "Inteligentní rezervace a správa kapacit v reálném čase." },
                  { icon: <Users className="w-6 h-6" />, title: "CRM", desc: "360° pohled na klienta, automatizace vztahů a komunikace." },
                  { icon: <BarChart3 className="w-6 h-6" />, title: "Data", desc: "Reporting a chytré predikce pro lepší rozhodování." },
                  { icon: <Bot className="w-6 h-6" />, title: "Automatizace", desc: "Asistenti pro obsah, reklamy, doporučení a optimalizace." },
                  { icon: <Globe className="w-6 h-6" />, title: "MCP / API", desc: "Otevřené napojení na nástroje, partnery a marketplace." },
                ].map((p, i) => (
                  <motion.div key={p.title} variants={fadeUp} whileHover={{ y: -4 }} className="text-center">
                    <div className="core-pillar-icon w-16 h-16 mx-auto rounded-full border border-amber-400/40 bg-amber-400/5 flex items-center justify-center text-amber-300 mb-4" style={{ animationDelay: `${i * 0.5}s` }}>
                      {p.icon}
                    </div>
                    <h3 className="font-bold text-sm tracking-wider uppercase text-amber-100 mb-2">{p.title}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{p.desc}</p>
                  </motion.div>
                ))}
              </StaggerGrid>
            </div>

            {/* Connector label */}
            <div className="flex items-center justify-center mb-10">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/30" />
              <span className="core-label px-5 py-1.5 border border-amber-400/40 rounded-full text-xs font-semibold tracking-widest uppercase text-amber-200 bg-[#0c1430]">
                Napojení ONYX WEB
              </span>
              <div className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/30" />
            </div>

            {/* Connected modules */}
            <StaggerGrid className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-16">
              {[
                { icon: <Calendar className="w-5 h-5" />, title: "Rezervace", desc: "Online booking, připomínky, kalendáře, změny." },
                { icon: <MessageSquare className="w-5 h-5" />, title: "Komunikace", desc: "E-maily, newslettery, Telegram, WhatsApp scénáře." },
                { icon: <Megaphone className="w-5 h-5" />, title: "Marketing", desc: "Meta Ads, Google Ads, retargeting, optimalizace kampaní." },
                { icon: <ShoppingBag className="w-5 h-5" />, title: "Prodej", desc: "E-shop, produkty, dárkové sety, předplatné, upsell." },
                { icon: <Rocket className="w-5 h-5" />, title: "Prodejní web", desc: "Infoprodukty a kurzy: VSL, upsell, order bump, garance — funnel na míru." },
                { icon: <TrendingUp className="w-5 h-5" />, title: "Reporting", desc: "Dashboardy, predikce, tržby, klienti, LTV, insights." },
                { icon: <Sparkles className="w-5 h-5" />, title: "AI Asistenti", desc: "Tvorba obsahu, doporučení, automatizace rutinních úkolů." },
              ].map((m) => (
                <motion.div key={m.title} variants={fadeUp} whileHover={{ y: -3 }} className="bg-white/[0.03] border border-white/10 hover:border-amber-400/30 rounded-2xl p-4 text-center transition-colors">
                  <div className="w-11 h-11 mx-auto rounded-full bg-amber-400/10 flex items-center justify-center text-amber-300 mb-3">
                    {m.icon}
                  </div>
                  <h4 className="font-semibold text-sm text-white mb-1.5">{m.title}</h4>
                  <p className="text-[11px] text-white/45 leading-relaxed">{m.desc}</p>
                </motion.div>
              ))}
            </StaggerGrid>

            {/* AI Core pricing */}
            <Reveal className="rounded-3xl border-2 border-amber-400/40 bg-gradient-to-r from-[#101a3d] to-[#0c1430] p-8 md:p-10 mb-16 mt-3 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-amber-400 text-[#0a0f24] text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">Tarif AI Core</span>
              </div>
              <div className="grid md:grid-cols-3 gap-8 items-center pt-2">
                <div>
                  <p className="text-white/50 text-sm mb-1">Zavedení na míru</p>
                  <p className="text-4xl font-extrabold text-white mb-4">od 14 990 <span className="text-lg font-medium text-white/50">Kč</span></p>
                  <p className="text-white/50 text-sm mb-1">Provoz — vše v ceně</p>
                  <p className="text-3xl font-extrabold text-amber-300">999 <span className="text-base font-medium text-amber-300/60">Kč/měs</span></p>
                </div>
                <div className="md:col-span-2">
                  <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-6">
                    {[
                      "Booking systém + správa kapacit",
                      "CRM s 360° pohledem na klienta",
                      "Data, reporting a chytré predikce",
                      "Asistenti — obsah, kampaně, rutina",
                      "Prodejní web pro infoprodukty a kurzy",
                      "MCP/API napojení na vaše nástroje",
                      "2 moduly v ceně, další +290 Kč/měs",
                      "Provoz, zálohy a podpora v ceně",
                    ].map(f => (
                      <div key={f} className="flex items-start gap-2 text-sm text-white/70">
                        <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /> {f}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button className="bg-amber-400 hover:bg-amber-300 text-[#0a0f24] font-bold rounded-full px-8" onClick={scrollToContact}>
                      Chci AI Core
                    </Button>
                    <Button variant="ghost" className="text-amber-200/80 hover:text-amber-100 border border-amber-400/30 hover:border-amber-400/60 rounded-full" onClick={scrollToContact}>
                      Nezávazná konzultace →
                    </Button>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-white/30 mt-6 text-center">
                Funkce AI Core běží na platformě ONYX OS. Krabicové platformy účtují za srovnatelné doplňky 800–1 500 Kč/měs — u nás je vše podstatné v jednom tarifu.
              </p>
            </Reveal>

          </div>
        </section>

        {/* ── CENY — ONYX OS SYSTÉM ── */}
        <section id="pricing" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-4">
              <span className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
                Systém ONYX OS
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mt-4 mb-4">Neprodáváme nástroj. Prodáváme výsledek.</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Najdeme, kde váš web ztrácí poptávky. Opravíme to. A pak sledujeme, jestli to funguje.</p>
            </Reveal>

            {/* Conversion funnel visualization */}
            <Reveal className="mb-12">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 py-8">
                {[
                  { label: "Mini audit", sub: "zdarma", color: "bg-slate-100 border-slate-300 text-slate-700", arrow: true },
                  { label: "ONYX Audit", sub: "4 900–14 900 Kč", color: "bg-violet-50 border-violet-300 text-violet-800", arrow: true },
                  { label: "ONYX Setup", sub: "29 900–90 000 Kč", color: "bg-violet-100 border-violet-400 text-violet-900", arrow: true },
                  { label: "Monitoring", sub: "1 999 Kč/měs.", color: "bg-violet-600 border-violet-700 text-white", arrow: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`border-2 rounded-2xl px-5 py-3 text-center min-w-[140px] ${step.color}`}>
                      <div className="font-bold text-sm">{step.label}</div>
                      <div className="text-xs mt-0.5 opacity-75">{step.sub}</div>
                    </div>
                    {step.arrow && <ArrowRight className="w-5 h-5 text-slate-400 shrink-0 hidden md:block" />}
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-slate-400">zájem → diagnóza → implementace → měsíční sledování výsledků</p>
            </Reveal>

            <StaggerGrid className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {packages.map(pkg => (
                <motion.div key={pkg.name} variants={fadeUp} whileHover={{ y: -4 }} className={`border ${pkg.color} bg-white rounded-2xl p-6 relative flex flex-col ${pkg.highlight ? "shadow-xl shadow-violet-100" : ""}`}>
                  {pkg.badge && (
                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap ${pkg.highlight ? "bg-violet-600 text-white" : "bg-slate-700 text-white"}`}>
                      {pkg.badge}
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-bold text-slate-900 text-lg mb-1">{pkg.name}</h3>
                    <p className="text-xs text-violet-600 font-semibold mb-3">{pkg.proKomu}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-slate-500 font-medium mr-0.5">od</span>
                      <span className="text-3xl font-extrabold text-slate-900">{pkg.price}</span>
                      <span className="text-slate-400 text-sm">Kč</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1">{pkg.priceNote}</div>
                  </div>
                  <ul className="space-y-3 mb-6 flex-1">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-violet-500 flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {pkg.ctaHref ? (
                    <a href={pkg.ctaHref}>
                      <Button className={`w-full rounded-full font-semibold ${pkg.highlight ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}>
                        {pkg.cta}
                      </Button>
                    </a>
                  ) : (
                    <Button
                      className={`w-full rounded-full font-semibold ${pkg.highlight ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-slate-900 hover:bg-slate-800 text-white"}`}
                      onClick={scrollToContact}
                    >
                      {pkg.cta}
                    </Button>
                  )}
                </motion.div>
              ))}
            </StaggerGrid>

            <div className="text-center mt-10 mb-8">
              <p className="text-sm text-slate-500">
                Nevíte, kde začít?{" "}
                <a href="/audit-zdarma" className="text-violet-600 font-bold hover:underline">
                  Získejte mini audit webu zdarma →
                </a>
              </p>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6 mb-16">Ceny jsou bez DPH. Setup zahrnuje 30 dnů záruky na výsledky. Monitoring obsahuje hosting, SSL, zálohy a podporu.</p>

            {/* Platform comparison — inset card v rámci stejné sekce */}
            <div className="bg-slate-50 rounded-3xl p-6 md:p-10">
              <Reveal className="text-center mb-10">
                <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-4">
                  Znáte to z krabicových platforem?
                </h3>
                <p className="text-slate-500 max-w-2xl mx-auto">
                  Základní tarif vypadá levně — ale pak platíte za každý doplněk zvlášť.
                  Booking, e-maily, chat, analytika… a najednou jste na trojnásobku.
                  <span className="font-semibold text-slate-700"> U nás je to obráceně: vše podstatné v ceně.</span>
                </p>
              </Reveal>

              <StaggerGrid className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Krabicová platforma */}
                <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-2xl">📦</span>
                    <h4 className="font-bold text-slate-700">Krabicová platforma</h4>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Základ od ~330 Kč/měs — reálně ale 800–1 500 Kč s doplňky",
                      "Každý doplněk (booking, e-maily, chat) za příplatek 50–300 Kč/měs",
                      "Šablona, kterou používá dalších 500 webů",
                      "Vše si nastavujete a spravujete sami",
                      "Podpora přes helpdesk a fórum",
                      "Chytré funkce chybí, nebo jen draze přes třetí strany",
                    ].map(t => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-slate-500">
                        <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Optimateo */}
                <motion.div variants={fadeUp} className="bg-[#0f0628] border-2 border-violet-500 rounded-2xl p-6 relative shadow-xl shadow-violet-200">
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                    Více za méně
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-2xl">⚡</span>
                    <h4 className="font-bold text-white">Optimateo</h4>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Provoz od 179 Kč/měs — žádné skryté příplatky",
                      "Základní pluginy (booking, e-maily, analytika) v ceně",
                      "Web na míru od profíků — žádná univerzální šablona",
                      "Postavíme a spravujeme za vás, vy jen schvalujete",
                      "Osobní podpora + poradce Alex 24/7",
                      "Chatbot, tým asistentů a Brand Memory v platformě",
                    ].map(t => (
                      <li key={t} className="flex items-start gap-2.5 text-sm text-white/80">
                        <Check className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-6 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full"
                    onClick={scrollToContact}
                  >
                    Chci víc za míň →
                  </Button>
                </motion.div>
              </StaggerGrid>

              <p className="text-center text-xs text-slate-400 mt-6">
                Srovnání vychází z veřejných ceníků běžných českých krabicových řešení (e-shop a webové platformy) k datu zveřejnění.
              </p>
            </div>
          </div>
        </section>

        {/* ── VÝSLEDKY — CASE STUDIES + TESTIMONIALS ── */}
        <section id="cases" className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-3">Výsledky, ne sliby</h2>
                <p className="text-slate-500">Reálné výsledky reálných klientů.</p>
              </div>
            </Reveal>

            {/* Featured case */}
            <Reveal className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-3xl p-8 lg:p-12 mb-6">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4 ${caseStudies[activeCase].tagColor}`}>
                    {caseStudies[activeCase].tag}
                  </span>
                  <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mb-4">{caseStudies[activeCase].title}</h3>
                  <p className="text-slate-600 leading-relaxed mb-6">{caseStudies[activeCase].desc}</p>
                  <blockquote className="border-l-4 border-violet-400 pl-4 italic text-slate-600 text-sm mb-6">
                    „{caseStudies[activeCase].quote}"
                    <footer className="mt-2 not-italic font-semibold text-slate-800 text-xs">
                      — {caseStudies[activeCase].author}, {caseStudies[activeCase].role}
                    </footer>
                  </blockquote>
                  <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full" onClick={scrollToContact}>
                    Chci podobné výsledky
                  </Button>
                </div>
                <div className="text-center">
                  <div className="text-8xl font-extrabold text-violet-600 mb-2">{caseStudies[activeCase].metric}</div>
                  <div className="text-slate-500 font-medium">{caseStudies[activeCase].metricLabel}</div>
                </div>
              </div>
            </Reveal>

            {/* Case tabs */}
            <div className="flex gap-3 flex-wrap mb-16">
              {caseStudies.map((c, i) => (
                <button key={i} onClick={() => setActiveCase(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCase === i ? "bg-violet-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                  {c.tag}
                </button>
              ))}
            </div>

            <Reveal className="text-center mb-10">
              <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900">Co říkají naši klienti</h3>
            </Reveal>
            <StaggerGrid className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {testimonials.map(t => (
                <motion.div key={t.name} variants={fadeUp} whileHover={{ y: -4 }} className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: t.stars }).map((_, i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">„{t.text}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {t.initial}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{t.name}</div>
                      <div className="text-xs text-slate-400">{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── PORTFOLIO — REAL PROJECTS ── */}
        <section id="portfolio" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Reveal className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">
                Reálné projekty z našeho portfolia
              </h2>
              <p className="text-slate-500 max-w-2xl mx-auto">
                Aplikace, e-shopy a platformy, které jsme navrhli a realizovali. Vše v TypeScriptu, nasazeno na produkci.
              </p>
            </Reveal>

            {/* Premium projekty — Enchanté One spotlight */}
            <Reveal className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Premium projekty
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
              </div>
              <div className="rounded-3xl border border-amber-400/25 bg-gradient-to-br from-[#0e1535] via-[#0c1128] to-[#0a0e22] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="grid md:grid-cols-2 gap-10 items-center relative">
                  <div>
                    <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-medium text-amber-200 mb-5">
                      <Sparkles className="w-3.5 h-3.5" /> Právě vyvíjíme
                    </div>
                    <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-1 text-amber-50">Enchanté One</h3>
                    <p className="text-amber-300/80 text-xs tracking-widest uppercase mb-5">Galleries · Auctions · Data</p>
                    <p className="text-white/60 leading-relaxed mb-6">
                      Vlastní aukční platforma pro galerie, aukce a distribuci uměleckých děl —
                      napojená na světové marketplace. Optimateo propojuje salon s trhem umění.
                    </p>
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/40">
                      <span className="font-semibold text-orange-400">Aukro</span>
                      <span className="font-semibold text-white/60">Invaluable</span>
                      <span className="font-semibold text-emerald-400">LiveBid</span>
                      <span className="text-white/30">a další…</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: <Gavel className="w-5 h-5" />, title: "Aukční engine", desc: "Příhozy, limity a dražby v reálném čase." },
                      { icon: <Globe className="w-5 h-5" />, title: "Distribuce & marketplace", desc: "Jedno dílo, publikace na více trzích najednou." },
                      { icon: <Database className="w-5 h-5" />, title: "Data & historie", desc: "Provenience, výsledky aukcí, cenové trendy." },
                      { icon: <Shield className="w-5 h-5" />, title: "Důvěra & autenticita", desc: "Ověření děl a transparentní záznamy prodejů." },
                    ].map((f) => (
                      <div key={f.title} className="bg-[#0c1430]/80 border border-amber-400/15 rounded-2xl p-4">
                        <div className="text-amber-300 mb-2">{f.icon}</div>
                        <h4 className="font-semibold text-sm text-amber-50 mb-1">{f.title}</h4>
                        <p className="text-[11px] text-white/45 leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <StaggerGrid className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {([
                // Top full-stack platformy první. image: "/portfolio/<soubor>.png" doplň, až budou screenshoty.
                { name: "Monika Virtue", repo: "omnix", desc: "Holistická wellness platforma (omnix.cz) v konceptu Wabi-Sabi — terapie, hormonální jóga a kurzy. Rezervace s platbami, kvíz a chytrý asistent, který se učí tón terapeutky.", tags: ["Wellness", "Platforma", "Fullstack"], color: "from-amber-500 to-stone-600", modules: ["Rezervace + Stripe platby", "Telegram asistent (sentiment + booking intent)", "Kvíz lead-gen", "7denní drip e-maily (cron)", "CRM", "Blog + SEO admin", "Vícejazyčnost", "Light/Dark režim"] },
                { name: "Human Design Mapa", repo: "humandesignchart", desc: "Prémiový SaaS pro sebepoznání (humandesignmapa.cz) — přesný astrologický výpočet, interaktivní Bodygraph a kontextový průvodce, který mapu vykládá a sleduje denní tranzity.", tags: ["SaaS", "Premium", "Předplatné"], color: "from-violet-500 to-purple-600", stars: 1, modules: ["Astro kalkulátor (ephemeridy)", "Bodygraph 9 center / 64 bran", "Personalizované výklady", "Průvodce chat s pamětí", "Denní tranzity live", "Gene Keys", "Kompozitní mapy vztahů", "I-Ťing encyklopedie", "Stripe premium + kredity", "PDF export", "Affiliate systém", "i18n CZ/EN"] },
                { name: "KatastrOnline", repo: "katastr-online", desc: "Vyhledávání v katastru nemovitostí — oficiální data ČÚZK, 20M+ nemovitostí, cenový odhad, hypoteční kalkulačka a CRM pro makléře.", tags: ["Nástroj", "Data", "Reality"], color: "from-sky-600 to-blue-700", modules: ["Data ČÚZK (20M+ nemovitostí)", "Cenový odhad", "Hypoteční kalkulačka", "CRM pro makléře", "Fulltext vyhledávání"] },
                { name: "Amarex Shop", repo: "amarex", desc: "Brandový e-shop doplňků stravy Amarex — produktové řady, výhodné balíčky, srovnávací tabulka, poradce v chatu, 4.7/5 od 10 000+ zákazníků.", tags: ["E-shop", "Brand", "Zdraví"], color: "from-orange-500 to-amber-600", modules: ["E-shop katalog", "Balíčky + upsell", "Srovnávací tabulka", "Poradce v chatu", "Recenze 4.7/5"] },
                { name: "YouKeto", repo: "youketo", desc: "Infoprodukt funnel pro keto dietu — před/po vizuál, keto recepty PDF zdarma, online poradce a konverzní prodejní stránka.", tags: ["Infoprodukt", "Funnel", "Zdraví"], color: "from-cyan-500 to-emerald-500", modules: ["Prodejní funnel", "Lead magnet (PDF)", "Online poradce", "Před/po vizuál"] },
                { name: "FlyingRadar24", repo: "flyingradar24", desc: "Flight tracker s živou radarovou mapou a porovnáním cen letenek — 500+ tras, 56 aerolinek, 172 letišť, live status letů v reálném čase.", tags: ["Travel", "Live data", "Flight"], color: "from-cyan-500 to-slate-700", modules: ["Živá radarová mapa", "Porovnání cen letenek", "Live status letů", "500+ tras / 172 letišť"] },
                { name: "Silné Libido", repo: "silnelibido", desc: "Konverzní prodejní stránka produktu (silnelibido.cz) — order bump, countdown akce, cenové balíčky, 30denní garance, social proof.", tags: ["Funnel", "Konverze", "Zdraví"], color: "from-rose-500 to-red-600", modules: ["Prodejní funnel", "Order bump", "Countdown akce", "Cenové balíčky", "30denní garance"] },
                { name: "Aktivní Důchodce", repo: "aktivni-duchodce", desc: "Portál pro aktivní seniory (Pardubice a okolí) — aktivity, výlety, pobyty, doprava, seznamka a ergoterapeutický přístup. Vše na jednom místě.", tags: ["Portál", "Senioři", "Služby"], color: "from-teal-500 to-cyan-600", modules: ["Portál služeb", "Aktivity a výlety", "Doprava", "Seznamka"] },
                { name: "NomadWallet", repo: "nomadwallet", desc: "Finanční nástroje pro nomády (EN) — monitoring kreditního skóre, mezinárodní převody peněz, měnová kalkulačka a fintech průvodci.", tags: ["Fintech", "Nástroje", "EN"], color: "from-blue-500 to-blue-700", modules: ["Monitoring kreditního skóre", "Mezinárodní převody", "Měnová kalkulačka", "Fintech průvodci"] },
                { name: "ONYX OS", repo: "leados", desc: "B2B lead generation platforma s persistentním historickým přehledem, chytrými icebreakery a dark-mode dashboardem.", tags: ["SaaS", "B2B", "Dashboard"], color: "from-blue-500 to-indigo-600", stars: 1, modules: ["Lead generation", "Historický přehled", "Icebreakers asistent", "Dark-mode dashboard"] },
                { name: "StoryLiner", repo: "story_liner", desc: "Platforma pro tvorbu videí s inteligentním chatbot asistentem, RAG systémem a persistentní pamětí.", tags: ["Video", "Chatbot", "RAG"], color: "from-orange-500 to-red-600", modules: ["Tvorba videí", "Chatbot asistent", "RAG systém", "Persistentní paměť"] },
                { name: "Deep Sleep Reset", repo: "deep-sleep", desc: "Performance marketing funnel s chronotype kvízem, personalizovaným průvodcem a upsell sekvencí.", tags: ["Funnel", "Marketing", "Quiz"], color: "from-indigo-500 to-violet-600", modules: ["Performance funnel", "Chronotype kvíz", "Personalizovaný průvodce", "Upsell sekvence"] },
                { name: "iBots", repo: "ibots", desc: "Premium landing page pro prodej chatbotů — katalog 77 botů v 7 kategoriích, cenové plány, dark theme se zlatými akcenty.", tags: ["Landing Page", "Katalog"], color: "from-yellow-500 to-amber-600", modules: ["Katalog 77 botů", "7 kategorií", "Cenové plány", "Dark theme"] },
                { name: "VoxelCraft", repo: "voxelcraft", desc: "Voxelová hra ve stylu Minecraftu přímo v prohlížeči — bez instalace, 3D engine, generování světa, stavění v reálném čase.", tags: ["Hra", "WebGL", "Aplikace"], color: "from-green-600 to-lime-600", modules: ["3D WebGL engine", "Generování světa", "Stavění v reálném čase", "Bez instalace"] },
                { name: "Amulets.cz", repo: "my.amulette", desc: "E-shop s ručně vyráběnými orgonitovými pyramidami, amulety a aromaterapeutickými produkty.", tags: ["E-shop", "Produkty"], color: "from-amber-500 to-orange-600", modules: ["E-shop", "Produktové řady", "Objednávky"] },
                { name: "Do Itálie", repo: "do-italie", desc: "Cestovatelský portál Do-italie.cz — průvodce po italských destinacích, tipy a praktické informace.", tags: ["Cestování", "Portál"], color: "from-green-500 to-emerald-600", modules: ["Cestovní portál", "Průvodce destinacemi", "Praktické tipy"] },
                { name: "Influencer Generator", repo: "ai-influencer-generator", desc: "Platforma pro generování ultra-realistických virtuálních influencerů pro TikTok, Instagram a YouTube.", tags: ["Generátor", "Sociální sítě"], color: "from-pink-500 to-rose-600", modules: ["Generátor influencerů", "TikTok / IG / YT", "Realistické vizuály"] },
                { name: "Akční Letenky", repo: "akcni-letenky", desc: "Online travel agency s affiliate systémem pro vyhledávání a prodej leteckých spojení.", tags: ["OTA", "Affiliate", "Travel"], color: "from-sky-500 to-blue-600", modules: ["OTA vyhledávání", "Affiliate systém", "Letecká spojení"] },
                { name: "Affiliate Network Builder", repo: "ai_affiliate_network_builder", desc: "Platforma pro automatizované budování sítě prodejců pro affiliate marketing.", tags: ["Affiliate", "Automatizace"], color: "from-cyan-500 to-teal-600", modules: ["Síť prodejců", "Automatizace", "Affiliate tracking"] },
                { name: "BotHub", repo: "bothub", desc: "Marketplace pro prodej chatbotů s affiliate programem. Premium landing page s pokročilými konverzními prvky.", tags: ["Marketplace", "Affiliate"], color: "from-emerald-500 to-teal-600", modules: ["Marketplace chatbotů", "Affiliate program", "Premium landing"] },
                { name: "ONYX WEB", repo: "optivio", desc: "Webová agentura s automatizovaným procesem od objednávky po nasazení — CRM, chatbot a ONYX OS backend.", tags: ["Agentura", "CRM", "Chatbot"], color: "from-violet-600 to-indigo-700", modules: ["Automatizace objednávek", "CRM", "Chatbot", "ONYX OS backend"] },
              ] as Array<{ name: string; repo: string; desc: string; tags: string[]; color: string; stars?: number; image?: string; modules?: string[] }>).map((project) => (
                <motion.div
                  key={project.repo}
                  variants={fadeUp}
                  whileHover={{ y: -4 }}
                  className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-colors"
                >
                  {project.image ? (
                    <div className="relative h-44 overflow-hidden bg-slate-100">
                      <img
                        src={project.image}
                        alt={project.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                      />
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${project.color}`} />
                    </div>
                  ) : (
                    <div className={`h-2 bg-gradient-to-r ${project.color}`} />
                  )}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-slate-900">{project.name}</h3>
                      {project.stars ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span>{project.stars}</span>
                        </div>
                      ) : null}
                    </div>
                    <p className="text-sm text-slate-500 mb-4 leading-relaxed line-clamp-3">{project.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {project.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                    {project.modules?.length ? (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">Moduly &amp; funkce</div>
                        <div className="flex flex-wrap gap-1.5">
                          {project.modules.slice(0, 6).map(m => (
                            <span key={m} className="inline-flex items-center gap-1 text-[11px] font-medium bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-md">
                              <Check className="w-2.5 h-2.5 shrink-0" /> {m}
                            </span>
                          ))}
                          {project.modules.length > 6 ? (
                            <span className="text-[11px] font-medium text-slate-400 px-1 py-0.5">+{project.modules.length - 6} dalších</span>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </motion.div>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── ZÁVĚREČNÁ VÝZVA + AI ASISTENTI ── */}
        <section className="py-24 bg-gradient-to-br from-violet-950 via-[#1a0a3c] to-slate-900 text-white overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-10 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-1/4 w-56 h-56 bg-indigo-600/20 rounded-full blur-3xl" />
          </div>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
            <Reveal className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Jste připraveni začít?</h2>
              <p className="text-white/70 mb-8 text-lg leading-relaxed max-w-2xl mx-auto">
                Objednejte si konzultaci a získejte doporučení na míru, přehled o vašem obchodním procesu a jasný plán realizace — nebo si vyzkoušejte naše služby 14 dní zdarma vlastním tempem.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-10 rounded-full shadow-lg shadow-violet-900/40" onClick={scrollToContact}>
                  Domluvit konzultaci
                </Button>
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white border border-white/20 hover:border-white/40 rounded-full" onClick={scrollToContact}>
                  14-denní zkušební verze zdarma →
                </Button>
              </div>
            </Reveal>

            <Reveal className="text-center mb-10">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm mb-5">
                <Sparkles className="w-4 h-4 text-violet-300" />
                <span className="text-violet-200">Rozšiřte si to o tým AI asistentů</span>
              </div>
              <h3 className="text-2xl lg:text-3xl font-extrabold mb-3">
                Vy říkáte CO. Oni vědí JAK.
              </h3>
              <p className="text-violet-200 max-w-xl mx-auto">
                8 asistentů nese znalosti nejlepších světových marketérů, připravených 24/7 — a katalog 77+ dalších osobností v iBots.
              </p>
            </Reveal>

            <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: "🧠", name: "Virtuální CMO", desc: "Orchestruje vše" },
                { icon: "✍️", name: "Copywriter", desc: "Ogilvy + Halbert styl" },
                { icon: "📧", name: "Email Sekvence", desc: "Frank Kern přístup" },
                { icon: "🎯", name: "Landing Page", desc: "Hook-Story-Offer" },
                { icon: "🔍", name: "SEO Obsah", desc: "E-E-A-T + konverze" },
                { icon: "📢", name: "Ads Expert", desc: "Meta + Google" },
                { icon: "🧲", name: "Lead Magnet", desc: "List building" },
                { icon: "🎙️", name: "Webinar Script", desc: "Perfect Webinar" },
              ].map(agent => (
                <motion.div key={agent.name} variants={fadeUp} whileHover={{ y: -4, scale: 1.02 }} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                  <div className="text-2xl mb-2">{agent.icon}</div>
                  <div className="font-semibold text-sm text-white">{agent.name}</div>
                  <div className="text-violet-300 text-xs mt-0.5">{agent.desc}</div>
                </motion.div>
              ))}
            </StaggerGrid>

            <div className="text-center flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/agents">
                <Button className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-8 py-4 text-base rounded-full shadow-lg shadow-violet-900/40 w-full sm:w-auto">
                  ✨ Vyzkoušet AI Asistenty zdarma →
                </Button>
              </a>
              <a href="/ibots">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full w-full sm:w-auto">
                  Prohlédnout 77+ AI botů →
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ── AUDIT ZDARMA SECTION ── */}
        <section id="audit-zdarma" className="py-20 bg-gradient-to-br from-violet-900 to-indigo-950 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.15),transparent_50%)] pointer-events-none" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
            <Reveal className="text-center mb-10">
              <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                Audit zdarma
              </span>
              <h2 className="text-3xl lg:text-4xl font-extrabold mt-3 mb-4">Bezplatný audit vašeho webu</h2>
              <p className="text-violet-200/80 max-w-xl mx-auto text-sm leading-relaxed">
                Do 24 hodin vám pošleme 5 konkrétních bodů, kde váš web ztrácí zákazníky a zbytečně přicházíte o poptávky. Stačí zadat URL a e-mail.
              </p>
            </Reveal>

            <Reveal className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30">
              <form onSubmit={handleAuditSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="audit-web" className="text-sm font-medium text-slate-200">URL vašeho webu *</Label>
                    <Input
                      id="audit-web"
                      placeholder="www.mujweb.cz"
                      value={auditData.webUrl}
                      onChange={e => setAuditData({ ...auditData, webUrl: e.target.value })}
                      className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-email" className="text-sm font-medium text-slate-200">Váš e-mail *</Label>
                    <Input
                      id="audit-email"
                      type="email"
                      placeholder="vas@email.cz"
                      value={auditData.email}
                      onChange={e => setAuditData({ ...auditData, email: e.target.value })}
                      className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-violet-500"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="audit-phone" className="text-sm font-medium text-slate-200">Telefon (nepovinné)</Label>
                    <Input
                      id="audit-phone"
                      type="tel"
                      placeholder="+420 123 456 789"
                      value={auditData.phone}
                      onChange={e => setAuditData({ ...auditData, phone: e.target.value })}
                      className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-business" className="text-sm font-medium text-slate-200">Obor / Typ podnikání</Label>
                    <Input
                      id="audit-business"
                      placeholder="Např. Stavební firma, Salon, E-shop"
                      value={auditData.businessType}
                      onChange={e => setAuditData({ ...auditData, businessType: e.target.value })}
                      className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-500 focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="audit-goal" className="text-sm font-medium text-slate-200">Hlavní cíl auditovaného webu</Label>
                    <Select value={auditData.mainGoal} onValueChange={v => setAuditData({ ...auditData, mainGoal: v })}>
                      <SelectTrigger id="audit-goal" className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl focus:border-violet-500">
                        <SelectValue placeholder="Vyberte cíl..." />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 border-slate-850 text-white">
                        <SelectItem value="vice-poptavek">Více poptávek / leadů</SelectItem>
                        <SelectItem value="rezervace">Online rezervace schůzek</SelectItem>
                        <SelectItem value="eshop-prodeje">Zvýšení e-shopových konverzí</SelectItem>
                        <SelectItem value="automatizace">Automatizace procesů a úspora času</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={auditSubmitting}
                  className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3 text-base active:scale-95 transition-all shadow-md shadow-violet-900/10 mt-2"
                >
                  {auditSubmitting ? "Odesílám žádost..." : "Do 24 hodin chci 5 bodů ke zlepšení zdarma →"}
                </Button>
                <p className="text-[11px] text-violet-300/60 text-center">
                  Neplatíte nic. Žádný spam, jen 5 konkrétních praktických tipů na základě ručního auditu naším QA Automation Architectem.
                </p>
              </form>
            </Reveal>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="py-20 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <Reveal className="mb-12">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 text-center">Často kladené otázky</h2>
            </Reveal>
            <StaggerGrid className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setOpenFaqs(p => ({ ...p, [i]: !p[i] }))}
                  >
                    <span className="font-semibold text-slate-900 pr-4">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${openFaqs[i] ? "rotate-180" : ""}`} />
                  </button>
                  {openFaqs[i] && (
                    <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100 pt-4">
                      {faq.a}
                    </div>
                  )}
                </motion.div>
              ))}
            </StaggerGrid>
          </div>
        </section>

        {/* ── CONTACT ── */}
        <section id="contact" ref={contactRef} className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-start">
            <Reveal>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 mb-4">Domluvme si konzultaci</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Vyplňte formulář a my se vám ozveme do 24 hodin s konkrétním návrhem a cenou. Konzultace je zdarma a nezávazná.
              </p>
              <div className="space-y-4">
                {[
                  { icon: "✅", title: "Návrh webu zdarma", desc: "Ukážeme vám, jak by váš web mohl vypadat, ještě před podpisem smlouvy." },
                  { icon: "💳", title: "30% záloha, zbytek po spuštění", desc: "Platíte až když jste spokojeni s výsledkem." },
                  { icon: "⚡", title: "Hotovo za 1–2 týdny", desc: "Žádné měsíce čekání. Rychlá realizace bez kompromisů." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4 p-4 bg-violet-50 rounded-xl">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <div className="font-semibold text-slate-900 text-sm">{title}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-100">
              <h3 className="font-bold text-slate-900 text-xl mb-6">Vyplňte poptávku</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Jméno *</Label>
                    <Input id="name" placeholder="Vaše jméno" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="mt-1 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email *</Label>
                    <Input id="email" type="email" placeholder="vas@email.cz" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="mt-1 rounded-xl" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">Telefon</Label>
                  <Input id="phone" type="tel" placeholder="+420 123 456 789" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label htmlFor="package" className="text-sm font-medium text-slate-700">Jaký balíček vás zajímá? *</Label>
                  <Select value={formData.packageType} onValueChange={v => setFormData({ ...formData, packageType: v })}>
                    <SelectTrigger id="package" className="mt-1 rounded-xl">
                      <SelectValue placeholder="Vyberte balíček" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">ONYX OS Audit (od 4 900 Kč)</SelectItem>
                      <SelectItem value="setup">ONYX OS Setup (od 29 900 Kč)</SelectItem>
                      <SelectItem value="monitoring">ONYX OS Monitoring (1 999 Kč/měs.)</SelectItem>
                      <SelectItem value="konzultace">Pouze konzultace (zdarma na 30 min)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="business" className="text-sm font-medium text-slate-700">O vaší firmě</Label>
                  <Textarea id="business" placeholder="Čím se zabýváte? Co od webu očekáváte?" value={formData.businessDescription} onChange={e => setFormData({ ...formData, businessDescription: e.target.value })} rows={3} className="mt-1 rounded-xl resize-none" />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3 text-base active:scale-95 transition-transform">
                  {isSubmitting ? "Odesílám..." : "Odeslat poptávku →"}
                </Button>
                <p className="text-xs text-slate-400 text-center">Ozveme se do 24 hodin. Konzultace je zdarma a nezávazná.</p>
              </form>
            </Reveal>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="bg-[#0a0520] text-white/60 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8 mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <OptimateoLogo className="h-8" light />
                </div>
                <p className="text-sm leading-relaxed">Optimateo — agentura pro weby, automatizace a data. Pod jednou střechou produkty <span className="text-white/80">ONYX WEB</span> (weby) a <span className="text-white/80">ONYX OS</span> (B2B platforma).</p>
                <div className="flex gap-3 mt-4">
                  {["LinkedIn", "Facebook", "Instagram"].map(s => (
                    <a key={s} href="#" className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-xs transition-colors">{s[0]}</a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Produkty</h4>
                <ul className="space-y-2 text-sm">
                  {["ONYX WEB — weby", "ONYX OS — B2B platforma", "Automatizace", "Lead Generation"].map(i => (
                    <li key={i}><a href="#" className="hover:text-white transition-colors">{i}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Obory</h4>
                <ul className="space-y-2 text-sm">
                  {["Kavárny & restaurace", "Kadeřnictví & salony", "Řemeslníci", "E-shopy"].map(i => (
                    <li key={i}><a href="#" className="hover:text-white transition-colors">{i}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm">Kontakt</h4>
                <ul className="space-y-2 text-sm">
                  <li>poptavka@optimateo.com</li>
                  <li><a href="tel:+420731348984" className="hover:text-white transition-colors">+420 731 348 984</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Případové studie</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
              <p>© 2026 Optimateo. Všechna práva vyhrazena.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-white transition-colors">Zásady ochrany osobních údajů</a>
                <a href="#" className="hover:text-white transition-colors">Obchodní podmínky</a>
              </div>
            </div>
          </div>
        </footer>

        {/* AI prodejní chatbot */}
        <SalesChatWidget />

      </div>{/* END VIEWPORT WRAPPER */}
    </div>
  );
}

// Animované počítadlo — odpočítá od 0 k cílové hodnotě, když se dostane do viewportu.
function CountUp({ to, suffix = "", prefix = "", duration = 1.6 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref}>
      {prefix}{Math.round(val).toLocaleString("cs-CZ")}{suffix}
    </span>
  );
}
