# LeadOS — AI Lead Generation & CRM Automation Platform

**LeadOS** je komplexní platforma pro automatizovanou generaci B2B leadů, jejich kvalifikaci a správu prodejního pipeline pomocí AI agentů. Kombinuje nejnovější technologie v oblasti AI orchestrace, real-time data processing a bezpečné integrace s externími systémy.

## 🎯 Klíčové Vlastnosti

### 🤖 AI Orchestrace (HERA)
- **HERA Command Center** — Centrální AI mozek řídící všechny operace
- **HERMES** — Orchestrační agent pro komplexní multi-step procesy
- **Sub-agenti** — Specializovaní agenti (Lead Prospector, Outreach Copywriter, Data Analyst, Strategic Orchestrator, Sales Advisor, Master Summarizer, NINJA BOT)
- **Prompt Security** — Ochrana proti prompt injection útokům (20+ detekčních vzorů)
- **Drag & drop chat widget** — Plovoucí UI pro přímou komunikaci s HERA

### 📊 Lead Generation & Pipeline
- **AI Lead Generation** — Generování leadů z ARES registru (IČO, obor, region)
- **Kanban Pipeline** — Vizuální správa leadů (Nový → Kontaktován → Kvalifikován → Deal)
- **Deal Pipeline** — Sledování otevřených obchodů a jejich hodnoty
- **Smart Lists** — Chytré segmentace leadů podle pravidel a kritérií
- **External Lead Import** — Import leadů z externích zdrojů

### 🚀 Automatizace & Integrace
- **SDR Agent** — AI agent automaticky oslovující zákazníky
- **Autopilot Mode** — Nastavit a zapomenout — systém pracuje sám
- **Email Sequences** — Automatické e-mailové kampaně
- **Webhook Integrations** — Propojení se Zapier, Make, n8n, ClickUp, Slack
- **n8n Security Gateway** — Best practice: Human-in-the-Loop pro kritické akce

### 📈 Analytics & ROI
- **Sales Dashboard** — Přehled prodejů a výkonu
- **ROI Audit** — Analýza nákladů vs. příjmů
- **Statistics** — Detailní grafy a metriky
- **Deal Tracking** — Sledování jednotlivých obchodů

### 💳 Billing & Monetizace
- **Stripe Integration** — Platby v CZK (Kč)
- **Tiered Plans** — Starter (3 490 Kč/měs), Growth (9 490 Kč/měs), Pro (18 990 Kč/měs)
- **Usage Tracking** — Sledování spotřeby API a leadů
- **Invoice Management** — Automatické faktury

## 🛠️ Tech Stack

| Vrstva | Technologie |
|--------|-------------|
| **Frontend** | React 19 + Tailwind CSS 4 + shadcn/ui |
| **Backend** | Express 4 + tRPC 11 + Drizzle ORM |
| **Database** | MySQL/TiDB (Manus managed) |
| **Auth** | Manus OAuth + JWT Sessions |
| **AI/LLM** | Google Gemini API (invokeLLM helper) |
| **Storage** | S3 (Manus managed) |
| **Integrations** | Zapier, Make, n8n, ClickUp, Slack, ARES API |
| **Deployment** | Manus Cloud (Node.js runtime) |

## 📦 Projekt Struktura

