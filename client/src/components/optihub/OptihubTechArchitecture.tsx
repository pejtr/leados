import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Boxes,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  Globe2,
  ImageIcon,
  Plug,
  Search,
  Settings,
  Sparkles,
  Workflow,
} from "lucide-react";

const stages = [
  {
    title: "Large Language Models",
    label: "Rozumění & plánování",
    detail: "GPT · Claude · Gemini",
    icon: Brain,
  },
  {
    title: "APIs & Connectors",
    label: "Přístup k nástrojům",
    detail: "Web · Social · Data",
    icon: Plug,
  },
  {
    title: "Document Intelligence",
    label: "Analýza dokumentů",
    detail: "Extract · Embed · RAG",
    icon: FileText,
  },
  {
    title: "Generative AI",
    label: "Tvorba obsahu",
    detail: "Text · Image · Video",
    icon: Sparkles,
  },
  {
    title: "Agentic Workflows",
    label: "Automatizace procesů",
    detail: "Workflows · Agents",
    icon: Workflow,
  },
  {
    title: "OCR & Vision",
    label: "Obraz na data",
    detail: "OCR · Vision · Tables",
    icon: Search,
  },
  {
    title: "Process Automation",
    label: "Rutinní úlohy",
    detail: "UI · RPA · Integrace",
    icon: Settings,
  },
];

const inputs = [
  { label: "Nápad / zadání", icon: Sparkles },
  { label: "Dokument", icon: FileText },
  { label: "Audio / video", icon: ImageIcon },
  { label: "Web / URL", icon: Globe2 },
  { label: "Data / CSV", icon: Database },
];

const outputs = [
  "Hotový web / funnel",
  "Obsah a kampaně",
  "Automatizované procesy",
  "Reporty a analýzy",
  "Růstové příležitosti",
];

export function OptihubTechArchitecture() {
  return (
    <section
      id="technologie"
      className="relative overflow-hidden border-y border-violet-100 bg-gradient-to-b from-white via-violet-50/40 to-white py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_82%_28%,rgba(59,130,246,0.10),transparent_26%)]" />
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-700 shadow-sm">
              <Boxes className="h-4 w-4" />
              OPTIHUB orchestration layer
            </div>
            <h2 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Technologie v OPTIHUBu nejsou seznam nástrojů.
              <span className="block bg-gradient-to-r from-violet-600 via-fuchsia-500 to-blue-600 bg-clip-text text-transparent">
                Pracují jako jeden řízený systém.
              </span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 lg:text-lg">
            Od vstupu přes AI modely, API a automatizace až po měřitelný výstup. Každá vrstva má jasnou roli, auditovatelný tok a bezpečnostní hranice.
          </p>
        </div>

        <div className="rounded-[32px] border border-violet-100 bg-white/90 p-4 shadow-[0_30px_90px_rgba(76,29,149,0.12)] backdrop-blur sm:p-6 lg:p-8">
          <div className="grid gap-5 xl:grid-cols-[180px_minmax(0,1fr)_180px]">
            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 text-sm font-extrabold text-slate-900">Váš vstup</div>
              <div className="space-y-2.5">
                {inputs.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                    <Icon className="h-4 w-4 text-violet-600" />
                    {label}
                  </div>
                ))}
              </div>
            </aside>

            <div className="relative">
              <div className="absolute left-5 right-5 top-[62px] hidden h-px bg-gradient-to-r from-violet-300 via-fuchsia-400 to-blue-400 lg:block" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <motion.div
                      key={stage.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                      className="relative z-10 rounded-2xl border border-violet-100 bg-white p-4 text-center shadow-[0_10px_35px_rgba(124,58,237,0.08)]"
                    >
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-violet-100 to-blue-100 shadow-[0_0_0_2px_rgba(139,92,246,0.22),0_8px_24px_rgba(76,29,149,0.16)]">
                        <Icon className="h-6 w-6 text-violet-700" />
                      </div>
                      <div className="min-h-[42px] text-[12px] font-extrabold leading-tight text-slate-900">
                        {stage.title}
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-600">{stage.label}</div>
                      <div className="mt-3 rounded-full bg-slate-50 px-2 py-1 text-[10px] font-medium text-slate-500">
                        {stage.detail}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-5 flex items-center justify-center gap-3">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-violet-300" />
                <div className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.26em] text-violet-700">
                  AI orchestration layer
                </div>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-violet-300" />
              </div>
            </div>

            <aside className="rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-4">
              <div className="mb-4 text-sm font-extrabold text-slate-900">Vaše výsledky</div>
              <div className="space-y-2.5">
                {outputs.map((label) => (
                  <div key={label} className="flex items-start gap-2.5 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {label}
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Rychlejší výstup", "Agentní workflow místo ručního přepínání nástrojů"],
            ["Nižší provozní tření", "Jednotný kontext, data a automatizace"],
            ["Auditovatelný tok", "Je vidět, co systém udělal a proč"],
            ["Škálovatelná architektura", "Od jedné automatizace po celé firemní workflow"],
          ].map(([title, description]) => (
            <div key={title} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="mb-1 flex items-center gap-2 text-sm font-extrabold text-slate-900">
                <ArrowRight className="h-4 w-4 text-violet-600" />
                {title}
              </div>
              <div className="text-sm leading-relaxed text-slate-500">{description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
