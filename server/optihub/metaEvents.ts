export interface MetaEventsBridgeStatus {
  readonly configured: boolean;
  readonly reachable: boolean;
  readonly status: unknown | null;
  readonly reason: string;
}

function cleanBase(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.replace(/\/+$/, "") : null;
}

export async function readMetaEventsBridgeStatus(
  env: NodeJS.ProcessEnv = process.env,
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)
): Promise<MetaEventsBridgeStatus> {
  const baseUrl = cleanBase(env["OPTIHUB_OMNIFORGE_URL"]);
  const token = env["OPTIHUB_OMNIFORGE_CONTROL_TOKEN"]?.trim() ?? "";

  if (baseUrl === null || token === "") {
    return {
      configured: false,
      reachable: false,
      status: null,
      reason: "omniforge_meta_bridge_not_configured",
    };
  }

  try {
    const response = await fetchImpl(
      `${baseUrl}/api/v1/internal/meta/conversions/status`,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${token}`,
        },
        signal: AbortSignal.timeout(8_000),
      }
    );

    if (!response.ok) {
      return {
        configured: true,
        reachable: false,
        status: null,
        reason: `omniforge_status_http_${String(response.status)}`,
      };
    }

    return {
      configured: true,
      reachable: true,
      status: await response.json(),
      reason: "ready",
    };
  } catch {
    return {
      configured: true,
      reachable: false,
      status: null,
      reason: "omniforge_unreachable",
    };
  }
}