```
ai-lead-gen/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Home.tsx             # Landing page
│   │   │   ├── Hermio.tsx           # HERA Command Center
│   │   │   ├── Generate.tsx         # Lead generation
│   │   │   ├── Kanban.tsx           # Pipeline board
│   │   │   ├── Billing.tsx          # Pricing & subscriptions
│   │   │   ├── Integrations.tsx     # Webhook setup (Czech)
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx  # Main sidebar + top bar
│   │   │   ├── AIChatWidget.tsx     # Floating HERA chat
│   │   │   ├── AIChatBox.tsx        # Chat interface
│   │   │   ├── Map.tsx              # Google Maps integration
│   │   │   └── ...
│   │   ├── lib/trpc.ts              # tRPC client setup
│   │   └── index.css                # Global styles + theme
│   └── public/                      # Static files (favicon, robots.txt)
├── server/
│   ├── routers/
│   │   ├── hermesRouter.ts          # HERA/HERMES procedures
│   │   ├── leadsRouter.ts           # Lead CRUD & generation
│   │   ├── integrationsRouter.ts    # Webhook config
│   │   ├── billingRouter.ts         # Stripe integration
│   │   └── ...
│   ├── hermesAgent.ts               # HERA orchestration logic
│   ├── promptSecurity.ts            # Prompt injection protection
│   ├── webhookRetryScheduler.ts     # Webhook retry logic
│   ├── db.ts                        # Database query helpers
│   └── _core/                       # Framework internals
│       ├── auth.ts                  # OAuth & JWT
│       ├── context.ts               # tRPC context builder
│       ├── llm.ts                   # Gemini API wrapper
│       ├── voiceTranscription.ts    # Whisper API
│       ├── imageGeneration.ts       # Image generation
│       └── ...
├── drizzle/
│   ├── schema.ts                    # Database tables & types
│   └── migrations/                  # SQL migrations
├── shared/
│   ├── hermesMastermind.ts          # HERA mission types
│   └── constants.ts                 # App constants
└── storage/                         # S3 helpers

```

## 🚀 Rychlý Start

### Lokální Vývoj (Claude Code)

**1. Klonuj projekt a nainstaluj závislosti:**
```bash
git clone <tvůj-repo> ai-lead-gen
cd ai-lead-gen
pnpm install
```

**2. Nainstaluj MySQL a vytvoř databázi:**
```bash
# macOS
brew install mysql
brew services start mysql

# Linux
sudo apt-get install mysql-server
sudo systemctl start mysql

# Vytvoř DB
mysql -u root -e "CREATE DATABASE ai_lead_gen;"
```

**3. Nastav `.env.local`:**
```bash
# Database
DATABASE_URL="mysql://root:password@localhost:3306/ai_lead_gen"

# Auth
JWT_SECRET="dev-secret-change-in-production"
VITE_APP_ID="dev-app-id"
OAUTH_SERVER_URL="https://api.manus.im"

# AI/LLM
GEMINI_API_KEY="<tvůj-gemini-api-key>"

# Stripe (dev mode)
STRIPE_SECRET_KEY="sk_test_..."
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Storage (S3)
AWS_ACCESS_KEY_ID="<tvůj-key>"
AWS_SECRET_ACCESS_KEY="<tvůj-secret>"
AWS_S3_BUCKET="ai-lead-gen-dev"
AWS_REGION="eu-central-1"
```

**4. Pushni databázové schéma:**
```bash
pnpm drizzle-kit push
```

**5. Spusť dev server:**
```bash
pnpm dev
```

Aplikace bude dostupná na `http://localhost:5173` (frontend) a `http://localhost:3000/api/trpc` (backend).

### Produkční Deployment (Manus)

Projekt je automaticky synchronizovaný s Manus platformou. Stačí:

1. **Pushni změny na GitHub:**
   ```bash
   git add .
   git commit -m "feat: new feature"
   git push origin main
   ```

2. **Manus se automaticky synchronizuje** a nasadí novou verzi

3. **Přístup na produkci:**
   - https://aileadgen-kytwarba.manus.space (default domain)
   - https://ai-lead-gen.com (custom domain)
   - https://crmleadsystem.com (custom domain)

## 🔐 Bezpečnost

### Prompt Injection Protection
Modul `server/promptSecurity.ts` chrání systém před útoky:
- Detekce 20+ injection vzorů (EN + CZ)
- Hardened system prompt (immutable boundary)
- LLM output validation
- Audit logging

Spusť testy:
```bash
pnpm test -- promptSecurity.test.ts
```

### Human-in-the-Loop
- Všechny akce z AI jsou nejprve uloženy jako **koncept**
- Žádná akce se neprovede bez explicitního schválení
- n8n Security Gateway pro kritické operace (CRM, banka, ERP)

## 📚 Klíčové Koncepty

### HERA Command Center
HERA je centrální AI mozek, který:
- Přijímá příkazy v přirozeném jazyce
- Orchestruje sub-agenty (HERMES, Lead Prospector, atd.)
- Ukládá historii interakcí
- Poskytuje real-time feedback

