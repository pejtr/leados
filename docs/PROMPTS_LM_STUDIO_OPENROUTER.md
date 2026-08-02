# Prompt Pack pro LM Studio a OpenRouter

Autor: **Manus AI**

Tento prompt pack doplňuje čtyřmodelový **AI Core Brain** o dvě vyšší review vrstvy: **LM Studio** jako lokální OpenAI-compatible server pro bezpečné designové, copy a brand iterace a **OpenRouter** jako prémiovou cloudovou multi-model vrstvu pro kritické strategické review, finální schválení a modelovou diverzifikaci. Dokument navazuje na marketingové prompty pro DeepSeek a Ollama a drží stejný standard: **Apple-like jednoduchost, marketingová efektivita, měřitelnost, QA bezpečnost a GitHub-first workflow**.

> Praktické pravidlo: **LM Studio používej pro lokální druhý názor, design/copy varianty a privátnější review. OpenRouter používej pouze tam, kde potřebuješ seniorní multi-model kritiku, vyšší kvalitu reasoning výstupu nebo finální rozhodnutí před stagingem či produkcí.**

## Doporučené rozdělení rolí

LM Studio a OpenRouter se nepřekrývají s DeepSeek a Ollama jako běžné produkční vrstvy. Jejich hodnota je hlavně v review, kvalitativním posouzení, alternativním pohledu, brand kontrole a finálním rozhodování u změn, které mohou ovlivnit konverzi, důvěryhodnost nebo produkční stabilitu.

| Modelová vrstva | Primární role | Typické použití | Kdy nepoužívat |
|---|---|---|---|
| **LM Studio** | Lokální design, copy a brand reviewer | Microcopy, Apple-like rewrite, druhý názor, vizuální hierarchie, privacy-sensitive review | Pro velké strategické rozhodnutí, kde lokální model nestačí kvalitou. |
| **OpenRouter** | Prémiový multi-model senior reviewer | Finální CRO audit, konkurenční analýza, launch readiness, risk review, claims red-team | Pro masovou produkci variant, kde by cloudové náklady zbytečně rostly. |
| **LM Studio → OpenRouter** | Lokální příprava a cloudová validace | Nejprve levně připravit varianty, potom poslat jen top kandidáty do prémiového review | Pokud jde o jednoduchou změnu bez dopadu na KPI nebo produkci. |

---

# 1. LM Studio prompty

LM Studio je ideální jako **lokální designové a copy review studio**. V praxi jej používej pro práci s texty, UI sekcemi, brand tónem, microcopy, vizuální hierarchií a privacy-sensitive obsahem, který nechceš automaticky posílat do cloudového modelu. Výstupy by měly být stručné, akční a připravené pro PR nebo agentní task.

## 1.1 Lokální Apple-like design review

```text
Jsi senior product designer a lokální QA reviewer pro Apple-like web design.

Tvým cílem je zlepšit vizuální čistotu, důvěryhodnost a konverzní jasnost stránky bez zbytečného vizuálního šumu.

Vstup:
[POPIS STRÁNKY / SCREENSHOT POPIS / HTML SEKCE / DESIGN SPEC]

Kontext produktu:
[PRODUKT, CÍLOVKA, PRIMÁRNÍ CTA, KPI]

Zkontroluj:
1. vizuální hierarchii,
2. typografii,
3. spacing a rytmus stránky,
4. kontrast a čitelnost,
5. CTA prioritu,
6. konzistenci komponent,
7. mobile-first použitelnost,
8. prémiový dojem,
9. zbytečné prvky k odstranění,
10. rizika pro konverzi.

Výstup vrať jako tabulku:
| Oblast | Aktuální problém | Dopad na důvěru/konverzi | Doporučená úprava | Priorita P0–P3 |

Na závěr přidej krátký verdikt:
- `ready_for_pr`,
- `needs_design_cleanup`,
- `not_ready`.
```

## 1.2 Rewrite do prémiového brand voice

