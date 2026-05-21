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
    <div className="min-h-screen bg-[#1a1814] text-white" style={sans}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Zurück
        </button>

        <h1 className="text-4xl text-white mb-2" style={serif}>Datenschutzerklärung</h1>
        <p className="text-white/40 text-sm mb-10">Stand: Mai 2026</p>

        <div className="space-y-8">
          <Section title="Verantwortlicher">
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

          <Section title="Erhobene Daten">
            <ul className="text-sm text-white/55 space-y-1.5 list-disc list-inside">
              <li>Name</li>
              <li>E-Mail-Adresse</li>
              <li>Firmendaten</li>
              <li>Rechnungs- und Angebotsdaten</li>
            </ul>
          </Section>

          <Section title="Verwendete Dienste">
            <div className="text-sm text-white/55 space-y-3">
              <div>
                <p className="text-white/70 font-medium">Supabase</p>
                <p>Datenbankhosting, EU-Rechenzentrum.</p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Resend</p>
                <p>E-Mail-Versand.</p>
              </div>
              <div>
                <p className="text-white/70 font-medium">Anthropic Claude</p>
                <p>KI-Funktionen — keine dauerhafte Speicherung personenbezogener Daten.</p>
              </div>
            </div>
          </Section>

          <Section title="Ihre Rechte">
            <p className="text-sm text-white/55 leading-relaxed">
              Sie haben das Recht auf Auskunft, Berichtigung und Löschung Ihrer gespeicherten Daten.
              Wenden Sie sich dafür jederzeit per E-Mail an{" "}
              <a
                href="mailto:schranner.philipp@gmail.com"
                className="text-white/60 hover:text-white transition-colors underline underline-offset-2"
              >
                schranner.philipp@gmail.com
              </a>
              .
            </p>
          </Section>

          <Section title="Cookies">
            <p className="text-sm text-white/55 leading-relaxed">
              Diese Anwendung verwendet ausschließlich technisch notwendige Cookies für die
              Authentifizierung. Es werden keine Tracking- oder Marketing-Cookies eingesetzt.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
