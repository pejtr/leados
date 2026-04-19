// One-time migration script for HERMES tables
import mysql from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

const statements = [
  `CREATE TABLE IF NOT EXISTS \`hermes_sessions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`user_id\` int NOT NULL,
    \`session_name\` varchar(255),
    \`intent\` varchar(64) NOT NULL DEFAULT 'general',
    \`status\` varchar(32) NOT NULL DEFAULT 'active',
    \`message_count\` int NOT NULL DEFAULT 0,
    \`sub_agents_used\` json,
    \`last_activity\` bigint NOT NULL,
    \`created_at\` bigint NOT NULL,
    CONSTRAINT \`hermes_sessions_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`hermes_messages\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`session_id\` int NOT NULL,
    \`user_id\` int NOT NULL,
    \`role\` varchar(16) NOT NULL,
    \`agent_name\` varchar(64),
    \`content\` text NOT NULL,
    \`metadata\` json,
    \`created_at\` bigint NOT NULL,
    CONSTRAINT \`hermes_messages_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`hermes_missions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`user_id\` int NOT NULL,
    \`session_id\` int,
    \`mission_type\` varchar(64) NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`status\` varchar(32) NOT NULL DEFAULT 'pending',
    \`plan\` json,
    \`result\` json,
    \`sub_agents_involved\` json,
    \`started_at\` bigint,
    \`completed_at\` bigint,
    \`created_at\` bigint NOT NULL,
    CONSTRAINT \`hermes_missions_id\` PRIMARY KEY(\`id\`)
  )`,
  // Add columns to brain_analyses if they don't exist
  `ALTER TABLE \`brain_analyses\` ADD COLUMN IF NOT EXISTS \`confidenceScore\` int`,
  `ALTER TABLE \`brain_analyses\` ADD COLUMN IF NOT EXISTS \`advocateAnalysis\` text`,
  `ALTER TABLE \`brain_analyses\` ADD COLUMN IF NOT EXISTS \`skepticAnalysis\` text`,
  `ALTER TABLE \`brain_analyses\` ADD COLUMN IF NOT EXISTS \`confidenceReasoning\` text`,
];

for (const stmt of statements) {
  try {
    await conn.execute(stmt);
    console.log("✓", stmt.slice(0, 60).replace(/\n/g, " ").trim() + "...");
  } catch (err) {
    if (err.code === "ER_DUP_FIELDNAME" || err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("⚠ Already exists, skipping:", stmt.slice(0, 60).trim());
    } else {
      console.error("✗ Error:", err.message);
    }
  }
}

await conn.end();
console.log("\n✅ HERMES migration complete");
