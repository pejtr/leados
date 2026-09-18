# OMNI Tool Fabric

OMNI Tool Fabric is the governed capability layer behind OPTIHUB MCP. Public callers reach only `mcp.optihub.cz`; provider credentials remain server-side.

## Providers

- Firecrawl — web research and extraction.
- Brave Search — current search and discovery.
- Stripe — billing and finance.
- Figma — design context.
- Notion — project knowledge.
- Mem0 — persistent memory.
- Composio — long-tail SaaS operations.
- Playwright — browser automation.
- E2B — isolated compute.

## Security model

Every provider is disabled by default. Activation requires the global `OPTIHUB_TOOL_FABRIC_ENABLED=true` kill switch plus a provider-specific `OPTIHUB_TOOL_<PROVIDER>_ENABLED=true` flag and its server-side credentials.

Public MCP tools in this phase:
- `omni_tool_catalog`: non-secret readiness state.
- `omni_tool_route`: intent routing plan.
- `omni_tool_probe`: MCP initialize + tools/list only.
- `omni_tool_read`: explicit read allowlist only.

Mutating provider tools are rejected. Stripe writes, browser submits, provider writes, deploys and destructive actions remain behind a future policy + OMNICORE + human approval executor.

## Revenue-first activation

1. Brave Search + Firecrawl for lead discovery and market research.
2. Composio for CRM/ops discovery and later gated actions.
3. Notion + Mem0 for project/account context.
4. Figma for design-to-code context.
5. Playwright as an internal browser sidecar.
6. E2B as isolated compute.
7. Stripe remains financial-gated and does not replace `pay.optimateo.com` / Comgate.

No provider may bypass OPTIHUB identity, tenant, scopes, policy, rate limiting or audit.
