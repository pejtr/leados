import { useEffect, useMemo, useState } from "react";
import { FileText, Printer, ReceiptText } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InvoicePelikan } from "@/components/invoice/InvoicePelikan";
import type { InvoiceDocument } from "@/components/invoice/InvoiceTemplate";

function toInputDate(value: Date | string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toInputDate(date);
}

type InvoiceSource = {
  orderId: number;
  invoiceNumber: string;
  variableSymbol: string;
  packageType: string;
  invoiceAmount: number;
  status: "paid" | "pending";
  createdAt: Date | string;
  customer: InvoiceDocument["customer"];
};

function createInvoiceDraft(source: InvoiceSource): InvoiceDocument {
  const issueDate = toInputDate(source.createdAt);
  return {
    invoiceNumber: source.invoiceNumber,
    variableSymbol: source.variableSymbol,
    issueDate,
    dueDate: addDays(issueDate, 14),
    taxableDate: issueDate,
    customer: { ...source.customer },
    lines: [{
      description: source.packageType || "Digitální služby OPTIMATEO",
      quantity: 1,
      unitPrice: source.invoiceAmount,
    }],
    status: source.status,
    note: "Děkujeme za spolupráci.",
  };
}

export default function AdminInvoices() {
  const invoicesQuery = trpc.billing.list.useQuery();
  const sources = invoicesQuery.data ?? [];
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const source = useMemo(
    () => sources.find(item => item.orderId === selectedOrderId) ?? sources[0],
    [selectedOrderId, sources]
  );
  const [invoice, setInvoice] = useState<InvoiceDocument | null>(null);

  useEffect(() => {
    if (source) {
      setSelectedOrderId(source.orderId);
      setInvoice(createInvoiceDraft(source));
    }
  }, [source?.orderId]);

  const updateCustomer = (field: keyof InvoiceDocument["customer"], value: string) => {
    setInvoice(current => current ? { ...current, customer: { ...current.customer, [field]: value } } : current);
  };

  const updateInvoice = <K extends keyof InvoiceDocument>(field: K, value: InvoiceDocument[K]) => {
    setInvoice(current => current ? { ...current, [field]: value } : current);
  };

  if (invoicesQuery.isLoading) {
    return <div className="py-16 text-center text-sm text-slate-500">Načítám faktury…</div>;
  }

  if (invoicesQuery.error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm text-red-800">
        Faktury se nepodařilo načíst. Zkontrolujte připojení databáze a oprávnění administrátora.
      </div>
    );
  }

  if (!source || !invoice) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white py-16 text-center">
        <ReceiptText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <p className="font-semibold text-slate-700">Zatím nejsou žádné objednávky k fakturaci.</p>
      </div>
    );
  }

  const primaryLine = invoice.lines[0] ?? { description: "", quantity: 1, unitPrice: 0 };

  return (
    <div className="space-y-6">
      <style>{`@media print { @page { size: A4; margin: 10mm; } body { background: white !important; } body * { visibility: hidden; } .invoice-sheet, .invoice-sheet * { visibility: visible; } .invoice-sheet { position: absolute; inset: 0; width: 100%; } }`}</style>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Faktury</h2>
          <p className="mt-1 text-sm text-slate-600">Výchozí šablona Pelikán, připravená pro tisk nebo uložení do PDF.</p>
        </div>
        <Button onClick={() => window.print()} className="gap-2 bg-slate-900 text-white hover:bg-slate-800">
          <Printer className="h-4 w-4" /> Vytisknout / uložit PDF
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-5 print:hidden">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <Label htmlFor="invoice-order">Objednávka</Label>
            <select
              id="invoice-order"
              value={source.orderId}
              onChange={event => setSelectedOrderId(Number(event.target.value))}
              className="mt-2 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
            >
              {sources.map(item => (
                <option key={item.orderId} value={item.orderId}>
                  {item.invoiceNumber} · {item.customer.name || item.customer.email}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-900"><FileText className="h-4 w-4" /> Údaje faktury</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div><Label>Číslo faktury</Label><Input value={invoice.invoiceNumber} onChange={event => updateInvoice("invoiceNumber", event.target.value)} /></div>
              <div><Label>Variabilní symbol</Label><Input value={invoice.variableSymbol} onChange={event => updateInvoice("variableSymbol", event.target.value.replace(/\D/g, ""))} /></div>
              <div><Label>Datum vystavení</Label><Input type="date" value={invoice.issueDate} onChange={event => updateInvoice("issueDate", event.target.value)} /></div>
              <div><Label>Datum splatnosti</Label><Input type="date" value={invoice.dueDate} onChange={event => updateInvoice("dueDate", event.target.value)} /></div>
              <div><Label>Datum plnění</Label><Input type="date" value={invoice.taxableDate} onChange={event => updateInvoice("taxableDate", event.target.value)} /></div>
              <div>
                <Label>Stav</Label>
                <select value={invoice.status} onChange={event => updateInvoice("status", event.target.value as InvoiceDocument["status"])} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value="pending">K úhradě</option>
                  <option value="paid">Uhrazeno</option>
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 font-bold text-slate-900">Odběratel</h3>
            <div className="space-y-3">
              <div><Label>Firma</Label><Input value={invoice.customer.company ?? ""} onChange={event => updateCustomer("company", event.target.value)} /></div>
              <div><Label>Kontaktní osoba</Label><Input value={invoice.customer.name} onChange={event => updateCustomer("name", event.target.value)} /></div>
              <div><Label>Ulice</Label><Input value={invoice.customer.street ?? ""} onChange={event => updateCustomer("street", event.target.value)} /></div>
              <div className="grid grid-cols-[110px_1fr] gap-2"><div><Label>PSČ</Label><Input value={invoice.customer.postalCode ?? ""} onChange={event => updateCustomer("postalCode", event.target.value)} /></div><div><Label>Město</Label><Input value={invoice.customer.city ?? ""} onChange={event => updateCustomer("city", event.target.value)} /></div></div>
              <div className="grid grid-cols-2 gap-2"><div><Label>IČO</Label><Input value={invoice.customer.companyId ?? ""} onChange={event => updateCustomer("companyId", event.target.value)} /></div><div><Label>DIČ</Label><Input value={invoice.customer.vatId ?? ""} onChange={event => updateCustomer("vatId", event.target.value)} /></div></div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="mb-4 font-bold text-slate-900">Položka</h3>
            <div className="space-y-3">
              <div><Label>Popis</Label><Input value={primaryLine.description} onChange={event => updateInvoice("lines", [{ ...primaryLine, description: event.target.value }])} /></div>
              <div><Label>Cena v Kč</Label><Input type="number" min="0" value={primaryLine.unitPrice} onChange={event => updateInvoice("lines", [{ ...primaryLine, unitPrice: Number(event.target.value) || 0 }])} /></div>
              <div><Label>Poznámka</Label><Textarea value={invoice.note ?? ""} onChange={event => updateInvoice("note", event.target.value)} /></div>
            </div>
          </div>
        </aside>

        <div className="overflow-x-auto bg-slate-200 p-2 sm:p-6 print:overflow-visible print:bg-white print:p-0">
          <InvoicePelikan invoice={invoice} />
        </div>
      </div>
    </div>
  );
}
