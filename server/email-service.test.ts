import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email-service";

afterEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.EMAIL_FROM;
  delete process.env.EMAIL_REPLY_TO;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEmail", () => {
  it("does not claim delivery when transport is not configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const sent = await sendEmail({
      to: "customer@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    });

    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends configured messages through the Resend API", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "OPTIMATEO <info@optimateo.com>";
    process.env.EMAIL_REPLY_TO = "info@optimateo.com";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "log").mockImplementation(() => undefined);

    const sent = await sendEmail({
      to: "customer@example.com",
      subject: "Potvrzení",
      html: "<p>Hotovo</p>",
      idempotencyKey: "confirmation-123",
    });

    expect(sent).toBe(true);
    expect(fetchMock).toHaveBeenCalledOnce();

    const [, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(request.method).toBe("POST");
    expect(request.headers).toMatchObject({
      Authorization: "Bearer re_test_key",
      "Idempotency-Key": "confirmation-123",
    });
    expect(JSON.parse(String(request.body))).toMatchObject({
      from: "OPTIMATEO <info@optimateo.com>",
      to: ["customer@example.com"],
      reply_to: "info@optimateo.com",
    });
  });

  it("returns false when the provider rejects a request", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "OPTIMATEO <info@optimateo.com>";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Invalid sender" }), { status: 422 })
    ));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(sendEmail({
      to: "customer@example.com",
      subject: "Test",
      html: "<p>Test</p>",
    })).resolves.toBe(false);
  });
});
