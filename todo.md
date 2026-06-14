# OPTIVIO — Project TODO

## Landing Page Structure

### Core Sections
- [x] Hero section — value proposition + comparison table (3 490 Kč vs 20 000+ Kč)
- [x] Service pricing tiers — Lite Web (3 490 Kč), Basic Web (4 999 Kč), Web + Lead Gen (6 990 Kč), Web + Automation (9 990 Kč)
- [x] Process section — form → proposal (48h) → approval → live
- [x] Portfolio section — case studies (kavárna, elektrikář, kadeřnice, atd.)
- [x] Testimonials section — star ratings + real results
- [x] LeadOS B2B section — Starter/Growth/Pro pricing
- [x] Contact form — name, email, phone, business description, package selection
- [x] FAQ section — timeline, editing, costs, monthly fees
- [x] Footer — links, social, contact info

### Design & Styling
- [x] Global CSS — color palette, typography, spacing system
- [x] Responsive design — mobile, tablet, desktop optimization
- [x] Animation & micro-interactions — smooth, professional feel
- [x] Dark/light theme setup (if needed)

### Backend & Automation
- [x] Database schema — inquiries table for contact form submissions
- [x] tRPC procedure — inquiries.create mutation
- [x] Owner notification system — send notification on form submission
- [x] Email integration (optional) — send confirmation to user (optional, not required for MVP)

### Frontend Components
- [x] Navigation bar — sticky, responsive
- [x] Hero component
- [x] Comparison table component
- [x] Pricing cards component
- [x] Process timeline component
- [x] Portfolio gallery component
- [x] Testimonials carousel component
- [x] LeadOS section component
- [x] Contact form component
- [x] FAQ accordion component
- [x] Footer component

### Content & Copywriting
- [x] Czech copywriting — all sections
- [x] Hero headline & subheadline
- [x] Service descriptions
- [x] Process step descriptions
- [x] Portfolio case study texts
- [x] Testimonial quotes (real or template)
- [x] FAQ answers
- [x] LeadOS descriptions

### Testing & QA
- [x] Form validation & error handling
- [x] Responsive design testing
- [x] Cross-browser testing
- [x] Performance optimization
- [x] SEO basics (meta tags, structured data)
- [x] Vitest unit tests for key components

### Deployment & Launch
- [x] Final checkpoint
- [x] Publish to Manus
- [x] Domain setup (if needed)
- [x] Analytics setup (if needed)

## Notes

- All content in Czech (Čeština)
- Pricing: 3 490 Kč, 4 999 Kč, 6 990 Kč, 9 990 Kč (exact)
- Comparison: OPTIVIO vs. tradiční agentury (20 000+ Kč)
- LeadOS: B2B SaaS product (Starter 49 USD, Growth 99 USD, Pro 199 USD)
- Contact form → Owner notification on every submission
- Elegant, professional, premium feel

## Nové úpravy

- [x] Přidat sekci o modulárních webech — zmiňit rozšiřitelnost a technologické komponenty
- [x] Opravit LeadOS ceny — USD ceny jsou již správně (49, 99, 199 USD)
- [x] Přidat "Modulární komponenty" do pricing sekcí — možnost přidat jakékoliv tech

## Měsíční provoz a niche-specifické balíčky

- [x] LeadOS pricing změna z USD na Kč (990, 1 990, 3 990 Kč)
- [x] Přidat sekci "Měsíční provoz" — vysvětlit model (199 Kč + 1 000 Kč/měsíc)
- [x] Přidat "Automatizace a správa sítí" balíček — 1 000 Kč/měsíc (modul v admin)
- [x] Vymyslet 9 niche-specifických balíčků s cenami (kavárny, elektrikáři, kadeřnice, atd.)
- [x] Implementovat niche-specifické balíčky do admin panelu (backend API)
- [x] Vytvořit pricing stránku s niche balíčky


## Admin Panel

- [x] Vytvořit admin dashboard layout s navigácí
- [x] Niche packages management — list, create, edit, delete
- [x] Customer subscriptions management — list, view, cancel
- [x] Dashboard statistiky — počet balíčků, aktivních subscriptions, měsíční příjem
- [x] Responsive design pro admin
- [x] Vitest testy pro admin API (12/12 passing)


## Autonomní Systém — 3 Iterace (1-2 týdny)

### Iterace 1: Stripe + Záloha
- [x] Přidat Stripe feature do projektu
- [x] Vytvořit database schema pro orders/payments
- [x] Aktualizovat pricing tabulku — přidat "Záloha" řádek (30-50%)
- [x] Kontaktní formulář → Stripe checkout
- [x] Invoice generation s zálohou
- [x] Email notifikace po zaplacení
- [x] Vitest testy pro payment flow

### Iterace 2: Client Dashboard
- [ ] Vytvořit client login (bez admin role)
- [ ] Dashboard s project status (Čekání → V přípravě → Hotovo)
- [ ] Zobrazit: zaplacená záloha, zbývající platba, timeline
- [ ] Progress tracker (% hotovosti)
- [ ] File upload pro client feedback
- [ ] Notifikace o změně statusu

