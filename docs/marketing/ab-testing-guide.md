# A/B test homepage OPTIMATEO

## Co se testuje

Experiment má pouze dvě skutečné varianty:

- A: důraz na odhalení míst, kde web ztrácí zákazníky.
- B: důraz na více poptávek a propojení webu, CRM a automatizace.

Mění se hero nadpis, podpůrný text a formulace hlavního CTA. Router předává variantu přímo komponentě `Home`. Varianty C a D se nepoužívají.

## Souhlas a přiřazení

- Bez souhlasu s analytikou dostane návštěvník variantu A.
- Po souhlasu se vytvoří anonymní `ab_visitor_id` a stabilní varianta A/B.
- Odmítnutí nebo odvolání souhlasu odstraní A/B identifikátor a atribuci z úložiště.
- Interní a testovací návštěvy je nutné filtrovat v GA4 nebo jiném trvalém analytickém zdroji.

## Události

- `page_view` pouze se skutečnou cestou; A/B expozice vzniká jen na `/`.
- `hero_cta_click` pro hlavní a sekundární CTA v hero.
- `audit_start` a `audit_submit`.
- `questionnaire_start`, `questionnaire_step`, `questionnaire_abandon` a `questionnaire_submit`.
- `call_booked` po úspěšném uložení termínu.
- `form_submit` jako kompatibilní hlavní lead konverze.
- `deposit_paid` až po serverovém potvrzení zaplacené Stripe session.

`lead_qualified` a `proposal_sent` se ukládají trvale do lifecycle konkrétní poptávky v databázi. Nejsou odvozovány z anonymního chování v prohlížeči.

## Datové zdroje

Dashboard `/ab-testing` ukazuje procesní in-memory čítače. Po restartu serveru se vynulují a slouží jen pro technickou kontrolu toku událostí.

Pro rozhodnutí o vítězi použít trvalý zdroj:

1. GA4 nebo schválenou serverovou analytiku;
2. stejné období a zdroj návštěvnosti pro obě varianty;
3. kvalifikované leady a tržby, ne pouze kliknutí;
4. předem stanovenou minimální velikost vzorku a dobu běhu.

Test neukončovat jen proto, že jedna varianta krátkodobě vede. Primární metrika je podíl kvalifikovaných leadů nebo zaplacených zakázek na exponované návštěvy.

## QA

1. V anonymním okně bez souhlasu ověřit variantu A a absenci analytických požadavků.
2. Povolit Google/analytiku a znovu načíst stránku.
3. Ověřit stabilní hodnoty `ab_visitor_id` a `ab_variant`.
4. Kliknout na hero CTA a odeslat testovací formulář.
5. Zkontrolovat skutečnou cestu, variantu a campaign attribution v událostech.
6. Odvolat souhlas a ověřit odstranění A/B storage a zastavení dalších eventů.
