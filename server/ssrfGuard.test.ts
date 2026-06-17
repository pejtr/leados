import { describe, it, expect } from "vitest";
import { isBlockedIp, assertPublicHttpUrl, SsrfError } from "./_core/ssrfGuard";

describe("ssrfGuard.isBlockedIp", () => {
  it("blocks IPv4 loopback / private / link-local / metadata", () => {
    expect(isBlockedIp("127.0.0.1")).toBe(true);
    expect(isBlockedIp("10.1.2.3")).toBe(true);
    expect(isBlockedIp("172.16.0.1")).toBe(true);
    expect(isBlockedIp("172.31.255.255")).toBe(true);
    expect(isBlockedIp("192.168.0.1")).toBe(true);
    expect(isBlockedIp("169.254.169.254")).toBe(true); // cloud metadata
    expect(isBlockedIp("100.64.0.1")).toBe(true); // CGNAT
    expect(isBlockedIp("0.0.0.0")).toBe(true);
  });

  it("allows public IPv4", () => {
    expect(isBlockedIp("8.8.8.8")).toBe(false);
    expect(isBlockedIp("1.1.1.1")).toBe(false);
    expect(isBlockedIp("172.32.0.1")).toBe(false); // just outside 172.16/12
    expect(isBlockedIp("93.184.216.34")).toBe(false); // example.com
  });

  it("blocks IPv6 loopback / ULA / link-local and v4-mapped private", () => {
    expect(isBlockedIp("::1")).toBe(true);
    expect(isBlockedIp("::")).toBe(true);
    expect(isBlockedIp("fc00::1")).toBe(true);
    expect(isBlockedIp("fe80::1")).toBe(true);
    expect(isBlockedIp("::ffff:127.0.0.1")).toBe(true);
    expect(isBlockedIp("::ffff:169.254.169.254")).toBe(true);
  });

  it("allows public IPv6", () => {
    expect(isBlockedIp("2606:4700:4700::1111")).toBe(false); // cloudflare
    expect(isBlockedIp("2001:4860:4860::8888")).toBe(false); // google
  });

  it("blocks garbage", () => {
    expect(isBlockedIp("not-an-ip")).toBe(true);
    expect(isBlockedIp("")).toBe(true);
  });
});

describe("ssrfGuard.assertPublicHttpUrl", () => {
  it("rejects non-http schemes", async () => {
    await expect(assertPublicHttpUrl("file:///etc/passwd")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("ftp://example.com")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("gopher://example.com")).rejects.toThrow(SsrfError);
  });

  it("rejects localhost and internal TLDs", async () => {
    await expect(assertPublicHttpUrl("http://localhost/x")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("http://foo.internal/x")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("http://db.local/x")).rejects.toThrow(SsrfError);
  });

  it("rejects private IP literals including metadata endpoint", async () => {
    await expect(assertPublicHttpUrl("http://169.254.169.254/latest/meta-data")).rejects.toThrow(
      SsrfError
    );
    await expect(assertPublicHttpUrl("http://127.0.0.1:3000/")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("http://[::1]/")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("http://192.168.1.1/")).rejects.toThrow(SsrfError);
  });

  it("rejects credentials in URL and disallowed ports", async () => {
    await expect(assertPublicHttpUrl("http://user:pass@8.8.8.8/")).rejects.toThrow(SsrfError);
    await expect(assertPublicHttpUrl("http://8.8.8.8:22/")).rejects.toThrow(SsrfError);
  });

  it("allows a public https URL with a public IP literal", async () => {
    await expect(assertPublicHttpUrl("https://8.8.8.8/webhook")).resolves.toBeUndefined();
    await expect(assertPublicHttpUrl("https://1.1.1.1:443/hook")).resolves.toBeUndefined();
  });
});
