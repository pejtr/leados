import { describe, expect, it } from "vitest";

describe("Google Service Account JSON", () => {
  it("should be valid JSON with required service account fields", () => {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    expect(json, "GOOGLE_SERVICE_ACCOUNT_JSON env var must be set").toBeTruthy();

    let parsed: Record<string, unknown>;
    expect(() => {
      parsed = JSON.parse(json!);
    }, "Must be valid JSON").not.toThrow();

    parsed = JSON.parse(json!);
    expect(parsed.type).toBe("service_account");
    expect(parsed.client_email).toContain("@");
    expect(parsed.private_key).toContain("BEGIN PRIVATE KEY");
    expect(parsed.project_id).toBeTruthy();
  });

  it("should have the expected service account email", () => {
    const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    const parsed = JSON.parse(json!);
    expect(parsed.client_email).toBe(
      "leadgenai@studio-7767478385-7bd3d.iam.gserviceaccount.com"
    );
  });
});
