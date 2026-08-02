# QA Prompt Pack pro lokální AI vývojový kit

Autor: **Manus AI**

Tento dokument doplňuje **QA Kit & Grafana-style Monitoring** o praktické prompty pro každodenní práci QA architekta, vývojových agentů, release managera a marketing/design reviewerů. Cílem je držet rychlý autonomní vývoj pod kontrolou: každý agent může pracovat paralelně, ale produkční změny musí projít technickou, vizuální, tracking, marketingovou a release kontrolou.

> Základní pravidlo QA promptů: **model nesmí jen hodnotit, ale musí vytvořit ověřitelný výstup: acceptance criteria, testovací scénáře, rizika, blokery, důkazy a finální verdikt pro PR nebo release.**

## Doporučené směrování modelů pro QA

QA workflow by mělo kombinovat levnou lokální kontrolu s kritickým cloudovým review jen tam, kde je to nutné. Běžné checklisty a testovací scénáře může generovat lokální model, zatímco release rozhodnutí a rizikové produkční změny patří silnějšímu reviewerovi.

| QA úkol | Doporučený model | Fallback | Výstup |
|---|---|---|---|
| **Rychlý QA checklist pro PR** | LM Studio | Ollama | Checklist, blokery, non-blocking připomínky. |
| **Testovací scénáře a regression pack** | DeepSeek nebo Ollama | LM Studio | Scénáře, priority, edge cases. |
| **Vizuální QA a Apple-like review** | LM Studio | OpenRouter | Design skóre, CTA rizika, mobile problémy. |
| **Tracking QA** | DeepSeek | LM Studio | Eventy, KPI, UTM, datová rizika. |
| **Release readiness / no-go rozhodnutí** | OpenRouter | DeepSeek | Verdikt, blokery, rollback a watchlist. |
| **Incident postmortem** | DeepSeek | OpenRouter | Root cause, timeline, prevention actions. |

---

# 1. Testovací strategie a acceptance criteria

Tyto prompty používej už při zakládání tasku nebo issue. Kvalitní QA nezačíná až po implementaci; začíná přesným popisem toho, jak poznáme, že je změna hotová, bezpečná a měřitelná.

## 1.1 Vytvoření acceptance criteria pro vývojový task

```text
Jsi QA architekt a product reviewer.

Vytvoř přesná acceptance criteria pro následující vývojový úkol.

Task:
[POPIS TASKU]

Produktový kontext:
[PRODUKT, CÍLOVKA, BUSINESS CÍL]

Technický kontext:
[STACK, DOTČENÉ KOMPONENTY, API, DATA, DEPLOY]

KPI nebo očekávaný výsledek:
[KPI / OUTCOME]

Vytvoř acceptance criteria ve formátu:
| ID | Kritérium | Jak ověřit | Typ kontroly | Kritičnost |

Zahrň:
1. funkční kritéria,
2. UX a responzivní kritéria,
3. performance kritéria,
4. tracking/analytics kritéria,
5. security/privacy kritéria,
6. rollback/release kritéria,
7. explicitní out-of-scope oblasti.

Na závěr napiš Definition of Done pro PR.
```

## 1.2 Testovací scénáře z user story

```text
Jsi senior QA engineer.

Z následující user story vytvoř testovací scénáře.

User story:
[JAKO UŽIVATEL CHCI..., ABYCH...]

Acceptance criteria:
[AC]

Rizikové oblasti:
[RIZIKA]

Vytvoř testovací scénáře jako tabulku:
| Test ID | Scénář | Kroky | Očekávaný výsledek | Priorita | Automatizovat? |

Zahrň:
- happy path,
- negative path,
- edge cases,
- mobile scénáře,
- accessibility scénáře,
- tracking event validaci,
- regression dopad na okolní flow.
```

## 1.3 Edge case finder

