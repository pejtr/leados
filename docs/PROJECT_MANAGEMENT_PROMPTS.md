# Project Management Prompt Pack: JIRA, Kanban a DevOps styl řízení vývoje

Autor: **Manus AI**

Tento dokument doplňuje lokální **AI Core Brain** kit o praktický systém promptů pro řízení vývoje ve stylu **JIRA/Kanban/DevOps**. Není cílem zavést těžkou enterprise byrokracii. Cílem je převést autonomní a paralelní práci agentů na přehledné epics, stories, tasks, bugy, releases, board statusy, flow metriky a jasná rozhodnutí pro Pull Request, staging a produkci.

> Základní princip: **každý vývojový úkol musí být malý, měřitelný, reviewovatelný, přiřaditelný konkrétnímu agentovi nebo ownerovi a propojený s GitHub branchí, PR, QA evidencí a release stavem.**

## Doporučený management model

Kit používá GitHub jako source of truth, ale prompty jsou psané tak, aby šly použít i v JIRA, Linear, Notion, GitHub Projects nebo Markdown dashboardu. JIRA/Kanban styl zde znamená hlavně jasnou strukturu práce: backlog, ready, in progress, review, staging, ready to merge, done a blocked.

| Vrstva řízení | Účel | Doporučený artefakt |
|---|---|---|
| **Strategy / Roadmap** | Rozhodnout, co má obchodní a technickou prioritu. | Initiative, roadmap note, quarterly theme. |
| **Epic** | Spojit větší cíl do logických balíků práce. | JIRA Epic nebo GitHub issue s `type:epic`. |
| **Story / Task** | Popsat malý implementovatelný kus práce. | User story, engineering task, agent task. |
| **Bug / Incident** | Řídit opravy, dopad a prevenci. | Bug issue, incident log, postmortem. |
| **Kanban board** | Řídit tok práce a WIP limity. | Board columns, labels, dashboard. |
| **Release board** | Řídit staging, produkci a rollback. | PR, release notes, changelog. |
| **DevOps pipeline** | Hlídá build, testy, deploy a monitoring. | CI/CD checklist, release gate, incident watchlist. |

## Doporučené statusy pro Kanban board

| Status | Význam | Exit criteria |
|---|---|---|
| **Backlog** | Nápad nebo požadavek bez závazku. | Má popsaný problém, business cíl a ownera pro triage. |
| **Ready** | Připravené pro agenta nebo vývojáře. | Má acceptance criteria, scope, prioritu a QA očekávání. |
| **Agent Running / In Progress** | Aktivně se pracuje v branchi/worktree. | Existuje branch, owner a průběžný výstup. |
| **PR / Review** | Změna čeká na review. | PR obsahuje testy, rizika, rollback a QA evidence. |
| **Staging** | Změna je nasazená v předprodukci. | Smoke test, vizuální QA a tracking sanity check jsou hotové. |
| **Ready to Merge** | Změna může do main. | Hard gates prošly a rizika jsou akceptovaná. |
| **Done** | Hotovo a ověřeno. | Release je nasazený nebo task uzavřený s výsledkem. |
| **Blocked** | Nelze pokračovat. | Blokátor má ownera, deadline a další krok. |

---

# 1. Epics, initiatives a roadmap

Epic by měl existovat pouze tehdy, když sdružuje více menších tasků pod jeden jasný outcome. Pokud je úkol menší než jeden až dva dny práce, pravděpodobně nepotřebuje epic, ale dobře napsaný task.

## 1.1 Tvorba epicu ve stylu JIRA

```text
Jsi senior product manager a delivery lead.

Vytvoř JIRA-style epic pro následující iniciativu.

Iniciativa:
[POPIS INICIATIVY]

Business cíl:
[CÍL / KPI]

Produktový kontext:
[PRODUKT, CÍLOVKA, TRH]

Technický kontext:
[STACK, OMEZENÍ, DEPLOY, INTEGRACE]

Vytvoř epic ve formátu:
- Epic title:
- Problem statement:
- Desired outcome:
- Business KPI:
- Non-goals:
- Scope:
- Assumptions:
- Dependencies:
- Risks:
- Definition of Done:
- Release strategy:

Poté rozpadni epic na 5–12 stories/tasks v tabulce:
| Issue type | Title | Goal | Owner/Agent | Priority | Estimate | Dependencies | Acceptance criteria |
```

## 1.2 Roadmap prioritizace

