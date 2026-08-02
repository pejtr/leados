# Pull Request

## Cíl změny

Popiš krátce, co se mění a proč. Pokud jde o marketingový nebo designový experiment, uveď také očekávaný dopad na KPI.

## Typ změny

| Typ | Ano/Ne |
|---|---|
| Feature | Ne |
| Bugfix | Ne |
| Marketing experiment | Ne |
| Apple-like design / UI | Ne |
| Copywriting | Ne |
| SEO | Ne |
| Tracking / analytics | Ne |
| QA / testy | Ne |
| Config / Railway / CI | Ne |

## Hypotéza a KPI

| Pole | Hodnota |
|---|---|
| Hypotéza | `<např. jednodušší hero zvýší CTR hlavního CTA>` |
| Primární KPI | `<CTR / CVR / leads / purchases / revenue>` |
| Sekundární KPI | `<bounce, scroll depth, time to action, errors>` |
| Tracking eventy | `<event_name_1, event_name_2>` |

## Změněné oblasti

Popiš hlavní oblasti diffu: UI, komponenty, copy, tracking, backend, config, testy, dokumentace.

## QA evidence

| Gate | Stav | Evidence |
|---|---|---|
| Build | Pass / Fail / N/A | `<command or CI link>` |
| Lint / typecheck | Pass / Fail / N/A | `<command or CI link>` |
| Unit / smoke test | Pass / Fail / N/A | `<command or result>` |
| Tracking QA | Pass / Fail / N/A | `<events and expected behavior>` |
| Apple-like design review | Pass / Warning / Fail | `<short review>` |
| Performance / Lighthouse | Pass / Warning / Fail / N/A | `<score or note>` |
| Railway staging | Pass / Fail / N/A | `<staging URL>` |

## Apple-like design checklist

| Kontrola | Stav |
|---|---|
| Jasná vizuální hierarchie | Pass / Warning / Fail |
| Jeden dominantní CTA směr | Pass / Warning / Fail |
| Čitelnost na mobilu | Pass / Warning / Fail |
| Dostatek whitespace | Pass / Warning / Fail |
| Konzistentní spacing a radius | Pass / Warning / Fail |
| Prémiový, čistý a fresh dojem | Pass / Warning / Fail |
| Bez zbytečného vizuálního šumu | Pass / Warning / Fail |

## Rizika

Popiš, co se může rozbít nebo zhoršit. Uveď riziko pro produkci, tracking, SEO, výkon a konverze.

## Rollback plán

Popiš nejrychlejší bezpečný návrat zpět. Ideálně uveď, zda stačí revert PR, nebo jsou potřeba proměnné, databázová migrace či Railway rollback.

## Agent metadata

| Pole | Hodnota |
|---|---|
| Agent | `<agent_name>` |
| Backend / model | `<ollama/deepseek/lm-studio/openrouter>` |
| Branch | `<branch>` |
| Task file | `<tasks/...md>` |
| Human reviewer | `<name>` |

## Finální rozhodnutí

| Decision | Stav |
|---|---|
| Ready for staging | Ano / Ne |
| Ready for production | Ano / Ne |
| Needs more work | Ano / Ne |
