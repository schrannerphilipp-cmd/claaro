"use client";

import Link from "next/link";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

/**
 * Zeigt eine Sperr-Seite wenn der Testzeitraum abgelaufen ist.
 * Ersetzt den normalen Seiten-Inhalt – zugängliche Routen (konto, profil)
 * sind davon ausgenommen und werden normal gerendert.
 */
export default function TrialGate() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#241c14", ...sans }}
    >
      <div className="w-full max-w-md text-center">
        {/* Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{
            backgroundColor: "rgba(var(--c-accent-rgb),0.12)",
            border: "1px solid rgba(var(--c-accent-rgb),0.2)",
          }}
        >
          <svg
            className="w-9 h-9"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: "var(--c-accent)" }}
          >
            <path
              d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 5v5l3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-3xl text-white mb-3" style={serif}>
          Testzeitraum abgelaufen
        </h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          Dein kostenloser Testzeitraum ist abgelaufen. Wähle einen Plan, um
          Claaro weiter zu nutzen — keine Datenverluste, alles bleibt erhalten.
        </p>

        {/* Primary CTA */}
        <Link
          href="/dashboard/konto?tab=abo"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--c-accent)", color: "white" }}
        >
          Plan auswählen
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        {/* Secondary: still allow profile */}
        <p className="text-white/35 text-xs mt-6">
          Du kannst weiterhin{" "}
          <Link
            href="/dashboard/konto"
            className="text-white/55 hover:text-white underline underline-offset-2 transition-colors"
          >
            Profil & Einstellungen
          </Link>{" "}
          aufrufen.
        </p>
      </div>
    </div>
  );
}
