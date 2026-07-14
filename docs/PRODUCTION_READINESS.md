# OPTIMATEO - production readiness

Aktualizováno 14. 7. 2026. Tento dokument popisuje stav zdrojové větve, nikoli potvrzení aktuálního produkčního deploye.

## Prodejní cesta

Primární funnel:

`segmentová landing page -> mini audit / poptávka -> výsledek -> rezervace hovoru -> nabídka -> platební odkaz -> uhrazená záloha`

- Homepage má primární CTA `Prověřit web zdarma`.
- Segmenty Sklik: `/lp/zivnostnici`, `/lp/b2b`, `/lp/remeslnici`, `/lp/restaurace`, `/lp/salony`, `/lp/ecommerce`.
- Dotazník žádá kontakt až v posledním kroku, ukládá rozepsaná data a po odeslání nabízí konkrétní termín hovoru.
- Poptávka sama nevytváří objednávku ani platební odkaz.
- Platební odkaz vytváří pouze administrátor u konkrétního leadu po potvrzení nabídky.

## Implementované kontroly

- Centrální ceny jsou v `shared/service-catalog.ts`.
- ONYX OS Audit stojí 4 900 Kč a obsahuje 60min konzultaci.
- Veřejný seznam poptávek je omezen na administrátora.
- Lead lifecycle se ukládá do existujícího `inquiries.details`: `call_booked`, `lead_qualified`, `proposal_sent`.
- `deposit_paid` vzniká až po ověření zaplacené Stripe Checkout Session.
- A/B test má pouze skutečné varianty A/B a mění hero nabídku i CTA.
- Anonymní A/B a funnel analytika se spustí pouze po souhlasu s Google/analytikou.
- Sklik podporuje legacy `rc.js` i volitelný přechod na SEM `sul.js`.
- Resend e-mail transport používá timeout, idempotency key a nepropouští klíče ani PII do logu.
- `/robots.txt` a `/sitemap.xml` jsou skutečné statické soubory ve `client/public`.
- Interní, platební, demo a administrační routy mají `noindex`.
- Veřejné stránky mají vlastní title, description a canonical.
- Produkční Vite build neobsahuje vývojový Manus runtime.
- Veřejné právní stránky: `/ochrana-osobnich-udaju`, `/cookies`, `/obchodni-podminky`.

## Povinné produkční proměnné

Hodnoty patří pouze do produkčního prostředí. Neukládat je do repozitáře.

### Provoz

- `DATABASE_URL`
- `PUBLIC_APP_URL=https://www.optimateo.com`

### E-mail

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `EMAIL_REPLY_TO` (doporučeno)

### Platby

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- Stripe webhook URL: `https://www.optimateo.com/api/stripe/webhook`
- povolené události: `checkout.session.completed`, `checkout.session.async_payment_succeeded`

### Interní integrace

- `MANUS_WEBHOOK_SECRET`
- Manus musí posílat stejnou hodnotu v hlavičce `x-manus-webhook-secret`.

### Sklik / Seznam

- `VITE_SEZNAM_SEM_ID` pro nový SEM
- `VITE_SKLIK_RETARGETING_ID` a `VITE_SKLIK_CONVERSION_ID` po dobu souběžné migrace z legacy měření

### Další měření

- `VITE_GA_MEASUREMENT_ID`
- `VITE_LINKEDIN_INSIGHT_ID`
- `VITE_LINKEDIN_CONVERSION_ID`
- `LINKEDIN_ACCESS_TOKEN` a `LINKEDIN_CONVERSION_ID` jen pokud je aktivní LinkedIn CAPI

## Release gate

Před PR a před deployem:

1. `pnpm check`
2. `pnpm test`
3. `pnpm build`
4. ověřit, že `server/_core/public/` není součástí diffu
5. ověřit desktop a mobil pro homepage, audit, všech šest landing pages, dotazník a právní stránky
6. v anonymním okně odmítnout cookies a ověřit, že se nenačte Google, LinkedIn, Sklik ani SEM
7. povolit jednotlivé kanály a ověřit požadavky v Network panelu
8. odeslat jeden produkční testovací lead a dohledat jej v adminu
9. rezervovat testovací hovor, označit kvalifikaci a nabídku
10. vytvořit testovací Stripe odkaz a v test mode ověřit `deposit_paid`
11. ověřit doručení nabídky a potvrzení platby ze skutečné odesílací domény

## Externí launch blokery

- Produkční deploy musí obsahovat tuto větev; lokální stav není důkaz nasazení.
- K 14. 7. 2026 funguje TLS na `www.optimateo.com`, ale apex `optimateo.com` vrací chybu certifikátu. Canonical je proto nastaven na `www`; apex musí dostat platný certifikát a trvalé přesměrování na `www`.
- K 14. 7. 2026 živé `/robots.txt`, `/sitemap.xml` a veřejné SPA routy stále vracejí staré 368,8kB HTML. Produkční deploy této větve je nutný před kampaní.
- Sklik/SEM, Google, LinkedIn, Stripe a Resend potřebují skutečná produkční ID a ověřenou doménu.
- Chybí ověřené klientské případové studie se souhlasem. Web proto raději nezobrazuje žádné než smyšlené.
- Retenční lhůty z právních zásad musí mít vlastníka a pravidelný proces výmazu.
- Právní texty jsou technicky zapracované, ale před ostrým spotřebitelským prodejem je vhodná kontrola českým právníkem.

Placenou návštěvnost spustit až po úspěšném produkčním smoke testu bodů 6-11.
