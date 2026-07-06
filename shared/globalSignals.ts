/**
 * Global Signal Desk — Shared Types (server + client safe)
 * Enchante.one / ONYX OS
 *
 * This file can be imported from both server and client code.
 * Place in /shared/ to avoid cross-boundary import issues.
 */

export type SignalCategory =
    | "internet_outage"
    | "cyber_threat"
    | "natural_disaster"
    | "infrastructure"
    | "cables"
    | "datacenter"
    | "space_weather";

export type SignalSeverity = "low" | "medium" | "high" | "critical";

export type SignalStatus = "confirmed" | "likely" | "unverified";

export interface GlobalSignal {
    id: string;
    title: string;
    summary: string;
    category: SignalCategory;
    severity: SignalSeverity;
    /** 0-100, confidence in signal accuracy */
    confidence: number;
    status: SignalStatus;
    region: string;
    country?: string;
    lat?: number;
    lon?: number;
    detectedAt: number;  // unix timestamp ms
    updatedAt: number;   // unix timestamp ms
    sourceName: string;
    sourceUrl: string;
    /** raw provider identifier for deduplication */
    rawProvider: string;
    tags: string[];
    affectedSystems?: string[];
    mitreAttackId?: string;
}

export interface SignalFilter {
    categories: SignalCategory[];
    severities: SignalSeverity[];
    statuses: SignalStatus[];
    search: string;
}

export const CATEGORY_META: Record<SignalCategory, { label: string; emoji: string; color: string }> = {
    internet_outage: { label: "Internet Outage", emoji: "🔌", color: "#ef4444" },
    cyber_threat: { label: "Cyber Threat", emoji: "🛡️", color: "#f59e0b" },
    natural_disaster: { label: "Natural Disaster", emoji: "🌋", color: "#dc2626" },
    infrastructure: { label: "Infrastructure", emoji: "🏗️", color: "#8b5cf6" },
    cables: { label: "Submarine Cables", emoji: "🌊", color: "#06b6d4" },
    datacenter: { label: "Datacenter", emoji: "🖥️", color: "#10b981" },
    space_weather: { label: "Space / Weather", emoji: "🌌", color: "#ec4899" },
};

export const SEVERITY_META: Record<SignalSeverity, { label: string; color: string; bg: string }> = {
    low: { label: "LOW", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
    medium: { label: "MEDIUM", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
    high: { label: "HIGH", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
    critical: { label: "CRITICAL", color: "#ff0040", bg: "rgba(255,0,64,0.15)" },
};

export const STATUS_META: Record<SignalStatus, { label: string; color: string }> = {
    confirmed: { label: "CONFIRMED", color: "#10b981" },
    likely: { label: "LIKELY", color: "#f59e0b" },
    unverified: { label: "UNVERIFIED", color: "#64748b" },
};
