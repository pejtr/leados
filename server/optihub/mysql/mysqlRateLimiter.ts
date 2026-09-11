/**
 * OPTIHUB EDGE - MySQL-backed shared rate limiter.
 *
 * A single `optihub_edge_rate_windows` row per bucket. The increment and the
 * read happen inside one transaction, so the decision is atomic and identical
 * from every application instance that shares the database.
 *
 * Bucket keys are hashed (tenant + credential + action, or a pre-auth key), so
 * no raw identifier and no user-supplied key is ever stored.
 *
 * A limiter outage is not swallowed here: the error propagates and the pipeline
 * fails closed with RATE_LIMIT_UNAVAILABLE.
 */

import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type {
  EdgeRateLimitDecision,
  EdgeRateLimitKey,
  EdgeRateLimiter,
} from "../rateLimit";
import { hashRateLimitBucket, withOptiHubTransaction } from "./pool";

const TABLE = "optihub_edge_rate_windows";
/** Keeps a hammered bucket from overflowing the int column. */
const COUNT_CEILING = 1_000_000;

interface WindowRow extends RowDataPacket {
  windowStart: number;
  count: number;
}

export function edgeRateLimitBucketKey(key: EdgeRateLimitKey): string {
  return hashRateLimitBucket([key.tenantId, key.credentialId, key.action]);
}

export class MySqlEdgeRateLimiter implements EdgeRateLimiter {
  private evaluations = 0;

  constructor(
    private readonly pool: Pool,
    private readonly cleanupEvery = 500,
    private readonly cleanupMaxAgeMs = 60 * 60 * 1000,
  ) {}

  async evaluate(
    key: EdgeRateLimitKey,
    limit: number,
    windowMs: number,
    now: number,
  ): Promise<EdgeRateLimitDecision> {
    const bucketKey = edgeRateLimitBucketKey(key);
    // Fixed window buckets: every instance derives the same window from the same
    // clock. Keying the counter on the raw `now` would reset it on every request.
    const windowStart = now - (now % windowMs);
    const decision = await withOptiHubTransaction(this.pool, async connection => {
      await connection.execute<ResultSetHeader>(
        `INSERT INTO ${TABLE} (bucketKey, windowStart, count, updatedAt)
         VALUES (?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE
           count = IF(windowStart = ?, LEAST(count + 1, ${COUNT_CEILING}), 1),
           windowStart = ?,
           updatedAt = ?`,
        [bucketKey, windowStart, now, windowStart, windowStart, now],
      );
      const [rows] = await connection.query<WindowRow[]>(
        `SELECT windowStart, count FROM ${TABLE} WHERE bucketKey = ? LIMIT 1`,
        [bucketKey],
      );
      const row = rows[0];
      const storedWindowStart = Number(row?.windowStart ?? windowStart);
      const count = Number(row?.count ?? 1);
      const resetAt = storedWindowStart + windowMs;
      if (count > limit) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(Math.ceil((resetAt - now) / 1000), 1),
        };
      }
      return { allowed: true, remaining: Math.max(limit - count, 0), retryAfterSeconds: 0 };
    });

    this.evaluations += 1;
    if (this.cleanupEvery > 0 && this.evaluations % this.cleanupEvery === 0) {
      // Best effort: stale buckets must not grow without bound, but a cleanup
      // failure must never change a request's decision.
      void this.cleanup(now).catch(() => undefined);
    }
    return decision;
  }

  /** Remove buckets that have been idle for longer than `cleanupMaxAgeMs`. */
  async cleanup(now: number = Date.now()): Promise<number> {
    const cutoff = now - this.cleanupMaxAgeMs;
    const [result] = await this.pool.execute<ResultSetHeader>(
      `DELETE FROM ${TABLE} WHERE updatedAt < ? LIMIT 5000`,
      [cutoff],
    );
    return result.affectedRows;
  }
}
