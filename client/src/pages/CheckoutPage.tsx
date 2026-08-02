import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { ArrowLeft, CheckCircle2, CreditCard, QrCode, ShieldCheck, Lock, Sparkles, Building2, User, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

const PRODUCTS = {
  FIX_SPRINT: {
    id: "FIX_SPRINT",
    name: "Fix Sprint (Oprava konverzí & mobilu)",
    fullPrice: 9900,
    deposit: 4950,
    desc: "Rychlá 5-denní oprava konverzních bariér, tlačítka CTA, mobilního zobrazení a formulářů.",
    badge: "Nejpopulárnější záloha",
  },
  ONYX_WEB: {
    id: "ONYX_WEB",
    name: "ONYX WEB (Kompletní konverzní web)",
    fullPrice: 24900,
    deposit: 12450,
    desc: "Kompletní nový konverzní web pro malé firmy, napojení na formuláře a měření Sklik/GA4.",
    badge: "Pro malé firmy",
  },
  ONYX_ESHOP: {
    id: "ONYX_ESHOP",
    name: "ONYX E-SHOP (Online prodej)",
    fullPrice: 39900,
    deposit: 19950,
    desc: "Prodejní e-shop pro lokální gastra, poukazy, produkty a služby.",
    badge: "Online prodej",
  },
};

export default function CheckoutPage() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialProductId = (searchParams.get("product") as keyof typeof PRODUCTS) || "FIX_SPRINT";
  
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[initialProductId] || PRODUCTS.FIX_SPRINT);
  const [paymentType, setPaymentType] = useState<"deposit" | "full">("deposit");
  const [method, setMethod] = useState<"qr" | "card">("qr");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    ic: "",
    note: "",
  });

  const [isPaid, setIsPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const amountToPay = paymentType === "deposit" ? selectedProduct.deposit : selectedProduct.fullPrice;
  
  // Czech SPAYD QR format (Standard České bankovní asociace)
  const spaydString = `SPD*1.0*ACC:CZ3420100000002201948394*AM:${amountToPay.toFixed(2)}*CC:CZK*MSG:Zaloha ${selectedProduct.id} ${formData.email || ""}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(spaydString)}`;

  const createOrder = trpc.orders.create.useMutation();

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.includes("@")) {
      toast.error("Vyplňte prosím platné jméno a e-mail.");
      return;
    }

    setSubmitting(true);
    try {
      await createOrder.mutateAsync({
        inquiryId: 0,
        packageType: selectedProduct.id,
        amountInCzk: amountToPay,
      } as any);

      setIsPaid(true);
      toast.success("Objednávka byla zaznamenána! Přijetí potvrzujeme.");
    } catch {
      toast.error("Při vytváření objednávky došlo k chybě.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-white font-[Plus_Jakarta_Sans,Inter,sans-serif]">
      {/* Header */}
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

      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🔒 Bezpečná platební brána
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 mb-2">
            Objednávka & Okamžitá úhrada
          </h1>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Zaplaťte 50% zálohu QR kódem nebo kartou a spusťte realizaci ještě dnes.
          </p>
        </div>

        {isPaid ? (
          <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold mb-2">Objednávka potvrzena!</h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Děkujeme. Objednávka pro <strong>{selectedProduct.name}</strong> byla zaznamenána. Potvrzení a pokyny jsme poslali na <strong>{formData.email}</strong>.
            </p>
            <Button onClick={() => setLocation("/onboarding")} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl">
              Pokračovat k nahrání podkladů →
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-12 gap-8 items-start">
            {/* Left: Product Choice & Payment Options */}
            <div className="md:col-span-7 space-y-6">
              {/* Product Selection */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold mb-4 flex items-center gap-2 text-white">
                  <Sparkles className="w-4 h-4 text-violet-400" /> Vyberte balíček / službu
                </h2>
                <div className="space-y-3">
                  {Object.values(PRODUCTS).map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => setSelectedProduct(prod)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedProduct.id === prod.id
                          ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-900/20"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white">{prod.name}</span>
                        <span className="text-xs font-extrabold text-violet-300">{prod.fullPrice.toLocaleString("cs-CZ")} Kč</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed mb-2">{prod.desc}</p>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-emerald-400 font-semibold">Záloha 50%: {prod.deposit.toLocaleString("cs-CZ")} Kč</span>
                        <span className="text-slate-500">{prod.badge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deposit vs Full Payment */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold mb-3 text-white">Typ platby</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentType("deposit")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentType === "deposit"
                        ? "border-violet-500 bg-violet-500/10 font-bold"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">50% Záloha</div>
                    <div className="text-sm font-extrabold text-violet-300 mt-1">{selectedProduct.deposit.toLocaleString("cs-CZ")} Kč</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Doplatek po předání webu</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType("full")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      paymentType === "full"
                        ? "border-violet-500 bg-violet-500/10 font-bold"
                        : "border-white/10 bg-white/5 text-slate-400"
                    }`}
                  >
                    <div className="text-xs font-bold text-white">100% Plná úhrada</div>
                    <div className="text-sm font-extrabold text-white mt-1">{selectedProduct.fullPrice.toLocaleString("cs-CZ")} Kč</div>
                    <div className="text-[10px] text-emerald-400 font-semibold mt-0.5">Prioritní dodání</div>
                  </button>
                </div>
              </div>

              {/* Billing Form */}
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl">
                <h2 className="text-base font-bold mb-4 text-white">Fakturační údaje</h2>
                <form onSubmit={handleOrderSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-300">Jméno a příjmení *</Label>
                      <Input
                        required
                        placeholder="Jan Novák"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">E-mail *</Label>
                      <Input
                        required
                        type="email"
                        placeholder="jan@firma.cz"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-slate-300">Telefon</Label>
                      <Input
                        type="tel"
                        placeholder="+420 123 456 789"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-slate-300">Firma / IČO (volitelné)</Label>
                      <Input
                        placeholder="12345678"
                        value={formData.ic}
                        onChange={e => setFormData({ ...formData, ic: e.target.value })}
                        className="bg-slate-900 border-slate-800 text-xs text-white mt-1 rounded-xl"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={submitting} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-xl text-xs mt-4">
                    {submitting ? "Zpracovávám..." : `Potvrdit objednávku (${amountToPay.toLocaleString("cs-CZ")} Kč)`}
                  </Button>
                </form>
              </div>
            </div>

            {/* Right: Payment Execution & QR Code */}
            <div className="md:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 shadow-2xl sticky top-24">
              <h2 className="text-base font-bold mb-4 text-white flex items-center justify-between">
                <span>Způsob platby</span>
                <span className="text-xs text-violet-400 font-extrabold">{amountToPay.toLocaleString("cs-CZ")} Kč</span>
              </h2>

              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMethod("qr")}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    method === "qr"
                      ? "border-violet-500 bg-violet-600 text-white shadow-md"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <QrCode className="w-4 h-4" /> QR Platba
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("card")}
                  className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    method === "card"
                      ? "border-violet-500 bg-violet-600 text-white shadow-md"
                      : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Karta / Online
                </button>
              </div>

              {method === "qr" ? (
                <div className="text-center space-y-4">
                  <div className="bg-white p-4 rounded-2xl inline-block shadow-lg border border-slate-200">
                    <img src={qrImageUrl} alt="QR platba" className="w-48 h-48 mx-auto" />
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-white">Naskenujte v mobilním bankovnictví</p>
                    <p className="text-slate-400">Číslo účtu: <strong className="text-white font-mono">2201948394 / 2010</strong></p>
                    <p className="text-slate-400">Částka: <strong className="text-emerald-400 font-bold">{amountToPay.toLocaleString("cs-CZ")} Kč</strong></p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center justify-center mx-auto">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Stisknutím tlačítka níže budete přesměrováni na zabezpečenou platební bránu pro platbu kartou.
                  </p>
                  <Button onClick={handleOrderSubmit} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs">
                    Zaplatit kartou {amountToPay.toLocaleString("cs-CZ")} Kč →
                  </Button>
                </div>
              )}

              <div className="mt-6 border-t border-white/10 pt-4 text-center">
                <p className="flex items-center justify-center gap-1 text-[10px] text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Bezpečná zálohová úhrada · Garance spokojenosti
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
