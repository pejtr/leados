import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Menu, X, Shield, Zap, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function HomeVariantC() {
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
      });
      toast.success("Poptávka odeslána! Brzy se vám ozveme.");
      form.reset();
    } catch (error) {
      toast.error("Chyba při odesílání poptávky");
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Navigation */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-white/80 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/manus-storage/optivio-logo_d4a4757c.png" alt="OPTIVIO" className="h-8" />
          </div>
          <div className="hidden md:flex gap-8">
            <a href="#comparison" className="text-sm font-medium hover:text-emerald-600 transition">Porovnání</a>
            <a href="#trust" className="text-sm font-medium hover:text-emerald-600 transition">Proč nás</a>
            <a href="#contact" className="text-sm font-medium hover:text-emerald-600 transition">Kontakt</a>
          </div>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            Začít zdarma
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-teal-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-slate-900">
            Důvěryhodné weby,<br />
            <span className="text-emerald-600">které budují značku</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Profesionální web za 3 490 Kč. Bez agentury. Bez dlouhého čekání. Bez skrytých poplatků.
          </p>
          <div className="flex gap-4 mb-12">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-6 text-lg">
              Chci nový web zdarma
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg border-emerald-600 text-emerald-600 hover:bg-emerald-50">
              Podívat se na příklady
            </Button>
          </div>

          {/* Trust Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-600">24 h</p>
              <p className="text-sm text-slate-600">dodání mini auditu</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">Ruční</p>
              <p className="text-sm text-slate-600">QA kontrola webu</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">100%</p>
              <p className="text-sm text-slate-600">bez závazku</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section id="comparison" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Proč OPTIVIO?</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-emerald-50 border-b border-slate-200">
                  <th className="text-left py-4 px-6 font-bold">Kritérium</th>
                  <th className="text-center py-4 px-6 font-bold text-emerald-600">OPTIVIO</th>
                  <th className="text-center py-4 px-6 font-bold text-slate-400">Tradiční agentura</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-4 px-6">Cena webu</td>
                  <td className="text-center py-4 px-6"><span className="font-bold text-emerald-600">3 490 Kč</span></td>
                  <td className="text-center py-4 px-6"><span className="text-slate-400">20 000+ Kč</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-4 px-6">Doba realizace</td>
                  <td className="text-center py-4 px-6"><span className="font-bold text-emerald-600">1–3 týdny</span></td>
                  <td className="text-center py-4 px-6"><span className="text-slate-400">1–3 měsíce</span></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-4 px-6">Originální design</td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="py-4 px-6">Podpora & údržba</td>
                  <td className="text-center py-4 px-6"><span className="font-bold text-emerald-600">179 Kč/m</span></td>
                  <td className="text-center py-4 px-6"><span className="text-slate-400">1 000+ Kč/m</span></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="py-4 px-6">Garance spokojenosti</td>
                  <td className="text-center py-4 px-6"><Check className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                  <td className="text-center py-4 px-6">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section id="trust" className="py-20 px-4 bg-emerald-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Proč nám věřit?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-emerald-200">
              <Shield className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Bezpečný proces</h3>
              <p className="text-slate-600">30% záloha, zbytek po spuštění. Vaše peníze jsou chráněny.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-emerald-200">
              <Zap className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Rychlost</h3>
              <p className="text-slate-600">Váš web je hotov za 1–3 týdny. Bez čekání na agenturu.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-sm border border-emerald-200">
              <Users className="w-12 h-12 text-emerald-600 mb-4" />
              <h3 className="font-bold text-lg mb-2">Podpora</h3>
              <p className="text-slate-600">Technická podpora 24/7. Vždy jsme tu pro vás.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Co říkají naši klienti</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Tomáš V.", company: "Autoservis", quote: "Za 4 dny jsme měli hotový web. Profesionální přístup, férová cena." },
              { name: "Jana P.", company: "Jazyková škola", quote: "Přihlašování na kurzy přes web nám ušetřilo hodiny administrativy." },
              { name: "Martin B.", company: "Malíř pokojů", quote: "Web mi přináší 5–8 poptávek měsíčně. Vrátil se mi za 2 měsíce." },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-emerald-50 p-6 rounded-lg border border-emerald-200">
                <p className="text-slate-600 mb-4">"{testimonial.quote}"</p>
                <p className="font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-emerald-600 font-medium">{testimonial.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section ref={contactRef} className="py-20 px-4 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Začněte s 14-denní verzí zdarma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Vaše jméno" className="w-full px-4 py-3 rounded-lg text-slate-900" required />
            <input type="email" name="email" placeholder="vas@email.cz" className="w-full px-4 py-3 rounded-lg text-slate-900" required />
            <input type="tel" name="phone" placeholder="+420 123 456 789" className="w-full px-4 py-3 rounded-lg text-slate-900" />
            <textarea name="business" placeholder="Čím se zabýváte?" className="w-full px-4 py-3 rounded-lg text-slate-900 h-24"></textarea>
            <Button type="submit" className="w-full bg-white text-emerald-600 hover:bg-slate-100 py-6 text-lg font-bold">
              Odeslat poptávku <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-4">© 2026 OPTIVIO. Všechna práva vyhrazena.</p>
          <div className="flex justify-center gap-6">
            <a href="#" className="hover:text-white transition">Zásady ochrany</a>
            <a href="#" className="hover:text-white transition">Obchodní podmínky</a>
            <a href="#" className="hover:text-white transition">Kontakt</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
