import { insertProvenance, insertAttribution } from "./db/source-data-harmonizer";

export interface IncomingRecord {
  sourceId: string;
  providerName: string;
  sourceType: string;
  collectedBy: string;
  ingestionMethod: string;
  rawReference?: string;
  normalizedReference?: string;
  licenseStatus?: string;
  redistributionAllowed?: boolean;
  confidenceScore?: number;
  userId: number;
}

export interface AttributionInput {
  provenanceId: number;
  entityType: string;
  entityId: number;
  attributionValue?: string;
  attributedBy?: number;
  note?: string;
  userId: number;
}

export async function harmonizeRecord(record: IncomingRecord) {
  const id = await insertProvenance({
    sourceId: record.sourceId,
    providerName: record.providerName,
    sourceType: record.sourceType,
    collectedAt: new Date(),
    collectedBy: record.collectedBy,
    ingestionMethod: record.ingestionMethod,
    rawReference: record.rawReference ?? null,
    normalizedReference: record.normalizedReference ?? null,
    licenseStatus: record.licenseStatus ?? "unknown",
    redistributionAllowed: record.redistributionAllowed ?? false,
    confidenceScore: String(record.confidenceScore ?? 0),
    clientVisibleStatus: false,
    internalOnlyStatus: true,
    userId: record.userId,
  });
  return id;
}

export async function recordAttribution(input: AttributionInput) {
  const id = await insertAttribution({
    provenanceId: input.provenanceId,
    entityType: input.entityType,
    entityId: input.entityId,
    attributionValue: input.attributionValue ?? null,
    attributedBy: input.attributedBy ?? null,
    note: input.note ?? null,
    userId: input.userId,
  });
  return id;
}

export function calculateConfidence(
  method: string,
  sourceAgeDays: number,
  verificationCount: number
): number {
  let base = 0.5;
  if (method === "api") base = 0.8;
  else if (method === "webhook") base = 0.85;
  else if (method === "manual") base = 0.9;
  else if (method === "scrape") base = 0.4;
  const agePenalty = Math.min(0.3, sourceAgeDays * 0.005);
  const verificationBonus = Math.min(0.15, verificationCount * 0.05);
  return Math.round((base - agePenalty + verificationBonus) * 100) / 100;
}
