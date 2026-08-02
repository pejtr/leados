import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, TrendingUp, DollarSign } from "lucide-react";
import { useMemo } from "react";

interface NichePackage {
  id: number;
  name: string;
  niche: string;
  description: string | null;
  price: number;
  features: string;
  active: number;
  createdAt: Date;
}

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

export default function AdminStats() {
  const { data: packages = [] } = trpc.nichePackages.list.useQuery();
  const { data: subscriptions = [] } = trpc.subscriptions.list.useQuery({ customerId: 0 });

  const stats = useMemo(() => {
    const activePackages = (packages as NichePackage[]).filter((p) => p.active === 1).length;
    const activeSubscriptions = (subscriptions as CustomerSubscription[]).filter((s) => s.active === 1).length;
    const monthlyRevenue = (subscriptions as CustomerSubscription[])
      .filter((s) => s.active === 1)
      .reduce((sum, s) => sum + s.monthlyPrice, 0);
    const totalRevenue = (subscriptions as CustomerSubscription[]).reduce((sum, s) => sum + s.monthlyPrice, 0);

    return {
      totalPackages: packages.length,
      activePackages,
      totalSubscriptions: subscriptions.length,
      activeSubscriptions,
      monthlyRevenue,
      totalRevenue,
    };
  }, [packages, subscriptions]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Packages */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Celkem Balíčků</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.totalPackages}</div>
                <p className="text-xs text-slate-500 mt-1">
                  {stats.activePackages} aktivních
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Aktivní Předplatná</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.activeSubscriptions}</div>
                <p className="text-xs text-slate-500 mt-1">
                  z {stats.totalSubscriptions} celkem
                </p>
              </div>
              <Users className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Měsíční Příjem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.monthlyRevenue.toLocaleString('cs-CZ')} Kč</div>
                <p className="text-xs text-slate-500 mt-1">
                  z aktivních předplatných
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-amber-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-600">Celkový Příjem</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-bold text-slate-900">{stats.totalRevenue.toLocaleString('cs-CZ')} Kč</div>
                <p className="text-xs text-slate-500 mt-1">
                  všechna předplatná
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Packages Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Přehled Balíčků</CardTitle>
            <CardDescription>Statistika dostupných niche balíčků</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-slate-600">Celkem balíčků</span>
              <span className="font-semibold text-lg">{stats.totalPackages}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-slate-600">Aktivních</span>
              <span className="font-semibold text-lg text-green-600">{stats.activePackages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Neaktivních</span>
              <span className="font-semibold text-lg text-slate-500">
                {stats.totalPackages - stats.activePackages}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subscriptions Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Přehled Předplatných</CardTitle>
            <CardDescription>Statistika předplatných zákazníků</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-slate-600">Celkem předplatných</span>
              <span className="font-semibold text-lg">{stats.totalSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-slate-600">Aktivních</span>
              <span className="font-semibold text-lg text-green-600">{stats.activeSubscriptions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Zrušených</span>
              <span className="font-semibold text-lg text-slate-500">
                {stats.totalSubscriptions - stats.activeSubscriptions}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Rychlé Tipy</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• Pravidelně kontrolujte aktivní předplatná a jejich fakturaci</p>
          <p>• Nové balíčky se zobrazí na webu automaticky</p>
          <p>• Zrušená předplatná se stále zobrazují v historii</p>
          <p>• Měsíční příjem je vypočítán z aktivních předplatných</p>
        </CardContent>
      </Card>
    </div>
  );
}
