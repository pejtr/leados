# Brand Architecture - OPTIMATEO / OPTIHUB / ONYX OS

This document defines the canonical naming hierarchy. The security and network
boundary is specified in
[OPTIHUB_ONYX_BOUNDARY.md](./OPTIHUB_ONYX_BOUNDARY.md).

## OPTIMATEO = commercial brand

OPTIMATEO is the company, contracting party and commercial owner of customer
services. The isolated payment entrypoint remains `pay.optimateo.com`.

## OPTIHUB = customer and platform edge

OPTIHUB is where customers, services and external agents enter the ecosystem:

- `www.optihub.cz` - public information and onboarding,
- `app.optihub.cz` - authenticated customer workspace,
- `api.optihub.cz` - authenticated service API,
- `mcp.optihub.cz` - authenticated agent capability gateway.

OPTIHUB is not the intelligence core. It enforces authentication, tenant
resolution, authorization and policy before a request reaches ONYX.

## ONYX OS = private operating intelligence

ONYX OS is the private control plane and source of truth for orchestration,
approvals, CRM state and revenue attribution. It has no direct public hostname.

## ONYXO = executive orchestration

ONYXO is the private executive and orchestration layer that selects and
coordinates approved ONYX capabilities. It is not a separate public platform.

## OMNICORE = independent QA and security

OMNICORE independently evaluates quality, security, truth and release policy.
It may block an ONYX action, but it does not replace ONYX ownership of workflow
state and is not exposed as a public customer hub.

## Capability products

- **LEADOS** owns lead discovery, qualification and CRM execution.
- **OMNI PROFIT** owns economic analysis and revenue control.
- **OMNIVIDEO** owns media creation, rendering and asset provenance before final
  readiness.
- **FORGE / OMNIADS** own approved publication, distribution and campaign
  execution after the relevant readiness boundary.
- **ONYX WEB** is an OPTIMATEO-delivered web capability, not the ecosystem
  gateway.

## Repository naming

LEADOS remains the repository's legacy name. New architecture and integration
code should use the canonical product or layer name instead of inventing another
public OS or hub.

## Naming rules

- Use **OPTIMATEO** for company, contracts, sales and payment ownership.
- Use **OPTIHUB** for public customer and machine entrypoints.
- Use **ONYX OS** for private operating intelligence and workflow state.
- Use **ONYXO** for executive orchestration.
- Use **OMNICORE** for independent QA, security and release policy.
- Do not describe ONYX OS or OMNICORE as a directly accessible public app.
- Do not expose private service names as public DNS endpoints.
