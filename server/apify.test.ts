import { describe, expect, it } from "vitest";

describe("Apify token validation", () => {
  it("APIFY_TOKEN env var is set", () => {
    const token = process.env.APIFY_TOKEN;
    expect(token).toBeTruthy();
    expect(typeof token).toBe("string");
    expect(token!.length).toBeGreaterThan(10);
  });

  it("Apify API responds with valid user info", async () => {
    const token = process.env.APIFY_TOKEN;
    if (!token) {
      console.warn("APIFY_TOKEN not set, skipping live test");
      return;
    }
    const res = await fetch(`https://api.apify.com/v2/users/me?token=${token}`);
    expect(res.status).toBe(200);
    const data = await res.json() as { data?: { username?: string } };
    expect(data.data?.username).toBeTruthy();
    console.log(`✅ Apify token valid for user: ${data.data?.username}`);
  }, 15_000);
});
