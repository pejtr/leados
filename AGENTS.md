# Pravidla pro AI agenty v tomto repu

Platí pro **všechny** coding agenty (Cline, OpenCode, DeepSeek-TUI, Aider, lokální modely…).
Claude Code působí jako architekt a reviewer — finální slovo má review v PR.

## Workflow: 1 agent = 1 úkol = 1 branch = 1 PR

1. Pracuj **výhradně ve své feature větvi** (`feat/<nazev>`, `fix/<nazev>`, `chore/<nazev>`).
   Nikdy necommituj přímo do `main`.
2. Ideálně pracuj ve vlastním **git worktree** (`git worktree add ../OPTIVIO-<ukol> -b feat/<ukol> origin/main`),
   ať si agenti nepřepisují soubory.
3. Drž se **scope zadání** — neměň soubory mimo zadaný úkol. Žádné "při té příležitosti jsem ještě…".
4. Před commitem spusť `pnpm check` (TypeScript) a pokud se změnil server kód, `pnpm test`.
   Commituj jen se zelenými výsledky.
5. Po dokončení otevři PR do `main` se shrnutím: co se změnilo, proč, jak ověřeno.
6. **Žádný merge.** Merge dělá člověk (nebo Claude Code po review na výslovný pokyn).

## Zakázáno

- ❌ Číst, vypisovat nebo commitovat `.env*`, API klíče, secrets (jsou v .gitignore — tam ať zůstanou)
- ❌ Měnit `drizzle/schema.ts`, Stripe kód (`stripe-*.ts`, `stripeWebhook.ts`) a `server/_core/` bez výslovného zadání
- ❌ Mazat nebo přepisovat migrace v `drizzle/*.sql`
- ❌ Instalovat nové dependencies bez uvedení důvodu v PR popisu
- ❌ Auto-approve/YOLO režimy na tomto repu
- ❌ Touch `server/_core/public/assets/` (build artefakty, gitignored)

## Co je bezpečný scope pro levné agenty

- ✅ UI komponenty, Tailwind styly, layout
- ✅ Texty, copywriting, i18n
- ✅ SEO metadata, schema.org
- ✅ Testy (vitest)
- ✅ Drobné refaktory v rámci jednoho souboru/komponenty
- ⚠️ Architektura, DB schéma, platby, auth, deployment → **jen Claude Code**

## Technické minimum

- Stack: React 19 + TypeScript + Vite 7 + Tailwind 4 + tRPC 11 + Express 4 + Drizzle ORM (MySQL)
- Package manager: **pnpm** (ne npm/yarn)
- Skripty: `pnpm dev` · `pnpm check` · `pnpm test` · `pnpm build`
- Windows kompatibilita: env proměnné ve skriptech přes `cross-env`
- Čeština v UI textech; v zákaznickém UI nepoužívat slovo "AI" pro placené funkce bez kontextu
- Deploy: push do `main` = automatický deploy přes Manus. Proto: do `main` jde jen zreviewovaný kód.