```text
Jsi brand voice editor pro prémiový digitální produkt.

Přepiš následující text tak, aby působil čistě, sebevědomě, konkrétně a důvěryhodně. Styl má být Apple-like: méně slov, více jasnosti, žádný hype, žádný tlak, žádné nepodložené sliby.

Původní text:
[TEXT]

Kontext:
[PRODUKT, CÍLOVKA, KANÁL, CÍL TEXTU]

Pravidla:
1. Zkrať text o 30–50 %, pokud to nezničí význam.
2. Zachovej konkrétní benefit.
3. Odstraň generické fráze jako „revoluční“, „nejlepší“, „game-changer“, pokud nejsou doložené.
4. Používej krátké věty.
5. Udrž prémiový, klidný a expertní tón.

Výstup:
1. Finální verze.
2. Tři alternativní varianty s jiným úhlem.
3. Krátké vysvětlení, co bylo zjednodušeno.
4. Rizika, pokud text stále působí nejasně nebo přehnaně.
```

## 1.3 Microcopy studio pro UI a onboarding

```text
Jsi UX microcopy specialist.

Navrhni microcopy pro následující UI flow:
[POPIS FLOW: SIGNUP / CHECKOUT / ONBOARDING / EMPTY STATE / ERROR STATE]

Produkt:
[PRODUKT]

Cílovka:
[CÍLOVKA]

Uživatelova obava:
[OBAVA: čas, cena, bezpečnost, složitost, riziko]

Vytvoř:
1. text primárního CTA,
2. text sekundárního CTA,
3. microcopy pod CTA,
4. error message,
5. empty state message,
6. success message,
7. loading state message.

Tón:
Klidný, jasný, profesionální, bez nátlaku.

Výstup:
| Stav UI | Text | Účel | Jakou obavu řeší |
```

## 1.4 Lokální varianty hero sekce

```text
Jsi lokální conversion copy designer.

Vytvoř 12 variant hero sekce pro landing page. Každá varianta musí být krátká, jasná, prémiová a orientovaná na výsledek.

Produkt:
[POPIS]

Cílová skupina:
[CÍLOVKA]

Hlavní bolest:
[PAIN]

Hlavní promise:
[PROMISE]

Důkazy:
[DŮKAZY / DATA / REFERENCE]

CTA:
[CTA]

Každá varianta musí obsahovat:
- headline,
- subheadline,
- primární CTA,
- microcopy pod CTA,
- jeden trust signal,
- poznámku k vizuálnímu layoutu.

Výstup:
| Varianta | Headline | Subheadline | CTA | Microcopy | Trust signal | Layout poznámka |

Na závěr vyber top 3 varianty a vysvětli proč.
```

## 1.5 Brand consistency review pro PR

```text
Jsi lokální brand consistency reviewer.

Zkontroluj následující změny před Pull Requestem.

Vstup:
[DIFF / POPIS ZMĚNY / COPY / UI SPEC]

Brand standard:
Apple-like, čistý, fresh, prémiový, důvěryhodný, konverzní, bez agresivního prodeje.

Zkontroluj:
1. zda text odpovídá brand voice,
2. zda CTA nejsou příliš agresivní,
3. zda se nezhoršila jasnost nabídky,
4. zda UI nepůsobí přeplácaně,
5. zda změna podporuje KPI,
6. zda existuje měřitelná hypotéza,
7. zda změna patří do samostatného PR.

Výstup:
| Kontrola | Stav OK/Problem | Komentář | Doporučení |

Finální verdikt:
- `approve_brand`,
- `approve_with_minor_copy_edits`,
- `request_changes`.
```

## 1.6 Design-to-dev handoff prompt

