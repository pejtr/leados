/**
 * OPTIHUB EDGE - real-MySQL test support.
 *
 * The persistence tests are not mocked: they run against a local MySQL and the
 * exact migration file that production uses. `ensureOptiHubTestDatabase` creates
 * the database if needed and applies `drizzle/0007_optihub_edge.sql` statement by
 * statement (the same `--> statement-breakpoint` split the Drizzle migrator uses).
 * Re-running it is a no-op, which is itself part of the test contract.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";
import type { Pool } from "mysql2/promise";

import { MySqlEdgeAuditSink } from "./mysqlAuditSink";
import { MySqlEdgeCredentialStore } from "./mysqlCredentialStore";
import { MySqlEdgeRateLimiter } from "./mysqlRateLimiter";
import { createOptiHubDbPool } from "./pool";

export const DEFAULT_OPTIHUB_TEST_DATABASE_URL =
  "mysql://root@127.0.0.1:3306/leados_optihub_test";

/**
 * Test database URL. `namespace` appends a suffix to the database name so that
 * files which vitest runs in parallel do not truncate each other's tables.
 */
export function optiHubTestDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
  namespace = "",
): string {
  const base = env["OPTIHUB_TEST_DATABASE_URL"] ?? DEFAULT_OPTIHUB_TEST_DATABASE_URL;
  if (namespace === "") return base;
  const parsed = new URL(base);
  const database = parsed.pathname.replace(/^\//, "");
  parsed.pathname = `/${database}_${namespace}`;
  return parsed.toString();
}

const MIGRATION_PATH = fileURLToPath(
  new URL("../../../drizzle/0007_optihub_edge.sql", import.meta.url),
);

/** The committed migration, split the same way the Drizzle migrator splits it. */
export function readOptiHubMigrationStatements(): string[] {
  return readFileSync(MIGRATION_PATH, "utf8")
    .split("--> statement-breakpoint")
    .map(statement => statement.trim())
    .filter(statement => statement !== "");
}

interface ParsedDatabaseUrl {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly database: string;
}

export function parseDatabaseUrl(url: string): ParsedDatabaseUrl {
  const parsed = new URL(url);
  const database = parsed.pathname.replace(/^\//, "");
  if (!/^[A-Za-z0-9_]+$/.test(database)) {
    throw new Error(`unsafe test database name: ${database}`);
  }
  return {
    host: parsed.hostname,
    port: parsed.port === "" ? 3306 : Number(parsed.port),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
  };
}

async function applyMigration(connection: mysql.Connection): Promise<void> {
  for (const statement of readOptiHubMigrationStatements()) {
    await connection.query(statement);
  }
}

/** Create the database if needed and apply the edge migration (idempotent). */
export async function ensureOptiHubTestDatabase(url: string): Promise<void> {
  const target = parseDatabaseUrl(url);
  const connection = await mysql.createConnection({
    host: target.host,
    port: target.port,
    user: target.user,
    password: target.password,
  });
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${target.database}\``);
    await connection.changeUser({ database: target.database });
    await applyMigration(connection);
  } finally {
    await connection.end();
  }
}

export function createOptiHubTestPool(url: string): Pool {
  return createOptiHubDbPool(url);
}

export interface OptiHubTestStores {
  readonly store: MySqlEdgeCredentialStore;
  readonly audit: MySqlEdgeAuditSink;
  readonly limiter: MySqlEdgeRateLimiter;
}

export function createOptiHubTestStores(pool: Pool): OptiHubTestStores {
  return {
    store: new MySqlEdgeCredentialStore(pool),
    audit: new MySqlEdgeAuditSink(pool),
    limiter: new MySqlEdgeRateLimiter(pool, 0),
  };
}

/** Remove all edge rows so each test starts from a known state. */
export async function resetOptiHubTestTables(pool: Pool): Promise<void> {
  await pool.query("DELETE FROM optihub_edge_audit");
  await pool.query("DELETE FROM optihub_edge_rate_windows");
  await pool.query("DELETE FROM optihub_edge_credentials");
}
