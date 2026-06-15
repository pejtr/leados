import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Menu, X, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function HomeVariantD() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const contactRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const createInquiry = trpc.inquiries.create.useMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const businessDescription = formData.get("business") as string;

    if (!name || !email) {
      toast.error("Vyplňte prosím jméno a email");
      return;
    }

    try {
      await createInquiry.mutateAsync({
        name,
        email,
        phone,
        businessDescription,
        packageType: undefined,
        details: undefined,
        source: "web-variant-d",
      });
      toast.success("Poptávka odeslána! Brzy se vám ozveme.");
      form.reset();
    } catch (error) {
      toast.error("Chyba při odesílání poptávky");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <style>{`
        @keyframes glow-pulse {
          0%, 100% { text-shadow: 0 0 20px rgba(236, 72, 153, 0.5), 0 0 40px rgba(168, 85, 247, 0.3); }
          50% { text-shadow: 0 0 30px rgba(236, 72, 153, 0.8), 0 0 60px rgba(168, 85, 247, 0.5); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .glow-text { animation: glow-pulse 3s ease-in-out infinite; }
        .gradient-bg { background: linear-gradient(-45deg, #ec4899, #a855f7, #06b6d4, #ec4899); background-size: 400% 400%; animation: gradient-shift 15s ease infinite; }
        .neon-border { border: 2px solid; border-image: linear-gradient(135deg, #ec4899, #a855f7) 1; }
        .neon-glow { box-shadow: 0 0 20px rgba(236, 72, 153, 0.5), inset 0 0 20px rgba(168, 85, 247, 0.1); }
      `}</style>

      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-950/95 backdrop-blur-md border-b border-pink-500/20' : 'bg-slate-950/50 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/optivio-logo_d4a4757c.png" alt="OPTIVIO" className="h-8" />
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-sm font-medium hover:text-pink-400 transition">Funkce</a>
            <a href="#pricing" className="text-sm font-medium hover:text-pink-400 transition">Ceny</a>
            <a href="#contact" className="text-sm font-medium hover:text-pink-400 transition">Kontakt</a>
          </div>
          <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white neon-glow" onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            Začít zdarma
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="gradient-bg py-32 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10">
          <div className="inline-block mb-6 px-4 py-2 rounded-full border border-pink-500/50 bg-pink-500/10 backdrop-blur-sm">
            <span className="text-pink-300 text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Nová generace webů
            </span>
          </div>
          <h1 className="text-6xl md:text-7xl font-black mb-6 glow-text">
            Váš web,<br />
            <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">vaše budoucnost</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl">
            Profesionální web za 3 490 Kč. Bez agentury. Bez dlouhého čekání. Bez skrytých poplatků.
          </p>
          <div className="flex gap-4 mb-12">
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-6 text-lg neon-glow">
              Chci nový web zdarma
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg border-cyan-400 text-cyan-400 hover:bg-cyan-400/10">
              Podívat se na příklady
            </Button>
          </div>

          {/* Stats with neon */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-lg bg-pink-500/10 border border-pink-500/30 backdrop-blur-sm">
              <p className="text-3xl font-bold text-pink-400">50+</p>
              <p className="text-sm text-slate-400">projektů</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30 backdrop-blur-sm">
              <p className="text-3xl font-bold text-purple-400">5 let</p>
              <p className="text-sm text-slate-400">zkušenosti</p>
            </div>
            <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-sm">
              <p className="text-3xl font-bold text-cyan-400">98%</p>
              <p className="text-sm text-slate-400">spokojenost</p>
            </div>
          </div>
        </div>

        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center glow-text">Proč OPTIVIO?</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Rychlé spuštění", desc: "Váš web je hotov za 1–3 týdny. Bez dlouhého čekání." },
              { title: "Férová cena", desc: "3 490 Kč za web. Bez skrytých poplatků. Bez překvapení." },
              { title: "Originální design", desc: "Každý web je na míru. Žádné šablony. Vaše značka." },
              { title: "Podpora & údržba", desc: "179 Kč/měsíc za hosting, SSL, zálohování, support." },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg bg-slate-800/50 border border-pink-500/20 backdrop-blur-sm hover:border-pink-500/50 transition neon-glow">
                <h3 className="font-bold text-lg mb-2 text-pink-400">{feature.title}</h3>
                <p className="text-slate-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-slate-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-12 text-center glow-text">Jednoduché ceny</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 rounded-lg bg-slate-800/50 border border-purple-500/30 backdrop-blur-sm">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Lite Web</h3>
              <p className="text-4xl font-bold text-pink-400 mb-6">3 490 Kč</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> Jednostránkový web</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> Responzivní design</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> SEO optimalizace</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 neon-glow">Začít</Button>
            </div>
            <div className="p-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/50 backdrop-blur-sm neon-glow">
              <h3 className="text-2xl font-bold mb-4 text-pink-400">Basic Web</h3>
              <p className="text-4xl font-bold text-cyan-400 mb-6">4 999 Kč</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> Vše z Lite Web</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> Vícestrany (až 8)</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-cyan-400" /> Galerie / Portfolio</li>
              </ul>
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 neon-glow">Začít</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section ref={contactRef} className="py-20 px-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center glow-text">Začněte s 14-denní verzí zdarma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Vaše jméno" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-pink-500/30 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none" required />
            <input type="email" name="email" placeholder="vas@email.cz" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-pink-500/30 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none" required />
            <input type="tel" name="phone" placeholder="+420 123 456 789" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-pink-500/30 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none" />
            <textarea name="business" placeholder="Čím se zabýváte?" className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-pink-500/30 text-white placeholder-slate-500 focus:border-pink-500 focus:outline-none h-24"></textarea>
            <Button type="submit" className="w-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 py-6 text-lg font-bold neon-glow">
              Odeslat poptávku <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-500 py-12 border-t border-pink-500/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">© 2026 OPTIVIO. Všechna práva vyhrazena.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-pink-400 transition">Zásady ochrany</a>
            <a href="#" className="hover:text-pink-400 transition">Obchodní podmínky</a>
            <a href="#" className="hover:text-pink-400 transition">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
