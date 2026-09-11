/**
 * OPTIHUB EDGE - schema bootstrap.
 *
 * The repository's drizzle journal is inconsistent with the on-disk migrations,
 * so `drizzle-kit migrate` aborts before it reaches the edge migration (a
 * pre-existing condition, hidden in the start script by `|| true`). The edge
 * therefore creates its own tables idempotently at startup instead of silently
 * depending on a chain that does not run.
 *
 * `drizzle/0007_optihub_edge.sql` is the reviewable copy of exactly these
 * statements, and a test asserts the two never drift. All statements are
 * `IF NOT EXISTS`, so bootstrapping is safe to repeat on every boot.
 */

import type { Pool } from "mysql2/promise";

export const OPTIHUB_EDGE_DDL: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS \`optihub_edge_credentials\` (
    \`id\` varchar(64) NOT NULL,
    \`tenantId\` varchar(128) NOT NULL,
    \`actorId\` varchar(128) NOT NULL,
    \`secretHash\` varchar(64) NOT NULL,
    \`version\` int NOT NULL DEFAULT 1,
    \`status\` varchar(16) NOT NULL DEFAULT 'active',
    \`scopes\` json NOT NULL,
    \`metadata\` json NOT NULL,
    \`createdAt\` bigint NOT NULL,
    \`expiresAt\` bigint,
    \`revokedAt\` bigint,
    \`lastUsedAt\` bigint,
    \`rotatedFromId\` varchar(64),
    \`rotatedToId\` varchar(64),
    CONSTRAINT \`optihub_edge_credentials_id\` PRIMARY KEY (\`id\`),
    CONSTRAINT \`optihub_edge_credentials_secretHash_unique\` UNIQUE (\`secretHash\`),
    KEY \`optihub_edge_credentials_tenant_idx\` (\`tenantId\`),
    KEY \`optihub_edge_credentials_rotated_from_idx\` (\`rotatedFromId\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`optihub_edge_audit\` (
    \`id\` bigint unsigned NOT NULL AUTO_INCREMENT,
    \`timestamp\` bigint NOT NULL,
    \`requestId\` varchar(64) NOT NULL,
    \`externalRequestId\` varchar(128),
    \`surface\` varchar(16) NOT NULL,
    \`host\` varchar(255) NOT NULL,
    \`method\` varchar(8) NOT NULL,
    \`route\` varchar(255) NOT NULL,
    \`action\` varchar(64) NOT NULL,
    \`resource\` varchar(255),
    \`credentialId\` varchar(64),
    \`tenantId\` varchar(128),
    \`actorId\` varchar(128),
    \`decision\` varchar(8) NOT NULL,
    \`code\` varchar(48),
    \`reason\` varchar(128) NOT NULL,
    \`status\` int NOT NULL,
    \`ipHash\` varchar(64),
    \`userAgent\` varchar(256),
    CONSTRAINT \`optihub_edge_audit_id\` PRIMARY KEY (\`id\`),
    KEY \`optihub_edge_audit_request_idx\` (\`requestId\`),
    KEY \`optihub_edge_audit_tenant_idx\` (\`tenantId\`),
    KEY \`optihub_edge_audit_timestamp_idx\` (\`timestamp\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`optihub_edge_rate_windows\` (
    \`bucketKey\` varchar(255) NOT NULL,
    \`windowStart\` bigint NOT NULL,
    \`count\` int NOT NULL,
    \`updatedAt\` bigint NOT NULL,
    CONSTRAINT \`optihub_edge_rate_windows_bucketKey\` PRIMARY KEY (\`bucketKey\`)
  )`,
];

/** Create the edge tables if they are missing. Idempotent and fail-closed. */
export async function ensureOptiHubEdgeSchema(pool: Pool): Promise<void> {
  for (const statement of OPTIHUB_EDGE_DDL) {
    await pool.query(statement);
  }
}
