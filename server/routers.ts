import { router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import { publicProcedure } from "./_core/trpc";

// ── Extracted inline routers ──────────────────────────────────────────────────
import { leadsInlineRouter } from "./routers/leadsInline";
import { templatesRouter, sheetsRouter, teamRouter } from "./routers/templatesSheetsTeam";
import { autopilotInlineRouter, integrationsInlineRouter, matchingInlineRouter } from "./routers/autopilotIntegrationsMatching";
import { sdrInlineRouter, nbaInlineRouter, socialInlineRouter } from "./routers/sdrNbaSocial";
import {
  trackingPixelRouter, alertRulesRouter, smartListsRouter, emailVerificationRouter,
  campaignRulesRouter, agencyRouter, speedToLeadRouter, icpBuilderRouter,
  techStackRouter, aiAgentsRouter, linkedinConnectionsRouter, onboardingRouter,
} from "./routers/featureRouters";
import {
  sequencesRouter, tasksRouter, capturePlansRouter, marketIntelRouter,
  knowledgeRouter, billingRouter, aiChatRouter, competitiveMapRouter,
  morningBriefingRouter, followUpRouter, callsRouter, crmRouter, projectsRouter,
} from "./routers/domainRouters";

// ── Pre-existing extracted routers ────────────────────────────────────────────
import { adCampaignsRouter } from "./adCampaignsRouter";
import { portfolioShareRouter } from "./portfolioShareRouter";
import { fiveBrainsRouter } from "./fiveBrainsRouter";
import { dailyReportRouter } from "./dailyReportRouter";
import { constitutionRouter } from "./routers/constitution";
import { leadsRouter as capturedLeadsRouter } from "./routers/leads";
import { benchmarkRouter } from "./routers/benchmark";
import { hermesRouter } from "./hermesRouter";
import { heraRouter } from "./heraRouter";
import { deepSleepRouter } from "./routers/deepSleep";
import { radarRouter } from "./radarRouter";
import { globalEarningsRouter } from "./routers/globalEarnings";
import { apiKeysRouter } from "./routers/apiKeysRouter";
import { webhooksRouter } from "./routers/webhooksRouter";
import { ingestedLeadsRouter } from "./routers/ingestedLeads";
import { aiSkillsRouter } from "./routers/aiSkills";
import { roiAuditRouter } from "./routers/roiAudit";
import { integrationsRouter } from "./routers/integrationsRouter";
import { affiliateRouter } from "./routers/affiliateRouter";
import { googleMapsRouter } from "./routers/googleMapsRouter";
import { webAuditRouter } from "./routers/webAuditRouter";
import { aresRouter } from "./routers/ares";
import { globalSignalsRouter } from "./routers/globalSignals";
import { redditRouter } from "./routers/redditRouter";
import { auditRouter } from "./routers/audit";
import { llmUsageRouter } from "./routers/llmUsage";
import { karrRouter } from "./routers/karr";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  reddit: redditRouter,

  // ── Extracted inline routers ──────────────────────────────────────────────
  leads: leadsInlineRouter,
  templates: templatesRouter,
  sheets: sheetsRouter,
  team: teamRouter,
  autopilot: autopilotInlineRouter,
  integrations: integrationsInlineRouter,
  matching: matchingInlineRouter,
  sdr: sdrInlineRouter,
  nba: nbaInlineRouter,
  social: socialInlineRouter,
  trackingPixel: trackingPixelRouter,
  alertRules: alertRulesRouter,
  smartLists: smartListsRouter,
  emailVerification: emailVerificationRouter,
  campaignRules: campaignRulesRouter,
  agency: agencyRouter,
  speedToLead: speedToLeadRouter,
  icpBuilder: icpBuilderRouter,
  techStack: techStackRouter,
  aiAgents: aiAgentsRouter,
  linkedinConnections: linkedinConnectionsRouter,
  onboarding: onboardingRouter,
  sequences: sequencesRouter,
  tasks: tasksRouter,
  capturePlans: capturePlansRouter,
  marketIntel: marketIntelRouter,
  knowledge: knowledgeRouter,
  billing: billingRouter,
  aiChat: aiChatRouter,
  competitiveMap: competitiveMapRouter,
  morningBriefing: morningBriefingRouter,
  followUp: followUpRouter,
  calls: callsRouter,
  crm: crmRouter,
  projects: projectsRouter,

  // ── Pre-existing extracted routers ────────────────────────────────────────
  adCampaigns: adCampaignsRouter,
  portfolioShare: portfolioShareRouter,
  fiveBrains: fiveBrainsRouter,
  dailyReport: dailyReportRouter,
  constitution: constitutionRouter,
  capturedLeads: capturedLeadsRouter,
  benchmark: benchmarkRouter,
  hermes: hermesRouter,
  hera: heraRouter,
  deepSleep: deepSleepRouter,
  radar: radarRouter,
  globalEarnings: globalEarningsRouter,
  ingestedLeads: ingestedLeadsRouter,
  aiSkills: aiSkillsRouter,
  roiAudit: roiAuditRouter,
  apiKeys: apiKeysRouter,
  webhooks: webhooksRouter,
  affiliate: affiliateRouter,
  googleMaps: googleMapsRouter,
  webAudit: webAuditRouter,
  ares: aresRouter,
  globalSignals: globalSignalsRouter,
  connectedApps: integrationsRouter,
  audit: auditRouter,
  llmUsage: llmUsageRouter,
  karr: karrRouter,
});
export type AppRouter = typeof appRouter;
