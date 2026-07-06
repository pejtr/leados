/**
 * Global Signal Desk — tRPC Router
 * Enchante.one / ONYX OS
 *
 * list      — cached signals with filters (Level 1–3)
 * refresh   — force cache invalidation
 * getConfig — provider status (never exposes keys)
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import type { GlobalSignal, SignalSeverity } from "../../shared/globalSignals";
import {
    getCachedSignals,
    setCachedSignals,
    invalidateCache,
    getActiveProvider,
    deduplicateSignals,
    registerProvider,
} from "../signalProviders/index";
import { mockProvider } from "../signalProviders/mockProvider";
import { worldMonitorProvider } from "../signalProviders/worldMonitorProvider";

// Register providers once at module load
registerProvider("mock", mockProvider);
registerProvider("world_monitor", worldMonitorProvider);

const SEV_ORDER: Record<SignalSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const globalSignalsRouter = router({

    /** Returns cached signals (fetches fresh if stale) with optional filters */
    list: protectedProcedure
        .input(z.object({
            category: z.string().optional(),
            severity: z.string().optional(),
            status: z.string().optional(),
            search: z.string().optional(),
            forceRefresh: z.boolean().optional().default(false),
        }))
        .query(async ({ input }) => {
            let cached = getCachedSignals();

            if (!cached || input.forceRefresh) {
                const provider = getActiveProvider();
                try {
                    const raw = await provider.fetchSignals();
                    const deduped = deduplicateSignals(raw);
                    setCachedSignals(deduped, provider.name);
                    cached = { signals: deduped, cachedAt: Date.now(), provider: provider.name };
                } catch (err) {
                    console.error("[GlobalSignalDesk] Provider failed, using mock fallback:", err);
                    const fallback = await mockProvider.fetchSignals();
                    setCachedSignals(fallback, "Mock (fallback)");
                    cached = { signals: fallback, cachedAt: Date.now(), provider: "Mock (fallback)" };
                }
            }

            let signals: GlobalSignal[] = cached.signals;

            if (input.category) signals = signals.filter(s => s.category === input.category);
            if (input.severity) signals = signals.filter(s => s.severity === input.severity);
            if (input.status) signals = signals.filter(s => s.status === input.status);
            if (input.search) {
                const q = input.search.toLowerCase();
                signals = signals.filter(s =>
                    s.title.toLowerCase().includes(q) ||
                    s.summary.toLowerCase().includes(q) ||
                    s.region.toLowerCase().includes(q) ||
                    s.tags.some((t: string) => t.toLowerCase().includes(q))
                );
            }

            // Sort severity DESC → detectedAt DESC
            signals = [...signals].sort((a, b) => {
                const sevDiff = (SEV_ORDER[a.severity] ?? 4) - (SEV_ORDER[b.severity] ?? 4);
                return sevDiff !== 0 ? sevDiff : b.detectedAt - a.detectedAt;
            });

            return {
                signals,
                meta: {
                    total: signals.length,
                    cachedAt: cached.cachedAt,
                    provider: cached.provider,
                    isDemo: cached.provider.includes("Mock") || cached.provider.includes("mock"),
                    criticalCount: signals.filter(s => s.severity === "critical").length,
                    highCount: signals.filter(s => s.severity === "high").length,
                    confirmedCount: signals.filter(s => s.status === "confirmed").length,
                },
            };
        }),

    /** Force cache invalidation and return fresh data count */
    refresh: protectedProcedure.mutation(async () => {
        invalidateCache();
        const provider = getActiveProvider();
        try {
            const raw = await provider.fetchSignals();
            const deduped = deduplicateSignals(raw);
            setCachedSignals(deduped, provider.name);
            return { ok: true, count: deduped.length, provider: provider.name };
        } catch (err) {
            const fallback = await mockProvider.fetchSignals();
            setCachedSignals(fallback, "Mock (fallback)");
            return { ok: false, count: fallback.length, provider: "Mock (fallback)", error: String(err) };
        }
    }),

    /** Return provider configuration status — safe, no keys exposed */
    getConfig: protectedProcedure.query(() => {
        const wmConfigured = !!(
            process.env.WORLD_MONITOR_API_BASE_URL &&
            process.env.WORLD_MONITOR_API_KEY
        );
        return {
            providers: [
                {
                    slug: "mock", name: "Mock Data (Demo)",
                    configured: true, active: !wmConfigured,
                    description: "Built-in fixture — no API key required",
                },
                {
                    slug: "world_monitor", name: "WorldMonitor API",
                    configured: wmConfigured, active: wmConfigured,
                    description: wmConfigured
                        ? "Connected via WORLD_MONITOR_API_KEY"
                        : "Set WORLD_MONITOR_API_BASE_URL + WORLD_MONITOR_API_KEY",
                    envVars: ["WORLD_MONITOR_API_BASE_URL", "WORLD_MONITOR_API_KEY"],
                },
                {
                    slug: "cloudflare_radar", name: "Cloudflare Radar",
                    configured: false, active: false,
                    description: "Planned — internet outage & BGP signals",
                    envVars: ["CLOUDFLARE_RADAR_API_KEY"],
                },
                {
                    slug: "usgs", name: "USGS Earthquake Hazards",
                    configured: false, active: false,
                    description: "Planned — public feed, no key required",
                },
                {
                    slug: "gdelt", name: "GDELT Project",
                    configured: false, active: false,
                    description: "Planned — global event & geopolitical signals",
                },
            ],
            cacheTtlMinutes: 15,
            complianceNote:
                "This dashboard summarizes signals from public and licensed data sources. " +
                "Always verify critical events before operational decisions. " +
                "Unverified signals are OSINT leads — treat with caution.",
        };
    }),
});
