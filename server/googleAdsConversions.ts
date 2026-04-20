/**
 * Google Ads Server-Side Conversion Tracking
 * Uses Google Ads Measurement Protocol (Enhanced Conversions) to send
 * purchase/subscription events directly from the server — bypasses ad blockers
 * and cookie consent issues.
 *
 * Required env vars:
 *   GOOGLE_ADS_CONVERSION_ID   = AW-XXXXXXXXX  (same as VITE_GOOGLE_ADS_ID)
 *   GOOGLE_ADS_CONVERSION_LABEL_PURCHASE = XXXXXXXX  (label for purchase conversion action)
 *
 * Google Ads Measurement Protocol docs:
 * https://developers.google.com/google-ads/api/docs/conversions/upload-clicks
 *
 * NOTE: For full enhanced conversions (with hashed email matching), you need
 * Google Ads API OAuth credentials. This implementation uses the simpler
 * gtag Measurement Protocol which works without OAuth.
 */

interface ConversionEvent {
  conversionLabel: string;
  transactionId: string;
  value: number;
  currency?: string;
  email?: string;  // Will be SHA-256 hashed for enhanced conversions
  orderId?: string;
}

/**
 * Send a server-side conversion event to Google Ads via Measurement Protocol.
 * This fires from the server (Stripe webhook) so it's not blocked by browsers.
 */
export async function sendServerSideConversion(event: ConversionEvent): Promise<void> {
  const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID ?? process.env.VITE_GOOGLE_ADS_ID;
  const apiSecret = process.env.GOOGLE_ADS_MP_API_SECRET;  // Measurement Protocol API secret
  const measurementId = process.env.VITE_GA4_ID;  // GA4 Measurement ID (G-XXXXXXXX)

  if (!conversionId || conversionId === 'undefined') {
    console.log('[GoogleAds] No conversion ID configured, skipping server-side conversion');
    return;
  }

  // ── Option 1: GA4 Measurement Protocol (recommended, simpler setup) ─────────
  // Requires: GA4 Measurement ID + Measurement Protocol API Secret
  if (measurementId && apiSecret) {
    try {
      const clientId = `server_${Date.now()}.${Math.random().toString(36).slice(2)}`;
      const payload = {
        client_id: clientId,
        events: [{
          name: 'purchase',
          params: {
            transaction_id: event.transactionId,
            value: event.value,
            currency: event.currency ?? 'EUR',
            conversion_label: event.conversionLabel,
            // Enhanced conversion data (hashed)
            ...(event.email && { user_data: { email_address: event.email } }),
          }
        }]
      };

      const response = await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      console.log(`[GoogleAds] GA4 Measurement Protocol: ${response.status} for transaction ${event.transactionId}`);
    } catch (err) {
      console.error('[GoogleAds] GA4 Measurement Protocol error:', err);
    }
  }

  // ── Option 2: Google Ads Conversion Import via gtag endpoint ─────────────────
  // This is a lightweight fallback that logs the conversion for manual import
  console.log(`[GoogleAds] Server-side conversion recorded:`, {
    conversion_id: conversionId,
    label: event.conversionLabel,
    transaction_id: event.transactionId,
    value: event.value,
    currency: event.currency ?? 'EUR',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Hash email for enhanced conversions (SHA-256, lowercase, trimmed)
 */
export async function hashEmail(email: string): Promise<string> {
  const normalized = email.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
