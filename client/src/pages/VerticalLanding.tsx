import { useMemo } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ChevronRight, BarChart3, Target, Search, Zap, SearchCheck } from "lucide-react";
import { motion } from "framer-motion";
import { CORE_OFFERS, formatOfferPrice } from "@shared/service-catalog";

type Vertical = {
    slug: string;
    eyebrow: string;
    headline: string;
    subheadline: string;
    ctaText: string;
    pains: string[];
    diagnosticFocus: string;
    stats: { value: string; label: string }[];
    target: string;
};

const VERTICALS: Record<string, Vertical> = {
    reality: {
        slug: "reality",
        eyebrow: "Pro realitní makléře",
        headline: "Weby pro makléře, které sbírají poptávky po odhadu nemovitosti.",
        subheadline: "Většina makléřských webů je jen vizitka. Postavíme vám prodejní nástroj s automatizací a CRM, který mění návštěvníky na exkluzivní náběry.",
        ctaText: "Získat audit realitního webu",
        pains: [
            "Platíte za kliky, ze kterých nejsou náběry",
            "Leady se ztrácí v e-mailech bez automatického follow-upu",
            "Web nebuduje vaši autoritu v lokálním trhu",
        ],
        diagnosticFocus: "Odhalíme trhliny v náběrovém trychtýři",
        stats: [
            { value: "4.2x", label: "Vyšší konverze díky lead magnetům" },
            { value: "100%", label: "Automatický follow-up" },
        ],
        target: "realitní makléři"
    },
    kliniky: {
        slug: "kliniky",
        eyebrow: "Pro zubní a estetické kliniky",
        headline: "Proměňte návštěvníky z mobilu na pacienty ve vaší čekárně.",
        subheadline: "Rezervace on-line 24/7, přehledné ceníky a důvěryhodná značka. OPTIMATEO propojí web s ONYX OS tak, aby snížil administrativu a pomohl vytížit ordinaci.",
        ctaText: "Získat audit webu vaší kliniky",
        pains: [
            "Pacienti kvůli nepřehlednému webu raději volají recepci",
            "Nefunguje vám domlouvání prémiových (vysokomaržových) zákroků",
            "Konkurence působí on-line profesionálněji",
        ],
        diagnosticFocus: "Zmapujeme cesty pacientů k rezervaci",
        stats: [
            { value: "24/7", label: "Bezobslužný příjem rezervací" },
            { value: "89%", label: "Návštěv na webech klinik je z mobilu" },
        ],
        target: "zubní a estetické kliniky"
    },
    sluzby: {
        slug: "sluzby",
        eyebrow: "Pro lokální služby a řemesla",
        headline: "Budujte silný lokální brand a sbírejte zakázky na autopilota.",
        subheadline: "Lidé ve vašem městě hledají vaše služby právě teď. Náskok získá ten, kdo má rychlý, lokálně SEO optimalizovaný web s bleskovou výzvou na hovor či poptávku.",
        ctaText: "Získat audit pro lokální služby",
        pains: [
            "Konkurenti v okolí vám berou nejlepší zakázky z vyhledávačů",
            "Vyhazujete peníze za neoptimalizované lokální reklamy",
            "Na vašem webu je těžké na mobilu najít tlačítko pro rychlý hovor",
        ],
        diagnosticFocus: "Skóre lokálního výkonu a rychlosti na mobilu",
        stats: [
            { value: "3x", label: "Více přímých poptávek z Google" },
            { value: "73%", label: "Lidí z mobilu chce ihned volat" },
        ],
        target: "lokální a řemeslné služby"
    }
};

const DEFAULT_VERTICAL = VERTICALS.sluzby;

function getSegmentFromPath(location: string) {
    return location.split("/").filter(Boolean).pop() || DEFAULT_VERTICAL.slug;
}

