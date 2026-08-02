import { useState } from "react";
import { useLocation } from "wouter";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Gift, Users, Copy, CheckCircle2, ShieldCheck, HeartHandshake, Sparkles, DollarSign } from "lucide-react";

export default function PartnerPage() {
  const [, setLocation] = useLocation();
  const [partnerName, setPartnerName] = useState("");
  const [partnerEmail, setPartnerEmail] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.includes("@")) {
      toast.error("Zadejte platný e-mail.");
      return;
    }

    const code = `REF-${partnerName.trim().toUpperCase().replace(/\s+/g, "") || "PARTNER"}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedCode(code);
    toast.success("Váš partnerský kód a odkaz byl vygenerován!");
  };

  const referralUrl = generatedCode ? `https://optimateo.com/audit-zdarma?ref=${generatedCode}` : "";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralUrl);
    toast.success("Partnerský odkaz byl zkopírován do schránky!");
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-white font-[Plus_Jakarta_Sans,Inter,sans-serif]">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <OptimateoLogo className="h-8" light />
          </a>
          <button onClick={() => setLocation("/")} className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Hlavní stránka
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🤝 Partnerský & Doporučovatelský Program
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 mb-4">
            Doporučte OPTIMATEO a získejte 1 500 Kč
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Znáte někoho, komu web nepřináší zákazníky? Doporučte mu náš audit nebo web a odměníme vás oba.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pro doporučeného známého</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Získá <strong>sleva 1 000 Kč</strong> na realizaci balíčku Fix Sprint nebo ONYX WEB + bezplatný prioritní audit do 24 hodin.
            </p>
          </div>

          <div className="bg-gradient-to-br from-violet-900/40 to-indigo-900/40 border border-violet-500/30 rounded-3xl p-6 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center mb-4">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Pro vás (Doporučitele)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Za každého klienta, který objedná web nebo Fix Sprint, získáte <strong>1 500 Kč provizi</strong> nebo <strong>1 měsíc ONYX OS Monitoringu zdarma</strong>.
            </p>
          </div>
        </div>

        {/* Generator Form */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" /> Vygenerovat váš Unikátní Odkaz
          </h2>

          {!generatedCode ? (
            <form onSubmit={handleGenerateLink} className="space-y-4">
              <div>
                <Label className="text-xs text-slate-300">Vaše jméno nebo název firmy *</Label>
                <Input
                  required
                  placeholder="Jan Novák"
                  value={partnerName}
                  onChange={e => setPartnerName(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Kam máme zaslat vyplacení provizí (E-mail) *</Label>
                <Input
                  required
                  type="email"
                  placeholder="jan@firma.cz"
                  value={partnerEmail}
                  onChange={e => setPartnerEmail(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                />
              </div>

              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl text-xs mt-2">
                Získat partnerský odkaz a kód →
              </Button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl">
                <div className="text-xs text-slate-400 mb-1">Váš partnerský kód:</div>
                <div className="text-xl font-mono font-extrabold text-violet-300 mb-3">{generatedCode}</div>
                <div className="flex gap-2">
                  <Input readOnly value={referralUrl} className="bg-slate-900 border-slate-800 text-xs text-white font-mono rounded-xl flex-1" />
                  <Button onClick={copyToClipboard} className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-4 rounded-xl">
                    <Copy className="w-4 h-4 mr-1" /> Zkopírovat
                  </Button>
                </div>
              </div>
              <p className="text-xs text-slate-400">Pošlete tento odkaz známému. Při odeslání auditu z tohoto odkazu se automaticky uplatní vaše provize.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
