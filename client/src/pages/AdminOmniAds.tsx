import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Megaphone, MousePointerClick, RadioTower, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AdminOmniAds() {
  const utils = trpc.useUtils();
  const { data: sites = [], isLoading: sitesLoading } = trpc.omniAds.listSites.useQuery();
  const { data: creatives = [] } = trpc.omniAds.listCreatives.useQuery();
  const { data: stats = [] } = trpc.omniAds.stats.useQuery();

  const setSiteEnabled = trpc.omniAds.setSiteEnabled.useMutation({
    onSuccess: async ({ siteKey, enabled }) => {
      await utils.omniAds.listSites.invalidate();
      toast.success(`${siteKey}: ${enabled ? "OMNI ADS ON" : "OMNI ADS OFF"}`);
    },
    onError: (error) => toast.error(error.message),
  });

  const setCreativeEnabled = trpc.omniAds.setCreativeEnabled.useMutation({
    onSuccess: async () => {
      await utils.omniAds.listCreatives.invalidate();
      toast.success("Creative state updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const impressions = stats
    .filter((row) => row.eventType === "impression")
    .reduce((sum, row) => sum + Number(row.count || 0), 0);
  const clicks = stats
    .filter((row) => row.eventType === "click")
    .reduce((sum, row) => sum + Number(row.count || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-violet-600" />
          <h2 className="text-2xl font-bold text-slate-900">OMNI ADS</h2>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          LEAD OS reklamní síť: CustomStream → MainStream fallback → frequency cap.
          Weby jsou fail-closed a zobrazují reklamy až po aktivaci zde.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aktivní weby</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {sites.filter((site) => site.enabled).length}/{sites.length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Aktivní kreativy</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">
            {creatives.filter((creative) => creative.enabled).length}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" />Impressions</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{impressions.toLocaleString("cs-CZ")}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MousePointerClick className="h-4 w-4" />Clicks</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{clicks.toLocaleString("cs-CZ")}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RadioTower className="h-5 w-5" />
            Weby / distribuční uzly
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {sitesLoading && <div className="py-4 text-sm text-slate-500">Načítám…</div>}
          {sites.map((site) => (
            <div key={site.siteKey} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{site.name}</div>
                <div className="truncate text-xs text-slate-500">
                  {site.domain || site.siteKey}
                </div>
                <div className="mt-1 flex gap-1">
                  {site.customStreamEnabled && <Badge variant="secondary">CustomStream</Badge>}
                  {site.mainstreamFallbackEnabled && <Badge variant="outline">MainStream fallback</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={site.enabled ? "text-xs font-semibold text-emerald-600" : "text-xs text-slate-400"}>
                  {site.enabled ? "ON" : "OFF"}
                </span>
                <Switch
                  checked={site.enabled}
                  disabled={setSiteEnabled.isPending}
                  onCheckedChange={(enabled) =>
                    setSiteEnabled.mutate({ siteKey: site.siteKey, enabled })
                  }
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kreativy</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          {creatives.map((creative) => (
            <div key={creative.creativeKey} className="flex items-center justify-between gap-4 py-4">
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{creative.title}</div>
                <div className="truncate text-xs text-slate-500">{creative.creativeKey}</div>
                <div className="mt-1 flex gap-1">
                  <Badge variant={creative.stream === "custom" ? "secondary" : "outline"}>
                    {creative.stream}
                  </Badge>
                  <Badge variant="outline">cap {creative.frequencyCap}/{creative.frequencyWindowHours}h</Badge>
                </div>
              </div>
              <Switch
                checked={creative.enabled}
                disabled={setCreativeEnabled.isPending}
                onCheckedChange={(enabled) =>
                  setCreativeEnabled.mutate({
                    creativeKey: creative.creativeKey,
                    enabled,
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
