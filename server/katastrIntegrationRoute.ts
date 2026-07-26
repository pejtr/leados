import type { Express, NextFunction, Request, Response } from "express";
import { ZodError, type ZodType } from "zod";
import {
  KATASTR_API_BASE_PATH,
  KATASTR_SCHEMA_VERSION,
  katastrConsentEvidenceSchema,
  katastrHandoffRequestSchema,
  katastrLeadUpsertSchema,
  katastrMatchUpsertSchema,
} from "../shared/katastrIntegrationContracts";
import { hasPermission, validateApiKey } from "./apiKeys";
import {
  appendKatastrConsent,
  createKatastrHandoffRequest,
  getKatastrApproval,
  KatastrIntegrationConflictError,
  KatastrIntegrationDatabaseError,
  upsertKatastrLead,
  upsertKatastrMatch,
} from "./db/katastr-integration";

interface KatastrAuthenticatedRequest extends Request {
  katastrUserId?: number;
}

type ApiHandler<T> = (
  input: T,
  req: KatastrAuthenticatedRequest
) => Promise<{ data: unknown; status?: number }>;

function readBearerToken(req: Request): string | null {
  const authorization = req.headers.authorization;
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function requireKatastrPermission(permission: string) {
  return async (
    req: KatastrAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    const token = readBearerToken(req);
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "AUTH_REQUIRED",
          message: "A Bearer API key is required",
        },
      });
    }

    const apiKey = await validateApiKey(token);
    if (!apiKey) {
      return res.status(401).json({
        ok: false,
        error: {
          code: "AUTH_INVALID",
          message: "The API key is invalid or expired",
        },
      });
    }
    if (!hasPermission(apiKey, permission)) {
      return res.status(403).json({
        ok: false,
        error: {
          code: "PERMISSION_DENIED",
          message: `Missing required permission: ${permission}`,
        },
      });
    }

    req.katastrUserId = apiKey.userId;
    next();
  };
}

function responseMeta(correlationId?: string) {
  return {
    correlationId: correlationId ?? null,
    schemaVersion: KATASTR_SCHEMA_VERSION,
    processedAt: new Date().toISOString(),
  };
}

function sendError(error: unknown, req: Request, res: Response): Response {
  const correlationId =
    typeof req.body?.correlationId === "string"
      ? req.body.correlationId
      : undefined;

  if (error instanceof ZodError) {
    return res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.issues.map(issue => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      meta: responseMeta(correlationId),
    });
  }
  if (error instanceof KatastrIntegrationConflictError) {
    return res.status(409).json({
      ok: false,
      error: {
        code: "INTEGRATION_CONFLICT",
        message: error.message,
      },
      meta: responseMeta(correlationId),
    });
  }
  if (error instanceof KatastrIntegrationDatabaseError) {
    return res.status(503).json({
      ok: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "The integration database is unavailable",
      },
      meta: responseMeta(correlationId),
    });
  }

  console.error("[KatastrIntegration] Request failed", {
    path: req.path,
    correlationId,
    error: error instanceof Error ? error.message : "Unknown error",
  });
  return res.status(500).json({
    ok: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "The integration request could not be processed",
    },
    meta: responseMeta(correlationId),
  });
}

function validatedHandler<T>(schema: ZodType<T>, handler: ApiHandler<T>) {
  return async (req: KatastrAuthenticatedRequest, res: Response) => {
    try {
      if (!req.katastrUserId) {
        return res.status(401).json({
          ok: false,
          error: { code: "AUTH_REQUIRED", message: "Authentication required" },
        });
      }
      const input = schema.parse(req.body);
      const result = await handler(input, req);
      return res.status(result.status ?? 200).json({
        ok: true,
        data: result.data,
        meta: responseMeta((input as { correlationId?: string }).correlationId),
      });
    } catch (error) {
      return sendError(error, req, res);
    }
  };
}

export function registerKatastrIntegrationRoute(app: Express): void {
  app.get(`${KATASTR_API_BASE_PATH}/manifest`, (_req, res) => {
    res.json({
      ok: true,
      data: {
        integration: "katastr-online",
        schemaVersion: KATASTR_SCHEMA_VERSION,
        state: "contract_ready",
        ownership: {
          katastrOnline: [
            "property identity",
            "property reports",
            "monitoring",
            "buyer demand",
            "seller listing",
            "match explanation",
          ],
          onyx: [
            "CRM lead",
            "consent evidence",
            "human approval",
            "partner case",
            "commission",
          ],
        },
        endpoints: [
          "POST /leads/upsert",
          "POST /matches",
          "POST /consents",
          "POST /handoffs",
          "GET /approvals/:approvalId",
        ],
        contactRelease: "human_approval_required",
      },
      meta: responseMeta(),
    });
  });

  app.post(
    `${KATASTR_API_BASE_PATH}/leads/upsert`,
    requireKatastrPermission("katastr:lead:write"),
    validatedHandler(katastrLeadUpsertSchema, async (input, req) => {
      const result = await upsertKatastrLead(req.katastrUserId!, input);
      return {
        data: {
          onyxLeadId: result.leadId,
          created: result.created,
          currentStatus: "new",
        },
        status: result.created ? 201 : 200,
      };
    })
  );

  app.post(
    `${KATASTR_API_BASE_PATH}/matches`,
    requireKatastrPermission("katastr:match:write"),
    validatedHandler(katastrMatchUpsertSchema, async (input, req) => {
      const result = await upsertKatastrMatch(req.katastrUserId!, input);
      return {
        data: {
          matchCandidateId: result.matchCandidateId,
          created: result.created,
          contactReleaseAllowed: false,
        },
        status: result.created ? 201 : 200,
      };
    })
  );

  app.post(
    `${KATASTR_API_BASE_PATH}/consents`,
    requireKatastrPermission("katastr:consent:write"),
    validatedHandler(katastrConsentEvidenceSchema, async (input, req) => {
      const result = await appendKatastrConsent(req.katastrUserId!, input);
      return {
        data: result,
        status: result.created ? 201 : 200,
      };
    })
  );

  app.post(
    `${KATASTR_API_BASE_PATH}/handoffs`,
    requireKatastrPermission("katastr:handoff:request"),
    validatedHandler(katastrHandoffRequestSchema, async (input, req) => {
      const result = await createKatastrHandoffRequest(
        req.katastrUserId!,
        input
      );
      return {
        data: {
          ...result,
          contactReleaseAllowed: false,
          nextAction: "human_approval",
        },
        status: result.created ? 202 : 200,
      };
    })
  );

  app.get(
    `${KATASTR_API_BASE_PATH}/approvals/:approvalId`,
    requireKatastrPermission("onyx:approval:read"),
    async (req: KatastrAuthenticatedRequest, res) => {
      try {
        const approvalId = req.params.approvalId?.trim();
        if (!approvalId) {
          return res.status(400).json({
            ok: false,
            error: {
              code: "VALIDATION_ERROR",
              message: "approvalId is required",
            },
          });
        }
        const approval = await getKatastrApproval(
          req.katastrUserId!,
          approvalId
        );
        if (!approval) {
          return res.status(404).json({
            ok: false,
            error: {
              code: "APPROVAL_NOT_FOUND",
              message: "Approval was not found",
            },
            meta: responseMeta(),
          });
        }
        return res.json({
          ok: true,
          data: approval,
          meta: responseMeta(),
        });
      } catch (error) {
        return sendError(error, req, res);
      }
    }
  );

  console.log(
    `[KatastrIntegration] Registered ${KATASTR_API_BASE_PATH} routes`
  );
}
