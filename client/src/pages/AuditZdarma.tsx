import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { trackSklikConversion } from "@/lib/sklik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { ArrowLeft, ArrowRight, Check, ShieldCheck, ChevronDown, ChevronUp, TrendingDown, Zap, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Pricing ladder ──────────────────────────────────────────────────────────
const pricingLadder = [
    {
        step: "01",
        name: "Mini audit zdarma",
        price: "0 Kč",
        desc: "Zjistíte 3 hlavní příčiny, proč web ztrácí zákazníky. Bez závazků.",
        color: "border-slate-300 bg-slate-50",
        textColor: "text-slate-700",
        stepColor: "bg-slate-200 text-slate-600",
        current: true,
    },
    {
        step: "02",
        name: "ONYX OS Audit",
        price: "4 900–14 900 Kč",
        desc: "Kompletní PDF report, 30min konzultace, konkrétní plán oprav. Platí jako záloha na Setup.",
        color: "border-violet-300 bg-violet-50",
        textColor: "text-violet-900",
        stepColor: "bg-violet-100 text-violet-700",
        current: false,
    },
    {
        step: "03",
        name: "ONYX OS Setup",
        price: "29 900–90 000 Kč",
        desc: "Web + CRM + automatizace. Systém, který sbírá leady, zapisuje je a spouští follow-up.",
        color: "border-violet-400 bg-violet-100",
        textColor: "text-violet-900",
        stepColor: "bg-violet-200 text-violet-800",
        current: false,
    },
    {
        step: "04",
        name: "ONYX OS Monitoring",
        price: "1 999 Kč/měs.",
        desc: "Měsíční report, A/B testování, optimalizace konverzí, správa hostingu a CRM.",
        color: "border-violet-600 bg-violet-600",
        textColor: "text-white",
        stepColor: "bg-violet-700 text-white",
        current: false,
    },
];

// ─── Mock audit report preview ────────────────────────────────────────────────
const mockIssues = [
    {
        icon: TrendingDown,
        color: "text-red-500 bg-red-50 border-red-200",
        title: "Slabé CTA tlačítko",
        detail: "Výzva k akci se ztrácí ve spodní části stránky. 73 % uživatelů ji nikdy neuvidí.",
        priority: "Kritické",
        priorityColor: "bg-red-100 text-red-700",
    },
    {
        icon: Zap,
        color: "text-amber-500 bg-amber-50 border-amber-200",
        title: "Rychlost načítání: 6,2 s",
        detail: "Benchmark je 2,5 s. Každá sekunda zpoždění sníží konverze o ~7 %. Obrázky nejsou komprimovány.",
        priority: "Vysoká",
        priorityColor: "bg-amber-100 text-amber-700",
    },
    {
        icon: BarChart3,
        color: "text-blue-500 bg-blue-50 border-blue-200",
        title: "Formulář má 8 polí",
        detail: "Optimální počet je 3–4 pole. Každé navíc snižuje pravděpodobnost odeslání o ~11 %.",
        priority: "Střední",
        priorityColor: "bg-blue-100 text-blue-700",
    },
];

