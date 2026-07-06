import { useEffect, useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import type { GlobalSignal, SignalCategory, SignalSeverity, SignalStatus } from '../../../shared/globalSignals';
import { formatDistanceToNow } from 'date-fns';
import { cs } from 'date-fns/locale';
import { ExternalLink, Filter, Search, X, Radio, Activity, Eye, RefreshCw, Loader2, Lock, Clock, ChevronRight } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';

const CATEGORY_META: Record<SignalCategory, { color: string; label: string; emoji: string }> = {
    infrastructure: { color: "#3b82f6", label: "Infrastructure", emoji: "⚡" },
    cyber: { color: "#8b5cf6", label: "Cyber Security", emoji: "🛡️" },
    social: { color: "#ec4899", label: "Social/Political", emoji: "👥" },
    environment: { color: "#10b981", label: "Environment", emoji: "🌿" },
    conflict: { color: "#ef4444", label: "Conflict", emoji: "⚔️" },
    health: { color: "#14b8a6", label: "Health", emoji: "🏥" },
    economic: { color: "#f59e0b", label: "Economic", emoji: "📈" },
};

const SEVERITY_META: Record<SignalSeverity, { color: string; label: string; bg: string }> = {
    critical: { color: "#ff0040", label: "CRITICAL", bg: "rgba(255,0,64,0.15)" },
    high: { color: "#f97316", label: "HIGH", bg: "rgba(249,115,22,0.15)" },
    medium: { color: "#f59e0b", label: "MEDIUM", bg: "rgba(245,158,11,0.15)" },
    low: { color: "#3b82f6", label: "LOW", bg: "rgba(59,130,246,0.15)" },
};

const STATUS_META: Record<SignalStatus, { color: string; label: string }> = {
    unverified: { color: "#94a3b8", label: "Unverified" },
    likely: { color: "#f59e0b", label: "Likely" },
    confirmed: { color: "#4ade80", label: "Confirmed" },
};

const PULSE_STYLE = `
@keyframes gsd-pulse {
  0% { opacity: 1; }
  50% { opacity: 0.4; }
  100% { opacity: 1; }
}
@keyframes gsd-scan {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
.gsd-font {
  font-family: 'Inter', system-ui, sans-serif;
  color: #f1f5f9;
}
.crt-overlay {
  background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
  background-size: 100% 2px, 3px 100%;
  pointer-events: none;
  z-index: 50;
  inset: 0;
  position: absolute;
}
.noise-overlay {
  background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
  opacity: 0.04;
  pointer-events: none;
  z-index: 51;
  inset: 0;
  position: absolute;
}
`;

function SignalCard({ signal, onClick }: { signal: GlobalSignal; onClick: () => void }) {
    const catMeta = CATEGORY_META[signal.category];
    const sevMeta = SEVERITY_META[signal.severity];
    const stMeta = STATUS_META[signal.status];

    return (
        <div
            onClick={onClick}
            style={{
                background: "rgba(5, 5, 5, 0.8)",
                border: `1px solid ${catMeta.color}40`,
                borderLeft: `4px solid ${sevMeta.color}`,
                padding: "16px",
                cursor: "pointer",
                position: "relative",
                transition: "all 0.2s ease",
            }}
            onMouseOver={e => {
                e.currentTarget.style.borderColor = catMeta.color;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${catMeta.color}20`;
            }}
            onMouseOut={e => {
                e.currentTarget.style.borderColor = `${catMeta.color}40`;
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 16 }}>{catMeta.emoji}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: catMeta.color, letterSpacing: "0.1em" }}>{catMeta.label.toUpperCase()}</span>
                </div>
                <div style={{ padding: "3px 6px", background: sevMeta.bg, color: sevMeta.color, fontSize: 9, fontWeight: 800, borderRadius: 2 }}>
                    {sevMeta.label}
                </div>
            </div>

            <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600, color: "#f8fafc", lineHeight: 1.4 }}>
                {signal.title}
            </h3>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 14 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: stMeta.color }} />
                        <span style={{ fontSize: 11, color: stMeta.color, fontWeight: 500 }}>{stMeta.label}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <div style={{ width: 60, height: 4, background: "rgba(255,255,255,0.1)" }}>
                            <div style={{
                                height: "100%", borderRadius: 3,
                                width: `${signal.confidence}%`,
                                background: signal.confidence >= 80 ? "#10b981" : signal.confidence >= 50 ? "#f59e0b" : "#64748b",
                            }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#475569" }}>{signal.confidence}%</span>
                    </div>
                    {/* Region */}
                    <span style={{ fontSize: 11, color: "#475569" }}>📍 {signal.region}</span>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Clock size={10} color="#475569" />
                    <span style={{ fontSize: 11, color: "#475569" }}>
                        {formatDistanceToNow(signal.detectedAt, { addSuffix: true, locale: cs })}
                    </span>
                    <ChevronRight size={12} color="#475569" />
                </div>
            </div>

            {/* Tags */}
            {signal.tags.length > 0 && (
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
                    {signal.tags.slice(0, 4).map(tag => (
                        <span key={tag} style={{
                            fontSize: 9, color: "#475569",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                            padding: "1px 5px", borderRadius: 3,
                        }}>#{tag}</span>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Signal Detail Modal ──────────────────────────────────────────────────────
function SignalDetail({ signal, onClose }: { signal: GlobalSignal | null; onClose: () => void }) {
    if (!signal) return null;
    const catMeta = CATEGORY_META[signal.category];
    const sevMeta = SEVERITY_META[signal.severity];
    const stMeta = STATUS_META[signal.status];

    return (
        <>
            <div
                onClick={onClose}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)", zIndex: 9000 }}
            />
            <div className="gsd-font" style={{
                position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
                zIndex: 9001, width: "min(640px, 95vw)", maxHeight: "85vh", overflowY: "auto",
                background: "rgba(5,5,5,0.98)", // absolute dark
                border: `2px solid ${catMeta.color}`,
                borderRadius: 0, padding: 24,
                boxShadow: `0 0 20px ${catMeta.color}40`,
            }}>
                {/* Scanlines inside modal */}
                <div className="crt-overlay" />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, position: "relative", zIndex: 2 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 0,
                            background: `${catMeta.color}30`, border: `1px solid ${catMeta.color}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <span style={{ fontSize: 20 }}>{catMeta.emoji}</span>
                        </div>
                        <div>
                            <div style={{ fontSize: 10, color: catMeta.color, fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
                                {catMeta.label.toUpperCase()}
                            </div>
                            <div style={{ display: "flex", gap: 6 }}>
                                <span style={{ fontSize: 9, fontWeight: 800, color: sevMeta.color, background: sevMeta.bg, padding: "2px 6px", borderRadius: 3 }}>{sevMeta.label}</span>
                                <span style={{ fontSize: 9, color: stMeta.color, fontWeight: 600 }}>● {stMeta.label}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 4 }}>
                        <X size={18} />
                    </button>
                </div>

                <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700, color: "#f1f5f9", lineHeight: 1.4 }}>{signal.title}</h2>
                <p style={{ margin: "0 0 20px", fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>{signal.summary}</p>

                {/* Metadata grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                    {[
                        { label: "Region", value: signal.region },
                        { label: "Country", value: signal.country ?? "—" },
                        { label: "Confidence", value: `${signal.confidence}%` },
                        { label: "Detected", value: formatDistanceToNow(signal.detectedAt, { addSuffix: true, locale: cs }) },
                        { label: "Updated", value: formatDistanceToNow(signal.updatedAt, { addSuffix: true, locale: cs }) },
                        { label: "Provider", value: signal.rawProvider },
                        ...(signal.mitreAttackId ? [{ label: "MITRE ATT&CK", value: signal.mitreAttackId }] : []),
                    ].map(({ label, value }) => (
                        <div key={label} style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.06)" }}>
                            <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>{label}</div>
                            <div style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500 }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Affected systems */}
                {signal.affectedSystems && signal.affectedSystems.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Affected Systems</div>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {signal.affectedSystems.map(sys => (
                                <span key={sys} style={{ fontSize: 11, color: "#f59e0b", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "3px 8px", borderRadius: 5 }}>{sys}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tags */}
                {signal.tags.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "#475569", marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Tags</div>
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                            {signal.tags.map(tag => (
                                <span key={tag} style={{ fontSize: 10, color: "#64748b", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 4 }}>#{tag}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Source */}
                <div style={{ paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <div style={{ fontSize: 10, color: "#475569" }}>Source</div>
                        <div style={{ fontSize: 12, color: "#94a3b8" }}>{signal.sourceName}</div>
                    </div>
                    <a
                        href={signal.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#000", textDecoration: "none", padding: "6px 12px", background: catMeta.color }}
                    >
                        <ExternalLink size={12} />
                        ACCESS SOURCE_
                    </a>
                </div>
            </div>
        </>
    );
}

// ─── Severity ring ────────────────────────────────────────────────────────────
function SevRing({ label, count, color }: { label: string; count: number; color: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{
                width: 44, height: 44, borderRadius: 0,
                background: count > 0 ? `${color}40` : "rgba(255,255,255,0.05)",
                border: `2px solid ${count > 0 ? color : "rgba(255,255,255,0.1)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: count > 0 ? `0 0 10px ${color}60` : "none",
            }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: count > 0 ? color : "#475569" }}>{count}</span>
            </div>
            <span style={{ fontSize: 9, color: "#475569", fontWeight: 600, letterSpacing: "0.06em" }}>{label}</span>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GlobalSignalDesk() {
    const [selectedSignal, setSelectedSignal] = useState<GlobalSignal | null>(null);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<SignalCategory | "">("");
    const [severityFilter, setSeverityFilter] = useState<SignalSeverity | "">("");
    const [showSources, setShowSources] = useState(false);
    const [tick, setTick] = useState(0);

    // Live clock tick
    useEffect(() => {
        const t = setInterval(() => setTick(v => v + 1), 30_000);
        return () => clearInterval(t);
    }, []);

    const { data, isLoading, refetch, isFetching } = trpc.globalSignals.list.useQuery({
        category: categoryFilter || undefined,
        search: search || undefined,
        severity: severityFilter || undefined,
    }, { staleTime: 5 * 60_000, refetchOnWindowFocus: false });

    const configQuery = trpc.globalSignals.getConfig.useQuery(undefined, { staleTime: Infinity });
    const refreshMut = trpc.globalSignals.refresh.useMutation({ onSuccess: () => refetch() });

    const signals = data?.signals ?? [];
    const meta = data?.meta;
    const isDemo = meta?.isDemo ?? true;

    // Category count pills
    const categoryCounts = useMemo(() => {
        const all = data?.signals ?? [];
        return Object.keys(CATEGORY_META).map(cat => ({
            cat: cat as SignalCategory,
            count: all.filter(s => s.category === cat).length,
        }));
    }, [data]);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const dateStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

    return (
        <DashboardLayout>
            <style>{PULSE_STYLE}</style>

            <div className="gsd-font" style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 16px", position: "relative" }}>
                {/* Global CRT overlay */}
                <div className="crt-overlay" style={{ position: "fixed" }} />
                <div className="noise-overlay" style={{ position: "fixed" }} />

                {/* ── Master Header ─────────────────────────────────────────────── */}
                <div style={{
                    marginBottom: 24,
                    background: "rgba(5,5,5,0.9)",
                    border: "2px solid #4ade80",
                    borderLeft: "8px solid #4ade80",
                    padding: "20px 24px",
                    position: "relative", zIndex: 2,
                }}>
                    {/* Scanning bg line */}
                    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
                        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "rgba(74,222,128,0.2)", animation: "gsd-scan 4s linear infinite" }} />
                    </div>

                    {/* Brand + live indicator */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                                <div style={{
                                    width: 36, height: 36,
                                    background: "#4ade80",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                    <Radio size={20} color="#000" />
                                </div>
                                <div>
                                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: "#4ade80", textShadow: "0 0 10px rgba(74,222,128,0.5)" }}>
                                        {"// GLOBAL_SIGNAL_DESK />"}
                                    </h1>
                                    <p style={{ margin: 0, fontSize: 13, color: "#a3e635" }}>
                                        Real-time signals from infrastructure, cyber, climate and global risk layers.
                                    </p>
                                </div>
                            </div>
                            <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>
                                TORCHWOOD INSTANCE · SECURE CHANNEL
                            </div>
                        </div>

                        {/* Live clock + controls */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <div style={{ fontSize: 24, fontWeight: 700, color: "#f87171", textShadow: "0 0 8px rgba(248,113,113,0.6)" }}>
                                {timeStr}
                            </div>
                            <div style={{ fontSize: 11, color: "#475569" }}>{dateStr} UTC+2</div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button
                                    onClick={() => setShowSources(v => !v)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        padding: "6px 12px", borderRadius: 0,
                                        border: `1px solid ${showSources ? "#4ade80" : "rgba(255,255,255,0.2)"}`,
                                        background: showSources ? "rgba(74,222,128,0.1)" : "transparent",
                                        color: showSources ? "#4ade80" : "#64748b", fontSize: 13, cursor: "pointer",
                                    }}
                                >
                                    <Eye size={12} />
                                    Zdroje
                                </button>
                                <button
                                    onClick={() => refreshMut.mutate()}
                                    disabled={isFetching || refreshMut.isPending}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 5,
                                        padding: "6px 12px", border: "1px solid #4ade80",
                                        background: "rgba(74,222,128,0.1)",
                                        color: "#4ade80", fontSize: 13, cursor: "pointer", borderRadius: 0,
                                        opacity: (isFetching || refreshMut.isPending) ? 0.6 : 1,
                                    }}
                                >
                                    <RefreshCw size={12} style={{ animation: (isFetching || refreshMut.isPending) ? "gsd-pulse 0.8s ease infinite" : "none" }} />
                                    SYNC
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Demo badge */}
                    {isDemo && (
                        <div style={{
                            marginTop: 14, padding: "6px 12px",
                            background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.4)",
                            borderRadius: 0, display: "inline-flex", alignItems: "center", gap: 6,
                        }}>
                            <Activity size={11} color="#f59e0b" />
                            <span style={{ fontSize: 13, color: "#f59e0b", fontWeight: 600 }}>DEMO DATA</span>
                            <span style={{ fontSize: 13, color: "#78716c" }}>
                                — Zobrazují se ukázková data. Pro live data nastav{" "}
                                <span style={{ fontFamily: "monospace", color: "#a8a29e" }}>WORLD_MONITOR_API_KEY</span> v env.
                            </span>
                        </div>
                    )}
                </div>

                {/* ── Sources panel ─────────────────────────────────────────────── */}
                {showSources && (
                    <div style={{
                        marginTop: 16, marginBottom: 16, padding: 16,
                        background: "rgba(5,5,5,0.9)", border: "1px solid #4ade80",
                        borderRadius: 0, position: "relative", zIndex: 2
                    }}>
                        <div style={{ marginBottom: 12, fontSize: 11, fontWeight: 700, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            Signal Providers
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {configQuery.data?.providers.map(p => (
                                <div key={p.slug} style={{
                                    padding: "8px 14px", borderRadius: 0,
                                    background: p.active ? "rgba(74,222,128,0.08)" : "rgba(255,255,255,0.02)",
                                    border: `1px solid ${p.active ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.1)"}`,
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: p.active ? "#4ade80" : p.configured ? "#f59e0b" : "#475569" }} />
                                        <span style={{ fontSize: 12, fontWeight: 600, color: p.active ? "#4ade80" : "#94a3b8" }}>{p.name}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: 10, color: "#475569" }}>{p.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── KPI Ring row ───────────────────────────────────────────────── */}
                <div style={{ display: "flex", gap: 12, justifyContent: "space-between", flexWrap: "wrap", marginBottom: 20, position: "relative", zIndex: 2, marginTop: 24 }}>
                    {/* Severity rings */}
                    <div style={{ display: "flex", gap: 20, padding: "14px 20px", background: "rgba(5,5,5,0.8)", border: "1px solid rgba(255,255,255,0.2)", alignItems: "center" }}>
                        <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4 }}>Severity</div>
                        <SevRing label="CRITICAL" count={meta?.criticalCount ?? 0} color="#ff0040" />
                        <SevRing label="HIGH" count={meta?.highCount ?? 0} color="#ef4444" />
                        <SevRing label="MEDIUM" count={signals.filter(s => s.severity === "medium").length} color="#f59e0b" />
                        <SevRing label="LOW" count={signals.filter(s => s.severity === "low").length} color="#64748b" />
                    </div>

                    {/* Status */}
                    <div style={{ display: "flex", gap: 16, padding: "14px 20px", background: "rgba(5,5,5,0.8)", border: "1px solid rgba(255,255,255,0.2)", alignItems: "center" }}>
                        <div style={{ fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Status</div>
                        {(["confirmed", "likely", "unverified"] as const).map(st => (
                            <div key={st} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: STATUS_META[st].color }}>
                                    {signals.filter(s => s.status === st).length}
                                </div>
                                <div style={{ fontSize: 9, color: "#475569" }}>{STATUS_META[st].label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div style={{ display: "flex", gap: 10, padding: "14px 20px", background: "rgba(5,5,5,0.8)", border: "1px solid rgba(255,255,255,0.2)", alignItems: "center" }}>
                        <div>
                            <div style={{ fontSize: 28, fontWeight: 900, color: "#4ade80", lineHeight: 1, textShadow: "0 0 10px rgba(74,222,128,0.3)" }}>{meta?.total ?? "—"}</div>
                            <div style={{ fontSize: 10, color: "#475569" }}>Active signals</div>
                        </div>
                        {meta?.cachedAt && (
                            <div style={{ paddingLeft: 12, borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
                                <div style={{ fontSize: 10, color: "#475569" }}>Last update</div>
                                <div style={{ fontSize: 11, color: "#64748b" }}>{formatDistanceToNow(meta.cachedAt, { addSuffix: true, locale: cs })}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Category filter pills ─────────────────────────────────────── */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14, alignItems: "center", position: "relative", zIndex: 2 }}>
                    <span style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                        <Filter size={12} /> Filtr:
                    </span>
                    <button
                        onClick={() => setCategoryFilter("")}
                        style={{
                            padding: "4px 12px", borderRadius: 0, fontSize: 13, cursor: "pointer",
                            border: `1px solid ${!categoryFilter ? "#4ade80" : "rgba(255,255,255,0.15)"}`,
                            background: !categoryFilter ? "rgba(74,222,128,0.1)" : "transparent",
                            color: !categoryFilter ? "#4ade80" : "#64748b",
                        }}
                    >
                        Vše ({signals.length})
                    </button>
                    {categoryCounts.map(({ cat, count }) => {
                        const m = CATEGORY_META[cat];
                        const isActive = categoryFilter === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(isActive ? "" : cat)}
                                style={{
                                    padding: "4px 12px", borderRadius: 0, fontSize: 13, cursor: "pointer",
                                    border: `1px solid ${isActive ? m.color : "rgba(255,255,255,0.15)"}`,
                                    background: isActive ? `${m.color}15` : "transparent",
                                    color: isActive ? m.color : "#64748b",
                                }}
                            >
                                {m.emoji} {m.label} {count > 0 && `(${count})`}
                            </button>
                        );
                    })}
                </div>

                {/* ── Severity filter + search ──────────────────────────────────── */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center", flexWrap: "wrap", position: "relative", zIndex: 2 }}>
                    {/* Search */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 200, background: "rgba(5,5,5,0.9)", border: "1px solid #4ade80", padding: "7px 12px" }}>
                        <Search size={14} color="#4ade80" />
                        <input
                            placeholder="SEARCH_QUERY..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ background: "none", border: "none", outline: "none", color: "#e2e8f0", fontSize: 13, flex: 1, fontFamily: "inherit" }}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex" }}>
                                <X size={13} />
                            </button>
                        )}
                    </div>

                    {/* Severity filter */}
                    {(["critical", "high", "medium", "low"] as SignalSeverity[]).map(sev => {
                        const m = SEVERITY_META[sev];
                        const isActive = severityFilter === sev;
                        return (
                            <button
                                key={sev}
                                onClick={() => setSeverityFilter(isActive ? "" : sev)}
                                style={{
                                    padding: "6px 12px", borderRadius: 0, fontSize: 13, cursor: "pointer",
                                    border: `1px solid ${isActive ? m.color : "rgba(255,255,255,0.15)"}`,
                                    background: isActive ? m.bg : "transparent",
                                    color: isActive ? m.color : "#64748b",
                                }}
                            >
                                {m.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Signal Grid ────────────────────────────────────────────────── */}
                <div style={{ position: "relative", zIndex: 2, minHeight: 200 }}>
                    {isLoading ? (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, gap: 10, color: "#475569" }}>
                            <Loader2 size={20} style={{ animation: "gsd-pulse 0.8s ease infinite" }} />
                            <span style={{ fontSize: 14 }}>Načítám signály...</span>
                        </div>
                    ) : signals.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "48px 20px", color: "#475569" }}>
                            <Search size={32} style={{ marginBottom: 12, opacity: 0.4, margin: "0 auto" }} />
                            <p style={{ fontSize: 14 }}>Žádné signály pro aktuální filtry.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
                            {signals.map(signal => (
                                <SignalCard
                                    key={signal.id}
                                    signal={signal}
                                    onClick={() => setSelectedSignal(signal)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Compliance footer ──────────────────────────────────────────── */}
                <div style={{
                    marginTop: 32, padding: "12px 16px",
                    background: "rgba(0,0,0,0.4)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 0, position: "relative", zIndex: 2
                }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5 }}>
                        <Lock size={12} color="#475569" />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#475569" }}>INTEGRITY NOTICE // CLEARANCE REQUIRED</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
                        This dashboard summarizes signals from monitored data sources.{" "}
                        <strong style={{ color: "#94a3b8" }}>Verify critical events before operational deployment.</strong>{" "}
                        Signals marked unverified are raw intercepts — single-source, unconfirmed. Treat with caution.
                    </p>
                </div>
            </div>

            {/* Signal detail modal */}
            <SignalDetail signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
        </DashboardLayout>
    );
}