export default function VerticalLanding() {
    const [location] = useLocation();
    const segment = useMemo(() => VERTICALS[getSegmentFromPath(location)] ?? DEFAULT_VERTICAL, [location]);
    const auditUrl = `/audit-zdarma?segment=${segment.slug}`;

    return (
        <div className="min-h-screen bg-[#0a0520] text-white">
            {/* ── HEADER ── */}
            <header className="sticky top-0 z-40 bg-[#0a0520]/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <OptimateoLogo className="h-8" light />
                    </a>
                    <a href={auditUrl} className="hidden sm:block">
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-semibold px-6 py-2 h-auto">
                            Získat mini audit zdarma
                        </Button>
                    </a>
                </div>
            </header>

            {/* ── HERO ── */}
            <section className="relative pt-16 pb-24 overflow-hidden overflow-x-hidden border-b border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15)_0%,transparent_70%)] opacity-50" />

                <div className="max-w-6xl mx-auto px-4 relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                    <div className="max-w-2xl">
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-900/40 border border-violet-500/30 text-violet-300 text-xs font-bold uppercase tracking-wider mb-6">
                                <Search className="w-3.5 h-3.5" /> Profit Playbook: {segment.eyebrow}
                            </span>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
                                {segment.headline}
                            </h1>

                            <p className="text-lg text-slate-400 mb-8 leading-relaxed max-w-xl">
                                {segment.subheadline}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <a href={auditUrl} className="w-full sm:w-auto">
                                    <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full py-6 px-8 text-base font-bold shadow-xl shadow-violet-900/30">
                                        {segment.ctaText}
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </a>
                                <p className="sm:hidden text-xs text-center text-slate-500 uppercase tracking-wider font-semibold">Tento krok je zcela zdarma</p>
                            </div>

                            <div className="mt-10 grid grid-cols-2 gap-6 pt-8 border-t border-white/10">
                                {segment.stats.map((stat, i) => (
                                    <div key={i}>
                                        <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">{stat.value}</p>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider leading-tight">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* DIAGNOSTIC GRAPHIC */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        className="relative hidden lg:block"
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/20 to-cyan-400/20 rounded-3xl blur-3xl -z-10" />
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">
                            <div className="w-12 h-12 rounded-xl bg-violet-600/30 border border-violet-500/50 flex items-center justify-center text-violet-300 mb-6">
                                <SearchCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Diagnostický přístup</h3>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Nevytváříme "jen vizitku". Nejprve zdarma projdeme váš stávající web a odhalíme {segment.diagnosticFocus}. Až z toho navrhneme systém, který funguje jako váš digitální obchoďák.
                            </p>

                            <ul className="space-y-3">
                                {[
                                    "Kompletní analýza ztrátovosti konverzí",
                                    "Odhalení kritických chyb v UX a textech",
                                    "Měření trhlin z mobilních a desktop návštěv"
                                ].map((item, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-slate-300">
                                        <CheckCircle2 className="w-5 h-5 text-violet-400 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 bg-black/40 rounded-xl p-4 border border-white/5 flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Cena mini auditu</p>
                                    <p className="text-xl font-bold text-emerald-400">0 Kč</p>
                                </div>
                                <a href={auditUrl} className="text-sm font-semibold text-violet-300 hover:text-white transition-colors flex items-center gap-1">
                                    Chci audit <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── PAIN POINTS (PŘESTAŇTE PŘICHÁZET O ZÁKAZNÍKY) ── */}
            <section className="py-24 max-w-6xl mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Proč váš web nefunguje, jak má?</h2>
                    <p className="text-slate-400">Třebaže máte návštěvnost, {segment.target} přicházejí o peníze na základních chybách.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {segment.pains.map((pain, i) => (
                        <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-violet-500/30 transition-all hover:-translate-y-1">
                            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center font-bold mb-4">
                                {i + 1}
                            </div>
                            <p className="font-semibold text-white leading-relaxed">{pain}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── PROFIT PLAYBOOK FUNNEL ── */}
            <section className="py-24 bg-white/[0.02] border-y border-white/10">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">

                        <div className="order-2 lg:order-1">
                            <div className="space-y-4 relative">
                                <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-violet-600/50 to-transparent" />

                                {[
                                    { step: "01", name: CORE_OFFERS.MINI_AUDIT.name, price: formatOfferPrice(CORE_OFFERS.MINI_AUDIT), desc: "Najdeme 3 největší slabá místa. Neplatíte nic, dostanete konkrétní tipy.", active: true },
                                    { step: "02", name: CORE_OFFERS.ONYX_OS_AUDIT.name, price: formatOfferPrice(CORE_OFFERS.ONYX_OS_AUDIT), desc: "Detailní audit fungování firmy na webu s prioritizovaným plánem.", active: false },
                                    { step: "03", name: CORE_OFFERS.ONYX_OS_SETUP.name, price: formatOfferPrice(CORE_OFFERS.ONYX_OS_SETUP), desc: "Vytvoříme konverzní stránky, nastavíme automatizaci a CRM systém na míru.", active: false },
                                    { step: "04", name: CORE_OFFERS.MONITORING.name, price: formatOfferPrice(CORE_OFFERS.MONITORING), desc: "Zajištění správy, údržby, hostingu a měsíční konzultace nad daty z automatizace.", active: false },
                                ].map((s, i) => (
                                    <div key={i} className={`relative flex gap-6 p-5 rounded-2xl border transition-all ${s.active ? "bg-violet-900/30 border-violet-500 text-white" : "bg-white/5 border-white/10 text-slate-400"}`}>
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-black tracking-widest shrink-0 relative z-10 ${s.active ? "bg-violet-600 text-white" : "bg-[#1f1738] text-slate-500"}`}>
                                            {s.step}
                                        </div>
                                        <div>
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-lg font-bold ${s.active ? "text-white" : "text-slate-300"}`}>{s.name}</h4>
                                            </div>
                                            <p className={`text-xs font-bold mb-2 ${s.active ? "text-cyan-400" : "text-slate-500"}`}>{s.price}</p>
                                            <p className="text-sm leading-relaxed">{s.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="order-1 lg:order-2">
                            <span className="text-violet-400 font-bold uppercase tracking-widest text-xs mb-4 block">Férový přístup</span>
                            <h2 className="text-3xl lg:text-4xl font-extrabold mb-6">Nejdřív zjistíme nemoc, pak píšeme recept.</h2>
                            <p className="text-slate-400 leading-relaxed mb-6">
                                Neprodáváme vám rovnou nejdražší webdesign. Nejprve uděláme rychlou bezplatnou analýzu, kterou odhalíme ty nejakutnější problémy z hlediska {segment.diagnosticFocus}.
                            </p>
                            <p className="text-slate-400 leading-relaxed mb-8">
                                Teprve, pokud budete souhlasit s našimi zjištěními, můžeme připravit komplexní strategii pro vaši digitální infrastrukturu obsahující automatizaci, umělou inteligenci a CRM.
                            </p>
                            <a href={auditUrl}>
                                <Button className="rounded-full bg-white text-slate-900 hover:bg-slate-200 px-8 py-6 text-base font-bold">
                                    Provést zhodnocení zdarma <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </a>
                        </div>

                    </div>
                </div>
            </section>

            {/* ── FOOTER SIMPLE ── */}
            <footer className="py-12 border-t border-white/10 text-center text-slate-500 text-sm">
                <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <OptimateoLogo className="h-6" light /> <span className="text-white/40">Profit Playbook</span>
                    </div>
                    <div>© 2026 Optimateo. Všechna práva vyhrazena.</div>
                </div>
            </footer>
        </div>
    );
}