```text
Jsi product strategist a engineering delivery manager.

Prioritizuj následující backlog nebo roadmapu.

Backlog:
[SEZNAM EPICŮ / TASKŮ / EXPERIMENTŮ]

Omezení:
[TÝM, ČAS, ROZPOČET, TECHNICKÝ DLUH, KAMPAŇ]

Strategické cíle:
[CÍLE]

Použij scoring podle:
- business impact,
- user impact,
- risk reduction,
- effort,
- confidence,
- urgency,
- dependencies.

Výstup:
| Rank | Item | Typ | Impact | Effort | Confidence | Urgency | Dependencies | Doporučení |

Na závěr navrhni realistický plán pro nejbližší 2 týdny a odděl `must-have`, `should-have`, `later`.
```

---

# 2. User stories, engineering tasks a acceptance criteria

Dobrá user story nemá popisovat jen funkci. Musí říct, kdo ji potřebuje, proč ji potřebuje, jak poznáme, že je hotová, a jaké QA nebo release riziko s sebou nese.

## 2.1 User story generator

```text
Jsi product owner a QA architekt.

Vytvoř user story pro následující požadavek.

Požadavek:
[POŽADAVEK]

Cílový uživatel:
[PERSONA]

Business cíl:
[KPI / OUTCOME]

Technický kontext:
[STACK / SYSTÉM / OMEZENÍ]

Vrať výstup ve formátu:
- Title:
- User story: Jako [persona] chci [capability], abych [benefit].
- Context:
- Scope:
- Out of scope:
- Acceptance criteria:
- QA notes:
- Tracking notes:
- Dependencies:
- Risks:
- Suggested labels:
- Suggested priority:
- Suggested branch name:

Acceptance criteria napiš jako tabulku:
| AC ID | Kritérium | Ověření | Blokuje release? |
```

## 2.2 Engineering task z nejasného zadání

```text
Jsi engineering manager.

Převeď nejasné zadání na implementovatelný engineering task pro AI agenta nebo vývojáře.

Nejasné zadání:
[TEXT]

Repozitář / projekt:
[PROJEKT]

Technická omezení:
[OMEZENÍ]

Vytvoř task, který obsahuje:
1. krátký title,
2. problém,
3. cíl,
4. přesný scope,
5. out-of-scope,
6. navržený owner/agent,
7. branch naming,
8. acceptance criteria,
9. testovací příkazy,
10. rizika,
11. rollback,
12. PR checklist.

Pokud zadání není dostatečné, vypiš pouze kritické otázky, které blokují task readiness.
```

## 2.3 Splitting tasku pro paralelní agenty

```text
Jsi delivery architect pro multi-agent vývoj.

Rozděl následující větší úkol na malé nezávislé tasky tak, aby mohly běžet paralelně v Git worktree bez konfliktů.

Velký úkol:
[POPIS]

Repozitář:
[STRUKTURA / STACK / DOTČENÉ OBLASTI]

Omezení:
[ČAS, PRIORITY, QA, DEPLOY]

Vytvoř tabulku:
| Task | Agent | Branch | Dotčené soubory/oblasti | Vstup | Výstup | Dependencies | Riziko konfliktu | QA |

Pravidla:
- každý task musí být reviewovatelný samostatně,
- minimalizuj překryv souborů,
- design/copy/QA tasks odděl od implementace,
- každý task musí mít jasný PR výstup,
- tasky s vysokým konfliktem označ jako sekvenční.
```

---

# 3. Backlog grooming a triage

Backlog grooming je filtr proti chaosu. Cílem není mít mnoho issues, ale mít jasné issues, které jsou připravené na realizaci. Každý backlog item by měl být buď připravený, sloučený s podobným itemem, přeformulovaný, nebo odložený.

## 3.1 Backlog grooming prompt

```text
Jsi product operations manager.

Proveď backlog grooming následujících issues.

Issues:
[SEZNAM ISSUES]

Aktuální cíle sprintu nebo týdne:
[CÍLE]

Kapacita:
[KAPACITA / AGENTI / LIDÉ]

U každého issue rozhodni:
- ponechat,
- rozdělit,
- sloučit,
- přeformulovat,
- odložit,
- zavřít.

Výstup:
| Issue | Stav po groomingu | Důvod | Nový title | Chybějící informace | Priorita | Doporučený owner |

Na závěr vytvoř seznam `Ready for agent` tasků s branch names.
```

## 3.2 Triage nové issue

```text
Jsi JIRA/GitHub triage manager.

Zatřiď následující issue.

Issue:
[TEXT ISSUE]

Projektové cíle:
[CÍLE]

Aktuální release kontext:
[RELEASE / KAMPAŇ / HOTFIX]

Urči:
- issue type,
- priority P0–P3,
- severity, pokud jde o bug,
- owner/agent,
- labels,
- status,
- zda je issue ready,
- chybějící informace,
- acceptance criteria,
- recommended next action.

Výstup jako tabulka a následně návrh finálního issue textu.
```

