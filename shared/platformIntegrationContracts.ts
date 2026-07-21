export type PlatformId =
  | "onyx"
  | "omnivideo"
  | "optimateo"
  | "forge"
  | "youtube"
  | "patreon";

export type PlatformIntegrationTransport =
  | "local_route"
  | "mcp_tool"
  | "domain_event";

export type PlatformIntegrationState =
  | "available"
  | "contract_ready"
  | "blocked";

export interface PlatformIntegrationPoint {
  id: string;
  platform: PlatformId;
  label: string;
  description: string;
  transport: PlatformIntegrationTransport;
  state: PlatformIntegrationState;
  route?: string;
  toolName?: string;
  eventName?: string;
  requiredInputs: string[];
  outputs: string[];
  ownerBoundary: string;
}

const callsModule: PlatformIntegrationPoint = {
  id: "onyx-call-intelligence",
  platform: "onyx",
  label: "Hlasový modul",
  description: "Upload, přepis, AI analýza, sentiment a CRM návaznost.",
  transport: "local_route",
  state: "available",
  route: "/calls",
  requiredInputs: ["audio file", "optional leadId"],
  outputs: ["transcription", "sentiment", "actionItems", "crmNote"],
  ownerBoundary: "ONYX ukládá call intelligence a CRM výsledek.",
};

const socialModule: PlatformIntegrationPoint = {
  id: "onyx-social-listening",
  platform: "onyx",
  label: "Social listening",
  description:
    "Monitoring signálů, sentiment a převod ověřeného signálu na lead.",
  transport: "local_route",
  state: "available",
  route: "/social",
  requiredInputs: ["keywords", "platforms"],
  outputs: ["signals", "sentiment", "lead candidate"],
  ownerBoundary: "ONYX vlastní monitoring, schválení a CRM návaznost.",
};

const projectsModule: PlatformIntegrationPoint = {
  id: "onyx-project-ledger",
  platform: "onyx",
  label: "Projekt a revenue ledger",
  description: "Projektové ID, revenue eventy, náklady a atribuce výsledku.",
  transport: "local_route",
  state: "available",
  route: "/projects",
  requiredInputs: ["projectId", "eventType", "amount"],
  outputs: ["project event", "revenue attribution"],
  ownerBoundary: "ONYX vlastní orchestraci, schválení a revenue evidenci.",
};

const affiliateModule: PlatformIntegrationPoint = {
  id: "onyx-affiliate",
  platform: "onyx",
  label: "Affiliate modul",
  description: "Referral odkazy, konverze, provize a affiliate revenue.",
  transport: "local_route",
  state: "available",
  route: "/affiliate",
  requiredInputs: ["affiliateId", "campaignId"],
  outputs: ["click", "conversion", "commission", "revenue"],
  ownerBoundary: "ONYX vlastní affiliate atribuci a revenue reporting.",
};

const omniAssetPack: PlatformIntegrationPoint = {
  id: "omnivideo-asset-pack",
  platform: "omnivideo",
  label: "OMNIVIDEO asset balíček",
  description: "Vygeneruje verzované obrazové assety a formátové varianty.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "omnivideo.asset_pack.create",
  requiredInputs: [
    "projectId",
    "brandBrief",
    "formats",
    "style",
    "idempotencyKey",
  ],
  outputs: ["jobId", "assetIds", "previewUrls", "status"],
  ownerBoundary: "OMNIVIDEO vlastní generování, verze a zdrojové assety.",
};

const omniVideoWorkflow: PlatformIntegrationPoint = {
  id: "omnivideo-content-workflow",
  platform: "omnivideo",
  label: "OMNIVIDEO produkční workflow",
  description:
    "Projekt, generování, render, kontrola a final-ready stav videa.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "omnivideo.project.create",
  requiredInputs: [
    "externalProjectId",
    "creativeBrief",
    "sourceAssets",
    "idempotencyKey",
  ],
  outputs: ["projectId", "jobId", "status", "assetIds"],
  ownerBoundary: "OMNIVIDEO vlastní vše před final video readiness.",
};

