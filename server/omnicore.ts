const OMNICORE_VERSION = "1.0.0";

export interface OmnicoreModule {
  id: string;
  name: string;
  description: string;
  status: "active" | "inactive" | "planned";
  entrypoint?: string;
  docs?: string;
}

const MODULE_REGISTRY: OmnicoreModule[] = [
  { id: "hub", name: "Hub", description: "Central API gateway for external projects", status: "active", entrypoint: "/api/hub", docs: "/docs/omnicore-architecture" },
  { id: "cms", name: "CMS", description: "Content management for websites and articles", status: "active", entrypoint: "/cms" },
  { id: "seo", name: "SEO Engine", description: "Keyword analysis, meta tags, content scoring", status: "active", entrypoint: "/seo" },
  { id: "marketplace", name: "Marketplace / Catalog", description: "Product catalog, pricing, inventory", status: "active", entrypoint: "/marketplace" },
  { id: "ai-assistants", name: "AI Assistants", description: "AI chatbots for lead qualification & support", status: "active", entrypoint: "/hermes" },
  { id: "leadgen", name: "Leadgen", description: "Forms, landing pages, scoring, CRM", status: "active", entrypoint: "/generate" },
  { id: "analytics", name: "Analytics", description: "BI dashboards, reporting, visualization", status: "active", entrypoint: "/stats" },
  { id: "automation", name: "Automation", description: "Workflows, scheduled tasks, event-driven actions", status: "active", entrypoint: "/autopilot" },
  { id: "integrations", name: "Partner Integrations", description: "Google Ads, Sheets, ClickUp, Slack, webhooks", status: "active", entrypoint: "/integrations" },
  { id: "telegram-bridge", name: "Telegram / Agent Bridge", description: "Telegram agent orchestration and communication", status: "active", entrypoint: "/telegram" },
  { id: "data-harmonizer", name: "Source Data Harmonizer", description: "Data provenance, attribution, confidence scoring", status: "active", entrypoint: "/source-data-harmonizer" },
];

export function getModuleRegistry(): OmnicoreModule[] {
  return MODULE_REGISTRY;
}

export function getActiveModules(): OmnicoreModule[] {
  return MODULE_REGISTRY.filter(m => m.status === "active");
}

export function getModuleById(id: string): OmnicoreModule | undefined {
  return MODULE_REGISTRY.find(m => m.id === id);
}

export function getOmnicoreInfo() {
  return {
    name: "OMNICORE",
    version: OMNICORE_VERSION,
    description: "Intelligence Layer for the Digital Economy",
    tagline: "We don't aggregate data. We generate actionable foresight.",
    activeModules: getActiveModules().length,
    totalModules: MODULE_REGISTRY.length,
    plannedModules: MODULE_REGISTRY.filter(m => m.status === "planned").length,
  };
}
