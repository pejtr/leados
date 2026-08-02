# ONYXO AB Testing — Analýza & Implementace

## 1. Analýza appstocash.ai + tvých mockupů

### appstocash.ai Learnings
- **Minimalistický checkout flow**: Email → Jméno → Telefon → SMS login (3 fieldy)
- **Urgency**: "$17 today" + "60-day guarantee" + "Access in 60 seconds"
- **Trust signály**: "256-bit SSL encrypted" + "Access in 60 seconds"
- **Jednoduchá CTA**: "Get your login details instantly via SMS ⚡️"
- **Scarcity**: Omezená nabídka, urgentní tón

### Tvoje 4 Mockupy — Strategie
1. **Moderní & čistý design** — Minimalistický, modrá, device mockup (aktuální)
2. **Silnější doraz na výhody** — Benefits-first, left-aligned copy, checklist
3. **Postaveno na důkazech & referencích** — Social proof, testimonials, case studies
4. **Odvážnější & moderní styl** — Neon glow, tmavé pozadí, gradient, futuristic

---

## 2. AB Testing Framework

### Variant A: Current (Moderní & čistý design)
- Dark purple hero, device mockup, stats bar
- Dual CTA (Domluvit konzultaci + 14 dní zdarma)
- Niche grid, case studies, pricing
- **Target**: Brand-conscious, tech-savvy users

### Variant B: Benefits-Focused
- Left-aligned copy, benefit checklist (5 main benefits)
- Highlight: "Bez agentury. Bez dlouhého čekání. Bez skrytých poplatků."
- Simpler color scheme (blue + white)
- Single CTA: "Začít s 14-denní verzí zdarma"
- **Target**: Decision-makers, cost-conscious SMBs

### Variant C: Social Proof & Trust
- Lead with testimonials (3 columns: quote + face + company)
- Case studies upfront (3 featured: metrics + company name)
- "150+ spokojených klientů" prominently displayed
- Trust badges: "98% spokojenost" + "5 let na trhu"
- **Target**: Risk-averse, reference-dependent buyers

### Variant D: Bold Neon & Futuristic
- Neon cyan/magenta gradients, glassmorphism cards
- Animated elements, hover effects
- "Vaše budoucnost webu začíná tady" headline
- Futuristic imagery (tech, AI, automation)
- **Target**: Innovative, early-adopter businesses

---

## 3. Implementation Plan

### Backend (tRPC Router)
```typescript
// server/routers.ts — Add to appRouter
ab: router({
  getVariant: publicProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(({ input }) => {
      // Deterministic variant assignment (A/B/C/D)
      const variants = ['A', 'B', 'C', 'D'];
      const hash = hashUserId(input.userId || 'anonymous');
      return { variant: variants[hash % 4] };
    }),
  
  trackConversion: publicProcedure
    .input(z.object({ 
      variant: z.enum(['A', 'B', 'C', 'D']),
      event: z.string(), // 'cta_click', 'form_submit', etc.
      metadata: z.record(z.any()).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Log to analytics/database
      await db.insert(abTestEvents).values({
        variant: input.variant,
        event: input.event,
        timestamp: new Date(),
        metadata: input.metadata,
      });
    }),
});
```

### Frontend (Variant Routing)
```typescript
// client/src/lib/ab-test.ts
export function getVariant(): 'A' | 'B' | 'C' | 'D' {
  const stored = localStorage.getItem('ab_variant');
  if (stored) return stored as any;
  
  // Fetch from server (deterministic per user)
  const variant = await trpc.ab.getVariant.query({});
  localStorage.setItem('ab_variant', variant);
  return variant;
}

export function trackEvent(event: string, metadata?: any) {
  const variant = getVariant();
  trpc.ab.trackConversion.mutate({
    variant,
    event,
    metadata,
  });
}
```

### Component Structure
```
client/src/pages/
  ├── Home.tsx (Variant A — current)
  ├── HomeVariantB.tsx (Benefits-focused)
  ├── HomeVariantC.tsx (Social proof)
  └── HomeVariantD.tsx (Bold neon)

client/src/App.tsx
  ├── useEffect(() => {
  │     const variant = getVariant();
  │     setHomeComponent(variants[variant]);
  │   })
```

---

## 4. Metrics to Track

| Metric | Definition |
|--------|-----------|
| **CTR** | Click-through rate on main CTA |
| **Form Submission** | % users who start contact form |
| **Conversion** | % users who complete inquiry |
| **Scroll Depth** | How far users scroll (%) |
| **Time on Page** | Average session duration |
| **Bounce Rate** | % users who leave immediately |

---

## 5. Timeline

- **Week 1**: Implement AB framework + Variant B & C
- **Week 2**: Implement Variant D + analytics dashboard
- **Week 3**: Run test (1000+ impressions per variant)
- **Week 4**: Analyze results, scale winning variant

---

## 6. Expected Outcomes

- **Variant A** (Current): Baseline — 8-12% conversion
- **Variant B** (Benefits): +15-25% if benefits resonate
- **Variant C** (Social Proof): +20-30% if trust is barrier
- **Variant D** (Bold Neon): +5-10% if brand differentiation matters

**Winner**: Highest conversion rate → Scale to 100%