const finalVideoReadyEvent: PlatformIntegrationPoint = {
  id: "forge-final-video-ready",
  platform: "forge",
  label: "FinalVideoReady → FORGE",
  description: "Předá neměnný finální render do publikace a monetizace.",
  transport: "domain_event",
  state: "contract_ready",
  eventName: "FinalVideoReady.v1",
  requiredInputs: [
    "eventId",
    "videoId",
    "renderId",
    "assetUrl",
    "checksum",
    "rights",
  ],
  outputs: ["publicationMediaId", "acceptedAt"],
  ownerBoundary:
    "FORGE vlastní publikaci, scheduling, OAuth, analytics a revenue po readiness.",
};

const optimateoReception: PlatformIntegrationPoint = {
  id: "optimateo-reception",
  platform: "optimateo",
  label: "OPTIMATEO recepce a rezervace",
  description:
    "Nasadí webový/voice entrypoint, consent, handoff a booking pravidla.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "optimateo.reception.configure",
  requiredInputs: [
    "siteId",
    "businessProfile",
    "qualificationRules",
    "handoffRules",
    "consentPolicy",
  ],
  outputs: ["assistantId", "deploymentStatus", "leadWebhook"],
  ownerBoundary:
    "OPTIMATEO vlastní zákaznický webový vstup; ONYX CRM data a schválení.",
};

const optimateoChatbot: PlatformIntegrationPoint = {
  id: "optimateo-chatbot",
  platform: "optimateo",
  label: "OPTIMATEO web chatbot",
  description: "Nasadí chatbot widget, znalosti, kvalifikaci a lead handoff.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "optimateo.chatbot.deploy",
  requiredInputs: [
    "siteId",
    "knowledgeBaseId",
    "goal",
    "handoffRules",
    "consentPolicy",
    "idempotencyKey",
  ],
  outputs: ["deploymentId", "widgetUrl", "leadWebhook", "status"],
  ownerBoundary:
    "OPTIMATEO vlastní web a widget; ONYX vlastní lead a follow-up.",
};

const optimateoCatalog: PlatformIntegrationPoint = {
  id: "optimateo-catalog",
  platform: "optimateo",
  label: "OPTIMATEO e-shop konektor",
  description:
    "Importuje katalog, publikuje schválené změny a vrací prodejní události.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "optimateo.catalog.sync",
  requiredInputs: ["storeId", "feedUrl", "locale", "approvalBatchId"],
  outputs: ["syncJobId", "validatedSkus", "rejectedSkus", "status"],
  ownerBoundary:
    "OPTIMATEO vlastní web/e-shop write-back; ONYX schválení a marže.",
};

const optimateoReputation: PlatformIntegrationPoint = {
  id: "optimateo-reputation",
  platform: "optimateo",
  label: "OPTIMATEO reputation konektor",
  description: "Připojí recenze webu a připraví odpovědi ke schválení.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "optimateo.reputation.sync",
  requiredInputs: ["siteId", "sources", "approvalPolicy"],
  outputs: ["reviews", "sentiment", "replyDrafts", "status"],
  ownerBoundary:
    "OPTIMATEO sbírá webové recenze; ONYX řídí schválení a CRM dopad.",
};

const optimateoPublish: PlatformIntegrationPoint = {
  id: "optimateo-content-publish",
  platform: "optimateo",
  label: "OPTIMATEO web publikace",
  description:
    "Publikuje schválenou landing/content stránku a vrací canonical URL.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "optimateo.page.publish",
  requiredInputs: ["siteId", "content", "seo", "approvalId", "idempotencyKey"],
  outputs: ["pageId", "canonicalUrl", "publishedAt", "status"],
  ownerBoundary:
    "OPTIMATEO vlastní webovou publikaci; ONYX měření a revenue atribuci.",
};

const forgeSchedule: PlatformIntegrationPoint = {
  id: "forge-social-schedule",
  platform: "forge",
  label: "FORGE publikační kalendář",
  description: "Naplánuje schválené posty a media assety na připojené kanály.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "forge.publication.schedule",
  requiredInputs: [
    "campaignId",
    "channelIds",
    "contentItems",
    "approvalId",
    "idempotencyKey",
  ],
  outputs: ["scheduleId", "publicationJobs", "status"],
  ownerBoundary:
    "FORGE vlastní scheduling, social OAuth, publikaci a post-publish analytics.",
};

