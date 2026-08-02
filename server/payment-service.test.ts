import type Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { recordPaidCheckoutSession } from "./payment-service";

const mocks = vi.hoisted(() => ({
  createPayment: vi.fn(),
  getInquiryById: vi.fn(),
  getOrderByStripeSession: vi.fn(),
  getPaymentsByOrder: vi.fn(),
  updateInquiry: vi.fn(),
  updateOrder: vi.fn(),
  sendPaymentConfirmationEmail: vi.fn(),
}));

vi.mock("./db", () => ({
  createPayment: mocks.createPayment,
  getInquiryById: mocks.getInquiryById,
  getOrderByStripeSession: mocks.getOrderByStripeSession,
  getPaymentsByOrder: mocks.getPaymentsByOrder,
  updateInquiry: mocks.updateInquiry,
  updateOrder: mocks.updateOrder,
}));

vi.mock("./email-service", () => ({
  sendPaymentConfirmationEmail: mocks.sendPaymentConfirmationEmail,
}));

const order = {
  id: 12,
  inquiryId: 7,
  packageType: "ONYX_OS_AUDIT",
  totalPrice: 4_900,
  depositPercentage: 100,
  depositAmount: 4_900,
  remainingAmount: 0,
  status: "pending" as const,
  stripeCheckoutSessionId: "cs_test_paid",
  stripePaymentIntentId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const inquiry = {
  id: 7,
  name: "Jan Novák",
  email: "jan@example.com",
  phone: null,
  businessDescription: null,
  packageType: "audit",
  details: JSON.stringify({ lifecycle: { proposal_sent: { at: "2026-07-14T10:00:00Z" } } }),
  source: "test",
  createdAt: new Date(),
  status: "contacted" as const,
  notes: null,
};

function paidSession(amountTotal = 490_000) {
  return {
    id: "cs_test_paid",
    payment_status: "paid",
    currency: "czk",
    amount_total: amountTotal,
    payment_intent: "pi_test_paid",
    metadata: { orderId: "12" },
  } as Stripe.Checkout.Session;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOrderByStripeSession.mockResolvedValue(order);
  mocks.getPaymentsByOrder.mockResolvedValue([]);
  mocks.getInquiryById.mockResolvedValue(inquiry);
  mocks.createPayment.mockResolvedValue({ insertId: 1 });
  mocks.updateOrder.mockResolvedValue({ affectedRows: 1 });
  mocks.updateInquiry.mockResolvedValue({ ...inquiry, status: "converted" });
  mocks.sendPaymentConfirmationEmail.mockResolvedValue(true);
});

describe("recordPaidCheckoutSession", () => {
  it("records a verified CZK deposit and updates the lead lifecycle", async () => {
    const result = await recordPaidCheckoutSession(paidSession());

    expect(result).toMatchObject({ orderId: 12, amountInCzk: 4_900, newlyRecorded: true });
    expect(mocks.createPayment).toHaveBeenCalledWith({
      orderId: 12,
      amount: 4_900,
      type: "deposit",
      stripePaymentIntentId: "pi_test_paid",
      status: "succeeded",
    });
    expect(mocks.updateOrder).toHaveBeenCalledWith(12, {
      status: "deposit_paid",
      stripePaymentIntentId: "pi_test_paid",
    });
    const inquiryUpdate = mocks.updateInquiry.mock.calls[0][1];
    expect(inquiryUpdate.status).toBe("converted");
    expect(JSON.parse(inquiryUpdate.details).lifecycle.deposit_paid).toMatchObject({ orderId: 12, amountInCzk: 4_900 });
    expect(mocks.sendPaymentConfirmationEmail).toHaveBeenCalledWith("jan@example.com", "Jan Novák", 12, 4_900);
  });

  it("is idempotent when Stripe retries the same payment", async () => {
    mocks.getPaymentsByOrder.mockResolvedValueOnce([{
      id: 1,
      orderId: 12,
      amount: 4_900,
      type: "deposit",
      stripePaymentIntentId: "pi_test_paid",
      status: "succeeded",
      invoiceUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }]);

    const result = await recordPaidCheckoutSession(paidSession());

    expect(result.newlyRecorded).toBe(false);
    expect(mocks.createPayment).not.toHaveBeenCalled();
    expect(mocks.updateOrder).toHaveBeenCalledOnce();
  });

  it("rejects a checkout amount that differs from the order", async () => {
    await expect(recordPaidCheckoutSession(paidSession(500_000))).rejects.toThrow("Checkout amount mismatch");
    expect(mocks.createPayment).not.toHaveBeenCalled();
    expect(mocks.updateOrder).not.toHaveBeenCalled();
  });
});
