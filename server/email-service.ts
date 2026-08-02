import { PUBLIC_SITE_URL } from "../shared/brand-config";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  idempotencyKey?: string;
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
let missingConfigWarningShown = false;

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeHttpUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatCzk(value: number) {
  return `${value.toLocaleString("cs-CZ")} Kč`;
}

function emailLayout(title: string, accent: string, content: string) {
  return `
    <!doctype html>
    <html lang="cs">
      <body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif;">
        <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(title)}</div>
        <div style="max-width:620px;margin:0 auto;padding:28px 16px;">
          <div style="background:#020617;border-radius:10px 10px 0 0;padding:22px 28px;color:#fff;">
            <div style="font-size:20px;font-weight:800;letter-spacing:3px;">OPTIMATEO</div>
            <div style="margin-top:5px;color:#a5b4fc;font-size:12px;letter-spacing:2px;">DIGITAL AGENCY</div>
          </div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-top:4px solid ${accent};border-radius:0 0 10px 10px;padding:30px 28px;line-height:1.65;">
            <h1 style="margin:0 0 22px;color:#0f172a;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
            ${content}
            <p style="margin:34px 0 0;border-top:1px solid #e2e8f0;padding-top:20px;color:#64748b;font-size:12px;">
              OPTIMATEO · IČO 02558220 · Čechovo nábřeží 518, Pardubice<br />
              <a href="${PUBLIC_SITE_URL}" style="color:#4f46e5;">optimateo.com</a> ·
              <a href="mailto:info@optimateo.com" style="color:#4f46e5;">info@optimateo.com</a> ·
              <a href="${PUBLIC_SITE_URL}/obchodni-podminky" style="color:#4f46e5;">obchodní podmínky</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (!missingConfigWarningShown) {
      console.warn("[Email] Delivery disabled: RESEND_API_KEY and EMAIL_FROM must be configured.");
      missingConfigWarningShown = true;
    }
    return false;
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        ...(process.env.EMAIL_REPLY_TO?.trim()
          ? { reply_to: process.env.EMAIL_REPLY_TO.trim() }
          : {}),
      }),
    });

    const result = await response.json().catch(() => null) as { id?: string; message?: string } | null;
    if (!response.ok) {
      console.error(`[Email] Resend rejected request (${response.status}): ${result?.message || response.statusText}`);
      return false;
    }

    console.log(`[Email] Delivered to provider${result?.id ? ` (${result.id})` : ""}.`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown transport error";
    console.error(`[Email] Delivery failed: ${message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  packageType: string,
  totalPrice: number,
  depositAmount: number,
  checkoutUrl?: string
): Promise<boolean> {
  const checkoutHref = safeHttpUrl(checkoutUrl);
  const content = `
    <p>Dobrý den ${escapeHtml(customerName)},</p>
    <p>navazujeme na domluvený rozsah. Níže najdete nabídku a bezpečný platební odkaz.</p>
    <div style="margin:22px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:18px 20px;">
      <p style="margin:0 0 7px;"><strong>Číslo nabídky:</strong> #${orderId}</p>
      <p style="margin:0 0 7px;"><strong>Služba:</strong> ${escapeHtml(packageType)}</p>
      <p style="margin:0 0 7px;"><strong>Celková cena:</strong> ${formatCzk(totalPrice)}</p>
      <p style="margin:0 0 7px;"><strong>${depositAmount === totalPrice ? "K úhradě" : "Záloha"}:</strong> ${formatCzk(depositAmount)}</p>
      <p style="margin:0;"><strong>Zbývá zaplatit:</strong> ${formatCzk(totalPrice - depositAmount)}</p>
    </div>
    ${checkoutHref ? `
      <p style="margin:28px 0;text-align:center;">
        <a href="${escapeHtml(checkoutHref)}" style="display:inline-block;border-radius:7px;background:#4f46e5;padding:13px 24px;color:#fff;text-decoration:none;font-weight:700;">Zaplatit zálohu</a>
      </p>
    ` : ""}
    <p>Úhradou potvrzujete tuto nabídku a <a href="${PUBLIC_SITE_URL}/obchodni-podminky" style="color:#4f46e5;">obchodní podmínky</a>. Po přijetí platby potvrdíme harmonogram a další krok projektu.</p>
    <p style="font-size:12px;color:#64748b;">Pokud objednáváte jako spotřebitel a žádáte zahájení služby před uplynutím zákonné lhůty pro odstoupení, napište nám tuto výslovnou žádost odpovědí na e-mail. Samotná úhrada takovou žádost nenahrazuje.</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Nabídka a platební odkaz #${orderId} | OPTIMATEO`,
    html: emailLayout("Nabídka a platební odkaz", "#4f46e5", content),
    idempotencyKey: `order-offer-${orderId}`,
  });
}

export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  amount: number,
  invoiceUrl?: string
): Promise<boolean> {
  const invoiceHref = safeHttpUrl(invoiceUrl);
  const content = `
    <p>Dobrý den ${escapeHtml(customerName)},</p>
    <p>platbu jsme úspěšně přijali.</p>
    <div style="margin:22px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:18px 20px;">
      <p style="margin:0 0 7px;"><strong>Číslo objednávky:</strong> #${orderId}</p>
      <p style="margin:0 0 7px;"><strong>Zaplacená částka:</strong> ${formatCzk(amount)}</p>
      <p style="margin:0;"><strong>Stav:</strong> Zaplaceno</p>
    </div>
    ${invoiceHref ? `<p><a href="${escapeHtml(invoiceHref)}" style="color:#4f46e5;font-weight:700;">Stáhnout fakturu</a></p>` : ""}
    <p>O dalším postupu vás budeme průběžně informovat. Stav projektu najdete také v <a href="${PUBLIC_SITE_URL}/dashboard" style="color:#4f46e5;">osobním dashboardu</a>.</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Platba přijata | Objednávka #${orderId}`,
    html: emailLayout("Platba přijata", "#059669", content),
    idempotencyKey: `payment-confirmation-${orderId}-${amount}`,
  });
}

export async function sendProjectCompletionEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  websiteUrl: string
): Promise<boolean> {
  const websiteHref = safeHttpUrl(websiteUrl);
  if (!websiteHref) {
    console.error("[Email] Project completion email skipped: invalid website URL.");
    return false;
  }

  const content = `
    <p>Dobrý den ${escapeHtml(customerName)},</p>
    <p>váš web je připravený a dostupný online.</p>
    <div style="margin:22px 0;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:18px 20px;">
      <p style="margin:0 0 7px;"><strong>Číslo objednávky:</strong> #${orderId}</p>
      <p style="margin:0;"><strong>Adresa webu:</strong> <a href="${escapeHtml(websiteHref)}" style="color:#4f46e5;word-break:break-all;">${escapeHtml(websiteHref)}</a></p>
    </div>
    <p style="margin:28px 0;text-align:center;">
      <a href="${escapeHtml(websiteHref)}" style="display:inline-block;border-radius:7px;background:#4f46e5;padding:13px 24px;color:#fff;text-decoration:none;font-weight:700;">Zobrazit web</a>
    </p>
    <p>Připomínky nebo další požadavky nám můžete poslat odpovědí na tento e-mail.</p>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Váš web je připravený | Objednávka #${orderId}`,
    html: emailLayout("Váš web je připravený", "#059669", content),
    idempotencyKey: `project-completion-${orderId}`,
  });
}
