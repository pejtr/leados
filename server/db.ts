import { eq, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, inquiries, portfolioProjects, testimonials, InsertInquiry, nichePackages, customerSubscriptions, InsertNichePackage, InsertCustomerSubscription, orders, payments, InsertOrder, InsertPayment, brandMemories, BrandMemory, InsertBrandMemory, agentSessions, InsertAgentSession, agentMessages, InsertAgentMessage, projects, projectMilestones, InsertProject, InsertProjectMilestone, salesConversations, InsertSalesConversation, salesMessages, InsertSalesMessage } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createInquiry(data: InsertInquiry) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(inquiries).values(data);
  return result;
}

export async function listInquiries() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(inquiries).orderBy(inquiries.createdAt);
}

export async function getPortfolioProjects() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(portfolioProjects).orderBy(portfolioProjects.createdAt);
}

export async function getTestimonials() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(testimonials).orderBy(testimonials.createdAt);
}

export async function getNichePackages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(nichePackages).where(eq(nichePackages.active, 1));
}

export async function getAllNichePackages() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(nichePackages).orderBy(nichePackages.createdAt);
}

export async function createNichePackage(data: InsertNichePackage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(nichePackages).values(data);
}

export async function updateNichePackage(id: number, data: Partial<InsertNichePackage>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(nichePackages).set(data).where(eq(nichePackages.id, id));
}

export async function deactivateNichePackage(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(nichePackages).set({ active: 0 }).where(eq(nichePackages.id, id));
}

export async function getCustomerSubscriptions(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(customerSubscriptions).where(eq(customerSubscriptions.customerId, customerId));
}

export async function getAllSubscriptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(customerSubscriptions).orderBy(customerSubscriptions.createdAt);
}

export async function createCustomerSubscription(data: InsertCustomerSubscription) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(customerSubscriptions).values(data);
}

export async function cancelCustomerSubscription(subscriptionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(customerSubscriptions).set({ active: 0, endDate: new Date() }).where(eq(customerSubscriptions.id, subscriptionId));
}

export async function createOrder(data: InsertOrder) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(orders).values(data);
}

export async function getOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getAllPayments() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function updateOrder(orderId: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(orders).set(data).where(eq(orders.id, orderId));
}

export async function getOrderByStripeSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.select().from(orders).where(eq(orders.stripeCheckoutSessionId, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.insert(payments).values(data);
}

export async function getPaymentsByOrder(orderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.select().from(payments).where(eq(payments.orderId, orderId));
}

export async function updatePayment(paymentId: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return await db.update(payments).set(data).where(eq(payments.id, paymentId));
}

// Brand Memory helpers
export async function getBrandMemory(userId: number): Promise<BrandMemory | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(brandMemories).where(eq(brandMemories.userId, userId)).limit(1);
  return rows[0];
}

export async function upsertBrandMemory(userId: number, data: Omit<InsertBrandMemory, 'userId'>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getBrandMemory(userId);
  if (existing) {
    return db.update(brandMemories).set({ ...data, updatedAt: new Date() }).where(eq(brandMemories.userId, userId));
  }
  return db.insert(brandMemories).values({ ...data, userId });
}

// Agent Session helpers
export async function createAgentSession(data: InsertAgentSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(agentSessions).values(data);
}

export async function getAgentSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentSessions)
    .where(eq(agentSessions.userId, userId))
    .orderBy(desc(agentSessions.updatedAt));
}

export async function getAgentSession(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(agentSessions).where(eq(agentSessions.id, sessionId)).limit(1);
  return rows[0];
}

export async function updateAgentSession(sessionId: number, data: Partial<InsertAgentSession>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(agentSessions).set({ ...data, updatedAt: new Date() }).where(eq(agentSessions.id, sessionId));
}

// Agent Message helpers
export async function addAgentMessage(data: InsertAgentMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(agentMessages).values(data);
}

export async function getAgentMessages(sessionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agentMessages)
    .where(eq(agentMessages.sessionId, sessionId))
    .orderBy(agentMessages.createdAt);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).orderBy(desc(projects.createdAt));
}

export async function getProjectByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(projects).where(eq(projects.orderId, orderId)).limit(1);
  return rows[0];
}

export async function getProjectsByOrderIds(orderIds: number[]) {
  if (orderIds.length === 0) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(inArray(projects.orderId, orderIds));
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(projects).values(data);
}

export async function updateProject(projectId: string, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projects).set({ ...data, updatedAt: new Date() }).where(eq(projects.id, projectId));
}

export async function getProjectMilestones(projectId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectMilestones)
    .where(eq(projectMilestones.projectId, projectId))
    .orderBy(projectMilestones.createdAt);
}

export async function createMilestone(data: InsertProjectMilestone) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(projectMilestones).values(data);
}

export async function updateMilestone(milestoneId: string, data: Partial<InsertProjectMilestone>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(projectMilestones).set(data).where(eq(projectMilestones.id, milestoneId));
}

// ─── Sales Chat (customer-facing chatbot) ───────────────────────────────────────

export async function getSalesConversation(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(salesConversations).where(eq(salesConversations.id, id)).limit(1);
  return rows[0];
}

export async function upsertSalesConversation(data: InsertSalesConversation) {
  const db = await getDb();
  if (!db) return; // gracefully degrade — chat still works without persistence
  const existing = await getSalesConversation(data.id);
  if (existing) {
    return db.update(salesConversations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(salesConversations.id, data.id));
  }
  return db.insert(salesConversations).values(data);
}

export async function incrementSalesMessageCount(id: string, by: number = 1) {
  const db = await getDb();
  if (!db) return;
  const conv = await getSalesConversation(id);
  if (!conv) return;
  return db.update(salesConversations)
    .set({ messageCount: (conv.messageCount ?? 0) + by, updatedAt: new Date() })
    .where(eq(salesConversations.id, id));
}

export async function addSalesMessage(data: InsertSalesMessage) {
  const db = await getDb();
  if (!db) return;
  return db.insert(salesMessages).values(data);
}

export async function getSalesMessages(conversationId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesMessages)
    .where(eq(salesMessages.conversationId, conversationId))
    .orderBy(salesMessages.createdAt);
}

export async function getAllSalesConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesConversations).orderBy(desc(salesConversations.updatedAt));
}

export async function captureSalesLead(id: string, lead: { visitorEmail?: string; visitorName?: string; visitorPhone?: string; inquiryId?: number }) {
  const db = await getDb();
  if (!db) return;
  return db.update(salesConversations)
    .set({ ...lead, capturedLead: 1, updatedAt: new Date() })
    .where(eq(salesConversations.id, id));
}

