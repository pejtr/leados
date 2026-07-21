import {
  int,
  mysqlTable,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ── Benchmark Runs (persisted benchmark scores for correlation with confidence) ─
export const benchmarkRuns = mysqlTable("benchmark_runs", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("user_id").notNull(),
  totalScore: int("total_score").notNull().default(0),
  passRate: int("pass_rate").notNull().default(0),
  tasksRun: int("tasks_run").notNull().default(0),
  tierScores: json("tier_scores").$type<Record<string, number>>(),
  results: json("results").$type<Array<{
    taskId: string;
    taskName: string;
    category: string;
    difficulty: string;
    tier: number;
    score: number;
    passed: boolean;
    feedback: string;
  }>>(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type BenchmarkRun = typeof benchmarkRuns.$inferSelect;
export type InsertBenchmarkRun = typeof benchmarkRuns.$inferInsert;
