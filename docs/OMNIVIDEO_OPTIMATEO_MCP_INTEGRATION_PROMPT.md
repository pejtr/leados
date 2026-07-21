# OMNIVIDEO + OPTIMATEO MCP Integration Prompt

Tento dokument je kopírovatelné zadání pro implementační agenty v repozitářích OMNIVIDEO+ a OPTIMATEO. Názvy nástrojů musí odpovídat registru v `shared/platformIntegrationContracts.ts`.

## Prompt pro OMNIVIDEO+

```text
Pracuješ v repozitáři OMNIVIDEO+. Implementuj produkčně bezpečný MCP server pro vzdálené řízení tvorby media assetů z ONYX OS.

ARCHITEKTONICKÁ HRANICE
- OMNIVIDEO vlastní vše před final video readiness: creative brief, source assets, generování, editaci, verze, render joby, QA a immutable final-ready asset.
- OMNIVIDEO nesmí plánovat ani publikovat na sociální sítě a nesmí vlastnit social OAuth, kampaně nebo revenue. To po FinalVideoReady vlastní FORGE.
- ONYX je orchestrátor: posílá schválené zadání, correlation ID a idempotency key. Nesmí přímo zapisovat do databáze OMNIVIDEO.

POVINNÉ MCP NÁSTROJE
1. omnivideo.capabilities.get
   Input: {}
   Output: schemaVersion, tools, supportedAssetTypes, supportedFormats, limits.

2. omnivideo.project.create
   Input: externalProjectId, creativeBrief, sourceAssets[], locale, targetFormats[], idempotencyKey, correlationId, approvedBy.
   Output: projectId, jobId, status, assetIds[], createdAt.
   Použij upsert podle idempotencyKey; opakované volání nesmí vytvořit druhý projekt.

3. omnivideo.asset_pack.create
   Input: projectId, brandBrief, formats[], style, negativeConstraints[], safeZones, idempotencyKey, correlationId.
   Output: jobId, assetIds[], previewUrls[], status, evidence[].
   Musí podporovat produktové vizuály, web hero, 1:1, 4:5, 9:16 a 16:9.

4. omnivideo.video.repurpose
   Input: projectId, sourceAssetId nebo sourceUrl, targetPlatforms[], targetDurations[], locale, captionsRequired, idempotencyKey.
   Output: jobId, clipAssetIds[], transcriptId, captionAssetIds[], status.

5. omnivideo.render.request
   Input: projectId, versionId, renderProfile, approvalId, idempotencyKey.
   Output: renderJobId, status, estimatedCompletionAt.

6. omnivideo.job.get
   Input: jobId.
   Output: jobId, status[pending|running|needs_approval|completed|failed], progress, evidence[], errors[], updatedAt.

7. omnivideo.asset.get
   Input: assetId.
   Output: assetId, projectId, version, type, immutableUrl, checksum, mimeType, dimensions, duration, rights, locale, createdAt.

8. omnivideo.final_video.mark_ready
   Input: projectId, renderId, approvalId, readinessChecks[], idempotencyKey.
   Output: videoId, renderId, finalAssetId, readinessStatus, readyAt, FinalVideoReady payload.
   Odmítnout požadavek, pokud chybí checksum, rights, approval nebo readiness check.

EVENT FINALVIDEOREADY.V1
Po úspěšném mark_ready emituj autentizovaný, idempotentní a retryable event FinalVideoReady.v1 pro FORGE:
- eventId, schemaVersion, occurredAt
- correlationId, externalProjectId
- videoId, renderId, finalAssetId
- immutableUrl, checksum, mimeType, duration, aspectRatio, codec
- title, description, thumbnailAssetId, captionAssetIds[]
- rights, territories[], locale
- approvedBy, readyAt

SPOLEČNÝ KONTRAKT
- Každý write tool přijímá idempotencyKey a correlationId.
- Každý výstup obsahuje status a evidence; simulaci nikdy nevracej jako completed.
- Dlouhé operace vracejí jobId a dokončují se asynchronně.
- Přidej callback/webhook nebo polling přes omnivideo.job.get.
- Validuj URL, MIME, velikost, práva, podporovaný formát a ownership projektu.
- Loguj actor, approvalId, toolName, input hash, výsledek a chybu do audit logu.
- Autentizace: service token nebo OAuth client credentials; secrets pouze server-side.
- Rate limit, timeout, retry s exponential backoff a dead-letter evidence.
- MCP tools nesmí publikovat, plánovat příspěvky ani měnit revenue data.

TESTY A AKCEPTACE
- Contract test pro každý tool a každý error stav.
- Dvojí volání se stejným idempotencyKey vrátí stejný resource/job.
- Neplatný approvalId nebo cizí projectId vrátí autorizovanou chybu.
- Job polling prokáže pending -> running -> completed/failed.
- FinalVideoReady replay nevytvoří druhý FORGE media record.
- Asset checksum a immutable URL se po readiness nezmění.
- Přidej README s env proměnnými, lokálním spuštěním MCP serveru a příklady volání.

Neprováděj deployment ani commit bez explicitního souhlasu. Neimplementuj falešné mock success odpovědi v produkční cestě.
```

## Prompt pro OPTIMATEO

