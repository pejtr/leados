import { z } from "zod";

export const KATASTR_SOURCE_SYSTEM = "katastr-online" as const;
export const KATASTR_SCHEMA_VERSION = "1.0" as const;
export const KATASTR_API_BASE_PATH = "/api/integrations/katastr/v1";

const externalIdSchema = z.string().trim().min(1).max(191);
const idempotencyKeySchema = z.string().trim().min(8).max(191);
const correlationIdSchema = z.string().uuid();
const timestampSchema = z.string().datetime({ offset: true });

export const katastrRequestContextSchema = z
  .object({
    tenantId: z.string().trim().min(1).max(128),
    correlationId: correlationIdSchema,
    idempotencyKey: idempotencyKeySchema,
    schemaVersion: z
      .literal(KATASTR_SCHEMA_VERSION)
      .default(KATASTR_SCHEMA_VERSION),
  })
  .strict();

export const katastrLeadUpsertSchema = katastrRequestContextSchema
  .extend({
    externalPersonId: externalIdSchema,
    leadType: z.enum(["buyer", "seller"]),
    displayName: z.string().trim().min(1).max(256).optional(),
    email: z.string().trim().email().max(320).optional(),
    phone: z.string().trim().min(5).max(64).optional(),
    location: z.string().trim().max(256).optional(),
    demandId: externalIdSchema.optional(),
    sellerListingId: externalIdSchema.optional(),
    propertyId: externalIdSchema.optional(),
    consentStatus: z.enum(["unknown", "granted", "revoked"]).default("unknown"),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!value.email && !value.phone) {
      ctx.addIssue({
        code: "custom",
        message: "At least one contact field (email or phone) is required",
        path: ["email"],
      });
    }
  });

export const katastrMatchFactorsSchema = z
  .object({
    locality: z.number().min(0).max(100),
    budget: z.number().min(0).max(100),
    propertyParameters: z.number().min(0).max(100),
    timing: z.number().min(0).max(100),
    financing: z.number().min(0).max(100),
    investmentPreference: z.number().min(0).max(100),
  })
  .strict();

export const katastrMatchUpsertSchema = katastrRequestContextSchema
  .extend({
    matchId: externalIdSchema,
    buyerExternalPersonId: externalIdSchema,
    sellerExternalPersonId: externalIdSchema,
    propertyId: externalIdSchema,
    buyerDemandId: externalIdSchema,
    sellerListingId: externalIdSchema,
    score: z.number().min(0).max(100),
    factors: katastrMatchFactorsSchema,
    hardConstraints: z
      .record(z.string().min(1).max(64), z.boolean())
      .default({}),
    explanation: z.string().trim().min(1).max(4000),
    modelVersion: z.string().trim().min(1).max(64),
  })
  .strict();

export const katastrConsentEvidenceSchema = katastrRequestContextSchema
  .extend({
    externalConsentId: externalIdSchema,
    subjectType: z.enum(["buyer", "seller"]),
    subjectExternalPersonId: externalIdSchema,
    purpose: z.enum([
      "match_processing",
      "partner_handoff",
      "property_monitoring",
    ]),
    scopes: z.array(z.string().trim().min(1).max(128)).min(1).max(20),
    status: z.enum(["granted", "revoked"]),
    policyVersion: z.string().trim().min(1).max(64),
    captureMethod: z.enum(["web_form", "signed_document", "operator", "api"]),
    evidenceHash: z.string().regex(/^[a-f0-9]{64}$/i),
    occurredAt: timestampSchema,
    expiresAt: timestampSchema.optional(),
  })
  .strict();

export const katastrHandoffRequestSchema = katastrRequestContextSchema
  .extend({
    matchId: externalIdSchema,
    buyerConsentId: externalIdSchema,
    sellerConsentId: externalIdSchema,
    requestedPartnerId: z.number().int().positive().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();

export const integrationApprovalStatuses = [
  "pending",
  "approved",
  "rejected",
  "expired",
] as const;

export const partnerCaseStatuses = [
  "pending_approval",
  "approved",
  "rejected",
  "accepted",
  "contacted",
  "qualified",
  "viewing",
  "offer",
  "sold",
  "lost",
  "cancelled",
] as const;

export type IntegrationApprovalStatus =
  (typeof integrationApprovalStatuses)[number];
export type PartnerCaseStatus = (typeof partnerCaseStatuses)[number];

const partnerCaseTransitions: Record<PartnerCaseStatus, PartnerCaseStatus[]> = {
  pending_approval: ["approved", "rejected", "cancelled"],
  approved: ["accepted", "cancelled"],
  rejected: [],
  accepted: ["contacted", "cancelled"],
  contacted: ["qualified", "lost", "cancelled"],
  qualified: ["viewing", "offer", "lost", "cancelled"],
  viewing: ["offer", "lost", "cancelled"],
  offer: ["sold", "lost", "cancelled"],
  sold: [],
  lost: [],
  cancelled: [],
};

export function canTransitionPartnerCase(
  from: PartnerCaseStatus,
  to: PartnerCaseStatus
): boolean {
  return partnerCaseTransitions[from].includes(to);
}

export interface ContactReleasePolicyInput {
  buyerConsentGranted: boolean;
  sellerConsentGranted: boolean;
  approvalGranted: boolean;
  partnerVerified: boolean;
}

export function canReleaseKatastrContact(
  input: ContactReleasePolicyInput
): boolean {
  return (
    input.buyerConsentGranted &&
    input.sellerConsentGranted &&
    input.approvalGranted &&
    input.partnerVerified
  );
}

export type KatastrLeadUpsertInput = z.infer<typeof katastrLeadUpsertSchema>;
export type KatastrMatchUpsertInput = z.infer<typeof katastrMatchUpsertSchema>;
export type KatastrConsentEvidenceInput = z.infer<
  typeof katastrConsentEvidenceSchema
>;
export type KatastrHandoffRequestInput = z.infer<
  typeof katastrHandoffRequestSchema
>;