---

# 4. Sprint planning a delivery management

I když kit preferuje lehký Kanban, sprint planning je užitečný pro týdenní nebo dvoutýdenní fokus. Sprint by měl obsahovat jen tolik práce, kolik lze skutečně dokončit přes PR, QA, staging a release.

## 4.1 Sprint planning prompt

```text
Jsi delivery manager pro AI-assisted software development.

Naplánuj sprint z následujícího backlogu.

Backlog:
[BACKLOG]

Sprint cíl:
[CÍL]

Kapacita:
[LIDÉ / AGENTI / ČAS]

Omezení:
[DOVOLENÉ, DEADLINE, TECHNICKÝ DLUH, KAMPAŇ]

Pravidla:
- neplánuj víc práce, než lze projít přes PR a QA,
- každá položka musí mít ownera,
- každý agentní task musí mít branch,
- každá release položka musí mít QA gate,
- ponech rezervu na bugy a review.

Výstup:
| Sprint item | Typ | Owner/Agent | Priority | Estimate | Branch | QA gate | Dependency | Definition of Done |

Na závěr napiš sprint goal, rizika a daily review rutinu.
```

## 4.2 Daily standup summary

```text
Jsi delivery lead.

Vytvoř stručné daily standup shrnutí z následujících dat.

Vstupy:
- Aktivní branche:
[BRANCHES]
- PR:
[PRS]
- Issues:
[ISSUES]
- QA gates:
[QA]
- Deploy status:
[DEPLOY]
- Blockery:
[BLOCKERS]

Výstup:
1. Co bylo dokončeno včera.
2. Co běží dnes.
3. Co je blokované.
4. Co vyžaduje lidské rozhodnutí.
5. Největší release riziko.
6. Doporučené top 3 akce pro dnešek.

Na závěr vrať tabulku:
| Priorita | Akce | Owner | Deadline | Důvod |
```

## 4.3 Retrospektiva a zlepšení procesu

```text
Jsi agile coach a DevOps improvement lead.

Vytvoř retrospektivu za poslední sprint nebo release cyklus.

Data:
[PR, ISSUES, INCIDENTY, QA BLOKERY, DEPLOY, METRIKY]

Zhodnoť:
- co fungovalo,
- co nefungovalo,
- kde vznikal waiting time,
- kde byly rework a regresní chyby,
- které agentní úkoly byly dobře připravené,
- které tasky byly špatně definované,
- jak zlepšit QA gates,
- jak zlepšit branch/PR workflow.

Výstup:
| Insight | Evidence | Dopad | Akce | Owner | Priorita |

Na závěr napiš 3 konkrétní procesní změny pro další sprint.
```

---

# 5. Kanban board management a flow metriky

Kanban řízení není jen přesouvání kartiček. Hlavní hodnota je sledovat flow: kolik práce je rozpracované, kde vznikají blokery, jak dlouho trvá review a zda se práce skutečně dokončuje.

## 5.1 Kanban board audit

```text
Jsi Kanban flow manager.

Proveď audit boardu.

Board data:
[SEZNAM KARET SE STATUSY, OWNERY, DATY, PR, BLOKERY]

WIP limity:
[WIP LIMITS]

Zhodnoť:
1. příliš mnoho rozpracované práce,
2. stalled tasks,
3. tasks bez ownera,
4. tasks bez acceptance criteria,
5. PR čekající příliš dlouho,
6. staging bottleneck,
7. QA bottleneck,
8. blokery bez dalšího kroku,
9. práce, která by měla být rozdělena,
10. práce, která by měla být zavřena.

Výstup:
| Karta | Problém flow | Dopad | Doporučená akce | Owner | Deadline |

Na závěr napiš nové WIP limity a top 5 board cleanup akcí.
```

## 5.2 Blocker analysis

```text
Jsi delivery unblocker.

Analyzuj blokované úkoly a navrhni konkrétní odblokování.

Blocked items:
[SEZNAM]

Kontext:
[SPRINT / RELEASE / KAMPAŇ]

U každého blockeru urč:
- typ blokace: rozhodnutí, technická závislost, přístup, review, QA, externí služba, scope nejasnost,
- ownera,
- další konkrétní krok,
- deadline,
- escalation path,
- zda lze pracovat na paralelním fallback tasku.

Výstup:
| Blocker | Typ | Owner | Next action | Deadline | Escalate? | Fallback |
```

## 5.3 Flow metrics summary

