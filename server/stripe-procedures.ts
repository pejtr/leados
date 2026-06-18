import Stripe from "stripe";
import { protectedProcedure, publicProcedure } from "./_core/trpc";
import { createOrder, getOrder, updateOrder, createPayment, getPaymentsByOrder } from "./db";
import { OPTIVIO_PRODUCTS, calculateDeposit, calculateRemaining } from "./stripe-products";
import { notifyOwner } from "./_core/notification";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export const stripeRouter = {
  createCheckoutSession: publicProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return {
        packageType: String(obj.packageType || ""),
        inquiryId: Number(obj.inquiryId || 0),
        customerEmail: String(obj.customerEmail || ""),
        customerName: String(obj.customerName || ""),
      };
    })
    .mutation(async ({ input, ctx }) => {
      const packageKey = input.packageType.toUpperCase().replace(/-/g, "_") as keyof typeof OPTIVIO_PRODUCTS;
      const product = OPTIVIO_PRODUCTS[packageKey];

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
              unit_amount: depositAmount, // Amount in CZK (cents)
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ctx.req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.req.headers.origin}/payment-cancel`,
        customer_email: input.customerEmail,
        client_reference_id: orderId.toString(),
        metadata: {
          orderId: orderId.toString(),
          inquiryId: input.inquiryId.toString(),
          packageType: input.packageType,
          customerName: input.customerName,
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

  getOrder: publicProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return { orderId: Number(obj.orderId || 0) };
    })
    .query(async ({ input }) => {
      const order = await getOrder(input.orderId);
      if (!order) throw new Error("Order not found");
      return order;
    }),

  getOrderPayments: publicProcedure
    .input((data: unknown) => {
      const obj = data as Record<string, unknown>;
      return { orderId: Number(obj.orderId || 0) };
    })
    .query(async ({ input }) => {
      return await getPaymentsByOrder(input.orderId);
    }),
};
