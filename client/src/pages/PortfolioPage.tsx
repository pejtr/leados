import { useState, useEffect, ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowRight, ExternalLink, TrendingUp, Users, Zap, Star, Quote } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { OptimateoLogo } from "@/components/OptimateoLogo";
import { useAuth } from "@/_core/hooks/useAuth";
import { SalesChatWidget } from "@/components/SalesChatWidget";

// ─── Animation ────────────────────────────────────────────────────────────────
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

const staggerContainer: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

function Reveal({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            className={className}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
        >
            {children}
        </motion.div>
    );
}

// ─── Screenshot helper ───────────────────────────────────────────────────────
const THUMB = (url: string) =>
    `https://image.thum.io/get/width/640/crop/480/noanimate/${url}`;

// ─── Real Client Projects ────────────────────────────────────────────────────
const STATIC_PROJECTS = [
    { id: 1, title: "CRM Lead System", category: "SaaS", imageUrl: THUMB("https://www.crmleadsystem.cz"), siteUrl: "https://www.crmleadsystem.cz", description: "SaaS platforma pro správu obchodních leadů a automatizaci follow-upů. ONYX OS backend s real-time notifikacemi a plným CRM dashboardem.", results: "Produkční SaaS · Automatizace od A do Z", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#7C3AED", accentBg: "from-violet-400/20 to-indigo-300/10", emoji: "🤖", niche: "SaaS & Automatizace" },
    { id: 2, title: "Katastr Online", category: "Web", imageUrl: THUMB("https://www.katastr-online.cz"), siteUrl: "https://www.katastr-online.cz", description: "Informační portál pro vyhledávání katastru nemovitostí s optimalizovaným funnelem pro generování poptávek na B2C trhu s realitami.", results: "Lead-gen portál · Organická návštěvnost", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#0284C7", accentBg: "from-sky-400/20 to-blue-300/10", emoji: "🏠", niche: "Reality & Finance" },
    { id: 3, title: "Human Design Mapa", category: "Lead Gen", imageUrl: THUMB("https://www.humandesignmapa.cz"), siteUrl: "https://www.humandesignmapa.cz", description: "Online platforma pro personalizované Human Design analýzy s prodejním funnelem, automatickým doručením reportu a emailovou sekvencí.", results: "Automatické doručení · Emailový funnel", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#DB2777", accentBg: "from-pink-400/20 to-rose-300/10", emoji: "✨", niche: "Wellness & Coaching" },
    { id: 4, title: "Bezmasajidla.cz", category: "Affiliate", imageUrl: THUMB("https://www.bezmasajidla.cz"), siteUrl: "https://www.bezmasajidla.cz", description: "Recepční portál bezmasých jídel s obsahovým funnelem a affiliate integrací. SEO architektura s pilíři pro dominanci ve vyhledávání.", results: "SEO pilíře · Affiliate tracking", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#16A34A", accentBg: "from-green-400/20 to-emerald-300/10", emoji: "🥗", niche: "Food & Lifestyle" },
    { id: 5, title: "Recepty Zdraví", category: "Lead Gen", imageUrl: THUMB("https://www.receptyzdravi.cz"), siteUrl: "https://www.receptyzdravi.cz", description: "Zdravé recepty a výživa — obsahový web s CRM vrstvou, SpinWheel lead capture mechanikou a optimalizovaným prodejním funnelem.", results: "SpinWheel capture · Retence čtenářů", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#D97706", accentBg: "from-amber-400/20 to-orange-300/10", emoji: "🥦", niche: "Food & Health" },
    { id: 6, title: "Čajovny Praha", category: "Web", imageUrl: THUMB("https://www.cajovny-praha.cz"), siteUrl: "https://www.cajovny-praha.cz", description: "Lokální průvodce čajovnami v Praze. Geolokační SEO, Google Business optimalizace a lead-gen formuláře pro jednotlivé kavárny.", results: "Lokální SEO · Google Maps dominance", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#0D9488", accentBg: "from-teal-400/20 to-cyan-300/10", emoji: "🍵", niche: "Gastronomie & Lokál" },
    { id: 7, title: "Akční Letenky", category: "Affiliate", imageUrl: THUMB("https://www.akcni-letenky.com"), siteUrl: "https://www.akcni-letenky.com", description: "Affiliate portál pro vyhledávání výhodných letenek. Optimalizovaný pro konverze s outbound tracking Meta CAPI a InitiateCheckout událostmi.", results: "Meta CAPI tracking · Affiliate funnel", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#4F46E5", accentBg: "from-indigo-400/20 to-violet-300/10", emoji: "✈️", niche: "Travel & Affiliate" },
    { id: 8, title: "Last Minute Dovolené", category: "Affiliate", imageUrl: THUMB("https://www.lastminutedovolene.cz"), siteUrl: "https://www.lastminutedovolene.cz", description: "Cestovní agregátor last minute nabídek s affiliate integrací Booking.com, DiscoverCars a GetYourGuide. Plný event tracking.", results: "Multi-affiliate · Session tracking", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#EA580C", accentBg: "from-orange-400/20 to-yellow-300/10", emoji: "🏖️", niche: "Travel & Affiliate" },
    { id: 9, title: "Do Itálie", category: "Affiliate", imageUrl: THUMB("https://www.do-italie.cz"), siteUrl: "https://www.do-italie.cz", description: "Cestovní průvodce a affiliate web zaměřený na italský trh. SEO architektura, pilírové články, affiliate partneři Pelikán, Booking a DoItálie.", results: "Pillar SEO · Pelikán affiliate", testimonialAuthor: null, testimonialText: null, testimonialRating: 5, accentColor: "#B45309", accentBg: "from-amber-600/20 to-yellow-400/10", emoji: "🇮🇹", niche: "Travel & Affiliate" },
];

const CATEGORIES = ["Vše", "Web", "SaaS", "Lead Gen", "Affiliate"];

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Project = {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    imageUrl: string | null;
    siteUrl?: string | null;
    results?: string | null;
    testimonialAuthor?: string | null;
    testimonialText?: string | null;
    testimonialRating?: number | null;
    accentColor?: string;
    accentBg?: string;
    emoji?: string;
    niche?: string;
};

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, index }: { project: Project; index: number }) {
    const [hovered, setHovered] = useState(false);
    const accent = project.accentColor ?? "#7C3AED";
    const bg = project.accentBg ?? "from-violet-400/20 to-indigo-300/10";

    return (
        <motion.div
            variants={fadeUp}
            className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-violet-300/50 transition-all duration-300 flex flex-col"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Thumbnail */}
            <div className={`relative h-48 bg-gradient-to-br ${bg} overflow-hidden flex items-center justify-center`}>
                {project.imageUrl ? (
                    <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-6xl" role="img">{project.emoji ?? "🚀"}</span>
                        <div
                            className="w-16 h-1 rounded-full"
                            style={{ backgroundColor: accent }}
                        />
                    </div>
                )}

                {/* Category badge */}
                <div
                    className="absolute top-4 left-4 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: accent }}
                >
                    {project.category ?? "Web"}
                </div>

                {/* Hover overlay with results */}
                <motion.div
                    className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hovered ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {project.results && (
                        <>
                            <TrendingUp className="w-8 h-8 text-emerald-400 mb-3" />
                            <p className="text-white font-bold text-base leading-snug">{project.results}</p>
                        </>
                    )}
                    {project.siteUrl ? (
                        <a
                            href={project.siteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1.5 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Navštívit web
                        </a>
                    ) : (
                        <div className="mt-4 text-xs text-slate-400 flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Zobrazit detail
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Content */}
            <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start gap-2 mb-2">
                    <span className="text-xl">{project.emoji ?? "🚀"}</span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{project.niche ?? project.category}</p>
                        <h3 className="text-lg font-bold text-slate-900 leading-tight">{project.title}</h3>
                    </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{project.description}</p>

                {/* Results pill */}
                {project.results && (
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 w-fit">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {project.results.split("·")[0]?.trim()}
                    </div>
                )}

                {/* Testimonial */}
                {project.testimonialText && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-start gap-2">
                            <Quote className="w-4 h-4 text-violet-300 shrink-0 mt-0.5" />
                            <p className="text-xs text-slate-500 italic line-clamp-2">{project.testimonialText}</p>
                        </div>
                        <p className="mt-1.5 text-xs font-semibold text-slate-700 pl-6">— {project.testimonialAuthor}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function PortfolioPage() {
    const { isAuthenticated, user } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [activeCategory, setActiveCategory] = useState("Vše");

    const { data: dbProjects = [] } = trpc.portfolio.list.useQuery(undefined);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Merge DB projects with static fallback — DB wins if populated
    const allProjects: Project[] = dbProjects.length > 0
        ? dbProjects.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            category: p.category,
            imageUrl: p.imageUrl,
            results: p.results,
            testimonialAuthor: p.testimonialAuthor,
            testimonialText: p.testimonialText,
            testimonialRating: p.testimonialRating,
        }))
        : STATIC_PROJECTS;

    const filtered = activeCategory === "Vše"
        ? allProjects
        : allProjects.filter((p) => p.category === activeCategory);

    // Top 3 testimonials for the strip
    const testimonials = allProjects
        .filter((p) => p.testimonialText && p.testimonialAuthor)
        .slice(0, 3);

    return (
        <div className="min-h-screen font-[Plus_Jakarta_Sans,Inter,sans-serif] bg-slate-50 text-slate-900 selection:bg-violet-200">

            {/* ── NAV ── */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200" : "bg-transparent"}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
                    <a href="/" aria-label="Optimateo"><OptimateoLogo className="h-8" light={false} withTagline={false} /></a>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Domů</a>
                        <a href="/#pricing" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">Ceník</a>
                        <a href="/demo" className="text-violet-600 hover:text-violet-700 text-sm font-medium transition-colors">Demo</a>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <a href={user?.role === "admin" ? "/admin" : "/dashboard"} className="text-sm font-bold text-slate-700 hover:text-slate-900 px-4 py-2">ADMIN</a>
                        ) : null}
                        <a href="/audit-zdarma" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors hidden sm:block">
                            Mini audit zdarma
                        </a>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative pt-36 pb-16 lg:pt-48 lg:pb-20 bg-gradient-to-b from-white to-slate-50 overflow-hidden">
                <div className="absolute top-20 -left-40 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-32 -right-32 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl pointer-events-none" />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <Reveal>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 text-violet-800 text-xs font-bold uppercase tracking-wider mb-6">
                            <Users className="w-3.5 h-3.5" />
                            Ukázky živých projektů a konceptů
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-950 mb-6 leading-[1.08]">
                            Realizované{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
                                projekty
                            </span>
                        </h1>
                        <p className="text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
                            Prohlédněte si výsledky, které jsme přinesli lokálním firmám a podnikatelům pomocí systému ONYX OS.
                        </p>
                        <a
                            href="/audit-zdarma"
                            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all shadow-violet-500/20"
                        >
                            Chci podobné výsledky <ArrowRight className="w-4 h-4" />
                        </a>
                    </Reveal>
                </div>
            </section>

            {/* ── CATEGORY FILTERS ── */}
            <section className="py-8 bg-slate-50 border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center gap-3 flex-wrap justify-center">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all
                  ${activeCategory === cat
                                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-700"
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PROJECT GRID ── */}
            <section className="py-16 lg:py-20 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        key={activeCategory}
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                    >
                        {filtered.map((project, i) => (
                            <ProjectCard key={project.id} project={project} index={i} />
                        ))}
                    </motion.div>

                    {filtered.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <Zap className="w-10 h-10 mx-auto mb-4 opacity-30" />
                            <p className="font-medium">Žádné projekty v této kategorii</p>
                        </div>
                    )}
                </div>
            </section>

            {/* ── TESTIMONIAL STRIP ── */}
            {testimonials.length > 0 && (
                <section className="py-20 bg-white border-t border-slate-100">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <Reveal className="text-center mb-14">
                            <h2 className="text-3xl font-bold text-slate-900 mb-4">Co říkají klienti</h2>
                            <p className="text-slate-600">Neberete nás za slovo — poslyšte ty, kteří to zažili.</p>
                        </Reveal>
                        <motion.div
                            className="grid md:grid-cols-3 gap-8"
                            variants={staggerContainer}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                        >
                            {testimonials.map((p, i) => (
                                <motion.div
                                    key={p.id}
                                    variants={fadeUp}
                                    className="bg-slate-50 rounded-2xl p-7 border border-slate-100 flex flex-col"
                                >
                                    <div className="flex items-center gap-1 mb-4">
                                        {Array.from({ length: p.testimonialRating ?? 5 }).map((_, si) => (
                                            <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                                        ))}
                                    </div>
                                    <Quote className="w-7 h-7 text-violet-200 mb-3" />
                                    <p className="text-slate-700 italic leading-relaxed flex-1 text-sm">
                                        {p.testimonialText}
                                    </p>
                                    <div className="mt-5 pt-4 border-t border-slate-200">
                                        <p className="font-bold text-slate-900 text-sm">{p.testimonialAuthor}</p>
                                        {p.niche && <p className="text-xs text-slate-500">{p.niche}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>
            )}

            {/* ── CTA BANNER ── */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 pointer-events-none" />
                <div className="max-w-3xl mx-auto px-4 text-center relative z-10">
                    <Reveal>
                        <Zap className="w-10 h-10 text-violet-400 mx-auto mb-6" />
                        <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                            Chcete být{" "}
                            <span className="text-violet-400">dalším úspěšným projektem</span>?
                        </h2>
                        <p className="text-lg text-slate-300 mb-10 font-light leading-relaxed">
                            Každý projekt začal diagnostikou. Mini Audit je zdarma a bez závazku — za 48 hodin víte, kde váš web ztrácí zákazníky.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <a
                                href="/audit-zdarma"
                                className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all inline-flex items-center justify-center gap-2"
                            >
                                Získat mini audit zdarma <ArrowRight className="w-5 h-5" />
                            </a>
                            <a
                                href="/#contact"
                                className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white text-base font-semibold px-8 py-4 rounded-xl transition-all inline-flex items-center justify-center"
                            >
                                Konzultace s námi
                            </a>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-slate-950 py-8 border-t border-white/10 text-center text-sm text-slate-500">
                <p>© 2026 OPTIMATEO. Všechna práva vyhrazena. Poháněno systémem ONYX OS.</p>
            </footer>

            <SalesChatWidget />
        </div>
    );
}
