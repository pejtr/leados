import {
  bigint,
  boolean,
  decimal,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const externalEntityLinks = mysqlTable(
  "external_entity_links",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    externalTenantId: varchar("external_tenant_id", { length: 128 }).notNull(),
    sourceSystem: varchar("source_system", { length: 64 }).notNull(),
    externalEntityType: varchar("external_entity_type", {
      length: 64,
    }).notNull(),
    externalEntityId: varchar("external_entity_id", { length: 191 }).notNull(),
    internalEntityType: varchar("internal_entity_type", {
      length: 64,
    }).notNull(),
    internalEntityId: int("internal_entity_id").notNull(),
    metadata: json("metadata").$type<Record<string, unknown>>(),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    externalEntityUnique: uniqueIndex("external_entity_unique").on(
      table.userId,
      table.sourceSystem,
      table.externalEntityType,
      table.externalEntityId
    ),
    internalEntityIdx: index("external_entity_internal_idx").on(
      table.userId,
      table.internalEntityType,
      table.internalEntityId
    ),
  })
);

export const consentEvidence = mysqlTable(
  "consent_evidence",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    externalTenantId: varchar("external_tenant_id", { length: 128 }).notNull(),
    sourceSystem: varchar("source_system", { length: 64 }).notNull(),
    externalConsentId: varchar("external_consent_id", {
      length: 191,
    }).notNull(),
    subjectType: mysqlEnum("subject_type", ["buyer", "seller"]).notNull(),
    subjectExternalPersonId: varchar("subject_external_person_id", {
      length: 191,
    }).notNull(),
    purpose: mysqlEnum("purpose", [
      "match_processing",
      "partner_handoff",
      "property_monitoring",
    ]).notNull(),
    scopes: json("scopes").$type<string[]>().notNull(),
    status: mysqlEnum("status", ["granted", "revoked"]).notNull(),
    policyVersion: varchar("policy_version", { length: 64 }).notNull(),
    captureMethod: mysqlEnum("capture_method", [
      "web_form",
      "signed_document",
      "operator",
      "api",
    ]).notNull(),
    evidenceHash: varchar("evidence_hash", { length: 64 }).notNull(),
    occurredAt: bigint("occurred_at", { mode: "number" }).notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }),
    idempotencyKey: varchar("idempotency_key", { length: 191 }).notNull(),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    externalConsentUnique: uniqueIndex("consent_external_unique").on(
      table.userId,
      table.sourceSystem,
      table.externalConsentId
    ),
    consentIdempotencyUnique: uniqueIndex("consent_idempotency_unique").on(
      table.userId,
      table.idempotencyKey
    ),
    consentSubjectIdx: index("consent_subject_idx").on(
      table.userId,
      table.subjectExternalPersonId,
      table.purpose
    ),
  })
);

export const matchCandidates = mysqlTable(
  "match_candidates",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    externalTenantId: varchar("external_tenant_id", { length: 128 }).notNull(),
    sourceSystem: varchar("source_system", { length: 64 }).notNull(),
    externalMatchId: varchar("external_match_id", { length: 191 }).notNull(),
    buyerExternalPersonId: varchar("buyer_external_person_id", {
      length: 191,
    }).notNull(),
    sellerExternalPersonId: varchar("seller_external_person_id", {
      length: 191,
    }).notNull(),
    propertyExternalId: varchar("property_external_id", {
      length: 191,
    }).notNull(),
    buyerDemandId: varchar("buyer_demand_id", { length: 191 }).notNull(),
    sellerListingId: varchar("seller_listing_id", { length: 191 }).notNull(),
    score: decimal("score", { precision: 5, scale: 2 }).notNull(),
    factors: json("factors").$type<Record<string, number>>().notNull(),
    hardConstraints: json("hard_constraints")
      .$type<Record<string, boolean>>()
      .notNull(),
    explanation: text("explanation").notNull(),
    modelVersion: varchar("model_version", { length: 64 }).notNull(),
    status: mysqlEnum("status", [
      "candidate",
      "consented",
      "submitted",
      "approved",
      "rejected",
      "expired",
    ])
      .default("candidate")
      .notNull(),
    contactReleaseAllowed: boolean("contact_release_allowed")
      .default(false)
      .notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 191 }).notNull(),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    externalMatchUnique: uniqueIndex("match_external_unique").on(
      table.userId,
      table.sourceSystem,
      table.externalMatchId
    ),
    matchIdempotencyUnique: uniqueIndex("match_idempotency_unique").on(
      table.userId,
      table.idempotencyKey
    ),
    matchBuyerIdx: index("match_buyer_idx").on(
      table.userId,
      table.buyerExternalPersonId
    ),
    matchSellerIdx: index("match_seller_idx").on(
      table.userId,
      table.sellerExternalPersonId
    ),
  })
);

export const integrationApprovals = mysqlTable(
  "integration_approvals",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    approvalId: varchar("approval_id", { length: 64 }).notNull(),
    approvalType: varchar("approval_type", { length: 64 }).notNull(),
    resourceType: varchar("resource_type", { length: 64 }).notNull(),
    resourceExternalId: varchar("resource_external_id", {
      length: 191,
    }).notNull(),
    status: mysqlEnum("status", ["pending", "approved", "rejected", "expired"])
      .default("pending")
      .notNull(),
    requestedBy: varchar("requested_by", { length: 128 }).notNull(),
    decidedByUserId: int("decided_by_user_id"),
    decisionReason: text("decision_reason"),
    expiresAt: bigint("expires_at", { mode: "number" }),
    decidedAt: bigint("decided_at", { mode: "number" }),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    approvalUnique: uniqueIndex("integration_approval_unique").on(
      table.userId,
      table.approvalId
    ),
    approvalQueueIdx: index("integration_approval_queue_idx").on(
      table.userId,
      table.status,
      table.createdAt
    ),
  })
);

