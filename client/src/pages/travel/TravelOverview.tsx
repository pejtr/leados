import React from "react";
import { trpc } from "../../lib/trpc";
import {
  TrendingUp,
  MousePointer,
  Eye,
  ArrowRightLeft,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plane,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

export const TravelOverview: React.FC = () => {
  const { data: overview, isLoading, refetch } = trpc.travelNetwork.getOverview.useQuery();
  const seedDomains = trpc.travelNetwork.seedPilotDomains.useMutation({
    onSuccess: () => refetch(),
  });
  const seedCampaign = trpc.travelNetwork.seedPilotCampaign.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    aria_busy: true;
    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 w-64 bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const metrics = overview || {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    crossDomainArrivals: 0,
    affiliateClicks: 0,
    pendingConversions: 0,
    confirmedConversions: 0,
    pendingCommission: 0,
    confirmedCommission: 0,
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Travel Revenue Network
            </h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Centrální měření, cross-promo atribuce a řízení prodejů pro cestovatelské weby
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => seedDomains.mutate()}
            disabled={seedDomains.isPending}
          >
            Předvyplnit domény
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => seedCampaign.mutate()}
            disabled={seedCampaign.isPending}
          >
            Předvyplnit pilotní kampaň (Draft)
          </Button>
        </div>
      </div>

      {/* Primary Network KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Impressions & Kliky
            </CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.impressions.toLocaleString()} imp</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.clicks.toLocaleString()} kliků ({metrics.ctr}% CTR)
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cross-Domain Přechody
            </CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.crossDomainArrivals.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Unikátní meziwebové příchody
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Affiliate Kliky
            </CardTitle>
            <MousePointer className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.affiliateClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Odkazy na partnery
            </p>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Potvrzená Provize
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {metrics.confirmedCommission.toLocaleString()} Kč
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.confirmedConversions} potvrzených konverzí
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown: Confirmed vs Pending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border border-emerald-500/20 bg-emerald-50/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" /> Potvrzený Výnos (Confirmed)
            </CardTitle>
            <CardTitle className="text-2xl font-bold text-emerald-700 mt-2">
              {metrics.confirmedCommission.toLocaleString()} Kč
            </CardTitle>
            <CardDescription>
              {metrics.confirmedConversions} schválených konverzí od affiliate partnerů
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="border border-amber-500/20 bg-amber-50/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <Clock className="w-5 h-5" /> Čekající Výnos (Pending)
            </CardTitle>
            <CardTitle className="text-2xl font-bold text-amber-700 mt-2">
              {metrics.pendingCommission.toLocaleString()} Kč
            </CardTitle>
            <CardDescription>
              {metrics.pendingConversions} čekajících konverzí (nezahrnuje se do čistého zisku)
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};

export default TravelOverview;
