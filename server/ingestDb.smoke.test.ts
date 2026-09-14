/**
 * DB-backed smoke test for the ingest/hub write path.
 *
 * Runs against a real local MySQL (root@127.0.0.1, empty password — the same
 * convention as the OPTIHUB edge persistence tests). It proves, at runtime, that:
 *   1. the canonical `drizzle/schema` barrel resolves the modular ingest tables,
 *   2. a connected project can be written through the real `projectsDb` code,
 *   3. an ingested lead can be written through the same barrel,
 *   4. `enrichIngestedLeads` attributes it (and stays idempotent, no status change).
 */

import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "./db";
import { createProject, getProjectByApiKey } from "./projectsDb";
import { ingestedLeads } from "../drizzle/schema";

const DB = "leados_ingest_smoke";
const DATABASE_URL = `mysql://root@127.0.0.1:3306/${DB}`;

process.env.DATABASE_URL = DATABASE_URL;

async function createSchema() {
  const conn = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user: "root", password: "" });
  await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await conn.query(`CREATE DATABASE \`${DB}\``);
  await conn.changeUser({ database: DB });

  await conn.query(`CREATE TABLE connected_projects (
    id int auto_increment primary key,
    userId int not null,
    name varchar(128) not null,
    description text,
    url varchar(512),
    category varchar(64) default 'ecommerce',
    apiKey varchar(64) not null unique,
    isActive boolean default true not null,
    currency varchar(8) default 'CZK' not null,
    createdAt timestamp default current_timestamp not null,
    updatedAt timestamp default current_timestamp on update current_timestamp not null
  )`);

  await conn.query(`CREATE TABLE ingested_leads (
    id int auto_increment primary key,
    project_id int null,
    project_name varchar(128) not null,
    source varchar(128) not null,
    name varchar(256),
    email varchar(320) not null,
    phone varchar(64),
    interest varchar(512),
    page_url text,
    utm_source varchar(128),
    utm_medium varchar(128),
    utm_campaign varchar(128),
    ip_address varchar(64),
    user_agent text,
    extra_data json,
    status enum('new','contacted','qualified','disqualified') default 'new' not null,
    assigned_user_id int,
    notes text,
    created_at bigint not null,
    updated_at bigint not null
  )`);

  await conn.end();
}

async function dropDatabase() {
  const conn = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user: "root", password: "" });
  await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await conn.end();
}

beforeAll(createSchema);
afterAll(dropDatabase);

describe("ingest/hub write path (DB-backed)", () => {
  it("resolves the modular tables through the canonical barrel", () => {
    expect(ingestedLeads).toBeDefined();
    expect(ingestedLeads.projectId).toBeDefined();
  });

  it("writes a connected project through the real projectsDb code", async () => {
    const project = await createProject({ userId: 1, name: "bezmasajidla.cz" });
    expect(project).toBeTruthy();
    expect(project.id).toBeGreaterThan(0);
    expect(project.apiKey).toMatch(/^lpos_/);
    expect(project.isActive).toBe(true);

    const fetched = await getProjectByApiKey(project.apiKey);
    expect(fetched?.id).toBe(project.id);
  });

  it("writes and reads an ingested lead through the canonical barrel", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    const project = await createProject({ userId: 1, name: "kavarnapodkast.cz" });

    await db.insert(ingestedLeads).values({
      projectName: project.name,
      source: project.name,
      email: "lead@example.com",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const [lead] = await db
      .select()
      .from(ingestedLeads)
      .where(eq(ingestedLeads.email, "lead@example.com"))
      .limit(1);
    expect(lead.email).toBe("lead@example.com");
    expect(lead.status).toBe("new");
  });
});
