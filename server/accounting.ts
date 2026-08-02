/**
 * Czech Accounting Integration (Pohoda / Money / Fakturace)
 *
 * Generates official Czech invoices (faktury) with proper formatting.
 * Supports export to Pohoda XML format and Money import format.
 *
 * Nastavení:
 * - ACCOUNTING_SYSTEM v .env: "pohoda" | "money" | "fakturace" | "none"
 * - ACCOUNTING_EXPORT_DIR v .env: path for XML export files
 */

import { PUBLIC_SITE_URL } from "../shared/brand-config";
import { BRAND_CONFIG } from "../shared/brand-config";

interface InvoiceItem {
  name: string;
  quantity: number;
  unitPrice: number; // CZK
  vatRate: number; // 0, 15, 21
  unit?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  variableSymbol: string;
  issuedAt: Date;
  dueAt: Date;
  supplier: {
    name: string;
    address: string;
    city: string;
    postalCode: string;
    companyId: string;
    vatId: string;
  };
  customer: {
    name: string;
    company?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    companyId?: string;
    vatId?: string;
  };
  items: InvoiceItem[];
  totalWithoutVat: number;
  totalVat: number;
  totalWithVat: number;
  currency: string;
  note?: string;
}

function formatCzk(value: number): string {
  return `${value.toLocaleString("cs-CZ")} Kč`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("cs-CZ");
}

export function generateInvoiceNumber(orderId: number, createdAt: Date): string {
  return `${createdAt.getFullYear()}-${String(orderId).padStart(5, "0")}`;
}

export function generateVariableSymbol(orderId: number, createdAt: Date): string {
  return `${createdAt.getFullYear()}${String(orderId).padStart(5, "0")}`;
}

export function calculateInvoiceTotals(items: InvoiceItem[]): {
  totalWithoutVat: number;
  totalVat: number;
  totalWithVat: number;
} {
  let totalWithoutVat = 0;
  let totalVat = 0;

  for (const item of items) {
    const itemTotal = item.unitPrice * item.quantity;
    const itemVat = Math.round(itemTotal * item.vatRate / 100);
    totalWithoutVat += itemTotal;
    totalVat += itemVat;
  }

  return {
    totalWithoutVat,
    totalVat,
    totalWithVat: totalWithoutVat + totalVat,
  };
}

// ─── HTML Invoice Generation ──────────────────────────────────────────────────

