# Implementacni prompt: Katastr Online <-> ONYX OS

Nize uvedeny text vloz do implementacniho agenta, ktery ma pristup k obema
repozitarum. Prompt je zamerne prisny: nejdrive ma overit skutecny stav obou
checkoutu a az potom implementovat.

---

## Prompt pro implementacniho agenta

Jsi seniorni integration architect a TypeScript engineer. Tvym ukolem je
navrhnout a implementovat produkcne pouzitelne propojeni mezi:

- **Katastr Online** - vlastnik nemovitostnich dat, adres a parcel, reportu,
  monitoringu zmen, poptavek kupujicich, dobrovolne vlozenych nabidek
  prodavajicich a vysvetleni match score.
- **ONYX OS / OMNICORE Hub** - vlastnik CRM leadu a dealu, souhlasu, lidskeho
  schvaleni, partnerskeho predani, ukolu, komunikace, stavu obchodniho pripadu,
  provize a revenue atribuce.

### Zakladni pravidlo architektury

Pouzij tri odlisne mechanismy podle jejich ucelu:

1. **REST API** pro synchronni, deterministicke system-to-system operace.
2. **Podepsane webhooky/domain events** pro asynchronni zmeny stavu a retry.
3. **MCP** pouze jako agent-facing vrstvu pro HERMES/HERA a dalsi AI agenty.

MCP neni nahrazka za business API, event bus ani databazovou synchronizaci.
Nevytvarej obousmernou sit MCP serveru, pokud pro dany tok staci REST nebo
webhook. Pro MVP ma Katastr Online poskytovat jeden MCP server a ONYX jej
konzumovat. Zapis kritickych obchodnich stavu provadej pres typovane REST API.

## 1. Povinna auditni faze

Pred prvni zmenou:

1. Spust v obou repozitarich:
   - `git status --short`
   - prikaz pro TypeScript check
   - dostupne cilene testy
2. Najdi a popis:
   - skutecne entrypointy serveru,
   - soucasny auth model,
   - API key a webhook infrastrukturu,
   - MCP klient/server a pouzity transport,
   - databazove modely pro leady, deals, real estate, provize, projekty a audit,
   - zpusob validace env promennych,
   - existujici OpenAPI nebo manifest kontrakt.
3. Nevytvarej soubor ani route pouze podle tohoto promptu, pokud uz existuje
   ekvivalent. Nejdrive najdi stavajici pattern.
4. Zachovej vsechny nesouvisejici zmeny v pracovnim stromu. Neprovadej reset,
   commit, push ani deploy.
5. Pokud Katastr Online repo neni dostupne, implementuj pouze ONYX cast a vytvor
   presny handoff dokument pro druhy repo. Nezakladej nahradni projekt v prazdne
   slozce.

### Overeny vychozi stav ONYX OS

Aktualni ONYX checkout uz obsahuje:

- `server/hubRoute.ts` s `/api/hub/manifest`, `/api/hub/ping`,
  `/api/hub/lead`, `/api/hub/event` a `/api/hub/report`,
- `server/externalApi.ts` s Bearer API keys a `read`/`write` permissions,
- `server/apiKeys.ts` s hashovanim API klicu,
- `server/webhookDispatcherV2.ts` s HMAC-SHA256 a retry,
- `server/_core/mcpClient.ts` s jednim `stdio` MCP transportem,
- `shared/platformIntegrationContracts.ts` s deklarativnimi stavy
  `available`, `contract_ready`, `blocked`,
- CRM modely pro leads, deals, activities, listings, property transactions,
  commissions, connected projects, project events a ingested leads.

Tyto casti znovu nepistej od nuly. Rozsir je kompatibilne. Soucasny obecny
`/api/hub/lead` ponech pro jednoduche leady, ale citlivy Katastr Match workflow
implementuj jako verzovany domenovy kontrakt. Nestlacuj souhlasy, match a
partner handoff do jednoho `extraData` JSON.

## 2. System ownership a zdroj pravdy

### Katastr Online je source of truth pro