```text
Jsi QA risk analyst.

Najdi edge cases pro následující změnu.

Změna:
[POPIS ZMĚNY]

Dotčené flow:
[FLOW]

Data a vstupy:
[DATA / FORMULÁŘE / PARAMETRY / API]

Najdi minimálně 20 edge cases a rozděl je do kategorií:
- vstupní data,
- stav aplikace,
- uživatelská role,
- síť/API,
- zařízení a viewport,
- lokalizace,
- tracking,
- bezpečnost,
- release/rollback.

Výstup:
| Edge case | Kategorie | Pravděpodobnost | Dopad | Jak ověřit | Blokuje release? |
```

---

# 2. Bug reporty a defect management

Bug report musí být použitelný pro vývojáře i agenta. Nestačí „nefunguje to“. Každý report má mít reprodukci, očekávání, skutečnost, důkaz, prostředí, dopad, prioritu a návrh dalšího kroku.

## 2.1 Strukturovaný bug report

```text
Jsi QA engineer a defect triage lead.

Převeď následující poznámky do kvalitního bug reportu.

Poznámky:
[NEFORMÁLNÍ POPIS BUGU]

Kontext:
[PROJEKT, PROSTŘEDÍ, URL, BRANCH, COMMIT, ZAŘÍZENÍ]

Vytvoř bug report ve formátu:
- Title:
- Severity: P0/P1/P2/P3
- Priority: High/Medium/Low
- Environment:
- Preconditions:
- Steps to reproduce:
- Expected result:
- Actual result:
- Evidence:
- Business impact:
- Technical suspicion:
- Regression risk:
- Suggested owner:
- Suggested labels:

Na závěr napiš návrh GitHub issue title a branch name pro opravu.
```

## 2.2 Bug triage a priorita

```text
Jsi QA triage lead.

Ohodnoť následující bugy a seřaď je podle priority opravy.

Bugy:
[SEZNAM BUGŮ]

Release kontext:
[BLÍŽÍCÍ SE RELEASE / KAMPAŇ / PRODUKČNÍ DOPAD]

Hodnoť podle:
- dopadu na uživatele,
- dopadu na revenue/KPI,
- frekvence výskytu,
- workaroundu,
- rizika pro brand,
- rizika pro data,
- náročnosti opravy.

Výstup:
| Rank | Bug | Severity | Priority | Důvod | Doporučený owner | Release rozhodnutí |
```

---

# 3. Regression, smoke a release checklisty

Regression pack by měl být krátký, ale pokrýt kritické cesty. Smoke test má odpovědět na otázku, zda je build vůbec použitelný. Release checklist musí chránit produkci a marketingový funnel.

## 3.1 Regression checklist pro PR

```text
Jsi QA automation engineer.

Vytvoř regression checklist pro následující Pull Request.

PR summary:
[PR SUMMARY]

Změněné soubory:
[FILES]

Dotčené flow:
[FLOW]

Historické riziko:
[ZNÁMÉ REGRESE / INCIDENTY]

Výstup:
| Oblast | Co otestovat | Kroky | Očekávaný výsledek | Kritičnost | Ručně/automaticky |

Zahrň minimálně:
1. smoke test,
2. dotčenou funkci,
3. okolní regresní flow,
4. mobile kontrolu,
5. tracking kontrolu,
6. performance sanity check,
7. rollback ověření.
```

## 3.2 Smoke test pro staging

```text
Jsi QA reviewer pro staging prostředí.

Vytvoř krátký smoke test, který ověří, že staging build je připravený k review.

Staging URL:
[URL]

Release scope:
[SCOPE]

Kritické flow:
[FLOW]

Výstup:
| Test | Kroky | Expected result | Evidence | Pass/Fail |

Smoke test musí být proveditelný do 10 minut a musí zahrnovat:
- načtení hlavní stránky,
- primární CTA,
- kritické formuláře nebo checkout,
- responzivitu na mobile viewportu,
- kontrolu konzole nebo viditelných chyb,
- základní tracking sanity check,
- kontrolu, že staging odpovídá správné branchi/commitu.
```

## 3.3 Release readiness QA prompt

