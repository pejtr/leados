import Stripe from "stripe";
import { protectedProcedure } from "./_core/trpc";
import { createOrder, getInquiryById, getOrder, updateOrder, getPaymentsByOrder } from "./db";
import { ONYXWEB_PRODUCTS, calculateDeposit, calculateRemaining, toStripeMinorUnits } from "./stripe-products";
import { PUBLIC_SITE_URL } from "../shared/brand-config";

export const stripeRouter = {
  createCheckoutSession: protectedProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return {
        packageType: String(obj.packageType || ""),
        inquiryId: Number(obj.inquiryId || 0),
      };
    })
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
      const inquiry = await getInquiryById(input.inquiryId);
      if (!inquiry) throw new Error("Inquiry not found");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const packageKey = input.packageType.toUpperCase().replace(/-/g, "_") as keyof typeof ONYXWEB_PRODUCTS;
      const product = ONYXWEB_PRODUCTS[packageKey];

      if (!product) {
        throw new Error("Invalid package type");
      }

      const depositAmount = calculateDeposit(product.priceInCzk, product.depositPercentage);
      const remainingAmount = calculateRemaining(product.priceInCzk, depositAmount);

      // Create order in database
      const orderResult = await createOrder({
        inquiryId: input.inquiryId,
        packageType: input.packageType,
        totalPrice: product.priceInCzk,
        depositPercentage: product.depositPercentage,
        depositAmount,
        remainingAmount,
        status: "pending",
      });

      const orderId = (orderResult as any).insertId || 0;

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "czk",
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: toStripeMinorUnits(depositAmount),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.PUBLIC_APP_URL || PUBLIC_SITE_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.PUBLIC_APP_URL || PUBLIC_SITE_URL}/payment-cancel`,
        customer_email: inquiry.email,
        client_reference_id: orderId.toString(),
        metadata: {
          orderId: orderId.toString(),
          inquiryId: input.inquiryId.toString(),
          packageType: input.packageType,
          customerName: inquiry.name,
        },
      });

      // Update order with Stripe session ID
      await updateOrder(orderId, {
        stripeCheckoutSessionId: session.id,
      });

      return {
        sessionId: session.id,
        checkoutUrl: session.url,
        orderId,
      };
    }),

  getOrder: protectedProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return { orderId: Number(obj.orderId || 0) };
    })
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      const order = await getOrder(input.orderId);
      if (!order) throw new Error("Order not found");
      return order;
    }),

  getOrderPayments: protectedProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return { orderId: Number(obj.orderId || 0) };
    })
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await getPaymentsByOrder(input.orderId);
    }),
};
