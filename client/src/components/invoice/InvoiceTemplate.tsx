export type InvoiceParty = {
  name: string;
  company?: string;
  street?: string;
  city?: string;
  postalCode?: string;
  companyId?: string;
  vatId?: string;
  email?: string;
};

export type InvoiceLine = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceDocument = {
  invoiceNumber: string;
  variableSymbol: string;
  issueDate: string;
  dueDate: string;
  taxableDate: string;
  customer: InvoiceParty;
  lines: InvoiceLine[];
  status: "paid" | "pending";
  note?: string;
};

export function formatInvoiceCurrency(value: number) {
  return new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatInvoiceDate(value: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("cs-CZ").format(new Date(`${value}T12:00:00`));
}

export function getInvoiceTotal(invoice: InvoiceDocument) {
  return invoice.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
}
