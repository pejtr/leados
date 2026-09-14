/**
 * OPTIHUB EDGE - public `/connect` facade (mcp surface only).
 *
 * A second *mount* of the canonical MCP runtime at the friendly root paths
 * `/connect` (MCP Streamable HTTP) and `/health`. It is deliberately not a second
 * MCP server: `POST /connect` delegates to the same adapter (`handleMcpPost`)
 * through the same protected pipeline - origin authentication, credential
 * verification, tenant resolution, scope authorization, policy evaluation, rate
 * limiting and audit - bound to the `mcp` surface.
 *
 * The facade only exists on the enabled `mcp` surface. On every other hostname
 * the request falls through untouched, so the rest of the app keeps its existing
 * behaviour. On the `mcp` surface nothing falls through to the SPA: that host is
 * an agent ingress, not a browser surface.
 */

import express, { type NextFunction, type Request, type Response, type Router } from "express";

import { ALIAS_QUERY_PARAM, resolveRequestedAlias, type AliasRegistry } from "./alias";
import {
  EDGE_EXTERNAL_REQUEST_ID_HEADER,
  EDGE_INTERNAL_REQUEST_ID_HEADER,
  createEdgeCorrelation,
  type EdgeCorrelation,
} from "./correlation";
import {
  EDGE_BODY_LIMIT,
  EDGE_SERVICE_NAME,
  buildManifest,
  checkEdgeReadiness,
  createEdgeRequestHandlers,
  resolveEdgeSurface,
  type EdgeDeps,
  type PublicEdgeHandlerResult,
} from "./edge";
import { edgeErrorBody, edgeErrorStatus } from "./errors";
import { edgeHandlerResponse } from "./handlerResponse";
import {
  MCP_PROTOCOL_VERSION,
  MCP_SERVER_NAME,
  MCP_TOOLS,
  handleMcpPost,
  type McpEdgePorts,
} from "./mcp";

export const CONNECT_ROUTE_PATH = "/connect";
export const CONNECT_HEALTH_ROUTE_PATH = "/health";

export interface ConnectFacadeOptions {
  /** Alias registry. Defaults to `deps.aliases`. */
  readonly aliases?: AliasRegistry;
}

function isMcpSurface(req: Request, deps: EdgeDeps): boolean {
  const resolution = resolveEdgeSurface(req.headers.host, deps);
  return resolution.kind === "enabled" && resolution.surface?.id === "mcp";
}

/**
 * Public interoperability presentation. Safe by construction: it names the
 * service, the transport, the auth scheme and the alias context, and never
 * returns the internal identity behind an alias.
 */
function buildConnectPresentation(
  deps: EdgeDeps,
  aliases: AliasRegistry | undefined,
  req: Request,
  correlation: EdgeCorrelation,
): PublicEdgeHandlerResult {
  const resolution =
    aliases === undefined
      ? ({ kind: "none" } as const)
      : resolveRequestedAlias(aliases, req.query[ALIAS_QUERY_PARAM]);

  if (resolution.kind === "malformed") {
    return {
      status: edgeErrorStatus("BAD_REQUEST"),
      body: edgeErrorBody("BAD_REQUEST", "malformed_alias", correlation.requestId),
    };
  }

  // An unknown alias is presented exactly like no alias at all, so the endpoint
  // is not an enumeration oracle. A known alias names the connect context.
  const connection =
    resolution.kind === "known"
      ? { alias: resolution.alias, accessState: "KNOWN" }
      : { accessState: "PUBLIC" };

  return {
    status: 200,
    body: {
      service: EDGE_SERVICE_NAME,
      protocol: "MCP",
      transport: "streamable-http",
      protocolVersion: MCP_PROTOCOL_VERSION,
      endpoint: CONNECT_ROUTE_PATH,
      server: { name: MCP_SERVER_NAME, version: deps.version },
      auth: { scheme: "Bearer", header: "Authorization", queryTokenForbidden: true },
      connection,
      tools: MCP_TOOLS.map(tool => tool.name),
      requestId: correlation.requestId,
      howToRequestAccess:
        "Aliases are assigned by the OPTIHUB operator. Knowing an alias grants nothing by itself; a Bearer ohk_ credential is required for an authorized session.",
    },
  };
}

