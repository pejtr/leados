import express, { type Express } from "express";
import Stripe from "stripe";
import { recordPaidCheckoutSession } from "./payment-service";

export function registerStripeWebhook(app: Express) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json", limit: "1mb" }), async (req, res) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    const signature = req.headers["stripe-signature"];

    if (!stripeKey || !webhookSecret) {
      return res.status(503).json({ error: "Stripe webhook is not configured" });
    }
    if (typeof signature !== "string") {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    const stripe = new Stripe(stripeKey);
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch {
      return res.status(400).json({ error: "Invalid Stripe signature" });
    }

    try {
      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") await recordPaidCheckoutSession(session);
      }
      return res.status(200).json({ received: true });
    } catch (error) {
      console.error("[Stripe webhook] Event processing failed:", error instanceof Error ? error.message : "Unknown error");
      return res.status(500).json({ error: "Webhook processing failed" });
    }
  });
}
