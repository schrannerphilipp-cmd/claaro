"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const tiles = [
  {
    id: "angebote",
    icon: "📄",
    name: "Angebote",
    description: "Professionelle Angebote schnell erstellen & versenden",
    available: true,
  },
  {
    id: "mahnungen",
    icon: "⏰",
    name: "Mahnungen",
    description: "Zahlungserinnerungen automatisch & rechtssicher",
    available: true,
  },
  {
    id: "onboarding",
    icon: "🤝",
    name: "Onboarding",
    description: "Neue Kunden & Mitarbeiter strukturiert einführen",
    available: true,
  },
  {
    id: "bewertungen",
    icon: "⭐",
    name: "Bewertungen",
    description: "Kundenbewertungen einholen & verwalten",
    available: true,
  },
  {
    id: "compliance",
    icon: "🔒",
    name: "Compliance",
    description: "Vorschriften & Pflichten einfach im Blick behalten",
    available: false,
  },
  {
    id: "dienstplan",
    icon: "📅",
    name: "Dienstplan",
    description: "Schichten planen & Team koordinieren",
    available: false,
  },
];

const accountItems: { label: string; danger?: boolean }[] = [
  { label: "Profil bearbeiten" },
  { label: "Firmendaten" },
  { label: "Abo & Abrechnung" },
  { label: "Benachrichtigungen" },
  { label: "Passwort & Sicherheit" },
  { label: "Abmelden", danger: true },
];

const stats = [
  { value: "6 Features", label: "Alles in einem" },
  { value: "100 %", label: "DSGVO-konform" },
  { value: "Gemacht für", label: "Handwerk & KMU" },
  { value: "Garantiert", label: "Effizient" },
];

const helpItems = ["Kurzanleitung", "Dokumentation", "Support kontaktieren"];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, ref, onClose]);
}