export function createOptiHubConnectFacade(
  deps: EdgeDeps,
  options: ConnectFacadeOptions = {},
): Router {
  const router = express.Router();
  const handlers = createEdgeRequestHandlers(deps);
  const aliases = options.aliases ?? deps.aliases;
  const parseJson = express.json({ limit: EDGE_BODY_LIMIT });

  const ports: McpEdgePorts = {
    version: deps.version,
    endpoint: CONNECT_ROUTE_PATH,
    manifest: () => buildManifest(deps),
    readiness: () => checkEdgeReadiness(deps),
    aliases,
  };

  // GET /health - the MCP gateway's own health, sourced from the same readiness
  // check as /api/optihub/ready (no duplicated readiness logic).
  router.get(CONNECT_HEALTH_ROUTE_PATH, (req: Request, res: Response, next: NextFunction) => {
    if (!isMcpSurface(req, deps)) {
      next();
      return;
    }
    void handlers.handlePublic(
      {
        method: "get",
        path: CONNECT_HEALTH_ROUTE_PATH,
        label: CONNECT_HEALTH_ROUTE_PATH,
        handler: async () => {
          const ready = await checkEdgeReadiness(deps);
          return {
            status: ready ? 200 : 503,
            body: {
              status: ready ? "ok" : "not_ready",
              service: EDGE_SERVICE_NAME,
              transport: "streamable-http",
              protocolVersion: MCP_PROTOCOL_VERSION,
              endpoint: CONNECT_ROUTE_PATH,
              server: { name: MCP_SERVER_NAME, version: deps.version },
            },
          };
        },
      },
      req,
      res,
    );
  });

  // GET / and GET /connect - public presentation.
  for (const path of ["/", CONNECT_ROUTE_PATH]) {
    router.get(path, (req: Request, res: Response, next: NextFunction) => {
      if (!isMcpSurface(req, deps)) {
        next();
        return;
      }
      void handlers.handlePublic(
        {
          method: "get",
          path,
          label: path,
          handler: (request, correlation) =>
            buildConnectPresentation(deps, aliases, request, correlation),
        },
        req,
        res,
      );
    });
  }

  // POST /connect - MCP Streamable HTTP, through the canonical pipeline.
  router.post(CONNECT_ROUTE_PATH, (req: Request, res: Response, next: NextFunction) => {
    if (!isMcpSurface(req, deps)) {
      next();
      return;
    }
    parseJson(req, res, error => {
      if (error) {
        next(error);
        return;
      }
      void handlers.handleProtected(
        {
          method: "post",
          path: CONNECT_ROUTE_PATH,
          label: CONNECT_ROUTE_PATH,
          action: "mcp:rpc",
          requiredScope: "projects:read",
          policyAction: "projects:read",
          risk: "read",
          surfaces: ["mcp"],
          handler: context => handleMcpPost(context, ports),
        },
        req,
        res,
      );
    });
  });

  // DELETE /connect - the canonical runtime is stateless (no server-side MCP
  // session), so there is nothing to terminate. Answered 204, still through the
  // authenticated pipeline.
  router.delete(CONNECT_ROUTE_PATH, (req: Request, res: Response, next: NextFunction) => {
    if (!isMcpSurface(req, deps)) {
      next();
      return;
    }
    void handlers.handleProtected(
      {
        method: "delete",
        path: CONNECT_ROUTE_PATH,
        label: CONNECT_ROUTE_PATH,
        action: "mcp:rpc",
        requiredScope: "projects:read",
        policyAction: "projects:read",
        risk: "read",
        surfaces: ["mcp"],
        handler: () => edgeHandlerResponse(204),
      },
      req,
      res,
    );
  });

  // Body-parser failures keep the machine contract (never a stack trace).
  router.use((error: unknown, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent || !isMcpSurface(req, deps)) {
      next(error);
      return;
    }
    const tooLarge = (error as { type?: unknown } | null)?.type === "entity.too.large";
    const code = tooLarge ? "PAYLOAD_TOO_LARGE" : "BAD_REQUEST";
    const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
    res.setHeader(EDGE_INTERNAL_REQUEST_ID_HEADER, correlation.requestId);
    res
      .status(edgeErrorStatus(code))
      .json(
        edgeErrorBody(
          code,
          tooLarge ? "request_body_too_large" : "request_body_invalid",
          correlation.requestId,
        ),
      );
  });

  // On the `mcp` surface nothing falls through to the SPA or the browser app:
  // this hostname is an agent ingress only.
  router.use((req: Request, res: Response, next: NextFunction) => {
    if (!isMcpSurface(req, deps)) {
      next();
      return;
    }
    const correlation = createEdgeCorrelation(req.headers[EDGE_EXTERNAL_REQUEST_ID_HEADER]);
    res.setHeader(EDGE_INTERNAL_REQUEST_ID_HEADER, correlation.requestId);
    res
      .status(edgeErrorStatus("NOT_FOUND"))
      .json(edgeErrorBody("NOT_FOUND", "unknown_mcp_route", correlation.requestId));
  });

  return router;
}
