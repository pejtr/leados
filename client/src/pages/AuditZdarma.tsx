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
import { ArrowLeft, Check, ShieldCheck, HelpCircle } from "lucide-react";

export default function AuditZdarma() {
    const [, setLocation] = useLocation();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
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
                        <p className="text-slate-350 text-sm mb-8 leading-relaxed">
                            Náš QA Automation Architect a marketingový specialista se pustí do analýzy vašeho webu <strong>{formData.webUrl}</strong>. Výsledek s 5 konkrétními body vám pošleme na <strong>{formData.email}</strong> do 24 hodin.
                        </p>
                        <div className="flex flex-col gap-3 justify-center">
                            <Button onClick={() => setLocation("/")} className="bg-violet-600 hover:bg-violet-750 text-white rounded-xl py-3 font-semibold transition-colors">
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
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-10">
                        <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            Optimalizace Konverzí zdarma
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4 leading-tight">
                            Získejte 5 tipů pro <span className="hero-neon-text text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">zvýšení prodejů</span> na vašem webu
                        </h1>
                        <p className="text-slate-350 text-base max-w-xl mx-auto leading-relaxed">
                            Většina webů ztrácí 95 %+ návštěvníků. Ukážeme vám konkrétní bariéry na vašem současném webu, kvůli kterým přicházíte o poptávky. Zcela zdarma a nezávazně.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-12 gap-8 items-start">
                        {/* Form */}
                        <div className="md:col-span-7 bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/30">
                            <h2 className="text-lg font-bold mb-4 text-white">Údaje pro vypracování auditu</h2>
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
                                    <Label htmlFor="phone" className="text-xs font-semibold text-slate-300">Telefon (volitelné pro konzultaci výsledků)</Label>
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
                                            <SelectContent className="bg-slate-900 border-slate-850 text-white">
                                                <SelectItem value="leads">Více poptávek / konverzí</SelectItem>
                                                <SelectItem value="brand">Prezentace, budování značky</SelectItem>
                                                <SelectItem value="speed">Zrychlení / moderní design</SelectItem>
                                                <SelectItem value="automation">Automatizace schůzek a procesů</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3.5 text-sm active:scale-95 transition-all shadow-lg shadow-violet-900/20 mt-4"
                                >
                                    {submitting ? "Odesílám..." : "Získat 5 bodů ke zlepšení zdarma →"}
                                </Button>

                                <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500 mt-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Všechna data jsou zpracována v souladu s GDPR. Žádný spam.
                                </p>
                            </form>
                        </div>

                        {/* Core benefits sidebar */}
                        <div className="md:col-span-5 space-y-4">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                                <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                                    <span>💡</span> Co v auditu získáte?
                                </h3>
                                <ul className="space-y-2.5 text-xs text-slate-300">
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-400 font-bold">✓</span>
                                        <span><strong>Konverzní bariéry:</strong> Konkrétní prvky, které odrazují zákazníky.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-400 font-bold">✓</span>
                                        <span><strong>Analýza rychlosti:</strong> Změření načítání na mobilech (Core Web Vitals).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-400 font-bold">✓</span>
                                        <span><strong>Mobilní kompatibilita:</strong> Vyhodnocení použitelnosti na telefonech.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-400 font-bold">✓</span>
                                        <span><strong>SEO & texty:</strong> Posouzení, zda je srozumitelná vaše přidaná hodnota.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-violet-400 font-bold">✓</span>
                                        <span><strong>Formuláře & integrace:</strong> Posouzení spolehlivosti sběru zákazníků.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="bg-gradient-to-br from-violet-900/30 to-indigo-900/30 border border-violet-500/20 rounded-2xl p-5">
                                <h3 className="font-bold text-sm mb-2 flex items-center gap-2 text-violet-300">
                                    <span>⏰</span> Proč to děláme zdarma?
                                </h3>
                                <p className="text-xs text-slate-350 leading-relaxed font-normal">
                                    Chceme vám ukázat reálný přínos spolupráce s OPTIMATEO na základě praktických faktů a přidané hodnoty. Pokud se vám naše tipy budou líbit, rádi s vámi probereme možnost kompletní realizace webu a nasazení ONYX OS. Pokud ne, tipy vám zůstanou a můžete je předat svému programátorovi.
                                </p>
                            </div>
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
