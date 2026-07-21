// Barrel re-export — backward-compatible entry point for all DB helpers.
// All consumers that import from "./db" or "../db" will resolve here.

export { getDb } from "./core";

export {
  upsertUser,
  getUserByOpenId,
  getUserById,
  getOnboardingStatus,
  completeOnboarding,
  setUserTokenLimits,
  getUserTokenLimits,
} from "./users";

export {
  createLeadSession,
  updateLeadSession,
  getLeadSessionsByUser,
  insertLeads,
  getLeads,
  getLeadsBySession,
  getLeadsByIds,
  getLeadById,
  updateLeadStatus,
  bulkUpdateLeadStatus,
  bulkDeleteLeads,
  updateLeadQuality,
  closeDeal,
  deleteLeadsBySession,
  getLeadStats,
} from "./leads";
export type { GetLeadsOptions, LeadStats } from "./leads";

export {
  insertAuditEvent,
  getAuditEvents,
  getAuditStats,
} from "./audit";

export {
  insertLlmUsage,
  getLlmUsageStats,
  getLlmUsageHistory,
} from "./llm-usage";

export {
  insertKarrReview,
  getKarrReviews,
} from "./karr";

export {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "./email-templates";

export {
  getTeamMembers,
  addTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
  assignLead,
} from "./team";

export {
  getWebhookConfigs,
  getActiveWebhookConfigs,
  getWebhookConfigById,
  createWebhookConfig,
  updateWebhookConfig,
  deleteWebhookConfig,
  getIntegrationLogs,
  createIntegrationLog,
  createWebhookLog,
} from "./webhooks";

export {
  getAutopilotConfigs,
  getAutopilotConfigById,
  createAutopilotConfig,
  updateAutopilotConfig,
  deleteAutopilotConfig,
  getDueAutopilotConfigs,
  getAutopilotRuns,
  getRecentAutopilotRuns,
  createAutopilotRun,
  updateAutopilotRun,
} from "./autopilot";

export {
  getMatchProfiles,
  getMatchProfileById,
  createMatchProfile,
  updateMatchProfile,
  deleteMatchProfile,
} from "./match-profiles";

export {
  getSdrCampaigns,
  getSdrCampaignById,
  createSdrCampaign,
  updateSdrCampaign,
  deleteSdrCampaign,
  getSdrActivities,
  createSdrActivity,
} from "./sdr-campaigns";

export {
  getNbaRecommendations,
  createNbaRecommendation,
  updateNbaRecommendation,
  deleteNbaRecommendation,
} from "./nba-recommendations";

export {
  getSocialMonitors,
  getSocialMonitorById,
  createSocialMonitor,
  updateSocialMonitor,
  deleteSocialMonitor,
  getSocialSignals,
  getSocialSignalsByUser,
  createSocialSignal,
  updateSocialSignal,
} from "./social-listening";

export {
  createTrackingPixel,
  getTrackingPixelsByUser,
  deleteTrackingPixel,
  updateTrackingPixel,
  getVisitorSessionsByPixel,
  getVisitorSessionsByUser,
  createVisitorSession,
  getPageViewsBySession,
  createAlertRule,
  getAlertRulesByUser,
  updateAlertRule,
  deleteAlertRule,
  createSmartList,
  getSmartListsByUser,
  updateSmartList,
  deleteSmartList,
} from "./tracking";

export {
  createEmailVerification,
  getEmailVerificationsByUser,
  updateEmailVerification,
  createCampaignRule,
  getCampaignRulesByUser,
  updateCampaignRule,
  deleteCampaignRule,
} from "./campaign-rules";

export {
  createAgencyClient,
  getAgencyClientsByUser,
  updateAgencyClient,
  deleteAgencyClient,
} from "./agency";

export {
  getSpeedToLeadConfig,
  upsertSpeedToLeadConfig,
  createIcpProfile,
  getIcpProfilesByUser,
  updateIcpProfile,
  deleteIcpProfile,
  getLinkedinConnectionsByLead,
  createLinkedinConnection,
  createTechStackDetection,
  getTechStackByUser,
  getTechStackByDomain,
  updateTechStackDetection,
} from "./prospecting";

export {
  createAiAgent,
  getAiAgentsByUser,
  updateAiAgent,
  deleteAiAgent,
  getAiAgentById,
  createAiAgentLog,
  getAiAgentLogsByAgent,
  getAiMemory,
  upsertAiMemory,
  logAiPerformance,
  getAiPerformanceLogs,
  saveChatMessage,
  getChatHistory,
  clearChatHistory,
} from "./ai-agents";

export {
  getEmailSequences,
  createEmailSequence,
  deleteEmailSequence,
  getSequenceSteps,
  upsertSequenceSteps,
  enrollLeadInSequence,
  getSequenceEnrollments,
} from "./email-sequences";

export {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "./tasks";

export {
  getCapturePlans,
  createCapturePlan,
  updateCapturePlan,
  deleteCapturePlan,
} from "./capture-plans";

export {
  getMarketIntelReports,
  saveMarketIntelReport,
  getKnowledgeArticles,
  seedKnowledgeArticles,
  getCompetitiveMaps,
  saveCompetitiveMap,
} from "./intel";

export {
  insertProvenance,
  getProvenanceEntries,
  getProvenanceById,
  updateProvenance,
  getProvenanceStats,
  insertAttribution,
  getAttributionsByProvenance,
  getAttributionsByEntity,
} from "./source-data-harmonizer";

export {
  listPages,
  getPage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  listArticles,
  getArticle,
  getArticleBySlug,
  createArticle,
  updateArticle,
  deleteArticle,
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "./cms";

export {
  listKeywords,
  getKeyword,
  createKeyword,
  updateKeyword,
  deleteKeyword,
  listContentScores,
  getContentScore,
  createContentScore,
  getKeywordStats,
} from "./seo-engine";

export {
  listCategories as listCatalogCategories,
  getCategory as getCatalogCategory,
  createCategory as createCatalogCategory,
  updateCategory as updateCatalogCategory,
  deleteCategory as deleteCatalogCategory,
  listProducts,
  getProduct,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  getCatalogStats,
} from "./marketplace";
