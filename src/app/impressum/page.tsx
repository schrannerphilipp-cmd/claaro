"use client";

const sans  = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

export default function ImpressumPage() {
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

        <h1 className="text-4xl text-white mb-2" style={serif}>Impressum</h1>
        <p className="text-white/40 text-sm mb-10">Angaben gemäß § 5 TMG</p>

        <div className="space-y-2 text-white/80 text-sm mb-10">
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

        <div className="border-t border-white/10 pt-8 mb-8">
          <h2 className="text-base font-semibold text-white mb-3">Haftungsausschluss</h2>
          <p className="text-sm text-white/55 leading-relaxed">
            Die bereitgestellten Compliance-Informationen und KI-generierten Schichtpläne stellen
            keine Rechts- oder Steuerberatung dar. Für die Aktualität der Inhalte wird keine Gewähr
            übernommen.
          </p>
        </div>

        <div className="border-t border-white/10 pt-8">
          <h2 className="text-base font-semibold text-white mb-3">
            Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV
          </h2>
          <div className="text-sm text-white/55 space-y-1">
            <p>Philipp Schranner</p>
            <p>Ferdinand-Miller-Str. 30</p>
            <p>82256 Fürstenfeldbruck</p>
          </div>
        </div>
      </div>
    </div>
  );
}
