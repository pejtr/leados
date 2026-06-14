import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OptivioLogo } from "@/components/OptivioLogo";
import { ArrowRight, ArrowLeft, Check, ShieldCheck } from "lucide-react";

// ─── Static options ────────────────────────────────────────────────────────────

const WEBSITE_TYPES = [
  { id: "Jednostránkový", label: "Jednostránkový", price: "3 490 Kč" },
  { id: "Vícestránkový", label: "Vícestránkový", price: "4 990 Kč" },
  { id: "Speciální", label: "Speciální", price: "od 10 000 Kč" },
];

const GOALS = [
  "Získat poptávky / kontakty",
  "Prodávat online (e-shop)",
  "Rezervace / objednání termínu",
  "Prezentace firmy",
  "Budovat značku",
];

const MATERIALS = [
  "Mám logo",
  "Mám texty",
  "Mám fotky",
  "Mám doménu",
  "Potřebuji vše vytvořit",
];

const BUDGETS = ["do 5 000 Kč", "5 000 – 10 000 Kč", "10 000 – 25 000 Kč", "25 000 Kč+", "Nevím / poraďte"];
const TIMELINES = ["Co nejdříve", "Do měsíce", "Do 3 měsíců", "Jen zjišťuji"];

// Maps a demo template id (?obor=) to a readable obor label for prefill
const OBOR_LABELS: Record<string, string> = {
  kavarna: "Kavárna / Restaurace",
  kadernictvi: "Kadeřnictví / Salon krásy",
  elektrikar: "Elektrikář / Řemeslo",
  fitness: "Fitness / Sport",
  reality: "Reality / Finance",
  lekar: "Lékař / Zdravotnictví",
  eshop: "E-shop / E-commerce",
  kurzy: "Online kurzy / Vzdělávání",
  prodejni: "Infoprodukt / Prodejní web",
};

const STEPS = ["O vás", "Váš web", "Podklady", "Detaily"];

