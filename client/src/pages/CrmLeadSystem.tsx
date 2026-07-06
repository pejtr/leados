import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { trackSklikConversion } from "@/lib/sklik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { ArrowLeft, Check, ShieldCheck, Database, Zap, Sparkles, MessageSquare, LayoutDashboard } from "lucide-react";

export default function CrmLeadSystem() {
    const [, setLocation] = useLocation();
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        company: "",
        description: "",
    });

    const createInquiry = trpc.inquiries.create.useMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
            toast.error("Vyplňte prosím jméno, e-mail a telefon.");
            return;
        }

        setSubmitting(true);
        try {
            await createInquiry.mutateAsync({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                businessDescription: `Firma: ${formData.company || "neuvedeno"}. Zpráva: ${formData.description || "neuvedeno"}`,
                packageType: "crm-lead-system",
                source: "crm-lead-system-landing",
                details: {
                    company: formData.company,
                    description: formData.description,
                    crmLeadSystemRequested: true,
                },
            } as any);

            trackSklikConversion({ orderId: `crm-lead-${Date.now()}`, value: 1000 });
            setSubmitted(true);
            toast.success("Vaše poptávka byla úspěšně odeslána!");
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
                        <h1 className="text-2xl font-extrabold mb-3 text-white">Úspěšně odesláno!</h1>
                        <p className="text-slate-350 text-sm mb-8 leading-relaxed">
                            Děkujeme za zájem o ONYX OS a Lead Systém. Ozveme se vám do 24 hodin na číslo <strong>{formData.phone}</strong> nebo e-mail <strong>{formData.email}</strong>, abychom probrali možnosti implementace.
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
        <div className="min-h-screen flex flex-col relative bg-[#06070a] text-white overflow-x-hidden">
            <AuroraBackground />
            <Header />

            <main className="flex-grow z-10">
                {/* Hero Section */}
                <section className="py-16 md:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        {/* Left Column Text */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-400/30 rounded-full px-4 py-1.5 text-xs font-semibold text-violet-300">
                                <span className="w-1.5 h-1.5 bg-violet-450 rounded-full animate-pulse" />
                                ONYX OS Core Technology
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
                                Změňte váš web v automatický <span className="hero-neon-text text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">stroj na poptávky</span>
                            </h1>
                            <p className="text-slate-350 text-base sm:text-lg leading-relaxed max-w-xl">
                                Obyčejný web je dnes málo. S propojovacím systémem ONYX OS získáte plně integrovanou databázi kontaktů, automatický follow-up, AI asistenci a okamžitý reporting výkonu na jednom místě.
                            </p>

                            {/* Core Pillars Grid */}
                            <div className="grid sm:grid-cols-2 gap-4 pt-6">
                                {[
                                    { icon: Database, title: "Integrované CRM", text: "Každá poptávka z webu je ihned zaevidována do přehledného B2B CRM bez nutnosti programování." },
                                    { icon: Zap, title: "Okamžité Automaty", text: "Automatické uvítací e-maily, upozornění na Slack / e-mail, SMS notifikace do 30 sekund." },
                                    { icon: MessageSquare, title: "AI Chatbot 24/7", text: "Komunikace se zákazníky, sběr leadů a zodpovídání dotazů 24 hodin denně, 7 dní v týdnu." },
                                    { icon: LayoutDashboard, title: "Výkonnostní Report", text: "Přehledné statistiky konverzí, sledování odkud chodí nejvíce poptávek." },
                                ].map((item, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center shrink-0">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-white">{item.title}</h3>
                                            <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Column Form Card */}
                        <div className="lg:col-span-5">
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl shadow-black/40">
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold">Mám zájem o CRM & Lead Systém</h2>
                                    <p className="text-slate-400 text-xs mt-1">Vyplňte formulář a my se ozveme s nezávaznou nabídkou.</p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <Label htmlFor="name" className="text-xs font-semibold text-slate-350">Vaše jméno *</Label>
                                        <Input
                                            id="name"
                                            placeholder="Jméno a příjmení"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="email" className="text-xs font-semibold text-slate-350">E-mail *</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="vas@email.cz"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="phone" className="text-xs font-semibold text-slate-350">Telefon *</Label>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                placeholder="+420 123 456 789"
                                                value={formData.phone}
                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label htmlFor="company" className="text-xs font-semibold text-slate-350">Firma / Webová adresa</Label>
                                        <Input
                                            id="company"
                                            placeholder="Název firmy nebo www.mujweb.cz"
                                            value={formData.company}
                                            onChange={e => setFormData({ ...formData, company: e.target.value })}
                                            className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="description" className="text-xs font-semibold text-slate-350">Jaké systémy nebo weby potřebujete propojit?</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Např. propojit poptávky s e-mailem, zprovoznit B2B CRM, automatizovat uvítací kampaň..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            rows={3}
                                            className="mt-1 bg-slate-900/60 border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-violet-500 resize-none text-xs"
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold rounded-xl py-3 text-sm active:scale-95 transition-all shadow-lg shadow-violet-900/20 mt-2"
                                    >
                                        {submitting ? "Odesílám..." : "Chci nezávaznou konzultaci ZDARMA →"}
                                    </Button>

                                    <p className="flex items-center justify-center gap-1.5 text-center text-[10px] text-slate-500 mt-2">
                                        <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Ozveme se do 24 hodin s konkrétním řešením.
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>
                </section>
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
            <div className="absolute -right-[10%] top-1/2 w-[90vmin] h-[90vmin] rounded-full bg-cyan-900/10 blur-[130px] pointer-events-none" />
            <div className="absolute inset-0 bg-[#06070a]/90" />
        </div>
    );
}
