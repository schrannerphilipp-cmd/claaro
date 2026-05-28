"use client";

import { useRouter } from "next/navigation";

const sans  = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-white/10 pt-8">
      <h2 className="text-base font-semibold text-white mb-3">§ {num} {title}</h2>
      {children}
    </div>
  );
}

export default function AgbPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#241c14] text-white" style={sans}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-white/55 hover:text-white/70 transition-colors mb-10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Zurück
        </button>

        <h1 className="text-4xl text-white mb-2" style={serif}>Allgemeine Geschäftsbedingungen</h1>
        <p className="text-white/55 text-sm mb-2">Claaro SaaS-Dienst — Stand: Mai 2026</p>
        <p className="text-white/40 text-xs mb-10">
          Anbieter: Philipp Schranner, Ferdinand-Miller-Str. 30, 82256 Fürstenfeldbruck · hallo@getclaaro.de · getclaaro.de
        </p>

        <div className="space-y-8">

          <Section num="1" title="Geltungsbereich">
            <p className="text-sm text-white/55 leading-relaxed">
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge zwischen Philipp Schranner (nachfolgend „Anbieter") und gewerblichen Nutzern (nachfolgend „Kunde") über die Nutzung der Software-as-a-Service-Plattform claaro. Entgegenstehende oder abweichende Bedingungen des Kunden werden nicht anerkannt, sofern der Anbieter ihrer Geltung nicht ausdrücklich schriftlich zugestimmt hat.
            </p>
          </Section>

          <Section num="2" title="Leistungsbeschreibung">
            <p className="text-sm text-white/55 leading-relaxed">
              claaro ist eine cloudbasierte Verwaltungssoftware für kleine und mittelständische Unternehmen (KMU). Die Plattform umfasst folgende Module (je nach gewähltem Tarif):
            </p>
            <ul className="text-sm text-white/55 space-y-1 list-disc list-inside mt-2">
              <li>Angebotserstellung und -versand</li>
              <li>Mahnwesen und Zahlungserinnerungen</li>
              <li>Mitarbeiter-Onboarding und Einarbeitungspläne</li>
              <li>Kundenbewertungsmanagement</li>
              <li>Compliance-Checklisten und Fristenverwaltung</li>
              <li>Dienstplan und Urlaubsverwaltung</li>
            </ul>
            <p className="text-sm text-white/55 leading-relaxed mt-3">
              Der Anbieter erbringt die Leistung über das Internet. Der Kunde benötigt eine stabile Internetverbindung und einen aktuellen Webbrowser. Ein Anspruch auf eine bestimmte Verfügbarkeit besteht vorbehaltlich einer separaten SLA-Vereinbarung nicht; der Anbieter strebt jedoch eine Verfügbarkeit von 99 % (gemessen monatlich, exkl. Wartungsfenster) an.
            </p>
          </Section>

          <Section num="3" title="Testphase (Trial)">
            <p className="text-sm text-white/55 leading-relaxed">
              Neukunden können claaro 30 Tage lang kostenlos und ohne Angabe von Zahlungsdaten testen. Die Testphase beginnt mit der Registrierung und endet automatisch nach 30 Tagen, ohne dass eine Kündigung erforderlich ist. Es entstehen während des Testzeitraums keine Kosten. Nach Ablauf der Testphase wird der Zugang auf schreibgeschützte Ansicht beschränkt; Daten werden für weitere 30 Tage vorgehalten und danach gelöscht, sofern kein kostenpflichtiges Abonnement abgeschlossen wird.
            </p>
          </Section>

          <Section num="4" title="Preise und Zahlungsbedingungen">
            <p className="text-sm text-white/55 leading-relaxed mb-3">
              Die aktuellen Tarifpreise sind auf der Website einsehbar. Alle Preise verstehen sich in Euro, <strong className="text-white/70">zzgl. der gesetzlichen Mehrwertsteuer</strong>.
            </p>
            <div className="text-sm text-white/55 space-y-2">
              <div className="flex justify-between border-b border-white/8 pb-2">
                <span>Starter (3 Module nach Wahl)</span>
                <span className="text-white/70">29,00 € / Monat zzgl. MwSt.</span>
              </div>
              <div className="flex justify-between border-b border-white/8 pb-2">
                <span>Profi (alle 6 Module)</span>
                <span className="text-white/70">59,00 € / Monat zzgl. MwSt.</span>
              </div>
              <div className="flex justify-between">
                <span>Team (alle Module + Mehrbenutzer)</span>
                <span className="text-white/70">99,00 € / Monat zzgl. MwSt.</span>
              </div>
            </div>
            <p className="text-sm text-white/55 leading-relaxed mt-3">
              Bei jährlicher Zahlung reduziert sich der monatliche Preis um ca. 20 %. Die Rechnung wird jeweils zu Beginn des Abrechnungszeitraums fällig. Die Zahlungsabwicklung erfolgt über Stripe Payments Europe Ltd.
            </p>
          </Section>

          <Section num="5" title="Laufzeit und Kündigung">
            <p className="text-sm text-white/55 leading-relaxed">
              Abonnements werden auf monatlicher oder jährlicher Basis abgeschlossen. Monatliche Abonnements sind <strong className="text-white/70">jederzeit zum Ende des laufenden Kalendermonats kündbar</strong>. Jährliche Abonnements können zum Ende des Abonnementjahres mit einer Frist von 30 Tagen gekündigt werden.
            </p>
            <p className="text-sm text-white/55 leading-relaxed mt-2">
              Die Kündigung erfolgt durch Abbestellung im Dashboard (Bereich „Mein Konto → Abo & Abrechnung") oder per E-Mail an hallo@getclaaro.de. Nach Vertragsende werden alle Kundendaten innerhalb von 30 Tagen unwiderruflich gelöscht.
            </p>
          </Section>

          <Section num="6" title="Widerrufsrecht">
            <p className="text-sm text-white/55 leading-relaxed">
              Da claaro ausschließlich an Unternehmer im Sinne von § 14 BGB (gewerbliche Nutzer/KMU) richtet, steht kein Verbraucherwiderrufsrecht nach § 312g BGB zu. Maßgeblich sind die in § 5 geregelten Kündigungsfristen.
            </p>
          </Section>

          <Section num="7" title="Pflichten des Kunden">
            <ul className="text-sm text-white/55 space-y-1.5 list-disc list-inside">
              <li>Der Kunde ist für die Richtigkeit der eingegebenen Daten verantwortlich.</li>
              <li>Zugangsdaten sind geheim zu halten und dürfen nicht an Dritte weitergegeben werden.</li>
              <li>Der Kunde darf claaro nicht für rechtswidrige Zwecke nutzen.</li>
              <li>Bei Verdacht auf unbefugten Zugriff ist der Anbieter unverzüglich zu informieren.</li>
            </ul>
          </Section>

          <Section num="8" title="Haftungsbeschränkung">
            <p className="text-sm text-white/55 leading-relaxed">
              Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Bei leichter Fahrlässigkeit haftet der Anbieter nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten) und der Höhe nach begrenzt auf den vorhersehbaren, vertragstypischen Schaden, maximal auf den vom Kunden in den letzten 12 Monaten gezahlten Netto-Jahresbetrag.
            </p>
            <p className="text-sm text-white/55 leading-relaxed mt-2">
              Die durch claaro bereitgestellten Compliance-Informationen und KI-generierten Inhalte stellen keine Rechts- oder Steuerberatung dar und ersetzen nicht die Beratung durch Fachleute. Für die Vollständigkeit und Aktualität dieser Informationen übernimmt der Anbieter keine Gewähr.
            </p>
          </Section>

          <Section num="9" title="Datenschutz">
            <p className="text-sm text-white/55 leading-relaxed">
              Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung, abrufbar unter{" "}
              <a href="/datenschutz" className="text-white/60 hover:text-white underline underline-offset-2">
                getclaaro.de/datenschutz
              </a>.
            </p>
          </Section>

          <Section num="10" title="Änderungen der AGB und Preise">
            <p className="text-sm text-white/55 leading-relaxed">
              Der Anbieter behält sich vor, diese AGB und Preise mit einer Ankündigungsfrist von 30 Tagen zu ändern. Kunden werden per E-Mail informiert. Widerspricht der Kunde nicht binnen 30 Tagen nach Zugang der Mitteilung, gelten die Änderungen als akzeptiert. Im Fall des Widerspruchs steht dem Kunden ein außerordentliches Kündigungsrecht zu.
            </p>
          </Section>

          <Section num="11" title="Gerichtsstand und anwendbares Recht">
            <p className="text-sm text-white/55 leading-relaxed">
              Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts (CISG). Gerichtsstand für alle Streitigkeiten aus diesem Vertragsverhältnis ist, soweit gesetzlich zulässig, Fürstenfeldbruck, Deutschland.
            </p>
          </Section>

          <Section num="12" title="Salvatorische Klausel">
            <p className="text-sm text-white/55 leading-relaxed">
              Sollten einzelne Bestimmungen dieser AGB unwirksam oder undurchführbar sein oder werden, bleiben die übrigen Bestimmungen hiervon unberührt. Die unwirksame Bestimmung ist durch eine wirksame zu ersetzen, die dem wirtschaftlichen Zweck der unwirksamen am nächsten kommt.
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div className="border-t border-white/8 mt-12 pt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/30">
          <span>© 2026 claaro</span>
          <div className="flex gap-4">
            <a href="/impressum" className="hover:text-white/50 transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-white/50 transition-colors">Datenschutz</a>
          </div>
        </div>
      </div>
    </div>
  );
}