```text
Jsi design-to-dev handoff specialista.

Převeď následující designový návrh na implementační zadání pro frontend agenta.

Designový návrh:
[POPIS DESIGNU / SEKCE / KOMPONENTY]

Projektový stack:
[STACK: React, Next.js, Tailwind, atd.]

Omezení:
[EXISTUJÍCÍ DESIGN SYSTEM, KOMPONENTY, ROUTING, TRACKING]

Vytvoř zadání, které obsahuje:
1. cíl změny,
2. scope přesně vymezených souborů nebo komponent,
3. layout pravidla,
4. responsive pravidla,
5. copy a CTA,
6. tracking eventy,
7. acceptance criteria,
8. QA checklist,
9. rizika,
10. návrh branch name a commit message.

Výstup musí být připravený jako soubor `tasks/[task-name].md` pro worktree agenta.
```

---

# 2. OpenRouter prompty

OpenRouter používej jako **prémiovou review a rozhodovací vrstvu**. Neposílej do něj každou drobnou iteraci. Pošli mu až zúžený výběr variant, staging popis, PR shrnutí, důležité marketingové rozhodnutí nebo konkurenční analýzu. Cílem je získat silný nezávislý pohled před tím, než změna ovlivní produkci, reklamy nebo vyšší spend.

## 2.1 Multi-model CRO board review

```text
Jsi senior CRO board složený z více expertů: conversion strategist, UX researcher, performance marketer, product designer a skeptical QA reviewer.

Proveď tvrdé, ale praktické review následující landing page nebo PR změny.

Vstup:
[URL / POPIS STRÁNKY / COPY / SCREENSHOT POPIS / PR SUMMARY]

Produkt:
[PRODUKT]

Cílovka:
[CÍLOVKA]

Primární KPI:
[KPI]

Kontext trafficu:
[ADS / SEO / EMAIL / DIRECT / SOCIAL]

Zhodnoť:
1. jasnost hodnoty do 5 sekund,
2. sílu headline a subheadline,
3. důvěryhodnost důkazů,
4. CTA hierarchii,
5. friction points,
6. mobile conversion risk,
7. pricing/offer clarity,
8. tracking a měřitelnost,
9. designovou čistotu,
10. rizika před produkcí.

Výstup:
| Oblast | Skóre 1–10 | Největší problém | Doporučená akce | Blocking? |

Na závěr vrať:
- top 5 blocking issues,
- top 5 quick wins,
- top 5 experimentů,
- verdikt: `ship`, `ship_after_fixes`, `do_not_ship`.
```

## 2.2 Finální výběr vítězné varianty

```text
Jsi senior marketing decision reviewer.

Vyber nejlepší variantu z následujících kandidátů. Nehledej nejhezčí text, ale variantu s nejvyšší pravděpodobností zvýšení důvěry, jasnosti a konverze.

Varianty:
[VARIANTA A]
[VARIANTA B]
[VARIANTA C]
[DALŠÍ VARIANTY]

Kontext:
[PRODUKT, CÍLOVKA, TRAFFIC SOURCE, KPI, DESIGN STANDARD]

Hodnoť podle:
- jasnosti,
- relevance pro cílovku,
- odlišitelnosti,
- důvěryhodnosti,
- konverzního potenciálu,
- rizika přehnaného slibu,
- Apple-like jednoduchosti,
- implementační náročnosti.

Výstup:
| Rank | Varianta | Skóre | Proč může fungovat | Největší riziko | Doporučená úprava |

Na závěr napiš jednu vítěznou variantu v produkčně použitelném znění.
```

## 2.3 Competitive positioning audit

```text
Jsi senior positioning strategist a competitive intelligence reviewer.

Porovnej náš produkt s konkurencí a navrhni silnější positioning pro landing page, reklamy a onboarding.

Náš produkt:
[POPIS]

Cílový segment:
[CÍLOVKA]

Konkurenti:
[KONKURENTI + STRUČNÉ POZNÁMKY / URL / CLAIMS]

Aktuální positioning:
[POSITIONING]

Úkol:
1. Identifikuj, kde působíme stejně jako konkurence.
2. Najdi slabá nebo nedoložená tvrzení.
3. Navrhni 5 odlišitelných positioning směrů.
4. Zhodnoť každý směr z pohledu důvěry, konverze, rizika a škálovatelnosti.
5. Doporuč jeden směr pro A/B test.

Výstup:
| Směr | Hlavní slib | Důkaz | Diferenciace | Riziko | Vhodný kanál | Doporučení |
```

