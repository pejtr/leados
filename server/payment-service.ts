import type Stripe from "stripe";
import {
  createPayment,
  getInquiryById,
  getOrderByStripeSession,
  getPaymentsByOrder,
  updateInquiry,
  updateOrder,
} from "./db";
import { sendPaymentConfirmationEmail } from "./email-service";

function parseDetails(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

export async function recordPaidCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") throw new Error("Payment is not completed");
  if (session.currency?.toLowerCase() !== "czk" || session.amount_total == null) {
    throw new Error("Unexpected payment currency or amount");
  }

  const order = await getOrderByStripeSession(session.id);
  if (!order) throw new Error("Order not found");

  const metadataOrderId = Number(session.metadata?.orderId || 0);
  if (metadataOrderId && metadataOrderId !== order.id) throw new Error("Checkout metadata mismatch");

  const amountInCzk = Math.round(session.amount_total / 100);
  if (amountInCzk !== order.depositAmount) throw new Error("Checkout amount mismatch");

  const paymentIntentId = typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent?.id;
  const paymentReference = paymentIntentId || `checkout:${session.id}`;
  let existingPayments = await getPaymentsByOrder(order.id);
  let newlyRecorded = false;

  if (!existingPayments.some(payment => payment.stripePaymentIntentId === paymentReference)) {
    try {
      await createPayment({
        orderId: order.id,
        amount: amountInCzk,
        type: "deposit",
        stripePaymentIntentId: paymentReference,
        status: "succeeded",
      });
      newlyRecorded = true;
    } catch (error) {
      existingPayments = await getPaymentsByOrder(order.id);
      if (!existingPayments.some(payment => payment.stripePaymentIntentId === paymentReference)) throw error;
    }
  }

  await updateOrder(order.id, {
    status: "deposit_paid",
    stripePaymentIntentId: paymentReference,
  });

  const inquiry = await getInquiryById(order.inquiryId);
  let emailDelivered = false;
  if (inquiry) {
    const details = parseDetails(inquiry.details);
    const lifecycle = typeof details.lifecycle === "object" && details.lifecycle !== null && !Array.isArray(details.lifecycle)
      ? details.lifecycle as Record<string, unknown>
      : {};
    lifecycle.deposit_paid = {
      at: new Date().toISOString(),
      orderId: order.id,
      amountInCzk,
      paymentReference,
    };
    await updateInquiry(inquiry.id, {
      details: JSON.stringify({ ...details, lifecycle }),
      status: "converted",
    });

    emailDelivered = await sendPaymentConfirmationEmail(
      inquiry.email,
      inquiry.name,
      order.id,
      amountInCzk,
    );
  }

  return {
    orderId: order.id,
    amountInCzk,
    paymentReference,
    newlyRecorded,
    emailDelivered,
  };
}
