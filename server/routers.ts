import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createInquiry, listInquiries, getInquiryById, updateInquiry, getPortfolioProjects, getTestimonials, getNichePackages, createNichePackage, getCustomerSubscriptions, createCustomerSubscription, cancelCustomerSubscription, getAllNichePackages, updateNichePackage, deactivateNichePackage, getAllSubscriptions, createOrder, getOrder, updateOrder, getPaymentsByOrder, getAllOrders, getAllPayments, getBrandMemory, upsertBrandMemory, createAgentSession, getAgentSessions, getAgentSession, updateAgentSession, addAgentMessage, getAgentMessages, getAllProjects, getProjectByOrderId, getProjectsByOrderIds, createProject, updateProject, getProjectMilestones, createMilestone, updateMilestone } from "./db";
import { notifyOwner } from "./notify";
import { sendOrderConfirmationEmail } from "./email-service";
import { generateAuditNurtureSequence } from "./audit-nurture";
import { invokeLLM } from "./_core/llm";
import { PUBLIC_SKILLS, getPublicSkill, getRoutedSkill, getSkill, buildSystemPrompt } from "./agent-skills";
import { SALES_PERSONAS, getPersona, listPersonas, personaPublicInfo, buildPersonaSystemPrompt } from "./sales-personas";
import { getSalesConversation, upsertSalesConversation, addSalesMessage, getSalesMessages, incrementSalesMessageCount, captureSalesLead, getAllSalesConversations } from "./db";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { ONYXWEB_PRODUCTS, calculateDeposit, calculateRemaining, toStripeMinorUnits } from "./stripe-products";
import { getABTestSummary, getABTestMetrics, recordABTestEvent } from "./ab-analytics";
import { trackLinkedInLead } from "./linkedin-capi";
import { CHECKOUT_OFFER_IDS } from "../shared/service-catalog";
import { PUBLIC_SITE_URL } from "../shared/brand-config";
import { recordPaidCheckoutSession } from "./payment-service";
import { enforcePublicRateLimit, hasValidSharedSecret } from "./public-request-guard";
import { addProspect, qualifyProspect, getQualifiedProspects, getProspectStats, importProspectsFromCsv, type LinkedInProfile, type IcpCriteria } from "./prospecting";
import { createSequence, activateSequence, sendStepMessage, executeSequences, getSequenceStats } from "./sequence-engine";
import { generateOutreachMessage, createOutreachTemplate, getTemplatesByCategory, updateTemplatePerformance } from "./outreach-agent";
import { runDailyProspectingQueue, advanceLeadState, markManuallySent } from "./leados/engine";
import { startLeadOsScheduler } from "./leados/scheduler";
import { type IcpContract } from "./prospecting";

startLeadOsScheduler();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseInquiryDetails(value: string | null): Record<string, unknown> {
  if (!value) return {};

  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function getPublicBaseUrl(requestOrigin?: string) {
  const configured = process.env.PUBLIC_APP_URL?.trim();
  if (configured && /^https:\/\/[^/]+/i.test(configured)) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production" && requestOrigin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin)) {
    return requestOrigin;
  }
  return PUBLIC_SITE_URL;
}

function sameEmail(left?: string | null, right?: string | null) {
  return Boolean(left && right && left.trim().toLowerCase() === right.trim().toLowerCase());
}

function optionalTrimmedString(maxLength: number) {
  return z.preprocess(
    value => typeof value === "string" && value.trim() === "" ? undefined : value,
    z.string().trim().max(maxLength).optional()
  );
}

const inquiryDetailsSchema = z.record(z.string(), z.unknown()).refine((details) => {
  try {
    return Buffer.byteLength(JSON.stringify(details), "utf8") <= 50_000;
  } catch {
    return false;
  }
}, "Inquiry details are too large");

