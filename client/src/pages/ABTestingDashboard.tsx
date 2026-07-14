import { BarChart3, Eye, MousePointerClick, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function ABTestingDashboard() {
  const { data: summary, isLoading } = trpc.ab.getSummary.useQuery(undefined, {
    refetchInterval: 15_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-violet-400" />
      </div>
    );
  }

  const metrics = summary?.metrics || [];
  const winner = summary?.winningVariant;
  const hasEnoughData = (summary?.totalPageViews || 0) >= 200;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-300">Hero experiment A/B</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Výkon variant homepage</h1>
          <p className="mt-3 max-w-3xl leading-7 text-slate-400">
            Varianta A staví na diagnostice ztracených poptávek. Varianta B komunikuje přímý výsledek: výkonnostní web a CRM.
          </p>
        </header>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={Eye} label="Zobrazení" value={summary?.totalPageViews || 0} />
          <MetricCard icon={MousePointerClick} label="Konverze" value={summary?.totalConversions || 0} />
          <MetricCard icon={Target} label="Konverzní poměr" value={`${summary?.overallConversionRate || "0.00"} %`} />
          <MetricCard icon={BarChart3} label="Průběžný vítěz" value={winner || "Zatím neurčen"} />
        </div>

        <Card className="overflow-hidden border-slate-800 bg-slate-900 text-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px]">
              <thead className="border-b border-slate-800 bg-slate-900/80 text-sm text-slate-400">
                <tr>
                  <th className="px-5 py-4 text-left">Varianta</th>
                  <th className="px-5 py-4 text-right">Zobrazení</th>
                  <th className="px-5 py-4 text-right">CTA kliky</th>
                  <th className="px-5 py-4 text-right">CTR</th>
                  <th className="px-5 py-4 text-right">Formuláře</th>
                  <th className="px-5 py-4 text-right">Konverze</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map(metric => (
                  <tr key={metric.variant} className="border-b border-slate-800 last:border-0">
                    <td className="px-5 py-5 font-bold">{metric.variant}</td>
                    <td className="px-5 py-5 text-right">{metric.pageViews}</td>
                    <td className="px-5 py-5 text-right">{metric.ctaClicks}</td>
                    <td className="px-5 py-5 text-right">{metric.ctr.toFixed(2)} %</td>
                    <td className="px-5 py-5 text-right">{metric.formSubmits}</td>
                    <td className="px-5 py-5 text-right font-semibold text-violet-300">{metric.conversionRate.toFixed(2)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-6 rounded-lg border border-amber-400/20 bg-amber-400/10 p-5 text-sm leading-6 text-amber-100">
          Interní přehled používá data aktuálního běhu serveru a po restartu se vynuluje. Trvalé vyhodnocení dělejte v Google Analytics podle dimenze <code className="rounded bg-black/20 px-1.5 py-0.5">ab_variant</code>. {hasEnoughData ? "Vzorek už lze předběžně vyhodnotit." : "O vítězi rozhodujte až po dostatečném počtu návštěv a konverzí."}
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900 p-5 text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold">{typeof value === "number" ? value.toLocaleString("cs-CZ") : value}</p>
        </div>
        <Icon className="h-5 w-5 text-violet-300" />
      </div>
    </Card>
  );
}
