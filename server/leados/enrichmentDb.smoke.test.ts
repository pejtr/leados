/**
 * DB-backed smoke test for lead enrichment (the midnight attribution pass).
 *
 * Runs against real local MySQL (same convention as the OPTIHUB edge tests) and
 * proves `enrichIngestedLeads` actually updates `project_id` on an unassigned
 * ingested lead — idempotently and without mutating the lead's `status`.
 */

import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getDb } from "../db";
import { createProject } from "../projectsDb";
import { enrichIngestedLeads } from "./engine";
import { ingestedLeads } from "../../drizzle/schema";

const DB = "leados_ingest_smoke_enrich";
process.env.DATABASE_URL = `mysql://root@127.0.0.1:3306/${DB}`;

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

describe("lead enrichment (DB-backed)", () => {
  it("attributes an ingested lead to its active project, idempotently, without touching status", async () => {
    const db = await getDb();
    expect(db).toBeTruthy();

    const project = await createProject({ userId: 1, name: "bezmasajidla.cz" });

    await db.insert(ingestedLeads).values({
      projectName: project.name,
      source: project.name,
      email: "lead@example.com",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const first = await enrichIngestedLeads();
    expect(first).toEqual({ processed: 1, attributed: 1, unattributed: 0 });

    const [lead] = await db
      .select()
      .from(ingestedLeads)
      .where(eq(ingestedLeads.email, "lead@example.com"))
      .limit(1);
    expect(lead.projectId).toBe(project.id);
    expect(lead.status).toBe("new"); // enrichment never mutates lead status

    const second = await enrichIngestedLeads();
    expect(second.attributed).toBe(0); // idempotent
  });
});
