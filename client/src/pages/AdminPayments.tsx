import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, Clock, Receipt, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  pending: { label: "Čeká na zálohu", cls: "bg-amber-100 text-amber-700" },
  deposit_paid: { label: "Záloha zaplacena", cls: "bg-blue-100 text-blue-700" },
  completed: { label: "Dokončeno", cls: "bg-green-100 text-green-700" },
  cancelled: { label: "Zrušeno", cls: "bg-slate-100 text-slate-500" },
};

function czk(n: number) {
  return n.toLocaleString("cs-CZ") + " Kč";
}

export default function AdminPayments() {
  const { data, isLoading, error } = trpc.stripe.admin.overview.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Načítám platební data…
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Nepodařilo se načíst platby
          </CardTitle>
          <CardDescription className="text-red-600">
            {error?.message || "Zkontrolujte připojení k databázi."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { totals, recentOrders, stripeConnected, stripeBalance } = data;

  return (
    <div className="space-y-6">
      {/* Stripe connection banner */}
      <Card className={stripeConnected ? "bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-200" : "bg-slate-50 border-slate-200"}>
        <CardContent className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stripeConnected ? "bg-violet-600" : "bg-slate-300"}`}>
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                Stripe platby
                {stripeConnected ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Připojeno
                  </span>
                ) : (
                  <span className="text-xs font-medium text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">Nepřipojeno</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {stripeConnected ? "Zálohy a doplatky se zpracovávají přes Stripe." : "Nastavte STRIPE_SECRET_KEY pro živý zůstatek."}
              </p>
            </div>
          </div>
          {stripeBalance && (
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">{czk(Math.round(stripeBalance.available / 100))}</div>
              <p className="text-xs text-slate-500">dostupné · {czk(Math.round(stripeBalance.pending / 100))} čeká</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-slate-600">Zaplaceno celkem</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{czk(totals.paidRevenue)}</div>
                <p className="text-xs text-slate-500 mt-1">{totals.paymentCount} úspěšných plateb</p>
              </div>
              <Wallet className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-slate-600">Čeká na zálohu</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{czk(totals.pendingRevenue)}</div>
                <p className="text-xs text-slate-500 mt-1">nezaplacené objednávky</p>
              </div>
              <Clock className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-slate-600">Doplatky po spuštění</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{czk(totals.outstanding)}</div>
                <p className="text-xs text-slate-500 mt-1">zbývá doplatit</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-slate-600">Objednávky</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{totals.orderCount}</div>
                <p className="text-xs text-slate-500 mt-1">celkem vytvořeno</p>
              </div>
              <CreditCard className="w-8 h-8 text-violet-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>Poslední objednávky</CardTitle>
          <CardDescription>Přehled objednávek a jejich platebního stavu</CardDescription>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Zatím žádné objednávky.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-400 border-b">
                    <th className="pb-2 font-medium">#</th>
                    <th className="pb-2 font-medium">Zákazník</th>
                    <th className="pb-2 font-medium">Balíček</th>
                    <th className="pb-2 font-medium text-right">Cena</th>
                    <th className="pb-2 font-medium text-right">Záloha</th>
                    <th className="pb-2 font-medium">Stav</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const st = STATUS_LABEL[o.status] ?? { label: o.status, cls: "bg-slate-100 text-slate-600" };
                    return (
                      <tr key={o.id} className="border-b last:border-0 hover:bg-slate-50">
                        <td className="py-3 text-slate-400">{o.id}</td>
                        <td className="py-3">
                          <div className="font-medium text-slate-800">{o.customerName}</div>
                          <div className="text-xs text-slate-400">{o.customerEmail}</div>
                        </td>
                        <td className="py-3 text-slate-600">{o.packageType}</td>
                        <td className="py-3 text-right font-medium text-slate-800">{czk(o.totalPrice)}</td>
                        <td className="py-3 text-right text-slate-600">{czk(o.depositAmount)}</td>
                        <td className="py-3">
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
