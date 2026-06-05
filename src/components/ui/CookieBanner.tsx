"use client";

import { useState, useEffect } from "react";
import { getConsent, saveConsent, hasConsented } from "@/lib/consent";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function CookieBanner() {
  const [visible,   setVisible]   = useState(false);
  const [expanded,  setExpanded]  = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!hasConsented()) setVisible(true);
  }, []);

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true });
    setVisible(false);
  }

  function acceptNecessary() {
    saveConsent({ analytics: false, marketing: false });
    setVisible(false);
  }

  function acceptCustom() {
    saveConsent({ analytics, marketing });
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[200] px-4 pb-4 sm:px-6"
      style={sans}
      role="dialog"
      aria-label="Cookie-Einstellungen"
    >
      <div
        className="max-w-2xl mx-auto rounded-2xl shadow-2xl border"
        style={{
          backgroundColor: "#1e1810",
          borderColor:     "rgba(255,255,255,0.12)",
        }}
      >
        <div className="px-5 py-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Cookies &amp; Datenschutz</p>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">
                Wir nutzen Cookies, um unsere Website zu verbessern. Notwendige Cookies sind immer aktiv.{" "}
                <a href="/datenschutz" className="underline text-white/60 hover:text-white/80">Mehr erfahren</a>
              </p>
            </div>
          </div>

          {/* Expanded categories */}
          {expanded && (
            <div className="space-y-3 pt-2 border-t border-white/8">
              {/* Necessary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Notwendig</p>
                  <p className="text-[11px] text-white/45">Session, Auth, Sicherheit</p>
                </div>
                <div
                  className="w-9 h-5 rounded-full flex items-center"
                  style={{ backgroundColor: "var(--c-teal)", cursor: "not-allowed", paddingLeft: "20px" }}
                  title="Immer aktiv"
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow" />
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Analyse (GA4)</p>
                  <p className="text-[11px] text-white/45">Besucherstatistiken, Seitenaufrufe — anonymisiert</p>
                </div>
                <button
                  onClick={() => setAnalytics((v) => !v)}
                  role="switch"
                  aria-checked={analytics}
                  className="relative w-9 h-5 rounded-full transition-colors focus:outline-none"
                  style={{ backgroundColor: analytics ? "var(--c-teal)" : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white shadow-sm transition-transform"
                    style={{ width: 16, height: 16, transform: analytics ? "translateX(20px)" : "translateX(2px)" }}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-white">Marketing (Meta Pixel)</p>
                  <p className="text-[11px] text-white/45">Personalisierte Werbung, Retargeting</p>
                </div>
                <button
                  onClick={() => setMarketing((v) => !v)}
                  role="switch"
                  aria-checked={marketing}
                  className="relative w-9 h-5 rounded-full transition-colors focus:outline-none"
                  style={{ backgroundColor: marketing ? "var(--c-accent)" : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 rounded-full bg-white shadow-sm transition-transform"
                    style={{ width: 16, height: 16, transform: marketing ? "translateX(20px)" : "translateX(2px)" }}
                  />
                </button>
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={acceptAll}
              className="flex-1 sm:flex-none text-xs font-semibold px-4 py-2 rounded-lg text-white transition-colors"
              style={{ backgroundColor: "var(--c-accent)" }}
            >
              Alle akzeptieren
            </button>

            {expanded ? (
              <button
                onClick={acceptCustom}
                className="flex-1 sm:flex-none text-xs font-medium px-4 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/8 transition-colors"
              >
                Auswahl speichern
              </button>
            ) : (
              <button
                onClick={() => setExpanded(true)}
                className="flex-1 sm:flex-none text-xs font-medium px-4 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/8 transition-colors"
              >
                Einstellungen
              </button>
            )}

            <button
              onClick={acceptNecessary}
              className="text-xs text-white/40 hover:text-white/60 transition-colors px-2"
            >
              Nur notwendige
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
