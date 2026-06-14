import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Menu, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { SalesChatWidget } from "@/components/SalesChatWidget";

export default function HomeVariantB() {
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
        source: "web-variant-b",
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
            <a href="#benefits" className="text-sm font-medium hover:text-green-600 transition">Výhody</a>
            <a href="#pricing" className="text-sm font-medium hover:text-green-600 transition">Ceny</a>
            <a href="#faq" className="text-sm font-medium hover:text-green-600 transition">FAQ</a>
          </div>
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => contactRef.current?.scrollIntoView({ behavior: 'smooth' })}>
            Začít s 14-denní verzí zdarma
          </Button>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-green-50 py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-slate-900">
            Důvěryhodné weby,<br />
            <span className="text-green-600">které budují značku</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Profesionální web za 3 490 Kč s vším, co potřebujete. Bez agentury. Bez dlouhého čekání. Bez skrytých poplatků.
          </p>
          <div className="flex gap-4 mb-12">
            <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
              Chci nový web zdarma
            </Button>
            <Button variant="outline" className="px-8 py-6 text-lg">
              Podívat se na příklady
            </Button>
          </div>

          {/* Benefits Grid */}
          <div id="benefits" className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Rychlé spuštění</h3>
                <p className="text-slate-600">Váš web je hotov za 1–3 týdny. Bez dlouhého čekání na agenturu.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Férová cena</h3>
                <p className="text-slate-600">3 490 Kč za web. Bez skrytých poplatků. Bez překvapení na faktuře.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Originální design</h3>
                <p className="text-slate-600">Každý web je na míru. Žádné šablony. Vaše značka, vaše pravidla.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg mb-2">Podpora a údržba</h3>
                <p className="text-slate-600">179 Kč/měsíc za hosting, SSL, zálohování a technickou podporu.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Proč OPTIVIO?</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-green-200">
                  <th className="text-left py-4 px-4 font-bold">Kritérium</th>
                  <th className="text-center py-4 px-4 font-bold text-green-600">OPTIVIO</th>
                  <th className="text-center py-4 px-4 font-bold text-slate-400">Tradiční agentura</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4">Cena webu</td>
                  <td className="text-center py-4 px-4 font-bold text-green-600">3 490 Kč</td>
                  <td className="text-center py-4 px-4 text-slate-400">20 000+ Kč</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4">Doba realizace</td>
                  <td className="text-center py-4 px-4 font-bold text-green-600">1–3 týdny</td>
                  <td className="text-center py-4 px-4 text-slate-400">1–3 měsíce</td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4">Originální design</td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="py-4 px-4">Podpora & údržba</td>
                  <td className="text-center py-4 px-4 font-bold text-green-600">179 Kč/m</td>
                  <td className="text-center py-4 px-4 text-slate-400">1 000+ Kč/m</td>
                </tr>
                <tr>
                  <td className="py-4 px-4">Garance spokojenosti</td>
                  <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-600 mx-auto" /></td>
                  <td className="text-center py-4 px-4">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Co říkají naši klienti</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Tomáš V.", company: "Autoservis", quote: "Za 4 dny jsme měli hotový web. Profesionální přístup, férová cena." },
              { name: "Jana P.", company: "Jazyková škola", quote: "Přihlašování na kurzy přes web nám ušetřilo hodiny administrativy." },
              { name: "Martin B.", company: "Malíř pokojů", quote: "Web mi přináší 5–8 poptávek měsíčně. Vrátil se mi za 2 měsíce." },
            ].map((testimonial) => (
              <div key={testimonial.name} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
                <p className="text-slate-600 mb-4">"{testimonial.quote}"</p>
                <p className="font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-sm text-slate-500">{testimonial.company}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Jednoduché ceny</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="border-2 border-slate-200 rounded-lg p-8">
              <h3 className="text-2xl font-bold mb-4">Lite Web</h3>
              <p className="text-4xl font-bold text-green-600 mb-6">3 490 Kč</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Jednostránkový web</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Responzivní design</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> SEO optimalizace</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Kontaktní formulář</li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700">Začít</Button>
            </div>
            <div className="border-2 border-green-600 rounded-lg p-8 bg-green-50">
              <h3 className="text-2xl font-bold mb-4">Basic Web</h3>
              <p className="text-4xl font-bold text-green-600 mb-6">4 999 Kč</p>
              <ul className="space-y-3 mb-8">
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Vše z Lite Web</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Vícestrany (až 8)</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Galerie / Portfolio</li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-green-600" /> Google Analytics</li>
              </ul>
              <Button className="w-full bg-green-600 hover:bg-green-700">Začít</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section ref={contactRef} className="py-20 px-4 bg-gradient-to-br from-green-600 to-green-700 text-white">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Začněte s 14-denní verzí zdarma</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Vaše jméno" className="w-full px-4 py-3 rounded-lg text-slate-900" required />
            <input type="email" name="email" placeholder="vas@email.cz" className="w-full px-4 py-3 rounded-lg text-slate-900" required />
            <input type="tel" name="phone" placeholder="+420 123 456 789" className="w-full px-4 py-3 rounded-lg text-slate-900" />
            <textarea name="business" placeholder="Čím se zabýváte?" className="w-full px-4 py-3 rounded-lg text-slate-900 h-24"></textarea>
            <Button type="submit" className="w-full bg-white text-green-600 hover:bg-slate-100 py-6 text-lg font-bold">
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

      {/* AI prodejní chatbot */}
      <SalesChatWidget />
    </div>
  );
}
