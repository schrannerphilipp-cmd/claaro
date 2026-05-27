"use client";

const sans  = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-8">
      <h2 className="text-base font-semibold text-white mb-3">{title}</h2>
      {children}
    </div>
  );
}

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-[#241c14] text-white" style={sans}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white/70 transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Zurück
        </button>

        <h1 className="text-4xl text-white mb-2" style={serif}>Datenschutzerklärung</h1>
        <p className="text-white/55 text-sm mb-10">Stand: Mai 2026</p>

        <div className="space-y-8">

          {/* 1 – Verantwortlicher */}
          <Section title="1. Verantwortlicher">
            <div className="text-sm text-white/55 space-y-1">
              <p>Philipp Schranner</p>
              <p>Ferdinand-Miller-Str. 30</p>
              <p>82256 Fürstenfeldbruck</p>
              <p>
                E-Mail:{" "}
                <a
                  href="mailto:schranner.philipp@gmail.com"
                  className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
                >
                  schranner.philipp@gmail.com
                </a>
              </p>
            </div>
          </Section>

          {/* 2 – Rechtsgrundlagen */}
          <Section title="2. Rechtsgrundlagen der Verarbeitung">
            <p className="text-sm text-white/55 leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt auf folgenden Rechtsgrundlagen:
            </p>
            <ul className="text-sm text-white/55 space-y-1.5 list-disc list-inside mt-2">
              <li>
                <strong className="text-white/70">Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung: Verarbeitung zur Erbringung der gebuchten SaaS-Leistung.
              </li>
              <li>
                <strong className="text-white/70">Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigtes Interesse: Betrugsprävention, IT-Sicherheit, Produktverbesserung.
              </li>
              <li>
                <strong className="text-white/70">Art. 6 Abs. 1 lit. c DSGVO</strong> – Rechtliche Verpflichtung: steuerrechtliche Aufbewahrungspflichten.
              </li>
            </ul>
          </Section>

          {/* 3 – Erhobene Daten */}
          <Section title="3. Erhobene Daten">
            <ul className="text-sm text-white/55 space-y-1.5 list-disc list-inside">
              <li>Name und E-Mail-Adresse (Registrierung)</li>
              <li>Firmendaten (Name, Adresse, Kontaktdaten)</li>
              <li>Rechnungs- und Angebotsdaten</li>
              <li>Zahlungsinformationen (werden ausschließlich von Stripe verarbeitet)</li>
              <li>Nutzungsdaten (Login-Zeitstempel, aufgerufene Funktionen)</li>
            </ul>
          </Section>

          {/* 4 – Verwendete Dienste */}
          <Section title="4. Eingesetzte Dienstleister">
            <div className="text-sm text-white/55 space-y-5">
              <div>
                <p className="text-white/70 font-medium">Supabase Inc.</p>
                <p className="mt-0.5">101 2nd St, San Francisco, CA 94105, USA</p>
                <p>Zweck: Datenbankhosting, Authentifizierung, Dateispeicherung (EU-Rechenzentrum Frankfurt).</p>
                <p>Datenschutz:{" "}
                  <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer"
                    className="text-white/60 hover:text-white underline underline-offset-2">
                    supabase.com/privacy
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Stripe Payments Europe Ltd.</p>
                <p className="mt-0.5">1 Grand Canal Street Lower, Dublin 2, Irland</p>
                <p>Zweck: Zahlungsabwicklung. Stripe verarbeitet Zahlungsdaten als eigenständig Verantwortlicher gemäß seinen eigenen Datenschutzrichtlinien.</p>
                <p>Datenschutz:{" "}
                  <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer"
                    className="text-white/60 hover:text-white underline underline-offset-2">
                    stripe.com/de/privacy
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Vercel Inc.</p>
                <p className="mt-0.5">340 S Lemon Ave #4133, Walnut, CA 91789, USA</p>
                <p>Zweck: Hosting und Content Delivery. Vercel verarbeitet bei jedem Aufruf technische Verbindungsdaten (IP-Adresse, Zeitstempel). Angemessenes Datenschutzniveau durch EU-Standardvertragsklauseln.</p>
                <p>Datenschutz:{" "}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer"
                    className="text-white/60 hover:text-white underline underline-offset-2">
                    vercel.com/legal/privacy-policy
                  </a>
                </p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Resend Inc.</p>
                <p className="mt-0.5">2261 Market Street #5039, San Francisco, CA 94114, USA</p>
                <p>Zweck: Transaktionaler E-Mail-Versand (Bestätigungen, Mahnungen, Einladungen).</p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Anthropic PBC</p>
                <p className="mt-0.5">548 Market St #31043, San Francisco, CA 94104, USA</p>
                <p>Zweck: KI-gestützte Funktionen (Dienstplan-Erstellung). Es werden keine personenbezogenen Daten dauerhaft in Anthropic-Systemen gespeichert.</p>
              </div>
            </div>
          </Section>

          {/* 5 – Auftragsverarbeitung */}
          <Section title="5. Auftragsverarbeitung (Art. 28 DSGVO)">
            <p className="text-sm text-white/55 leading-relaxed">
              Mit den oben genannten Dienstleistern — Supabase, Vercel, Resend und Anthropic — wurden Verträge zur Auftragsverarbeitung gemäß Art. 28 DSGVO abgeschlossen. Diese Dienstleister verarbeiten personenbezogene Daten ausschließlich nach unserer Weisung und für keinen anderen Zweck.
            </p>
            <p className="text-sm text-white/55 leading-relaxed mt-2">
              <strong className="text-white/70">Hinweis zu Stripe:</strong> Stripe Payments Europe Ltd. ist für die Zahlungsdatenverarbeitung eigenständig Verantwortlicher nach Art. 4 Nr. 7 DSGVO und kein Auftragsverarbeiter.
            </p>
          </Section>

          {/* 6 – Cookies */}
          <Section title="6. Cookies und lokale Speicherung">
            <p className="text-sm text-white/55 leading-relaxed">
              claaro verwendet ausschließlich technisch notwendige Cookies und localStorage-Einträge für die Authentifizierung und Benutzerpräferenzen. Es werden keine Tracking-, Analyse- oder Marketing-Cookies eingesetzt. Eine Einwilligung nach § 25 TTDSG ist daher nicht erforderlich.
            </p>
          </Section>

          {/* 7 – Ihre Rechte */}
          <Section title="7. Ihre Rechte">
            <ul className="text-sm text-white/55 space-y-1.5 list-disc list-inside">
              <li>Auskunft über gespeicherte Daten (Art. 15 DSGVO)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
              <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
              <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
              <li>Beschwerde bei der zuständigen Datenschutzbehörde (Bayerisches Landesamt für Datenschutzaufsicht)</li>
            </ul>
            <p className="text-sm text-white/55 leading-relaxed mt-3">
              Für alle Anfragen wenden Sie sich per E-Mail an:{" "}
              <a
                href="mailto:schranner.philipp@gmail.com"
                className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
              >
                schranner.philipp@gmail.com
              </a>
            </p>
          </Section>

          {/* 8 – Löschung & Widerrufsrecht */}
          <Section title="8. Datenlöschung und Kündigung">
            <p className="text-sm text-white/55 leading-relaxed">
              Nutzer können jederzeit die vollständige Löschung ihres Accounts und aller damit verbundenen personenbezogenen Daten per E-Mail an{" "}
              <a
                href="mailto:schranner.philipp@gmail.com"
                className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
              >
                schranner.philipp@gmail.com
              </a>{" "}
              beantragen. Die Löschung erfolgt binnen 30 Tagen, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen (z.&thinsp;B. steuerrechtliche Aufbewahrungsfristen für Rechnungsdaten gemäß § 147 AO: 10 Jahre).
            </p>
            <p className="text-sm text-white/55 leading-relaxed mt-2">
              Nach Ablauf des Testzeitraums (30 Tage) ohne Buchung eines Abonnements werden alle Daten automatisch nach weiteren 30 Tagen gelöscht.
            </p>
          </Section>

          {/* 9 – Datensicherheit */}
          <Section title="9. Datensicherheit">
            <p className="text-sm text-white/55 leading-relaxed">
              Alle Datenübertragungen erfolgen verschlüsselt via TLS/HTTPS. Datenbankzugriffe sind durch Row-Level-Security (RLS) in Supabase auf den jeweiligen Nutzer beschränkt. Passwörter werden nicht im Klartext gespeichert.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div className="border-t border-white/8 mt-12 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/30">
          <span>© 2026 claaro</span>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-white/50 transition-colors">Impressum</a>
            <a href="/agb" className="hover:text-white/50 transition-colors">AGB</a>
          </div>
        </div>
      </div>
    </div>
  );
}
