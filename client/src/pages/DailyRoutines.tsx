/**
 * ═══════════════════════════════════════════════════════════════════════
 * DAILY ROUTINES DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Morning intelligence briefing — automated daily overview of:
 *  - Pipeline health & lead activity
 *  - Today's tasks & follow-ups
 *  - Campaign performance (ROAS, ad spend)
 *  - HERMES AI recommendations
 *  - Project earnings snapshot
 *
 * Inspired by: Agent OS Daily Routines (Julian Goldie — Agentic Systems)
 * Implemented: 2026-07-06
 * ═══════════════════════════════════════════════════════════════════════
 */
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { formatDistanceToNow } from "date-fns";
import { cs } from "date-fns/locale";
import {
    RefreshCw, Zap, Target, TrendingUp, CheckSquare, BarChart3,
    Globe, Brain, AlertTriangle, ArrowRight, Clock, Star,
    Activity, DollarSign, Users, MessageSquare, Calendar,
    ChevronRight, Loader2, Sparkles, Radio
} from "lucide-react";

// ─── Helper: time of day greeting ────────────────────────────────────────────
function getGreeting(): { text: string; emoji: string } {
    const h = new Date().getHours();
    if (h < 6) return { text: "Dobrou noc", emoji: "🌙" };
    if (h < 12) return { text: "Dobré ráno", emoji: "🌅" };
    if (h < 18) return { text: "Dobré odpoledne", emoji: "☀️" };
    return { text: "Dobrý večer", emoji: "🌆" };
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({
    icon: Icon,
    title,
    badge,
    color = "#06b6d4",
    children,
    loading,
}: {
    icon: any;
    title: string;
    badge?: string | number;
    color?: string;
    children: React.ReactNode;
    loading?: boolean;
}) {
    return (
        <div style={{
            background: "rgba(15,15,25,0.85)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
            backdropFilter: "blur(12px)",
        }}>
            {/* Header */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 18px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.02)",
            }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${color}20`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${color}30`
                }}>
                    <Icon size={16} color={color} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: "#e2e8f0", flex: 1 }}>{title}</span>
                {badge !== undefined && (
                    <span style={{
                        background: `${color}20`,
                        color,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                        border: `1px solid ${color}30`,
                    }}>{badge}</span>
                )}
                {loading && <Loader2 size={14} color="#64748b" style={{ animation: "spin 1s linear infinite" }} />}
            </div>
            {/* Body */}
            <div style={{ padding: "16px 18px" }}>
                {children}
            </div>
        </div>
    );
}

// ─── KPI pill ─────────────────────────────────────────────────────────────────
function KpiPill({ label, value, color = "#06b6d4" }: { label: string; value: string | number; color?: string }) {
    return (
        <div style={{
            display: "flex", flexDirection: "column", gap: 2,
            background: `${color}10`, border: `1px solid ${color}20`,
            borderRadius: 10, padding: "10px 14px", flex: 1, minWidth: 80,
        }}>
            <span style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>{label}</span>
        </div>
    );
}

