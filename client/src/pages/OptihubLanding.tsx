import { motion } from "framer-motion";
import {
  ArrowRight,
  Boxes,
  Brain,
  CheckCircle2,
  Cloud,
  Code2,
  Layers3,
  LockKeyhole,
  Network,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";

import { OptihubTechArchitecture } from "@/components/optihub/OptihubTechArchitecture";

const capabilityCards = [
  {
    title: "AI Workflow Automation",
    description: "Propojte modely, data, API a automatizace do jednoho řízeného workflow.",
    icon: Workflow,
  },
  {
    title: "Agentic Operations",
    description: "Specializovaní agenti plánují, spolupracují a předávají práci podle pravidel.",
    icon: Brain,
  },
  {
    title: "Integration Fabric",
    description: "Jednotné místo pro konektory, MCP, API a vlastní firemní systémy.",
    icon: Network,
  },
  {
    title: "Governed Execution",
    description: "Citlivé kroky procházejí policy, auditem a human gate před provedením.",
    icon: ShieldCheck,
  },
];

const workflowSteps = [
  ["1", "Vstup", "Zadání, dokument, URL, data nebo událost"],
  ["2", "Orchestrace", "OPTIHUB vybere správné modely, nástroje a agenty"],
  ["3", "Exekuce", "Automatizace provede bezpečné kroky ve správném pořadí"],
  ["4", "Výsledek", "Web, obsah, analýza, lead, report nebo další akce"],
];

export default function OptihubLanding() {
  return (
    <div className="min-h-screen bg-[#071225] text-white selection:bg-violet-500/40">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#071225]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3" aria-label="OPTIHUB">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 via-fuchsia-500 to-blue-500 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-black tracking-[0.04em]">OPTIHUB</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">One platform. More possibilities.</div>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-300 lg:flex">
            <a href="#produkty" className="transition-colors hover:text-white">Produkty</a>
            <a href="#technologie" className="transition-colors hover:text-white">Technologie</a>
            <a href="#jak-to-funguje" className="transition-colors hover:text-white">Jak to funguje</a>
            <a href="#bezpecnost" className="transition-colors hover:text-white">Bezpečnost</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="https://app.optihub.cz"
              className="hidden rounded-xl border border-white/15 px-4 py-2.5 text-sm font-bold text-slate-200 transition-colors hover:bg-white/10 sm:inline-flex"
            >
              Přihlásit se
            </a>
            <a
              href="#technologie"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 px-4 py-2.5 text-sm font-extrabold shadow-[0_10px_35px_rgba(124,58,237,0.35)] transition-transform hover:-translate-y-0.5"
            >
              Prozkoumat OPTIHUB <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pb-20 pt-36 lg:pb-28 lg:pt-44">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(124,58,237,0.30),transparent_30%),radial-gradient(circle_at_78%_15%,rgba(37,99,235,0.28),transparent_32%),linear-gradient(180deg,#071225_0%,#0a1730_100%)]" />
          <div className="absolute inset-x-0 top-24 mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />

          <div className="relative mx-auto grid max-w-[1500px] items-center gap-14 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-violet-500/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-violet-200">
                <Sparkles className="h-4 w-4" />
                AI workflow automation
              </div>
              <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Technologie, které
                <span className="block bg-gradient-to-r from-white via-violet-300 to-blue-300 bg-clip-text text-transparent">
                  pro vás pracují.
                </span>
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
                OPTIHUB propojuje AI modely, agentní workflow, API, data a automatizace do jednoho ekosystému. Od nápadu po výsledek — s jasným řízením, auditem a bezpečnostními hranicemi.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {["AI agenti", "MCP + API", "Automatizace", "Audit & governance"].map((item) => (
                  <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#technologie"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-base font-black shadow-[0_18px_50px_rgba(124,58,237,0.35)] transition-transform hover:-translate-y-0.5"
                >
                  Zobrazit technologii <ArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#jak-to-funguje"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-base font-bold text-slate-200 transition-colors hover:bg-white/10"
                >
                  <PlayCircle className="h-5 w-5" /> Jak OPTIHUB funguje
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-10 rounded-[48px] bg-gradient-to-br from-violet-500/25 via-blue-500/10 to-transparent blur-3xl" />
              <motion.div
                initial={{ opacity: 0, y: 24, rotateX: 4 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ duration: 0.75 }}
                className="relative overflow-hidden rounded-[30px] border border-white/15 bg-[#0d1b39]/90 p-4 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur"
              >
                <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/20">
                      <Workflow className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold">AI Workflow</div>
                      <div className="text-xs text-slate-400">Nastav → Spusť → Sleduj → Zlepšuj</div>
                    </div>
                  </div>
                  <div className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">ACTIVE</div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {[
                    ["Vstup", "Text / Data / URL", Code2],
                    ["AI Model", "Analýza + plán", Brain],
                    ["Výstup", "Web / Obsah / Akce", Layers3],
                  ].map(([title, detail, Icon], index) => (
                    <div key={String(title)} className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-blue-500/25">
                        {/* @ts-expect-error tuple icon is a lucide component */}
                        <Icon className="h-6 w-6 text-violet-200" />
                      </div>
                      <div className="font-extrabold">{String(title)}</div>
                      <div className="mt-1 text-xs text-slate-400">{String(detail)}</div>
                      {index < 2 && (
                        <ArrowRight className="absolute -right-5 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-violet-400 md:block" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ["12", "kroků workflow"],
                    ["7", "technologických vrstev"],
                    ["1", "orchestration layer"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-white/10 bg-[#08142b] px-4 py-4">
                      <div className="text-2xl font-black text-white">{value}</div>
                      <div className="text-xs text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section id="produkty" className="bg-white py-20 text-slate-900">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-violet-600">Jedna platforma</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Od jednotlivého nástroje k propojenému operačnímu systému.</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {capabilityCards.map(({ title, description, icon: Icon }) => (
                <div key={title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_12px_45px_rgba(15,23,42,0.06)]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50">
                    <Icon className="h-6 w-6 text-violet-700" />
                  </div>
                  <h3 className="text-lg font-black text-slate-950">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OptihubTechArchitecture />

        <section id="jak-to-funguje" className="bg-[#071225] py-20 lg:py-28">
          <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
            <div className="mb-12 max-w-3xl">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-violet-300">Jak to funguje</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Složitá technologie uvnitř. Jednoduchý tok navenek.</h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-4">
              {workflowSteps.map(([index, title, description]) => (
                <div key={index} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-blue-500 text-sm font-black">
                    {index}
                  </div>
                  <h3 className="text-lg font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="bezpecnost" className="bg-white py-20 text-slate-900 lg:py-28">
          <div className="mx-auto grid max-w-[1500px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <div className="mb-3 text-xs font-black uppercase tracking-[0.22em] text-violet-600">Governed by design</div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Automatizace ano. Nekontrolované zásahy ne.</h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                Veřejná OPTIHUB vrstva drží tenant, policy, scope, rate-limit a audit hranice. Citlivé operace mohou vyžadovat human gate před provedením.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Tenant isolation", "Každý klient pracuje ve vlastním kontextu.", LockKeyhole],
                ["Policy gates", "Akce musí projít oprávněními a pravidly.", ShieldCheck],
                ["Cloud edge", "Veřejné rozhraní je oddělené od privátního jádra.", Cloud],
              ].map(([title, description, Icon]) => (
                <div key={String(title)} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  {/* @ts-expect-error tuple icon is a lucide component */}
                  <Icon className="mb-5 h-6 w-6 text-violet-700" />
                  <div className="font-black text-slate-950">{String(title)}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-600">{String(description)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
