/**
 * Email Tracking & Unsubscribe Endpoints
 *
 * Express routes for email open tracking, click tracking, and unsubscribe.
 * These are called by email clients when recipients open or click links.
 */

import { type Express } from "express";
import { trackOpen, trackClick } from "./email-campaign";
import { removeSubscriber } from "./email-campaign";
import { PUBLIC_SITE_URL } from "../shared/brand-config";

const ONE_PIXEL_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export function registerEmailTrackingRoutes(app: Express) {
  // Open tracking pixel
  app.get("/api/email/track/open", async (req, res) => {
    const cid = Number(req.query.cid);
    const sid = Number(req.query.sid);

    if (cid > 0 && sid > 0) {
      // Track asynchronously, don't block response
      trackOpen(cid, sid).catch(() => {});
    }

    res.set({
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.send(ONE_PIXEL_GIF);
  });

  // Click tracking redirect
  app.get("/api/email/track/click", async (req, res) => {
    const cid = Number(req.query.cid);
    const sid = Number(req.query.sid);
    const url = String(req.query.url || "");

    if (cid > 0 && sid > 0 && url) {
      trackClick(cid, sid, url).catch(() => {});
    }

    // Redirect to the actual URL
    if (url && url.startsWith("http")) {
      res.redirect(302, url);
    } else {
      res.redirect(302, PUBLIC_SITE_URL);
    }
  });

  // Unsubscribe page
  app.get("/api/email/unsubscribe", async (req, res) => {
    const email = String(req.query.email || "");

    if (!email || !email.includes("@")) {
      res.status(400).send(buildUnsubscribePage("Neplatná e-mailová adresa.", false));
      return;
    }

    const success = await removeSubscriber(email);

    if (success) {
      res.send(buildUnsubscribePage("Byli jste úspěšně odhlášeni z odběru novinek.", true));
    } else {
      res.status(500).send(buildUnsubscribePage("Nepodařilo se zpracovat váš požadavek. Zkuste to prosím později.", false));
    }
  });
}

function buildUnsubscribePage(message: string, success: boolean): string {
  return `
    <!DOCTYPE html>
    <html lang="cs">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Odhlaseni z odběru | OPTIMATEO</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; border-radius: 10px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        h1 { font-size: 20px; margin-bottom: 16px; }
        p { color: #64748b; line-height: 1.6; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        a { color: #4f46e5; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon">${success ? "✅" : "❌"}</div>
        <h1>Odhlášení z odběru</h1>
        <p>${message}</p>
        <p style="margin-top: 24px;">
          <a href="${PUBLIC_SITE_URL}">Zpět na optimateo.com</a>
        </p>
      </div>
    </body>
    </html>
  `;
}
