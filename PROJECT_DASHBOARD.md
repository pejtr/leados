# AI Project Dashboard

Projekt: `<PROJECT_NAME>`  
Owner: `<OWNER>`  
Aktualizováno: `<YYYY-MM-DD HH:MM>`

> Tento dashboard je lehký **Grafana-style operační panel** v Markdownu. Slouží jako společný přehled pro člověka, lokální agenty, Manus, GitHub PR review a Railway release management.

## Executive status

| Oblast | Stav | Poznámka |
|---|---|---|
| Produkce | Green / Yellow / Red | `<production_status>` |
| Staging | Green / Yellow / Red | `<staging_status>` |
| Aktivní agenti | `<count>` | `<active_agents_summary>` |
| Otevřené PR | `<count>` | `<prs_summary>` |
| QA blokery | `<count>` | `<qa_blockers_summary>` |
| Hlavní KPI | `<metric>` | `<metric_value_and_trend>` |

## Agent activity

| Agent | Role | Branch / Worktree | Task | Status | PR | Next review |
|---|---|---|---|---|---|---|
| `frontend_implementer` | Implementace UI a funkcí | `agent/frontend/...` | `<task>` | Planned / Running / PR / Done / Blocked | `<url>` | `<reviewer>` |
| `apple_like_ui_designer` | Prémiový UI review | `agent/apple-like-ui/...` | `<task>` | Planned / Running / PR / Done / Blocked | `<url>` | `<reviewer>` |
| `cro_analyst` | Hypotézy a KPI | `agent/cro/...` | `<task>` | Planned / Running / PR / Done / Blocked | `<url>` | `<reviewer>` |
| `qa_brand_reviewer` | QA, design, copy, tracking | `agent/qa/...` | `<task>` | Planned / Running / PR / Done / Blocked | `<url>` | `<reviewer>` |

## QA gates

| Gate | Stav | Evidence | Blokuje release |
|---|---|---|---|
| Build | Pass / Fail / N/A | `<ci_url_or_command>` | Ano |
| Lint / typecheck | Pass / Fail / N/A | `<ci_url_or_command>` | Ano |
| Smoke test | Pass / Fail / N/A | `<result>` | Ano pro core flow |
| Tracking QA | Pass / Fail / N/A | `<event_plan>` | Ano pro experimenty |
| Apple-like design review | Pass / Warning / Fail | `<review_summary>` | Podle rozsahu |
| Performance / Lighthouse | Pass / Warning / Fail | `<score_or_url>` | Podle dopadu |
| Rollback plan | Pass / Fail | `<rollback_note>` | Ano |

## Marketing performance

| KPI | Aktuální hodnota | Trend | Cíl | Poznámka |
|---|---:|---|---:|---|
| CTR | `<value>` | Up / Flat / Down | `<target>` | `<note>` |
| CVR | `<value>` | Up / Flat / Down | `<target>` | `<note>` |
| Leads | `<value>` | Up / Flat / Down | `<target>` | `<note>` |
| Purchases | `<value>` | Up / Flat / Down | `<target>` | `<note>` |
| Revenue | `<value>` | Up / Flat / Down | `<target>` | `<note>` |
| ROAS | `<value>` | Up / Flat / Down | `<target>` | `<note>` |

## Experiment board

| Experiment | Hypotéza | Branch | KPI | Varianta | Status | Výsledek |
|---|---|---|---|---|---|---|
| `<experiment_name>` | `<hypothesis>` | `experiment/cvr/...` | CVR | A/B | Running | `<result>` |

## Kanban / JIRA-style delivery board

| Work item | Type | Status | Owner / Agent | Branch / PR | Priority | Blocker | Next action |
|---|---|---|---|---|---|---|---|
| `<issue_title>` | Epic / Story / Task / QA / DevOps / Release | Backlog / Ready / In Progress / PR / Staging / Ready to Merge / Done / Blocked | `<owner>` | `<branch_or_pr>` | P0/P1/P2/P3 | `<blocker_or_none>` | `<next_action>` |

## DevOps flow metrics

| Metrika | Aktuální hodnota | Trend | Riziko | Akce |
|---|---:|---|---|---|
| WIP | `<count>` | Up / Flat / Down | `<risk>` | `<action>` |
| Review time | `<duration>` | Up / Flat / Down | `<risk>` | `<action>` |
| Blocked time | `<duration>` | Up / Flat / Down | `<risk>` | `<action>` |
| Deploy frequency | `<count>` | Up / Flat / Down | `<risk>` | `<action>` |
| Rework rate | `<percent>` | Up / Flat / Down | `<risk>` | `<action>` |

## Release board

| Release | Branch | PR | Staging URL | Railway status | Risk | Decision |
|---|---|---|---|---|---|---|
| `vYYYY.MM.DD-area` | `staging` | `<url>` | `<url>` | Pass / Fail | Low / Medium / High | Ship / Hold / Rollback |

## Incident & rollback log

| Datum | Incident | Severity | Dopad | Akce | Owner | Status |
|---|---|---|---|---|---|---|
| `<date>` | `<incident>` | P0/P1/P2/P3 | `<impact>` | `<action>` | `<owner>` | Open / Resolved |

## Next best actions

| Priorita | Akce | Důvod | Owner | Deadline |
|---|---|---|---|---|
| P1 | `<action>` | `<why>` | `<owner>` | `<date>` |
| P2 | `<action>` | `<why>` | `<owner>` | `<date>` |
| P3 | `<action>` | `<why>` | `<owner>` | `<date>` |