export default function DashboardPage() {
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [greeting, setGreeting] = useState("Hallo");

  const accountRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Animation refs
  const heroLine1Ref = useRef<HTMLSpanElement>(null);
  const heroLine2Ref = useRef<HTMLSpanElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroBtnRef = useRef<HTMLButtonElement>(null);
  const statsDesktopRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const aboutRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  // Slide in from left when returning from a feature page
  useEffect(() => {
    if (sessionStorage.getItem("claaro-nav-back") !== "1") return;
    sessionStorage.removeItem("claaro-nav-back");
    const el = pageRef.current;
    if (!el) return;
    el.classList.add("page-enter-back");
    const id = setTimeout(() => el.classList.remove("page-enter-back"), 400);
    return () => clearTimeout(id);
  }, []);

  useOutsideClick(accountRef, accountOpen, () => setAccountOpen(false));
  useOutsideClick(helpRef, helpOpen, () => setHelpOpen(false));

  // Scroll-triggered entrance animations
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const DURATION = 700;
    const easing = "cubic-bezier(0.25, 0.1, 0.25, 1)";
    const observers: IntersectionObserver[] = [];

    function init(el: HTMLElement) {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = `opacity ${DURATION}ms ${easing}, transform ${DURATION}ms ${easing}`;
    }

    function reveal(el: HTMLElement, delay = 0) {
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
        // Clear inline styles after animation so CSS hover transitions work again
        setTimeout(() => {
          el.style.transition = "";
          el.style.opacity = "";
          el.style.transform = "";
        }, DURATION + 50);
      }, delay);
    }

    function watchGroup(els: (HTMLElement | null)[], delays: number[]) {
      const valid = els.filter((el): el is HTMLElement => el !== null);
      if (valid.length === 0) return;
      valid.forEach(init);
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          valid.forEach((el, i) => reveal(el, delays[i] ?? 0));
          obs.disconnect();
        },
        { threshold: 0.15 }
      );
      obs.observe(valid[0]);
      observers.push(obs);
    }

    // Hero: line1 → line2 (150ms) → subtitle (300ms after line2 finishes) → button
    watchGroup(
      [heroLine1Ref.current, heroLine2Ref.current, heroSubRef.current, heroBtnRef.current],
      [0, 150, 1150, 1350]
    );

    // Stats bar: 100ms stagger per item (desktop items only)
    watchGroup(statsDesktopRefs.current, [0, 100, 200, 300]);

    // Feature tiles: 80ms stagger
    watchGroup(tileRefs.current, tiles.map((_, i) => i * 80));

    // "Was ist claaro?" section: fade as one block
    watchGroup([aboutRef.current], [0]);

    // Testimonial strip: fade as one block
    watchGroup([testimonialRef.current], [0]);

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  function scrollToFeatures() {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-[#1a1814]" style={sans}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .claaro-tile {
            transition-duration: 220ms;
            transition-timing-function: ease-out;
          }
          .claaro-tile:hover {
            transform: translateY(-4px);
          }
          .claaro-tile-icon {
            transition: transform 220ms ease-out;
          }
          .claaro-tile:hover .claaro-tile-icon {
            transform: scale(1.12);
          }
          @keyframes claaroPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .claaro-help-pulse {
            animation: claaroPulse 600ms ease-out 1;
          }
        }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 sticky top-0 z-30 bg-[#1a1814]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <span
            className="text-xl font-bold text-[#c84b2f] tracking-tight flex-none"
            style={sans}
          >
            Claaro
          </span>

          <p className="flex-1 text-center text-sm text-white/50">
            {greeting},{" "}
            <span className="text-white font-medium">Philipp</span>
          </p>

          <div className="flex-none relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors border border-white/10 rounded-lg px-3.5 py-2 hover:bg-white/5"
            >
              <span className="w-6 h-6 rounded-full bg-[#c84b2f]/20 flex items-center justify-center text-xs text-[#c84b2f] font-bold">
                P
              </span>
              Mein Konto
              <svg
                className={`w-3 h-3 text-white/30 transition-transform duration-150 ${
                  accountOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2 4l4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/5 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur">
                {accountItems.map(({ label, danger }) => (
                  <button
                    key={label}
                    onClick={() => setAccountOpen(false)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                      danger
                        ? "text-[#c84b2f] border-t border-white/10 mt-1 pt-3"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <h1
          className="text-5xl lg:text-6xl text-white leading-tight mb-6"
          style={serif}
        >
          <span ref={heroLine1Ref} className="block">Weniger Bürokratie.</span>
          <span ref={heroLine2Ref} className="block">Mehr Erfolg.</span>
        </h1>
        <p
          ref={heroSubRef}
          className="text-white/60 text-lg max-w-xl mx-auto mb-10 leading-relaxed"
        >
          claaro vereinfacht den Alltag von Handwerksbetrieben und
          Unternehmen.
        </p>
        <button
          ref={heroBtnRef}
          onClick={scrollToFeatures}
          className="bg-[#c84b2f] text-white px-7 py-3.5 rounded-lg font-semibold text-base hover:bg-[#b03f25] transition-colors"
        >
          Jetzt starten
        </button>
      </section>

      {/* ── Stats bar ──────────────────────────────────────────────────────── */}
      <div className="bg-white/5 border-y border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          {/* Desktop */}
          <div className="hidden lg:flex items-stretch">
            {stats.map(({ value, label }, i) => (
              <div
                key={value}
                ref={(el) => { statsDesktopRefs.current[i] = el; }}
                className={`flex-1 flex flex-col items-center px-8 py-8 ${
                  i < stats.length - 1 ? "border-r border-white/10" : ""
                }`}
              >
                <span className="text-white font-bold text-xl mb-1">
                  {value}
                </span>
                <span className="text-white/40 text-sm">{label}</span>
              </div>
            ))}
          </div>
          {/* Mobile */}
          <div className="grid grid-cols-2 lg:hidden">
            {stats.map(({ value, label }, i) => (
              <div
                key={value}
                className={`flex flex-col items-center px-4 py-6 ${
                  i % 2 !== 0 ? "border-l border-white/10" : ""
                } ${i >= 2 ? "border-t border-white/10" : ""}`}
              >
                <span className="text-white font-bold text-base mb-0.5">
                  {value}
                </span>
                <span className="text-white/40 text-xs text-center">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature tiles ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(({ id, icon, name, description, available }, i) => (
            <Link
              key={id}
              href={`/dashboard/${id}`}
              ref={(el) => { tileRefs.current[i] = el; }}
              className={`claaro-tile relative text-left rounded-xl border p-6 transition-all ${
                available
                  ? "bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                  : "bg-white/[0.02] border-white/[0.06] hover:bg-white/5 hover:border-white/10"
              }`}
            >
              {!available && (
                <span className="absolute top-3 right-3 text-[10px] font-medium bg-white/10 text-white/40 px-2 py-0.5 rounded-full border border-white/10">
                  Bald verfügbar
                </span>
              )}
              <span
                className={`claaro-tile-icon inline-block text-2xl mb-3 ${
                  !available ? "opacity-40" : ""
                }`}
              >
                {icon}
              </span>
              <h3
                className={`font-semibold text-sm mb-1.5 ${
                  available ? "text-white" : "text-white/30"
                }`}
              >
                {name}
              </h3>
              <p
                className={`text-xs leading-relaxed ${
                  available ? "text-white/50" : "text-white/20"
                }`}
              >
                {description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Was ist claaro? ────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div
          ref={aboutRef}
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start"
        >
          <div className="flex flex-col gap-6">
            <div className="hidden md:block">
              <svg
                width="180"
                height="180"
                viewBox="0 0 180 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                {/* ── Monitor ── */}
                {/* Base/stand */}
                <polygon points="90,138 104,130 104,133 90,141" fill="var(--c-teal)" opacity="0.5"/>
                <polygon points="76,130 90,138 90,141 76,133" fill="var(--c-teal)" opacity="0.35"/>
                <rect x="83" y="140" width="14" height="3" rx="1" fill="var(--c-teal)" opacity="0.4"/>
                {/* Monitor body left face */}
                <polygon points="62,96 90,80 90,120 62,136" fill="var(--c-teal)" opacity="0.55"/>
                {/* Monitor body top face */}
                <polygon points="62,96 90,80 118,96 90,112" fill="var(--c-teal)" opacity="0.75"/>
                {/* Monitor body right face */}
                <polygon points="90,112 118,96 118,136 90,120" fill="var(--c-teal)" opacity="0.4"/>
                {/* Screen left face */}
                <polygon points="66,98 90,84 90,114 66,128" fill="var(--c-warm)" opacity="0.18"/>
                {/* Screen top face */}
                <polygon points="66,98 90,84 114,98 90,112" fill="var(--c-warm)" opacity="0.30"/>
                {/* Screen right face */}
                <polygon points="90,112 114,98 114,128 90,114" fill="var(--c-warm)" opacity="0.12"/>

                {/* ── Document / paper ── */}
                {/* Paper top face */}
                <polygon points="28,108 52,94 72,106 48,120" fill="var(--c-warm)" opacity="0.80"/>
                {/* Paper left face */}
                <polygon points="28,108 48,120 48,130 28,118" fill="var(--c-warm)" opacity="0.50"/>
                {/* Paper right face */}
                <polygon points="48,120 72,106 72,116 48,130" fill="var(--c-warm)" opacity="0.35"/>
                {/* Text lines on top face */}
                <line x1="35" y1="109" x2="54" y2="99" stroke="var(--c-teal)" strokeWidth="1.2" opacity="0.6"/>
                <line x1="35" y1="113" x2="50" y2="104" stroke="var(--c-teal)" strokeWidth="1.2" opacity="0.5"/>
                <line x1="35" y1="117" x2="46" y2="109" stroke="var(--c-teal)" strokeWidth="1.2" opacity="0.4"/>

                {/* ── Coffee cup ── */}
                {/* Cup top ellipse */}
                <ellipse cx="130" cy="118" rx="14" ry="8" fill="var(--c-dark)" opacity="0.9" stroke="var(--c-teal)" strokeWidth="1"/>
                <ellipse cx="130" cy="118" rx="10" ry="5.5" fill="var(--c-warm)" opacity="0.25"/>
                {/* Cup body left */}
                <polygon points="116,118 130,126 130,138 116,130" fill="var(--c-teal)" opacity="0.55"/>
                {/* Cup body right */}
                <polygon points="130,126 144,118 144,130 130,138" fill="var(--c-teal)" opacity="0.38"/>
                {/* Cup base */}
                <ellipse cx="130" cy="138" rx="14" ry="6" fill="var(--c-teal)" opacity="0.35"/>
                {/* Handle */}
                <path
                  d="M144,121 C152,121 152,133 144,133"
                  stroke="var(--c-teal)"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.7"
                />
                {/* Steam */}
                <path
                  d="M126,112 C126,108 129,106 129,102"
                  stroke="var(--c-warm)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />
                <path
                  d="M131,110 C131,106 134,104 134,100"
                  stroke="var(--c-warm)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.35"
                />
              </svg>
            </div>
            <h2
              className="text-3xl lg:text-4xl text-white leading-snug"
              style={serif}
            >
              Was ist claaro?
            </h2>
          </div>
          <p className="text-white/60 text-base leading-relaxed">
            claaro ist eine Softwarelösung für Unternehmen und
            Handwerksbetriebe. Sie bündelt die wichtigsten Alltagsaufgaben —
            von Angeboten über Mahnungen bis zum Dienstplan — in einer
            übersichtlichen Oberfläche. Weniger Aufwand, mehr Zeit fürs
            Wesentliche.
          </p>
        </div>
      </section>

      {/* ── Testimonial ────────────────────────────────────────────────────── */}
      <div className="bg-white/5 border-y border-white/10 py-16">
        <div
          ref={testimonialRef}
          className="max-w-2xl mx-auto px-6 flex flex-col items-center text-center gap-6"
        >
          <span
            className="text-6xl text-[#c84b2f] leading-none select-none"
            style={serif}
            aria-hidden="true"
          >
            „
          </span>
          <p
            className="text-xl lg:text-2xl text-white leading-relaxed -mt-4"
            style={serif}
          >
            Seit claaro läuft der Papierkram von selbst. Wir haben endlich Zeit
            fürs Wesentliche.
          </p>
          <div className="flex flex-col items-center gap-3" style={sans}>
            <div className="w-10 h-10 rounded-full bg-[#c84b2f] flex items-center justify-center text-white text-sm font-bold">
              MB
            </div>
            <div>
              <p className="text-white font-medium text-sm">Markus B.</p>
              <p className="text-white/40 text-xs mt-0.5">
                Inhaber, Elektrobetrieb München
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Coming soon teaser ─────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pt-16 pb-8">
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
          <svg
            className="w-4 h-4 text-white/30 shrink-0"
            fill="none"
            viewBox="0 0 16 16"
          >
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 7v4M8 5h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm text-white/50">
            Weitere Features sind in Entwicklung — bleib auf dem Laufenden.
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm text-white/30">
          <span>© 2026 claaro</span>
          <div className="flex items-center gap-6">
            <button className="hover:text-white/60 transition-colors">
              Impressum
            </button>
            <button className="hover:text-white/60 transition-colors">
              Datenschutz
            </button>
            <span>Version 0.1</span>
          </div>
        </div>
      </footer>

      {/* ── Help widget ────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2"
        ref={helpRef}
      >
        {helpOpen && (
          <div className="bg-white/5 border border-white/10 rounded-xl shadow-2xl w-52 overflow-hidden mb-1 backdrop-blur">
            {helpItems.map((item) => (
              <button
                key={item}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0"
              >
                {item}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setHelpOpen((o) => !o)}
          aria-label="Hilfe"
          className="claaro-help-pulse w-11 h-11 rounded-full bg-[#c84b2f] text-white flex items-center justify-center shadow-lg hover:bg-[#b03f25] transition-colors text-base font-bold"
        >
          ?
        </button>
      </div>
    </div>
  );
}
