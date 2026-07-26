import { describe, expect, it } from "vitest";
import {
  canReleaseKatastrContact,
  canTransitionPartnerCase,
  katastrConsentEvidenceSchema,
  katastrLeadUpsertSchema,
  katastrMatchUpsertSchema,
} from "../shared/katastrIntegrationContracts";

const context = {
  tenantId: "katastr-tenant-1",
  correlationId: "017e7c9e-3f8c-4b67-9017-d4eb965fb671",
  idempotencyKey: "request-0001",
  schemaVersion: "1.0" as const,
};

describe("Katastr integration contracts", () => {
  it("requires at least one contact method for a lead", () => {
    const result = katastrLeadUpsertSchema.safeParse({
      ...context,
      externalPersonId: "buyer-1",
      leadType: "buyer",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a phone-only seller lead and rejects unknown fields", () => {
    const valid = katastrLeadUpsertSchema.safeParse({
      ...context,
      externalPersonId: "seller-1",
      leadType: "seller",
      phone: "+420777000111",
    });
    const withUnknownField = katastrLeadUpsertSchema.safeParse({
      ...context,
      externalPersonId: "seller-1",
      leadType: "seller",
      phone: "+420777000111",
      ownerFromCadastre: "must-not-be-accepted",
    });

    expect(valid.success).toBe(true);
    expect(withUnknownField.success).toBe(false);
  });

  it("enforces explainable match factors between zero and one hundred", () => {
    const baseMatch = {
      ...context,
      matchId: "match-1",
      buyerExternalPersonId: "buyer-1",
      sellerExternalPersonId: "seller-1",
      propertyId: "property-1",
      buyerDemandId: "demand-1",
      sellerListingId: "listing-1",
      score: 81.5,
      factors: {
        locality: 90,
        budget: 80,
        propertyParameters: 85,
        timing: 70,
        financing: 75,
        investmentPreference: 65,
      },
      hardConstraints: { budgetWithinLimit: true },
      explanation: "The location and budget fit the buyer demand.",
      modelVersion: "match-v1",
    };

    expect(katastrMatchUpsertSchema.safeParse(baseMatch).success).toBe(true);
    expect(
      katastrMatchUpsertSchema.safeParse({
        ...baseMatch,
        factors: { ...baseMatch.factors, financing: 101 },
      }).success
    ).toBe(false);
  });

  it("requires a verifiable consent evidence hash", () => {
    const consent = {
      ...context,
      externalConsentId: "consent-1",
      subjectType: "buyer",
      subjectExternalPersonId: "buyer-1",
      purpose: "partner_handoff",
      scopes: ["share_contact_with_assigned_partner"],
      status: "granted",
      policyVersion: "2026-07",
      captureMethod: "web_form",
      evidenceHash: "a".repeat(64),
      occurredAt: "2026-07-26T12:00:00.000Z",
    };

    expect(katastrConsentEvidenceSchema.safeParse(consent).success).toBe(true);
    expect(
      katastrConsentEvidenceSchema.safeParse({
        ...consent,
        evidenceHash: "not-a-sha256-hash",
      }).success
    ).toBe(false);
  });
});

describe("Katastr partner handoff policy", () => {
  it("allows only explicit partner-case transitions", () => {
    expect(canTransitionPartnerCase("pending_approval", "approved")).toBe(true);
    expect(canTransitionPartnerCase("pending_approval", "sold")).toBe(false);
    expect(canTransitionPartnerCase("viewing", "offer")).toBe(true);
    expect(canTransitionPartnerCase("sold", "contacted")).toBe(false);
  });

  it("never releases contact without both consents, approval and verified partner", () => {
    expect(
      canReleaseKatastrContact({
        buyerConsentGranted: true,
        sellerConsentGranted: true,
        approvalGranted: true,
        partnerVerified: true,
      })
    ).toBe(true);

    for (const missing of [
      "buyerConsentGranted",
      "sellerConsentGranted",
      "approvalGranted",
      "partnerVerified",
    ] as const) {
      const policy = {
        buyerConsentGranted: true,
        sellerConsentGranted: true,
        approvalGranted: true,
        partnerVerified: true,
      };
      policy[missing] = false;
      expect(canReleaseKatastrContact(policy)).toBe(false);
    }
  });
});
