import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, ChevronRight, Phone, Mail, MapPin, Clock, Star, CheckCircle, ShoppingCart, Play, Zap } from "lucide-react";
import { SalesChatWidget } from "@/components/SalesChatWidget";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DemoData {
  businessName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  description: string;
  service1: string; price1: string;
  service2: string; price2: string;
  service3: string; price3: string;
  hours: string;
  cta: string;
}

interface Template {
  id: string;
  name: string;
  emoji: string;
  niche: string;
  palette: string;
  bg: string;
  accent: string;
  defaults: DemoData;
}

// ─── Templates metadata ───────────────────────────────────────────────────────

const TEMPLATES: Template[] = [
  {
    id: "kavarna",
    name: "Kavárna",
    emoji: "☕",
    niche: "Restaurace & Café",
    palette: "Teplá amber/hnědá",
    bg: "#FFF8F0",
    accent: "#D97706",
    defaults: {
      businessName: "Café Momento",
      tagline: "Kde každý šálek vypráví příběh.",
      phone: "+420 731 123 456",
      email: "hello@cafemomento.cz",
      address: "Náměstí Míru 12, Praha 2",
      description: "Útulná kavárna v srdci Prahy, kde se setkávají milovníci kávy, domácích dortů a dobré konverzace.",
      service1: "Filtrovaná káva", price1: "65 Kč",
      service2: "Domácí dort", price2: "89 Kč",
      service3: "Snídaňový set", price3: "185 Kč",
      hours: "Po–Pá 7:00–19:00 · So–Ne 8:00–18:00",
      cta: "Rezervovat stůl",
    },
  },
  {
    id: "kadernictvi",
    name: "Kadeřnictví",
    emoji: "✂️",
    niche: "Krása & Péče",
    palette: "Rose/pastelová",
    bg: "#FFF0F5",
    accent: "#DB2777",
    defaults: {
      businessName: "Studio Rose",
      tagline: "Váš styl, naše vášeň.",
      phone: "+420 605 987 654",
      email: "objednavky@studiorose.cz",
      address: "Štefánikova 44, Brno",
      description: "Moderní kadeřnický salon s 10 lety zkušeností. Střihy, barvy, melíry a péče na míru každému.",
      service1: "Střih + fén", price1: "390 Kč",
      service2: "Balayage/Melír", price2: "1 290 Kč",
      service3: "Keratinová péče", price3: "890 Kč",
      hours: "Út–Pá 9:00–18:00 · So 8:00–14:00",
      cta: "Objednat termín",
    },
  },
  {
    id: "elektrikar",
    name: "Elektrikář",
    emoji: "⚡",
    niche: "Řemeslo & Služby",
    palette: "Navy/oranžová",
    bg: "#F0F4FF",
    accent: "#EA580C",
    defaults: {
      businessName: "ELKO Novák",
      tagline: "Spolehlivý elektrikář. Do 2 hodin u vás.",
      phone: "+420 777 321 654",
      email: "info@elkonovak.cz",
      address: "Ostrava a okolí (30 km)",
      description: "Certifikovaný elektrikář s 15 lety praxe. Rozvody, revize, havarijní výjezdy. Záruka na práci 5 let.",
      service1: "Revize elektroinstalace", price1: "od 1 200 Kč",
      service2: "Nový rozvod", price2: "od 3 500 Kč",
      service3: "Havarijní výjezd 24/7", price3: "od 800 Kč",
      hours: "Po–Pá 7:00–17:00 · Havarijní linka 24/7",
      cta: "Zavolat nyní",
    },
  },
  {
    id: "fitness",
    name: "Fitness",
    emoji: "💪",
    niche: "Sport & Zdraví",
    palette: "Tmavá/limetkově zelená",
    bg: "#050F05",
    accent: "#84CC16",
    defaults: {
      businessName: "ProFit Training",
      tagline: "Výsledky za 90 dní — nebo vrátíme peníze.",
      phone: "+420 720 555 333",
      email: "trenink@profitraining.cz",
      address: "Online + Praha 6",
      description: "Osobní trenér s certifikací NASM. Tréninky online i v terénu. Výživový plán v ceně. Přes 200 spokojených klientů.",
      service1: "1 trénink (60 min)", price1: "890 Kč",
      service2: "Měsíční program", price2: "4 990 Kč",
      service3: "Online plán + výživa", price3: "1 990 Kč",
      hours: "Rezervace 24/7 online",
      cta: "Chci se zapsat",
    },
  },
  {
    id: "reality",
    name: "Reality",
    emoji: "🏠",
    niche: "Reality & Finance",
    palette: "Čistá slate/zlatá",
    bg: "#F8F9FA",
    accent: "#B45309",
    defaults: {
      businessName: "Reality Procházka",
      tagline: "Prodáme váš byt o 12 % výše než průměr trhu.",
      phone: "+420 800 123 456",
      email: "jan.prochazka@realtyprocházka.cz",
      address: "Praha & Středočeský kraj",
      description: "Realitní makléř s 18 lety zkušeností. Specializace na rodinné domy a byty v Praze. Bezplatná odhad nemovitosti.",
      service1: "Odhad nemovitosti", price1: "ZDARMA",
      service2: "Prodej bytu/domu", price2: "3 % z ceny",
      service3: "Pronájem", price3: "1 nájemné",
      hours: "Po–So 8:00–18:00 · Neděle dle dohody",
      cta: "Bezplatný odhad",
    },
  },
  {
    id: "lekar",
    name: "Lékař",
    emoji: "🩺",
    niche: "Zdravotnictví",
    palette: "Bílá/teal",
    bg: "#F0FDFA",
    accent: "#0D9488",
    defaults: {
      businessName: "MUDr. Jana Nováková",
      tagline: "Péče, které můžete věřit.",
      phone: "+420 224 567 890",
      email: "objednavky@drnovakova.cz",
      address: "Vinohradská 15, Praha 2",
      description: "Praktická lékařka pro dospělé. Přijímáme nové pacienty. Objednání online, výsledky v den návštěvy.",
      service1: "Preventivní prohlídka", price1: "ZDARMA (ZP)",
      service2: "Soukromá konzultace", price2: "1 200 Kč",
      service3: "Telefonická konzultace", price3: "350 Kč",
      hours: "Po,St,Pá 8:00–12:00 · Út,Čt 13:00–17:00",
      cta: "Objednat se online",
    },
  },
  {
    id: "eshop",
    name: "E-shop",
    emoji: "🛒",
    niche: "E-commerce",
    palette: "Fialová/korálová",
    bg: "#FAF0FF",
    accent: "#7C3AED",
    defaults: {
      businessName: "Přírodní Svět",
      tagline: "100% přírodní produkty. Rychle. Spolehlivě.",
      phone: "+420 800 NATURAL",
      email: "info@prirodni-svet.cz",
      address: "Doručujeme po celé ČR",
      description: "Český e-shop s prověřenými přírodními produkty. Více než 500 položek, doprava zdarma nad 800 Kč. Vrácení do 30 dní.",
      service1: "Bio kosmetika", price1: "od 189 Kč",
      service2: "Doplňky stravy", price2: "od 299 Kč",
      service3: "Dárková sada", price3: "od 690 Kč",
      hours: "Expedice Po–Pá · Doručení 1–2 dny",
      cta: "Přejít do obchodu",
    },
  },
  {
    id: "kurzy",
    name: "Online kurzy",
    emoji: "🎓",
    niche: "Vzdělávání",
    palette: "Indigo/žlutá",
    bg: "#F5F0FF",
    accent: "#4F46E5",
    defaults: {
      businessName: "AkademieProfi",
      tagline: "Naučíme vás to, co škola nestihla.",
      phone: "+420 775 888 000",
      email: "info@akademieprofi.cz",
      address: "100% online",
      description: "Online vzdělávací platforma s 30+ kurzy v oblasti marketingu, podnikání a produktivity. Certifikát po dokončení.",
      service1: "Marketing Pro", price1: "4 990 Kč",
      service2: "Podnikání od A do Z", price2: "7 990 Kč",
      service3: "AI Nástroje 2025", price3: "2 490 Kč",
      hours: "Přístup 24/7, doživotní",
      cta: "Začít zdarma",
    },
  },
];

