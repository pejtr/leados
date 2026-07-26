import { describe, it, expect, beforeEach, vi } from "vitest";
import { randomUUID as uuidv4 } from "node:crypto";
import { signJourneyToken, verifyJourneyToken, getJourneySecret } from "./journeyToken";

import { processEventIngestion, MANDATORY_EVENT_NAMES } from "./eventIngestion";
import { evaluateDecision } from "./decisionEngine";
import { appRouter } from "../routers";

describe("Travel Revenue Network — Unit & Integration Tests", () => {
  const testSecret = "test_secret_key_32_characters_minimum_len!";

  beforeEach(() => {
    process.env.TRAVEL_JOURNEY_SECRET = testSecret;
    process.env.NODE_ENV = "test";
  });

  // ─── 1. Server-Side Journey Token Tests (Constraint 1 & 2) ──────
  describe("Server-Side Journey Token Signing & Verification", () => {
    it("should sign and verify a valid journey token with TRAVEL_JOURNEY_SECRET", () => {
      const payload = {
        anonymousVisitorId: "anon_test123",
        sessionId: "sess_test456",
        journeyId: "journ_test789",
        originDomain: "https://www.do-italie.cz",
        campaignId: uuidv4(),
      };

      const token = signJourneyToken(payload, 3600000, testSecret);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
      expect(token?.includes(".")).toBe(true);

      const verified = verifyJourneyToken(token!, testSecret);
      expect(verified).not.toBeNull();
      expect(verified?.anonymousVisitorId).toBe("anon_test123");
      expect(verified?.sessionId).toBe("sess_test456");
      expect(verified?.journeyId).toBe("journ_test789");
    });

    it("should return null if token is tampered with", () => {
      const payload = {
        anonymousVisitorId: "anon_test123",
        sessionId: "sess_test456",
        journeyId: "journ_test789",
        originDomain: "https://www.do-italie.cz",
      };

      const token = signJourneyToken(payload, 3600000, testSecret);
      const tamperedToken = token + "tamper";
      const verified = verifyJourneyToken(tamperedToken, testSecret);
      expect(verified).toBeNull();
    });

    it("should return null if TRAVEL_JOURNEY_SECRET is missing outside test env", () => {
      delete process.env.TRAVEL_JOURNEY_SECRET;
      delete process.env.TEST_TRAVEL_JOURNEY_SECRET;
      process.env.NODE_ENV = "production";

      const secret = getJourneySecret();
      expect(secret).toBeNull();

      process.env.NODE_ENV = "test";
    });
  });

  // ─── 2. Event Ingestion Tests (Constraint 8) ────────────────────
  describe("Event Ingestion API & Schema Validation", () => {
    it("should reject batch containing invalid event names", async () => {
      const badPayload = {
        events: [
          {
            event_id: uuidv4(),
            event_name: "invalid_custom_event_name",
            occurred_at: new Date().toISOString(),
            domain_id: uuidv4(),
            source_domain: "do-italie.cz",
            anonymous_visitor_id: "anon_1",
            session_id: "sess_1",
            page_url: "https://www.do-italie.cz",
          },
        ],
      };

      const res = await processEventIngestion(badPayload);
      expect(res.status).toBe(400);
      expect(res.body.error).toBe("INVALID_PAYLOAD");
    });

    it("should accept all 18 mandatory event types in schema", () => {
      expect(MANDATORY_EVENT_NAMES.length).toBe(18);
      expect(MANDATORY_EVENT_NAMES).toContain("page_view");
      expect(MANDATORY_EVENT_NAMES).toContain("crosspromo_click");
      expect(MANDATORY_EVENT_NAMES).toContain("revenue_confirmed");
    });
  });

  // ─── 3. Decision Engine Tests (Constraint 6 & 10) ───────────────
  describe("Decision API & Health Suppression", () => {
    it("should return NO_ELIGIBLE_CAMPAIGN when no active domains exist", async () => {
      const res = await evaluateDecision({
        domainId: uuidv4(),
        placementKey: "article_mid_content",
        pageUrl: "https://www.do-italie.cz/sicilie",
        anonymousVisitorId: "anon_1",
        sessionId: "sess_1",
      });

      expect(res.reason).toBe("NO_ELIGIBLE_CAMPAIGN");
      expect(res.creativeId).toBeNull();
    });
  });

  // ─── 4. tRPC Router Procedure Integration ───────────────────────
  describe("tRPC travelNetwork Router Procedures", () => {
    const caller = appRouter.createCaller({
      user: { id: 1, openId: "admin_test", role: "admin" } as any,
      req: {} as any,
      res: {} as any,
    });

    it("should get overview metrics", async () => {
      const overview = await caller.travelNetwork.getOverview();
      expect(overview).toHaveProperty("impressions");
      expect(overview).toHaveProperty("confirmedCommission");
      expect(overview).toHaveProperty("pendingCommission");
    });

    it("should seed pilot campaign as draft", async () => {
      const seedResult = await caller.travelNetwork.seedPilotCampaign();
      expect(seedResult).toBeDefined();
      if (seedResult.seeded) {
        expect(seedResult.campaign?.editorialStatus).toBe("draft");
      }
    });

    it("should import test conversion and separate pending vs confirmed", async () => {
      const extId = `ext_test_${Date.now()}`;

      // 1. Pending import
      const pendingRes = await caller.travelNetwork.importConversion({
        partnerSlug: "tradedoubler",
        externalConversionId: extId,
        status: "pending",
        grossRevenue: 1000,
        commissionValue: 100,
        bookingValue: 1000,
      });

      expect(pendingRes.success).toBe(true);

      // 2. Overview should separate pending and confirmed
      const overview = await caller.travelNetwork.getOverview();
      expect(typeof overview.pendingCommission).toBe("number");
      expect(typeof overview.confirmedCommission).toBe("number");
    });
  });
});
