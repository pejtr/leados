/**
 * DB-backed smoke test for the recovered `../db` barrel.
 *
 * The file `server/db.ts` shadows the directory `server/db/index.ts`, so the
 * domain-helper barrel was unreachable from the `../db` / `./db` specifier. The
 * re-export added to `server/db.ts` is what revives these paths. This test
 * imports ONLY from `./db` and exercises one CRM path (agency clients) and one
 * tracking path (tracking pixels) against real local MySQL.
 */

import mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createAgencyClient,
  createTrackingPixel,
  getAgencyClientsByUser,
  getTrackingPixelsByUser,
} from "./db";

const DB = "leados_db_barrel_smoke";
process.env.DATABASE_URL = `mysql://root@127.0.0.1:3306/${DB}`;

async function createSchema() {
  const conn = await mysql.createConnection({ host: "127.0.0.1", port: 3306, user: "root", password: "" });
  await conn.query(`DROP DATABASE IF EXISTS \`${DB}\``);
  await conn.query(`CREATE DATABASE \`${DB}\``);
  await conn.changeUser({ database: DB });

  await conn.query(`CREATE TABLE agency_clients (
    id int auto_increment primary key,
    agencyUserId int not null,
    clientName varchar(256) not null,
    clientEmail varchar(320),
    clientDomain varchar(256),
    industry varchar(128),
    brandColor varchar(16),
    brandLogo text,
    totalLeads int not null default 0,
    totalCampaigns int not null default 0,
    isActive boolean not null default true,
    createdAt timestamp not null default current_timestamp
  )`);

  await conn.query(`CREATE TABLE tracking_pixels (
    id int auto_increment primary key,
    userId int not null,
    name varchar(128) not null,
    domain varchar(256) not null,
    pixelCode text not null,
    isActive boolean not null default true,
    totalVisitors int not null default 0,
    identifiedCompanies int not null default 0,
    createdAt timestamp not null default current_timestamp
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

describe("recovered ../db barrel (DB-backed)", () => {
  it("revives the CRM agency-client path (create -> read, tenant-scoped)", async () => {
    await createAgencyClient({
      agencyUserId: 7,
      clientName: "kavarnapodkast.cz",
      clientDomain: "kavarnapodkast.cz",
    });

    const clients = await getAgencyClientsByUser(7);
    expect(clients).toHaveLength(1);
    expect(clients[0].clientName).toBe("kavarnapodkast.cz");
    expect(clients[0].agencyUserId).toBe(7);
    expect(clients[0].isActive).toBe(true);

    // tenant isolation: another agency sees nothing
    expect(await getAgencyClientsByUser(8)).toHaveLength(0);
  });

  it("revives the tracking pixel path (create -> read, user-scoped)", async () => {
    await createTrackingPixel({
      userId: 11,
      name: "main site",
      domain: "example.com",
      pixelCode: "PX-1",
    });

    const pixels = await getTrackingPixelsByUser(11);
    expect(pixels).toHaveLength(1);
    expect(pixels[0].domain).toBe("example.com");
    expect(pixels[0].isActive).toBe(true);

    // user isolation
    expect(await getTrackingPixelsByUser(12)).toHaveLength(0);
  });
});