```text
Pracuješ v repozitáři OPTIMATEO. Implementuj MCP server pro řízení webových a zákaznických workflow z ONYX OS.

VLASTNICTVÍ
- OPTIMATEO vlastní web, landing pages, funnel, chatbot widget, webovou recepci, e-shop write-back a webové review surfaces.
- ONYX vlastní orchestraci, schvalování, CRM leady, follow-up, project/revenue ledger a výsledkový dashboard.
- OMNIVIDEO vlastní media assety; OPTIMATEO je pouze referencuje přes immutable assetId/URL.
- FORGE vlastní sociální publikaci, social OAuth a post-publish analytics.

POVINNÉ MCP NÁSTROJE
1. optimateo.capabilities.get
   Output: sites, supportedConnectors, tools, schemaVersion, limits.

2. optimateo.chatbot.deploy
   Input: siteId, knowledgeBaseId, goal, qualificationRules[], handoffRules[], consentPolicy, leadWebhook, idempotencyKey, approvalId.
   Output: deploymentId, assistantId, widgetUrl, leadWebhook, status, evidence[].

3. optimateo.reception.configure
   Input: siteId, businessProfile, openingHours, qualificationRules[], handoffRules[], bookingConnector, consentPolicy, idempotencyKey.
   Output: assistantId, deploymentStatus, leadWebhook, bookingStatus, evidence[].
   Pokud není telephony/booking provider připojen, vrať blocked s konkrétním blockerem, ne completed.

4. optimateo.catalog.sync
   Input: storeId, feedUrl nebo feedPayload, locale, assetRefs[], approvalBatchId, idempotencyKey.
   Output: syncJobId, validatedSkus[], rejectedSkus[], status, evidence[].
   Publikuj pouze položky obsažené ve schválené dávce.

5. optimateo.reputation.sync
   Input: siteId, sources[], since, approvalPolicy, idempotencyKey.
   Output: reviews[], sentimentSummary, replyDrafts[], status.
   Automatické veřejné odpovědi musí být defaultně zakázané bez approvalId.

6. optimateo.page.publish
   Input: siteId, pageType, content, seo, assetRefs[], approvalId, idempotencyKey.
   Output: pageId, canonicalUrl, publishedAt, status, checksum.

7. optimateo.funnel.deploy
   Input: siteId, offer, audience, steps[], forms[], trackingContract, approvalId, idempotencyKey.
   Output: funnelId, urls[], formWebhook, status, evidence[].

8. optimateo.job.get
   Input: jobId.
   Output: status, progress, evidence[], errors[], updatedAt.

INTEGRAČNÍ PRAVIDLA
- Každý zachycený lead odešli do ONYX přes podepsaný webhook s externalLeadId, source, consent, pageId/widgetId, campaignId a occurredAt.
- Nikdy neposílej hesla, OAuth tokeny ani raw secrets do ONYX promptu nebo logu.
- Media z OMNIVIDEO pouze referencuj; nekopíruj a nepřepisuj final-ready asset.
- Každý write tool vyžaduje idempotencyKey, correlationId a u veřejné změny approvalId.
- Stav musí být evidence-backed: pending, running, needs_approval, completed, blocked nebo failed.
- Přidej audit log, retry, timeout, rate limit a contract tests.

AKCEPTACE
- Chatbot test vytvoří lead v ONYX pouze s doloženým souhlasem.
- Opakovaný deploy se stejným idempotencyKey nevytvoří druhý widget/funnel/page.
- Neplatný approvalId nepublikuje stránku ani odpověď na recenzi.
- Catalog sync vrátí per-SKU chyby a nepublikuje zamítnuté SKU.
- Všechny veřejné URL mají canonical, status, checksum a audit evidence.

Neprováděj deployment ani commit bez explicitního souhlasu. Neoznačuj chybějící konektor za funkční.
```

## Revenue konektory pro FORGE/ONYX

### YouTube

- Adapter/MCP tool: `youtube.analytics.daily_earnings`
- OAuth scope: `https://www.googleapis.com/auth/yt-analytics-monetary.readonly`
- API: YouTube Analytics `reports.query`
- Query: `ids=channel==MINE`, `dimensions=day`, metriky minimálně `estimatedRevenue,estimatedAdRevenue,grossRevenue`, explicitní měna.
- Hodnoty ukládat jako `estimated`, s `dataAvailableThrough`; chybějící poslední dny nejsou nula.

### Patreon

- Adapter/MCP tool: `patreon.earnings.sync`
- API v2 scopes: `campaigns`, `campaigns.members`, `w:campaigns.webhook`.
- Použít members resource a v2 webhook triggers `members:create`, `members:update`, `members:delete`, `members:pledge:create`, `members:pledge:update`, `members:pledge:delete`.
- Ověřit `X-Patreon-Signature`, ukládat raw event ID/hash a zpracovávat idempotentně.
- Denní ledger skládat z charge/member eventů; aktivní pledge není automaticky potvrzená denní platba.

### Jednotný earnings kontrakt

Každá položka pro ONYX Global Earnings obsahuje:

```json
{
  "provider": "youtube|patreon",
  "externalAccountId": "string",
  "externalEventId": "string",
  "earnedOn": "YYYY-MM-DD",
  "amount": 0,
  "currency": "CZK|EUR|USD",
  "quality": "estimated|confirmed|reversed",
  "dataAvailableThrough": "YYYY-MM-DD|null",
  "correlationId": "string|null",
  "rawEvidenceHash": "string"
}
```

Unikátní klíč je `(provider, externalAccountId, externalEventId)`. Přepočet měny musí zachovat originální částku, měnu, použitý kurz a datum kurzu.

Oficiální reference:

- https://developers.google.com/youtube/analytics/reference/reports/query
- https://developers.google.com/youtube/analytics/metrics
- https://developers.google.com/youtube/reporting/guides/authorization
- https://docs.patreon.com/