export const realEstatePartners = mysqlTable(
  "real_estate_partners",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    externalPartnerId: varchar("external_partner_id", { length: 191 }),
    companyName: varchar("company_name", { length: 256 }).notNull(),
    contactName: varchar("contact_name", { length: 256 }),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 64 }),
    regions: json("regions").$type<string[]>().notNull(),
    specializations: json("specializations").$type<string[]>().notNull(),
    verificationStatus: mysqlEnum("verification_status", [
      "pending",
      "verified",
      "suspended",
    ])
      .default("pending")
      .notNull(),
    contractValidUntil: bigint("contract_valid_until", { mode: "number" }),
    licenseReference: varchar("license_reference", { length: 256 }),
    insuranceValidUntil: bigint("insurance_valid_until", { mode: "number" }),
    slaHours: int("sla_hours").default(24).notNull(),
    commissionModel: json("commission_model").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").default(false).notNull(),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    partnerExternalUnique: uniqueIndex(
      "real_estate_partner_external_unique"
    ).on(table.userId, table.externalPartnerId),
    partnerStatusIdx: index("real_estate_partner_status_idx").on(
      table.userId,
      table.verificationStatus,
      table.isActive
    ),
  })
);

export const partnerCases = mysqlTable(
  "partner_cases",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    externalCaseId: varchar("external_case_id", { length: 64 }).notNull(),
    matchCandidateId: int("match_candidate_id").notNull(),
    approvalId: int("approval_id").notNull(),
    partnerId: int("partner_id"),
    onyxLeadId: int("onyx_lead_id"),
    onyxDealId: int("onyx_deal_id"),
    status: mysqlEnum("status", [
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
    ])
      .default("pending_approval")
      .notNull(),
    contactReleasedAt: bigint("contact_released_at", { mode: "number" }),
    idempotencyKey: varchar("idempotency_key", { length: 191 }).notNull(),
    notes: text("notes"),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: bigint("updated_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  table => ({
    partnerCaseUnique: uniqueIndex("partner_case_external_unique").on(
      table.userId,
      table.externalCaseId
    ),
    partnerCaseIdempotencyUnique: uniqueIndex(
      "partner_case_idempotency_unique"
    ).on(table.userId, table.idempotencyKey),
    partnerCaseQueueIdx: index("partner_case_queue_idx").on(
      table.userId,
      table.status,
      table.createdAt
    ),
  })
);

export const integrationInbox = mysqlTable(
  "integration_inbox",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    eventId: varchar("event_id", { length: 64 }).notNull(),
    sourceSystem: varchar("source_system", { length: 64 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
    correlationId: varchar("correlation_id", { length: 64 }).notNull(),
    payloadHash: varchar("payload_hash", { length: 64 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum("status", ["received", "processed", "failed"])
      .default("received")
      .notNull(),
    error: text("error"),
    receivedAt: bigint("received_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    processedAt: bigint("processed_at", { mode: "number" }),
  },
  table => ({
    inboxEventUnique: uniqueIndex("integration_inbox_event_unique").on(
      table.userId,
      table.sourceSystem,
      table.eventId
    ),
    inboxStatusIdx: index("integration_inbox_status_idx").on(
      table.status,
      table.receivedAt
    ),
  })
);

export const integrationOutbox = mysqlTable(
  "integration_outbox",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("user_id").notNull(),
    eventId: varchar("event_id", { length: 64 }).notNull(),
    destinationSystem: varchar("destination_system", { length: 64 }).notNull(),
    eventType: varchar("event_type", { length: 128 }).notNull(),
    schemaVersion: varchar("schema_version", { length: 32 }).notNull(),
    correlationId: varchar("correlation_id", { length: 64 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    status: mysqlEnum("status", [
      "pending",
      "delivered",
      "failed",
      "dead_letter",
    ])
      .default("pending")
      .notNull(),
    attempt: int("attempt").default(0).notNull(),
    nextAttemptAt: bigint("next_attempt_at", { mode: "number" }),
    lastError: text("last_error"),
    createdAt: bigint("created_at", { mode: "number" })
      .notNull()
      .$defaultFn(() => Date.now()),
    deliveredAt: bigint("delivered_at", { mode: "number" }),
  },
  table => ({
    outboxEventUnique: uniqueIndex("integration_outbox_event_unique").on(
      table.userId,
      table.destinationSystem,
      table.eventId
    ),
    outboxDeliveryIdx: index("integration_outbox_delivery_idx").on(
      table.status,
      table.nextAttemptAt
    ),
  })
);

export type ExternalEntityLink = typeof externalEntityLinks.$inferSelect;
export type ConsentEvidence = typeof consentEvidence.$inferSelect;
export type MatchCandidate = typeof matchCandidates.$inferSelect;
export type IntegrationApproval = typeof integrationApprovals.$inferSelect;
export type RealEstatePartner = typeof realEstatePartners.$inferSelect;
export type PartnerCase = typeof partnerCases.$inferSelect;
export type IntegrationInboxEvent = typeof integrationInbox.$inferSelect;
export type IntegrationOutboxEvent = typeof integrationOutbox.$inferSelect;
