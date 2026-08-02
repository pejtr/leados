import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { trackSklikConversion } from "@/lib/sklik";
import { isChannelConsented } from "@/components/CookieConsentBanner";
import { trackLinkedInConversion } from "@/lib/linkedin";
import { trackEvent, trackFormStart } from "@/lib/ab-test";
import { getAttribution } from "@/lib/attribution";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { ArrowLeft, ArrowRight, CalendarClock, Check, ShieldCheck } from "lucide-react";
import { CORE_OFFERS, SERVICE_TERMS, formatOfferPrice, formatWebPackagePrice } from "@shared/service-catalog";

const DRAFT_KEY = "optimateo_questionnaire_draft_v2";
const BOOKING_TIMES = ["09:00", "13:00", "16:00"] as const;

const WEBSITE_TYPES = [
  { id: "Jednostránkový", label: "Jednostránkový", price: formatWebPackagePrice("LITE_WEB") },
  { id: "Vícestránkový", label: "Vícestránkový", price: formatWebPackagePrice("BASIC_WEB") },
  { id: "Speciální", label: "Web + CRM na míru", price: formatOfferPrice(CORE_OFFERS.ONYX_OS_SETUP) },
] as const;

const GOALS = [
  "Získat poptávky / kontakty",
  "Prodávat online",
  "Rezervace / objednání termínu",
  "Prezentace firmy",
  "Budovat značku",
];

const MATERIALS = ["Mám logo", "Mám texty", "Mám fotky", "Mám doménu", "Potřebuji vše vytvořit"];
const BUDGETS = ["do 5 000 Kč", "5 000–10 000 Kč", "10 000–25 000 Kč", "25 000 Kč+", "Nevím / poraďte"];
const TIMELINES = ["Co nejdříve", "Do měsíce", "Do 3 měsíců", "Jen zjišťuji"];
const STEPS = ["Firma a cíl", "Rozsah", "Podklady", "Kontakt"];

const OBOR_LABELS: Record<string, string> = {
  kavarna: "Kavárna / restaurace",
  kadernictvi: "Kadeřnictví / salon krásy",
  elektrikar: "Elektrikář / řemeslo",
  fitness: "Fitness / sport",
  reality: "Reality / finance",
  lekar: "Lékař / zdravotnictví",
  eshop: "E-shop / e-commerce",
  kurzy: "Online kurzy / vzdělávání",
  prodejni: "Infoprodukt / prodejní web",
};

type QuestionnaireForm = {
  company: string;
  goals: string[];
  websiteType: string;
  pages: string;
  materials: string[];
  inspiration: string;
  budget: string;
  timeline: string;
  name: string;
  email: string;
  phone: string;
  message: string;
};

const EMPTY_FORM: QuestionnaireForm = {
  company: "",
  goals: [],
  websiteType: "",
  pages: "",
  materials: [],
  inspiration: "",
  budget: "",
  timeline: "",
  name: "",
  email: "",
  phone: "",
  message: "",
};

function loadDraft(): { form: QuestionnaireForm; step: number } {
  if (typeof window === "undefined") return { form: EMPTY_FORM, step: 0 };
  try {
    const saved = JSON.parse(window.localStorage.getItem(DRAFT_KEY) || "{}") as {
      form?: Partial<QuestionnaireForm>;
      step?: number;
    };
    return {
      form: {
        ...EMPTY_FORM,
        ...saved.form,
        goals: Array.isArray(saved.form?.goals) ? saved.form.goals : [],
        materials: Array.isArray(saved.form?.materials) ? saved.form.materials : [],
      },
      step: typeof saved.step === "number" && saved.step >= 0 && saved.step < STEPS.length ? saved.step : 0,
    };
  } catch {
    return { form: EMPTY_FORM, step: 0 };
  }
}

function getNextBookingDates(count = 5) {
  const dates: Array<{ value: string; label: string }> = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);

  while (dates.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const weekday = cursor.getDay();
    if (weekday === 0 || weekday === 6) continue;

    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, "0");
    const day = String(cursor.getDate()).padStart(2, "0");
    dates.push({
      value: `${year}-${month}-${day}`,
      label: new Intl.DateTimeFormat("cs-CZ", { weekday: "long", day: "numeric", month: "long" }).format(cursor),
    });
  }

  return dates;
}