## 2.4 Red-team review marketingových tvrzení

```text
Jsi skeptical marketing claims reviewer a QA risk auditor.

Zkontroluj následující marketingová tvrzení z pohledu důvěryhodnosti, právního rizika, reputačního rizika a konverzní kvality.

Tvrzení:
[CLAIMS / COPY / ADS / LANDING PAGE TEXT]

Produktový kontext:
[PRODUKT, CÍLOVKA, TRH]

Důkazy, které máme:
[DATA, REFERENCE, CASE STUDIES, CERTIFIKACE, INTERNÍ METRIKY]

Zkontroluj:
1. nepodložené superlativy,
2. absolutní sliby,
3. zavádějící porovnání,
4. nejasný rozsah výsledku,
5. riziko zklamaného očekávání,
6. zda claim zvyšuje důvěru nebo působí jako hype.

Výstup:
| Claim | Riziko | Problém | Bezpečnější verze | Potřebný důkaz | Priorita |

Na závěr navrhni finální sadu bezpečných, ale stále konverzních claims.
```

## 2.5 Launch readiness review

```text
Jsi launch readiness board pro SaaS/web produkt.

Zhodnoť, zda je připravené spuštění kampaně, landing page nebo release do produkce.

Vstup:
[PR SUMMARY / RELEASE NOTES / STAGING POPIS / QA REPORT / MARKETING PLAN]

Release cíl:
[CÍL]

Primární KPI:
[KPI]

Rizika:
[ZNÁMÁ RIZIKA]

Zkontroluj:
1. product readiness,
2. marketing readiness,
3. tracking readiness,
4. QA readiness,
5. support/customer communication readiness,
6. rollback readiness,
7. monitoring readiness,
8. brand/design consistency.

Výstup:
| Oblast | Stav | Evidence | Riziko | Nutná akce před release |

Finální rozhodnutí:
- `go`,
- `go_with_watchlist`,
- `no_go`.

Pokud je rozhodnutí `go_with_watchlist` nebo `no_go`, uveď konkrétní blokery a vlastníka opravy.
```

## 2.6 Senior design critique pro prémiový web

```text
Jsi senior creative director a conversion-focused product designer.

Zhodnoť návrh webu, který má působit prémiově, čistě, fresh a důvěryhodně. Kritizuj ho jako senior reviewer před produkčním nasazením.

Vstup:
[SCREENSHOT POPIS / DESIGN SPEC / HTML / URL]

Produkt:
[PRODUKT]

Cílovka:
[CÍLOVKA]

Cíl stránky:
[CÍL]

Zhodnoť:
1. první dojem,
2. informační hierarchii,
3. typografii,
4. vizuální rytmus,
5. emocionální tón,
6. důvěryhodnost,
7. konverzní tok,
8. mobile experience,
9. konzistenci s Apple-like standardem,
10. co odstranit.

Výstup:
| Kategorie | Hodnocení 1–10 | Co funguje | Co nefunguje | Doporučení |

Na závěr napiš přesné zadání pro frontend/design agenta, který má opravit top 3 problémy.
```

---

# 3. Kombinované workflow LM Studio + OpenRouter

Nejefektivnější režim je nepoužívat OpenRouter jako generátor velkého množství variant. Nejprve nech LM Studio lokálně vytvořit nebo zúžit varianty, potom pošli do OpenRouteru jen nejlepší kandidáty k prémiovému rozhodnutí. Tento postup snižuje cloudové náklady a zároveň drží vysokou kvalitu finálního rozhodnutí.

## 3.1 Lokální příprava variant, prémiové schválení

### Krok 1: LM Studio

