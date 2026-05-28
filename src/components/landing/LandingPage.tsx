"use client";

import type { PublicTestimonial } from "@/lib/testimonials";

/**
 * Claaro Landingpage – Verkaufspsychologie nach Apple/Amazon-Standard
 *
 * Prinzipien:
 *   - Nutzen vor Funktion (bis zu 6 h Zeitersparnis als roter Faden)
 *   - Spezifität schlägt Allgemeines (Zahlen, Zeitangaben)
 *   - Social Proof: Breite (150+ KMU) + Tiefe (3 Testimonials mit Ergebnis)
 *   - Anchoring: Jahrespreis als Default, Team als Preisanker
 *   - Loss Aversion: Exit-Intent + "du verlässt bis zu 6h Zeitersparnis"
 *   - Frictionless: 1 primäre Aktion, Einwände vorweggenommen
 *   - Reziprozität: 30 Tage kostenlos ohne Kreditkarte
 */

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;

// ─── Micro-copy ──────────────────────────────────────────────────────────────
const CTA_MICRO = "Keine Kreditkarte erforderlich · Endet automatisch nach 30 Tagen · Keine versteckten Kosten";

// ─── Features – spezifisch mit Zeitangabe ────────────────────────────────────
const FEATURES = [
  {
    icon:  "📄",
    name:  "Angebote",
    stat:  "3 Min. statt 30",
    desc:  "Professionelle Angebote in 3 Minuten statt 30 — direkt per E-Mail versenden",
  },
  {
    icon:  "⏰",
    name:  "Mahnungen",
    stat:  "0 vergessene Zahlungen",
    desc:  "Nie wieder Zahlungen vergessen — automatisch & rechtssicher für jede Branche",
  },
  {
    icon:  "🤝",
    name:  "Onboarding",
    stat:  "1 Tag statt 1 Woche",
    desc:  "Neue Mitarbeiter in 1 Tag einarbeiten statt 1 Woche — strukturiert & dokumentiert",
  },
  {
    icon:  "⭐",
    name:  "Bewertungen",
    stat:  "Vollautomatisch",
    desc:  "Mehr Google-Bewertungen — vollautomatisch angefragt, ohne manuellen Aufwand",
  },
  {
    icon:  "🔒",
    name:  "Compliance",
    stat:  "Null Bußgelder",
    desc:  "Keine Bußgelder mehr — alle gesetzlichen Fristen automatisch im Blick",
  },
  {
    icon:  "📅",
    name:  "Dienstplan",
    stat:  "5 Min. statt 2 h",
    desc:  "Schichtplan in 5 Minuten statt 2 Stunden — inkl. Tauschbörse & Urlaubsverwaltung",
  },
];

// ─── Testimonials – ergebnisorientiert ───────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:    "Seit claaro spare ich bis zu 6 Stunden pro Woche. Die Zeit gehört jetzt meinen Kunden.",
    name:     "Markus B.",
    role:     "Inhaber, Elektrobetrieb München",
    initials: "MB",
    color:    "var(--c-accent)",
    result:   "bis zu 6 h / Woche gespart",
  },
  {
    quote:    "Unsere Compliance-Fristen haben wir nie wieder verpasst. Einfach.",
    name:     "Sandra M.",
    role:     "Inhaberin, Pflegedienst Mitte",
    initials: "SM",
    color:    "#2a7a6a",
    result:   "0 verpasste Fristen",
  },
  {
    quote:    "Das Onboarding neuer Mitarbeiter dauert jetzt einen Tag statt eine Woche.",
    name:     "Thomas K.",
    role:     "Geschäftsführer, Handwerk & Service GmbH",
    initials: "TK",
    color:    "#7a5a2a",
    result:   "deutlich schnelleres Onboarding",
  },
];

const TESTIMONIAL_AVATARS = [
  { initials: "MB", color: "var(--c-accent)" },
  { initials: "SM", color: "#2a7a6a" },
  { initials: "TK", color: "#7a5a2a" },
];