const globalEarningsModule: PlatformIntegrationPoint = {
  id: "onyx-global-earnings",
  platform: "onyx",
  label: "Global Earnings",
  description: "Sjednotí denní revenue eventy bez dvojího započtení.",
  transport: "local_route",
  state: "available",
  route: "/global-earnings",
  requiredInputs: [
    "provider",
    "externalEventId",
    "earnedOn",
    "amount",
    "currency",
  ],
  outputs: ["daily earnings", "provider breakdown", "reconciliation status"],
  ownerBoundary:
    "ONYX agreguje a zobrazuje revenue; zdrojový provider zůstává autoritou částky.",
};

const youtubeDailyEarnings: PlatformIntegrationPoint = {
  id: "youtube-daily-earnings",
  platform: "youtube",
  label: "YouTube denní earnings",
  description: "Načte denní odhadované revenue metriky autorizovaného kanálu.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "youtube.analytics.daily_earnings",
  requiredInputs: [
    "channelId",
    "startDate",
    "endDate",
    "currency",
    "OAuth: yt-analytics-monetary.readonly",
  ],
  outputs: [
    "day",
    "estimatedRevenue",
    "estimatedAdRevenue",
    "grossRevenue",
    "currency",
    "dataAvailableThrough",
  ],
  ownerBoundary:
    "FORGE spravuje YouTube OAuth; ONYX ukládá odhad jako provider-attributed revenue.",
};

const patreonDailyEarnings: PlatformIntegrationPoint = {
  id: "patreon-daily-earnings",
  platform: "patreon",
  label: "Patreon denní earnings",
  description:
    "Skládá denní ledger z API v2 členství, charge stavů a webhooků.",
  transport: "mcp_tool",
  state: "contract_ready",
  toolName: "patreon.earnings.sync",
  requiredInputs: [
    "campaignId",
    "since",
    "OAuth: campaigns,campaigns.members,w:campaigns.webhook",
  ],
  outputs: [
    "externalEventId",
    "earnedOn",
    "amountCents",
    "currency",
    "chargeStatus",
    "memberId",
  ],
  ownerBoundary:
    "FORGE spravuje Patreon OAuth/webhook secret; ONYX vede idempotentní denní ledger.",
};

export const platformIntegrationsByTemplateId: Record<
  string,
  PlatformIntegrationPoint[]
> = {
  "inbound-voice-receptionist": [callsModule, optimateoReception],
  "profit-ai-reception": [callsModule, optimateoReception, projectsModule],
  "profit-eshop-autopilot": [optimateoCatalog, omniAssetPack, projectsModule],
  "profit-reputation-monitor": [
    socialModule,
    optimateoReputation,
    projectsModule,
  ],
  "profit-content-revenue-loop": [
    omniVideoWorkflow,
    finalVideoReadyEvent,
    youtubeDailyEarnings,
    patreonDailyEarnings,
    globalEarningsModule,
    projectsModule,
  ],
  "profit-affiliate-content": [
    affiliateModule,
    optimateoPublish,
    projectsModule,
  ],
  "profit-digital-products": [
    optimateoPublish,
    patreonDailyEarnings,
    globalEarningsModule,
    projectsModule,
  ],
  "image-asset-pack": [omniAssetPack, projectsModule],
  "website-chatbot": [optimateoChatbot, projectsModule],
  "social-calendar": [omniAssetPack, forgeSchedule, projectsModule],
  "ugc-ad-pack": [omniAssetPack, omniVideoWorkflow, projectsModule],
  "video-repurpose": [omniVideoWorkflow, finalVideoReadyEvent, projectsModule],
};

export function getPlatformIntegrationPoints(
  templateId: string
): PlatformIntegrationPoint[] {
  return platformIntegrationsByTemplateId[templateId] ?? [];
}

export function createPlatformIntegrationArtifacts(
  templateId: string,
  createdAt: number
): Array<Record<string, unknown>> {
  return getPlatformIntegrationPoints(templateId).map(point => ({
    id: `integration-${templateId}-${point.id}`,
    type: point.transport === "local_route" ? "action" : "integration_contract",
    title: point.label,
    description: point.description,
    platform: point.platform,
    transport: point.transport,
    state: point.state,
    route: point.route,
    toolName: point.toolName,
    eventName: point.eventName,
    requiredInputs: point.requiredInputs,
    outputs: point.outputs,
    ownerBoundary: point.ownerBoundary,
    createdAt,
  }));
}
