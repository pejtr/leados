import { desc, eq, and, count, gte, lte, sql, sum } from "drizzle-orm";
import { llmUsage, type InsertLlmUsage, type LlmUsage } from "../../drizzle/schema";
import { getDb } from "./core";

export async function insertLlmUsage(data: InsertLlmUsage): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(llmUsage).values(data);
}

export async function getLlmUsageStats(userId?: number) {
  const db = await getDb();
  if (!db) return { totalCalls: 0, totalTokens: 0, totalCostCents: 0, byModel: [] as { model: string; calls: number; tokens: number; costCents: number }[] };

  const where = userId ? eq(llmUsage.userId, userId) : undefined;

  const [totals, byModel] = await Promise.all([
    db.select({
      calls: count(),
      tokens: sum(llmUsage.totalTokens),
      cost: sum(llmUsage.estimatedCostCents),
    }).from(llmUsage).where(where),
    db.select({
      model: llmUsage.model,
      calls: count(),
      tokens: sum(llmUsage.totalTokens),
      cost: sum(llmUsage.estimatedCostCents),
    }).from(llmUsage).where(where).groupBy(llmUsage.model).orderBy(desc(count())),
  ]);

  return {
    totalCalls: totals[0]?.calls ?? 0,
    totalTokens: Number(totals[0]?.tokens ?? 0),
    totalCostCents: Number(totals[0]?.cost ?? 0),
    byModel: byModel.map((r) => ({
      model: r.model,
      calls: r.calls,
      tokens: Number(r.tokens ?? 0),
      costCents: Number(r.cost ?? 0),
    })),
  };
}

export async function getLlmUsageHistory(opts: {
  userId?: number;
  limit?: number;
  offset?: number;
  from?: Date;
  to?: Date;
}): Promise<LlmUsage[]> {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];
  if (opts.userId) conditions.push(eq(llmUsage.userId, opts.userId));
  if (opts.from) conditions.push(gte(llmUsage.createdAt, opts.from));
  if (opts.to) conditions.push(lte(llmUsage.createdAt, opts.to));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  return db.select().from(llmUsage).where(where).orderBy(desc(llmUsage.createdAt)).limit(limit).offset(offset) as Promise<LlmUsage[]>;
}