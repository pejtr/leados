import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  type KatastrConsentEvidenceInput,
  type KatastrHandoffRequestInput,
  type KatastrLeadUpsertInput,
  type KatastrMatchUpsertInput,
  KATASTR_SOURCE_SYSTEM,
} from "../../shared/katastrIntegrationContracts";
import {
  consentEvidence,
  externalEntityLinks,
  integrationApprovals,
  matchCandidates,
  partnerCases,
} from "../../drizzle/schema/katastr-integration";
import { leads } from "../../drizzle/schema/leads";
import { insertAuditEvent } from "./audit";
import { getDb } from "./core";

export class KatastrIntegrationDatabaseError extends Error {
  constructor(message = "Katastr integration database is unavailable") {
    super(message);
    this.name = "KatastrIntegrationDatabaseError";
  }
}

export class KatastrIntegrationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KatastrIntegrationConflictError";
  }
}

function readInsertId(result: unknown): number {
  const candidate = Array.isArray(result) ? result[0] : result;
  const insertId = Number(
    (candidate as { insertId?: number | bigint } | undefined)?.insertId ?? 0
  );
  if (!Number.isInteger(insertId) || insertId <= 0) {
    throw new KatastrIntegrationDatabaseError(
      "Database did not return a valid insert id"
    );
  }
  return insertId;
}

function parseTimestamp(value: string | undefined): number | null {
  if (!value) return null;
  return new Date(value).getTime();
}