export default function DotaznikPage() {
  const [, setLocation] = useLocation();
  const savedDraft = useMemo(loadDraft, []);
  const bookingDates = useMemo(() => getNextBookingDates(), []);
  const [step, setStep] = useState(savedDraft.step);
  const [form, setForm] = useState<QuestionnaireForm>(savedDraft.form);
  const [submitted, setSubmitted] = useState(false);
  const [submittedInquiryId, setSubmittedInquiryId] = useState(0);
  const [bookingDate, setBookingDate] = useState(bookingDates[0]?.value ?? "");
  const [bookingTime, setBookingTime] = useState<(typeof BOOKING_TIMES)[number]>("09:00");
  const [bookedSlot, setBookedSlot] = useState("");
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const abandonSentRef = useRef(false);
  const stepRef = useRef(step);

  const { oborId, firmaPrefill, sourceParam, segmentParam } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      oborId: params.get("obor") || "",
      firmaPrefill: params.get("firma") || "",
      sourceParam: params.get("zdroj") || "",
      segmentParam: params.get("segment") || "",
    };
  }, []);

  const createInquiry = trpc.inquiries.create.useMutation();
  const bookCall = trpc.inquiries.bookCall.useMutation();

  useEffect(() => {
    const companyPrefill = firmaPrefill || (oborId ? OBOR_LABELS[oborId] : "");
    if (!companyPrefill) return;
    setForm((current) => current.company ? current : { ...current, company: companyPrefill });
  }, [firmaPrefill, oborId]);

  useEffect(() => {
    stepRef.current = step;
    if (!submitted) {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, updatedAt: new Date().toISOString() }));
    }
  }, [form, step, submitted]);

  useEffect(() => {
    const recordAbandonment = () => {
      if (!startedRef.current || submittedRef.current || abandonSentRef.current) return;
      abandonSentRef.current = true;
      void trackEvent("questionnaire_abandon", { step: stepRef.current + 1 });
    };
    window.addEventListener("pagehide", recordAbandonment);
    return () => window.removeEventListener("pagehide", recordAbandonment);
  }, []);

  const markStarted = () => {
    startedRef.current = true;
    trackFormStart("questionnaire", "questionnaire_start");
  };

  const setField = <K extends keyof QuestionnaireForm>(key: K, value: QuestionnaireForm[K]) => {
    markStarted();
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggle = (key: "goals" | "materials", value: string) => {
    const current = form[key];
    setField(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  };

  const validateStep = (index: number) => {
    if (index === 0 && (!form.company.trim() || form.goals.length === 0)) {
      toast.error("Doplňte prosím firmu nebo obor a alespoň jeden hlavní cíl.");
      return false;
    }
    if (index === 1 && !form.websiteType) {
      toast.error("Vyberte prosím typ webu.");
      return false;
    }
    if (index === 3 && (!form.name.trim() || !/^\S+@\S+\.\S+$/.test(form.email))) {
      toast.error("Doplňte prosím jméno a platný e-mail.");
      return false;
    }
    return true;
  };

  const moveToStep = (nextStep: number, direction: "next" | "back") => {
    if (direction === "next" && !validateStep(step)) return;
    const target = Math.max(0, Math.min(nextStep, STEPS.length - 1));
    setStep(target);
    void trackEvent("questionnaire_step", { step: target + 1, name: STEPS[target], direction });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validateStep(3)) return;

    try {
      const result = await createInquiry.mutateAsync({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        businessDescription: form.company,
        packageType: form.websiteType,
        source: sourceParam
          ? `dotaznik:${sourceParam}${segmentParam ? `:${segmentParam}` : ""}`
          : oborId
            ? `dotaznik:demo:${oborId}`
            : "dotaznik",
        details: {
          sourceParam,
          segmentParam,
          goals: form.goals,
          pages: form.pages,
          materials: form.materials,
          inspiration: form.inspiration,
          budget: form.budget,
          timeline: form.timeline,
          message: form.message,
          ...getAttribution(),
        },
        linkedinConsent: isChannelConsented("linkedin"),
      } as any);

      submittedRef.current = true;
      window.localStorage.removeItem(DRAFT_KEY);
      trackSklikConversion({ orderId: `lead-dotaznik-${result.id}` });
      trackLinkedInConversion();
      void trackEvent("questionnaire_submit", { inquiryId: result.id, segment: segmentParam || undefined });
      void trackEvent("form_submit", { formName: "dotaznik", inquiryId: result.id });
      setSubmittedInquiryId(Number(result.id) || 0);
      setSubmitted(true);
    } catch {
      toast.error("Poptávku se nepodařilo odeslat. Zkuste to prosím znovu.");
    }
  };

  const handleBookCall = async () => {
    if (!bookingDate || !submittedInquiryId) return;
    try {
      const result = await bookCall.mutateAsync({
        inquiryId: submittedInquiryId,
        email: form.email,
        date: bookingDate,
        time: bookingTime,
      });
      setBookedSlot(result.scheduledFor);
      void trackEvent("call_booked", {
        inquiryId: submittedInquiryId,
        scheduledFor: result.scheduledFor,
        timezone: result.timezone,
      });
    } catch {
      toast.error("Termín se nepodařilo uložit. Zkuste jiný termín nebo vyčkejte na náš e-mail.");
    }
  };

  if (submitted) {
    const selectedDateLabel = bookingDates.find((date) => date.value === bookingDate)?.label;
    return (
      <PageShell headerLabel="Poptávka přijata">
        <main className="flex flex-1 items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-10">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Check className="h-8 w-8" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-950">Děkujeme, podklady máme.</h1>
              <p className="mx-auto mt-3 max-w-lg text-slate-600">
                Návrh dalšího postupu pošleme do {SERVICE_TERMS.initialResponseHours} hodin na <strong>{form.email}</strong>.
              </p>
            </div>

            <div className="my-8 border-t border-slate-200" />

            {bookedSlot ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-center">
                <CalendarClock className="mx-auto mb-3 h-7 w-7 text-emerald-700" />
                <h2 className="text-lg font-bold text-emerald-950">Termín hovoru je zapsaný</h2>
                <p className="mt-2 text-sm text-emerald-800">
                  {selectedDateLabel} v {bookingTime}. Potvrzení a případné upřesnění pošleme e-mailem.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-5 text-center">
                  <h2 className="text-xl font-bold text-slate-950">Vyberte termín úvodního hovoru</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Bezplatných {SERVICE_TERMS.introCallMinutes} minut pro upřesnění cíle, rozsahu a dalšího kroku.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <label className="text-sm font-semibold text-slate-700">
                    Den
                    <select
                      value={bookingDate}
                      onChange={(event) => setBookingDate(event.target.value)}
                      className="mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    >
                      {bookingDates.map((date) => <option key={date.value} value={date.value}>{date.label}</option>)}
                    </select>
                  </label>
                  <fieldset>
                    <legend className="text-sm font-semibold text-slate-700">Čas</legend>
                    <div className="mt-1.5 flex gap-2">
                      {BOOKING_TIMES.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setBookingTime(time)}
                          className={`h-11 rounded-md border px-3 text-sm font-semibold ${bookingTime === time ? "border-violet-600 bg-violet-600 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-violet-400"}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>
                <Button
                  onClick={handleBookCall}
                  disabled={bookCall.isPending}
                  className="mt-5 w-full bg-violet-600 font-bold text-white hover:bg-violet-700"
                >
                  <CalendarClock className="mr-2 h-4 w-4" />
                  {bookCall.isPending ? "Ukládám termín..." : "Rezervovat úvodní hovor"}
                </Button>
              </div>
            )}

            <button onClick={() => setLocation("/")} className="mt-6 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-900">
              Zpět na hlavní stránku
            </button>
          </div>
        </main>
      </PageShell>
    );
  }

  return (
    <PageShell headerLabel="Poptávkový dotazník">
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center text-white">
            <p className="text-sm font-semibold text-cyan-300">Návrh dalšího postupu zdarma</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Pojďme nejdřív pochopit váš cíl</h1>
            <p className="mt-3 text-sm text-slate-300">Kontakt vyplníte až v posledním kroku. Rozepsané odpovědi se ukládají v tomto prohlížeči.</p>
          </div>

          <Stepper current={step} />

          <section
            className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
            onFocusCapture={markStarted}
            onClickCapture={markStarted}
          >
            {step === 0 && (
              <div className="space-y-6">
                <StepHeading title="Firma a hlavní cíl" desc="Začněte kontextem. Kontaktní údaje teď nepotřebujeme." />
                <TextField
                  label="Firma nebo obor podnikání"
                  required
                  value={form.company}
                  onChange={(value) => setField("company", value)}
                  placeholder="Např. Novák s.r.o. nebo elektroinstalace"
                  autoComplete="organization"
                />
                <ChoiceGroup label="Co má web hlavně přinášet?" required options={GOALS} selected={form.goals} onToggle={(value) => toggle("goals", value)} />
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <StepHeading title="Rozsah řešení" desc="Vyberte nejbližší variantu. Přesný rozsah potvrdíme až po hovoru." />
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Typ webu <span className="text-violet-600">*</span></p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {WEBSITE_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setField("websiteType", type.id)}
                        className={`rounded-lg border p-4 text-left transition-colors ${form.websiteType === type.id ? "border-violet-500 bg-violet-50 ring-2 ring-violet-100" : "border-slate-200 hover:border-slate-400"}`}
                      >
                        <span className="block text-sm font-bold text-slate-900">{type.label}</span>
                        <span className="mt-1 block text-xs text-slate-500">{type.price}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <TextAreaField
                  label="Jaké stránky nebo funkce potřebujete?"
                  value={form.pages}
                  onChange={(value) => setField("pages", value)}
                  placeholder="Např. služby, ceník, reference, rezervace..."
                />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <StepHeading title="Podklady a očekávání" desc="Stačí orientačně. Chybějící obsah umíme připravit." />
                <ChoiceGroup label="Co už máte připravené?" options={MATERIALS} selected={form.materials} onToggle={(value) => toggle("materials", value)} />
                <TextField
                  label="Inspirace nebo odkaz na současný web"
                  value={form.inspiration}
                  onChange={(value) => setField("inspiration", value)}
                  placeholder="https://..."
                  type="url"
                />
                <ChoiceGroup label="Orientační rozpočet" options={BUDGETS} selected={form.budget ? [form.budget] : []} onToggle={(value) => setField("budget", value)} single />
                <ChoiceGroup label="Požadovaný termín" options={TIMELINES} selected={form.timeline ? [form.timeline] : []} onToggle={(value) => setField("timeline", value)} single />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <StepHeading title="Kam máme poslat návrh?" desc="Kontakt žádáme až teď, když už známe základní kontext." />
                <TextField label="Jméno" required value={form.name} onChange={(value) => setField("name", value)} placeholder="Jan Novák" autoComplete="name" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <TextField label="E-mail" required value={form.email} onChange={(value) => setField("email", value)} placeholder="jan@firma.cz" type="email" autoComplete="email" />
                  <TextField label="Telefon (volitelně)" value={form.phone} onChange={(value) => setField("phone", value)} placeholder="+420 777 123 456" type="tel" autoComplete="tel" />
                </div>
                <TextAreaField label="Co dalšího bychom měli vědět?" value={form.message} onChange={(value) => setField("message", value)} placeholder="Doplňující informace, omezení nebo otázky..." />
                <p className="text-xs leading-relaxed text-slate-500">
                  Odesláním potvrzujete, že jste se seznámili se <a href="/ochrana-osobnich-udaju" className="font-semibold text-violet-700 underline">zásadami ochrany osobních údajů</a>.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between border-t border-slate-200 pt-6">
              {step > 0 ? (
                <Button variant="ghost" onClick={() => moveToStep(step - 1, "back")}>
                  <ArrowLeft className="mr-1.5 h-4 w-4" /> Zpět
                </Button>
              ) : <span />}

              {step < STEPS.length - 1 ? (
                <Button onClick={() => moveToStep(step + 1, "next")} className="bg-violet-600 font-bold text-white hover:bg-violet-700">
                  Pokračovat <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={createInquiry.isPending} className="bg-violet-600 font-bold text-white hover:bg-violet-700">
                  {createInquiry.isPending ? "Odesílám..." : "Odeslat poptávku"} <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </div>
          </section>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Krok {step + 1} z {STEPS.length}
          </p>
        </div>
      </main>
    </PageShell>
  );
}

function PageShell({ headerLabel, children }: { headerLabel: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070816] text-slate-900">
      <header className="border-b border-white/10 bg-[#070816]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <a href="/" aria-label="OPTIMATEO - hlavní stránka"><OptimateoLogo className="h-8" light /></a>
          <span className="text-sm text-slate-400">{headerLabel}</span>
        </div>
      </header>
      {children}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Postup dotazníku">
      {STEPS.map((label, index) => (
        <li key={label} className="min-w-0 text-center">
          <span className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index === current ? "bg-violet-600 text-white" : index < current ? "bg-emerald-600 text-white" : "bg-white/10 text-slate-400"}`}>
            {index < current ? <Check className="h-4 w-4" /> : index + 1}
          </span>
          <span className={`mt-1.5 block truncate text-[11px] sm:text-xs ${index === current ? "font-semibold text-white" : "text-slate-500"}`}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-slate-950">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
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
  autoComplete,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-violet-600">*</span>}
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-1.5 h-11 w-full rounded-md border border-slate-300 bg-white px-3 font-normal text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1.5 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 font-normal text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
      />
    </label>
  );
}

function ChoiceGroup({
  label,
  required,
  options,
  selected,
  onToggle,
  single = false,
}: {
  label: string;
  required?: boolean;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  single?: boolean;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-slate-700">{label} {required && <span className="text-violet-600">*</span>}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              role={single ? "radio" : "checkbox"}
              aria-checked={active}
              onClick={() => onToggle(option)}
              className={`flex items-center gap-2 rounded-md border px-3 py-3 text-left text-sm font-medium ${active ? "border-violet-500 bg-violet-50 text-violet-800" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"}`}
            >
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center ${single ? "rounded-full" : "rounded-sm"} border ${active ? "border-violet-600 bg-violet-600" : "border-slate-300"}`}>
                {active && <Check className="h-3 w-3 text-white" />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