```text
Jsi DevOps flow analyst.

Vytvoř přehled flow metrik z boardu a PR dat.

Data:
[ISSUES, STATUS HISTORIE, PR, REVIEW ČASY, DEPLOY ČASY]

Zhodnoť:
- cycle time,
- lead time,
- review time,
- deploy frequency,
- blocked time,
- WIP,
- rework rate,
- incident rate.

Výstup:
| Metrika | Hodnota | Interpretace | Riziko | Doporučená akce |

Na závěr napiš, kde je největší bottleneck a jak ho odstranit během příštího týdne.
```

---

# 6. DevOps, CI/CD a release management

DevOps styl zde znamená, že každá změna má cestu od issue přes branch, PR, CI, staging, release, monitoring a rollback. AI agent nesmí být jen autor změny; musí také dodat důkaz, že změna prošla pipeline.

## 6.1 DevOps pipeline review

```text
Jsi DevOps delivery reviewer.

Zkontroluj pipeline a release připravenost pro tento projekt.

Pipeline:
[CI/CD POPIS / GITHUB ACTIONS / RAILWAY / DOCKER / TESTY]

Aktuální release:
[RELEASE SCOPE]

Zhodnoť:
1. trigger pravidla,
2. branch protection,
3. build kroky,
4. test kroky,
5. environment variables a secrets,
6. staging deploy,
7. production deploy,
8. rollback,
9. monitoring,
10. incident response.

Výstup:
| Oblast | Aktuální stav | Riziko | Doporučení | Priorita |

Na závěr vytvoř minimální CI/CD Definition of Done.
```

## 6.2 Release notes generator

```text
Jsi release manager.

Vytvoř release notes z následujících PR a commitů.

PR/commity:
[SEZNAM]

Release typ:
[FEATURE / FIX / EXPERIMENT / HOTFIX / DESIGN / QA]

Audience:
[INTERNÍ / ZÁKAZNÍCI / STAKEHOLDER / TECHNICKÝ TÝM]

Výstup:
- Release title:
- Release date:
- Summary:
- New features:
- Fixes:
- UX/design changes:
- Tracking/analytics changes:
- QA evidence:
- Known risks:
- Rollback plan:
- Monitoring watchlist:

Pokud je audience zákazník, odstraň interní technické detaily a piš jasně, stručně a bez žargonu.
```

## 6.3 Changelog generator

```text
Jsi changelog editor.

Převeď následující commity na čistý changelog.

Commity:
[COMMITS]

Verze:
[VERSION]

Pravidla:
- seskup podle Added, Changed, Fixed, Removed, Security, Internal,
- nepřepisuj technické detaily do marketingových slibů,
- zmiň breaking changes, pokud existují,
- u experimentů zmiň KPI a tracking.

Výstup ve formátu Markdown.
```

## 6.4 Incident management prompt

```text
Jsi DevOps incident manager.

Vytvoř incident ticket a akční plán.

Incident:
[POPIS]

Dopad:
[UŽIVATELÉ / KPI / REVENUE / DATA / BRAND]

Metriky/logy:
[DATA]

Poslední změny:
[RELEASES / PR / COMMITS]

Výstup:
- Incident title:
- Severity:
- Status:
- Impact:
- Timeline:
- Suspected root cause:
- Immediate mitigation:
- Rollback recommendation:
- Communication plan:
- Follow-up tasks:
- Prevention actions:

Na závěr rozpadni follow-up tasks na JIRA/GitHub issues.
```

---

# 7. Project dashboard a reporting

Projektový dashboard je manažerská vrstva nad GitHubem. Má rychle ukázat, co běží, co blokuje release, co čeká na review a kde je největší riziko. Tento prompt pomáhá udržet dashboard jako živý dokument.

## 7.1 Aktualizace AI project dashboardu

```text
Jsi project operations assistant.

Aktualizuj Markdown projektový dashboard podle následujících dat.

Aktuální dashboard:
[DASHBOARD]

Nová data:
[BRANCHES, PR, ISSUES, QA, DEPLOY, INCIDENTS, KPI]

Aktualizuj sekce:
1. executive status,
2. agent activity,
3. QA gates,
4. marketing performance,
5. experiment board,
6. release board,
7. incident log,
8. next best actions.

Výstup vrať jako kompletní nový Markdown dashboard.

Pravidla:
- zvýrazni P0/P1 rizika,
- u každého blockeru uveď ownera,
- next actions musí být konkrétní,
- nepřidávej neověřená čísla,
- pokud data chybí, napiš `unknown` a navrhni, jak je získat.
```

## 7.2 Stakeholder status report