// ─── Small UI helpers ───────────────────────────────────────────────────────────

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-3 mb-10">
      {STEPS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  active
                    ? "bg-violet-600 text-white"
                    : done
                    ? "bg-violet-100 text-violet-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`mt-1.5 text-[11px] ${active ? "text-slate-900 font-semibold" : "text-slate-400"}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-8 sm:w-16 h-0.5 -mt-5 ${done ? "bg-violet-300" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function TextField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-violet-600">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
      />
    </div>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
        selected
          ? "border-violet-400 bg-violet-50 text-violet-700 ring-1 ring-violet-200"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
      }`}
    >
      <span className="flex items-center gap-2">
        <span
          className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
            selected ? "bg-violet-600 border-violet-600" : "border-slate-300"
          }`}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </span>
        {children}
      </span>
    </button>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function DotaznikPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Prefill from demo (?obor=kavarna&firma=Café Momento)
  const { oborId, firmaPrefill } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return { oborId: params.get("obor") || "", firmaPrefill: params.get("firma") || "" };
  }, []);

  // Step 1 — O vás
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [websiteType, setWebsiteType] = useState("");

  // Step 2 — Váš web
  const [goals, setGoals] = useState<string[]>([]);
  const [pages, setPages] = useState("");

  // Step 3 — Podklady
  const [materials, setMaterials] = useState<string[]>([]);
  const [inspiration, setInspiration] = useState("");

  // Step 4 — Detaily
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (oborId && OBOR_LABELS[oborId]) setCompany(OBOR_LABELS[oborId]);
    if (firmaPrefill) setCompany(firmaPrefill);
  }, [oborId, firmaPrefill]);

  const createInquiry = trpc.inquiries.create.useMutation();

  const toggle = (arr: string[], v: string, set: (a: string[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const step1Valid = name.trim() && phone.trim() && email.trim() && websiteType;

  const next = () => {
    if (step === 0 && !step1Valid) {
      toast.error("Vyplňte prosím jméno, telefon, e-mail a typ webu.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!step1Valid) {
      toast.error("Chybí základní kontaktní údaje.");
      setStep(0);
      return;
    }
    try {
      await createInquiry.mutateAsync({
        name,
        email,
        phone,
        businessDescription: company,
        packageType: websiteType,
        source: oborId ? `dotaznik:demo:${oborId}` : "dotaznik",
        details: {
          goals,
          pages,
          materials,
          inspiration,
          budget,
          timeline,
          message,
        },
      } as any);
      setSubmitted(true);
    } catch (e) {
      toast.error("Něco se nepovedlo. Zkuste to prosím znovu nebo nám zavolejte.");
    }
  };

  // ── Thank-you screen ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-md text-center bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-3">Děkujeme, máme to!</h1>
            <p className="text-slate-500 mb-8">
              Připravíme vám návrh na míru a ozveme se do 24 hodin na <strong className="text-slate-700">{email}</strong>.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setLocation("/")} className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6">
                Zpět na úvod
              </Button>
              <Button onClick={() => setLocation("/demo")} variant="outline" className="rounded-full px-6">
                Prohlédnout šablony
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="inline-flex items-center gap-2 text-amber-600 text-sm font-semibold mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Návrh zdarma — platíte až po schválení
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Dotazník pro <span className="text-violet-600">váš web</span>
            </h1>
            <p className="text-slate-500 mt-2">Zabere to ~3 minuty. Díky tomu připravíme návrh přesně na míru.</p>
          </div>

          <Stepper current={step} />

          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* STEP 1 — O vás */}
            {step === 0 && (
              <div className="space-y-5">
                <StepHeading title="Krok 1 — O vás" desc="Základní kontaktní údaje, abychom věděli, s kým komunikujeme." />
                <TextField label="Firma / obor podnikání" value={company} onChange={setCompany} placeholder="Např. Novák s.r.o nebo elektroinstalace" />
                <TextField label="Vaše jméno" required value={name} onChange={setName} placeholder="Jan Novák" />
                <div className="grid sm:grid-cols-2 gap-5">
                  <TextField label="Telefon" required value={phone} onChange={setPhone} placeholder="+420 777 123 456" type="tel" />
                  <TextField label="E-mail" required value={email} onChange={setEmail} placeholder="jan@priklad.cz" type="email" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Typ webu <span className="text-violet-600">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {WEBSITE_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setWebsiteType(t.id)}
                        className={`rounded-xl border px-3 py-4 text-center transition-all ${
                          websiteType === t.id
                            ? "border-violet-400 bg-violet-50 ring-1 ring-violet-200"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="font-bold text-slate-800 text-sm">{t.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{t.price}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Váš web */}
            {step === 1 && (
              <div className="space-y-5">
                <StepHeading title="Krok 2 — Váš web" desc="Co má web zvládnout a co na něm bude." />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Hlavní cíl webu</label>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {GOALS.map((g) => (
                      <Chip key={g} selected={goals.includes(g)} onClick={() => toggle(goals, g, setGoals)}>
                        {g}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Jaké sekce / stránky chcete?</label>
                  <textarea
                    value={pages}
                    onChange={(e) => setPages(e.target.value)}
                    rows={3}
                    placeholder="Např. Úvod, O nás, Služby, Ceník, Galerie, Kontakt…"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 3 — Podklady */}
            {step === 2 && (
              <div className="space-y-5">
                <StepHeading title="Krok 3 — Podklady" desc="Co už máte připravené? Zbytek vyřešíme za vás." />
                <div className="grid sm:grid-cols-2 gap-3">
                  {MATERIALS.map((m) => (
                    <Chip key={m} selected={materials.includes(m)} onClick={() => toggle(materials, m, setMaterials)}>
                      {m}
                    </Chip>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Líbí se vám nějaký web? (inspirace)</label>
                  <textarea
                    value={inspiration}
                    onChange={(e) => setInspiration(e.target.value)}
                    rows={2}
                    placeholder="Vložte odkazy na weby, které se vám líbí…"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* STEP 4 — Detaily */}
            {step === 3 && (
              <div className="space-y-5">
                <StepHeading title="Krok 4 — Detaily" desc="Poslední otázky, ať návrh sedí i rozpočtem a termínem." />
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Orientační rozpočet</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {BUDGETS.map((b) => (
                      <Chip key={b} selected={budget === b} onClick={() => setBudget(b)}>
                        {b}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Kdy to potřebujete?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIMELINES.map((t) => (
                      <Chip key={t} selected={timeline === t} onClick={() => setTimeline(t)}>
                        {t}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Chcete něco dodat?</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Cokoliv, co bychom měli vědět…"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Footer nav */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 0 ? (
                <Button variant="ghost" onClick={back} className="text-slate-500 hover:text-slate-800">
                  <ArrowLeft className="w-4 h-4 mr-1.5" /> Zpět
                </Button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full px-7 py-2.5">
                  Pokračovat <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  onClick={submit}
                  disabled={createInquiry.isPending}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full px-7 py-2.5"
                >
                  {createInquiry.isPending ? "Odesílám…" : "Odeslat poptávku"} <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </div>
          </div>

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-400 mt-5">
            <ShieldCheck className="w-3.5 h-3.5" /> Krok {step + 1} z {STEPS.length} · Vaše údaje jsou v bezpečí.
          </p>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <a href="/">
          <OptivioLogo className="h-8" />
        </a>
        <span className="text-sm text-slate-400">Dotazník pro vytvoření webu</span>
      </div>
    </header>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-1">{desc}</p>
    </div>
  );
}
