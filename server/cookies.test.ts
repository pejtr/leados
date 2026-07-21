import { describe, it, expect } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("getSessionCookieOptions", () => {
  it("sets secure=true when protocol is https", () => {
    const req = { protocol: "https", headers: {} } as any;
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
    expect(opts.httpOnly).toBe(true);
    expect(opts.path).toBe("/");
    expect(opts.sameSite).toBe("none");
  });

  it("sets secure=false when protocol is http and no forward header", () => {
    const req = { protocol: "http", headers: {} } as any;
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(false);
  });

  it("sets secure=true when x-forwarded-proto contains https", () => {
    const req = {
      protocol: "http",
      headers: { "x-forwarded-proto": "https" },
    } as any;
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
  });

  it("parses comma-separated x-forwarded-proto", () => {
    const req = {
      protocol: "http",
      headers: { "x-forwarded-proto": "http, https" },
    } as any;
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
  });

  it("ignores case in x-forwarded-proto", () => {
    const req = {
      protocol: "http",
      headers: { "x-forwarded-proto": "HTTPS" },
    } as any;
    const opts = getSessionCookieOptions(req);
    expect(opts.secure).toBe(true);
  });
});
