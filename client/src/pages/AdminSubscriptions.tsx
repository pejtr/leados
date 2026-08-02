import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cs } from "date-fns/locale";

interface CustomerSubscription {
  id: number;
  customerId: number;
  packageId: number;
  active: number;
  startDate: Date;
  endDate: Date | null;
  monthlyPrice: number;
  nextBillingDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminSubscriptions() {
  const { data: subscriptions = [] } = trpc.subscriptions.list.useQuery({ customerId: 0 });
  const cancelMutation = trpc.subscriptions.cancel.useMutation();

  const handleCancel = async (subscriptionId: number) => {
    if (confirm("Opravdu chcete zrušit toto předplatné?")) {
      try {
        await cancelMutation.mutateAsync({ subscriptionId });
        toast.success("Předplatné zrušeno");
      } catch (error) {
        toast.error("Chyba při zrušení předplatného");
      }
    }
  };

  const getStatusBadge = (active: number) => {
    if (active === 1) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
          <CheckCircle2 className="w-3 h-3" />
          Aktivní
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-800 flex items-center gap-1 w-fit">
        <XCircle className="w-3 h-3" />
        Zrušeno
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Aktivní Předplatná</h2>
        <p className="text-slate-600 mt-1">Spravujte předplatná zákazníků na niche balíčky</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Předplatná ({subscriptions.length})</CardTitle>
          <CardDescription>Seznam všech předplatných zákazníků</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Zatím nejsou vytvořena žádná předplatná</p>
              <p className="text-slate-400 text-sm mt-1">Předplatná se vytvoří, když si zákazník objedná niche balíček</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Zákazník ID</TableHead>
                    <TableHead>Balíček ID</TableHead>
                    <TableHead>Cena/měsíc</TableHead>
                    <TableHead>Začátek</TableHead>
                    <TableHead>Další fakturace</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Akce</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub: CustomerSubscription) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium">#{sub.id}</TableCell>
                      <TableCell>#{sub.customerId}</TableCell>
                      <TableCell>#{sub.packageId}</TableCell>
                      <TableCell className="font-semibold text-blue-600">{sub.monthlyPrice} Kč</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(sub.startDate), "d. MMM yyyy", { locale: cs })}
                      </TableCell>
                      <TableCell className="text-sm">
                        {sub.nextBillingDate
                          ? format(new Date(sub.nextBillingDate), "d. MMM yyyy", { locale: cs })
                          : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.active)}</TableCell>
                      <TableCell className="text-right">
                        {sub.active === 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(sub.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={cancelMutation.isPending}
                          >
                            {cancelMutation.isPending ? "Zrušuji..." : "Zrušit"}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Informace o fakturaci</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Předplatná se fakturují měsíčně v den zahájení</p>
          <p>• Zrušení předplatného se projeví v příštím fakturačním cyklu</p>
          <p>• Všechny ceny jsou v českých korunách (Kč)</p>
        </CardContent>
      </Card>
    </div>
  );
}