// ─── Template preview components ──────────────────────────────────────────────

// Shared building blocks for an elegant, consistent design language across templates.

function Wordmark({ name, color, light }: { name: string; color: string; light?: boolean }) {
  return (
    <span className="font-semibold tracking-tight text-[15px] flex items-center gap-1.5" style={{ color: light ? "#fff" : color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {name}
    </span>
  );
}

function KavarnaTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-[#FBF7F1] min-h-screen font-sans text-[#2A1E12]">
      <nav className="px-7 py-4 flex justify-between items-center">
        <Wordmark name={d.businessName} color="#B45309" />
        <span className="text-[11px] text-[#8B7355] tracking-wide">{d.phone}</span>
      </nav>
      <div className="px-7 pt-8 pb-12 text-center">
        <p className="text-[#B45309] text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Kavárna & pražírna</p>
        <h1 className="text-[32px] leading-[1.1] font-serif text-[#3D2817] mb-4">{d.businessName}</h1>
        <p className="text-[#7A6450] text-[15px] leading-relaxed max-w-[280px] mx-auto mb-7">{d.tagline}</p>
        <button className="bg-[#3D2817] text-[#FBF7F1] rounded-full px-7 py-3 text-[13px] font-medium tracking-wide hover:bg-[#2A1E12] transition-colors">{d.cta}</button>
      </div>
      <div className="px-7 py-8 bg-white">
        <p className="text-[#B45309] text-[10px] font-semibold tracking-[0.2em] uppercase mb-5 text-center">Naše nabídka</p>
        <div className="space-y-4 max-w-sm mx-auto">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p]) => (
            <div key={s} className="flex justify-between items-baseline gap-4">
              <span className="text-[#3D2817] text-[14px]">{s}</span>
              <span className="flex-1 border-b border-dotted border-[#D6C4B0] mx-1 translate-y-[-3px]" />
              <span className="text-[#B45309] text-[14px] font-medium whitespace-nowrap">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[#7A6450] text-[13px] text-center leading-relaxed max-w-xs mx-auto">{d.description}</p>
      </div>
      <div className="bg-[#3D2817] text-[#E8DCCB] px-7 py-7">
        <div className="flex flex-col gap-2.5 text-[12px] max-w-sm mx-auto">
          <span className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5 opacity-60" />{d.hours}</span>
          <span className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 opacity-60" />{d.address}</span>
          <span className="flex items-center gap-2.5"><Phone className="w-3.5 h-3.5 opacity-60" />{d.phone}</span>
        </div>
      </div>
    </div>
  );
}

function KadernictviTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-white min-h-screen font-sans text-[#3A2A33]">
      <nav className="px-7 py-4 flex justify-between items-center border-b border-[#F2E8ED]">
        <Wordmark name={d.businessName} color="#BE7B92" />
        <button className="text-[#BE7B92] text-[11px] font-medium border border-[#E8D5DD] rounded-full px-4 py-1.5 hover:bg-[#FBF4F7] transition-colors">{d.cta}</button>
      </nav>
      <div className="px-7 pt-12 pb-10 text-center bg-gradient-to-b from-[#FBF4F7] to-white">
        <p className="text-[#BE7B92] text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Kadeřnický salon</p>
        <h1 className="text-[30px] leading-tight font-serif text-[#3A2A33] mb-3">{d.businessName}</h1>
        <p className="text-[#9C7E8A] text-[14px] mb-6 max-w-[260px] mx-auto leading-relaxed">{d.tagline}</p>
        <div className="flex justify-center items-center gap-1.5">
          <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-[#D9A5B5] text-[#D9A5B5]" />)}</div>
          <span className="text-[11px] text-[#9C7E8A] ml-1">127 recenzí</span>
        </div>
      </div>
      <div className="px-7 py-9">
        <p className="text-[#BE7B92] text-[10px] font-semibold tracking-[0.2em] uppercase mb-5 text-center">Ceník služeb</p>
        <div className="space-y-2.5 max-w-sm mx-auto">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p]) => (
            <div key={s} className="bg-[#FBF4F7] rounded-xl px-5 py-4 flex justify-between items-center">
              <span className="text-[#3A2A33] text-[13.5px]">{s}</span>
              <span className="text-[#BE7B92] text-[14px] font-semibold whitespace-nowrap">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-7 text-[#9C7E8A] text-[12.5px] text-center leading-relaxed max-w-xs mx-auto">{d.description}</p>
      </div>
      <div className="px-7 py-6 border-t border-[#F2E8ED] text-center">
        <p className="text-[11px] text-[#9C7E8A] mb-1">{d.address}</p>
        <p className="text-[11px] text-[#9C7E8A] mb-2">{d.hours}</p>
        <p className="text-[14px] font-semibold text-[#BE7B92]">{d.phone}</p>
      </div>
    </div>
  );
}

function ElektrikarTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-[#0E1525] min-h-screen font-sans text-white">
      <nav className="px-7 py-4 flex justify-between items-center border-b border-white/8">
        <Wordmark name={d.businessName} color="#F59E0B" light />
        <span className="text-[11px] text-amber-400 font-semibold tracking-wide">{d.phone}</span>
      </nav>
      <div className="px-7 pt-10 pb-11">
        <div className="inline-flex items-center gap-2 bg-amber-400/10 border border-amber-400/25 rounded-full px-3.5 py-1.5 text-[10px] text-amber-400 mb-5 font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> NONSTOP HAVARIJNÍ LINKA
        </div>
        <h1 className="text-[30px] leading-[1.1] font-bold mb-3">{d.businessName}</h1>
        <p className="text-white/55 text-[15px] leading-relaxed mb-7 max-w-[300px]">{d.tagline}</p>
        <button className="bg-amber-400 text-[#0E1525] rounded-lg px-6 py-3.5 font-bold text-[13px] hover:bg-amber-300 transition-colors flex items-center gap-2">
          <Phone className="w-4 h-4" /> {d.cta}
        </button>
      </div>
      <div className="px-7 pb-9">
        <p className="text-amber-400/70 text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Co pro vás uděláme</p>
        <div className="space-y-2.5">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p]) => (
            <div key={s} className="bg-white/[0.04] border border-white/8 rounded-xl px-4 py-3.5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-amber-400/80 shrink-0" />
                <span className="text-[13.5px] text-white/85">{s}</span>
              </div>
              <span className="text-amber-400 font-semibold text-[13.5px] whitespace-nowrap">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-white/40 text-[12px] leading-relaxed">{d.description}</p>
        <p className="mt-4 text-white/30 text-[11px] flex items-center gap-2"><MapPin className="w-3 h-3" />{d.address} · {d.hours}</p>
      </div>
    </div>
  );
}

function FitnessTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-[#0A0F0A] min-h-screen font-sans text-white">
      <nav className="px-7 py-4 flex justify-between items-center border-b border-white/8">
        <Wordmark name={d.businessName} color="#A3E635" light />
        <button className="bg-[#A3E635] text-black rounded-full px-4 py-1.5 text-[11px] font-bold">{d.cta}</button>
      </nav>
      <div className="px-7 pt-11 pb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#A3E635]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="inline-block bg-[#A3E635]/10 border border-[#A3E635]/25 rounded-full px-3 py-1 text-[10px] text-[#A3E635] mb-5 font-semibold tracking-[0.15em] uppercase">
            Garance výsledků
          </div>
          <h1 className="text-[32px] leading-[1.05] font-extrabold mb-4">{d.businessName}</h1>
          <p className="text-[#A3E635] text-[15px] font-medium mb-4">{d.tagline}</p>
          <p className="text-white/45 text-[13px] leading-relaxed max-w-[300px]">{d.description}</p>
        </div>
      </div>
      <div className="px-7 pb-9">
        <p className="text-[#A3E635]/70 text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Programy</p>
        <div className="space-y-2.5">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p], i) => (
            <div key={s} className={`rounded-xl px-5 py-4 flex justify-between items-center border ${i === 1 ? "bg-[#A3E635]/10 border-[#A3E635]/40" : "bg-white/[0.04] border-white/8"}`}>
              <span className="text-[13.5px] text-white/85">{s}</span>
              <span className={`font-bold text-[14px] whitespace-nowrap ${i === 1 ? "text-[#A3E635]" : "text-white/55"}`}>{p}</span>
            </div>
          ))}
        </div>
        <p className="text-white/25 text-[11px] mt-5">{d.hours} · {d.phone}</p>
      </div>
    </div>
  );
}

function RealityTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-white min-h-screen font-sans text-[#1A1D29]">
      <nav className="px-7 py-4 flex justify-between items-center">
        <Wordmark name={d.businessName} color="#1A1D29" />
        <span className="text-[11px] text-[#9CA3AF] tracking-wide">{d.phone}</span>
      </nav>
      <div className="mx-4 rounded-2xl bg-gradient-to-br from-[#1A1D29] to-[#2D3142] text-white px-7 py-12 text-center">
        <p className="text-white/40 text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Realitní makléř</p>
        <h1 className="text-[26px] leading-tight font-serif mb-4">{d.businessName}</h1>
        <p className="text-white/65 text-[14px] leading-relaxed max-w-[280px] mx-auto mb-7">{d.tagline}</p>
        <button className="bg-white text-[#1A1D29] rounded-lg px-7 py-3 text-[13px] font-semibold hover:bg-white/90 transition-colors">{d.cta}</button>
      </div>
      <div className="px-7 py-9">
        <div className="grid grid-cols-3 gap-3 mb-9">
          {[["18", "let praxe"], ["500+", "prodejů"], ["98%", "spokojenost"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-[24px] font-bold text-[#1A1D29]">{v}</div>
              <div className="text-[10px] text-[#9CA3AF] mt-1 leading-tight">{l}</div>
            </div>
          ))}
        </div>
        <p className="text-[#9CA3AF] text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Služby</p>
        <div className="space-y-3 max-w-sm mx-auto">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p]) => (
            <div key={s} className="flex justify-between items-baseline gap-4 pb-3 border-b border-[#F1F2F4]">
              <span className="text-[13.5px] text-[#4B5563]">{s}</span>
              <span className="text-[13.5px] font-semibold text-[#1A1D29] whitespace-nowrap">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[#9CA3AF] text-[11.5px]">{d.address} · {d.hours}</p>
      </div>
    </div>
  );
}

function LekarTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-white min-h-screen font-sans text-[#1F2A37]">
      <nav className="px-7 py-4 flex justify-between items-center border-b border-[#EAF4F2]">
        <Wordmark name={d.businessName} color="#0E9384" />
        <button className="bg-[#0E9384] text-white rounded-lg px-4 py-2 text-[11px] font-medium hover:bg-[#0B7A6E] transition-colors">{d.cta}</button>
      </nav>
      <div className="px-7 pt-11 pb-9 text-center bg-gradient-to-b from-[#F0FAF8] to-white">
        <div className="w-14 h-14 bg-[#0E9384]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-6 h-6 text-[#0E9384]" />
        </div>
        <h1 className="text-[24px] leading-tight font-semibold text-[#0F3B36] mb-2">{d.businessName}</h1>
        <p className="text-[#0E9384] text-[14px] mb-2">{d.tagline}</p>
        <p className="text-[#9CA3AF] text-[12px] flex items-center justify-center gap-1.5"><MapPin className="w-3 h-3" />{d.address}</p>
      </div>
      <div className="px-7 py-8">
        <div className="bg-[#F0FAF8] rounded-2xl px-5 py-4 mb-7 flex items-start gap-3">
          <Clock className="w-4 h-4 text-[#0E9384] shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-semibold tracking-wide uppercase text-[#0E9384] mb-1">Ordinační hodiny</p>
            <p className="text-[12.5px] text-[#4B5563] leading-relaxed">{d.hours}</p>
          </div>
        </div>
        <p className="text-[#0E9384] text-[10px] font-semibold tracking-[0.2em] uppercase mb-4">Ceník výkonů</p>
        <div className="space-y-3 max-w-sm mx-auto">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p]) => (
            <div key={s} className="flex justify-between items-baseline gap-4 pb-3 border-b border-[#EAF4F2]">
              <span className="text-[13.5px] text-[#4B5563]">{s}</span>
              <span className="text-[13.5px] font-semibold text-[#0E9384] whitespace-nowrap">{p}</span>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[#9CA3AF] text-[12px] leading-relaxed text-center max-w-xs mx-auto">{d.description}</p>
      </div>
    </div>
  );
}

