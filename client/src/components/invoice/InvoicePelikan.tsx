import { activeConfig } from "@shared/brand-config";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  getInvoiceTotal,
  type InvoiceDocument,
} from "./InvoiceTemplate";

export function InvoicePelikan({ invoice }: { invoice: InvoiceDocument }) {
  const supplier = activeConfig.billingInfo;
  const total = getInvoiceTotal(invoice);

  return (
    <article className="invoice-sheet mx-auto min-h-[297mm] w-full max-w-[210mm] bg-white p-6 text-slate-900 shadow-xl sm:p-10 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-8 border-b-2 border-slate-900 pb-8">
        <div>
          <OptimateoLogo className="h-10" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-600">
            Fakturační profil {supplier.profileName}
          </p>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-black">FAKTURA</h1>
          <p className="mt-1 text-sm font-semibold">{invoice.invoiceNumber}</p>
          <span className={`mt-3 inline-block rounded px-3 py-1 text-xs font-bold uppercase ${invoice.status === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {invoice.status === "paid" ? "Uhrazeno" : "K úhradě"}
          </span>
        </div>
      </header>

      <section className="grid gap-8 py-8 sm:grid-cols-2">
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Dodavatel</h2>
          <p className="font-bold">{activeConfig.legalName}</p>
          <p>{supplier.street}</p>
          <p>{supplier.city}, {supplier.postalCode} {supplier.region}</p>
          <p>{supplier.country}</p>
          <div className="mt-3 text-sm">
            <p>IČO: {supplier.companyId}</p>
            <p>DIČ: {supplier.vatId}</p>
            <p>{supplier.vatPayer ? "Plátce DPH" : "Nejsem plátce DPH"}</p>
          </div>
        </div>
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Odběratel</h2>
          <p className="font-bold">{invoice.customer.company || invoice.customer.name}</p>
          {invoice.customer.company && <p>{invoice.customer.name}</p>}
          {invoice.customer.street && <p>{invoice.customer.street}</p>}
          {(invoice.customer.postalCode || invoice.customer.city) && <p>{invoice.customer.postalCode} {invoice.customer.city}</p>}
          <div className="mt-3 text-sm">
            {invoice.customer.companyId && <p>IČO: {invoice.customer.companyId}</p>}
            {invoice.customer.vatId && <p>DIČ: {invoice.customer.vatId}</p>}
            {invoice.customer.email && <p>{invoice.customer.email}</p>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 border-y border-slate-200 py-5 text-sm sm:grid-cols-4">
        <div><p className="text-xs text-slate-400">Datum vystavení</p><p className="font-semibold">{formatInvoiceDate(invoice.issueDate)}</p></div>
        <div><p className="text-xs text-slate-400">Datum splatnosti</p><p className="font-semibold">{formatInvoiceDate(invoice.dueDate)}</p></div>
        <div><p className="text-xs text-slate-400">Datum plnění</p><p className="font-semibold">{formatInvoiceDate(invoice.taxableDate)}</p></div>
        <div><p className="text-xs text-slate-400">Variabilní symbol</p><p className="font-semibold">{invoice.variableSymbol}</p></div>
      </section>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b border-slate-300 text-left text-xs uppercase text-slate-400">
            <th className="py-3">Položka</th>
            <th className="py-3 text-right">Množství</th>
            <th className="py-3 text-right">Cena</th>
            <th className="py-3 text-right">Celkem</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line, index) => (
            <tr key={`${line.description}-${index}`} className="border-b border-slate-100">
              <td className="py-4 font-medium">{line.description}</td>
              <td className="py-4 text-right">{line.quantity}</td>
              <td className="py-4 text-right">{formatInvoiceCurrency(line.unitPrice)}</td>
              <td className="py-4 text-right font-semibold">{formatInvoiceCurrency(line.quantity * line.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-sm text-sm">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Platební údaje</h2>
          <p>Bankovní účet: <strong>{supplier.bankAccount}</strong></p>
          <p>Variabilní symbol: <strong>{invoice.variableSymbol}</strong></p>
          {supplier.iban ? (
            <p>IBAN: <strong>{supplier.iban}</strong></p>
          ) : (
            <div className="mt-3 border border-dashed border-slate-300 p-3 text-xs text-slate-500">
              QR platba bude dostupná po doplnění IBAN do fakturačního profilu.
            </div>
          )}
        </div>
        <div className="min-w-64 border-t-2 border-slate-900 pt-4 text-right">
          <p className="text-sm text-slate-500">Celkem k úhradě</p>
          <p className="text-3xl font-black">{formatInvoiceCurrency(total)}</p>
        </div>
      </section>

      {invoice.note && <p className="mt-10 border-t border-slate-100 pt-4 text-xs text-slate-500">{invoice.note}</p>}
      <footer className="mt-12 text-center text-xs text-slate-400">
        Vystaveno elektronicky. {activeConfig.brandName} · {supplier.email}
      </footer>
    </article>
  );
}