- normalizovanou adresu a uzemni identifikatory,
- parcelu, jednotku, budovu a katastralni uzemi,
- snapshot zdrojovych dat a jejich provenance,
- report, jeho verzi, pouzite zdroje a casovou platnost,
- monitoring nemovitosti a zjistenou zmenu,
- buyer demand profile,
- seller listing/claim vytvoreny dobrovolne uzivatelem,
- vypocet a vysvetleni match score,
- stav oboustranneho zajmu pred predanim do CRM.

### ONYX OS je source of truth pro

- osobu, organizaci, lead a deal,
- zaznam souhlasu a jeho dukaz,
- lidske schvaleni pred odhalenim kontaktu nebo predanim partnerovi,
- partnersky registr a prirazeni maklere,
- CRM pipeline a ukoly,
- komunikaci a SLA,
- obchodni stav partner case,
- provizi a revenue atribuci,
- audit operatora a AI agenta.

### Zakazane duplicity

- ONYX nesmi vytvaret druhy master zaznam parcely nebo LV.
- Katastr Online nesmi vytvaret druhy CRM a provizni ledger.
- Jana Vapenikova, Bidli ani jiny partner nesmi byt hardcoded. Vytvor obecny
  `partner`/`broker` model a prvniho partnera zaloz pres seed nebo administraci.
- Kontakt vlastnika z katastralnich dat nesmi byt povazovan za marketingovy
  souhlas.

## 3. Kanonicke identifikatory

Kazdy request, response a event musi podle kontextu pouzivat:

- `tenantId`
- `correlationId`
- `idempotencyKey`
- `occurredAt`
- `schemaVersion`
- `katastrPropertyId`
- `buyerDemandId`
- `sellerListingId`
- `matchId`
- `onyxLeadId`
- `onyxDealId`
- `partnerId`
- `partnerCaseId`

Externi ID ukladej explicitne a pridej unikatni index nad kombinaci
`tenantId + sourceSystem + externalId`. Neodvozuj idempotenci z e-mailu.

## 4. REST API kontrakt

Vytvor OpenAPI 3.1 kontrakt jako source of truth. Runtime schemas musi byt
odvozene ze stejnych Zod/JSON Schema definic; neudrzuj rucne tri odlisne verze.

Preferovana ONYX namespace:

`/api/integrations/katastr/v1`

### Katastr Online -> ONYX

Implementuj minimalne:

- `POST /leads/upsert`
  - vytvori nebo aktualizuje buyer/seller lead,
  - vyzaduje `idempotencyKey`, `sourceSystem`, `externalPersonId`,
    `leadType`, kontakt a stav souhlasu,
  - vraci `onyxLeadId`, `created`, `currentStatus`.
- `POST /matches`
  - ulozi kandidata shody bez odhaleni kontaktu druhe strany,
  - obsahuje `matchId`, reference na buyer/seller stranu, score, jednotlive
    faktory a lidsky citelne vysvetleni,
  - nesmi obsahovat citlive nebo diskriminacni charakteristiky.
- `POST /consents`
  - uklada append-only dukaz souhlasu,
  - obsahuje `subjectId`, `purpose`, `scope`, `grantedAt`, `expiresAt`,
    `policyVersion`, `captureMethod`, `evidenceHash`,
  - odvolani souhlasu je novy event, ne prepis historie.
- `POST /handoffs`
  - vytvori pozadavek na lidske schvaleni partner handoff,
  - bez schvaleni nevraci partnerovi telefon ani e-mail.
- `PATCH /partner-cases/{partnerCaseId}/status`
  - povolene stavy:
    `accepted`, `contacted`, `qualified`, `viewing`, `offer`, `sold`,
    `lost`, `cancelled`,
  - validuj povolene prechody stavu,
  - `sold` vyzaduje vysledek, menu a financni hodnoty.
- `POST /commissions`
  - idempotentni zaznam provize navazany na deal a partner case,
  - oddel `expected`, `confirmed`, `invoiced`, `paid`, `cancelled`.

### ONYX -> Katastr Online