### Iterace 3: Automatizace & Monitoring
- [ ] SOP dokumentace (standardní postupy)
- [ ] Auto-notifikace (email, SMS, Slack)
- [ ] KPI dashboard (response time, conversion rate, revenue)
- [ ] Anomaly detection (neplatící klienti, pozdní projekty)
- [ ] Self-healing alerts
- [ ] Heartbeat jobs pro automatizaci

### Testování & Optimalizace
- [ ] End-to-end testy pro payment flow
- [ ] Responsive design na mobilech
- [ ] Performance optimization
- [ ] Security audit (Stripe, data)
- [ ] Final checkpoint

## Fáze 3 — Email Notifikace (HOTOVO)

- [x] Email service s šablonami
- [x] Potvrzovací email po objednávce
- [x] Email po zaplacení
- [x] Email po dokončení projektu
- [x] Integrováno do order creation flow

## Zbývající práce — Fáze 4 & 5

### Fáze 4: LeadOS Orchestrace
- [ ] Vytvořit tRPC router pro Manus API v2
- [ ] Katastr-style control interface
- [ ] Orchestrace projektů přes LeadOS
- [ ] Webhook handling pro project updates

### Fáze 5: Heartbeat Jobs
- [ ] Autonomní monitoring projektů
- [ ] Self-healing alerts
- [ ] KPI dashboard
- [ ] Anomaly detection


## Redesign — Inspirace davame.com

- [x] Redesign landing page — tmavé fialové/navy pozadí (jako davame.com)
- [x] Hero sekce — velký headline, stats (počet projektů, roky zkušeností, spokojenost)
- [x] Niche solutions grid — karty pro různé obory (kavárny, elektrikáři, kadeřnice...)
- [x] Case studies sekce — reálné příběhy s výsledky
- [x] Testimonials — citáty klientů s fotkami
- [x] CTA sekce — "Domluvit konzultaci" + "14 dní zdarma" dual CTA
- [x] FAQ sekce — accordion styl
- [x] Footer — tmavý, přehledný
- [x] Sticky navigace — průhledná → tmavá při scrollu
- [x] Mock dashboard v hero, pricing toggle (roční/měsíční)
- [x] Services grid s badge cenami
- [x] Why Us sekce s dark background a stats grid

## Poznámky k obsahu
- [ ] Case studies jsou ukázkové (demo) — nahradit reálnými klientskými příběhy po získání souhlasu
- [ ] Testimonials jsou šablonové — doplnit reálnými citáty klientů s jejich souhlasem
- [ ] Kontaktní údaje (tel, email) — doplnit reálnými hodnotami


## AI Agents & Skills (Nové — implementováno)

### Backend
- [x] DB schema — brand_memories, agent_sessions, agent_messages tabulky
- [x] DB helpery — getBrandMemory, upsertBrandMemory, createAgentSession, getAgentMessages, addAgentMessage
- [x] agent-skills.ts — 8 skills s system prompty (CMO, Copywriter, Email, Webinar, SEO, Ads, Landing Page, Lead Magnet)
- [x] brandMemory router — get, save (upsert)
- [x] agents router — listSkills, createSession, listSessions, getSession, chat, deleteSession

### Frontend
- [x] /agents — AgentsHub.tsx (hub s přehledem skills, recent sessions, chat interface)
- [x] BrandMemorySetup.tsx — 4-krokový wizard pro nastavení Brand Memory
- [x] AI Agents promo sekce na landing page
- [x] "✨ AI Agenti" odkaz v navigaci

### TODO (pokračování)
- [ ] Streaming odpovědí (SSE) pro real-time generaci
- [ ] Export konverzace do PDF/Word
- [ ] Sdílení konverzace (shareable link)
- [ ] Admin přehled aktivit agentů
- [ ] Měsíční usage limity per user

## AB Testing Framework (Nové)
- [x] Implementovat AB testing backend router (getVariant, trackConversion)
- [x] Vytvořit ab-test.ts utility (getVariant, trackEvent)
- [x] Vytvořit HomeVariantB.tsx (Benefits-focused)
- [x] Vytvořit HomeVariantC.tsx (Social proof — zelená, comparison table)
- [x] Vytvořit HomeVariantD.tsx (Bold neon — magenta/cyan glow)
- [x] Přidat variant routing do App.tsx
- [x] Vytvořit AB testing analytics dashboard
- [x] Vitest testy pro AB framework (43/43 passing)
- [x] Přidat conversion tracking na CTA buttons


## Zbývající úkoly — Fáze 6
- [x] Napojit AB testing dashboard na reálná data přes tRPC router (ab.getSummary, ab.getMetrics)
- [x] Přidat persistence/backend agregaci pro AB test events (ab-analytics.ts)
- [x] Doplnit loading, error a empty states pro AB testing dashboard
- [ ] Google Analytics integration pro AB testing
- [ ] Dokumentace pro spouštění AB testů
- [ ] Production readiness checklist