```text
Jsi release QA manager.

Rozhodni, zda může následující změna do produkce.

PR / Release summary:
[SUMMARY]

QA evidence:
[BUILD, LINT, TESTS, STAGING, LIGHTHOUSE, TRACKING, REVIEW]

Známá rizika:
[RIZIKA]

Rollback plán:
[ROLLBACK]

Kampaň nebo business kontext:
[KONTEXT]

Vyhodnoť:
| Gate | Evidence | Stav OK/Problem | Blokuje release? | Nutná akce |

Gates:
- build,
- lint/typecheck,
- tests,
- smoke test,
- tracking,
- Apple-like visual QA,
- performance,
- accessibility,
- security/secrets,
- rollback,
- monitoring/watchlist.

Finální verdikt:
- `release_approved`,
- `release_approved_with_watchlist`,
- `release_blocked`.
```

---

# 4. Performance, Lighthouse a Core UX audit

Performance QA pro marketingové weby není jen technická metrika. Pomalé načtení, layout shift, zpožděná CTA nebo těžký hero blok přímo snižují důvěru a konverzní potenciál. Tyto prompty proto vždy propojují technický problém s obchodním dopadem.

## 4.1 Lighthouse audit interpretace

```text
Jsi performance QA engineer a CRO reviewer.

Interpretuj následující Lighthouse nebo performance výstup a převeď ho na prioritizovaný plán oprav.

Performance data:
[LIGHTHOUSE REPORT / METRIKY / SCREENSHOT]

Stránka:
[URL / POPIS]

Business cíl stránky:
[KPI]

Výstup:
| Problém | Technická příčina | Dopad na UX/konverzi | Priorita | Doporučená oprava | Owner |

Zahrň:
1. LCP/hero oblast,
2. CLS/layout shift,
3. JS bundle a hydrataci,
4. obrázky/video,
5. fonty,
6. third-party skripty,
7. mobile dopad,
8. quick wins do 2 hodin,
9. větší refaktory.
```

## 4.2 Performance budget prompt

```text
Jsi QA architect pro performance budget.

Navrhni performance budget pro tento projekt.

Projekt:
[POPIS]

Typ stránky:
[LANDING / APP / CHECKOUT / DASHBOARD]

Cílové zařízení:
[MOBILE / DESKTOP / LOW-END / HIGH-END]

Business cíl:
[KPI]

Vytvoř budget pro:
- initial JS,
- CSS,
- obrázky,
- fonty,
- third-party skripty,
- LCP,
- CLS,
- interaction latency,
- počet requestů.

Výstup:
| Metrika | Cílová hodnota | Hard/Soft gate | Proč | Jak měřit |
```

---

# 5. Vizuální QA a Apple-like design kontrola

Vizuální QA musí chránit jednoduchost, důvěru a čitelnost. Není to subjektivní „líbí/nelíbí“. Výstup má říct, zda design podporuje jasnost nabídky, zda CTA vede pozornost správně a zda stránka nepůsobí levně nebo přeplácaně.

## 5.1 Apple-like visual QA review

```text
Jsi visual QA reviewer pro prémiový Apple-like web.

Zkontroluj návrh nebo staging stránku.

Vstup:
[SCREENSHOT POPIS / URL / DESIGN SPEC]

Cíl stránky:
[CÍL]

Primární CTA:
[CTA]

Hodnoť:
1. první dojem,
2. hierarchii obsahu,
3. whitespace,
4. typografii,
5. barvy a kontrast,
6. konzistenci komponent,
7. CTA viditelnost,
8. mobile layout,
9. vizuální šum,
10. důvěryhodnost.

Výstup:
| Oblast | Skóre 1–10 | Problém | Dopad | Doporučení | Blokuje PR? |

Na závěr napiš tři nejdůležitější úpravy před mergem.
```

## 5.2 Mobile-first QA prompt

