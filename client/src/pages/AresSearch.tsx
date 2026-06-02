import { useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { MapView } from "../components/Map";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  Search, Building2, MapPin, Calendar, Import,
  CheckCircle2, AlertCircle, Loader2, ExternalLink, Hash,
  ChevronDown, ChevronUp, FileText, Users, Map, Phone, Globe,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AresSubject = {
  ico: string;
  obchodniJmeno: string;
  sidlo: {
    textovaAdresa?: string;
    nazevObce?: string;
    psc?: number;
    nazevUlice?: string;
    cisloDomovni?: number;
  };
  pravniForma?: string;
  stavSubjektu?: string;
  datumVzniku?: string;
  nace?: string[];
};

function formatDate(dateStr?: string) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("cs-CZ");
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }: { status?: string }) {
  const isActive =
    !status ||
    status.toLowerCase().includes("aktivní") ||
    status.toLowerCase().includes("platný");
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
        isActive
          ? "bg-[oklch(0.68_0.18_162_/_15%)] text-[oklch(0.68_0.18_162)]"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {isActive ? (
        <CheckCircle2 className="h-3 w-3" />
      ) : (
        <AlertCircle className="h-3 w-3" />
      )}
      {status ?? "Aktivní"}
    </span>
  );
}

// ── Inline map panel that geocodes the address and drops a pin ──────────────
function CompanyMapPanel({
  companyName,
  address,
}: {
  companyName: string;
  address: string;
}) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState(false);
  const [geocoding, setGeocoding] = useState(true);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    setGeocoding(true);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address, region: "CZ" }, (results, status) => {
      setGeocoding(false);
      if (status === "OK" && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(16);

        // Advanced marker with custom label
        const marker = new window.google.maps.marker.AdvancedMarkerElement({
          map,
          position: location,
          title: companyName,
        });

        // Info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="font-family:sans-serif;padding:4px 2px;max-width:220px">
              <p style="font-weight:700;font-size:13px;margin:0 0 4px">${companyName}</p>
              <p style="font-size:11px;color:#666;margin:0">${results[0].formatted_address}</p>
            </div>
          `,
        });

        marker.addListener("click", () => {
          infoWindow.open({ map, anchor: marker });
        });

        // Auto-open info window
        infoWindow.open({ map, anchor: marker });
      } else {
        setMapError(true);
      }
    });
  };

  if (mapError) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6 text-center mt-3">
        <MapPin className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">
          Adresu se nepodařilo zobrazit na mapě
        </p>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[oklch(0.68_0.18_162)] underline mt-1 inline-block"
        >
          Otevřít v Google Maps →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl overflow-hidden border border-border relative">
      {geocoding && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl">
          <div className="text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[oklch(0.68_0.18_162)] mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Načítám mapu sídla…</p>
          </div>
        </div>
      )}
      <MapView
        className="h-[280px] w-full"
        initialCenter={{ lat: 50.0755, lng: 14.4378 }} // Prague default
        initialZoom={10}
        onMapReady={handleMapReady}
      />
      <div className="absolute bottom-2 right-2 z-10">
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-card/90 border border-border text-muted-foreground hover:text-foreground transition-colors backdrop-blur-sm"
        >
          <ExternalLink className="h-3 w-3" />
          Google Maps
        </a>
      </div>
    </div>
  );
}

// ── Subject card with expandable detail + map ────────────────────────────────
function SubjectCard({
  subject,
  onImport,
  importing,
}: {
  subject: AresSubject;
  onImport: (s: AresSubject) => void;
  importing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const adresa =
    subject.sidlo.textovaAdresa ??
    [
      subject.sidlo.nazevUlice,
      subject.sidlo.cisloDomovni,
      subject.sidlo.psc,
      subject.sidlo.nazevObce,
    ]
      .filter(Boolean)
      .join(", ");

  // Full address string for geocoding (add Czech Republic for accuracy)
  const geocodeAddress = adresa
    ? `${adresa}, Česká republika`
    : `${subject.obchodniJmeno}, Česká republika`;

  return (
    <div
      className={`rounded-xl border bg-card transition-all duration-200 ${
        expanded
          ? "border-[oklch(0.68_0.18_162_/_50%)] shadow-[0_0_0_1px_oklch(0.68_0.18_162_/_20%)]"
          : "border-border hover:border-[oklch(0.68_0.18_162_/_30%)]"
      }`}
    >
      {/* ── Header row ── */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-bold text-foreground">
                {subject.obchodniJmeno}
              </h3>
              <StatusBadge status={subject.stavSubjektu} />
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                IČO:{" "}
                <span className="font-mono font-semibold text-foreground/80">
                  {subject.ico}
                </span>
              </span>
              {adresa && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {adresa}
                </span>
              )}
              {subject.datumVzniku && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Vznik: {formatDate(subject.datumVzniku)}
                </span>
              )}
            </div>
            {subject.pravniForma && (
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {subject.pravniForma}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onImport(subject)}
              disabled={importing}
              className="text-xs h-7 px-2 border-[oklch(0.68_0.18_162_/_30%)] text-[oklch(0.68_0.18_162)] hover:bg-[oklch(0.68_0.18_162_/_10%)]"
            >
              {importing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <Import className="h-3 w-3 mr-1" />
                  Import
                </>
              )}
            </Button>

            <a
              href={`https://ares.gov.cz/ekonomicke-subjekty?ico=${subject.ico}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Otevřít v ARES"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>

            <button
              onClick={() => setExpanded(!expanded)}
              className={`p-1.5 rounded-lg transition-colors ${
                expanded
                  ? "bg-[oklch(0.68_0.18_162_/_15%)] text-[oklch(0.68_0.18_162)]"
                  : "hover:bg-muted text-muted-foreground"
              }`}
              title={expanded ? "Skrýt detail" : "Zobrazit detail a mapu"}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-3 space-y-3">
          {/* NACE codes */}
          {subject.nace && subject.nace.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Obory činnosti (NACE)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {subject.nace.slice(0, 6).map((n, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    {n}
                  </span>
                ))}
                {subject.nace.length > 6 && (
                  <span className="text-[10px] text-muted-foreground/60">
                    +{subject.nace.length - 6} dalších
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quick info row */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {adresa && (
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-[10px] text-muted-foreground/60 mb-0.5 uppercase tracking-wider font-semibold">
                  Sídlo
                </p>
                <p className="text-foreground/90 font-medium leading-snug">{adresa}</p>
              </div>
            )}
            {subject.datumVzniku && (
              <div className="rounded-lg bg-muted/40 p-2.5">
                <p className="text-[10px] text-muted-foreground/60 mb-0.5 uppercase tracking-wider font-semibold">
                  Datum vzniku
                </p>
                <p className="text-foreground/90 font-medium">
                  {formatDate(subject.datumVzniku)}
                </p>
              </div>
            )}
          </div>

          {/* Quick action links */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(subject.obchodniJmeno)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
            >
              <Globe className="h-3 w-3" />
              Google
            </a>
            <a
              href={`https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(subject.obchodniJmeno)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
            >
              <Users className="h-3 w-3" />
              LinkedIn
            </a>
            <a
              href={`https://rejstrik-firem.kurzy.cz/ico/${subject.ico}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
            >
              <FileText className="h-3 w-3" />
              Rejstřík
            </a>
          </div>

          {/* ── Interactive map ── */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
              <Map className="h-3 w-3" />
              Sídlo na mapě
            </p>
            <CompanyMapPanel
              companyName={subject.obchodniJmeno}
              address={geocodeAddress}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function AresSearch() {
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [importingIco, setImportingIco] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.ares.search.useQuery(
    { query: searchQuery, count: 20 },
    { enabled: searchQuery.length >= 2 }
  );

  const importMutation = trpc.ares.importAsLead.useMutation({
    onSuccess: () => {
      toast.success("Firma importována jako lead ✅");
      setImportingIco(null);
    },
    onError: (err) => {
      toast.error("Chyba při importu: " + err.message);
      setImportingIco(null);
    },
  });

  const handleSearch = () => {
    if (query.trim().length >= 2) setSearchQuery(query.trim());
  };

  const handleImport = (subject: AresSubject) => {
    setImportingIco(subject.ico);
    const adresa =
      subject.sidlo.textovaAdresa ??
      [
        subject.sidlo.nazevUlice,
        subject.sidlo.cisloDomovni,
        subject.sidlo.nazevObce,
      ]
        .filter(Boolean)
        .join(", ");
    importMutation.mutate({
      ico: subject.ico,
      obchodniJmeno: subject.obchodniJmeno,
      adresa,
      obec: subject.sidlo.nazevObce,
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[oklch(0.68_0.18_162_/_10%)]">
            <Building2 className="h-5 w-5 text-[oklch(0.68_0.18_162)]" />
          </div>
          <div>
            <h1 className="text-xl font-black text-foreground">
              ARES — Obchodní rejstřík ČR
            </h1>
            <p className="text-sm text-muted-foreground">
              Vyhledejte firmu podle názvu nebo IČO · rozbalte pro mapu sídla a
              přímý import do leadů
            </p>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: FileText, label: "Zdarma", desc: "Žádný API klíč" },
            { icon: Building2, label: "3M+ firem", desc: "Celý rejstřík ČR" },
            { icon: Map, label: "Mapa sídla", desc: "Google Maps geocoding" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-3 text-center"
            >
              <item.icon className="h-4 w-4 mx-auto mb-1.5 text-[oklch(0.68_0.18_162)]" />
              <p className="text-sm font-bold text-foreground">{item.label}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Název firmy nebo IČO (min. 2 znaky)…"
              className="pl-9 bg-card border-border"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={query.trim().length < 2 || isLoading}
            className="bg-[oklch(0.68_0.18_162)] hover:opacity-90 text-white"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Hledat"
            )}
          </Button>
        </div>

        {/* Quick examples */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Příklady:</span>
          {["Škoda Auto", "ČSOB", "Komerční banka", "Alza", "27082440"].map(
            (ex) => (
              <button
                key={ex}
                onClick={() => {
                  setQuery(ex);
                  setSearchQuery(ex);
                }}
                className="text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
              >
                {ex}
              </button>
            )
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[oklch(0.68_0.18_162)] mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Prohledávám ARES…</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
            <AlertCircle className="h-5 w-5 text-destructive mx-auto mb-2" />
            <p className="text-sm text-destructive">
              Chyba při vyhledávání: {error.message}
            </p>
          </div>
        )}

        {/* Results */}
        {data && !isLoading && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                Nalezeno{" "}
                <span className="font-bold text-foreground">{data.total}</span>{" "}
                výsledků pro „
                <span className="font-semibold">{data.query}</span>"
              </p>
              {data.subjects.length < data.total && (
                <p className="text-xs text-muted-foreground">
                  Zobrazeno: {data.subjects.length}
                </p>
              )}
            </div>

            {data.subjects.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <Building2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Žádné výsledky nenalezeny
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Zkuste jiný název nebo IČO
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.subjects.map((subject) => (
                  <SubjectCard
                    key={subject.ico}
                    subject={subject}
                    onImport={handleImport}
                    importing={importingIco === subject.ico}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!searchQuery && !isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground mb-1">
              Prohledejte obchodní rejstřík ČR
            </p>
            <p className="text-xs text-muted-foreground">
              Zadejte název firmy nebo IČO · rozbalte výsledek pro interaktivní
              mapu sídla
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
