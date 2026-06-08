# LeadOS — Deployment Guide

**Cíl:** Nasadit LeadOS na produkční server s maximální bezpečností, výkonem a spolehlivostí.

---

## 📋 Pre-Deployment Checklist

Před nasazením se ujisti, že máš:

- ✅ Všechny testy prošly (`pnpm test`)
- ✅ TypeScript bez chyb (`pnpm tsc --noEmit`)
- ✅ Produkční env vars nastaveny (viz `.env.production`)
- ✅ Database backupy připraveny
- ✅ SSL certifikáty platné
- ✅ Monitoring a alerting nakonfigurováno
- ✅ Rollback plán připraven

---

## 🚀 Deployment Options

### Option 1: Manus Cloud (Doporučeno)

**Výhody:**
- ✅ Automatické scaling
- ✅ Managed database (MySQL/TiDB)
- ✅ Built-in S3 storage
- ✅ SSL certifikáty (Let's Encrypt)
- ✅ CDN + DDoS protection
- ✅ Monitoring a alerting
- ✅ Automatic backups

**Postup:**

1. **Push na GitHub:**
   ```bash
   git add .
   git commit -m "production: ready for deployment"
   git push origin main
   ```

2. **Manus se automaticky nasadí:**
   - Detekuje push na `main` branch
   - Spustí build pipeline
   - Nasadí novou verzi
   - Aktualizuje DNS

3. **Ověř nasazení:**
   ```bash
   curl https://ai-lead-gen.com/api/health
   # Expected: { "status": "ok", "version": "1.0.0" }
   ```

4. **Přístup na produkci:**
   - https://ai-lead-gen.com (custom domain)
   - https://aileadgen-kytwarba.manus.space (default domain)
   - https://crmleadsystem.com (custom domain)

---

### Option 2: Docker + Cloud Run (Google Cloud)

**Výhody:**
- ✅ Plná kontrola nad infrastrukturou
- ✅ Serverless (pay-per-request)
- ✅ Automatické scaling
- ✅ Integrovaný monitoring

**Postup:**

1. **Vytvoř Dockerfile:**
   ```dockerfile
   FROM node:22-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN pnpm install --prod
   COPY . .
   RUN pnpm build
   EXPOSE 3000
   CMD ["node", "server/index.js"]
   ```

2. **Build a push image:**
   ```bash
   docker build -t gcr.io/PROJECT_ID/leados:latest .
   docker push gcr.io/PROJECT_ID/leados:latest
   ```

3. **Deploy na Cloud Run:**
   ```bash
   gcloud run deploy leados \
     --image gcr.io/PROJECT_ID/leados:latest \
     --platform managed \
     --region europe-west1 \
     --set-env-vars DATABASE_URL=$DATABASE_URL,JWT_SECRET=$JWT_SECRET \
     --memory 512Mi \
     --cpu 1 \
     --concurrency 80 \
     --max-instances 100
   ```

4. **Setup custom domain:**
   ```bash
   gcloud run domain-mappings create \
     --service leados \
     --domain ai-lead-gen.com \
     --region europe-west1
   ```

---

### Option 3: Docker Compose + VPS (DigitalOcean, Linode)

**Výhody:**
- ✅ Nízké náklady
- ✅ Plná kontrola
- ✅ Jednoduchá správa

**Postup:**

1. **Vytvoř docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: ${DATABASE_URL}
         JWT_SECRET: ${JWT_SECRET}
       depends_on:
         - db
     db:
       image: mysql:8.0
       environment:
         MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
         MYSQL_DATABASE: ai_lead_gen
       volumes:
         - db_data:/var/lib/mysql
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/nginx/ssl
   volumes:
     db_data:
   ```

2. **Deploy na VPS:**
   ```bash
   ssh root@your-vps.com
   cd /opt/leados
   docker-compose pull
   docker-compose up -d
   ```

---

## 🔐 Security Checklist

### Environment Variables
```bash
# Nikdy nesdílej tyto hodnoty!
DATABASE_URL=mysql://user:pass@host/db
JWT_SECRET=<random-64-char-string>
GEMINI_API_KEY=<api-key>
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### Database Security
```sql
-- Vytvoř dedikovaného uživatele pro aplikaci
CREATE USER 'leados_app'@'localhost' IDENTIFIED BY 'strong-password';
GRANT ALL PRIVILEGES ON ai_lead_gen.* TO 'leados_app'@'localhost';
FLUSH PRIVILEGES;

-- Backup
mysqldump -u root -p ai_lead_gen > backup-$(date +%Y%m%d).sql
```

### SSL/TLS
- ✅ Manus: Automatické (Let's Encrypt)
- ✅ Cloud Run: Automatické
- ✅ VPS: Certbot + Let's Encrypt
  ```bash
  sudo certbot certonly --standalone -d ai-lead-gen.com
  ```

### Firewall
```bash
# UFW (Ubuntu)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### Rate Limiting
```typescript
// server/_core/middleware.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minut
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## 📊 Monitoring & Logging

### Health Check Endpoint
```typescript
// server/_core/health.ts
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: await checkDatabase(),
    memory: process.memoryUsage()
  });
});
```

### Logging
```typescript
// server/_core/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

logger.info('Application started', { version: '1.0.0' });
```

### Monitoring Services
- **Uptime Monitoring:** Uptime Robot, Statuspage.io
- **Error Tracking:** Sentry, Rollbar
- **Performance:** New Relic, DataDog
- **Logs:** ELK Stack, Loggly, Papertrail

---

## 🔄 Continuous Deployment (CI/CD)

### GitHub Actions Pipeline

**File:** `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: pnpm install
      - run: pnpm test
      - run: pnpm tsc --noEmit

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Manus
        run: |
          # Manus se automaticky nasadí
          echo "Deployment triggered by GitHub push"
      - name: Notify Slack
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "LeadOS deployed to production ✅"
            }
```

---

## 📈 Performance Optimization

### Caching Strategy
```typescript
// Cache static assets (1 rok)
app.use(express.static('client/dist', {
  maxAge: '1y',
  etag: false
}));

// Cache API responses (5 minut)
app.use('/api/', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### Database Optimization
```sql
-- Indexy pro rychlé vyhledávání
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(createdAt);
CREATE INDEX idx_leads_user_id ON leads(userId);

-- Analyze performance
EXPLAIN SELECT * FROM leads WHERE status = 'new';
```

### CDN Configuration
- ✅ Manus: Automatické (CloudFlare)
- ✅ Cloud Run: Cloud CDN
- ✅ VPS: CloudFlare, Bunny CDN

---

## 🔄 Rollback Procedure

### Pokud se něco pokazí:

**Manus:**
```bash
# Rollback na předchozí verzi
# Via Management UI: Version History → Rollback
```

**Cloud Run:**
```bash
# Rollback na předchozí image
gcloud run deploy leados \
  --image gcr.io/PROJECT_ID/leados:previous-tag \
  --region europe-west1
```

**Docker Compose:**
```bash
# Rollback na předchozí verzi
docker-compose down
git checkout <previous-commit>
docker-compose up -d
```

---

## 🆘 Troubleshooting

### Application won't start
```bash
# Check logs
docker logs leados
# or
tail -f /var/log/leados/error.log

# Check database connection
mysql -u leados_app -p -h localhost ai_lead_gen -e "SELECT 1;"
```

### High memory usage
```bash
# Check Node process
ps aux | grep node
# Increase memory limit
docker update --memory 2g leados
```

### Database performance issues
```sql
-- Check slow queries
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Optimize tables
OPTIMIZE TABLE leads, users, integrations;
```

### SSL certificate expired
```bash
# Renew certificate
sudo certbot renew --force-renewal
# Restart nginx
sudo systemctl restart nginx
```

---

## 📞 Support & Escalation

| Problém | Řešení |
|---------|--------|
| **Application crash** | Check logs, restart service, rollback if needed |
| **Database down** | Check MySQL service, restore from backup |
| **High latency** | Check CDN, database indexes, API response times |
| **Security breach** | Rotate secrets, review logs, patch vulnerability |
| **Out of memory** | Increase server resources, optimize code |

---

## 🎯 Post-Deployment

1. **Smoke Tests**
   ```bash
   # Test core functionality
   curl https://ai-lead-gen.com/api/health
   curl https://ai-lead-gen.com/api/trpc/auth.me
   ```

2. **Monitor Metrics**
   - CPU usage
   - Memory usage
   - Response time
   - Error rate
   - Database connections

3. **User Communication**
   - Announce deployment
   - Share release notes
   - Gather feedback

---

**Poslední aktualizace:** 2026-06-03  
**Verze:** 1.0.0  
**Maintainer:** PejtrView
