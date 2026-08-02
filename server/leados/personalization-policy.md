# Personalization Policy

Každé tvrzení v oslovování musí být propojeno s veřejným důkazem. Výstup rozlišuje čtyři úrovně:

| Úroveň              | Význam                                   | Příklad                                   |
|---------------------|------------------------------------------|-------------------------------------------|
| `verified_fact`     | Ověřený technický/veřejný fakt           | „Web nemá HTTPS.“ → technický test        |
| `probable_signal`   | Pravděpodobný signál z veřejných zdrojů  | „Firma otevírá novou pobočku.“ → aktualita|
| `business_hypothesis`| Obchodní hypotéza (ne fakt)             | „Mohou ztrácet poptávky.“ → NESMÍ být fakt|
| `recommendation`    | Naše doporučení                         | „Nabízím mini audit.“                      |

## Creep Guard

Samostatné skóre `creepRisk` (0–100). Zpráva je zamítnuta, pokud:

- zmiňuje příliš osobní detail,
- ukazuje, kolik informací jsme o člověku dohledali,
- působí manipulativně,
- obsahuje falešnou chválu,
- předstírá osobní vztah,
- zneužívá rodinu/bydliště/soukromé události,
- působí jako automaticky generovaný odstavec.

### Nevhodné
> Viděl jsem, že jste v roce 2018 otevřel provozovnu v Říčanech a minulý týden komentoval příspěvek…

### Vhodnější
> Zaujal mě směr vašeho projektu a způsob, jakým prezentujete nabídku. Věnuji se webům a automatizaci poptávek; rád se propojím.

Personalizace musí působit jako **relevantní pozornost**, ne jako digitální stalking.