```text
Jsi delivery manager.

Vytvoř stakeholder status report za aktuální týden.

Data:
[SPRINT, PR, ISSUES, RELEASES, QA, INCIDENTS, KPI]

Audience:
[CEO / PRODUCT / ENGINEERING / MARKETING / CLIENT]

Report struktura:
1. Executive summary.
2. Progress against goal.
3. Shipped changes.
4. Current risks.
5. Blockers requiring decision.
6. QA/release status.
7. Next week focus.

Výstup piš profesionálně, stručně a bez technického šumu, pokud audience není engineering.
```

---

# 8. Prompt pro autonomního project manager agenta

Tento prompt může běžet jako samostatný agent, který pravidelně čte dashboard, issues, branche, PR a QA výstupy a navrhuje další kroky. V lokálním režimu jej pouštěj ručně nebo jako součást denní rutiny; pro trvalé automatizace používej až promyšlenou perzistentní architekturu.

```text
Jsi autonomní AI project manager pro lokální multi-agent vývoj.

Tvůj úkol:
[ÚKOL]

Projektový kontext:
[PROJEKT]

Dostupná data:
[ISSUES, PR, BRANCHES, QA REPORTS, DASHBOARD, RELEASES]

Pracovní pravidla:
1. GitHub je source of truth.
2. Nepřesouvej práci do `Done`, pokud neexistuje PR/release/QA evidence.
3. Každý agentní task musí mít ownera, branch a acceptance criteria.
4. Každý blocker musí mít konkrétní next action.
5. Nerozšiřuj scope sprintu bez explicitního důvodu.
6. Prioritizuj P0/P1, release blokery a úkoly s vysokým dopadem na KPI.
7. Rozlišuj engineering, QA, marketing, design a DevOps práci.

Výstup:
- executive summary,
- board cleanup návrhy,
- top 5 priorit,
- blocked items a unblock plán,
- recommended agent tasks,
- release readiness,
- rizika,
- konkrétní GitHub/JIRA issue texty k založení.
```

---

# 9. Standard Definition of Ready a Definition of Done

Aby mohl agent pracovat efektivně, task musí být připravený. Aby mohl být task hotový, musí projít kontrolou. Tyto definice drží kvalitu bez zbytečné byrokracie.

| Stav | Minimální kritéria |
|---|---|
| **Definition of Ready** | Task má cíl, ownera/agenta, scope, out-of-scope, acceptance criteria, prioritu, rizika a očekávaný QA postup. |
| **Definition of Done** | Kód nebo dokumentace je hotová, PR obsahuje testy/rizika/rollback, QA gates prošly nebo mají zdůvodněnou výjimku, staging je ověřený, dashboard nebo issue je aktualizovaný. |
| **Definition of Shipped** | Změna je v produkci nebo releasu, monitoring/watchlist je nastavený, incident rizika jsou přijatá a výsledek je dohledatelný. |

## Univerzální DoR/DoD prompt

```text
Jsi QA architekt a delivery manager.

Zkontroluj, zda je task připravený k práci a zda může být po dokončení uzavřen.

Task:
[TASK]

PR / Evidence:
[PR, QA, TESTY, STAGING, RELEASE]

Vyhodnoť:
| Kritérium | Ready? | Done? | Chybí | Doporučená akce |

Na závěr vrať:
- `ready_for_agent`, `not_ready`,
- `done`, `not_done`,
- seznam blokujících chybějících informací.
```

---

# 10. Doporučený denní DevOps/Kanban rytmus

Tento rytmus je vhodný pro lokální vývoj na MacBooku s více agenty. Ráno se rozhoduje, odpoledne se reviewuje, večer se merguje pouze to, co prošlo kontrolami. Vše ostatní zůstává ve stavu PR, Staging nebo Blocked.

| Čas | Aktivita | Výstup |
|---|---|---|
| **Ráno** | Dashboard, PR, QA gates, blockery. | Top 3 priority dne. |
| **Dopoledne** | Spuštění agentů v worktree. | Agent branches a průběžné výstupy. |
| **Odpoledne** | PR review, QA, staging smoke test. | Verdikt merge/request changes. |
| **Před releasem** | Release readiness, rollback, monitoring. | Go/no-go rozhodnutí. |
| **Konec dne** | Board cleanup, dashboard update. | Přehled na další den. |

Tento prompt pack může fungovat jako lehký JIRA/Kanban systém i bez plnohodnotného projektového nástroje. Pokud později přidáš JIRA, GitHub Projects nebo jiný board, struktura promptů zůstane stejná: přesný typ issue, stav, owner, priorita, acceptance criteria, QA evidence a release návaznost.
