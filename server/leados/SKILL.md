# LeadOS LinkedIn Opportunity Engine

Verzovaný Skill pro denní LinkedIn prospecting. Převzato z analýzy („LinkedIn oslovování“) s jednou zásadní úpravou oproti původnímu videu:

> **Automatizovat výzkum, kvalifikaci, personalizaci, plánování a evidenci. Neautomatizovat klikání a odesílání zpráv přímo na LinkedInu.**

LinkedIn výslovně zakazuje nástroje třetích stran, browser boty a rozšíření, které automatizují aktivitu, kopírují profily nebo odesílají zprávy. Takové používání může vést k omezení nebo uzavření účtu.

## Kdy se tento Skill načítá

- Při generování denní dávky kandidátů (5–10 / pracovní den).
- Při přípravě personalizovaného oslovení pro konkrétního prospecta.
- Při QA (creep guard, evidence check) výsledné zprávy.
- Při sestavování ranního/odpoledního briefingu pro člověka (Petr).

## Architektura (v ONYX OS)

```
KITT        zadá a koordinuje denní prospecting
  │
LEADOS      vybere segment, nabídku a obchodní cíl
  │
HERA        najde firmy, signály a kontaktní role
  ├───────────────┐
  ▼               ▼
HERMES         CONTENT / FORGE
ověří web,     připraví relevantní
techn. chyby   obsah nebo případovku
  └───────┬───────┘
          ▼
 PERSONALIZATION ENGINE
          │
          ▼
 OMNICORE QA + KARR
 pravdivost · privacy · relevance · riziko
          │
          ▼
 LEADOS ACTION QUEUE
          │
          ▼
 PETR RUČNĚ ODEŠLE   ← zde končí automatizace
          │
          ▼
 odpověď · schůzka · pipeline
```

## Co Skill definuje

- `icp.schema.json` — koho hledáme, signály, vyloučení.
- `lead-output.schema.json` — struktura kandidáta (evidence, skóre, stav, varianta).
- `message-rules.md` — povolené / zakázané formulace.
- `personalization-policy.md` — evidence-first personalizace + creep guard.
- `compliance-policy.md` — LinkedIn ToS, human-in-the-loop, limity.

## Hlavní principy

1. **Proces jako Skill, ne jeden dlouhý prompt.** Reprodukovatelné, omezuje zahlcení kontextu.
2. **ICP & Offer Contract** na začátku každého hledání. Bez přesného zadání AI vyrábí průměrné kontakty.
3. **Evidence-first personalizace.** Každé tvrzení má veřejný důkaz (ověřený fakt / pravděpodobný signál / obchodní hypotéza / doporučení).
4. **Creep Guard.** Samostatné skóre rizika „digitálního stalkingu“.
5. **Stavový automat**, ne „asi jsme ho oslovili“. Automatizace smí zpracovat jen přesný následující stav.
6. **Human-in-the-loop odeslání.** Systém připraví a zkopíruje schválenou zprávu, člověk klikne Odeslat.
7. **Experimenty.** Testujeme varianty A/B/C/D, měříme přijetí spojení, odpověď, schůzku, zakázku.

## Doporučený MVP

- Fáze 1 — bezpečný copilot: ruční vstup → výzkum → scoring → zpráva → QA → ruční odeslání → evidence.
- Fáze 2 — denní queue: naplánovaná úloha 5–10 kandidátů, deduplikace, briefing.
- Fáze 3 — revenue loop: odpověď → kvalifikace → schůzka → nabídka → zakázka → atribuce.

## Implementační poznámka

Stavový automat, evidence a creep skóre jsou v této verzi realizovány na úrovni typů a orchestrátoru
(`server/leados/engine.ts`, `server/outreach-agent.ts`, `server/prospecting.ts`). Rozšíření DB schématu
(sloupce `verifiedSignals`, `sourceEvidence`, `creepRisk`, `leadState`, `messageVariant`) je doporučená
následná migrace — viz `lead-output.schema.json`. Bez migrace se metadata ukládají do `notes`/`tags`.