export default function AuditZdarma() {
    const [, setLocation] = useLocation();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [formData, setFormData] = useState({
        webUrl: "",
        email: "",
        phone: "",
        businessType: "",
        mainGoal: "",
    });

    const createInquiry = trpc.inquiries.create.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.webUrl.trim() || !formData.email.trim()) {
            toast.error("Vyplňte prosím URL vašeho webu a kontaktní e-mail.");
            return;
        }

        setSubmitting(true);
        try {
            await createInquiry.mutateAsync({
                name: `Audit: ${formData.webUrl}`,
                email: formData.email,
                phone: formData.phone,
                businessDescription: `Obor: ${formData.businessType || "neuvedeno"}. Cíl: ${formData.mainGoal || "neuvedeno"}`,
                packageType: "audit-zdarma",
                source: "audit-zdarma-landing",
                details: {
                    webUrl: formData.webUrl,
                    businessType: formData.businessType,
                    mainGoal: formData.mainGoal,
                    auditRequested: true,
                },
            } as any);

            trackSklikConversion({ orderId: `audit-${Date.now()}`, value: 500 });
            setSubmitted(true);
            toast.success("Žádost o audit byla úspěšně odeslána!");
        } catch (err) {
            toast.error("Něco se nepovedlo. Zkuste to prosím znovu.");
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col relative bg-[#06070a] text-white">
                <AuroraBackground />
                <Header />
                <div className="flex-1 flex items-center justify-center px-4">
                    <div className="max-w-md w-full text-center bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-10 shadow-2xl shadow-black/50">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <Check className="w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-extrabold mb-3 text-white">Žádost přijata!</h1>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Náš specialista se pustí do analýzy webu <strong className="text-white">{formData.webUrl}</strong>. Výsledek se 3–5 konkrétními body vám pošleme na <strong className="text-white">{formData.email}</strong> do 24 hodin.
                        </p>

                        {/* Upsell suggestion */}
                        <div className="bg-violet-500/10 border border-violet-400/30 rounded-2xl p-4 mb-6 text-left">
                            <p className="text-xs font-bold text-violet-300 uppercase tracking-wider mb-1">Následující krok</p>
                            <p className="text-sm text-white/80">Po obdržení auditu vám nabídneme <strong className="text-white">ONYX OS Audit od 4 900 Kč</strong> — kompletní PDF report s plánem oprav a 30min konzultací.</p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button onClick={() => setLocation("/")} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 font-semibold transition-colors">
                                Zpět na hlavní web
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative bg-[#06070a] text-white">
            <AuroraBackground />
            <Header />

            <main className="flex-1 px-4 py-16 z-10">
                <div className="max-w-5xl mx-auto">

                    {/* ── Hero ── */}
                    <div className="text-center mb-12">
                        <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Diagnóza webu zdarma
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4 leading-tight">
                            Zjistěte, kde váš web{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                                ztrácí zákazníky.
                            </span>
                        </h1>
                        <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
                            Většina webů ztrácí 95 %+ návštěvníků. Ukážeme vám 3 konkrétní bariéry na vašem webu — zcela zdarma a nezávazně.
                        </p>
                    </div>

                    {/* ── Mock report preview toggle ── */}
                    <div className="mb-10">
                        <button
                            onClick={() => setShowReport(!showReport)}
                            className="mx-auto flex items-center gap-2 text-sm text-violet-300 hover:text-violet-100 border border-violet-500/30 bg-violet-500/10 rounded-full px-4 py-2 transition-colors"
                        >
                            {showReport ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {showReport ? "Skrýt" : "Zobrazit"} ukázkový audit report
                        </button>

                        <AnimatePresence>
                            {showReport && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden mt-4"
                                >
                                    <div className="max-w-3xl mx-auto bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 shadow-2xl">
                                        <div className="flex items-center gap-3 mb-5 border-b border-white/10 pb-4">
                                            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-xs font-bold text-white">📋</div>
                                            <div>
                                                <p className="text-xs text-slate-500 font-mono">ONYX OS Audit — ukázka reportu</p>
                                                <p className="text-sm font-bold text-white">www.prikladnyfirma.cz</p>
                                            </div>
                                            <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 font-semibold">Ukázka</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
                                            {[
                                                { v: "2.1 %", l: "Konverzní poměr", trend: "↓ pod průměr" },
                                                { v: "6.2 s", l: "Rychlost načítání", trend: "↓ příliš pomalé" },
                                                { v: "8", l: "Polí ve formuláři", trend: "↓ příliš mnoho" },
                                            ].map((m, i) => (
                                                <div key={i} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                                                    <div className="text-xl font-extrabold text-white">{m.v}</div>
                                                    <div className="text-[10px] text-slate-500 mt-0.5">{m.l}</div>
                                                    <div className="text-[10px] text-red-400 font-medium mt-1">{m.trend}</div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-3">
                                            {mockIssues.map((issue, i) => (
                                                <div key={i} className={`border rounded-2xl p-4 flex gap-3 items-start ${issue.color}`}>
                                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <issue.icon className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-sm font-bold">{issue.title}</span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${issue.priorityColor}`}>{issue.priority}</span>
                                                        </div>
                                                        <p className="text-xs leading-relaxed opacity-80">{issue.detail}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-center text-xs text-slate-600 mt-4">
                                            Toto je zkrácená ukázka. Plný report obsahuje 15–20 bodů s konkrétními opravami.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ── Main grid: form + sidebar ── */}
                    <div className="grid md:grid-cols-12 gap-8 items-start mb-20">
                        {/* Form */}
                        <div className="md:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30">
                            <h2 className="text-lg font-bold mb-1 text-white">Údaje pro vypracování auditu</h2>
                            <p className="text-xs text-slate-500 mb-5">Vyplňte formulář a do 24 hodin vám pošleme analýzu.</p>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="webUrl" className="text-xs font-semibold text-slate-300">URL vašeho webu *</Label>
                                    <Input
                                        id="webUrl"
                                        placeholder="www.nazevfirmy.cz"
                                        value={formData.webUrl}
                                        onChange={e => setFormData({ ...formData, webUrl: e.target.value })}
                                        className="mt-1.5 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="email" className="text-xs font-semibold text-slate-300">Kam máme poslat výsledek? *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="vas@email.cz"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="mt-1.5 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-300">Telefon (volitelné — pro konzultaci výsledků)</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+420 123 456 789"
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="mt-1.5 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="businessType" className="text-xs font-semibold text-slate-300">Obor podnikání</Label>
                                        <Input
                                            id="businessType"
                                            placeholder="Stavebnictví, e-shop..."
                                            value={formData.businessType}
                                            onChange={e => setFormData({ ...formData, businessType: e.target.value })}
                                            className="mt-1.5 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="mainGoal" className="text-xs font-semibold text-slate-300">Cíl webu</Label>
                                        <Select value={formData.mainGoal} onValueChange={v => setFormData({ ...formData, mainGoal: v })}>
                                            <SelectTrigger id="mainGoal" className="mt-1.5 bg-slate-900/60 border-slate-800 text-white rounded-xl focus:border-violet-500">
                                                <SelectValue placeholder="Vyberte cíl..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                                <SelectItem value="leads">Více poptávek / konverzí</SelectItem>
                                                <SelectItem value="brand">Prezentace, budování značky</SelectItem>
                                                <SelectItem value="speed">Zrychlení / moderní design</SelectItem>
                                                <SelectItem value="automation">Automatizace schůzek a procesů</SelectItem>
                                                <SelectItem value="realestate">Realitní makléř — poptávky na prohlídky</SelectItem>
                                                <SelectItem value="clinic">Klinika / ordinace — rezervace</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3.5 text-sm active:scale-95 transition-all shadow-lg shadow-violet-900/20 mt-4"
                                >
                                    {submitting ? "Odesílám..." : "Zjistit, kde ztrácím zákazníky →"}
                                </Button>

                                <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500 mt-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> GDPR · žádný spam · výsledky do 24 hodin
                                </p>
                            </form>
                        </div>

                        {/* Sidebar */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <span>💡</span> Co v auditu dostanete?
                                </h3>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    {[
                                        ["Konverzní bariéry", "Prvky, které odrazují zákazníky od kontaktu."],
                                        ["Rychlost načítání", "Core Web Vitals — mobil a desktop."],
                                        ["Formuláře & CTA", "Jsou nastavené tak, aby přesvědčily?"],
                                        ["SEO & texty", "Je srozumitelná vaše přidaná hodnota?"],
                                        ["Mobilní kompatibilita", "60–80 % návštěv přichází z mobilu."],
                                    ].map(([title, desc]) => (
                                        <li key={title} className="flex items-start gap-2">
                                            <span className="text-violet-400 font-bold mt-0.5">✓</span>
                                            <span><strong>{title}:</strong> {desc}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl p-5">
                                <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-violet-300">
                                    <span>⏰</span> Proč to děláme zdarma?
                                </h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Chceme vám ukázat reálnou ztrátu na vašem webu. Pokud se vám výsledky líbí, rádi probereme plný <strong className="text-white">ONYX OS Audit</strong> za 4 900 Kč — kompletní report s plánem oprav. Pokud ne, tipy si nechejte a předejte svému programátorovi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Pricing ladder ── */}
                    <div className="mb-12">
                        <div className="text-center mb-8">
                            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest bg-violet-500/10 border border-violet-500/20 px-3 py-1 rounded-full">
                                Cenový schod
                            </span>
                            <h2 className="text-2xl font-extrabold text-white mt-4 mb-2">Od zájmu k systému</h2>
                            <p className="text-slate-500 text-sm">Začněte zdarma. Každý další krok přináší měřitelný výsledek.</p>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-stretch">
                            {pricingLadder.map((item, i) => (
                                <div key={i} className="flex-1 flex flex-col">
                                    <div className={`flex-1 border-2 rounded-2xl p-5 flex flex-col transition-all ${item.color}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.stepColor}`}>{item.step}</span>
                                            {item.current && (
                                                <span className="text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">Jste zde</span>
                                            )}
                                        </div>
                                        <h3 className={`font-bold text-sm mb-1 ${item.textColor}`}>{item.name}</h3>
                                        <p className={`text-xs font-bold mb-2 ${item.current ? "text-violet-600" : item.textColor} opacity-90`}>{item.price}</p>
                                        <p className={`text-xs leading-relaxed flex-1 ${item.textColor} opacity-75`}>{item.desc}</p>
                                    </div>
                                    {i < pricingLadder.length - 1 && (
                                        <div className="flex justify-center py-2 md:hidden">
                                            <ArrowRight className="w-5 h-5 text-slate-600 rotate-90" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="text-center mt-6">
                            <p className="text-xs text-slate-600">zájem → diagnóza → implementace → měsíční monitoring výsledků</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}

function Header() {
    return (
        <header className="bg-white/5 backdrop-blur-md border-b border-white/10 z-20 relative">
            <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                    <OptimateoLogo className="h-8" light />
                </a>
                <a href="/" className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Hlavní stránka
                </a>
            </div>
        </header>
    );
}

function AuroraBackground() {
    return (
        <div className="absolute inset-0 -z-10 overflow-hidden bg-[#06070a]" aria-hidden="true">
            <div className="absolute -left-[10%] top-1/4 w-[90vmin] h-[90vmin] rounded-full bg-violet-900/20 blur-[120px] pointer-events-none" />
            <div className="absolute -right-[10%] top-1/2 w-[90vmin] h-[90vmin] rounded-full bg-indigo-900/25 blur-[120px] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.1),rgba(15,23,42,0.8))]" />
        </div>
    );
}
