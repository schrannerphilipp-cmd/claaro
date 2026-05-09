import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#1a1814]">
      {/* Navigation */}
      <header className="border-b border-white/10">
        <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-[#c84b2f] tracking-tight">
            Claaro
          </span>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Funktionen
            </Link>
            <Link
              href="#pricing"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              Preise
            </Link>
            <Link
              href="/angebot"
              className="text-sm bg-[#c84b2f] text-white px-4 py-2 rounded-lg hover:bg-[#b03f25] transition-colors"
            >
              Kostenlos starten
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <span className="inline-block bg-[#1e7a6b]/20 text-[#1e7a6b] text-sm font-medium px-3 py-1 rounded-full mb-6">
            Neu: KI-gestützte Angebotserstellung
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-6 leading-tight">
            Claaro – Professionelle Angebote
            <br />
            <span className="text-[#c84b2f]">in 60 Sekunden</span>
          </h1>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Schluss mit stundenlangem Formatieren in Word oder Excel. Mit Claaro
            erstellen kleine Unternehmen blitzschnell Angebote, die wirklich
            überzeugen.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/angebot"
              className="bg-[#c84b2f] text-white px-7 py-3.5 rounded-lg font-semibold hover:bg-[#b03f25] transition-colors text-base"
            >
              Erstes Angebot erstellen →
            </Link>
            <Link
              href="#demo"
              className="text-white px-7 py-3.5 rounded-lg font-medium hover:bg-white/10 transition-colors text-base border border-white/20"
            >
              Demo ansehen
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/30">
            Kostenlos · Keine Kreditkarte · Sofort einsatzbereit
          </p>
        </section>

        {/* Features */}
        <section id="features" className="bg-[#f2ede4] py-20">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-center text-[#1a1814] mb-4">
              Alles, was Sie für ein gutes Angebot brauchen
            </h2>
            <p className="text-center text-[#1a1814]/60 mb-14 max-w-xl mx-auto">
              Claaro führt Sie Schritt für Schritt durch den Prozess – ohne
              Einarbeitung, ohne Vorkenntnisse.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white rounded-xl p-6 shadow-sm border border-[#1a1814]/10"
                >
                  <div className="text-3xl mb-4">{feature.icon}</div>
                  <h3 className="font-semibold text-[#1a1814] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#1a1814]/60 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Bereit, Ihr erstes Angebot zu erstellen?
          </h2>
          <p className="text-white/60 mb-8 max-w-md mx-auto">
            Tausende kleiner Unternehmen vertrauen bereits auf Claaro. Starten
            Sie noch heute – kostenlos.
          </p>
          <Link
            href="/angebot"
            className="inline-block bg-[#c84b2f] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#b03f25] transition-colors text-base"
          >
            Jetzt kostenlos starten
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-white/30">
          <span>© 2026 Claaro. Alle Rechte vorbehalten.</span>
          <div className="flex gap-6">
            <Link href="/datenschutz" className="hover:text-white/60 transition-colors">
              Datenschutz
            </Link>
            <Link href="/impressum" className="hover:text-white/60 transition-colors">
              Impressum
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: "⚡",
    title: "In 60 Sekunden fertig",
    description:
      "Geben Sie Kundendaten und Leistungen ein – Claaro erstellt daraus ein druckfertiges Angebot.",
  },
  {
    icon: "🎨",
    title: "Professionelles Design",
    description:
      "Moderne Vorlagen, die Ihr Unternehmen im besten Licht präsentieren. Mit Ihrem Logo und Farben.",
  },
  {
    icon: "📄",
    title: "PDF-Export & Versand",
    description:
      "Laden Sie das Angebot als PDF herunter oder senden Sie es direkt per E-Mail an Ihren Kunden.",
  },
  {
    icon: "✅",
    title: "Angebote verfolgen",
    description:
      "Behalten Sie den Überblick: Welche Angebote wurden geöffnet, angenommen oder abgelehnt?",
  },
  {
    icon: "🔁",
    title: "Vorlagen & Wiederverwendung",
    description:
      "Speichern Sie häufige Leistungen als Vorlage und erstellen Sie Folge-Angebote mit einem Klick.",
  },
  {
    icon: "🔒",
    title: "Sicher & DSGVO-konform",
    description:
      "Ihre Daten liegen auf deutschen Servern. Vollständig DSGVO-konform, ohne Kompromisse.",
  },
];
