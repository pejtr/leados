import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { CalendarClock, CheckCircle2, CreditCard, FileCheck2, Mail, Phone, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { CHECKOUT_OFFERS, CHECKOUT_OFFER_IDS, formatCzk, type CheckoutOfferId } from "@shared/service-catalog";

type LifecycleEntry = {
  at?: string;
  scheduledFor?: string;
  timezone?: string;
};

type LeadLifecycle = Partial<Record<"lead_qualified" | "call_booked" | "proposal_sent", LifecycleEntry>>;

function readLifecycle(value: string | null): LeadLifecycle {
  if (!value) return {};
  try {
    const details = JSON.parse(value) as { lifecycle?: LeadLifecycle };
    return details.lifecycle ?? {};
  } catch {
    return {};
  }
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("cs-CZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatBookedSlot(entry?: LifecycleEntry) {
  if (!entry?.scheduledFor) return null;
  const [date, time] = entry.scheduledFor.split("T");
  const [year, month, day] = date.split("-");
  return `${day}. ${month}. ${year} v ${time}`;
}

function defaultCheckoutOffer(packageType: string | null): CheckoutOfferId {
  if (packageType === "Jednostránkový") return "LITE_WEB";
  if (packageType === "Vícestránkový") return "BASIC_WEB";
  if (packageType === "Speciální") return "ONYX_OS_SETUP";
  return "ONYX_OS_AUDIT";
}

export default function AdminLeads() {
  const utils = trpc.useUtils();
  const [selectedOffers, setSelectedOffers] = useState<Record<number, CheckoutOfferId>>({});
  const { data: inquiries, isLoading, error } = trpc.inquiries.list.useQuery();
  const lifecycleMutation = trpc.inquiries.recordLifecycle.useMutation({
    onSuccess: async () => {
      await utils.inquiries.list.invalidate();
      toast.success("Stav leadu byl uložen.");
    },
    onError: () => toast.error("Stav leadu se nepodařilo uložit."),
  });
  const checkoutMutation = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: async ({ checkoutUrl, emailDelivered }) => {
      await utils.inquiries.list.invalidate();
      let copied = false;
      if (checkoutUrl && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(checkoutUrl);
          copied = true;
        } catch {
          copied = false;
        }
      }
      if (!emailDelivered) {
        toast.warning(copied
          ? "Odkaz je vytvořený a zkopírovaný, ale odeslání e-mailu se nepotvrdilo."
          : "Odkaz je vytvořený, ale e-mail ani kopírování se nepotvrdily.");
        return;
      }
      toast.success(copied
        ? "Platební odkaz byl odeslán e-mailem a zkopírován."
        : "Platební odkaz byl odeslán e-mailem.");
    },
    onError: (mutationError) => toast.error(mutationError.message || "Platební odkaz se nepodařilo vytvořit."),
  });

  const totals = useMemo(() => {
    const leads = inquiries ?? [];
    return {
      all: leads.length,
      qualified: leads.filter((lead) => Boolean(readLifecycle(lead.details).lead_qualified)).length,
      calls: leads.filter((lead) => Boolean(readLifecycle(lead.details).call_booked)).length,
      proposals: leads.filter((lead) => Boolean(readLifecycle(lead.details).proposal_sent)).length,
    };
  }, [inquiries]);

  if (isLoading) {
    return <Card><CardContent className="p-8 text-center text-slate-500">Načítám poptávky...</CardContent></Card>;
  }

  if (error) {
    return <Card><CardContent className="p-8 text-center text-red-600">Poptávky se nepodařilo načíst.</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Leady a obchodní funnel</h2>
        <p className="mt-1 text-sm text-slate-500">Skutečné obchodní kroky uložené přímo u jednotlivých poptávek.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Poptávky", totals.all],
          ["Kvalifikované", totals.qualified],
          ["Rezervované hovory", totals.calls],
          ["Odeslané nabídky", totals.proposals],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          </div>
        ))}
      </div>

      {!inquiries?.length ? (
        <Card><CardContent className="p-8 text-center text-slate-500">Zatím nepřišla žádná poptávka.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((lead) => {
            const lifecycle = readLifecycle(lead.details);
            const bookedSlot = formatBookedSlot(lifecycle.call_booked);
            const mutationPending = lifecycleMutation.isPending && lifecycleMutation.variables?.inquiryId === lead.id;
            const selectedOffer = selectedOffers[lead.id] ?? defaultCheckoutOffer(lead.packageType);
            const checkoutPending = checkoutMutation.isPending && checkoutMutation.variables?.inquiryId === lead.id;

            return (
              <Card key={lead.id} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                        <Badge variant="secondary">{lead.status}</Badge>
                        <span className="text-xs text-slate-400">#{lead.id} · {formatDate(lead.createdAt)}</span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{lead.businessDescription || "Bez popisu firmy"}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        <a className="inline-flex items-center gap-1.5 text-violet-700 hover:underline" href={`mailto:${lead.email}`}>
                          <Mail className="h-4 w-4" /> {lead.email}
                        </a>
                        {lead.phone && (
                          <a className="inline-flex items-center gap-1.5 text-violet-700 hover:underline" href={`tel:${lead.phone}`}>
                            <Phone className="h-4 w-4" /> {lead.phone}
                          </a>
                        )}
                        <span className="text-slate-500">Zdroj: {lead.source || "web"}</span>
                      </div>
                      {bookedSlot && (
                        <p className="mt-3 inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800">
                          <CalendarClock className="h-4 w-4" /> Hovor: {bookedSlot}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 xl:max-w-lg">
                      <div className="flex flex-wrap gap-2 xl:justify-end">
                        <Button
                          size="sm"
                          variant={lifecycle.lead_qualified ? "secondary" : "outline"}
                          disabled={Boolean(lifecycle.lead_qualified) || mutationPending}
                          onClick={() => lifecycleMutation.mutate({ inquiryId: lead.id, event: "lead_qualified" })}
                        >
                          {lifecycle.lead_qualified ? <CheckCircle2 className="mr-1.5 h-4 w-4" /> : <UserRoundCheck className="mr-1.5 h-4 w-4" />}
                          {lifecycle.lead_qualified ? "Kvalifikováno" : "Kvalifikovat"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const script = `Ahoj! Tady OPTIMATEO. Díval jsem se na váš web (${lead.name}) a vytvořil pro vás rychlý rozbor:\n1. CTA Tlačítko pod ohybem mobilu\n2. Rychlost načítání obrázků\n3. Formulář má příliš polí\n\nChcete to opravit přes náš Fix Sprint se slevou 1 000 Kč?`;
                            navigator.clipboard.writeText(script);
                            toast.success("Loom skript zkopírován do schránky!");
                          }}
                        >
                          <FileCheck2 className="mr-1.5 h-4 w-4" /> Loom Skript
                        </Button>
                        <Button
                          size="sm"
                          variant={lifecycle.proposal_sent ? "secondary" : "outline"}
                          disabled={Boolean(lifecycle.proposal_sent) || mutationPending}
                          onClick={() => lifecycleMutation.mutate({ inquiryId: lead.id, event: "proposal_sent" })}
                        >
                          {lifecycle.proposal_sent ? <CheckCircle2 className="mr-1.5 h-4 w-4" /> : <FileCheck2 className="mr-1.5 h-4 w-4" />}
                          {lifecycle.proposal_sent ? "Nabídka odeslána" : "Označit nabídku"}
                        </Button>
                      </div>
                      <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-2 sm:flex-row">
                        <select
                          aria-label="Nabídka pro platební odkaz"
                          value={selectedOffer}
                          onChange={(event) => setSelectedOffers((current) => ({
                            ...current,
                            [lead.id]: event.target.value as CheckoutOfferId,
                          }))}
                          className="h-9 min-w-56 rounded-md border border-slate-300 bg-white px-2 text-sm text-slate-800"
                        >
                          {CHECKOUT_OFFER_IDS.map((offerId) => (
                            <option key={offerId} value={offerId}>
                              {CHECKOUT_OFFERS[offerId].name} · {formatCzk(CHECKOUT_OFFERS[offerId].priceInCzk)}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          disabled={checkoutPending}
                          onClick={() => checkoutMutation.mutate({ inquiryId: lead.id, packageType: selectedOffer })}
                          className="bg-slate-900 text-white hover:bg-slate-800"
                        >
                          <CreditCard className="mr-1.5 h-4 w-4" />
                          {checkoutPending ? "Vytvářím..." : "Odeslat platební odkaz"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
