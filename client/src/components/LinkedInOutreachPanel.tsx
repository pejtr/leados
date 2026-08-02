import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Send, RefreshCw, CheckCircle2 } from "lucide-react";

const stateColors: Record<string, string> = {
  DISCOVERED: "bg-slate-100 text-slate-700",
  RESEARCHED: "bg-sky-100 text-sky-700",
  QUALIFIED: "bg-indigo-100 text-indigo-700",
  MESSAGE_READY: "bg-amber-100 text-amber-800",
  APPROVED: "bg-violet-100 text-violet-700",
  MANUALLY_SENT: "bg-emerald-100 text-emerald-700",
  CONNECTED: "bg-emerald-100 text-emerald-700",
  REPLIED: "bg-teal-100 text-teal-700",
  MEETING: "bg-cyan-100 text-cyan-700",
  PROPOSAL: "bg-blue-100 text-blue-700",
  WON: "bg-green-100 text-green-800",
  LOST: "bg-red-100 text-red-700",
  NURTURE: "bg-gray-100 text-gray-600",
};

export function LinkedInOutreachPanel() {
  const { data: prospects, isLoading, refetch } = trpc.leados.linkedin.listProspects.useQuery(undefined);
  const runQueue = trpc.leados.linkedin.runQueue.useMutation();
  const markSent = trpc.leados.linkedin.markSent.useMutation();
  const [briefing, setBriefing] = useState<string>("");

  const onRun = async () => {
    const res = await runQueue.mutateAsync({});
    setBriefing(res.briefing);
    refetch();
  };

  const onMarkSent = async (id: number) => {
    await markSent.mutateAsync({ prospectId: id });
    refetch();
  };

  const list = (prospects as Array<Record<string, any>>) || [];

  return (
    <Card className="border-0 shadow-sm mt-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          LinkedIn Opportunity Engine
          <span className="ml-2 text-xs font-normal text-slate-400">výzkum → scoring → oslovení (ruční odeslání)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-4">
          <Button size="sm" className="gap-2" onClick={onRun} disabled={runQueue.isPending}>
            <RefreshCw className={runQueue.isPending ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
            Spustit denní queue
          </Button>
          {runQueue.data && (
            <span className="text-xs text-slate-500">
              {runQueue.data.messageReady} připraveno · {runQueue.data.rejected} k revizi
            </span>
          )}
        </div>

        {briefing && (
          <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 whitespace-pre-wrap mb-4">
            {briefing}
          </pre>
        )}

        {isLoading ? (
          <p className="text-sm text-slate-400">Načítání prospectů…</p>
        ) : list.length === 0 ? (
          <p className="text-sm text-slate-400">Zatím žádní prospecti.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 pr-4 font-medium">Jméno</th>
                  <th className="py-2 pr-4 font-medium">Firma</th>
                  <th className="py-2 pr-4 font-medium">Score</th>
                  <th className="py-2 pr-4 font-medium">Stav</th>
                  <th className="py-2 pr-4 font-medium">Creep</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{p.name}</td>
                    <td className="py-2 pr-4 text-slate-500">{p.company || "—"}</td>
                    <td className="py-2 pr-4">{p.icpScore ?? 0}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${stateColors[p.leadState] || "bg-slate-100 text-slate-700"}`}>
                        {p.leadState || "DISCOVERED"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-slate-500">{p.creepRisk ?? 0}</td>
                    <td className="py-2">
                      {p.leadState === "MESSAGE_READY" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => onMarkSent(p.id)}
                          disabled={markSent.isPending}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Označit odeslané
                        </Button>
                      )}
                      {p.leadState === "MANUALLY_SENT" && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                          <Send className="w-3 h-3" /> odesláno
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
