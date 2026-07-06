/**
 * SignalProvider abstraction — Level 2/3
 * Enchante.one / ONYX OS — Global Signal Desk
 *
 * Any new signal source must implement the SignalProvider interface.
 * Env-based selection: WORLD_MONITOR_API_KEY present → WorldMonitorProvider
 *                      otherwise → MockProvider (always available)
 */
import type { GlobalSignal } from "../../shared/globalSignals";

export type { GlobalSignal };

// ─── Provider interface ───────────────────────────────────────────────────────

export interface SignalProvider {
    /** Human-readable provider name */
    name: string;
    /** Slug used in rawProvider field for deduplication */
    slug: string;
    /** Fetch fresh signals. May throw on network error. */
    fetchSignals(): Promise<GlobalSignal[]>;
    /** Optional: check if provider is configured / reachable */
    isConfigured(): boolean;
}

// ─── Provider registry ────────────────────────────────────────────────────────

export type ProviderSlug = "mock" | "world_monitor" | "gdelt" | "usgs" | "cloudflare_radar";

const registry: Map<ProviderSlug, SignalProvider> = new Map();

export function registerProvider(slug: ProviderSlug, provider: SignalProvider): void {
    registry.set(slug, provider);
}

export function getProvider(slug: ProviderSlug): SignalProvider | undefined {
    return registry.get(slug);
}

export function getActiveProvider(): SignalProvider {
    // Priority: WorldMonitor if key present, else Mock
    const worldMonitor = registry.get("world_monitor");
    if (worldMonitor?.isConfigured()) return worldMonitor;
    const mock = registry.get("mock");
    if (!mock) throw new Error("[GlobalSignalDesk] No signal provider registered — call registerProvider first");
    return mock;
}

// ─── In-memory cache (Level 3) ────────────────────────────────────────────────

interface SignalCache {
    signals: GlobalSignal[];
    cachedAt: number;
    provider: string;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let _cache: SignalCache | null = null;

export function getCachedSignals(): SignalCache | null {
    if (!_cache) return null;
    if (Date.now() - _cache.cachedAt > CACHE_TTL_MS) return null;
    return _cache;
}

export function setCachedSignals(signals: GlobalSignal[], providerName: string): void {
    _cache = { signals, cachedAt: Date.now(), provider: providerName };
}

export function invalidateCache(): void {
    _cache = null;
}

// ─── Severity normalization (Level 3) ─────────────────────────────────────────

export function normalizeSeverity(raw: string | number): "low" | "medium" | "high" | "critical" {
    if (typeof raw === "number") {
        if (raw >= 9) return "critical";
        if (raw >= 7) return "high";
        if (raw >= 4) return "medium";
        return "low";
    }
    const s = raw.toLowerCase();
    if (s.includes("critical") || s.includes("extreme") || s.includes("severe")) return "critical";
    if (s.includes("high") || s.includes("major")) return "high";
    if (s.includes("medium") || s.includes("moderate") || s.includes("warning")) return "medium";
    return "low";
}

// ─── Deduplication (Level 3) ──────────────────────────────────────────────────

export function deduplicateSignals(signals: GlobalSignal[]): GlobalSignal[] {
    const seen = new Set<string>();
    return signals.filter(s => {
        const key = `${s.rawProvider}::${s.title.toLowerCase().replace(/\s+/g, "-").slice(0, 60)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ─── Confidence normalization ─────────────────────────────────────────────────

export function normalizeConfidence(raw: unknown): number {
    if (typeof raw === "number") return Math.max(0, Math.min(100, Math.round(raw)));
    if (typeof raw === "string") {
        const n = parseFloat(raw);
        if (!isNaN(n)) {
            return n <= 1 ? Math.round(n * 100) : Math.max(0, Math.min(100, Math.round(n)));
        }
    }
    return 60; // default when unknown
}