// ─── HERMES AI Recommendation card ───────────────────────────────────────────
function AiRecoCard({ text, priority }: { text: string; priority: "high" | "medium" | "low" }) {
    const colors = { high: "#ef4444", medium: "#f59e0b", low: "#06b6d4" };
    const labels = { high: "Vysoká", medium: "Střední", low: "Nízká" };
    return (
        <div style={{
            display: "flex", gap: 12, alignItems: "flex-start",
            padding: "10px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}>
            <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: colors[priority], marginTop: 6, flexShrink: 0,
                boxShadow: `0 0 6px ${colors[priority]}`
            }} />
            <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{text}</p>
            </div>
            <span style={{
                fontSize: 10, color: colors[priority], fontWeight: 600,
                background: `${colors[priority]}15`, padding: "2px 6px",
                borderRadius: 4, whiteSpace: "nowrap"
            }}>{labels[priority]}</span>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function DailyRoutines() {
    const greeting = getGreeting();
    const [aiSummary, setAiSummary] = useState<string>("");
    const [aiLoading, setAiLoading] = useState(false);
    const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
    const [cavemanMode, setCavemanMode] = useState(false);

    // ── Data queries ─────────────────────────────────────────────────────────
    const statsQuery = trpc.leads.stats.useQuery(undefined, { staleTime: 60_000 });
    const tasksQuery = trpc.tasks?.list?.useQuery?.(undefined, { staleTime: 60_000 });
    const adsQuery = trpc.adCampaigns?.list?.useQuery?.(undefined, { staleTime: 60_000 });
    const morningBriefQuery = trpc.morningBriefing?.getLatest?.useQuery?.();

    // ── Hermes AI daily summary ──────────────────────────────────────────────
    const hermesAiChat = trpc.hermes.aiChat.useMutation();

    async function generateAiSummary() {
        setAiLoading(true);
        try {
            const stats = statsQuery.data;
            const context = `Ranní přehled (${new Date().toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long" })}):
- Celkem leadů: ${stats?.totalLeads ?? "?"} | Obohaceno: ${stats?.enrichedLeads ?? "?"}
- Pipeline: ${stats?.statusBreakdown?.map((s: any) => `${s.status}(${s.count})`).join(", ") || "prázdná"}
- Tržby: $${stats?.roiStats?.totalRevenue?.toFixed(0) ?? 0}
- Úkoly dnes: ${tasksQuery?.data?.filter((t: any) => {
                const due = new Date(t.dueDate ?? "");
                const today = new Date();
                return due.toDateString() === today.toDateString() && t.status !== "done";
            }).length ?? "?"}`;

            const result = await hermesAiChat.mutateAsync({
                message: `Jsi HERMES. Připrav stručný ranní briefing v 5 bullet pointech. Identifikuj nejvyší prioritu na dnešek a jedno riziko k sledování. Start: →\n\nKontext: ${context}`,
                conversationHistory: [],
                hermesMode: true,
                cavemanMode,
            });
            setAiSummary(result.content ?? "");
        } catch (e) {
            setAiSummary("⚠️ HERMES není dostupný. Zkontroluj připojení.");
        } finally {
            setAiLoading(false);
            setLastRefreshed(new Date());
        }
    }

    // Auto-load on mount
    useEffect(() => {
        if (statsQuery.data) generateAiSummary();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsQuery.data]);

    const stats = statsQuery.data;

    // ── Task counts ──────────────────────────────────────────────────────────
    const today = new Date();
    const todayTasks = tasksQuery?.data?.filter((t: any) => {
        const due = new Date(t.dueDate ?? "");
        return due.toDateString() === today.toDateString() && t.status !== "done";
    }) ?? [];
    const overdueTasks = tasksQuery?.data?.filter((t: any) => {
        const due = new Date(t.dueDate ?? "");
        return due < today && t.status !== "done";
    }) ?? [];

    // ── Ad campaign summary ──────────────────────────────────────────────────
    const campaigns = adsQuery?.data ?? [];
    const totalAdSpend = campaigns.reduce((s: number, c: any) => s + parseFloat(c.adSpend ?? 0), 0);
    const totalAdRevenue = campaigns.reduce((s: number, c: any) => s + parseFloat(c.revenue ?? 0), 0);
    const avgRoas = totalAdSpend > 0 ? totalAdRevenue / totalAdSpend : 0;

    return (
        <DashboardLayout>
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>

                {/* ── Header ─────────────────────────────────────────────────────── */}
                <div style={{ marginBottom: 28, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 28 }}>{greeting.emoji}</span>
                            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: "#f1f5f9" }}>
                                {greeting.text}
                            </h1>
                        </div>
                        <p style={{ margin: 0, color: "#64748b", fontSize: 14 }}>
                            Daily Routines —{" "}
                            {today.toLocaleDateString("cs-CZ", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {/* Caveman Mode toggle */}
                        <button
                            onClick={() => setCavemanMode(v => !v)}
                            title="Caveman Mode: ultra-stručné AI odpovědi, ~65% méně tokenů"
                            style={{
                                display: "flex", alignItems: "center", gap: 6,
                                padding: "8px 14px", borderRadius: 8, cursor: "pointer",
                                border: `1px solid ${cavemanMode ? "#f59e0b50" : "rgba(255,255,255,0.1)"}`,
                                background: cavemanMode ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
                                color: cavemanMode ? "#f59e0b" : "#64748b",
                                fontSize: 12, fontWeight: 600,
                                transition: "all 0.2s",
                            }}
                        >
                            <Zap size={13} />
                            {cavemanMode ? "Caveman ON" : "Caveman OFF"}
                        </button>
                        {/* Refresh */}
                        <button
                            onClick={generateAiSummary}
                            disabled={aiLoading || statsQuery.isLoading}
                            style={{
                                display: "flex", alignItems: "center", gap: 7,
                                padding: "8px 16px", borderRadius: 8, cursor: "pointer",
                                border: "1px solid rgba(6,182,212,0.3)",
                                background: "rgba(6,182,212,0.08)",
                                color: "#06b6d4", fontSize: 13, fontWeight: 600,
                                opacity: (aiLoading || statsQuery.isLoading) ? 0.6 : 1,
                            }}
                        >
                            <RefreshCw size={14} style={{ animation: aiLoading ? "spin 1s linear infinite" : "none" }} />
                            Obnovit přehled
                        </button>
                    </div>
                </div>

                {/* ── KPI Row ─────────────────────────────────────────────────────── */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
                    <KpiPill label="Celkem leadů" value={stats?.totalLeads ?? "—"} color="#06b6d4" />
                    <KpiPill label="V pipeline" value={stats?.statusBreakdown?.find((s: any) => s.status === "new")?.count ?? "—"} color="#8b5cf6" />
                    <KpiPill label="Uzavřené dealy" value={stats?.roiStats?.closedDeals ?? "—"} color="#10b981" />
                    <KpiPill label="Revenue" value={`$${stats?.roiStats?.totalRevenue?.toFixed(0) ?? "0"}`} color="#10b981" />
                    <KpiPill label="Úkoly dnes" value={todayTasks.length} color="#f59e0b" />
                    <KpiPill label="Po termínu" value={overdueTasks.length} color={overdueTasks.length > 0 ? "#ef4444" : "#64748b"} />
                    <KpiPill label="ROAS (kampaně)" value={avgRoas > 0 ? `${avgRoas.toFixed(1)}×` : "—"} color="#ec4899" />
                    <KpiPill label="Ad Spend" value={totalAdSpend > 0 ? `$${totalAdSpend.toFixed(0)}` : "—"} color="#64748b" />
                </div>

                {/* ── Main Grid ───────────────────────────────────────────────────── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

                    {/* HERMES AI Briefing */}
                    <div style={{ gridColumn: "1 / -1" }}>
                        <SectionCard
                            icon={Brain}
                            title="HERMES — Ranní briefing"
                            badge={cavemanMode ? "⚡ Caveman" : "Normální mód"}
                            color="#8b5cf6"
                            loading={aiLoading}
                        >
                            {aiLoading ? (
                                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#64748b", fontSize: 13, padding: "8px 0" }}>
                                    <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                                    HERMES generuje ranní přehled...
                                </div>
                            ) : aiSummary ? (
                                <>
                                    <div style={{
                                        fontSize: 13, color: "#cbd5e1", lineHeight: 1.7,
                                        borderLeft: "2px solid #8b5cf6", paddingLeft: 14,
                                        whiteSpace: "pre-wrap",
                                    }}>
                                        {aiSummary}
                                    </div>
                                    <div style={{ marginTop: 10, fontSize: 11, color: "#475569", display: "flex", alignItems: "center", gap: 5 }}>
                                        <Clock size={11} />
                                        Vygenerováno: {formatDistanceToNow(lastRefreshed, { addSuffix: true, locale: cs })}
                                        {cavemanMode && <span style={{ color: "#f59e0b", marginLeft: 8 }}>⚡ Caveman mode aktivní — úspora ~65% tokenů</span>}
                                    </div>
                                </>
                            ) : (
                                <div style={{ color: "#475569", fontSize: 13 }}>
                                    Klikni "Obnovit přehled" pro vygenerování denního briefingu od HERMES.
                                </div>
                            )}
                        </SectionCard>
                    </div>

                    {/* Pipeline přehled */}
                    <SectionCard icon={Target} title="Pipeline přehled" color="#06b6d4" loading={statsQuery.isLoading}>
                        {stats?.statusBreakdown?.length ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {stats.statusBreakdown.map((s: any) => {
                                    const total = stats.totalLeads || 1;
                                    const pct = Math.round((s.count / total) * 100);
                                    const colors: Record<string, string> = {
                                        new: "#06b6d4", contacted: "#8b5cf6", replied: "#f59e0b",
                                        qualified: "#10b981", disqualified: "#64748b",
                                    };
                                    const color = colors[s.status] ?? "#06b6d4";
                                    return (
                                        <div key={s.status}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, color: "#94a3b8", textTransform: "capitalize" }}>{s.status}</span>
                                                <span style={{ fontSize: 12, fontWeight: 600, color }}>{s.count}</span>
                                            </div>
                                            <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)" }}>
                                                <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: color, transition: "width 0.6s ease" }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p style={{ color: "#475569", fontSize: 13 }}>Žádná data pipeline.</p>
                        )}
                    </SectionCard>

                    {/* Dnešní úkoly */}
                    <SectionCard icon={CheckSquare} title="Dnešní úkoly" badge={todayTasks.length} color="#f59e0b" loading={tasksQuery?.isLoading}>
                        {todayTasks.length === 0 && overdueTasks.length === 0 ? (
                            <p style={{ color: "#10b981", fontSize: 13 }}>✅ Žádné úkoly na dnes — máš volno!</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {overdueTasks.slice(0, 3).map((t: any) => (
                                    <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <AlertTriangle size={13} color="#ef4444" style={{ marginTop: 2, flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>{t.title}</p>
                                            <p style={{ margin: 0, fontSize: 11, color: "#ef4444" }}>Po termínu</p>
                                        </div>
                                    </div>
                                ))}
                                {todayTasks.slice(0, 5).map((t: any) => (
                                    <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                                        <Calendar size={13} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
                                        <div>
                                            <p style={{ margin: 0, fontSize: 13, color: "#e2e8f0" }}>{t.title}</p>
                                            {t.dueDate && (
                                                <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>
                                                    {new Date(t.dueDate).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* Výkon kampaní */}
                    <SectionCard icon={BarChart3} title="Výkon kampaní (24h)" badge={campaigns.length} color="#ec4899" loading={adsQuery?.isLoading}>
                        {campaigns.length === 0 ? (
                            <p style={{ color: "#475569", fontSize: 13 }}>Žádné aktivní kampaně.</p>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                    <div style={{ flex: 1, padding: "8px 12px", background: "rgba(236,72,153,0.08)", borderRadius: 8, border: "1px solid rgba(236,72,153,0.15)" }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "#ec4899" }}>{avgRoas > 0 ? `${avgRoas.toFixed(2)}×` : "—"}</div>
                                        <div style={{ fontSize: 11, color: "#64748b" }}>Průměrný ROAS</div>
                                    </div>
                                    <div style={{ flex: 1, padding: "8px 12px", background: "rgba(6,182,212,0.08)", borderRadius: 8, border: "1px solid rgba(6,182,212,0.15)" }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "#06b6d4" }}>${totalAdRevenue.toFixed(0)}</div>
                                        <div style={{ fontSize: 11, color: "#64748b" }}>Revenue kampaní</div>
                                    </div>
                                    <div style={{ flex: 1, padding: "8px 12px", background: "rgba(239,68,68,0.08)", borderRadius: 8, border: "1px solid rgba(239,68,68,0.15)" }}>
                                        <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>${totalAdSpend.toFixed(0)}</div>
                                        <div style={{ fontSize: 11, color: "#64748b" }}>Ad Spend</div>
                                    </div>
                                </div>
                                {campaigns.slice(0, 3).map((c: any) => (
                                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "#94a3b8" }}>
                                        <span style={{ color: "#e2e8f0" }}>{c.name}</span>
                                        <span style={{ color: "#ec4899", fontWeight: 600 }}>
                                            ROAS {parseFloat(c.adSpend ?? 0) > 0 ? (parseFloat(c.revenue ?? 0) / parseFloat(c.adSpend ?? 1)).toFixed(1) : "—"}×
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SectionCard>

                    {/* Top industrie & kvalita leadů */}
                    <SectionCard icon={Users} title="Top segmenty" color="#10b981" loading={statsQuery.isLoading}>
                        {stats?.industryBreakdown?.length ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {stats.industryBreakdown.slice(0, 5).map((ind: any) => (
                                    <div key={ind.industry} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: 13, color: "#cbd5e1" }}>{ind.industry || "Neurčeno"}</span>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: "#10b981" }}>{ind.count} leadů</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 12 }}>
                                    <span style={{ fontSize: 12, color: "#10b981" }}>✅ {stats?.qualityBreakdown?.good ?? 0} dobrých</span>
                                    <span style={{ fontSize: 12, color: "#ef4444" }}>❌ {stats?.qualityBreakdown?.bad ?? 0} špatných</span>
                                    <span style={{ fontSize: 12, color: "#64748b" }}>⬜ {stats?.qualityBreakdown?.unrated ?? 0} bez hodnocení</span>
                                </div>
                            </div>
                        ) : (
                            <p style={{ color: "#475569", fontSize: 13 }}>Žádná data segmentů.</p>
                        )}
                    </SectionCard>

                </div>

                {/* ── Quick Actions ────────────────────────────────────────────────── */}
                <div style={{ marginTop: 8 }}>
                    <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Rychlé akce na dnes
                    </h3>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {[
                            { label: "Generovat leady", href: "/generate", icon: Sparkles, color: "#06b6d4" },
                            { label: "Zkontrolovat pipeline", href: "/kanban", icon: Target, color: "#8b5cf6" },
                            { label: "Úkoly na dnes", href: "/tasks", icon: CheckSquare, color: "#f59e0b" },
                            { label: "Spustit kampaň", href: "/campaigns", icon: Radio, color: "#ec4899" },
                            { label: "HERMES konzola", href: "/hermes", icon: Brain, color: "#8b5cf6" },
                            { label: "Portfolio ROAS", href: "/portfolio-roas", icon: TrendingUp, color: "#10b981" },
                        ].map(({ label, href, icon: Icon, color }) => (
                            <a
                                key={href}
                                href={href}
                                style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "9px 16px", borderRadius: 8, textDecoration: "none",
                                    background: `${color}10`, border: `1px solid ${color}25`,
                                    color: "#e2e8f0", fontSize: 13, fontWeight: 500,
                                    transition: "all 0.15s",
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = `${color}20`)}
                                onMouseLeave={e => (e.currentTarget.style.background = `${color}10`)}
                            >
                                <Icon size={14} color={color} />
                                {label}
                                <ChevronRight size={12} color="#475569" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* ── Compliance nota ──────────────────────────────────────────────── */}
                <div style={{
                    marginTop: 28, padding: "10px 16px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 8, fontSize: 11, color: "#475569",
                }}>
                    <strong style={{ color: "#64748b" }}>ℹ️ Daily Routines</strong> — Automatický ranní přehled generovaný HERMES AI.
                    Spouští se při prvním přihlášení dne. Data jsou načítána z ONYX OS platformy v reálném čase.
                    {" "}Caveman Mode šetří tokeny eliminací zdvořilostních frází v AI odpovědích (~65% úspora).
                </div>

            </div>

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </DashboardLayout>
    );
}