export function generateInvoiceHtml(data: InvoiceData): string {
  const itemsHtml = data.items.map((item, idx) => {
    const lineTotal = item.unitPrice * item.quantity;
    const lineVat = Math.round(lineTotal * item.vatRate / 100);
    return `
      <tr>
        <td style="padding:8px;border:1px solid #e2e8f0;">${idx + 1}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(item.name)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${item.quantity} ${item.unit || "ks"}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${formatCzk(item.unitPrice)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${item.vatRate}%</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${formatCzk(lineTotal)}</td>
        <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${formatCzk(lineVat)}</td>
      </tr>
    `;
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <title>Faktura ${data.invoiceNumber}</title>
    </head>
    <body style="font-family:Arial,sans-serif;color:#0f172a;max-width:800px;margin:0 auto;padding:20px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:30px;">
        <div>
          <h1 style="margin:0;color:#4f46e5;font-size:28px;">FAKTURA</h1>
          <p style="margin:5px 0 0;color:#64748b;">č. ${escapeHtml(data.invoiceNumber)}</p>
        </div>
        <div style="text-align:right;">
          <div style="font-size:20px;font-weight:800;letter-spacing:2px;">OPTIMATEO</div>
          <div style="color:#64748b;font-size:12px;">DIGITAL AGENCY</div>
        </div>
      </div>

      <div style="display:flex;gap:30px;margin-bottom:25px;">
        <div style="flex:1;background:#f8fafc;padding:15px;border-radius:8px;">
          <h3 style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;">Dodavatel</h3>
          <p style="margin:0;font-weight:600;">${escapeHtml(data.supplier.name)}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#475569;">${escapeHtml(data.supplier.address)}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#475569;">${escapeHtml(data.supplier.postalCode)} ${escapeHtml(data.supplier.city)}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#475569;">IČO: ${escapeHtml(data.supplier.companyId)}</p>
          <p style="margin:2px 0 0;font-size:13px;color:#475569;">DIČ: ${escapeHtml(data.supplier.vatId)}</p>
        </div>
        <div style="flex:1;background:#f8fafc;padding:15px;border-radius:8px;">
          <h3 style="margin:0 0 8px;font-size:13px;color:#64748b;text-transform:uppercase;">Odběratel</h3>
          <p style="margin:0;font-weight:600;">${escapeHtml(data.customer.name)}</p>
          ${data.customer.company ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${escapeHtml(data.customer.company)}</p>` : ""}
          ${data.customer.address ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${escapeHtml(data.customer.address)}</p>` : ""}
          ${data.customer.postalCode && data.customer.city ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">${escapeHtml(data.customer.postalCode)} ${escapeHtml(data.customer.city)}</p>` : ""}
          ${data.customer.companyId ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">IČO: ${escapeHtml(data.customer.companyId)}</p>` : ""}
          ${data.customer.vatId ? `<p style="margin:2px 0 0;font-size:13px;color:#475569;">DIČ: ${escapeHtml(data.customer.vatId)}</p>` : ""}
        </div>
      </div>

      <div style="display:flex;gap:30px;margin-bottom:25px;">
        <div><strong>Datum vystavení:</strong> ${formatDate(data.issuedAt)}</div>
        <div><strong>Datum splatnosti:</strong> ${formatDate(data.dueAt)}</div>
        <div><strong>Variabilní symbol:</strong> ${escapeHtml(data.variableSymbol)}</div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <thead>
          <tr style="background:#020617;color:#fff;">
            <th style="padding:8px;border:1px solid #334155;">#</th>
            <th style="padding:8px;border:1px solid #334155;text-align:left;">Název</th>
            <th style="padding:8px;border:1px solid #334155;">Množství</th>
            <th style="padding:8px;border:1px solid #334155;">Cena/jedn.</th>
            <th style="padding:8px;border:1px solid #334155;">DPH</th>
            <th style="padding:8px;border:1px solid #334155;">Celkem bez DPH</th>
            <th style="padding:8px;border:1px solid #334155;">DPH částka</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div style="text-align:right;margin-bottom:25px;">
        <table style="margin-left:auto;border-collapse:collapse;">
          <tr>
            <td style="padding:5px 15px;font-weight:600;">Celkem bez DPH:</td>
            <td style="padding:5px 15px;text-align:right;font-weight:600;">${formatCzk(data.totalWithoutVat)}</td>
          </tr>
          <tr>
            <td style="padding:5px 15px;font-weight:600;">Celkem DPH:</td>
            <td style="padding:5px 15px;text-align:right;font-weight:600;">${formatCzk(data.totalVat)}</td>
          </tr>
          <tr style="background:#f1f5f9;">
            <td style="padding:8px 15px;font-weight:800;font-size:16px;">CELKEM K ÚHRADĚ:</td>
            <td style="padding:8px 15px;text-align:right;font-weight:800;font-size:16px;color:#4f46e5;">${formatCzk(data.totalWithVat)}</td>
          </tr>
        </table>
      </div>

      ${data.note ? `<p style="margin:20px 0;padding:10px;background:#f8fafc;border-radius:6px;font-size:13px;color:#475569;"><strong>Poznámka:</strong> ${escapeHtml(data.note)}</p>` : ""}

      <div style="margin-top:30px;padding-top:15px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
        <p style="margin:0;">Faktura byla vygenerována systémem OPTIMATEO. ${PUBLIC_SITE_URL}</p>
        <p style="margin:5px 0 0;">Úhrada proběhne převodem na účet č. ${BRAND_CONFIG.billingInfo.bankAccount}</p>
      </div>
    </body>
    </html>
  `;
}

function escapeHtml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ─── Pohoda XML Export ────────────────────────────────────────────────────────

export function generatePohodaXml(invoice: InvoiceData): string {
  const items = invoice.items.map((item, idx) => {
    const lineTotal = item.unitPrice * item.quantity;
    return `
      <stock>
        <quantity>${item.quantity}</quantity>
        <unit>${item.unit || "ks"}</unit>
        <name>${escapeXml(item.name)}</name>
        <unitPrice>${item.unitPrice.toFixed(2)}</unitPrice>
        <vat>${item.vatRate}</vat>
        <total>${lineTotal.toFixed(2)}</total>
      </stock>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<data xmlns="http://www.stormware.cz/schema/version_2/data.xsd" version="2.0">
  <invoice version="2.0">
    <invoiceHeader>
      <invoiceType>issuedInvoice</invoiceType>
      <number>${escapeXml(invoice.invoiceNumber)}</number>
      <date>${formatXmlDate(invoice.issuedAt)}</date>
      <myIdentity>
        <company>${escapeXml(invoice.supplier.name)}</company>
        <street>${escapeXml(invoice.supplier.address)}</street>
        <city>${escapeXml(invoice.supplier.city)}</city>
        <zip>${escapeXml(invoice.supplier.postalCode)}</zip>
        <ico>${escapeXml(invoice.supplier.companyId)}</ico>
        <dic>${escapeXml(invoice.supplier.vatId)}</dic>
      </myIdentity>
      <partnerIdentity>
        <company>${escapeXml(invoice.customer.name)}</company>
        ${invoice.customer.address ? `<street>${escapeXml(invoice.customer.address)}</street>` : ""}
        ${invoice.customer.city ? `<city>${escapeXml(invoice.customer.city)}</city>` : ""}
        ${invoice.customer.postalCode ? `<zip>${escapeXml(invoice.customer.postalCode)}</zip>` : ""}
        ${invoice.customer.companyId ? `<ico>${escapeXml(invoice.customer.companyId)}</ico>` : ""}
        ${invoice.customer.vatId ? `<dic>${escapeXml(invoice.customer.vatId)}</dic>` : ""}
      </partnerIdentity>
      <datePayment>${formatXmlDate(invoice.dueAt)}</datePayment>
      <variableSymbol>${escapeXml(invoice.variableSymbol)}</variableSymbol>
      <note>${escapeXml(invoice.note || "")}</note>
    </invoiceHeader>
    <invoiceDetail>${items}
    </invoiceDetail>
    <invoiceSummary>
      <totalWithoutVat>${invoice.totalWithoutVat.toFixed(2)}</totalWithoutVat>
      <totalVat>${invoice.totalVat.toFixed(2)}</totalVat>
      <totalWithVat>${invoice.totalWithVat.toFixed(2)}</totalWithVat>
    </invoiceSummary>
  </invoice>
</data>`;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatXmlDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ─── Money Import Format ──────────────────────────────────────────────────────

export function generateMoneyImportCsv(invoice: InvoiceData): string {
  const header = "Číslo dokladu;Datum;Splatnost;Variabilní symbol;Dodavatel;Odběratel;Položka;Množství;Cena;DPH%;Celkem bez DPH;Celkem s DPH";

  const rows = invoice.items.map((item) => {
    const lineTotal = item.unitPrice * item.quantity;
    const lineVat = Math.round(lineTotal * item.vatRate / 100);
    return [
      invoice.invoiceNumber,
      formatDate(invoice.issuedAt),
      formatDate(invoice.dueAt),
      invoice.variableSymbol,
      invoice.supplier.name,
      invoice.customer.name,
      item.name,
      item.quantity,
      item.unitPrice,
      item.vatRate,
      lineTotal,
      lineTotal + lineVat,
    ].join(";");
  });

  return [header, ...rows].join("\n");
}
