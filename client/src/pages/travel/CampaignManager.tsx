import React, { useState } from "react";
import { trpc } from "../../lib/trpc";
import { Plus, Check, Play, Pause, Send, Smartphone, Monitor, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";

export const CampaignManager: React.FC = () => {
  const { data: campaigns, isLoading, refetch } = trpc.travelNetwork.getCampaigns.useQuery();
  const { data: domains } = trpc.travelNetwork.getDomains.useQuery();

  const createMutation = trpc.travelNetwork.createCampaign.useMutation({
    onSuccess: () => {
      setShowForm(false);
      refetch();
    },
  });

  const submitReviewMutation = trpc.travelNetwork.submitForReview.useMutation({ onSuccess: () => refetch() });
  const approveMutation = trpc.travelNetwork.approveCampaign.useMutation({ onSuccess: () => refetch() });
  const activateMutation = trpc.travelNetwork.activateCampaign.useMutation({ onSuccess: () => refetch() });
  const pauseMutation = trpc.travelNetwork.pauseCampaign.useMutation({ onSuccess: () => refetch() });

  const [showForm, setShowForm] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");

  const [formData, setFormData] = useState({
    name: "",
    objective: "affiliate_revenue" as const,
    sourceDomainId: "",
    targetDomainId: "",
    priority: 100,
    headline: "",
    body: "",
    ctaText: "Zobrazit více",
    format: "native_card" as const,
    targetUrl: "https://www.akcni-letenky.com",
    destination: "",
  });

  if (isLoading) {
    return <div className="p-8 max-w-7xl mx-auto animate-pulse">Načítání kampaní...</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.sourceDomainId || !formData.targetDomainId) {
      alert("Vyberte zdrojovou i cílovou doménu");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Správa kampaní (Campaign Manager)</h1>
          <p className="text-muted-foreground mt-1">
            Vytváření, schvalování a publikace cross-promo nabídek
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> {showForm ? "Zrušit" : "Nová kampaň (Draft)"}
        </Button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <Card className="border border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle>Vytvořit novou kampaň (Draft)</CardTitle>
            <CardDescription>
              Kampaň bude vytvořena ve stavu draft a vyžaduje schválení pro aktivaci.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Název kampaně</label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="např. Sicílie - Akční letenky"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Cíl kampaně (Objective)</label>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={formData.objective}
                    onChange={(e: any) => setFormData({ ...formData, objective: e.target.value })}
                  >
                    <option value="affiliate_revenue">Affiliate Revenue</option>
                    <option value="flight_alternative">Flight Alternative</option>
                    <option value="package_upgrade">Package Upgrade</option>
                    <option value="cross_sell">Cross Sell</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Zdrojová doména (Source)</label>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={formData.sourceDomainId}
                    onChange={(e) => setFormData({ ...formData, sourceDomainId: e.target.value })}
                    required
                  >
                    <option value="">-- Vyberte zdrojovou doménu --</option>
                    {(domains || []).map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Cílová doména (Target)</label>
                  <select
                    className="w-full p-2 border border-input rounded-md bg-background"
                    value={formData.targetDomainId}
                    onChange={(e) => setFormData({ ...formData, targetDomainId: e.target.value })}
                    required
                  >
                    <option value="">-- Vyberte cílovou doménu --</option>
                    {(domains || []).map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.slug})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-semibold text-lg">Kreativita & Obsah</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Titulok (Headline)</label>
                    <Input
                      required
                      value={formData.headline}
                      onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                      placeholder="Najděte levné letenky do Palerma"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">CTA Tlačítko</label>
                    <Input
                      required
                      value={formData.ctaText}
                      onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                      placeholder="Najít letenky"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium">Text (Body)</label>
                    <Textarea
                      required
                      value={formData.body}
                      onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                      placeholder="Porovnejte aktuální odlety z Prahy, Vídně a Katovic."
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Cílová URL (Target URL)</label>
                    <Input
                      required
                      type="url"
                      value={formData.targetUrl}
                      onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Destinace (Cílení)</label>
                    <Input
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                      placeholder="např. palermo nebo italie"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop / Mobile Preview */}
              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-sm">Náhled (Preview)</h4>
                  <div className="flex gap-1 border border-border rounded-md p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                        previewDevice === "desktop" ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      <Monitor className="w-3 h-3" /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`px-2 py-1 text-xs rounded flex items-center gap-1 ${
                        previewDevice === "mobile" ? "bg-primary text-primary-foreground" : ""
                      }`}
                    >
                      <Smartphone className="w-3 h-3" /> Mobil
                    </button>
                  </div>
                </div>

                <div
                  className={`p-4 border border-border rounded-xl bg-card ${
                    previewDevice === "mobile" ? "max-w-sm mx-auto" : "w-full"
                  }`}
                >
                  <div className="text-xs font-semibold text-primary uppercase">Doporučený tip</div>
                  <div className="text-base font-bold text-foreground mt-1">
                    {formData.headline || "Název nabídky"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {formData.body || "Popis nabídky"}
                  </div>
                  <div className="mt-3 text-right">
                    <span className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md inline-block">
                      {formData.ctaText || "CTA Tlačítko"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Zrušit
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  Uložit jako Draft
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List & Governance Workflow */}
      <div className="space-y-4">
        {(campaigns || []).length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Zatím nejsou vytvořeny žádné kampaně.
          </Card>
        ) : (
          (campaigns || []).map((c) => (
            <Card key={c.id} className="border border-border">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-foreground">{c.name}</h3>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          c.editorialStatus === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.editorialStatus === "approved"
                            ? "bg-blue-100 text-blue-800"
                            : c.editorialStatus === "review"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.editorialStatus.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground border border-border px-2 py-0.5 rounded">
                        Zdraví: {c.runtimeHealth}
                      </span>
                    </div>

                    {c.creatives && c.creatives[0] && (
                      <p className="text-sm text-muted-foreground">
                        Kreativa: "{c.creatives[0].headline}" → CTA: "{c.creatives[0].ctaText}"
                      </p>
                    )}
                  </div>

                  {/* Governance Action Controls */}
                  <div className="flex items-center gap-2">
                    {c.editorialStatus === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => submitReviewMutation.mutate({ campaignId: c.id })}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" /> Odeslat ke schválení
                      </Button>
                    )}

                    {c.editorialStatus === "review" && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => approveMutation.mutate({ campaignId: c.id })}
                      >
                        <Check className="w-3.5 h-3.5 mr-1" /> Schválit (Approver)
                      </Button>
                    )}

                    {c.editorialStatus === "approved" && (
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => activateMutation.mutate({ campaignId: c.id })}
                      >
                        <Play className="w-3.5 h-3.5 mr-1" /> Aktivovat
                      </Button>
                    )}

                    {c.editorialStatus === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => pauseMutation.mutate({ campaignId: c.id })}
                      >
                        <Pause className="w-3.5 h-3.5 mr-1" /> Pozastavit
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CampaignManager;
