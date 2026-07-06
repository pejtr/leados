/**
 * WorldMonitor API Provider — Level 2
 * Enchante.one / ONYX OS — Global Signal Desk
 *
 * Config via env vars:
 *   WORLD_MONITOR_API_BASE_URL  — API base URL
 *   WORLD_MONITOR_API_KEY       — Bearer auth key
 *
 * Falls back gracefully (returns []) if unconfigured or unreachable.
 * NO web scraping. Official API only.
 */
import type { SignalProvider } from "./index";
import type { GlobalSignal, SignalCategory, SignalSeverity } from "../../shared/globalSignals";
import { normalizeSeverity, normalizeConfidence } from "./index";

interface WMEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    severity?: string | number;
    confidence?: number;
    status?: string;
    location?: { region: string; country?: string; lat?: number; lon?: number };
    timestamp: string;
    updatedAt?: string;
    source?: { name: string; url: string };
    tags?: string[];
    affected?: string[];
}

interface WMResponse {
    data: WMEvent[];
    meta?: { total: number; page: number; timestamp: string };
}

function mapCategory(type: string): SignalCategory {
    const t = type.toLowerCase();
    if (t.includes("outage") || t.includes("internet") || t.includes("bgp")) return "internet_outage";
    if (t.includes("cyber") || t.includes("malware") || t.includes("ransomware") || t.includes("ddos")) return "cyber_threat";
    if (t.includes("earthquake") || t.includes("flood") || t.includes("fire") || t.includes("storm")) return "natural_disaster";
    if (t.includes("cable") || t.includes("submarine")) return "cables";
    if (t.includes("datacenter") || t.includes("cooling") || t.includes("pdu")) return "datacenter";
    if (t.includes("solar") || t.includes("space") || t.includes("geomagnetic")) return "space_weather";
    return "infrastructure";
}

function mapStatus(raw?: string): "confirmed" | "likely" | "unverified" {
    if (!raw) return "unverified";
    const s = raw.toLowerCase();
    if (s.includes("confirmed") || s.includes("verified")) return "confirmed";
    if (s.includes("likely") || s.includes("probable")) return "likely";
    return "unverified";
}

export const worldMonitorProvider: SignalProvider = {
    name: "WorldMonitor API",
    slug: "world_monitor",

    isConfigured() {
        return !!(process.env.WORLD_MONITOR_API_BASE_URL && process.env.WORLD_MONITOR_API_KEY);
    },

    async fetchSignals(): Promise<GlobalSignal[]> {
        const baseUrl = process.env.WORLD_MONITOR_API_BASE_URL;
        const apiKey = process.env.WORLD_MONITOR_API_KEY;
        if (!baseUrl || !apiKey) return [];

        let response: Response;
        try {
            response = await fetch(`${baseUrl}/v1/events?limit=100&sort=detectedAt:desc`, {
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Accept": "application/json",
                    "User-Agent": "ONYX-OS-GlobalSignalDesk/1.0",
                },
                signal: AbortSignal.timeout(10_000),
            });
        } catch (err) {
            console.error("[GlobalSignalDesk] WorldMonitor fetch error:", err);
            return [];
        }

        if (!response.ok) {
            console.error(`[GlobalSignalDesk] WorldMonitor API ${response.status}: ${response.statusText}`);
            return [];
        }

        let parsed: WMResponse;
        try {
            parsed = await response.json() as WMResponse;
        } catch {
            return [];
        }

        return (parsed.data ?? []).map((ev): GlobalSignal => ({
            id: `wm-${ev.id}`,
            title: ev.title,
            summary: ev.description,
            category: mapCategory(ev.type),
            severity: normalizeSeverity(ev.severity ?? "low") as SignalSeverity,
            confidence: normalizeConfidence(ev.confidence),
            status: mapStatus(ev.status),
            region: ev.location?.region ?? "Unknown",
            country: ev.location?.country,
            lat: ev.location?.lat,
            lon: ev.location?.lon,
            detectedAt: new Date(ev.timestamp).getTime() || Date.now(),
            updatedAt: ev.updatedAt ? new Date(ev.updatedAt).getTime() : Date.now(),
            sourceName: ev.source?.name ?? "WorldMonitor",
            sourceUrl: ev.source?.url ?? (baseUrl ?? ""),
            rawProvider: "world_monitor",
            tags: ev.tags ?? [],
            affectedSystems: ev.affected,
        }));
    },
};