function EshopTemplate({ d }: { d: DemoData }) {
  const products = [
    [d.service1, d.price1],
    [d.service2, d.price2],
    [d.service3, d.price3],
  ];
  const swatches = ["#E9F0E4", "#F3ECDC", "#E8E4F0"];
  return (
    <div className="bg-[#FAFAFA] min-h-screen font-sans text-[#1F2937]">
      <nav className="px-7 py-4 flex justify-between items-center bg-white border-b border-[#F0F0F0]">
        <Wordmark name={d.businessName} color="#6D5BD0" />
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-[#9CA3AF]">{d.phone}</span>
          <ShoppingCart className="w-4.5 h-4.5 text-[#6D5BD0]" />
        </div>
      </nav>
      <div className="px-7 pt-10 pb-9 text-center bg-white">
        <p className="text-[#6D5BD0] text-[10px] font-semibold tracking-[0.25em] uppercase mb-4">Přírodní produkty</p>
        <h1 className="text-[28px] leading-tight font-semibold text-[#1F2937] mb-3">{d.businessName}</h1>
        <p className="text-[#6B7280] text-[14px] leading-relaxed max-w-[270px] mx-auto mb-6">{d.tagline}</p>
        <button className="bg-[#6D5BD0] text-white rounded-full px-7 py-3 text-[13px] font-medium hover:bg-[#5B4AB8] transition-colors">{d.cta}</button>
      </div>
      <div className="px-5 py-8">
        <div className="space-y-3 max-w-sm mx-auto">
          {products.map(([s, p], i) => (
            <div key={String(s)} className="bg-white rounded-2xl border border-[#F0F0F0] p-3 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
              <div className="w-16 h-16 rounded-xl shrink-0" style={{ background: swatches[i] }} />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-[#1F2937] truncate">{s}</div>
                <div className="text-[#6D5BD0] font-semibold text-[15px] mt-0.5">{p}</div>
              </div>
              <button className="bg-[#F3F1FB] text-[#6D5BD0] rounded-lg text-[11px] px-3.5 py-2 font-medium whitespace-nowrap hover:bg-[#E9E5F7] transition-colors">Do košíku</button>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-5 text-[11px] text-[#9CA3AF] mt-7">
          {["Doprava zdarma", "30 dní na vrácení", "Bezpečná platba"].map(t => (
            <span key={t} className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#6D5BD0]" />{t}</span>
          ))}
        </div>
        <p className="mt-4 text-[#9CA3AF] text-[11.5px] text-center">{d.address}</p>
      </div>
    </div>
  );
}

function KurzymTemplate({ d }: { d: DemoData }) {
  return (
    <div className="bg-white min-h-screen font-sans text-[#1E1B2E]">
      <nav className="px-7 py-4 flex justify-between items-center">
        <Wordmark name={d.businessName} color="#5B4AE0" />
        <button className="bg-[#5B4AE0] text-white rounded-full px-4 py-1.5 text-[11px] font-medium">{d.cta}</button>
      </nav>
      <div className="px-7 pt-11 pb-10 text-center">
        <div className="inline-flex items-center gap-1.5 bg-[#F4F2FE] rounded-full px-3.5 py-1.5 text-[11px] text-[#5B4AE0] font-medium mb-5">
          <Play className="w-3 h-3 fill-[#5B4AE0] text-[#5B4AE0]" /> 30+ online kurzů
        </div>
        <h1 className="text-[30px] leading-tight font-bold text-[#1E1B2E] mb-3 max-w-[280px] mx-auto">{d.businessName}</h1>
        <p className="text-[#6B6580] text-[14px] leading-relaxed max-w-[270px] mx-auto mb-2">{d.tagline}</p>
        <p className="text-[#9893A8] text-[12px] max-w-[280px] mx-auto leading-relaxed">{d.description}</p>
      </div>
      <div className="px-7 pb-10">
        <div className="space-y-3 max-w-sm mx-auto">
          {[[d.service1, d.price1], [d.service2, d.price2], [d.service3, d.price3]].map(([s, p], i) => (
            <div key={String(s)} className={`rounded-2xl px-5 py-4 flex justify-between items-center ${i === 1 ? "bg-[#5B4AE0] text-white" : "bg-[#F8F7FE] text-[#1E1B2E]"}`}>
              <div>
                <div className={`text-[14px] font-medium ${i === 1 ? "text-white" : "text-[#1E1B2E]"}`}>{s}</div>
                <div className={`text-[11px] mt-0.5 ${i === 1 ? "text-white/70" : "text-[#9893A8]"}`}>jednorázová platba</div>
              </div>
              <div className={`font-bold text-[16px] whitespace-nowrap ${i === 1 ? "text-white" : "text-[#5B4AE0]"}`}>{p}</div>
            </div>
          ))}
        </div>
        <p className="text-[#9893A8] text-[11.5px] text-center mt-6">{d.hours}</p>
      </div>
    </div>
  );
}

// Renders the real template scaled down, so the gallery thumbnail always
// matches exactly what opens in the customizer — no separate mini-mockups to drift.
function TemplateThumbnail({ id, bg, d }: { id: string; bg: string; accent: string; d: DemoData }) {
  const Renderer = RENDERERS[id];
  if (!Renderer) return <div style={{ background: bg, height: "100%" }} />;
  return (
    <div style={{ background: bg, height: "100%", overflow: "hidden" }}>
      <div style={{ width: 390, transform: "scale(0.62)", transformOrigin: "top left", pointerEvents: "none" }}>
        <Renderer d={d} />
      </div>
    </div>
  );
}

// ─── Full-page template renderers ────────────────────────────────────────────

const RENDERERS: Record<string, React.ComponentType<{ d: DemoData }>> = {
  kavarna: KavarnaTemplate,
  kadernictvi: KadernictviTemplate,
  elektrikar: ElektrikarTemplate,
  fitness: FitnessTemplate,
  reality: RealityTemplate,
  lekar: LekarTemplate,
  eshop: EshopTemplate,
  kurzy: KurzymTemplate,
};

// ─── Form field ────────────────────────────────────────────────────────────────

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all"
      />
    </div>
  );
}

// ─── Main DemoPage ─────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [selected, setSelected] = useState<Template | null>(null);
  const [data, setData] = useState<DemoData | null>(null);

  const selectTemplate = useCallback((t: Template) => {
    setSelected(t);
    setData({ ...t.defaults });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const updateField = useCallback(<K extends keyof DemoData>(key: K, value: DemoData[K]) => {
    setData(prev => prev ? { ...prev, [key]: value } : prev);
  }, []);

  const Renderer = selected ? RENDERERS[selected.id] : null;

  // ── Customizer view ──────────────────────────────────────────────────────────
  if (selected && data && Renderer) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setSelected(null); setData(null); }}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Zpět na šablony
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-white text-sm font-semibold">{selected.emoji} {selected.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:block">Zadejte svá data — náhled se aktualizuje živě</span>
            <a href="/#pricing">
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white text-xs rounded-full px-4">
                Objednat tento web <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </a>
          </div>
        </div>

        {/* Split layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Form panel */}
          <div className="w-80 shrink-0 bg-white border-r border-slate-200 overflow-y-auto">
            <div className="p-4 space-y-3">
              <div className="pb-2 border-b border-slate-100 mb-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Základní info</p>
              </div>
              <Field label="Název firmy" value={data.businessName} onChange={v => updateField("businessName", v)} />
              <Field label="Tagline / slogan" value={data.tagline} onChange={v => updateField("tagline", v)} placeholder="Krátký výstižný slogan" />
              <Field label="Telefon" value={data.phone} onChange={v => updateField("phone", v)} />
              <Field label="E-mail" value={data.email} onChange={v => updateField("email", v)} />
              <Field label="Adresa / oblast" value={data.address} onChange={v => updateField("address", v)} />
              <Field label="Otevírací doba" value={data.hours} onChange={v => updateField("hours", v)} />

              <div className="pb-2 border-b border-slate-100 pt-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Popis</p>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">O nás</label>
                <textarea
                  value={data.description}
                  onChange={e => updateField("description", e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200 transition-all resize-none"
                />
              </div>

              <div className="pb-2 border-b border-slate-100 pt-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Služby & ceny</p>
              </div>
              {([["service1", "price1"], ["service2", "price2"], ["service3", "price3"]] as const).map(([sKey, pKey], i) => (
                <div key={sKey} className="flex gap-2">
                  <div className="flex-1">
                    <Field label={`Služba ${i + 1}`} value={data[sKey]} onChange={v => updateField(sKey, v)} />
                  </div>
                  <div className="w-24">
                    <Field label="Cena" value={data[pKey]} onChange={v => updateField(pKey, v)} placeholder="990 Kč" />
                  </div>
                </div>
              ))}

              <div className="pb-2 border-b border-slate-100 pt-2">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">Tlačítko CTA</p>
              </div>
              <Field label="Text tlačítka" value={data.cta} onChange={v => updateField("cta", v)} placeholder="Objednat" />

              <div className="pt-4 pb-2">
                <a href="/#pricing" className="block w-full">
                  <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl">
                    Objednat tento web →
                  </Button>
                </a>
                <p className="text-[10px] text-slate-400 text-center mt-2">Hotovo do 5 pracovních dní · Záruka spokojenosti</p>
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex-1 overflow-auto bg-slate-100 flex flex-col items-center py-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex gap-1.5">
                {["#FF5F56", "#FFBD2E", "#27C93F"].map(c => (
                  <span key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-1.5 text-xs text-slate-400 flex items-center gap-2 min-w-[200px]">
                🔒 {data.businessName.toLowerCase().replace(/\s+/g, "")}.cz
              </div>
            </div>
            <div
              className="bg-white shadow-2xl overflow-hidden rounded-lg"
              style={{ width: 390, transformOrigin: "top center" }}
            >
              <Renderer d={data} />
            </div>
            <p className="mt-4 text-slate-400 text-xs text-center">Mobilní náhled · 390px</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Gallery view ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-extrabold tracking-tight">
            <span className="text-violet-400">OPT</span>IVIO
          </a>
          <div className="flex items-center gap-4 text-sm">
            <a href="/agents" className="text-violet-400 hover:text-violet-200">✨ Asistenti</a>
            <a href="/" className="text-white/50 hover:text-white">← Zpět</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-violet-400/30 bg-violet-400/5 rounded-full px-4 py-1.5 text-sm text-violet-400 mb-6 font-semibold">
            <Zap className="w-3.5 h-3.5" /> 8 niche šablon · Živý náhled · Vaše data
          </div>
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-4 leading-tight">
            Vyzkoušejte svůj web<br />
            <span className="text-violet-400">zdarma.</span>
          </h1>
          <p className="text-white/50 text-lg max-w-xl mx-auto mb-4">
            Vyberte šablonu pro váš obor, vyplňte svá data — a ihned uvidíte, jak bude váš web vypadat.
            Žádná registrace, žádná kreditní karta.
          </p>
          <div className="flex justify-center gap-6 text-sm text-white/30">
            {["✓ Živý náhled", "✓ Vaše vlastní data", "✓ Do 5 dní hotovo"].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Template gallery */}
      <section className="py-8 px-4 pb-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-white/40 text-sm uppercase tracking-widest mb-10">Vyberte svůj obor</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => selectTemplate(t)}
                className="group relative rounded-2xl border border-white/10 bg-[#0d0f1f] overflow-hidden text-left hover:border-violet-400/40 hover:shadow-[0_0_30px_rgba(139,92,246,0.15)] transition-all duration-300 hover:-translate-y-1.5"
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#13152a] border-b border-white/8">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  <div className="flex-1 ml-2 bg-white/8 rounded-full h-4 flex items-center justify-center">
                    <span className="text-[9px] text-white/25 tracking-wide">optivio.cz/{t.id}</span>
                  </div>
                </div>
                {/* Template preview */}
                <div className="h-80 relative overflow-hidden" style={{ background: t.bg }}>
                  <div style={{ width: 390, transform: "scale(0.97)", transformOrigin: "top left", pointerEvents: "none" }}>
                    <TemplateThumbnail id={t.id} bg={t.bg} accent={t.accent} d={t.defaults} />
                  </div>
                  {/* Soft fade so cropped previews end gracefully */}
                  <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#0d0f1f]/90 to-transparent pointer-events-none" />
                </div>
                {/* Card footer */}
                <div className="px-6 py-5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{t.emoji}</span>
                      <span className="font-bold text-white text-base">{t.name}</span>
                    </div>
                    <p className="text-white/35 text-sm">{t.niche} · {t.palette}</p>
                  </div>
                  <div className="flex items-center gap-1 text-violet-400 text-sm font-semibold bg-violet-500/10 border border-violet-500/25 rounded-full px-4 py-2 group-hover:bg-violet-500/20 transition-colors whitespace-nowrap">
                    Vyzkoušet <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">
            Nevidíte svůj obor? <span className="text-violet-400">Nevadí.</span>
          </h2>
          <p className="text-white/40 mb-8">
            Vytvoříme vám web na míru pro jakýkoliv byznys. Stačí nám říct, co potřebujete.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/#pricing">
              <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3 rounded-full">
                Objednat web na míru →
              </Button>
            </a>
            <a href="/agents">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 rounded-full px-8 py-3">
                ✨ Vyzkoušet asistenty
              </Button>
            </a>
          </div>
        </div>
      </section>

      <footer className="py-8 text-center text-white/20 text-sm border-t border-white/5">
        © {new Date().getFullYear()} OPTIVIO · <a href="/" className="hover:text-white/40">Domů</a> · <a href="/agents" className="text-violet-400 hover:text-violet-300">Asistenti</a>
      </footer>

      {/* Online advisor — pomáhá vybrat šablonu a odpovídá na dotazy */}
      <SalesChatWidget />
    </div>
  );
}
