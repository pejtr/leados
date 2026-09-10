/**
 * OPTIHUB EDGE - public surface of the edge module.
 *
 * The router is mounted by `server/_core/index.ts` via `registerOptiHubEdgeRuntime`.
 * Credential provisioning is exported for internal callers only; it is not
 * mounted on any HTTP router.
 */

export {
  EDGE_MOUNT_PATH,
  EDGE_API_VERSION,
  EDGE_SERVICE_NAME,
  buildManifest,
  createOptiHubEdgeRouter,
  defaultProtectedEdgeRoutes,
  defaultPublicEdgeRoutes,
  normalizeEdgeHost,
  registerOptiHubEdge,
  resolveEdgeSurface,
  type EdgeDeps,
  type EdgeHandlerContext,
  type EdgeRouteHandler,
  type ProtectedEdgeRoute,
  type PublicEdgeRoute,
  type PublicEdgeHandlerResult,
} from "./edge";

export {
  EDGE_AUDIT_FORBIDDEN_KEYS,
  InMemoryEdgeAuditSink,
  hashClientAddress,
  redactEdgeMetadata,
  truncateUserAgent,
  type EdgeAuditDecision,
  type EdgeAuditRecord,
  type EdgeAuditSink,
} from "./audit";

export {
  EDGE_CREDENTIAL_PREFIX,
  EDGE_SECRET_PATTERN,
  buildEdgeCredential,
  credentialStatusAt,
  generateEdgeSecret,
  hashEdgeSecret,
  isEdgeSecretFormat,
  verifyEdgeSecret,
  type EdgeCredentialRecord,
  type EdgeCredentialStatus,
  type EdgeCredentialDraft,
} from "./credentials";

export {
  EDGE_EXTERNAL_REQUEST_ID_HEADER,
  EDGE_INTERNAL_REQUEST_ID_HEADER,
  createEdgeCorrelation,
  generateInternalRequestId,
  validateExternalRequestId,
  type EdgeCorrelation,
} from "./correlation";

export {
  EDGE_ERROR_STATUS,
  edgeErrorBody,
  edgeErrorStatus,
  type EdgeErrorBody,
  type EdgeErrorCode,
} from "./errors";

export {
  EDGE_POLICY_ACTIONS,
  EDGE_POLICY_VERSION,
  authorize,
  edgePolicyRules,
  type EdgeAction,
  type EdgePolicyConfig,
  type EdgePolicyDecision,
  type EdgePolicyRule,
  type EdgeResourceRef,
} from "./policy";

export {
  EDGE_RATE_LIMITS,
  InMemoryEdgeRateLimiter,
  edgeRateLimitFor,
  type EdgeRateLimitDecision,
  type EdgeRateLimitKey,
  type EdgeRateLimiter,
  type EdgeRateLimitRule,
} from "./rateLimit";

export { EDGE_SCOPES, formatEdgeScopes, hasEdgeScope, isEdgeScope, normalizeEdgeScopes, type EdgeScope } from "./scopes";

export {
  InMemoryEdgeCredentialStore,
  type EdgeCredentialPatch,
  type EdgeCredentialStore,
} from "./store";

export {
  MAX_ROTATION_OVERLAP_MS,
  EdgeProvisioningError,
  generateEdgeCredentialId,
  provisionEdgeCredential,
  registerEdgeCredential,
  revokeEdgeCredential,
  rotateEdgeCredential,
  type EdgeCredentialSecret,
  type ProvisionEdgeCredentialInput,
  type RotateEdgeCredentialOptions,
} from "./provisioning";

export {
  buildMachineGatewayContext,
  checkRequestedTenant,
  readRequestedTenantId,
  resolveEdgeTenant,
  type EdgePrincipal,
  type MachineGatewayContext,
  type RequestedTenantCheck,
} from "./tenant";

export {
  bootstrapEdgeCredentials,
  createEdgeDeps,
  edgeAuditSink,
  edgeCredentialStore,
  edgeRateLimiter,
  edgeVersion,
  registerOptiHubEdgeRuntime,
} from "./runtime";