**Příklad:**
```
Uživatel: "Vygeneruj 50 leadů v Praze, IT sektor, do 100 zaměstnanců"
↓
HERA analyzuje zadání
↓
HERMES orchestruje:
  1. Lead Prospector → hledá v ARES registru
  2. Data Analyst → ověřuje kontakty
  3. Strategic Orchestrator → připravuje outreach
  4. Outreach Copywriter → generuje e-maily
↓
Výsledek: 50 kvalifikovaných leadů s personalizovanými e-maily
```

### Lead Pipeline
```
Nový Lead
    ↓
Kontaktován (SDR Agent pošle email)
    ↓
Kvalifikován (Lead Prospector ověří fit)
    ↓
Deal (Sales Advisor připraví nabídku)
    ↓
Uzavřen (Automatická fakturace)
```

### Webhook Integrations
```
LeadOS → n8n Security Gateway → Schválení → CRM/ERP/Slack
```

## 🧪 Testing

### Unit Tests (Vitest)
```bash
# Spusť všechny testy
pnpm test

# Spusť konkrétní test
pnpm test -- promptSecurity.test.ts

# Watch mode
pnpm test -- --watch
```

### Prompt Security Tests
```bash
pnpm test -- promptSecurity.test.ts
# Výsledek: 41/41 testů PROŠLO ✅
```

## 📖 API Dokumentace

### tRPC Procedures

#### HERA/HERMES
```typescript
// Spusť HERA misi
trpc.hermes.executeMission.useMutation({
  missionType: "generate_leads",
  params: { region: "Praha", industry: "IT", size: "1-100" }
})

// Zruš běžící misi
trpc.hermes.cancelMission.useMutation({ missionId: 123 })
```

#### Leads
```typescript
// Vygeneruj leady
trpc.leads.generate.useMutation({
  count: 50,
  filters: { region: "Praha", industry: "IT" }
})

// Načti leady
trpc.leads.list.useQuery({ status: "new", limit: 20 })
```

#### Integrations
```typescript
// Vytvoř webhook integraci
trpc.integrations.create.useMutation({
  name: "Můj Zapier",
  type: "generic",
  webhookUrl: "https://hooks.zapier.com/..."
})

// Testuj webhook
trpc.integrations.test.useMutation({ id: 1 })
```

## 🔄 Workflow

### Typický Den
1. **Ráno** — HERA generuje leady automaticky (Autopilot mode)
2. **Dopoledne** — SDR Agent kontaktuje leady (personalizované e-maily)
3. **Odpoledne** — Lead Prospector kvalifikuje odpovědi
4. **Večer** — Sales Advisor připravuje nabídky pro top leady
5. **Noc** — Webhook posílá data do CRM (n8n schválí akce)

### Manuální Intervence
- Všechny AI akce jsou nejprve **koncepty** (draft)
- Uživatel je vyzván ke schválení
- Po schválení se akce provede
- Audit log zaznamenává vše

## 🐛 Troubleshooting

### Dev Server se nespustí
```bash
# Vymaž cache a zkus znovu
rm -rf node_modules .next
pnpm install
pnpm dev
```

### Databáze není dostupná
```bash
# Zkontroluj MySQL
mysql -u root -p
# Pokud nefunguje, restartuj:
sudo systemctl restart mysql
```

### Gemini API error
```bash
# Zkontroluj API key
echo $GEMINI_API_KEY
# Ověř na https://ai.google.dev/
```

### Webhook test selhal
```bash
# Zkontroluj logs
curl -X POST https://hooks.zapier.com/... -H "Content-Type: application/json" -d '{"test": true}'
```

## 📞 Support

- **Issues** — GitHub Issues
- **Dokumentace** — https://docs.leados.ai
- **Email** — support@leados.ai
- **Slack** — #leados-support

## 📄 License

Proprietary — LeadOS Platform © 2026

## 🚀 Roadmap

Viz `todo.md` pro detailní feature roadmap a aktuální status implementace.

---

**Poslední aktualizace:** 2026-06-03  
**Verze:** 1.0.0  
**Maintainer:** PejtrView (System Designer/QA Architect)
