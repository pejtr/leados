import { invokeLLM } from "./_core/llm";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email using Manus built-in email service
 * In production, this would integrate with SendGrid, Resend, or similar
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For now, we'll use a placeholder implementation
    // In production, integrate with your email service
    console.log(`[Email] Sending to ${options.to}: ${options.subject}`);
    
    // TODO: Integrate with actual email service (SendGrid, Resend, etc.)
    // For MVP, we'll just log it
    return true;
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    return false;
  }
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  packageType: string,
  totalPrice: number,
  depositAmount: number,
  checkoutUrl?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0066cc;">Potvrzení vaší objednávky</h2>
      
      <p>Dobrý den ${customerName},</p>
      
      <p>Děkujeme za vaši objednávku! Zde jsou detaily:</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Číslo objednávky:</strong> #${orderId}</p>
        <p><strong>Balíček:</strong> ${packageType}</p>
        <p><strong>Cena balíčku:</strong> ${(totalPrice / 100).toFixed(0)} Kč</p>
        <p><strong>Záloha (30%):</strong> ${(depositAmount / 100).toFixed(0)} Kč</p>
        <p><strong>Zbývá zaplatit:</strong> ${((totalPrice - depositAmount) / 100).toFixed(0)} Kč</p>
      </div>
      
      ${checkoutUrl ? `
        <p style="text-align: center; margin: 30px 0;">
          <a href="${checkoutUrl}" style="background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Zaplatit zálohu
          </a>
        </p>
      ` : ''}
      
      <p>Jakmile obdržíme vaši zálohu, začneme s přípravou vašeho webu. Projekt bude hotový během 1-2 týdnů.</p>
      
      <p>Máte-li jakékoliv otázky, neváhejte nás kontaktovat.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
        ONYX WEB — Profesionální weby za rozumné ceny<br/>
        <a href="https://onyxweb.cz" style="color: #0066cc; text-decoration: none;">onyxweb.cz</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Potvrzení objednávky #${orderId} — ONYX WEB`,
    html,
  });
}

/**
 * Send payment confirmation email to customer
 */
export async function sendPaymentConfirmationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  amount: number,
  invoiceUrl?: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00aa44;">Platba přijata ✓</h2>
      
      <p>Dobrý den ${customerName},</p>
      
      <p>Vaše platba byla úspěšně zpracována!</p>
      
      <div style="background: #f0f9f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00aa44;">
        <p><strong>Číslo objednávky:</strong> #${orderId}</p>
        <p><strong>Zaplacená částka:</strong> ${(amount / 100).toFixed(0)} Kč</p>
        <p><strong>Stav:</strong> Zaplaceno</p>
      </div>
      
      <p>Vaše web je nyní v přípravě. Budeme vás průběžně informovat o pokroku.</p>
      
      ${invoiceUrl ? `
        <p style="text-align: center; margin: 20px 0;">
          <a href="${invoiceUrl}" style="color: #0066cc; text-decoration: none;">Stáhnout fakturu</a>
        </p>
      ` : ''}
      
      <p>Sledujte svůj projekt v <a href="https://onyxweb.cz/dashboard" style="color: #0066cc; text-decoration: none;">osobním dashboardu</a>.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
        ONYX WEB — Profesionální weby za rozumné ceny<br/>
        <a href="https://onyxweb.cz" style="color: #0066cc; text-decoration: none;">onyxweb.cz</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Platba přijata — Objednávka #${orderId}`,
    html,
  });
}

/**
 * Send project completion email to customer
 */
export async function sendProjectCompletionEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  websiteUrl: string
): Promise<boolean> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #00aa44;">Váš web je hotový! 🎉</h2>
      
      <p>Dobrý den ${customerName},</p>
      
      <p>Vaše web je hotový a nyní je dostupný online!</p>
      
      <div style="background: #f0f9f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #00aa44;">
        <p><strong>Číslo objednávky:</strong> #${orderId}</p>
        <p><strong>Adresa webu:</strong> <a href="${websiteUrl}" style="color: #0066cc; text-decoration: none; word-break: break-all;">${websiteUrl}</a></p>
      </div>
      
      <p style="text-align: center; margin: 30px 0;">
        <a href="${websiteUrl}" style="background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Zobrazit web
        </a>
      </p>
      
      <p>Pokud máte jakékoliv dotazy nebo chcete provést úpravy, kontaktujte nás prosím.</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
        ONYX WEB — Profesionální weby za rozumné ceny<br/>
        <a href="https://onyxweb.cz" style="color: #0066cc; text-decoration: none;">onyxweb.cz</a>
      </p>
    </div>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `Váš web je hotový! — Objednávka #${orderId}`,
    html,
  });
}