```text
Jsi mobile QA reviewer.

Zkontroluj změnu z pohledu mobilního uživatele.

Změna:
[POPIS]

Dotčená stránka:
[URL / KOMPONENTA]

Primární mobilní akce:
[CTA / FORM / CHECKOUT]

Zkontroluj:
- viditelnost headline a CTA bez scrollu,
- velikost tap targetů,
- čitelnost textu,
- sticky prvky,
- formuláře,
- klávesnici a input states,
- horizontální scroll,
- modaly,
- performance na mobilu,
- tracking mobilních interakcí.

Výstup:
| Kontrola | Stav | Riziko | Oprava | Priorita |
```

---

# 6. Tracking, analytika a experiment QA

Marketingový experiment bez tracking plánu není experiment, ale náhodná změna. Tracking QA musí ověřit, že víme, co měříme, kde událost vzniká, jak se jmenuje a jak se vyhodnotí.

## 6.1 Tracking QA prompt

```text
Jsi tracking QA specialist.

Zkontroluj tracking plán pro následující marketingovou nebo produktovou změnu.

Změna:
[POPIS]

Hypotéza:
[HYPOTÉZA]

Primární KPI:
[KPI]

Navržené eventy:
[EVENTY]

Analytické nástroje:
[GA4 / POSTHOG / META PIXEL / ADS / INTERNÍ LOGY]

Zkontroluj:
1. zda KPI odpovídá hypotéze,
2. zda eventy měří skutečnou akci,
3. naming convention,
4. event properties,
5. UTM dopady,
6. duplicate firing,
7. consent/privacy rizika,
8. testovací postup,
9. dashboard návaznost,
10. rozhodovací pravidlo pro experiment.

Výstup:
| Event/KPI | Problém | Dopad na vyhodnocení | Oprava | Blokuje experiment? |
```

## 6.2 A/B experiment QA prompt

```text
Jsi experiment QA reviewer.

Ověř, zda je A/B test připravený k bezpečnému spuštění.

Experiment:
[NÁZEV]

Varianta A:
[CONTROL]

Varianta B:
[VARIANTA]

Hypotéza:
[HYPOTÉZA]

KPI:
[KPI]

Traffic source:
[TRAFFIC]

Zkontroluj:
- zda se mění jen jedna hlavní proměnná,
- zda je varianta implementačně stabilní,
- zda tracking rozlišuje varianty,
- zda nedochází ke konfliktu s jinými experimenty,
- zda existuje rollback,
- zda je jasné rozhodovací pravidlo.

Výstup:
| Kontrola | Stav | Riziko | Doporučení |

Finální verdikt: `ready_to_test`, `ready_after_fixes`, `not_ready`.
```

---

# 7. Bezpečnost, secrets a data risk QA

Autonomní agenti nesmí pracovat s tajnými hodnotami bez kontroly. Tento prompt používej u změn, které se dotýkají `.env`, API klíčů, autentizace, webhooků, plateb, produkčních dat nebo deployment konfigurace.

## 7.1 Secrets and config risk review

```text
Jsi security-conscious QA reviewer.

Zkontroluj změny z pohledu tajných hodnot, konfigurace a produkční bezpečnosti.

Vstup:
[DIFF / SOUBORY / PR SUMMARY]

Zaměř se na:
1. API klíče a tokeny,
2. `.env` a config soubory,
3. GitHub Secrets a Railway variables,
4. logování citlivých dat,
5. produkční databázové connection stringy,
6. webhook secrets,
7. CORS a veřejné endpointy,
8. client-side exposure tajných hodnot,
9. testovací mock data,
10. rollback rizika.

Výstup:
| Riziko | Důkaz | Dopad | Oprava | Blokuje merge? |

Pokud najdeš tajnou hodnotu v repozitáři, vrať okamžitě verdikt `block_merge_rotate_secret`.
```

---

# 8. Incident, rollback a post-release QA

Po releasu je cílem rychle poznat, zda se něco zhoršilo, a mít jednoduchý rollback plán. Incident prompt pomáhá standardizovat reakci bez chaosu.

## 8.1 Incident triage prompt