```text
Vytvoř 15 variant hero sekce pro tento produkt a vyber top 5 podle jasnosti, důvěry a Apple-like jednoduchosti.

Produkt:
[PRODUKT]

Cílovka:
[CÍLOVKA]

KPI:
[KPI]

Výstup top 5 variant vrať v tabulce s vysvětlením.
```

### Krok 2: OpenRouter

```text
Z těchto 5 variant vyber jednu vítěznou pro A/B test.

Varianty:
[VÝSTUP Z LM STUDIO]

Hodnoť podle conversion clarity, trust, specificity, brand fit, implementation risk a testing value.

Vrať vítěze, doporučenou úpravu a tracking plán.
```

## 3.2 Lokální brand QA, cloudový launch board

### Krok 1: LM Studio

```text
Zkontroluj PR změnu z pohledu brand voice, Apple-like designu, microcopy a konzistence CTA.

Vstup:
[PR SUMMARY / DIFF / SCREENSHOT POPIS]

Vrať blocking issues, non-blocking improvements a verdikt pro PR.
```

### Krok 2: OpenRouter

```text
Na základě brand QA, release notes a staging popisu rozhodni, zda je změna připravena na produkční release.

Vstupy:
[LM STUDIO BRAND QA]
[QA REPORT]
[RELEASE NOTES]
[STAGING URL POPIS]

Vrať launch readiness tabulku a rozhodnutí go / go_with_watchlist / no_go.
```

---

# 4. Výstupní standard pro agentní použití

Každý prompt, který má skončit jako agentní úkol, musí vracet nejen návrh, ale také **implementační návaznost**. Tím se zabrání tomu, že model vytvoří hezký text bez možnosti převést jej na bezpečný GitHub PR.

| Povinná část výstupu | Smysl |
|---|---|
| **Doporučená změna** | Co přesně se má upravit. |
| **Hypotéza** | Proč změna může zlepšit KPI. |
| **Acceptance criteria** | Jak poznáme, že je úkol hotový. |
| **QA checklist** | Co se musí ověřit před PR nebo releasem. |
| **Rizika** | Co se může rozbít nebo zhoršit. |
| **Tracking plán** | Jak změnu změříme. |
| **Branch/commit návrh** | Jak změnu zapojit do GitHub workflow. |

## Univerzální finální prompt pro předání agentovi

```text
Převeď výše uvedené doporučení na konkrétní agentní zadání pro Git worktree.

Výstup musí obsahovat:
1. název tasku,
2. doporučený agent,
3. doporučený backend model,
4. branch name,
5. cílové soubory nebo oblasti,
6. přesný scope,
7. acceptance criteria,
8. QA checklist,
9. tracking plán,
10. rizika,
11. rollback poznámku,
12. commit message,
13. PR summary.

Dodrž styl: malé reviewovatelné změny, žádná tajemství v repozitáři, žádné přímé změny do main, nejprve staging.
```

---

# 5. Doporučený denní režim

LM Studio používej několikrát denně jako levnou lokální kontrolní vrstvu, zejména před tím, než agentní změnu pošleš do PR. OpenRouter používej selektivně: před větším redesignem, před významnou kampaní, před produkčním release nebo při sporu mezi více variantami. Tak vznikne workflow, které drží nízké náklady, vysokou rychlost a zároveň seniorní kvalitu finálního rozhodnutí.

| Moment ve workflow | Doporučený model | Výstup |
|---|---|---|
| Návrh lokálních copy/design variant | **LM Studio** | Varianty, microcopy, lokální brand review. |
| Před PR | **LM Studio** | Brand/UX/CTA checklist a drobné opravy. |
| Před staging testem | **LM Studio + DeepSeek** | QA a CRO sanity check. |
| Před produkčním releasem | **OpenRouter** | Launch readiness, no-go/go rozhodnutí. |
| Před větším ad spendem | **OpenRouter** | Claims red-team a competitive positioning review. |
