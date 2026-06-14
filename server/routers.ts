import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createInquiry, listInquiries, getPortfolioProjects, getTestimonials, getNichePackages, createNichePackage, getCustomerSubscriptions, createCustomerSubscription, cancelCustomerSubscription, getAllNichePackages, updateNichePackage, deactivateNichePackage, getAllSubscriptions, createOrder, getOrder, updateOrder, createPayment, getPaymentsByOrder, getAllOrders, getAllPayments, getBrandMemory, upsertBrandMemory, createAgentSession, getAgentSessions, getAgentSession, updateAgentSession, addAgentMessage, getAgentMessages, getAllProjects, getProjectByOrderId, getProjectsByOrderIds, createProject, updateProject, getProjectMilestones, createMilestone, updateMilestone } from "./db";
import { notifyOwner } from "./_core/notification";
import { sendOrderConfirmationEmail, sendPaymentConfirmationEmail } from "./email-service";
import { invokeLLM } from "./_core/llm";
import { SKILLS, getSkill, buildSystemPrompt } from "./agent-skills";
import { SALES_PERSONAS, getPersona, listPersonas, personaPublicInfo, buildPersonaSystemPrompt } from "./sales-personas";
import { getSalesConversation, upsertSalesConversation, addSalesMessage, getSalesMessages, incrementSalesMessageCount, captureSalesLead, getAllSalesConversations } from "./db";
import Stripe from "stripe";
import { z } from "zod";
import { OPTIVIO_PRODUCTS, calculateDeposit, calculateRemaining } from "./stripe-products";
import { getABTestSummary, getABTestMetrics } from "./ab-analytics";

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
      .input((data: unknown): {
        name: string;
        email: string;
        phone?: string;
        businessDescription?: string;
        packageType?: string;
        details?: Record<string, unknown>;
        source?: string;
      } => {
        const obj = data as Record<string, unknown>;
        return {
          name: String(obj.name || ""),
          email: String(obj.email || ""),
          phone: obj.phone ? String(obj.phone) : undefined,
          businessDescription: obj.businessDescription ? String(obj.businessDescription) : undefined,
          packageType: obj.packageType ? String(obj.packageType) : undefined,
          // Free-form questionnaire answers (goals, pages, materials, budget, deadline…)
          details: obj.details && typeof obj.details === "object" ? (obj.details as Record<string, unknown>) : undefined,
          source: obj.source ? String(obj.source) : undefined,
        };
      })
      .mutation(async ({ input, ctx }) => {
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

        return { success: true, id: (inquiry as any).insertId || 0 };
      }),
    list: protectedProcedure.query(async () => {
      return await listInquiries();
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
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
        const packageKey = input.packageType.toUpperCase().replace(/-/g, "_") as keyof typeof OPTIVIO_PRODUCTS;
        const product = OPTIVIO_PRODUCTS[packageKey];

        if (!product) {
          throw new Error("Invalid package type");
        }

        const depositAmount = calculateDeposit(product.priceInCzk, product.depositPercentage);
        const remainingAmount = calculateRemaining(product.priceInCzk, depositAmount);

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
                unit_amount: depositAmount,
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

        await updateOrder(orderId, {
          stripeCheckoutSessionId: session.id,
        });

        // Send confirmation email to customer
        await sendOrderConfirmationEmail(
          input.customerEmail,
          input.customerName,
          orderId,
          input.packageType,
          product.priceInCzk,
          depositAmount,
          session.url || undefined
        ).catch(err => console.error("Failed to send order confirmation email:", err));

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

  orders: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      const inquiries = await listInquiries();
      const userInquiries = inquiries.filter(i => i.email === ctx.user?.email);
      const inquiryIds = userInquiries.map(i => i.id);
      
      if (inquiryIds.length === 0) return [];
      
      const allOrders = [];
      for (const inquiryId of inquiryIds) {
        const order = await getOrder(inquiryId).catch(() => null);
        if (order) allOrders.push(order);
      }
      return allOrders;
    }),
  }),

  payments: router({
    listByUser: protectedProcedure.query(async ({ ctx }) => {
      const inquiries = await listInquiries();
      const userInquiries = inquiries.filter(i => i.email === ctx.user?.email);
      const inquiryIds = userInquiries.map(i => i.id);
      
      if (inquiryIds.length === 0) return [];
      
      const allPayments = [];
      for (const inquiryId of inquiryIds) {
        const order = await getOrder(inquiryId).catch(() => null);
        if (order) {
          const payments = await getPaymentsByOrder(order.id);
          allPayments.push(...payments);
        }
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

        // Notify owner
        await notifyOwner({
          title: `🚀 Nový projekt: ${input.title}`,
          content: `Projekt vytvořen pro objednávku #${input.orderId}. Termín: ${new Date(deadline).toLocaleDateString()}`,
        });

        return { projectId, deadline };
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

        await db
          .update(projects)
          .set({
            status: input.status,
            completionPercentage: input.completionPercentage,
            updatedAt: new Date(),
          })
          .where(eq(projects.id, input.projectId));

        await notifyOwner({
          title: `📊 Aktualizace projektu`,
          content: `Projekt ${input.projectId} změnil status na: ${input.status} (${input.completionPercentage}%)`,
        });

        return { ok: true };
      }),
  }),

  // ─── Projects ───────────────────────────────────────────────────────────────
  projects: router({
    // Client: get own projects with milestones
    myProjects: protectedProcedure.query(async ({ ctx }) => {
      const allInquiries = await listInquiries();
      const userInquiries = allInquiries.filter(i => i.email === ctx.user?.email);
      if (userInquiries.length === 0) return [];
      const orderIds = userInquiries.map(i => i.id);
      // find orders linked to those inquiries
      type OrderRow = NonNullable<Awaited<ReturnType<typeof getOrder>>>;
      const allOrdersList: OrderRow[] = [];
      for (const id of orderIds) {
        const o = await getOrder(id).catch(() => null);
        if (o) allOrdersList.push(o);
      }
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
    // Send a message to the OPTIVIO sales bot. Public (visitors not logged in).
    send: publicProcedure
      .input(z.object({
        conversationId: z.string().min(1),
        personaId: z.string().default("optivio-sales"),
        messages: z.array(z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })),
      }))
      .mutation(async ({ input }) => {
        const persona = getPersona(input.personaId) ?? getPersona("optivio-sales")!;
        const conversation = input.messages.filter(m => m.role !== "system");

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
          content = "Momentálně mám technické potíže. Napište nám prosím e-mail na info@optivio.cz nebo vyplňte formulář — ozveme se do 48 hodin.";
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
        conversationId: z.string().min(1),
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
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
        const variants = ['A', 'B', 'C', 'D'];
        const userId = input?.userId || 'anonymous';
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const variant = variants[hash % 4];
        return { variant };
      }),

    trackConversion: publicProcedure
      .input(z.object({
        variant: z.enum(['A', 'B', 'C', 'D']),
        event: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      }))
      .mutation(async ({ input }) => {
        console.log(`[AB Test] Variant ${input.variant} - Event: ${input.event}`, input.metadata);
        return { ok: true };
      }),
    getMetrics: publicProcedure
      .query(async () => {
        const metrics = await getABTestMetrics();
        return metrics;
      }),
    getSummary: publicProcedure
      .query(async () => {
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
      return SKILLS.map(s => ({
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
        const systemPrompt = skill
          ? buildSystemPrompt(skill, brandMemory)
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
      const myInquiries = allInquiries.filter(i => i.email === ctx.user?.email);

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
});

export type AppRouter = typeof appRouter;