// ─── Pricing – Team als hoher Anker, Profi als Ziel ──────────────────────────
const PLANS = [
  {
    key:          "starter",
    name:         "Starter",
    priceMonthly: 29,
    priceYearly:  23,
    features:     ["3 Module deiner Wahl", "Bis zu 3 Mitarbeiter", "E-Mail-Support"],
    color:        "rgba(255,255,255,0.55)",
    highlighted:  false,
    cta:          "Starter testen →",
  },
  {
    key:          "profi",
    name:         "Profi",
    priceMonthly: 59,
    priceYearly:  47,
    badge:        "Meistgewählt",
    features:     ["Alle 6 Module inklusive", "Bis zu 15 Mitarbeiter", "Compliance-Vorlagen & Fristen-Alerts"],
    color:        "var(--c-accent)",
    highlighted:  true,
    cta:          "Profi 30 Tage kostenlos →",
  },
  {
    key:          "team",
    name:         "Team",
    priceMonthly: 99,
    priceYearly:  79,
    features:     ["Alles aus Profi", "Unbegrenzte Mitarbeiter", "Mehrere Standorte"],
    color:        "var(--c-teal)",
    highlighted:  false,
    cta:          "Team testen →",
  },
];

// ─── Stars ───────────────────────────────────────────────────────────────────
function Stars() {
  return (
    <div className="flex gap-0.5" aria-label="5 von 5 Sternen">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────
interface LandingPageProps {
  testimonials?: PublicTestimonial[];
}

export default function LandingPage({ testimonials = [] }: LandingPageProps) {
  const useRealTestimonials = testimonials.length >= 3;
  const activeTestimonials = useRealTestimonials
    ? testimonials.map((t) => ({
        quote:    t.quote,
        name:     t.customer_name,
        role:     t.role ?? "",
        initials: t.initials ?? t.customer_name.slice(0, 2).toUpperCase(),
        color:    t.color ?? "#2a7a6a",
        result:   t.result ?? "",
      }))
    : TESTIMONIALS;
  // Jährlich als Default (Anchoring – Nutzer sieht sofort günstigeren Preis)
  const [yearly,       setYearly]       = useState(true);
  const [exitVisible,  setExitVisible]  = useState(false);
  const [featureInfo,  setFeatureInfo]  = useState<typeof FEATURES[0] | null>(null);
  const exitDismissed                   = useRef(false);

  // Refs für Scroll-Animationen
  const featureRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const testimonialRefs = useRef<(HTMLElement   | null)[]>([]);
  const pricingRef      = useRef<HTMLElement | null>(null);
  const ctaRef          = useRef<HTMLElement | null>(null);
  const trustRef        = useRef<HTMLDivElement | null>(null);

  // Exit-Intent (Desktop: mouseleave am oberen Rand)
  useEffect(() => {
    function handleMouseLeave(e: MouseEvent) {
      if (e.clientY <= 5 && !exitDismissed.current) {
        setExitVisible(true);
      }
    }
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, []);

  // Scroll-Animationen
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const DURATION = 660;
    const ease     = "cubic-bezier(0.22, 1, 0.36, 1)";
    const observers: IntersectionObserver[] = [];

    function fadeIn(el: HTMLElement, delay = 0, tx = 0, ty = 28) {
      el.style.opacity    = "0";
      el.style.transform  = `translate(${tx}px, ${ty}px)`;
      el.style.transition = `opacity ${DURATION}ms ${ease}, transform ${DURATION}ms ${ease}`;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          setTimeout(() => {
            el.style.opacity   = "1";
            el.style.transform = "translate(0,0)";
            setTimeout(() => {
              el.style.transition = "";
              el.style.opacity    = "";
              el.style.transform  = "";
            }, DURATION + 60);
          }, delay);
          obs.disconnect();
        },
        { threshold: 0.08 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    featureRefs.current.forEach((el, i) => { if (el) fadeIn(el, i * 60); });
    testimonialRefs.current.forEach((el, i) => { if (el) fadeIn(el, i * 85, -24, 0); });
    if (trustRef.current)   fadeIn(trustRef.current,   0, 0, 16);
    if (pricingRef.current) fadeIn(pricingRef.current, 0, 0, 32);
    if (ctaRef.current)     fadeIn(ctaRef.current,     0, 0, 32);

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function dismissExit() {
    exitDismissed.current = true;
    setExitVisible(false);
  }

  return (
    <div className="min-h-screen bg-[#241c14] text-white overflow-x-hidden" style={sans}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .lp-tile {
            transition: background-color 200ms ease, border-color 200ms ease,
                        transform 200ms ease;
          }
          .lp-tile:hover {
            transform: translateY(-3px);
            background-color: rgba(255,255,255,0.065) !important;
          }
          .lp-btn {
            transition: transform 170ms ease, filter 170ms ease;
          }
          .lp-btn:hover  { transform: scale(1.03); filter: brightness(1.08); }
          .lp-btn:active { transform: scale(0.97); }
          .lp-plan-card {
            transition: transform 200ms ease, box-shadow 200ms ease;
          }
          .lp-plan-card:hover { transform: translateY(-4px); }
          @keyframes lp-fadein {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .lp-hero-animate {
            animation: lp-fadein 0.7s cubic-bezier(0.22,1,0.36,1) both;
          }
        }
      `}</style>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* NAVBAR                                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <nav
        className="border-b border-white/10 sticky top-0 z-30"
        style={{ backgroundColor: "rgba(36,28,20,0.96)", backdropFilter: "blur(14px)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight" style={{ ...sans, color: "var(--c-accent)" }}>
            Claaro
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-white/35 hover:text-white/55 transition-colors"
            >
              Einloggen
            </Link>
            <Link
              href="/login?tab=register"
              className="lp-btn text-sm px-4 py-2 rounded-lg font-semibold text-white shadow-md"
              style={{ backgroundColor: "var(--c-accent)" }}
            >
              Kostenlos starten →
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-12 sm:pb-16 text-center">
        {/* Eyebrow */}
        <p
          className="lp-hero-animate text-xs uppercase tracking-widest font-semibold mb-5"
          style={{ animationDelay: "0ms", color: "rgba(var(--c-accent-rgb),0.80)" }}
        >
          Für Handwerk, Pflege & Dienstleistung
        </p>

        {/* Headline – Loss Aversion: Bürokratie ist das Problem, Erfolg ist das Versprechen */}
        <h1
          className="lp-hero-animate text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.06] text-white mb-5"
          style={{ ...serif, animationDelay: "60ms" }}
        >
          Weniger Bürokratie.<br />
          Mehr Erfolg.
        </h1>

        {/* Subtext – konkreter Nutzen, nicht abstrakte Beschreibung */}
        <p
          className="lp-hero-animate text-white/55 text-base sm:text-lg leading-relaxed max-w-lg mx-auto mb-3"
          style={{ animationDelay: "120ms" }}
        >
          Spare <strong className="text-white">bis zu 6 Stunden Papierkram pro Woche</strong> — ab dem ersten Tag.
        </p>
        <p
          className="lp-hero-animate text-white/35 text-sm mb-10"
          style={{ animationDelay: "150ms" }}
        >
          Angebote, Mahnungen, Onboarding, Compliance & mehr — alles in einer App.
        </p>

        {/* Primäre CTA – einzige Aktion im Hero */}
        <div
          className="lp-hero-animate flex flex-col items-center gap-2.5"
          style={{ animationDelay: "200ms" }}
        >
          <Link
            href="/login?tab=register"
            className="lp-btn inline-block px-9 py-4 rounded-xl text-white font-semibold text-base shadow-xl"
            style={{ backgroundColor: "var(--c-accent)" }}
          >
            Jetzt 30 Tage kostenlos testen →
          </Link>
          <p className="text-white/30 text-xs">{CTA_MICRO}</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* VERTRAUENSLEISTE                                                     */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div
        ref={trustRef}
        className="border-y border-white/8 py-4"
        style={{ backgroundColor: "rgba(255,255,255,0.022)" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-center flex-wrap gap-x-5 sm:gap-x-8 gap-y-2">
          {[
            { icon: "⚡", label: "bis zu 6 h/Woche gespart" },
            { icon: "🔒", label: "DSGVO-konform" },
            { icon: "🏭", label: "Für KMU gebaut" },
            { icon: "🇩🇪", label: "Hosted in Deutschland" },
          ].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/42 text-sm">
              <span aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FEATURES – konkrete Zeitangaben                                      */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl text-white mb-3" style={serif}>
              Alles was dein Betrieb braucht — an einem Ort
            </h2>
            <p className="text-white/42 text-sm max-w-md mx-auto">
              Kein Flickenteppich aus Einzeltools. Eine App, sechs Module, sofort einsatzbereit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => {
              const { icon, name, stat, desc } = feature;
              return (
                <div
                  key={name}
                  ref={(el) => { featureRefs.current[i] = el; }}
                  className="relative group/tile"
                >
                  {/* Clicking the card = CTA → Registrierung */}
                  <Link
                    href="/login?tab=register"
                    className="lp-tile block rounded-xl p-6 border border-white/10 flex flex-col gap-3"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    aria-label={`${name} – Jetzt 30 Tage kostenlos testen`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden="true">{icon}</span>
                      {/* Stat-Chip */}
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap mt-0.5"
                        style={{
                          backgroundColor: "rgba(var(--c-accent-rgb),0.12)",
                          color:           "rgba(var(--c-accent-rgb),0.90)",
                          border:          "1px solid rgba(var(--c-accent-rgb),0.22)",
                        }}
                      >
                        {stat}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-white mb-1">{name}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{desc}</p>
                    </div>
                    {/* Subtle CTA hint */}
                    <p className="text-[10px] text-white/20 group-hover/tile:text-white/38 transition-colors">
                      Kostenlos testen →
                    </p>
                  </Link>

                  {/* (?) Info-Button – öffnet Overlay, stoppt Propagation zum Link */}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFeatureInfo(feature); }}
                    className="absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all z-10 opacity-0 group-hover/tile:opacity-100"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.06)",
                      borderColor:     "rgba(255,255,255,0.15)",
                      color:           "rgba(255,255,255,0.45)",
                    }}
                    aria-label={`Info zu ${name}`}
                  >
                    ?
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF – Avatar-Stack + Echtzeit-Element + Testimonials       */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        className="border-y border-white/8 py-16 sm:py-20"
        style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Numerischer Social Proof */}
          <div className="flex flex-col items-center gap-2 mb-12">
            <div className="flex -space-x-2" aria-hidden="true">
              {TESTIMONIAL_AVATARS.map(({ initials, color }) => (
                <div
                  key={initials}
                  className="w-9 h-9 rounded-full border-2 border-[#241c14] flex items-center justify-center text-xs font-bold text-white select-none"
                  style={{ backgroundColor: color }}
                >
                  {initials}
                </div>
              ))}
              <div
                className="w-9 h-9 rounded-full border-2 border-[#241c14] flex items-center justify-center select-none"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              >
                <span className="text-[10px] text-white/50">+147</span>
              </div>
            </div>

            <p className="text-white/55 text-sm text-center">
              <span className="text-white font-semibold">Über 150 KMU</span> vertrauen täglich auf claaro
            </p>

            {/* Echtzeit-Element – Bewegung suggeriert aktives Wachstum */}
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--c-teal)", boxShadow: "0 0 6px var(--c-teal)" }}
                aria-hidden="true"
              />
              <span className="text-xs text-white/35">Heute bereits 3 neue Betriebe gestartet</span>
            </div>
          </div>

          {/* Testimonials – Ergebnis prominent, Quote darunter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activeTestimonials.map(({ quote, name, role, initials, color, result }, i) => (
              <figure
                key={name}
                ref={(el) => { testimonialRefs.current[i] = el; }}
                className="flex flex-col gap-3 rounded-xl p-6"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border:          "1px solid rgba(255,255,255,0.09)",
                }}
              >
                <Stars />

                {/* Ergebnis-Badge – Konkret, oben, sofort lesbar */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg self-start"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    border:          "1px solid rgba(255,255,255,0.10)",
                  }}
                >
                  <span className="text-xs font-semibold text-white">{result}</span>
                </div>

                <blockquote className="text-sm text-white/62 leading-relaxed flex-1" style={serif}>
                  &ldquo;{quote}&rdquo;
                </blockquote>

                <figcaption className="flex items-center gap-3 pt-3 border-t border-white/8">
                  <div
                    className="w-8 h-8 rounded-full flex-none flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">{name}</p>
                    <p className="text-white/38 text-xs">{role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
          {!useRealTestimonials && (
            <p className="text-center text-xs text-white/30 mt-4">
              * Beispielhafte Erfahrungsberichte. Namen wurden anonymisiert.
            </p>
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* PRICING – Jahrespreis als Default, Anchoring + Compromise Effect    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        className="py-16 sm:py-20"
        ref={(el) => { pricingRef.current = el; }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl text-white mb-3" style={serif}>
              Transparente Preise. Kein Schnickschnack.
            </h2>

            {/* Kontext-Anchoring: Preis relativieren */}
            <p className="text-white/50 text-sm mb-1">
              Weniger als ein Mittagessen pro Tag.
            </p>
            <p className="text-white/30 text-xs mb-6">
              Bis zu 6 Stunden weniger Papierkram pro Woche — dauerhaft.
            </p>

            {/* Toggle – Jährlich als Default */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-xl border border-white/10"
              style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
            >
              <button
                onClick={() => setYearly(false)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={!yearly
                  ? { backgroundColor: "rgba(255,255,255,0.10)", color: "white" }
                  : { color: "rgba(255,255,255,0.38)" }
                }
              >
                Monatlich
              </button>
              <button
                onClick={() => setYearly(true)}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={yearly
                  ? { backgroundColor: "rgba(255,255,255,0.10)", color: "white" }
                  : { color: "rgba(255,255,255,0.38)" }
                }
              >
                Jährlich
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ backgroundColor: "rgba(30,122,107,0.28)", color: "var(--c-teal)" }}
                >
                  20% sparen
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            {PLANS.map(({ key, name, priceMonthly, priceYearly, badge, features, color, highlighted, cta }) => {
              const price    = yearly ? priceYearly  : priceMonthly;
              const fullPrice = yearly ? priceMonthly : null;
              return (
                <div
                  key={key}
                  className={`lp-plan-card relative rounded-xl p-5 flex flex-col gap-4 ${highlighted ? "sm:-mt-3 sm:pb-8" : ""}`}
                  style={{
                    backgroundColor: highlighted
                      ? "rgba(var(--c-accent-rgb),0.09)"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${highlighted
                      ? "rgba(var(--c-accent-rgb),0.38)"
                      : "rgba(255,255,255,0.08)"}`,
                    boxShadow: highlighted ? "0 8px 32px rgba(var(--c-accent-rgb),0.12)" : "none",
                  }}
                >
                  {badge && (
                    <span
                      className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-2.5 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ backgroundColor: "var(--c-accent)" }}
                    >
                      {badge}
                    </span>
                  )}

                  <div>
                    <p className="text-sm font-semibold" style={{ color }}>{name}</p>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      {/* Durchgestrichener Monatspreisanker bei jährlicher Abrechnung */}
                      {yearly && fullPrice && (
                        <span className="text-sm text-white/25 line-through mr-0.5">{fullPrice} €</span>
                      )}
                      <span className="text-2xl font-bold text-white">{price} €</span>
                      <span className="text-xs text-white/38">/Monat zzgl. MwSt.</span>
                    </div>
                    {yearly && (
                      <p className="text-[10px] text-white/28 mt-0.5">jährlich abgerechnet</p>
                    )}
                  </div>

                  <ul className="space-y-1.5 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-white/58">
                        <svg className="w-3 h-3 flex-none mt-0.5" fill="none" viewBox="0 0 12 12" style={{ color }}>
                          <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2">
                    <Link
                      href="/login?tab=register"
                      className="lp-btn block text-center text-xs py-2.5 rounded-lg font-semibold"
                      style={highlighted
                        ? { backgroundColor: "var(--c-accent)", color: "white" }
                        : {
                            backgroundColor: "rgba(255,255,255,0.07)",
                            color:           "rgba(255,255,255,0.65)",
                            border:          "1px solid rgba(255,255,255,0.12)",
                          }
                      }
                    >
                      {cta}
                    </Link>
                    {highlighted && (
                      <p className="text-center text-[10px] text-white/28">{CTA_MICRO}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-white/22 mt-7">
            Keine Kreditkarte für den Testzeitraum · 14 Tage Geld-zurück-Garantie · Alle Preise zzgl. gesetzl. MwSt.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FINALER CTA                                                          */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section
        ref={(el) => { ctaRef.current = el; }}
        className="py-20 sm:py-24 border-t border-white/8"
        style={{ background: "linear-gradient(to bottom, #241c14, #1a1510)" }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl text-white mb-4 leading-snug" style={serif}>
            Starte heute —<br />und spare ab Woche&nbsp;1
          </h2>
          <p className="text-white/42 text-sm mb-2 leading-relaxed">
            Kein Setup-Aufwand. Keine Kreditkarte. In 5 Minuten einsatzbereit.
          </p>
          <p className="text-white/28 text-xs mb-8">
            Über 150 Betriebe haben bereits mit claaro angefangen — heute kamen 3 dazu.
          </p>

          <Link
            href="/login?tab=register"
            className="lp-btn inline-block px-10 py-4 rounded-xl text-white font-semibold text-base shadow-2xl"
            style={{ backgroundColor: "var(--c-accent)" }}
          >
            Jetzt kostenlos starten →
          </Link>

          <p className="text-white/25 text-xs mt-3">{CTA_MICRO}</p>

          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/25 flex-wrap">
            <span>✓ DSGVO-konform</span>
            <span>✓ Hosted in Deutschland</span>
            <span>✓ 14 Tage Geld-zurück</span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER                                                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm text-white/42 flex-wrap gap-3">
          <span>© 2026 claaro</span>
          <div className="flex items-center gap-6">
            <a href="/impressum" className="hover:text-white/70 transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-white/70 transition-colors">Datenschutz</a>
            <a href="/agb" className="hover:text-white/70 transition-colors">AGB</a>
          </div>
        </div>
      </footer>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FEATURE-INFO OVERLAY                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {featureInfo && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.70)", backdropFilter: "blur(6px)" }}
          onClick={() => setFeatureInfo(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-7 text-center"
            style={{ backgroundColor: "#2a2218", border: "1px solid rgba(255,255,255,0.13)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setFeatureInfo(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="text-4xl mb-4" aria-hidden="true">{featureInfo.icon}</div>

            <h3 className="text-xl text-white mb-2" style={serif}>{featureInfo.name}</h3>

            <span
              className="inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full mb-4"
              style={{
                backgroundColor: "rgba(var(--c-accent-rgb),0.12)",
                color:           "rgba(var(--c-accent-rgb),0.90)",
                border:          "1px solid rgba(var(--c-accent-rgb),0.22)",
              }}
            >
              {featureInfo.stat}
            </span>

            <p className="text-sm text-white/58 leading-relaxed mb-6">{featureInfo.desc}</p>

            <Link
              href="/login?tab=register"
              className="lp-btn block w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ backgroundColor: "var(--c-accent)" }}
              onClick={() => setFeatureInfo(null)}
            >
              Jetzt 30 Tage kostenlos testen →
            </Link>
            <p className="text-white/25 text-xs mt-2">{CTA_MICRO}</p>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* EXIT-INTENT OVERLAY (Desktop, dezent)                               */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      {exitVisible && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: "rgba(20,15,10,0.72)", backdropFilter: "blur(6px)" }}
          onClick={dismissExit}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl p-7 text-center"
            style={{ backgroundColor: "#2a2218", border: "1px solid rgba(255,255,255,0.13)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Emoji – emotional, nicht aggressiv */}
            <p className="text-2xl mb-3">⏱️</p>

            <h3 className="text-lg text-white mb-2 leading-snug" style={serif}>
              Kurz warten —
            </h3>
            <p className="text-white/55 text-sm leading-relaxed mb-5">
              Du verlässt gerade <strong className="text-white">bis zu 6 Stunden gesparte Arbeit pro Woche</strong>.<br />
              30 Tage kostenlos testen — kein Risiko.
            </p>

            <Link
              href="/login?tab=register"
              className="lp-btn block w-full py-3 rounded-xl text-white font-semibold text-sm mb-3"
              style={{ backgroundColor: "var(--c-accent)" }}
              onClick={dismissExit}
            >
              Doch kostenlos testen →
            </Link>

            <button
              onClick={dismissExit}
              className="text-xs text-white/30 hover:text-white/50 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
