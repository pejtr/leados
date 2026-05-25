import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Copy, Share2, TrendingUp, Users, DollarSign, MousePointerClick,
  Trophy, ArrowUpRight, Zap, Gift, ExternalLink
} from "lucide-react";

export default function AffiliateDashboard() {
  const [copied, setCopied] = useState(false);
  const { data: stats, isLoading } = trpc.affiliate.getStats.useQuery();
  const { data: leaderboard } = trpc.affiliate.getLeaderboard.useQuery();

  const referralLink = stats?.code
    ? `${window.location.origin}/?ref=${stats.code}`
    : "";

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Odkaz zkopírován do schránky!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLink = () => {
    if (navigator.share && referralLink) {
      navigator.share({
        title: "LeadOS — AI Lead Generation",
        text: "Zkus LeadOS — nejlepší AI nástroj pro generování B2B leadů. Získej 20% slevu přes můj referral odkaz.",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const conversionRate = stats?.clicks
    ? ((stats.conversions / stats.clicks) * 100).toFixed(1)
    : "0.0";

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Gift className="w-6 h-6 text-amber-400" />
              Affiliate Program
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Vydělávej 20% provizi za každého nového zákazníka, kterého přivedeš.
            </p>
          </div>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 px-3 py-1">
            20% provize
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <MousePointerClick className="w-3.5 h-3.5" />
                Kliknutí
              </div>
              <div className="text-2xl font-bold text-white">{stats?.clicks ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <Users className="w-3.5 h-3.5" />
                Konverze
              </div>
              <div className="text-2xl font-bold text-white">{stats?.conversions ?? 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Konverzní poměr
              </div>
              <div className="text-2xl font-bold text-emerald-400">{conversionRate}%</div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                Celkové výdělky
              </div>
              <div className="text-2xl font-bold text-amber-400">
                €{(stats?.totalEarnings ?? 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                Tvůj referral odkaz
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="h-10 bg-zinc-800 rounded animate-pulse" />
              ) : (
                <>
                  <div className="flex items-center gap-2 bg-zinc-800 rounded-lg px-3 py-2">
                    <code className="text-xs text-emerald-400 flex-1 truncate">{referralLink}</code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-zinc-400 hover:text-white"
                      onClick={copyLink}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
                      onClick={copyLink}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      {copied ? "Zkopírováno!" : "Kopírovat odkaz"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                      onClick={shareLink}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Tvůj kód: <span className="text-amber-400 font-mono font-bold">{stats?.code}</span>
                    {" · "}Provize: <span className="text-emerald-400">{stats?.commissionRate ?? 20}%</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Přehled výdělků
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Čekající výplata</span>
                <span className="text-sm font-semibold text-amber-400">
                  €{(stats?.pendingEarnings ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-zinc-800">
                <span className="text-sm text-zinc-400">Vyplaceno celkem</span>
                <span className="text-sm font-semibold text-emerald-400">
                  €{(stats?.paidEarnings ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-zinc-400">Celkem výdělky</span>
                <span className="text-sm font-bold text-white">
                  €{(stats?.totalEarnings ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3 text-xs text-zinc-400">
                💡 Výplaty probíhají každý měsíc přes Stripe. Minimální výplata €50.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-300">Jak to funguje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { step: "1", title: "Sdílej odkaz", desc: "Pošli svůj unikátní referral odkaz přátelům, kolegům nebo na sociální sítě.", icon: Share2, color: "text-blue-400" },
                { step: "2", title: "Přivedou zákazníky", desc: "Když se někdo přihlásí přes tvůj odkaz a koupí plán, zaznamenáme konverzi.", icon: Users, color: "text-emerald-400" },
                { step: "3", title: "Získáš 20% provizi", desc: "Za každý úspěšný nákup dostaneš 20% z hodnoty transakce na svůj účet.", icon: DollarSign, color: "text-amber-400" },
              ].map((item) => (
                <div key={item.step} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.title}</div>
                    <div className="text-xs text-zinc-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        {leaderboard && leaderboard.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Top Affiliates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((entry: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold w-5 ${i === 0 ? "text-amber-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-700" : "text-zinc-500"}`}>
                        #{i + 1}
                      </span>
                      <span className="text-sm text-zinc-300">{entry.name ?? "Anonym"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{entry.conversions} konverzí</span>
                      <span className="text-emerald-400 font-semibold">€{parseFloat(entry.totalEarnings ?? 0).toFixed(0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Conversions */}
        {stats?.recentConversions && stats.recentConversions.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-300 flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                Poslední konverze
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentConversions.map((conv: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                        {conv.plan ?? "Pro"}
                      </Badge>
                      <span className="text-xs text-zinc-400">
                        {new Date(conv.createdAt).toLocaleDateString("cs-CZ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs ${
                        conv.status === "paid" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                        conv.status === "approved" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      }`}>
                        {conv.status === "paid" ? "Vyplaceno" : conv.status === "approved" ? "Schváleno" : "Čeká"}
                      </Badge>
                      <span className="text-sm font-semibold text-emerald-400">
                        +€{parseFloat(conv.commission ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