```text
Jsi incident commander a QA lead.

Vyhodnoť incident a navrhni okamžitý postup.

Incident:
[POPIS]

Časová osa:
[TIMELINE]

Dopad:
[UŽIVATELÉ / REVENUE / FUNNEL / DATA / BRAND]

Poslední releasy:
[COMMITS / PR / DEPLOY]

Dostupné metriky:
[ERROR RATE / LOGS / CONVERSION DROP / UPTIME]

Výstup:
| Oblast | Zjištění | Dopad | Doporučená akce | Owner |

Urči:
- severity P0–P3,
- pravděpodobný root cause,
- rollback/no-rollback doporučení,
- komunikační plán,
- follow-up tasky,
- prevenční opatření.
```

## 8.2 Post-release review prompt

```text
Jsi post-release QA reviewer.

Zhodnoť release po nasazení.

Release:
[RELEASE NOTES / PR]

Metriky po releasu:
[DEPLOY STATUS, ERROR RATE, KPI, CONVERSION, PERFORMANCE]

Předpokládaný dopad:
[HYPOTÉZA]

Zhodnoť:
1. zda release splnil technická očekávání,
2. zda se nezhoršila stabilita,
3. zda se nezhoršila konverze nebo UX,
4. zda tracking funguje,
5. zda je potřeba rollback,
6. jaké follow-up tasky založit.

Výstup:
| Kontrola | Výsledek | Evidence | Akce |

Finální stav: `healthy`, `watch`, `rollback_recommended`.
```

---

# 9. Univerzální QA agent prompt pro worktree

Tento prompt můžeš použít jako zadání pro izolovaného QA agenta v samostatné branchi nebo worktree. Hodí se pro PR review, staging QA i regresní kontrolu.

```text
Jsi autonomní QA agent pracující v izolované Git worktree branchi.

Tvůj úkol:
[ÚKOL]

Projektový kontext:
[PROJEKT]

Branch / PR:
[BRANCH / PR]

Primární KPI nebo release cíl:
[KPI / RELEASE GOAL]

Pravidla:
1. Neměň produkční logiku, pokud to není výslovně požadováno.
2. Nečti ani nevypisuj tajné hodnoty z `.env` nebo secrets.
3. Každý nález musí mít reprodukci nebo ověřitelný důkaz.
4. Rozlišuj blocking issues a non-blocking improvements.
5. Každé doporučení musí být malé, implementovatelné a připravené pro GitHub issue nebo PR komentář.
6. Pokud je změna marketingová, ověř hypotézu, KPI a tracking.
7. Pokud je změna designová, ověř Apple-like standard a mobile použitelnost.

Výstup:
- stručný executive summary,
- tabulka blocking issues,
- tabulka non-blocking improvements,
- provedené testy,
- neprovedené testy a proč,
- rizika,
- doporučený verdikt: `approve`, `approve_with_fixes`, `request_changes`,
- návrhy GitHub issues pro follow-up.
```

---

# 10. Minimální QA definice pro každý PR

Každý Pull Request v tomto kitu by měl mít alespoň jednoduchou QA evidenci. Pokud agent nemůže některou kontrolu provést, musí to explicitně říct a uvést riziko.

| QA evidence | Minimální standard |
|---|---|
| **Build** | Projekt se sestaví nebo agent vysvětlí, proč build nelze spustit. |
| **Lint/typecheck** | Nový diff nepřidává zjevné statické chyby. |
| **Smoke test** | Kritická cesta je ručně nebo automaticky ověřena. |
| **Mobile QA** | Klíčová stránka/funkce je použitelná na mobilním viewportu. |
| **Tracking QA** | Experiment nebo CTA má měřitelný event a KPI. |
| **Visual QA** | UI zachovává čistotu, kontrast, hierarchii a důvěru. |
| **Security QA** | Žádné secrets, tokeny ani produkční dumpy nejsou v diffu. |
| **Rollback** | PR obsahuje jednoduchý postup návratu zpět. |

Tento standard je záměrně praktický. Má chránit rychlost vývoje, nikoliv vytvořit byrokracii. Silný QA architekt drží vývoj plynulý tím, že včas rozlišuje skutečné blokery od drobných zlepšení.
