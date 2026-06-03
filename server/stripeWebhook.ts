import Stripe from "stripe";
import type { Express, Request, Response } from "express";
import express from "express";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendServerSideConversion } from "./googleAdsConversions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});

export function registerStripeWebhook(app: Express) {
  // Must be raw body BEFORE express.json() — registered separately in index.ts
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          sig,
          process.env.STRIPE_WEBHOOK_SECRET ?? ""
        );
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      // Handle test events
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({ verified: true });
      }

      console.log(`[Stripe Webhook] Event: ${event.type} (${event.id})`);

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.user_id;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            if (userId) {
              const db = await getDb();
              if (db) {
                await db
                  .update(users)
                  .set({
                    stripeCustomerId: customerId ?? null,
                    stripeSubscriptionId: subscriptionId ?? null,
                    subscriptionStatus: "active",
                    subscriptionPlan: session.metadata?.plan ?? "starter",
                  } as any)
                  .where(eq(users.id, parseInt(userId)));
                console.log(`[Stripe Webhook] User ${userId} subscription activated`);

                // ── Server-side Google Ads conversion (bypasses ad blockers) ──
                const plan = session.metadata?.plan ?? 'starter';
                const planValues: Record<string, number> = { starter: 149, growth: 399, pro: 799 };
                const conversionValue = planValues[plan] ?? 149;
                const customerEmail = session.customer_details?.email ?? session.metadata?.customer_email;
                await sendServerSideConversion({
                  conversionLabel: process.env.GOOGLE_ADS_CONVERSION_LABEL_PURCHASE ?? 'purchase',
                  transactionId: session.id,
                  value: conversionValue,
                  currency: 'EUR',
                  email: customerEmail ?? undefined,
                  orderId: session.id,
                }).catch(e => console.error('[GoogleAds] Conversion send failed:', e));
              }
            }
            break;
          }

          case "customer.subscription.deleted":
          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const customerId = subscription.customer as string;
            const status = subscription.status;

            // Find user by stripe customer id
            const db = await getDb();
            if (db) {
              const userRows = await db
                .select()
                .from(users)
                .where(eq((users as any).stripeCustomerId, customerId))
                .limit(1);

              if (userRows.length > 0) {
                await db
                  .update(users)
                  .set({
                    subscriptionStatus: status === "active" ? "active" : "inactive",
                  } as any)
                  .where(eq(users.id, userRows[0].id));
                console.log(`[Stripe Webhook] User ${userRows[0].id} subscription status: ${status}`);
              }
            }
            break;
          }

          case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            console.log(`[Stripe Webhook] Payment failed for customer: ${invoice.customer}`);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      } catch (err) {
        console.error("[Stripe Webhook] Handler error:", err);
        return res.status(500).json({ error: "Webhook handler failed" });
      }

      res.json({ received: true });
    }
  );
}
