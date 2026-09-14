/**
 * The drop-in project tracker (`GET /api/ingest-sdk.js`).
 *
 * It is public and unauthenticated by design, so the only thing that keeps it
 * safe is that the caller-supplied key is shape-checked and always emitted as a
 * quoted literal. Both halves are pinned here, including hostile inputs.
 */

import http from "node:http";
import express from "express";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";

import { PROJECT_API_KEY_PATTERN, buildIngestSdkScript, registerIngestRoute } from "./ingestRoute";

const VALID_KEY = `lpos_${"a".repeat(48)}`;

async function withIngestServer<T>(run: (origin: string) => Promise<T>): Promise<T> {
  const app = express();
  app.use(express.json());
  registerIngestRoute(app);
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", () => resolve()));
  try {
    const { port } = server.address() as AddressInfo;
    return await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

describe("PROJECT_API_KEY_PATTERN", () => {
  it("accepts generated project keys", () => {
    expect(PROJECT_API_KEY_PATTERN.test(VALID_KEY)).toBe(true);
    expect(PROJECT_API_KEY_PATTERN.test("lpos_0123456789abcdef")).toBe(true);
  });

  it("rejects short or structurally unsafe values", () => {
    expect(PROJECT_API_KEY_PATTERN.test("short")).toBe(false);
    expect(PROJECT_API_KEY_PATTERN.test(`${"a".repeat(129)}`)).toBe(false);
    expect(PROJECT_API_KEY_PATTERN.test('lpos_";alert(1)//')).toBe(false);
    expect(PROJECT_API_KEY_PATTERN.test("lpos_<script>")).toBe(false);
  });
});

describe("buildIngestSdkScript", () => {
  it("emits the project key as a quoted literal and wires both endpoints", () => {
    const script = buildIngestSdkScript(VALID_KEY);
    expect(script).toContain(`var projectKey = ${JSON.stringify(VALID_KEY)};`);
    expect(script).toContain("/api/ingest/");
    expect(script).toContain("/api/hub/lead");
    expect(script).toContain('"X-Hub-Key": projectKey');
    expect(script).toContain("window.onyxTracker");
    expect(script).toContain("keepalive: true");
  });

  it("derives the origin from its own script tag instead of using a relative URL", () => {
    expect(buildIngestSdkScript(VALID_KEY)).toContain("new URL(current.src).origin");
  });

  it("cannot be broken out of by a hostile value", () => {
    const script = buildIngestSdkScript('x</script><script>alert(1)</script>');
    expect(script).not.toContain("</script>");
    expect(script).toContain("<\\/script>");
  });
});

describe("GET /api/ingest-sdk.js", () => {
  it("serves the tracker for a well-formed key with hardening headers", async () => {
    await withIngestServer(async origin => {
      const res = await httpGet(`${origin}/api/ingest-sdk.js?key=${VALID_KEY}`);
      expect(res.status).toBe(200);
      expect(res.headers["content-type"]).toContain("application/javascript");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      expect(res.body).toContain(VALID_KEY);
    });
  });

  it("rejects a missing key and reflects nothing", async () => {
    await withIngestServer(async origin => {
      const res = await httpGet(`${origin}/api/ingest-sdk.js`);
      expect(res.status).toBe(400);
      expect(res.body).toContain("missing or malformed key");
      expect(res.body).not.toContain("undefined");
    });
  });

  it("rejects a script-injection key without echoing it", async () => {
    await withIngestServer(async origin => {
      const payload = '"</script><script>alert(1)</script>';
      const res = await httpGet(`${origin}/api/ingest-sdk.js?key=${encodeURIComponent(payload)}`);
      expect(res.status).toBe(400);
      expect(res.body).not.toContain("alert(1)");
      expect(res.body).not.toContain("script>");
    });
  });

  it("takes the first value when the key parameter repeats, and never uses it to bypass the check", async () => {
    const first = `lpos_${"a".repeat(48)}`;
    const second = `lpos_${"b".repeat(48)}`;
    await withIngestServer(async origin => {
      const ok = await httpGet(`${origin}/api/ingest-sdk.js?key=${first}&key=${second}`);
      expect(ok.status).toBe(200);
      expect(ok.body).toContain(first);
      expect(ok.body).not.toContain(second);

      // A malformed first value is denied even when a valid one follows it.
      const denied = await httpGet(`${origin}/api/ingest-sdk.js?key=bad&key=${VALID_KEY}`);
      expect(denied.status).toBe(400);
    });
  });
});

function httpGet(url: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.get(url, res => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", chunk => (body += chunk));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.on("error", reject);
  });
}
