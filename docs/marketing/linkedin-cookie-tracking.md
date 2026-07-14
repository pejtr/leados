# LinkedIn a cookie consent

## Produkční proměnné

Klientský LinkedIn Insight Tag používá:

- `VITE_LINKEDIN_INSIGHT_ID` - Partner ID z LinkedIn Campaign Manageru.
- `VITE_LINKEDIN_CONVERSION_ID` - ID browserové konverze.

Serverová LinkedIn Conversions API používá:

- `LINKEDIN_ACCESS_TOKEN` - OAuth token s přístupem ke Conversions API.
- `LINKEDIN_CONVERSION_ID` - úplný URN konverzního pravidla, například `urn:lla:llaPartnerConversion:123`.

Google Analytics používá `VITE_GA_MEASUREMENT_ID`. Umami používá `VITE_ANALYTICS_ENDPOINT` a `VITE_ANALYTICS_WEBSITE_ID`.

Hodnoty patří pouze do produkčního nastavení prostředí. Neukládat je do repozitáře.

## Chování souhlasu

- Sklik, Google/Umami a LinkedIn se nespustí bez souhlasu příslušného kanálu.
- Návštěvník může volbu kdykoli změnit tlačítkem `Nastavení cookies`.
- LinkedIn CAPI se volá pouze u leadu, který odeslal formulář se souhlasem pro LinkedIn.
- Souhlas je uložen lokálně v prohlížeči na 12 měsíců; odmítnutí na 6 měsíců. Do databáze se neukládá.
- Odvolání souhlasu odstraní nepovinný skript a znovu načte stránku, aby se ukončilo další měření.
- Hodnota konverze se neposílá u leadu. Skutečná částka se posílá pouze po potvrzené platbě.

## Kontrola před kampaní

1. V anonymním okně odmítnout vše a ověřit, že se nenačítají skripty Sklik, Google ani LinkedIn.
2. Povolit jednotlivé kanály a ověřit požadavky v panelu Network.
3. Odeslat testovací lead z B2B landing page a zkontrolovat konverzi v LinkedIn Campaign Manageru.
4. Odeslat testovací lead ze Sklik landing page a zkontrolovat konverzi v Skliku.
5. Po úspěšné testovací platbě ověřit jednu konverzi na stránce `/payment-success`.
6. Ověřit, že LinkedIn lead lze v adminu spojit se skutečným `lead_qualified`, `proposal_sent` a `deposit_paid`.
