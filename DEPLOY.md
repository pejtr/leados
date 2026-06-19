# DEPLOY — ONYX WEB do produkce

Cíl: dostat web živě na `onyxweb.cz`, aby Sklik reklama → `/web` → poptávka →
Telegram ping do mobilu → zavoláš. Checklist od nuly.

## 0. Předpoklady
- Účet na hostingu (**Railway** doporučeno pro Node+Express app)
- Produkční **MySQL** databáze
- Doména `onyxweb.cz` (Webglobe / Vercel)
- **Telegram bot** (kvůli doručení leadů)

## 1. Telegram bot (udělej první — bez něj leady nechodí)
1. V Telegramu napiš **@BotFather** → `/newbot` → zkopíruj **token** → `TELEGRAM_BOT_TOKEN`.
2. Napiš svému nově vytvořenému botovi libovolnou zprávu.
3. Otevři `https://api.telegram.org/bot<TOKEN>/getUpdates`, najdi `"chat":{"id":...}` → `TELEGRAM_CHAT_ID`.

## 2. Databáze
1. Vytvoř MySQL (Railway plugin nebo PlanetScale).
2. Connection string → `DATABASE_URL`.
3. Lokálně proti prod DB spusť migrace:
   ```bash
   npm run db:push
   ```

## 3. Hosting (Railway)
1. New Project → Deploy from GitHub repo `pejtr/optivio`.
2. **Build command:** `npm run build`  ·  **Start command:** `npm start`
3. Variables: nastav vše z [.env.example](.env.example) (hlavně `DATABASE_URL`,
   `JWT_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NODE_ENV=production`).
4. Deploy → ověř, že běží na Railway URL.

## 4. Doména
1. V DNS u `onyxweb.cz` nastav CNAME/A záznam na Railway target.
2. V Railway → Settings → Domains přidej `onyxweb.cz`.
3. Počkej na SSL (automaticky).

## 5. Smoke test (než pustíš reklamu)
- [ ] `https://onyxweb.cz/` se načte
- [ ] `https://onyxweb.cz/web` se načte (Sklik landing)
- [ ] Odeslání formuláře na `/web` → přijde **Telegram zpráva** + záznam v DB
- [ ] `/ai-core` a `/demo` fungují
- [ ] Web vypadá OK na mobilu (80 % návštěv)

## 6. Sklik
1. Konverze: na `/web` děkovacím stavu je místo pro Sklik konverzní kód
   (hledej komentář „MĚŘENÍ KONVERZE" ve `WebLandingPage.tsx`) — vlož měřicí kód.
2. Kampaň → cílová URL `https://onyxweb.cz/web`.
3. Spusť malý rozpočet (test mechaniky), sleduj Telegram.

## Známé limity (neblokují první prodeje)
- `sendEmail` je zatím stub → potvrzovací e-maily zákazníkům reálně neodcházejí.
  Pro start nevadí (leady voláš). Dořeš u placených objednávek (Resend/SendGrid).
- Bundle je velký (zvýrazňovač syntaxe) — funguje, optimalizace později.
