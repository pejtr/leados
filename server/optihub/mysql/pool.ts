/**
 * OPTIHUB EDGE - MySQL connection pool and transaction helper.
 *
 * The repository's database is MySQL (mysql2 + Drizzle). The edge uses the same
 * engine and the same migration framework (drizzle/0007_optihub_edge.sql) rather
 * than introducing a second, parallel database stack.
 *
 * All edge SQL uses parameter binding. Values are never interpolated.
 */

import { createHash } from "node:crypto";

import mysql from "mysql2/promise";
import type { Pool, PoolConnection } from "mysql2/promise";

export type OptiHubDbPool = Pool;
export type OptiHubDbConnection = PoolConnection;

export function createOptiHubDbPool(databaseUrl: string): Pool {
  return mysql.createPool({
    uri: databaseUrl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // epoch-millisecond bigints stay JS numbers in the safe-integer range.
    supportBigNumbers: true,
    bigNumberStrings: false,
  });
}

/**
 * Run `callback` inside a single transaction on one pooled connection. Any
 * thrown error rolls the transaction back and is re-thrown unchanged.
 */
export async function withOptiHubTransaction<T>(
  pool: Pool,
  callback: (connection: PoolConnection) => Promise<T>,
): Promise<T> {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // The connection is already unusable; the original error is what matters.
    }
    throw error;
  } finally {
    connection.release();
  }
}

/** A stable, non-PII bucket key for the shared limiter. */
export function hashRateLimitBucket(parts: readonly string[]): string {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}
