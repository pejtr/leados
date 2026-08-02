# Compliance Policy

## LinkedIn Terms of Service

LinkedIn výslovně zakazuje:

- nástroje třetích stran a browser boty, které automatizují aktivitu,
- kopírování profilů,
- automatické přidávání kontaktů a odesílání zpráv.

Porušení může vést k omezení nebo uzavření účtu.

## Povolené (bezpečný model)

- Automatizovaný výzkum, kvalifikace, personalizace, plánování a evidence.
- Příprava a zkopírování schválené zprávy do schránky.
- Označení zprávy jako `MANUALLY_SENT` člověkem po odeslání.
- Volitelný browser assistant může otevřít správný profil a zobrazit návrh vedle něj,
  upozornit na duplicitu — ale **neklikne na finální odeslání**.

## Zakázané (nikdy)

- automatické procházení profilů,
- automatické přidávání kontaktů,
- automatické odesílání LinkedIn zpráv,
- masové zpracování bez lidské kontroly.

## Limity

- Max 5–10 nových kandidátů denně.
- Cache firemního výzkumu 14–30 dní (úspora + konzistence).
- Silnější model jen pro strategické leady.
- Žádný LLM na výpočet a změnu stavů (deterministický stavový automat).

## Lidská kontrola

Každá zpráva před odesláním projde `reviewStatus: approved` od člověka.
`requiresManualApproval` je pro LinkedIn vždy `true`.
