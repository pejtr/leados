import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, Upload, FileText, Globe, Palette, Sparkles } from "lucide-react";

export default function OnboardingPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [data, setData] = useState({
    brandName: "",
    primaryColor: "#7c3aed",
    domain: "",
    hosting: "",
    targetAudience: "",
    mainOffer: "",
    contactEmail: "",
    contactPhone: "",
    notes: "",
  });

  const createInquiry = trpc.inquiries.create.useMutation();

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1 && !data.brandName.trim()) {
      toast.error("Zadejte název vaší značky nebo firmy.");
      return;
    }
    if (step < 3) setStep((step + 1) as any);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.contactEmail.includes("@")) {
      toast.error("Zadejte platný kontaktní e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      await createInquiry.mutateAsync({
        name: `Onboarding: ${data.brandName}`,
        email: data.contactEmail,
        phone: data.contactPhone,
        businessDescription: `Audience: ${data.targetAudience}. Offer: ${data.mainOffer}`,
        packageType: "onboarding-submitted",
        source: "onboarding-portal",
        details: data,
      } as any);

      setCompleted(true);
      toast.success("Podklady pro tvorbu webu byly úspěšně odeslány!");
    } catch {
      toast.error("Nepodařilo se uložit podklady.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-white font-[Plus_Jakarta_Sans,Inter,sans-serif]">
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <OptimateoLogo className="h-8" light />
          </a>
          <button onClick={() => setLocation("/")} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Zpět na web
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🚀 Klientský portal — Nahrání podkladů
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-2">
            Podklady pro váš nový web
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Vyplňte základní údaje o vaší značce, abychom mohli ihned začít stavět.
          </p>
        </div>

        {completed ? (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-10 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Podklady přijaty!</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Děkujeme. Náš tým začal připravovat koncept pro <strong>{data.brandName}</strong>. Do 48 hodin vám pošleme první ukázku rozvržení.
            </p>
            <Button onClick={() => setLocation("/dashboard")} className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-xl text-xs">
              Přejít do Klientského dashboardu →
            </Button>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
              {[
                { s: 1, label: "Brand & Značka", icon: Palette },
                { s: 2, label: "Doména & Technika", icon: Globe },
                { s: 3, label: "Nabídka & Kontakty", icon: FileText },
              ].map((item) => (
                <div key={item.s} className={`flex items-center gap-2 text-xs font-bold ${step === item.s ? "text-violet-300" : "text-slate-500"}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${step === item.s ? "bg-violet-600 text-white" : "bg-white/5 border border-white/10 text-slate-500"}`}>
                    {item.s}
                  </div>
                  <span className="hidden sm:inline">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Step 1 */}
            {step === 1 && (
              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300">Název firmy nebo značky *</Label>
                  <Input
                    required
                    placeholder="Např. Kavárna U Parku / Střechy Novák"
                    value={data.brandName}
                    onChange={e => setData({ ...data, brandName: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Preferovaná hlavní barva (volitelné)</Label>
                  <div className="flex gap-3 items-center mt-1">
                    <Input
                      type="color"
                      value={data.primaryColor}
                      onChange={e => setData({ ...data, primaryColor: e.target.value })}
                      className="w-12 h-10 bg-slate-900 border-slate-800 rounded-xl p-1 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-400">{data.primaryColor}</span>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Odkaz na logo / podklady (Google Drive / zásilka)</Label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={data.notes}
                    onChange={e => setData({ ...data, notes: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                  />
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-xs mt-4">
                  Pokračovat na doménu a přístupy →
                </Button>
              </form>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <form onSubmit={handleNext} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300">Adresa vašeho webu / doména</Label>
                  <Input
                    placeholder="www.mojefirma.cz"
                    value={data.domain}
                    onChange={e => setData({ ...data, domain: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-300">Kde máte koupenou doménu? (Wedos, ForPSI, Subreg...)</Label>
                  <Input
                    placeholder="Wedos / ForPSI"
                    value={data.hosting}
                    onChange={e => setData({ ...data, hosting: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(1)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs">
                    ← Zpět
                  </Button>
                  <Button type="submit" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl text-xs">
                    Pokračovat na nabídku a kontakty →
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs text-slate-300">Hlavní nabídka (Co prodáváte?)</Label>
                  <Textarea
                    placeholder="Popište stručně vaše hlavní služby a ceny..."
                    value={data.mainOffer}
                    onChange={e => setData({ ...data, mainOffer: e.target.value })}
                    className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-slate-300">Kontaktní e-mail pro schválení *</Label>
                    <Input
                      required
                      type="email"
                      placeholder="vas@email.cz"
                      value={data.contactEmail}
                      onChange={e => setData({ ...data, contactEmail: e.target.value })}
                      className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">Telefon na odpovědnou osobu</Label>
                    <Input
                      type="tel"
                      placeholder="+420 123 456 789"
                      value={data.contactPhone}
                      onChange={e => setData({ ...data, contactPhone: e.target.value })}
                      className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" onClick={() => setStep(2)} className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-xl text-xs">
                    ← Zpět
                  </Button>
                  <Button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs">
                    {submitting ? "Odesílám..." : "Odeslat podklady a zahájit vývoj →"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