const createInquirySchema = z.object({
  name: z.string().trim().min(1).max(255),
  email: z.string().trim().email().max(320),
  phone: optionalTrimmedString(20),
  businessDescription: optionalTrimmedString(10_000),
  packageType: optionalTrimmedString(50),
  details: inquiryDetailsSchema.optional(),
  source: optionalTrimmedString(100),
  linkedinConsent: z.boolean().optional().default(false),
}).strict();

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  inquiries: router({
    create: publicProcedure
      .input(createInquirySchema)
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "inquiry-create", 5, 15 * 60_000);
        const detailsJson = input.details ? JSON.stringify(input.details) : undefined;

        const inquiry = await createInquiry({
          name: input.name,
          email: input.email,
          phone: input.phone,
          businessDescription: input.businessDescription,
          packageType: input.packageType,
          details: detailsJson,
          source: input.source,
        });

        if (input.linkedinConsent) {
          void trackLinkedInLead(
            input.email,
            input.phone,
            input.name
          ).catch(error => console.error("[LinkedIn CAPI] Lead tracking failed:", error));
        }

        try {
          const detailLines = input.details
            ? Object.entries(input.details)
              .filter(([, v]) => v !== undefined && v !== null && v !== "")
              .map(([k, v]) => `• ${k}: ${Array.isArray(v) ? v.join(", ") : String(v)}`)
              .join("\n")
            : "";
          await notifyOwner({
            title: "Nová poptávka z webu",
            content: `Nová poptávka od ${input.name} (${input.email}, ${input.phone || "bez telefonu"})\n\nBalíček: ${input.packageType || "neuvedeno"}\nObor/firma: ${input.businessDescription || "neuvedeno"}\nZdroj: ${input.source || "web"}${detailLines ? `\n\nDetaily:\n${detailLines}` : ""}`,
          });
        } catch (error) {
          console.error("Failed to notify owner:", error);
        }

        // --- PROFIT PLAYBOOK: Odeslat do n8n/Make webhooku ---
        const isAuditInquiry = input.packageType === "audit-zdarma" || (input.details as any)?.webUrl || (input.details as any)?.auditRequested;
        const nurtureSequence = isAuditInquiry ? generateAuditNurtureSequence({
          webUrl: (input.details as any)?.webUrl || input.name,
          email: input.email,
          name: input.name,
          businessType: (input.details as any)?.businessType || input.businessDescription,
          mainGoal: (input.details as any)?.mainGoal,
        }) : null;

        const webhookUrl = process.env.N8N_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: (inquiry as any).insertId || 0,
                name: input.name,
                email: input.email,
                phone: input.phone,
                packageType: input.packageType,
                businessDescription: input.businessDescription,
                source: input.source,
                details: input.details,
                nurtureSequence,
                timestamp: new Date().toISOString()
              })
            });
          } catch (error) {
            console.error("Failed to send inquiry to automation webhook:", error);
          }
        }

        return { success: true, id: (inquiry as any).insertId || 0 };
      }),
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return await listInquiries();
    }),
    recordLifecycle: protectedProcedure
      .input(z.object({
        inquiryId: z.number().int().positive(),
        event: z.enum(["lead_qualified", "proposal_sent"]),
        note: z.string().trim().max(2_000).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");

        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new Error("Inquiry not found");

        const details = parseInquiryDetails(inquiry.details);
        const lifecycle = isRecord(details.lifecycle) ? details.lifecycle : {};
        lifecycle[input.event] = {
          at: new Date().toISOString(),
          note: input.note || undefined,
        };

        return await updateInquiry(input.inquiryId, {
          details: JSON.stringify({ ...details, lifecycle }),
          status: "contacted",
        });
      }),
    bookCall: publicProcedure
      .input(z.object({
        inquiryId: z.number().int().positive(),
        email: z.string().trim().email(),
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        time: z.enum(["09:00", "13:00", "16:00"]),
      }))
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "call-booking", 10, 15 * 60_000);
        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry || !sameEmail(inquiry.email, input.email)) {
          throw new Error("Inquiry not found");
        }

        const selectedDate = new Date(`${input.date}T12:00:00Z`);
        const today = new Date();
        const earliest = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
        const latest = new Date(earliest);
        latest.setUTCDate(latest.getUTCDate() + 30);
        const weekday = selectedDate.getUTCDay();
        if (Number.isNaN(selectedDate.getTime()) || selectedDate < earliest || selectedDate > latest || weekday === 0 || weekday === 6) {
          throw new Error("Invalid booking date");
        }

        const scheduledFor = `${input.date}T${input.time}`;
        const slotOccupied = (await listInquiries()).some((candidate) => {
          if (candidate.id === inquiry.id) return false;
          const candidateDetails = parseInquiryDetails(candidate.details);
          const candidateLifecycle = isRecord(candidateDetails.lifecycle) ? candidateDetails.lifecycle : {};
          const booked = isRecord(candidateLifecycle.call_booked) ? candidateLifecycle.call_booked : {};
          return booked.scheduledFor === scheduledFor;
        });
        if (slotOccupied) throw new Error("Booking slot is no longer available");

        const details = parseInquiryDetails(inquiry.details);
        const lifecycle = isRecord(details.lifecycle) ? details.lifecycle : {};
        lifecycle.call_booked = {
          at: new Date().toISOString(),
          scheduledFor,
          timezone: "Europe/Prague",
        };

        await updateInquiry(input.inquiryId, {
          details: JSON.stringify({ ...details, lifecycle }),
          status: "contacted",
        });

        return {
          success: true,
          scheduledFor,
          timezone: "Europe/Prague" as const,
        };
      }),
  }),
  portfolio: router({
    list: publicProcedure.query(async () => {
      return await getPortfolioProjects();
    }),
  }),
  testimonials: router({
    list: publicProcedure.query(async () => {
      return await getTestimonials();
    }),
  }),
  nichePackages: router({
    list: publicProcedure.query(async () => {
      return await getNichePackages();
    }),
    admin: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await getAllNichePackages();
      }),
      create: protectedProcedure
        .input((data: unknown) => {
          const obj = data as Record<string, unknown>;
          return {
            name: String(obj.name || ""),
            niche: String(obj.niche || ""),
            description: obj.description ? String(obj.description) : null,
            price: Number(obj.price || 0),
            features: String(obj.features || ""),
          };
        })
        .mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          return await createNichePackage(input as any);
        }),
      update: protectedProcedure
        .input((data: unknown) => {
          const obj = data as Record<string, unknown>;
          return {
            id: Number(obj.id || 0),
            name: String(obj.name || ""),
            niche: String(obj.niche || ""),
            description: obj.description ? String(obj.description) : null,
            price: Number(obj.price || 0),
            features: String(obj.features || ""),
          };
        })
        .mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          const { id, ...data } = input;
          return await updateNichePackage(id, data as any);
        }),
      deactivate: protectedProcedure
        .input((data: unknown) => {
          const obj = data as Record<string, unknown>;
          return { id: Number(obj.id || 0) };
        })
        .mutation(async ({ input, ctx }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          return await deactivateNichePackage(input.id);
        }),
    }),
  }),
  subscriptions: router({
    list: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return { customerId: Number(obj.customerId || 0) };
      })
      .query(async ({ input }) => {
        if (input.customerId === 0) {
          return await getAllSubscriptions();
        }
        return await getCustomerSubscriptions(input.customerId);
      }),
    create: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return {
          customerId: Number(obj.customerId || 0),
          packageId: Number(obj.packageId || 0),
          monthlyPrice: Number(obj.monthlyPrice || 0),
        };
      })
      .mutation(async ({ input }) => {
        return await createCustomerSubscription({
          customerId: input.customerId,
          packageId: input.packageId,
          monthlyPrice: input.monthlyPrice,
        });
      }),
    cancel: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return { subscriptionId: Number(obj.subscriptionId || 0) };
      })
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await cancelCustomerSubscription(input.subscriptionId);
      }),
  }),
  stripe: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        packageType: z.enum(CHECKOUT_OFFER_IDS),
        inquiryId: z.number().int().positive(),
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");

        const inquiry = await getInquiryById(input.inquiryId);
        if (!inquiry) throw new Error("Inquiry not found");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        const product = ONYXWEB_PRODUCTS[input.packageType];

        if (!product) {
          throw new Error("Invalid package type");
        }

        const depositAmount = calculateDeposit(product.priceInCzk, product.depositPercentage);
        const remainingAmount = calculateRemaining(product.priceInCzk, depositAmount);
        const existingOrder = (await getAllOrders()).find((order) =>
          order.inquiryId === input.inquiryId
          && order.packageType === input.packageType
          && order.status === "pending"
        );
        let orderId = existingOrder?.id ?? 0;
        let session: Stripe.Checkout.Session | null = null;

        if (existingOrder?.stripeCheckoutSessionId) {
          try {
            session = await stripe.checkout.sessions.retrieve(existingOrder.stripeCheckoutSessionId);
            if (session.payment_status === "paid") throw new Error("Checkout is already paid");
            if (session.status !== "open") session = null;
          } catch (error) {
            if (error instanceof Error && error.message === "Checkout is already paid") throw error;
            console.warn("Existing Stripe checkout could not be reused; creating a new session.");
            session = null;
          }
        }

        if (!orderId) {
          const orderResult = await createOrder({
            inquiryId: input.inquiryId,
            packageType: input.packageType,
            totalPrice: product.priceInCzk,
            depositPercentage: product.depositPercentage,
            depositAmount,
            remainingAmount,
            status: "pending",
          });
          orderId = Number((orderResult as { insertId?: number | bigint }).insertId || 0);
          if (!orderId) throw new Error("Order could not be created");
        }

        if (!session) {
          const baseUrl = getPublicBaseUrl(ctx.req.headers.origin);
          session = await stripe.checkout.sessions.create({
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
            success_url: baseUrl + "/payment-success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url: baseUrl + "/payment-cancel",
            customer_email: inquiry.email,
            client_reference_id: orderId.toString(),
            metadata: {
              orderId: orderId.toString(),
              inquiryId: input.inquiryId.toString(),
              packageType: input.packageType,
              customerName: inquiry.name,
            },
          });

          await updateOrder(orderId, {
            stripeCheckoutSessionId: session.id,
          });
        }

        const emailDelivered = await sendOrderConfirmationEmail(
          inquiry.email,
          inquiry.name,
          orderId,
          product.name,
          product.priceInCzk,
          depositAmount,
          session.url || undefined
        ).catch(err => console.error("Failed to send order confirmation email:", err));

        const details = parseInquiryDetails(inquiry.details);
        const lifecycle = isRecord(details.lifecycle) ? details.lifecycle : {};
        lifecycle.payment_link_created = {
          at: new Date().toISOString(),
          orderId,
          packageType: input.packageType,
        };
        if (emailDelivered) {
          lifecycle.proposal_sent = {
            at: new Date().toISOString(),
            orderId,
            packageType: input.packageType,
            channel: "email",
          };
        }
        await updateInquiry(inquiry.id, {
          details: JSON.stringify({ ...details, lifecycle }),
          status: "contacted",
        });

        return {
          sessionId: session.id,
          checkoutUrl: session.url,
          orderId,
          emailDelivered: Boolean(emailDelivered),
        };
      }),
    getCheckoutUrl: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
        const order = await getOrder(input.orderId);
        if (!order?.stripeCheckoutSessionId || order.status !== "pending") {
          throw new Error("Active checkout not found");
        }

        if (ctx.user?.role !== "admin") {
          const inquiry = await getInquiryById(order.inquiryId);
          if (!inquiry || inquiry.email.toLowerCase() !== ctx.user?.email?.toLowerCase()) {
            throw new Error("Unauthorized");
          }
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(order.stripeCheckoutSessionId);
        if (session.status !== "open" || !session.url) throw new Error("Checkout is no longer active");
        return { checkoutUrl: session.url };
      }),
    confirmCheckoutSession: publicProcedure
      .input(z.object({ sessionId: z.string().trim().min(10).max(255) }))
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "checkout-confirm", 20, 10 * 60_000);
        if (!input.sessionId.startsWith("cs_")) throw new Error("Invalid checkout session");
        if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);
        const result = await recordPaidCheckoutSession(session);
        return { success: true, orderId: result.orderId, amount: result.amountInCzk };
      }),
    getOrder: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return { orderId: Number(obj.orderId || 0) };
      })
      .query(async ({ input, ctx }) => {
        const order = await getOrder(input.orderId);
        if (!order) throw new Error("Order not found");
        if (ctx.user?.role !== "admin") {
          const inquiries = await listInquiries();
          const owner = inquiries.find(inquiry => inquiry.id === order.inquiryId);
          if (!owner || !sameEmail(owner.email, ctx.user?.email)) throw new Error("Unauthorized");
        }
        return order;
      }),
    getOrderPayments: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return { orderId: Number(obj.orderId || 0) };
      })
      .query(async ({ input, ctx }) => {
        const order = await getOrder(input.orderId);
        if (!order) throw new Error("Order not found");
        if (ctx.user?.role !== "admin") {
          const inquiries = await listInquiries();
          const owner = inquiries.find(inquiry => inquiry.id === order.inquiryId);
          if (!owner || !sameEmail(owner.email, ctx.user?.email)) throw new Error("Unauthorized");
        }
        return await getPaymentsByOrder(input.orderId);
      }),

    // ─── ADMIN: platební přehled (Stripe plugin v ADMIN panelu) ────────────────
    admin: router({
      // Revenue & objednávky z DB + (best-effort) živý Stripe zůstatek
      overview: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");

        const [orders, payments, inquiries] = await Promise.all([
          getAllOrders(),
          getAllPayments(),
          listInquiries(),
        ]);
        const inquiryById = new Map(inquiries.map(i => [i.id, i]));

        const succeeded = payments.filter(p => p.status === "succeeded");
        const paidRevenue = succeeded.reduce((s, p) => s + (p.type === "refund" ? -p.amount : p.amount), 0);
        const pendingRevenue = orders
          .filter(o => o.status === "pending")
          .reduce((s, o) => s + o.depositAmount, 0);
        const outstanding = orders
          .filter(o => o.status === "deposit_paid")
          .reduce((s, o) => s + o.remainingAmount, 0);

        const byStatus = orders.reduce((acc: Record<string, number>, o) => {
          acc[o.status] = (acc[o.status] || 0) + 1;
          return acc;
        }, {});

        // Recent orders enriched with customer name/email from the inquiry
        const recentOrders = orders.slice(0, 12).map(o => {
          const inq = inquiryById.get(o.inquiryId);
          return {
            id: o.id,
            packageType: o.packageType,
            totalPrice: o.totalPrice,
            depositAmount: o.depositAmount,
            remainingAmount: o.remainingAmount,
            status: o.status,
            createdAt: o.createdAt,
            customerName: inq?.name ?? "—",
            customerEmail: inq?.email ?? "—",
          };
        });

        // Best-effort live Stripe balance (won't fail the whole query)
        let stripeBalance: { available: number; pending: number; currency: string } | null = null;
        let stripeConnected = false;
        if (process.env.STRIPE_SECRET_KEY) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const bal = await stripe.balance.retrieve();
            const avail = bal.available.find(b => b.currency === "czk") ?? bal.available[0];
            const pend = bal.pending.find(b => b.currency === "czk") ?? bal.pending[0];
            stripeBalance = {
              available: avail ? avail.amount : 0,
              pending: pend ? pend.amount : 0,
              currency: (avail?.currency || "czk").toUpperCase(),
            };
            stripeConnected = true;
          } catch (e) {
            console.error("[Stripe admin] balance error:", e);
          }
        }

        return {
          stripeConnected,
          stripeBalance,
          totals: {
            paidRevenue,
            pendingRevenue,
            outstanding,
            orderCount: orders.length,
            paymentCount: succeeded.length,
          },
          byStatus,
          recentOrders,
        };
      }),
    }),
  }),

  billing: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");

      const [allOrders, allPayments, allInquiries] = await Promise.all([
        getAllOrders(),
        getAllPayments(),
        listInquiries(),
      ]);
      const inquiryById = new Map(allInquiries.map(inquiry => [inquiry.id, inquiry]));
      const paymentsByOrder = new Map<number, typeof allPayments>();

      for (const payment of allPayments) {
        const orderPayments = paymentsByOrder.get(payment.orderId) ?? [];
        orderPayments.push(payment);
        paymentsByOrder.set(payment.orderId, orderPayments);
      }

      return allOrders.map(order => {
        const inquiry = inquiryById.get(order.inquiryId);
        const orderPayments = paymentsByOrder.get(order.id) ?? [];
        const paidAmount = orderPayments
          .filter(payment => payment.status === "succeeded")
          .reduce((sum, payment) => sum + (payment.type === "refund" ? -payment.amount : payment.amount), 0);

        let details: Record<string, unknown> = {};
        try {
          details = inquiry?.details ? JSON.parse(inquiry.details) : {};
        } catch {
          details = {};
        }

        const createdAt = new Date(order.createdAt);
        return {
          orderId: order.id,
          invoiceNumber: `${createdAt.getFullYear()}-${String(order.id).padStart(5, "0")}`,
          variableSymbol: `${createdAt.getFullYear()}${String(order.id).padStart(5, "0")}`,
          packageType: order.packageType,
          totalPrice: order.totalPrice,
          depositAmount: order.depositAmount,
          remainingAmount: order.remainingAmount,
          invoiceAmount: paidAmount > 0 ? paidAmount : order.depositAmount,
          paidAmount,
          status: paidAmount > 0 ? "paid" as const : "pending" as const,
          createdAt: order.createdAt,
          customer: {
            name: inquiry?.name ?? "",
            company: typeof details.company === "string" ? details.company : inquiry?.businessDescription ?? "",
            email: inquiry?.email ?? "",
            street: typeof details.street === "string" ? details.street : "",
            city: typeof details.city === "string" ? details.city : "",
            postalCode: typeof details.postalCode === "string" ? details.postalCode : "",
            companyId: typeof details.companyId === "string" ? details.companyId : "",
            vatId: typeof details.vatId === "string" ? details.vatId : "",
          },
        };
      });
    }),
  }),

  orders: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      const inquiries = await listInquiries();
      const userInquiries = inquiries.filter(i => sameEmail(i.email, ctx.user?.email));
      const inquiryIds = new Set(userInquiries.map(i => i.id));

      if (inquiryIds.size === 0) return [];
      const allOrders = await getAllOrders();
      return allOrders.filter(order => inquiryIds.has(order.inquiryId));
    }),
  }),

  payments: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      const inquiries = await listInquiries();
      const userInquiries = inquiries.filter(i => sameEmail(i.email, ctx.user?.email));
      const inquiryIds = new Set(userInquiries.map(i => i.id));

      if (inquiryIds.size === 0) return [];

      const userOrders = (await getAllOrders()).filter(order => inquiryIds.has(order.inquiryId));
      const allPayments = [];
      for (const order of userOrders) {
        const payments = await getPaymentsByOrder(order.id);
        allPayments.push(...payments);
      }
      return allPayments;
    }),
  }),

  leados: router({
    createProject: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return {
          orderId: Number(obj.orderId || 0),
          title: String(obj.title || ""),
          description: obj.description ? String(obj.description) : undefined,
          packageType: String(obj.packageType || ""),
        };
      })
      .mutation(async ({ input }) => {
        // Verify order exists
        const order = await getOrder(input.orderId).catch(() => null);
        if (!order) {
          throw new Error("Order not found");
        }

        // Create project in database
        const db = await require("./db").getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const { projects } = await import("../drizzle/schema");
        const { createManusTask } = await import("./manus-api");
        const { eq } = await import("drizzle-orm");

        const projectId = Math.random().toString(36).substring(2, 10);
        const deadline = Date.now() + 14 * 24 * 60 * 60 * 1000; // 2 weeks

        await db.insert(projects).values({
          id: projectId,
          orderId: input.orderId,
          status: "pending",
          title: input.title,
          description: input.description,
          packageType: input.packageType,
          deadline,
        });

        // Create Manus task via Manus API v2
        let manusTaskId = null;
        try {
          const manusTask = await createManusTask({
            title: input.title,
            description: input.description,
            packageType: input.packageType,
            deadline,
          });
          manusTaskId = manusTask.id;
        } catch (error) {
          console.error("Failed to create Manus task, saving without it:", error);
        }

        if (manusTaskId) {
          await db.update(projects)
            .set({ leadsOsProjectId: manusTaskId })
            .where(eq(projects.id, projectId));
        }

        // Notify owner
        await notifyOwner({
          title: `🚀 Nový projekt: ${input.title}`,
          content: `Projekt vytvořen pro objednávku #${input.orderId}. ManusTask: ${manusTaskId || 'selhalo'}. Termín: ${new Date(deadline).toLocaleDateString()}`,
        });

        return { projectId, deadline, manusTaskId };
      }),

    getProject: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return { projectId: String(obj.projectId || "") };
      })
      .query(async ({ input }) => {
        const db = await require("./db").getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const { projects, projectMilestones } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const project = await db
          .select()
          .from(projects)
          .where(eq(projects.id, input.projectId))
          .limit(1);

        if (!project[0]) {
          throw new Error("Project not found");
        }

        const milestones = await db
          .select()
          .from(projectMilestones)
          .where(eq(projectMilestones.projectId, input.projectId));

        return {
          ...project[0],
          milestones,
          timeRemaining: project[0].deadline ? project[0].deadline - Date.now() : null,
        };
      }),

    updateProjectStatus: protectedProcedure
      .input((data: unknown) => {
        const obj = data as Record<string, unknown>;
        return {
          projectId: String(obj.projectId || ""),
          status: String(obj.status || "pending"),
          completionPercentage: Number(obj.completionPercentage || 0),
        };
      })
      .mutation(async ({ input }) => {
        const db = await require("./db").getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const { projects } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const { updateManusTask } = await import("./manus-api");

        // get current project to fetch leadsOsProjectId
        const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);

        await db
          .update(projects)
          .set({
            status: input.status,
            completionPercentage: input.completionPercentage,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        if (project[0]?.leadsOsProjectId) {
          try {
            await updateManusTask(project[0].leadsOsProjectId, {
              metadata: { status: input.status, completion: input.completionPercentage }
            });
          } catch (error) {
            console.error("Failed to sync status to Manus Task:", error);
          }
        }

        await notifyOwner({
          title: `📊 Aktualizace projektu`,
          content: `Projekt ${input.projectId} změnil status na: ${input.status} (${input.completionPercentage}%)`,
        });

        return { ok: true };
      }),

      linkedin: router({
        /** Spustí denní queue: výzkum → scoring → zpráva → Creep Guard → fronta k ručnímu odeslání. */
        runQueue: protectedProcedure
          .input((data: unknown) => {
            const obj = data as Record<string, unknown>;
            const icp: IcpContract = {
              offer: String(obj.offer || "ONYX WEB Audit"),
              segment: String(obj.segment || "české B2B firmy a lokální služby"),
              size: obj.size ? String(obj.size) : undefined,
              decisionMaker: Array.isArray(obj.decisionMaker) ? (obj.decisionMaker as string[]) : undefined,
              signals: Array.isArray(obj.signals) ? (obj.signals as string[]) : undefined,
              exclude: Array.isArray(obj.exclude) ? (obj.exclude as string[]) : undefined,
              minScore: obj.minScore != null ? Number(obj.minScore) : 50,
              maxCandidatesPerDay: obj.maxCandidatesPerDay != null ? Number(obj.maxCandidatesPerDay) : 10,
            };
            return icp;
          })
          .mutation(async ({ input }) => {
            return await runDailyProspectingQueue(input);
          }),

        /** Seznam prospectů s aktuálním stavem (leadState uložen v notes). */
        listProspects: protectedProcedure.query(async () => {
          const db = await require("./db").getDb();
          if (!db) throw new Error("Database not available");
          const { prospects } = await import("../drizzle/schema");
          const { desc } = await import("drizzle-orm");

          const all = await db.select().from(prospects).orderBy(desc(prospects.createdAt));
          return all.map((p: any) => ({ ...p, leadState: p.leadState || "DISCOVERED" }));
        }),

        /** Deterministický přechod stavu podle stavového automatu. */
        advanceState: protectedProcedure
          .input((data: unknown) => {
            const obj = data as Record<string, unknown>;
            return { prospectId: Number(obj.prospectId || 0), to: String(obj.to || "") };
          })
          .mutation(async ({ input }) => {
            const ok = await advanceLeadState(input.prospectId, input.to as any);
            if (!ok) throw new Error(`Neplatný přechod stavu do ${input.to}`);
            return { ok: true };
          }),

        /** Volá člověk po ručním odeslání zprávy na LinkedInu. */
        markSent: protectedProcedure
          .input((data: unknown) => {
            const obj = data as Record<string, unknown>;
            return { prospectId: Number(obj.prospectId || 0) };
          })
          .mutation(async ({ input }) => {
            const ok = await markManuallySent(input.prospectId);
            if (!ok) throw new Error("Nepodařilo se označit jako odeslané");
            return { ok: true };
          }),
      }),

    admin: router({
      dashboardStats: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const db = await require("./db").getDb();
        if (!db) throw new Error("Database not available");

        const { projects, heartbeatJobs } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");

        const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));
        const allHeartbeats = await db.select().from(heartbeatJobs).orderBy(desc(heartbeatJobs.createdAt));

        return {
          projects: allProjects,
          heartbeats: allHeartbeats,
        };
      })
    })
  }),

  // ─── Manus API v2 Orchestration ──────────────────────────────────────────
  manus: router({
    createTask: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        packageType: z.string(),
        deadline: z.number()
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        const { createManusTask } = await import("./manus-api");
        return await createManusTask(input);
      }),

    updateTask: protectedProcedure
      .input(z.object({
        taskId: z.string(),
        updates: z.record(z.string(), z.any())
      }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        const { updateManusTask } = await import("./manus-api");
        return await updateManusTask(input.taskId, input.updates);
      }),

    getTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        const { getManusTaskStatus } = await import("./manus-api");
        return await getManusTaskStatus(input.taskId);
      }),

    deleteTask: protectedProcedure
      .input(z.object({ taskId: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        const { deleteManusTask } = await import("./manus-api");
        await deleteManusTask(input.taskId);
        return { ok: true };
      }),

    // Webhook for receiving updates from Manus API
    webhook: publicProcedure
      .input(z.object({
        taskId: z.string().trim().min(1).max(255),
        status: z.enum(["pending", "in_progress", "completed", "failed"]),
        completionPercentage: z.number().min(0).max(100).optional()
      }))
      .mutation(async ({ input, ctx }) => {
        if (!hasValidSharedSecret(ctx.req, "x-manus-webhook-secret", process.env.MANUS_WEBHOOK_SECRET)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Unauthorized" });
        }
        const db = await require("./db").getDb();
        if (!db) throw new Error("Database not available");
        const { projects } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        const matchingProjects = await db
          .select()
          .from(projects)
          .where(eq(projects.leadsOsProjectId, input.taskId));

        if (!matchingProjects || matchingProjects.length === 0) {
          throw new Error("Project not found for this Manus task");
        }

        const projectId = matchingProjects[0].id;
        const updates: any = { status: input.status, updatedAt: new Date() };

        if (input.completionPercentage !== undefined) {
          updates.completionPercentage = input.completionPercentage;
        }

        await db
          .update(projects)
          .set(updates)
          .where(eq(projects.id, projectId));

        return { ok: true };
      })
  }),

  // ─── Projects ───────────────────────────────────────────────────────────────
  projects: router({
    // Client: get own projects with milestones
    myProjects: protectedProcedure.query(async ({ ctx }) => {
      const allInquiries = await listInquiries();
      const userInquiries = allInquiries.filter(i => sameEmail(i.email, ctx.user?.email));
      if (userInquiries.length === 0) return [];
      const inquiryIds = new Set(userInquiries.map(i => i.id));
      const allOrdersList = (await getAllOrders()).filter(order => inquiryIds.has(order.inquiryId));
      if (allOrdersList.length === 0) return [];
      const projectList = await getProjectsByOrderIds(allOrdersList.map(o => o.id));
      const result = await Promise.all(
        projectList.map(async (p) => {
          const milestones = await getProjectMilestones(p.id);
          const order = allOrdersList.find(o => o.id === p.orderId);
          return { ...p, milestones, order };
        })
      );
      return result;
    }),

    // Admin: list all projects with milestones
    admin: router({
      list: protectedProcedure.query(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        const all = await getAllProjects();
        return Promise.all(all.map(async (p) => {
          const milestones = await getProjectMilestones(p.id);
          const order = await getOrder(p.orderId).catch(() => null);
          return { ...p, milestones, order };
        }));
      }),

      // Create project from an order
      create: protectedProcedure
        .input(z.object({
          orderId: z.number(),
          title: z.string().min(1),
          description: z.string().optional(),
          assignedTo: z.string().optional(),
          deadlineDays: z.number().default(14),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          const { nanoid } = await import('nanoid');
          const projectId = nanoid(12);
          const deadline = Date.now() + input.deadlineDays * 24 * 60 * 60 * 1000;
          const order = await getOrder(input.orderId);
          if (!order) throw new Error('Order not found');
          await createProject({
            id: projectId,
            orderId: input.orderId,
            title: input.title,
            description: input.description,
            packageType: order.packageType,
            assignedTo: input.assignedTo,
            deadline,
            status: 'pending',
            completionPercentage: 0,
          });
          await notifyOwner({
            title: `🚀 Projekt vytvořen: ${input.title}`,
            content: `Projekt #${projectId} pro objednávku #${input.orderId}. Termín: ${new Date(deadline).toLocaleDateString('cs-CZ')}`,
          });
          return { projectId };
        }),

      // Update project status and progress
      update: protectedProcedure
        .input(z.object({
          projectId: z.string(),
          status: z.enum(['pending', 'in_progress', 'completed', 'failed']).optional(),
          completionPercentage: z.number().min(0).max(100).optional(),
          assignedTo: z.string().optional(),
          deadlineDays: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          const { projectId, deadlineDays, ...rest } = input;
          const data: Record<string, unknown> = { ...rest };
          if (deadlineDays !== undefined) {
            data.deadline = Date.now() + deadlineDays * 24 * 60 * 60 * 1000;
          }
          await updateProject(projectId, data as any);
          return { ok: true };
        }),

      // Add milestone
      addMilestone: protectedProcedure
        .input(z.object({
          projectId: z.string(),
          title: z.string().min(1),
          description: z.string().optional(),
          dueDays: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          const { nanoid } = await import('nanoid');
          const id = nanoid(12);
          await createMilestone({
            id,
            projectId: input.projectId,
            title: input.title,
            description: input.description,
            dueDate: input.dueDays ? Date.now() + input.dueDays * 24 * 60 * 60 * 1000 : undefined,
            status: 'pending',
          });
          return { id };
        }),

      // Update milestone
      updateMilestone: protectedProcedure
        .input(z.object({
          milestoneId: z.string(),
          status: z.enum(['pending', 'in_progress', 'completed']),
        }))
        .mutation(async ({ ctx, input }) => {
          if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
          await updateMilestone(input.milestoneId, {
            status: input.status,
            completedAt: input.status === 'completed' ? Date.now() : undefined,
          });
          return { ok: true };
        }),
    }),
  }),

  // ─── Sales Chat — customer-facing prodejní chatbot na landing page ─────────────
  salesChat: router({
    // Send a message to the OPTIMATEO sales assistant. Public for visitors.
    send: publicProcedure
      .input(z.object({
        conversationId: z.string().trim().min(8).max(100),
        personaId: z.string().trim().min(1).max(50).default("onyxweb-sales"),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string().trim().min(1).max(2_000),
        })).min(1).max(20),
      }))
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "sales-chat", 20, 10 * 60_000);
        const persona = getPersona(input.personaId) ?? getPersona("onyxweb-sales")!;
        const conversation = input.messages;

        const llmMessages = [
          { role: "system" as const, content: persona.systemPrompt },
          ...conversation.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ];

        let content = "Omlouvám se, zkuste to prosím znovu.";
        try {
          const response = await invokeLLM({ messages: llmMessages });
          const raw = (response as any).choices?.[0]?.message?.content;
          if (typeof raw === "string") content = raw;
        } catch (error) {
          console.error("[SalesChat] LLM error:", error);
          content = "Momentálně mám technické potíže. Napište nám prosím e-mail na info@optimateo.com nebo vyplňte formulář — ozveme se do 24 hodin.";
        }

        // Persist conversation (best-effort, non-blocking on failure)
        try {
          await upsertSalesConversation({
            id: input.conversationId,
            personaId: persona.id,
            messageCount: conversation.length + 1,
          });
          const lastUser = conversation[conversation.length - 1];
          if (lastUser?.role === "user") {
            await addSalesMessage({ conversationId: input.conversationId, role: "user", content: lastUser.content });
          }
          await addSalesMessage({ conversationId: input.conversationId, role: "assistant", content });
        } catch (e) {
          console.error("[SalesChat] persist error:", e);
        }

        return { role: "assistant" as const, content };
      }),

    // Capture a lead from the chat → creates an inquiry + notifies owner
    captureLead: publicProcedure
      .input(z.object({
        conversationId: z.string().trim().min(8).max(100),
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email().max(320),
        phone: optionalTrimmedString(20),
        message: optionalTrimmedString(2_000),
      }))
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "sales-chat-lead", 5, 15 * 60_000);
        const inquiry = await createInquiry({
          name: input.name,
          email: input.email,
          phone: input.phone,
          businessDescription: input.message || "Lead z prodejního chatbota (Viktor)",
          packageType: "chat-lead",
        });
        const inquiryId = (inquiry as any).insertId || 0;

        try {
          await captureSalesLead(input.conversationId, {
            visitorName: input.name,
            visitorEmail: input.email,
            visitorPhone: input.phone,
            inquiryId,
          });
        } catch (e) {
          console.error("[SalesChat] captureLead persist error:", e);
        }

        try {
          await notifyOwner({
            title: "🤖 Nový lead z prodejního chatbota",
            content: `${input.name} (${input.email}${input.phone ? ", " + input.phone : ""})\n\nZpráva: ${input.message || "—"}\n\nKonverzace: ${input.conversationId}`,
          });
        } catch (e) {
          console.error("[SalesChat] notify error:", e);
        }

        return { success: true, inquiryId };
      }),

    // Admin: list conversations
    adminList: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
      return getAllSalesConversations();
    }),

    adminTranscript: protectedProcedure
      .input(z.object({ conversationId: z.string() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const conversation = await getSalesConversation(input.conversationId);
        const messages = await getSalesMessages(input.conversationId);
        return { conversation, messages };
      }),
  }),

  // ─── Sales Personas — knihovna prodejních person (pro AI Agents Hub) ───────────
  personas: router({
    // Public list (no system prompts leaked)
    list: publicProcedure.query(() => SALES_PERSONAS.map(personaPublicInfo)),

    // Chat with a sales-coach persona (logged-in users; uses Brand Memory)
    chat: protectedProcedure
      .input(z.object({
        personaId: z.string(),
        messages: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const persona = getPersona(input.personaId);
        if (!persona) throw new Error("Persona not found");

        const brand = await getBrandMemory(ctx.user.id);
        const systemPrompt = buildPersonaSystemPrompt(persona, brand);

        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...input.messages.map(m => ({ role: m.role, content: m.content })),
        ];

        try {
          const response = await invokeLLM({ messages: llmMessages });
          const raw = (response as any).choices?.[0]?.message?.content;
          return { content: typeof raw === "string" ? raw : "Omlouvám se, zkuste to prosím znovu." };
        } catch (error) {
          console.error("[Personas] LLM error:", error);
          return { content: "Momentálně mám technické potíže. Zkuste to prosím za chvíli." };
        }
      }),
  }),

  ab: router({
    getVariant: publicProcedure
      .input(z.object({ userId: z.string().optional() }).optional())
      .query(({ input }) => {
        const variants = ['A', 'B'] as const;
        const userId = input?.userId || 'anonymous';
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variant = variants[hash % variants.length];
        return { variant };
      }),

    trackConversion: publicProcedure
      .input(z.object({
        variant: z.enum(['A', 'B']),
        event: z.enum([
          "page_view", "hero_cta_click", "cta_click", "click_tel", "form_start", "form_submit",
          "audit_start", "audit_submit", "questionnaire_start", "questionnaire_step",
          "questionnaire_abandon", "questionnaire_submit", "call_booked", "deposit_paid",
        ]),
        metadata: inquiryDetailsSchema.optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        enforcePublicRateLimit(ctx.req, "analytics-event", 120, 60_000);
        recordABTestEvent(input.variant, input.event, input.metadata);
        console.log(`[AB Test] Variant ${input.variant} - Event: ${input.event}`, input.metadata);
        return { ok: true };
      }),
    getMetrics: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const metrics = await getABTestMetrics();
        return metrics;
      }),
    getSummary: protectedProcedure
      .query(async ({ ctx }) => {
        if (ctx.user?.role !== "admin") throw new Error("Unauthorized");
        const summary = await getABTestSummary();
        return summary;
      }),
  }),

  // Brand Memory — brand knowledge store for AI agents
  brandMemory: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return await getBrandMemory(ctx.user.id);
    }),

    save: protectedProcedure
      .input(z.object({
        companyName: z.string().min(1),
        tagline: z.string().optional(),
        industry: z.string().optional(),
        targetAudience: z.string().optional(),
        brandVoice: z.string().optional(),
        uniqueValue: z.string().optional(),
        products: z.string().optional(),
        painPoints: z.string().optional(),
        competitors: z.string().optional(),
        pastCampaigns: z.string().optional(),
        website: z.string().optional(),
        socialLinks: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        await upsertBrandMemory(ctx.user.id, input);
        return { ok: true };
      }),
  }),

  // AI Agents — skills library + orchestrated chat
  agents: router({
    listSkills: protectedProcedure.query(() => {
      return PUBLIC_SKILLS.map(s => ({
        id: s.id,
        name: s.name,
        description: s.description,
        category: s.category,
        framework: s.framework,
        icon: s.icon,
        suggestedPrompts: s.suggestedPrompts,
      }));
    }),

    // Create a new session with a specific agent/skill
    createSession: protectedProcedure
      .input(z.object({
        agentType: z.string(),
        skillId: z.string().optional(),
        title: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const requestedSkillId = input.skillId || input.agentType;
        if (!getPublicSkill(requestedSkillId)) {
          throw new Error("Unknown or unavailable specialist");
        }
        const result = await createAgentSession({
          userId: ctx.user.id,
          agentType: input.agentType,
          skillId: input.skillId,
          title: input.title || input.agentType,
        });
        return { sessionId: (result as any).insertId };
      }),

    // List user's sessions
    listSessions: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      return await getAgentSessions(ctx.user.id);
    }),

    // Get session with messages
    getSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const session = await getAgentSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Not found");
        const messages = await getAgentMessages(input.sessionId);
        return { session, messages };
      }),

    // Send message to agent and get AI response
    chat: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        message: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");

        const session = await getAgentSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Not found");

        // Load brand memory for context
        const brandMemory = await getBrandMemory(ctx.user.id);

        // Get skill system prompt
        const skill = getSkill(session.skillId || session.agentType);
        const delegatedSkill = skill?.id === "cmo"
          ? getRoutedSkill(input.message)
          : undefined;
        const systemPrompt = skill
          ? buildSystemPrompt(skill, brandMemory, delegatedSkill)
          : buildSystemPrompt({ id: 'custom', name: 'AI Agent', systemPrompt: 'Jsi pomocný AI asistent pro marketing a podnikání.', suggestedPrompts: [], category: '', icon: '🤖', description: '' }, brandMemory);

        // Load conversation history
        const history = await getAgentMessages(input.sessionId);

        // Save user message
        await addAgentMessage({
          sessionId: input.sessionId,
          role: "user",
          content: input.message,
        });

        // Build messages for LLM
        const llmMessages = [
          { role: "system" as const, content: systemPrompt },
          ...history
            .filter(m => m.role !== "system")
            .map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
          { role: "user" as const, content: input.message },
        ];

        // Invoke LLM
        const response = await invokeLLM({ messages: llmMessages });
        const assistantContent = (response as any).choices?.[0]?.message?.content || "Omlouváme se, nepodařilo se vygenerovat odpověď.";

        // Save assistant response
        await addAgentMessage({
          sessionId: input.sessionId,
          role: "assistant",
          content: assistantContent,
        });

        // Update session title from first message if not set
        if (!session.title || session.title === session.agentType) {
          const shortTitle = input.message.slice(0, 60) + (input.message.length > 60 ? "..." : "");
          await updateAgentSession(input.sessionId, { title: shortTitle });
        }

        return { content: assistantContent };
      }),

    // Delete session
    deleteSession: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!ctx.user) throw new Error("Unauthorized");
        const session = await getAgentSession(input.sessionId);
        if (!session || session.userId !== ctx.user.id) throw new Error("Not found");
        // Mark as deleted by clearing title
        await updateAgentSession(input.sessionId, { title: "[smazáno]" });
        return { ok: true };
      }),
  }),

  // ─── Now Brief — personalizovaný přehled dne pro ADMIN panel klienta ───────────
  dashboard: router({
    nowBrief: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("Unauthorized");
      const firstName = (ctx.user.name || "").trim().split(/\s+/)[0] || "vítejte";

      // Najdi objednávky a projekty patřící uživateli (přes jeho e-mail v poptávkách)
      const allInquiries = await listInquiries().catch(() => []);
      const myInquiries = allInquiries.filter(i => sameEmail(i.email, ctx.user?.email));

      type OrderRow = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
      const myOrders: OrderRow[] = [];
      for (const inq of myInquiries) {
        const o = await getOrder(inq.id).catch(() => null);
        if (o) myOrders.push(o);
      }

      const projectList = myOrders.length
        ? await getProjectsByOrderIds(myOrders.map(o => o.id)).catch(() => [])
        : [];

      // Sesbírej milníky napříč projekty
      const projectsWithMilestones = await Promise.all(
        projectList.map(async (p) => ({
          project: p,
          milestones: await getProjectMilestones(p.id).catch(() => []),
        }))
      );

      const activeProject = projectList.find(p => p.status === "in_progress") || projectList[0] || null;

      // Nejbližší nesplněný milník
      const pendingMilestones = projectsWithMilestones
        .flatMap(pm => pm.milestones)
        .filter((m: any) => m.status !== "completed" && m.dueDate)
        .sort((a: any, b: any) => a.dueDate - b.dueDate);
      const nextMilestone = pendingMilestones[0]
        ? {
          title: (pendingMilestones[0] as any).title as string,
          dueDate: (pendingMilestones[0] as any).dueDate as number,
        }
        : null;

      const outstanding = myOrders
        .filter(o => o.status === "deposit_paid")
        .reduce((s, o) => s + o.remainingAmount, 0);

      const counts = {
        projects: projectList.length,
        inProgress: projectList.filter(p => p.status === "in_progress").length,
        completed: projectList.filter(p => p.status === "completed").length,
        orders: myOrders.length,
      };

      // Doporučená akce dne — jednoduchá heuristika
      let recommendedAction = "Vše vypadá v pořádku. Mrkněte na svůj web a sdílejte ho.";
      if (counts.projects === 0 && counts.orders === 0) {
        recommendedAction = "Zatím tu nemáte žádný projekt — vyzkoušejte demo nebo si domluvte konzultaci.";
      } else if (outstanding > 0) {
        recommendedAction = `Máte doplatek ${outstanding.toLocaleString("cs-CZ")} Kč po spuštění webu.`;
      } else if (nextMilestone) {
        recommendedAction = `Blíží se milník „${nextMilestone.title}". Připravte prosím podklady.`;
      } else if (counts.inProgress > 0) {
        recommendedAction = "Na vašem webu se pracuje — brzy vás budeme informovat o pokroku.";
      }

      return {
        firstName,
        counts,
        outstanding,
        nextMilestone,
        recommendedAction,
        activeProject: activeProject
          ? {
            id: activeProject.id,
            title: activeProject.title,
            status: activeProject.status,
            completionPercentage: activeProject.completionPercentage ?? 0,
          }
          : null,
      };
    }),
  }),

  // ─── LinkedIn Outreach System ──────────────────────────────────────────────
  outreach: router({
    // Admin: import prospects from CSV
    importProspects: protectedProcedure
      .input(z.object({
        csvData: z.string().min(1),
        icp: z.object({
          industries: z.array(z.string()).optional(),
          titles: z.array(z.string()).optional(),
          revenueRange: z.string().optional(),
          employeeCount: z.string().optional(),
          location: z.string().optional(),
          minScore: z.number().min(0).max(100).default(50),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await importProspectsFromCsv(input.csvData, input.icp as IcpCriteria);
      }),

    // Admin: get prospect stats
    getProspectStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
      return await getProspectStats();
    }),

    // Admin: get qualified prospects
    getQualifiedProspects: protectedProcedure
      .input(z.object({
        icp: z.object({
          industries: z.array(z.string()).optional(),
          titles: z.array(z.string()).optional(),
          revenueRange: z.string().optional(),
          employeeCount: z.string().optional(),
          location: z.string().optional(),
          minScore: z.number().min(0).max(100).default(50),
        }),
        limit: z.number().default(50),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await getQualifiedProspects(input.icp as IcpCriteria, input.limit);
      }),

    // Admin: qualify a prospect
    qualifyProspect: protectedProcedure
      .input(z.object({
        prospectId: z.number().int().positive(),
        icp: z.object({
          industries: z.array(z.string()).optional(),
          titles: z.array(z.string()).optional(),
          revenueRange: z.string().optional(),
          employeeCount: z.string().optional(),
          location: z.string().optional(),
          minScore: z.number().min(0).max(100).default(50),
        }),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await qualifyProspect(input.prospectId, input.icp as IcpCriteria);
      }),

    // Admin: create outreach sequence
    createSequence: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        targetIndustry: z.string().optional(),
        targetTitle: z.string().optional(),
        targetRevenue: z.string().optional(),
        steps: z.array(z.object({
          stepNumber: z.number().int().positive(),
          stepType: z.enum(["linkedin_connect", "linkedin_message", "email", "sms", "whatsapp", "wait"]),
          delayDays: z.number().default(0),
          delayHours: z.number().default(0),
          messageTemplate: z.string().optional(),
          messageSubject: z.string().optional(),
          condition: z.string().optional(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await createSequence({
          name: input.name,
          description: input.description,
          targetIndustry: input.targetIndustry,
          targetTitle: input.targetTitle,
          targetRevenue: input.targetRevenue,
          steps: input.steps.map(s => ({
            stepNumber: s.stepNumber,
            stepType: s.stepType,
            delayDays: s.delayDays,
            delayHours: s.delayHours,
            messageTemplate: s.messageTemplate,
            messageSubject: s.messageSubject,
            condition: s.condition,
          })),
        });
      }),

    // Admin: activate sequence
    activateSequence: protectedProcedure
      .input(z.object({ sequenceId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await activateSequence(input.sequenceId);
      }),

    // Admin: send step message
    sendStepMessage: protectedProcedure
      .input(z.object({
        sequenceId: z.number().int().positive(),
        stepId: z.number().int().positive(),
        prospectId: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await sendStepMessage(input);
      }),

    // Admin: execute sequences (cron job)
    executeSequences: protectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await executeSequences();
      }),

    // Admin: get sequence stats
    getSequenceStats: protectedProcedure
      .input(z.object({ sequenceId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await getSequenceStats(input.sequenceId);
      }),

    // Admin: create outreach template
    createTemplate: protectedProcedure
      .input(z.object({
        name: z.string().min(1).max(255),
        category: z.enum(["connection_request", "first_message", "follow_up", "breakup"]),
        industry: z.string().optional(),
        title: z.string().min(1).max(255),
        content: z.string().min(1),
        variables: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await createOutreachTemplate(input);
      }),

    // Admin: get templates by category
    getTemplates: protectedProcedure
      .input(z.object({
        category: z.enum(["connection_request", "first_message", "follow_up", "breakup"]),
        industry: z.string().optional(),
      }))
      .query(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await getTemplatesByCategory(input.category, input.industry);
      }),

    // Admin: generate AI message for prospect
    generateMessage: protectedProcedure
      .input(z.object({
        prospectId: z.number().int().positive(),
        messageType: z.enum(["connection_request", "first_message", "follow_up", "breakup"]),
        templateId: z.number().int().positive().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user?.role !== 'admin') throw new Error('Unauthorized');
        return await generateOutreachMessage({
          prospectId: input.prospectId,
          messageType: input.messageType,
          templateId: input.templateId,
        });
      }),
  }),
});

export type AppRouter = typeof appRouter;