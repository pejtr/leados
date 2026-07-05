# Implementation Plan

## Safe Step‑by‑Step Implementation Plan

1. **Documentation Phase** (current): Create audit, brand architecture, omnicore architecture, roadmap, and implementation plan.
2. **Configuration Phase**: Centralize brand names into `brand.config.ts` without changing any UI code.
3. **Environment Phase**: Add `.env.example` with placeholder values.
4. **CI Phase**: Add basic CI workflow (lint, typecheck, build).
5. **Refactoring Phase**: Replace hardcoded brand references with centralized configuration.
6. **Testing Phase**: Add unit tests for core modules.
7. **Deployment Phase**: Add deployment documentation and CI/CD pipeline.
8. **Security Phase**: Perform security audit and add error tracking.
9. **Renaming Phase**: Rename repository from LEADOS to ONYX.OS.

## What Can Be Changed Immediately

- Documentation files (this directory).
- Centralized brand configuration file (no UI changes).
- `.env.example` file.
- Basic CI workflow (no production code changes).

## What Must Wait

- Replacing hardcoded brand references in UI components (requires testing).
- Adding tests (requires test infrastructure).
- Renaming repository (requires coordination with all team members).
- Implementing Telegram / agent bridge (requires design and resources).

## Files Likely Affected

- `client/src/**/*.tsx` – UI components with hardcoded brand names.
- `server/**/*.ts` – backend code with brand references.
- `shared/**/*.ts` – shared types with brand references.
- `brand.config.ts` – new centralized configuration file.
- `.env.example` – new environment variable documentation.
- `.github/workflows/ci.yml` – new CI workflow.

## Rollback Strategy

- All changes will be made in separate commits with clear messages.
- Each commit will be reversible via `git revert`.
- Before any production code changes, a backup branch will be created.
- After each phase, the team will review and approve before proceeding.