Implementuj minimalne:

- `GET /approvals/{approvalId}`
- `POST /webhooks/onyx` na strane Katastr Online pro:
  - rozhodnuti schvaleni,
  - prirazeni partnera,
  - zmenu stavu partner case,
  - potvrzeni provize.

Pokud Katastr Online potrebuje polling fallback, pridej `updatedSince` cursor.
Polling nesmi byt primarni mechanismus.

### Response envelope

Pouzij konzistentni tvar:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "correlationId": "uuid",
    "schemaVersion": "1.0",
    "processedAt": "ISO-8601"
  }
}
```

Chyby musi vracet stabilni `code`, bezpecnou `message`, `correlationId` a
volitelne validacni `details`. Nevracej stack trace ani secret.

## 5. Eventy a webhooky

Pouzij verzovane event names:

- `katastr.buyer_demand.created.v1`
- `katastr.seller_property.claimed.v1`
- `katastr.match_candidate.created.v1`
- `katastr.match_consent.granted.v1`
- `katastr.match_consent.revoked.v1`
- `katastr.partner_handoff.requested.v1`
- `onyx.partner_handoff.approved.v1`
- `onyx.partner_handoff.rejected.v1`
- `onyx.partner_case.status_changed.v1`
- `onyx.commission.recorded.v1`
- `katastr.property_monitor.change_detected.v1`
- `katastr.report.completed.v1`

Event envelope:

```json
{
  "eventId": "uuid",
  "eventType": "katastr.match_candidate.created.v1",
  "schemaVersion": "1.0",
  "tenantId": "string",
  "correlationId": "uuid",
  "idempotencyKey": "string",
  "occurredAt": "ISO-8601",
  "producer": "katastr-online",
  "data": {}
}
```

Webhook zabezpeceni:

- TLS pouze,
- separatni webhook secret pro kazde prostredi a partnera,
- `X-ONYX-Timestamp`, `X-ONYX-Event-Id`, `X-ONYX-Signature`,
- HMAC-SHA256 nad `timestamp + "." + rawBody`,
- max. petiminutove replay okno,
- constant-time porovnani podpisu,
- idempotentni inbox tabulka s unikatnim `eventId`,
- exponential backoff s jitterem,
- delivery log, pocet pokusu a dead-letter stav,
- tlacitko pro bezpecny replay v administraci.

Rozsir existujici `webhookDispatcherV2.ts`; nevytvarej druhy obecny dispatcher.
Stavajici event union rozsirit typove, neprevest na libovolny string.

## 6. MCP server Katastr Online

Katastr Online poskytne standardni MCP server. Produkce ma pouzit oficialni MCP
SDK a vzdaleny autentizovany transport podporovany aktualni verzi SDK.
Lokalni `stdio` ponech pouze pro vyvoj. Nepoustej MCP nastroje pres shell,
`execSync` ani CLI wrapper.

### Read tools

- `katastr.search_address`
- `katastr.get_property`
- `katastr.get_report`
- `katastr.list_monitoring_events`
- `katastr.explain_match`
- `katastr.get_data_provenance`
- `katastr.get_consent_status`
- `katastr.get_partner_case`

### Guarded write tools

- `katastr.create_buyer_demand`
- `katastr.claim_seller_property`
- `katastr.request_match_consent`
- `katastr.submit_match_to_onyx`
- `katastr.request_partner_handoff`

Kazdy write tool musi:

- mit strict schema bez `additionalProperties`,
- vyzadovat `tenantId`, `correlationId` a `idempotencyKey`,
- vratit preview dopadu pred irreversible akci,
- oznacit, zda je nutne lidske schvaleni,
- respektovat tenant a scope oprávneni,
- zapsat audit log s actor type `user`, `agent` nebo `service`,
- nikdy samostatne neodhalit kontakt partnerovi.

MCP responses nesmi obsahovat cele WSDP/VFK dokumenty, nepotrebne osobni udaje
ani zdrojove credentials. Vrat pouze minimalni data dovolena danym ucelem.

### ONYX MCP klient

Soucasny ONYX klient podporuje jeden `stdio` server. Rozsir ho tak, aby:

- konfigurace serveru byly typovane a centralizovane pres `ENV`,
- podporoval allowlist nastroju pro kazdy server,
- produkcni remote transport pouzival kratkodoby token nebo OAuth podle
  moznosti serveru,
- mel timeout, abort, retry pouze pro bezpecne/idempotentni operace,
- logoval metadata volani, ale redigoval PII a secrets,
- stav nastroju mapoval na `available`, `contract_ready`, `blocked`,
- selhal izolovane, aby vypadek Katastr MCP nezastavil start ONYX serveru.

Do `PlatformId` a integračního registru pridej `katastr_online`. Pro kazdy
integration point uved presnou hranici vlastnictvi, vstupy, vystupy a skutecny
stav. Neoznacuj kontrakt jako `available`, dokud neprojde connectivity a
contract test.

## 7. Datovy model ONYX

Reusuj existujici tabulky `leads`, `deals`, `dealActivities`, `commissions`,
`connectedProjects`, `projectEvents`, `listings` a `propertyTransactions` tam,
kde jejich semantika sedi. Pridej samostatne domenove tabulky pro:

- `externalEntityLinks`
- `consentEvidence`
- `matchCandidates`
- `integrationApprovals`
- `realEstatePartners`
- `partnerCases`
- `integrationInbox`
- `integrationOutbox`
- `integrationAuditLog`

Pozadavky:

- vsechny tabulky jsou tenant-scoped,
- zadne hardcoded `userId`,
- osobni kontakt je sifrovan nebo tokenizovan podle existujiciho repo patternu,
- audit a consent evidence jsou append-only,
- `matchCandidates` uklada faktory i vysvetleni, ne pouze vysledne score,
- `partnerCases` odkazuje na ONYX lead/deal a externi match,
- provize zustava v kanonickem ONYX `commissions` ledgeru,
- migrace generuj existujicim Drizzle workflow; neupravuj SQL migrace rucne.

Nevyuzivej legacy plaintext project API key pro novou privilegovanou integraci.
Pouzij hashovany API key model se scopes a rotaci. Existujici hub klice
nemigruj mimo rozsah tohoto ukolu.

## 8. Data provenance a licence

Kazdy property/report atribut nebo logicky celek musi nest:

```ts
type DataProvenance = {
  source: "RUIAN" | "VFR" | "WSDP" | "VFK" | "SSZ" | "PARTNER" | "USER";
  sourceVersion?: string;
  sourceRecordId?: string;
  observedAt: string;
  importedAt: string;
  confidence: "official" | "verified" | "derived" | "estimated";
  redistributionAllowed: boolean;
  personalDataAllowed: boolean;
  purpose: string;
};
```

Implementacni pravidla:

- RUIAN/VFR pouzij pro adresni a uzemni identitu.
- Pro placeny dalkovy pristup cil na WSDP 3.1, ne na novou integraci 2.9.
- VFK import a SSZ monitoring izoluj za adaptery a verzuj parsery.
- Nescrapuj HTML aplikace Nahlizeni do KN.
- Credentials CÚZK zustavaji pouze v Katastr Online secret storage.
- ONYX nikdy nevola CÚZK primo a credentials nedostane.
- Verejne zobrazeni nebo predani dat treti strane blokuj feature flagem, dokud
  neni pro konkretni dataset potvrzeno opravneni k sireni.
- U kazdeho odvozeneho score zobraz zdroj, datum, metodiku a miru jistoty.

## 9. Katastr Match a pravni guardrails

Match je zalozen pouze na:

- lokalite,
- rozpoctu,
- parametrech nemovitosti,
- casove pripravenosti,
- overenem financovani,
- investicni preferenci a toleranci rizika.

Vychozi vahy mohou byt:

- lokalita 30 %,
- rozpocet 25 %,
- parametry 20 %,
- cas 10 %,
- financovani 10 %,
- investicni preference 5 %.

Vahy musi byt konfigurovatelne a verzovane. U kazde shody uloz `modelVersion`,
jednotlive faktory, splnene hard constraints a vysvetleni. Nepouzivej etnicitu,
zdravi, nabozenstvi, rodinny stav ani jine citlive/diskriminacni znaky.

Kontakt se odemkne pouze pokud plati vse:

1. prodavajici vlozil nebo narokoval nemovitost dobrovolne,
2. obe strany projevily zajem,
3. existuje platny souhlas s konkretnim ucelem predani,
4. ONYX operator provedl lidske schvaleni,
5. partner ma aktivni smlouvu, opravneni, pojisteni a scope pro danou lokalitu.

Implementuj `contactReleaseAllowed` jako server-side policy, ne jako UI podminku.
Kazde odhaleni kontaktu audituj.

## 10. Partner workflow

Obecny partner model musi obsahovat:

- firmu a zodpovednou osobu,
- identifikaci a kontakt,
- regiony a specializace,
- stav overeni,
- platnost smlouvy, opravneni a pojisteni,
- SLA pro prvni kontakt,
- provizni model,
- stav aktivace,
- API/webhook schopnosti.

Pilotni tok:

`buyer demand -> anonymni match -> oboustranny zajem -> ONYX approval ->
partner assignment -> accepted -> contacted -> qualified -> viewing -> offer ->
sold/lost -> commission`

Kdyz partner nema API, ONYX musi umoznit bezpecny rucni update stavu. E-mail
neni zdroj pravdy pro stav pripadu.

## 11. Security, privacy a observability

- Vsechny vstupy validuj na serveru.
- Rate limituj podle tenant, credential a endpoint.
- Pouzij least-privilege scopes:
  - `katastr:context:read`
  - `katastr:lead:write`
  - `katastr:match:write`
  - `katastr:consent:write`
  - `katastr:handoff:request`
  - `onyx:approval:read`
  - `onyx:case:write`
  - `onyx:commission:write`
- Secrets pouze v env/secret manageru, nikdy v DB logu, promptu ani response.
- PII redakce v logu.
- Strukturovane logy s `correlationId`, metriky latency/error/retry/DLQ.
- Healthcheck oddeluje `configured`, `reachable`, `authenticated`,
  `contractCompatible`.
- Audituj vsechny write operace a rozhodnuti AI.
- Automaticke AI rozhodnuti nesmi nahradit lidske schvaleni partner handoff.

## 12. Testy

Povinne pridej:

- unit testy schemas, status transition a match explainability,
- contract testy z OpenAPI examples,
- auth a permission testy,
- HMAC testy vcetne zmeneneho tela, stareho timestampu a replay,
- idempotency testy pro REST i webhook,
- tenant-isolation testy,
- test, ze bez souhlasu a approval nelze ziskat kontakt,
- test, ze partner neni hardcoded,
- test, ze vypadek MCP nezastavi ONYX,
- test WSDP 3.1 adapteru nad oficialnim testovacim prostredim nebo fixtures,
- test redakce PII v logu,
- end-to-end happy path buyer -> match -> approval -> partner -> sold ->
  commission,
- end-to-end revoke-consent a duplicate-event scenare.

Testy nesmi volat produkcni WSDP ani vytvaret skutecny partner handoff.

## 13. Implementacni sprinty

### Sprint 0 - kontrakty a bezpecnost

- audit obou repo,
- ownership dokument,
- OpenAPI 3.1, event schemas a threat model,
- scope model, idempotency a audit,
- zadne produkcni write operace.

### Sprint 1 - read-only kontext

- RUIAN/VFR adapter,
- WSDP 3.1 test adapter,
- Katastr MCP read tools,
- ONYX multi-server MCP client a registry,
- provenance ve vsech odpovedich.

### Sprint 2 - lead a consent

- buyer/seller lead upsert,
- append-only consent evidence,
- idempotentni webhook inbox/outbox,
- ONYX approval queue.

### Sprint 3 - Katastr Match

- vysvetlitelny match engine,
- anonymni match candidate,
- oboustranny zajem,
- server-side contact release policy.

### Sprint 4 - partner handoff a revenue

- obecny partner registry,
- partner case state machine,
- SLA a operator tasks,
- commission ledger a callbacks do Katastr Online.

### Sprint 5 - monitoring

- SSZ/VFK adaptery,
- change events,
- alert deduplication,
- vytvoreni ONYX tasku z relevantni zmeny.

Po kazdem sprintu spust check, cilene testy a build podle pravidel repozitare.
Nevydavej konfiguracni placeholder za hotovou integraci.

## 14. Acceptance criteria

Hotovo znamena:

- OpenAPI a event schemas jsou verzovane a maji examples.
- Oba systemy prokazatelne projdou auth a contract testem.
- Opakovany stejny request/event nevytvori duplicitni lead, match, case ani
  provizi.
- ONYX zobrazi zdroj Katastr Online, externi ID, souhlas, match score,
  vysvetleni, approval, partnera, stav a provizi.
- Bez platneho souhlasu a lidskeho approval nelze odhalit kontakt.
- Vsechny property informace maji provenance a pravidlo pro redistribuci.
- MCP nastroje maji strict schemas, allowlist a audit.
- Vypadek Katastr Online nebo MCP nezastavi ONYX server.
- WSDP 3.1 test funguje nad testovacim prostredim/fixtures; WSDP 2.9 neni novy
  cil integrace.
- Zadna cast nescrapuje Nahlizeni do KN ani neoslovuje vlastniky z katastralnich
  dat.
- Partner je konfigurovatelny, ne hardcoded.
- Check, testy a build projdou v obou repozitarich.

## 15. Pozadovany vystup agenta

Na konci vrat:

1. audit vychoziho stavu obou repo,
2. seznam souboru zmenenych v kazdem repo,
3. diagram ownership a datovych toku,
4. seznam REST endpoints, eventu a MCP tools,
5. migrace a jejich stav aplikace,
6. auth/scopes a zpusob rotace secrets,
7. vysledky check, test a build,
8. co bylo overeno end-to-end a co pouze kontraktem,
9. blokery pro produkci,
10. presny dalsi krok pro zprovozneni credentials,
11. potvrzeni, ze nebyl proveden commit ani deploy.

Nevypisuj hodnoty zadnych credentials.

---

## Oficialni technicke zdroje pro implementatora

- CÚZK WSDP:
  https://cuzk.gov.cz/Aplikace-DP-do-KN/Aplikace-DP-do-KN/Webove-sluzby-dalkoveho-pristupu.aspx
- CÚZK WSDP na zkousku:
  https://www.cuzk.gov.cz/Katastr-nemovitosti/Poskytovani-udaju-z-KN/Dalkovy-pristup/Webove-sluzby-DP-na-zkousku.aspx
- CÚZK pravidla sireni dat z WSDP:
  https://cuzk.gov.cz/Katastr-nemovitosti/Poskytovani-udaju-z-KN/Dalkovy-pristup/Sireni-dat-ziskanych-WSDP.aspx
- CÚZK RUIAN:
  https://www.cuzk.gov.cz/ruian/RUIAN/Informace-o-RUIAN.aspx
- CÚZK VFR:
  https://cuzk.gov.cz/ruian/Poskytovani-udaju-ISUI-RUIAN-VDP/Vymenny-format-RUIAN-%28VFR%29.aspx
- CÚZK VFK:
  https://cuzk.gov.cz/Katastr-nemovitosti/Poskytovani-udaju-z-KN/Vymenny-format-KN/Vymenny-format-NVF.aspx
- CÚZK webova sluzba sledovani zmen:
  https://cuzk.gov.cz/Katastr-nemovitosti/Poskytovani-udaju-z-KN/Sledovani-zmen/Popis-webove-sluzby-pro-sledovani-zmen-udaju-o-nem.aspx
- UOOU - katastr nemovitosti a osobni udaje:
  https://uoou.gov.cz/verejnost/qa-otazky-a-odpovedi/katastr-nemovitosti
