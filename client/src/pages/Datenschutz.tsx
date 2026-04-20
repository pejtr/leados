import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Shield, ArrowLeft, Mail, Globe, Lock, Database, Eye, Trash2, Download, AlertCircle } from "lucide-react";

export default function Datenschutz() {
  return (
    <div className="min-h-screen" style={{ background: "oklch(0.97 0.006 240)" }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b px-6 py-4 flex items-center gap-4"
        style={{ background: "oklch(0.97 0.006 240 / 95%)", backdropFilter: "blur(20px)", borderColor: "oklch(0.88 0.010 240)" }}>
        <Link href="/">
          <button className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{ color: "oklch(0.50 0.04 250)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "oklch(0.50 0.20 192)")}
            onMouseLeave={e => (e.currentTarget.style.color = "oklch(0.50 0.04 250)")}>
            <ArrowLeft className="h-4 w-4" />
            Zurück zur Startseite
          </button>
        </Link>
        <div className="flex items-center gap-2 ml-auto">
          <Shield className="h-5 w-5" style={{ color: "oklch(0.50 0.20 192)" }} />
          <span className="text-sm font-semibold" style={{ color: "oklch(0.30 0.04 250)", fontFamily: "'Space Grotesk', sans-serif" }}>
            DSGVO-konform
          </span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, oklch(0.50 0.22 192 / 15%), oklch(0.52 0.24 220 / 10%))", border: "1px solid oklch(0.55 0.20 192 / 20%)" }}>
              <Lock className="h-5 w-5" style={{ color: "oklch(0.50 0.22 192)" }} />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "oklch(0.55 0.20 192 / 10%)", color: "oklch(0.45 0.20 192)", border: "1px solid oklch(0.55 0.20 192 / 20%)" }}>
              Datenschutz
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.18 0.04 250)" }}>
            Datenschutzerklärung
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.55 0.04 250)" }}>
            Stand: April 2026 · Gemäß DSGVO (EU) 2016/679
          </p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed" style={{ color: "oklch(0.35 0.04 250)" }}>

          {/* 1. Verantwortlicher */}
          <Section icon={Globe} title="1. Verantwortlicher">
            <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
            <div className="mt-3 p-4 rounded-xl" style={{ background: "oklch(0.93 0.008 240)", border: "1px solid oklch(0.88 0.010 240)" }}>
              <p className="font-semibold" style={{ color: "oklch(0.25 0.04 250)" }}>LeadOS</p>
              <p>E-Mail: <a href="mailto:datenschutz@crmleadsystem.com" className="underline" style={{ color: "oklch(0.50 0.20 192)" }}>datenschutz@crmleadsystem.com</a></p>
              <p>Website: <a href="https://crmleadsystem.com" className="underline" style={{ color: "oklch(0.50 0.20 192)" }}>crmleadsystem.com</a></p>
            </div>
          </Section>

          {/* 2. Erhobene Daten */}
          <Section icon={Database} title="2. Welche Daten wir erheben">
            <p>Wir erheben und verarbeiten folgende personenbezogene Daten:</p>
            <ul className="mt-3 space-y-2">
              {[
                { label: "Kontodaten", desc: "Name, E-Mail-Adresse, bei der Registrierung über OAuth-Anbieter" },
                { label: "Nutzungsdaten", desc: "IP-Adresse, Browser-Typ, besuchte Seiten, Zeitstempel (Logs)" },
                { label: "Zahlungsdaten", desc: "Werden ausschließlich von Stripe verarbeitet; wir speichern keine Kreditkartendaten" },
                { label: "Lead-Daten", desc: "Von Ihnen generierte B2B-Kontaktdaten (LinkedIn-Profile, Unternehmensinfos) — diese gehören Ihnen" },
                { label: "KI-Interaktionen", desc: "Chat-Nachrichten mit dem HERMES-KI-Agenten zur Verbesserung des Dienstes" },
              ].map(item => (
                <li key={item.label} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: "oklch(0.55 0.20 192)" }} />
                  <span><strong style={{ color: "oklch(0.25 0.04 250)" }}>{item.label}:</strong> {item.desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 3. Rechtsgrundlagen */}
          <Section icon={Shield} title="3. Rechtsgrundlagen der Verarbeitung">
            <p>Die Verarbeitung Ihrer personenbezogenen Daten erfolgt auf folgenden Rechtsgrundlagen gemäß DSGVO:</p>
            <div className="mt-3 grid gap-3">
              {[
                { art: "Art. 6 Abs. 1 lit. b", text: "Vertragserfüllung — Bereitstellung der LeadOS-Plattform und ihrer Funktionen" },
                { art: "Art. 6 Abs. 1 lit. a", text: "Einwilligung — für Marketing-E-Mails und optionale Analyse-Cookies" },
                { art: "Art. 6 Abs. 1 lit. f", text: "Berechtigte Interessen — Sicherheit, Betrugsprävention, Produktverbesserung" },
                { art: "Art. 6 Abs. 1 lit. c", text: "Rechtliche Verpflichtung — Aufbewahrungspflichten nach Steuerrecht" },
              ].map(item => (
                <div key={item.art} className="flex gap-3 p-3 rounded-lg" style={{ background: "oklch(0.93 0.008 240)" }}>
                  <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: "oklch(0.50 0.20 192)", fontFamily: "'Space Grotesk', sans-serif" }}>{item.art}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* 4. Datenweitergabe */}
          <Section icon={Eye} title="4. Weitergabe von Daten an Dritte">
            <p>Wir geben Ihre Daten nur in folgenden Fällen an Dritte weiter:</p>
            <div className="mt-3 space-y-3">
              {[
                { name: "Stripe Inc.", purpose: "Zahlungsabwicklung", privacy: "https://stripe.com/de/privacy", location: "USA (EU-Standardvertragsklauseln)" },
                { name: "Apify Technologies", purpose: "Web-Scraping für Lead-Generierung", privacy: "https://apify.com/privacy-policy", location: "EU (Tschechien)" },
                { name: "Manus AI Platform", purpose: "Hosting, OAuth-Authentifizierung, KI-Dienste", privacy: "https://manus.im/privacy", location: "EU-Rechenzentren" },
              ].map(item => (
                <div key={item.name} className="p-3 rounded-lg" style={{ background: "oklch(0.93 0.008 240)", border: "1px solid oklch(0.88 0.010 240)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-xs" style={{ color: "oklch(0.25 0.04 250)" }}>{item.name}</span>
                    <a href={item.privacy} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "oklch(0.50 0.20 192)" }}>Datenschutz</a>
                  </div>
                  <p className="text-xs">{item.purpose}</p>
                  <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 250)" }}>📍 {item.location}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">Wir verkaufen Ihre Daten <strong style={{ color: "oklch(0.25 0.04 250)" }}>niemals</strong> an Dritte.</p>
          </Section>

          {/* 5. Speicherdauer */}
          <Section icon={Database} title="5. Speicherdauer">
            <p>Wir speichern Ihre Daten nur so lange, wie es für die jeweiligen Zwecke erforderlich ist:</p>
            <div className="mt-3 overflow-hidden rounded-xl" style={{ border: "1px solid oklch(0.88 0.010 240)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: "oklch(0.93 0.008 240)" }}>
                    <th className="text-left p-3 font-semibold" style={{ color: "oklch(0.25 0.04 250)" }}>Datenkategorie</th>
                    <th className="text-left p-3 font-semibold" style={{ color: "oklch(0.25 0.04 250)" }}>Speicherdauer</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Kontodaten", "Bis zur Kontolöschung + 30 Tage"],
                    ["Zahlungsbelege", "10 Jahre (gesetzliche Aufbewahrungspflicht)"],
                    ["Server-Logs", "90 Tage"],
                    ["KI-Chat-Verlauf", "12 Monate oder bis zur manuellen Löschung"],
                    ["Lead-Daten", "Bis zur Löschung durch den Nutzer"],
                  ].map(([cat, dur], i) => (
                    <tr key={cat} style={{ borderTop: i > 0 ? "1px solid oklch(0.90 0.008 240)" : undefined }}>
                      <td className="p-3">{cat}</td>
                      <td className="p-3" style={{ color: "oklch(0.45 0.04 250)" }}>{dur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          {/* 6. Ihre Rechte */}
          <Section icon={AlertCircle} title="6. Ihre Rechte als betroffene Person">
            <p>Gemäß DSGVO haben Sie folgende Rechte:</p>
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              {[
                { right: "Auskunftsrecht (Art. 15)", desc: "Kopie Ihrer gespeicherten Daten anfordern" },
                { right: "Berichtigungsrecht (Art. 16)", desc: "Unrichtige Daten korrigieren lassen" },
                { right: "Löschungsrecht (Art. 17)", desc: "\"Recht auf Vergessenwerden\"" },
                { right: "Einschränkung (Art. 18)", desc: "Verarbeitung einschränken lassen" },
                { right: "Datenportabilität (Art. 20)", desc: "Daten in maschinenlesbarem Format erhalten" },
                { right: "Widerspruchsrecht (Art. 21)", desc: "Verarbeitung auf Basis berechtigter Interessen widersprechen" },
              ].map(item => (
                <div key={item.right} className="p-3 rounded-lg" style={{ background: "oklch(0.93 0.008 240)" }}>
                  <p className="font-semibold text-xs mb-1" style={{ color: "oklch(0.40 0.20 192)" }}>{item.right}</p>
                  <p className="text-xs">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-4">
              Zur Ausübung Ihrer Rechte wenden Sie sich an:{" "}
              <a href="mailto:datenschutz@crmleadsystem.com" className="underline font-medium" style={{ color: "oklch(0.50 0.20 192)" }}>
                datenschutz@crmleadsystem.com
              </a>
            </p>
            <p className="mt-2">
              Sie haben außerdem das Recht, sich bei der zuständigen Datenschutzaufsichtsbehörde zu beschweren.
              In Deutschland: <a href="https://www.bfdi.bund.de" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.50 0.20 192)" }}>BfDI</a>.
              In Österreich: <a href="https://www.dsb.gv.at" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.50 0.20 192)" }}>DSB</a>.
              In der Schweiz: <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "oklch(0.50 0.20 192)" }}>EDÖB</a>.
            </p>
          </Section>

          {/* 7. Cookies */}
          <Section icon={Eye} title="7. Cookies und Tracking">
            <p>Wir verwenden folgende Arten von Cookies:</p>
            <div className="mt-3 space-y-2">
              {[
                { type: "Notwendige Cookies", desc: "Session-Cookie für die Authentifizierung (nicht deaktivierbar)", color: "oklch(0.55 0.20 150)" },
                { type: "Analyse-Cookies", desc: "Umami Analytics (datenschutzfreundlich, keine personenbezogenen Daten, EU-gehostet)", color: "oklch(0.55 0.20 192)" },
                { type: "Marketing-Cookies", desc: "Google Ads Conversion-Tracking (nur mit Einwilligung)", color: "oklch(0.60 0.20 30)" },
              ].map(item => (
                <div key={item.type} className="flex gap-3 p-3 rounded-lg" style={{ background: "oklch(0.93 0.008 240)" }}>
                  <span className="w-2 h-2 rounded-full mt-1 shrink-0" style={{ background: item.color }} />
                  <div>
                    <p className="font-semibold text-xs" style={{ color: "oklch(0.25 0.04 250)" }}>{item.type}</p>
                    <p className="text-xs mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* 8. Datensicherheit */}
          <Section icon={Lock} title="8. Datensicherheit">
            <p>Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten zu schützen:</p>
            <ul className="mt-3 space-y-1.5">
              {[
                "TLS 1.3-Verschlüsselung für alle Datenübertragungen",
                "Verschlüsselte Datenbankverbindungen (TiDB Cloud)",
                "Regelmäßige Sicherheitsaudits und Penetrationstests",
                "Zugriffskontrolle nach dem Least-Privilege-Prinzip",
                "Automatische Backups mit 30-Tage-Aufbewahrung",
                "Keine Speicherung von Passwörtern (OAuth-only)",
              ].map(item => (
                <li key={item} className="flex gap-2 items-start">
                  <span className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.20 150)" }}>✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {/* 9. Kontakt */}
          <Section icon={Mail} title="9. Kontakt Datenschutzbeauftragter">
            <p>Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte:</p>
            <div className="mt-3 p-4 rounded-xl flex items-center gap-4"
              style={{ background: "linear-gradient(135deg, oklch(0.55 0.20 192 / 6%), oklch(0.55 0.24 278 / 4%))", border: "1px solid oklch(0.55 0.20 192 / 20%)" }}>
              <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "oklch(0.55 0.20 192 / 12%)" }}>
                <Mail className="h-5 w-5" style={{ color: "oklch(0.50 0.20 192)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "oklch(0.25 0.04 250)" }}>Datenschutz-Anfragen</p>
                <a href="mailto:datenschutz@crmleadsystem.com" className="text-sm underline" style={{ color: "oklch(0.50 0.20 192)" }}>
                  datenschutz@crmleadsystem.com
                </a>
                <p className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.04 250)" }}>Antwort innerhalb von 72 Stunden</p>
              </div>
            </div>
          </Section>

          {/* Footer note */}
          <div className="pt-6 border-t text-xs" style={{ borderColor: "oklch(0.88 0.010 240)", color: "oklch(0.60 0.04 250)" }}>
            <p>Diese Datenschutzerklärung wurde zuletzt am <strong>April 2026</strong> aktualisiert. Wir behalten uns vor, diese Erklärung bei Bedarf zu aktualisieren. Die jeweils aktuelle Version ist auf dieser Seite verfügbar.</p>
            <div className="flex gap-4 mt-4">
              <Link href="/"><span className="underline cursor-pointer" style={{ color: "oklch(0.50 0.20 192)" }}>Startseite</span></Link>
              <Link href="/imprint"><span className="underline cursor-pointer" style={{ color: "oklch(0.50 0.20 192)" }}>Impressum</span></Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-3">
        <Icon className="h-4 w-4 shrink-0" style={{ color: "oklch(0.50 0.20 192)" }} />
        <h2 className="text-base font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: "oklch(0.22 0.04 250)" }}>
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}