export async function upsertKatastrLead(
  userId: number,
  input: KatastrLeadUpsertInput
): Promise<{ leadId: number; created: boolean }> {
  const db = await getDb();
  if (!db) throw new KatastrIntegrationDatabaseError();

  const result = await db.transaction(async tx => {
    const [existingLink] = await tx
      .select()
      .from(externalEntityLinks)
      .where(
        and(
          eq(externalEntityLinks.userId, userId),
          eq(externalEntityLinks.sourceSystem, KATASTR_SOURCE_SYSTEM),
          eq(externalEntityLinks.externalEntityType, "person"),
          eq(externalEntityLinks.externalEntityId, input.externalPersonId)
        )
      )
      .limit(1);

    const metadata = {
      leadType: input.leadType,
      phone: input.phone,
      demandId: input.demandId,
      sellerListingId: input.sellerListingId,
      propertyId: input.propertyId,
      consentStatus: input.consentStatus,
      lastCorrelationId: input.correlationId,
      lastIdempotencyKey: input.idempotencyKey,
    };

    if (existingLink) {
      const updateData: Partial<typeof leads.$inferInsert> = {
        contactName: input.displayName,
        location: input.location,
        segment: `katastr_${input.leadType}`,
      };
      if (input.email !== undefined) updateData.email = input.email;

      await tx
        .update(leads)
        .set(updateData)
        .where(
          and(
            eq(leads.id, existingLink.internalEntityId),
            eq(leads.userId, userId)
          )
        );
      await tx
        .update(externalEntityLinks)
        .set({
          externalTenantId: input.tenantId,
          metadata,
          updatedAt: Date.now(),
        })
        .where(eq(externalEntityLinks.id, existingLink.id));

      return { leadId: existingLink.internalEntityId, created: false };
    }

    const leadInsert = await tx.insert(leads).values({
      sessionId: 0,
      userId,
      companyName:
        input.displayName ??
        (input.leadType === "buyer"
          ? "Katastr Online buyer"
          : "Katastr Online seller"),
      email: input.email,
      industry: "Real Estate",
      location: input.location,
      contactName: input.displayName,
      dataSource: "katastr_online",
      status: "new",
      currency: "CZK",
      segment: `katastr_${input.leadType}`,
    });
    const leadId = readInsertId(leadInsert);

    await tx.insert(externalEntityLinks).values({
      userId,
      externalTenantId: input.tenantId,
      sourceSystem: KATASTR_SOURCE_SYSTEM,
      externalEntityType: "person",
      externalEntityId: input.externalPersonId,
      internalEntityType: "lead",
      internalEntityId: leadId,
      metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { leadId, created: true };
  });

  await insertAuditEvent({
    userId,
    eventType: result.created ? "katastr.lead.created" : "katastr.lead.updated",
    resourceType: "lead",
    resourceId: result.leadId,
    metadata: {
      sourceSystem: KATASTR_SOURCE_SYSTEM,
      externalPersonId: input.externalPersonId,
      correlationId: input.correlationId,
    },
  });

  return result;
}

export async function upsertKatastrMatch(
  userId: number,
  input: KatastrMatchUpsertInput
): Promise<{ matchCandidateId: number; created: boolean }> {
  const db = await getDb();
  if (!db) throw new KatastrIntegrationDatabaseError();

  const [idempotentMatch] = await db
    .select()
    .from(matchCandidates)
    .where(
      and(
        eq(matchCandidates.userId, userId),
        eq(matchCandidates.idempotencyKey, input.idempotencyKey)
      )
    )
    .limit(1);
  if (idempotentMatch) {
    if (idempotentMatch.externalMatchId !== input.matchId) {
      throw new KatastrIntegrationConflictError(
        "Idempotency key was already used for a different match"
      );
    }
    return { matchCandidateId: idempotentMatch.id, created: false };
  }

  const [existingMatch] = await db
    .select()
    .from(matchCandidates)
    .where(
      and(
        eq(matchCandidates.userId, userId),
        eq(matchCandidates.sourceSystem, KATASTR_SOURCE_SYSTEM),
        eq(matchCandidates.externalMatchId, input.matchId)
      )
    )
    .limit(1);

  if (existingMatch) {
    await db
      .update(matchCandidates)
      .set({
        score: input.score.toFixed(2),
        factors: input.factors,
        hardConstraints: input.hardConstraints,
        explanation: input.explanation,
        modelVersion: input.modelVersion,
        idempotencyKey: input.idempotencyKey,
        updatedAt: Date.now(),
      })
      .where(eq(matchCandidates.id, existingMatch.id));
    return { matchCandidateId: existingMatch.id, created: false };
  }

  const insertResult = await db.insert(matchCandidates).values({
    userId,
    externalTenantId: input.tenantId,
    sourceSystem: KATASTR_SOURCE_SYSTEM,
    externalMatchId: input.matchId,
    buyerExternalPersonId: input.buyerExternalPersonId,
    sellerExternalPersonId: input.sellerExternalPersonId,
    propertyExternalId: input.propertyId,
    buyerDemandId: input.buyerDemandId,
    sellerListingId: input.sellerListingId,
    score: input.score.toFixed(2),
    factors: input.factors,
    hardConstraints: input.hardConstraints,
    explanation: input.explanation,
    modelVersion: input.modelVersion,
    status: "candidate",
    contactReleaseAllowed: false,
    idempotencyKey: input.idempotencyKey,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  const matchCandidateId = readInsertId(insertResult);

  await insertAuditEvent({
    userId,
    eventType: "katastr.match.created",
    resourceType: "match_candidate",
    resourceId: matchCandidateId,
    metadata: {
      sourceSystem: KATASTR_SOURCE_SYSTEM,
      externalMatchId: input.matchId,
      score: input.score,
      modelVersion: input.modelVersion,
      correlationId: input.correlationId,
    },
  });

  return { matchCandidateId, created: true };
}

export async function appendKatastrConsent(
  userId: number,
  input: KatastrConsentEvidenceInput
): Promise<{ consentEvidenceId: number; created: boolean }> {
  const db = await getDb();
  if (!db) throw new KatastrIntegrationDatabaseError();

  const existing = await db
    .select()
    .from(consentEvidence)
    .where(
      and(
        eq(consentEvidence.userId, userId),
        eq(consentEvidence.sourceSystem, KATASTR_SOURCE_SYSTEM),
        eq(consentEvidence.externalConsentId, input.externalConsentId)
      )
    )
    .limit(1);
  if (existing[0]) {
    return { consentEvidenceId: existing[0].id, created: false };
  }

  const idempotent = await db
    .select()
    .from(consentEvidence)
    .where(
      and(
        eq(consentEvidence.userId, userId),
        eq(consentEvidence.idempotencyKey, input.idempotencyKey)
      )
    )
    .limit(1);
  if (idempotent[0]) {
    throw new KatastrIntegrationConflictError(
      "Idempotency key was already used for different consent evidence"
    );
  }

  const insertResult = await db.insert(consentEvidence).values({
    userId,
    externalTenantId: input.tenantId,
    sourceSystem: KATASTR_SOURCE_SYSTEM,
    externalConsentId: input.externalConsentId,
    subjectType: input.subjectType,
    subjectExternalPersonId: input.subjectExternalPersonId,
    purpose: input.purpose,
    scopes: input.scopes,
    status: input.status,
    policyVersion: input.policyVersion,
    captureMethod: input.captureMethod,
    evidenceHash: input.evidenceHash.toLowerCase(),
    occurredAt: parseTimestamp(input.occurredAt) ?? Date.now(),
    expiresAt: parseTimestamp(input.expiresAt),
    idempotencyKey: input.idempotencyKey,
    createdAt: Date.now(),
  });
  const consentEvidenceId = readInsertId(insertResult);

  await insertAuditEvent({
    userId,
    eventType:
      input.status === "granted"
        ? "katastr.consent.granted"
        : "katastr.consent.revoked",
    resourceType: "consent_evidence",
    resourceId: consentEvidenceId,
    metadata: {
      externalConsentId: input.externalConsentId,
      subjectType: input.subjectType,
      purpose: input.purpose,
      policyVersion: input.policyVersion,
      correlationId: input.correlationId,
    },
  });

  return { consentEvidenceId, created: true };
}

function isActivePartnerHandoffConsent(
  consent: typeof consentEvidence.$inferSelect | undefined,
  subjectType: "buyer" | "seller",
  subjectExternalPersonId: string
): boolean {
  const now = Date.now();
  return Boolean(
    consent &&
      consent.subjectType === subjectType &&
      consent.subjectExternalPersonId === subjectExternalPersonId &&
      consent.purpose === "partner_handoff" &&
      consent.status === "granted" &&
      (!consent.expiresAt || consent.expiresAt > now)
  );
}

export async function createKatastrHandoffRequest(
  userId: number,
  input: KatastrHandoffRequestInput
): Promise<{
  approvalId: string;
  partnerCaseId: string;
  status: "pending";
  created: boolean;
}> {
  const db = await getDb();
  if (!db) throw new KatastrIntegrationDatabaseError();

  const [existingCase] = await db
    .select()
    .from(partnerCases)
    .where(
      and(
        eq(partnerCases.userId, userId),
        eq(partnerCases.idempotencyKey, input.idempotencyKey)
      )
    )
    .limit(1);
  if (existingCase) {
    const [approval] = await db
      .select()
      .from(integrationApprovals)
      .where(eq(integrationApprovals.id, existingCase.approvalId))
      .limit(1);
    if (!approval) {
      throw new KatastrIntegrationDatabaseError(
        "Existing partner case has no approval record"
      );
    }
    return {
      approvalId: approval.approvalId,
      partnerCaseId: existingCase.externalCaseId,
      status: "pending",
      created: false,
    };
  }

  const [match, buyerConsent, sellerConsent] = await Promise.all([
    db
      .select()
      .from(matchCandidates)
      .where(
        and(
          eq(matchCandidates.userId, userId),
          eq(matchCandidates.sourceSystem, KATASTR_SOURCE_SYSTEM),
          eq(matchCandidates.externalMatchId, input.matchId)
        )
      )
      .limit(1)
      .then(rows => rows[0]),
    db
      .select()
      .from(consentEvidence)
      .where(
        and(
          eq(consentEvidence.userId, userId),
          eq(consentEvidence.sourceSystem, KATASTR_SOURCE_SYSTEM),
          eq(consentEvidence.externalConsentId, input.buyerConsentId)
        )
      )
      .limit(1)
      .then(rows => rows[0]),
    db
      .select()
      .from(consentEvidence)
      .where(
        and(
          eq(consentEvidence.userId, userId),
          eq(consentEvidence.sourceSystem, KATASTR_SOURCE_SYSTEM),
          eq(consentEvidence.externalConsentId, input.sellerConsentId)
        )
      )
      .limit(1)
      .then(rows => rows[0]),
  ]);

  if (!match) {
    throw new KatastrIntegrationConflictError("Match candidate was not found");
  }
  if (
    !isActivePartnerHandoffConsent(
      buyerConsent,
      "buyer",
      match.buyerExternalPersonId
    )
  ) {
    throw new KatastrIntegrationConflictError(
      "A valid buyer partner-handoff consent is required"
    );
  }
  if (
    !isActivePartnerHandoffConsent(
      sellerConsent,
      "seller",
      match.sellerExternalPersonId
    )
  ) {
    throw new KatastrIntegrationConflictError(
      "A valid seller partner-handoff consent is required"
    );
  }

  const approvalId = randomUUID();
  const partnerCaseId = randomUUID();

  await db.transaction(async tx => {
    const approvalInsert = await tx.insert(integrationApprovals).values({
      userId,
      approvalId,
      approvalType: "partner_handoff",
      resourceType: "match_candidate",
      resourceExternalId: input.matchId,
      status: "pending",
      requestedBy: KATASTR_SOURCE_SYSTEM,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const internalApprovalId = readInsertId(approvalInsert);

    await tx.insert(partnerCases).values({
      userId,
      externalCaseId: partnerCaseId,
      matchCandidateId: match.id,
      approvalId: internalApprovalId,
      partnerId: input.requestedPartnerId,
      status: "pending_approval",
      idempotencyKey: input.idempotencyKey,
      notes: input.notes,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await tx
      .update(matchCandidates)
      .set({ status: "submitted", updatedAt: Date.now() })
      .where(eq(matchCandidates.id, match.id));
  });

  await insertAuditEvent({
    userId,
    eventType: "katastr.handoff.requested",
    resourceType: "match_candidate",
    resourceId: match.id,
    metadata: {
      externalMatchId: input.matchId,
      approvalId,
      partnerCaseId,
      requestedPartnerId: input.requestedPartnerId,
      correlationId: input.correlationId,
      contactReleased: false,
    },
  });

  return { approvalId, partnerCaseId, status: "pending", created: true };
}

export async function getKatastrApproval(
  userId: number,
  approvalId: string
): Promise<{
  approvalId: string;
  status: string;
  resourceType: string;
  resourceExternalId: string;
  decidedAt: number | null;
} | null> {
  const db = await getDb();
  if (!db) throw new KatastrIntegrationDatabaseError();

  const [approval] = await db
    .select()
    .from(integrationApprovals)
    .where(
      and(
        eq(integrationApprovals.userId, userId),
        eq(integrationApprovals.approvalId, approvalId)
      )
    )
    .limit(1);
  if (!approval) return null;

  return {
    approvalId: approval.approvalId,
    status: approval.status,
    resourceType: approval.resourceType,
    resourceExternalId: approval.resourceExternalId,
    decidedAt: approval.decidedAt,
  };
}
