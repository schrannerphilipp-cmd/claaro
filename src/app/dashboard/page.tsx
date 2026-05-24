"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import { canAccess, requiredPlan, PLAN_NAMES, type Plan, type ModuleId } from "@/lib/plan-gate";
import PendingTasksWidget from "@/components/dashboard/PendingTasksWidget";

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const tiles: { id: ModuleId; icon: string; name: string; description: string }[] = [
  { id: "angebote",    icon: "📄", name: "Angebote",    description: "Professionelle Angebote schnell erstellen & versenden" },
  { id: "mahnungen",  icon: "⏰", name: "Mahnungen",   description: "Zahlungserinnerungen automatisch & rechtssicher" },
  { id: "onboarding", icon: "🤝", name: "Onboarding",  description: "Neue Kunden & Mitarbeiter strukturiert einführen" },
  { id: "bewertungen",icon: "⭐", name: "Bewertungen", description: "Kundenbewertungen einholen & verwalten" },
  { id: "compliance", icon: "🔒", name: "Compliance",  description: "Vorschriften & Pflichten einfach im Blick behalten" },
  { id: "dienstplan", icon: "📅", name: "Dienstplan",  description: "Schichten planen & Team koordinieren" },
];

const accountLinks: { label: string; href?: string; danger?: boolean }[] = [
  { label: "Profil bearbeiten",   href: "/dashboard/konto#profil" },
  { label: "Firmendaten",         href: "/dashboard/einstellungen" },
  { label: "Abo & Abrechnung",    href: "/dashboard/konto#abo" },
  { label: "Benachrichtigungen",  href: "/dashboard/konto#benachrichtigungen" },
  { label: "Passwort & Sicherheit", href: "/dashboard/konto#sicherheit" },
  { label: "Abmelden", danger: true },
];

const stats = [
  { value: "6 Features", num: 6,   suffix: " Features", label: "Alles in einem" },
  { value: "100 %",      num: 100, suffix: " %",        label: "DSGVO-orientiert konzipiert" },
  { value: "Gemacht für", num: null, suffix: "",         label: "Handwerk & KMU" },
  { value: "Garantiert",  num: null, suffix: "",         label: "Effizient" },
];

const helpItems = ["Kurzanleitung", "Support kontaktieren"];

const anleitungTools: {
  icon: string; name: string; color: string;
  steps: { emoji: string; title: string; text: string }[];
}[] = [
  {
    icon: "📄", name: "Angebote", color: "var(--c-accent)",
    steps: [
      { emoji: "🖱️", title: "Dashboard öffnen", text: "Klicke auf 'Angebote' im Dashboard, um das Modul zu öffnen." },
      { emoji: "✍️", title: "Angebot erstellen", text: "Wähle 'Neues Angebot erstellen' und fülle Kundenname und Leistungen aus." },
      { emoji: "👁️", title: "Vorschau prüfen", text: "Klicke auf 'Vorschau', um das fertige PDF zu prüfen und anzupassen." },
      { emoji: "📧", title: "Versenden", text: "Sende das Angebot direkt per E-Mail an deinen Kunden." },
    ],
  },
  {
    icon: "⏰", name: "Mahnungen", color: "#d4a017",
    steps: [
      { emoji: "🔍", title: "Rechnung wählen", text: "Öffne 'Mahnungen' und wähle eine offene Rechnung aus der Liste." },
      { emoji: "⚖️", title: "Mahnstufe festlegen", text: "Wähle die passende Mahnstufe — 1., 2. oder 3. Mahnung." },
      { emoji: "📝", title: "Text prüfen", text: "Prüfe den automatisch generierten, rechtssicheren Mahntext." },
      { emoji: "📤", title: "Versenden", text: "Versende die Mahnung per E-Mail oder auf dem Postweg." },
    ],
  },
  {
    icon: "🤝", name: "Onboarding", color: "#1e7a6b",
    steps: [
      { emoji: "🗂️", title: "Template anlegen", text: "Erstelle ein neues Template unter 'Onboarding → Templates'." },
      { emoji: "➕", title: "Schritte hinzufügen", text: "Füge Schritte hinzu: Checkliste, Video, Quiz oder Dokument." },
      { emoji: "👤", title: "Mitarbeiter zuweisen", text: "Weise das Template einem neuen Mitarbeiter zu." },
      { emoji: "📊", title: "Fortschritt verfolgen", text: "Verfolge den Fortschritt bequem unter 'Einarbeitungen'." },
    ],
  },
  {
    icon: "⭐", name: "Bewertungen", color: "var(--c-accent)",
    steps: [
      { emoji: "📨", title: "Anfrage starten", text: "Gehe zu 'Bewertungen' und klicke auf 'Anfrage senden'." },
      { emoji: "🎯", title: "Kunde & Plattform wählen", text: "Wähle den Kunden und die Plattform (Google, Trustpilot etc.)." },
      { emoji: "📩", title: "E-Mail geht raus", text: "Der Kunde erhält eine E-Mail mit dem direkten Bewertungslink." },
      { emoji: "✅", title: "Bewertungen ansehen", text: "Neue Bewertungen erscheinen automatisch in deiner Übersicht." },
    ],
  },
  {
    icon: "🔒", name: "Compliance", color: "#1e7a6b",
    steps: [
      { emoji: "🏭", title: "Branche wählen", text: "Öffne 'Compliance' und wähle deine Branche aus." },
      { emoji: "📋", title: "Vorschriften prüfen", text: "Sieh alle relevanten gesetzlichen Vorschriften auf einen Blick." },
      { emoji: "☑️", title: "Abhaken", text: "Hake erledigte Pflichten ab und behalte den Überblick." },
      { emoji: "🔔", title: "Fristen setzen", text: "Setze Erinnerungen für wiederkehrende Fristen." },
    ],
  },
  {
    icon: "📅", name: "Dienstplan", color: "var(--c-accent)",
    steps: [
      { emoji: "📆", title: "Woche auswählen", text: "Gehe zu 'Dienstplan' und wähle die gewünschte Kalenderwoche." },
      { emoji: "🖱️", title: "Schichten einteilen", text: "Ziehe Mitarbeiter per Drag & Drop in die gewünschten Schichten." },
      { emoji: "🔄", title: "Tauschbörse", text: "Mitarbeiter können Schichten selbständig über die Tauschbörse tauschen." },
      { emoji: "📤", title: "Exportieren", text: "Exportiere den fertigen Dienstplan für dein gesamtes Team." },
    ],
  },
];

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
  const router = useRouter();
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [greeting, setGreeting] = useState("Hallo");
  const [displayName, setDisplayName] = useState("Philipp");
  const [displayAvatar, setDisplayAvatar] = useState<string | null>(null);
  const [chatUnread, setChatUnread] = useState(0);
  const [userPlan, setUserPlan] = useState<Plan | null>(null);
  const [statsProgress, setStatsProgress] = useState(0);
  const [lockedModal, setLockedModal] = useState<{ name: string; minPlan: string } | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [anleitungOpen, setAnleitungOpen] = useState(false);
  const [anleitungTool, setAnleitungTool] = useState<number | null>(null);
  const [anleitungStep, setAnleitungStep] = useState(0);
  const [anleitungDir, setAnleitungDir] = useState<"fwd" | "bwd">("fwd");
  const [anleitungKey, setAnleitungKey] = useState(0);
  const [supportName, setSupportName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportMsg, setSupportMsg] = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);

  const accountRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  // Animation refs
  const heroLine1Ref = useRef<HTMLSpanElement>(null);
  const heroLine2Ref = useRef<HTMLSpanElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const heroBtnRef = useRef<HTMLButtonElement>(null);
  const statsDesktopRefs = useRef<(HTMLDivElement | null)[]>([null, null, null, null]);
  const statsBarRef = useRef<HTMLDivElement>(null);
  const tileRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const aboutRef = useRef<HTMLDivElement>(null);
  const testimonialRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGreeting(getGreeting());

    // Load profile from localStorage
    try {
      const raw = localStorage.getItem("claaro-profil");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.username) setDisplayName(p.username);
        if (p.avatarUrl) setDisplayAvatar(p.avatarUrl);
      }
    } catch {/* ignore */}

    // Load unread count
    const stored = parseInt(localStorage.getItem("claaro-chat-unread") ?? "0", 10);
    if (stored > 0) setChatUnread(stored);

    // Load plan from Supabase
    if (HAUPTACCOUNT_ID && supabaseConfigured) {
      const supabase = getBrowserClient();
      supabase
        ?.from("company_settings")
        .select("abo_plan")
        .eq("hauptaccount_id", HAUPTACCOUNT_ID)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          if (data?.abo_plan) setUserPlan(data.abo_plan as Plan);
        });
    }

    function onProfilUpdate(e: Event) {
      const d = (e as CustomEvent).detail;
      if (d.username) setDisplayName(d.username);
      setDisplayAvatar(d.avatarUrl ?? null);
    }
    function onChatUnread(e: Event) {
      setChatUnread((e as CustomEvent).detail.count ?? 0);
    }
    window.addEventListener("claaro:profil-updated", onProfilUpdate);
    window.addEventListener("claaro:chat-unread", onChatUnread);
    return () => {
      window.removeEventListener("claaro:profil-updated", onProfilUpdate);
      window.removeEventListener("claaro:chat-unread", onChatUnread);
    };
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

    // Stats count-up animation
    if (statsBarRef.current) {
      const barEl = statsBarRef.current;
      const countObs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          countObs.disconnect();
          const t0 = performance.now();
          function tick(now: number) {
            const raw = Math.min((now - t0) / 1000, 1);
            setStatsProgress(1 - Math.pow(1 - raw, 3));
            if (raw < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        },
        { threshold: 0.5 }
      );
      countObs.observe(barEl);
      observers.push(countObs);
    }

    // Feature tiles: 80ms stagger
    watchGroup(tileRefs.current, tiles.map((_, i) => i * 80));

    // "Was ist claaro?" section: fade as one block
    watchGroup([aboutRef.current], [0]);

    // Testimonial: slide in from left
    if (testimonialRef.current) {
      const el = testimonialRef.current;
      el.style.opacity = "0";
      el.style.transform = "translateX(-40px)";
      el.style.transition = `opacity ${DURATION}ms ${easing}, transform ${DURATION}ms ${easing}`;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          el.style.opacity = "1";
          el.style.transform = "translateX(0)";
          setTimeout(() => {
            el.style.transition = "";
            el.style.opacity = "";
            el.style.transform = "";
          }, DURATION + 50);
          obs.disconnect();
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (supportMsg.trim().length < 10) { setSupportError("Nachricht zu kurz."); return; }
    setSupportError(null);
    setSupportLoading(true);
    try {
      await emailjs.send(
        "service_8b5ibjd", "template_emiu248",
        { email: supportEmail, nachricht: `[Support] ${supportName}: ${supportMsg}`, kategorie: "Support", sterne: "" },
        "EfcnQ7wc4gnfWtpt5"
      );
      setSupportSuccess(true);
      setTimeout(() => { setSupportOpen(false); setSupportSuccess(false); setSupportName(""); setSupportEmail(""); setSupportMsg(""); }, 2500);
    } catch (err) {
      setSupportError(err instanceof Error ? err.message : "Fehler beim Senden.");
    } finally {
      setSupportLoading(false);
    }
  }

  function selectAnleitungTool(idx: number) {
    setAnleitungTool(idx); setAnleitungStep(0); setAnleitungDir("fwd"); setAnleitungKey((k) => k + 1);
  }
  function anleitungNext() {
    const steps = anleitungTools[anleitungTool!].steps;
    if (anleitungStep < steps.length - 1) {
      setAnleitungDir("fwd"); setAnleitungKey((k) => k + 1); setAnleitungStep((s) => s + 1);
    } else {
      setAnleitungOpen(false); setAnleitungTool(null); setAnleitungStep(0);
    }
  }
  function anleitungPrev() {
    if (anleitungStep > 0) {
      setAnleitungDir("bwd"); setAnleitungKey((k) => k + 1); setAnleitungStep((s) => s - 1);
    } else {
      setAnleitungTool(null); setAnleitungStep(0);
    }
  }

  function scrollToFeatures() {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleLogout() {
    const supabase = getBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function openFeatures() {
    setFeaturesOpen(true);
  }

  function closeFeatures() {
    setFeaturesOpen(false);
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-[#1a1814] flex flex-col" style={sans}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .claaro-tile {
            transition-duration: 220ms;
            transition-timing-function: ease-out;
            overflow: hidden;
          }
          .claaro-tile:hover {
            transform: translateY(-4px);
          }
          .claaro-tile::after {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 55%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent);
            transform: skewX(-15deg);
            pointer-events: none;
          }
          .claaro-tile:hover::after {
            animation: tileShimmer 0.65s ease forwards;
          }
          @keyframes tileShimmer {
            to { left: 160%; }
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
          @keyframes slideInFwd {
            from { opacity: 0; transform: translateX(36px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          @keyframes slideInBwd {
            from { opacity: 0; transform: translateX(-36px); }
            to   { opacity: 1; transform: translateX(0); }
          }
          .anleitung-fwd { animation: slideInFwd 260ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
          .anleitung-bwd { animation: slideInBwd 260ms cubic-bezier(0.25,0.46,0.45,0.94) both; }
          @keyframes heroGradDrift {
            0%   { opacity: 0.6; transform: scale(1)    translate(0%,  0%); }
            40%  { opacity: 1;   transform: scale(1.14) translate(2%, -1%); }
            70%  { opacity: 0.7; transform: scale(1.08) translate(-1%, 2%); }
            100% { opacity: 0.6; transform: scale(1)    translate(0%,  0%); }
          }
          .claaro-hero-glow {
            animation: heroGradDrift 10s ease-in-out infinite;
          }
        }
      `}</style>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="border-b border-white/10 z-30 bg-[#1a1814]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <span
            className="text-xl font-bold text-[var(--c-accent)] tracking-tight flex-none"
            style={sans}
          >
            Claaro
          </span>

          <p className="flex-1 text-center text-sm text-white/50 truncate hidden sm:block">
            {greeting},{" "}
            <span className="text-white font-medium">{displayName}</span>
          </p>

          <Link
            href="/dashboard/einstellungen"
            className="flex-none text-white/50 hover:text-white/80 transition-colors border border-white/10 rounded-lg p-2 hover:bg-white/5"
            aria-label="Einstellungen"
            title="Einstellungen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M8 10a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M13.3 7a5.7 5.7 0 00-.1-.9l1.3-1-1.3-2.2-1.5.6a5.5 5.5 0 00-1.5-.9L10 2H6l-.2 1.6a5.5 5.5 0 00-1.5.9L2.8 4 1.5 6.1l1.3 1A5.7 5.7 0 002.7 8a5.7 5.7 0 00.1.9l-1.3 1 1.3 2.2 1.5-.6c.5.4 1 .7 1.5.9L6 14h4l.2-1.6c.5-.2 1-.5 1.5-.9l1.5.6 1.3-2.2-1.3-1c.1-.3.1-.6.1-.9z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </Link>

          <div className="flex-none relative" ref={accountRef}>
            <button
              onClick={() => setAccountOpen((o) => !o)}
              className="relative flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors border border-white/10 rounded-lg px-3.5 py-2 hover:bg-white/5"
            >
              {/* Avatar */}
              {displayAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[var(--c-accent)]/20 flex items-center justify-center text-xs text-[var(--c-accent)] font-bold">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">Mein Konto</span>
              {/* Unread badge */}
              {chatUnread > 0 && (
                <div className="relative group cursor-help">
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--c-accent)" }}>
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                  <div className="absolute top-full right-0 mt-1 bg-[#2a2420] border border-white/10 rounded-lg px-3 py-2 text-xs text-white/80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {chatUnread} ungelesene Benachrichtigung{chatUnread !== 1 ? "en" : ""}
                  </div>
                </div>
              )}
              <svg
                className={`w-3 h-3 text-white/30 transition-transform duration-150 ${accountOpen ? "rotate-180" : ""}`}
                viewBox="0 0 12 12"
                fill="none"
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/5 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur">
                {accountLinks.map(({ label, href, danger }) =>
                  href ? (
                    <Link
                      key={label}
                      href={href}
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors hover:bg-white/5"
                    >
                      {label === "Benachrichtigungen" && chatUnread > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: "var(--c-accent)" }}>
                          {chatUnread}
                        </span>
                      )}
                      {label}
                    </Link>
                  ) : (
                    <button
                      key={label}
                      onClick={() => { setAccountOpen(false); if (danger) handleLogout(); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                        danger ? "text-[var(--c-accent)] border-t border-white/10 mt-1 pt-3" : "text-white/70 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </header>


      {/* ── Begrüßung ──────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <h1 className="text-3xl text-white" style={serif}>
          {greeting}, {displayName} 👋
        </h1>
        <p className="text-white/50 mt-1 text-sm">Hier ist deine Übersicht für heute.</p>
      </div>

      {/* ── Feature tiles ──────────────────────────────────────────────────── */}
      <section id="features" className="max-w-6xl mx-auto px-4 pt-4 pb-10 sm:px-6 sm:pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(({ id, icon, name, description }, i) => {
            const accessible = canAccess(userPlan, id);
            const minPlan = PLAN_NAMES[requiredPlan(id)];

            if (accessible) {
              return (
                <Link
                  key={id}
                  href={`/dashboard/${id}`}
                  ref={(el) => { tileRefs.current[i] = el; }}
                  className="claaro-tile c-card relative text-left rounded-xl border p-6 transition-all bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                >
                  <span className="claaro-tile-icon inline-block text-2xl mb-3">{icon}</span>
                  <h3 className="font-semibold text-sm mb-1.5 text-white">{name}</h3>
                  <p className="text-xs leading-relaxed text-white/50">{description}</p>
                </Link>
              );
            }

            return (
              <button
                key={id}
                ref={(el) => { tileRefs.current[i] = el as unknown as HTMLAnchorElement; }}
                onClick={() => setLockedModal({ name, minPlan })}
                className="claaro-tile relative text-left rounded-xl border p-6 transition-all bg-white/[0.02] border-white/[0.06] hover:bg-white/5 hover:border-white/10 w-full"
              >
                <svg
                  className="absolute top-3 right-3 w-3.5 h-3.5 text-white/25"
                  fill="none" viewBox="0 0 16 16"
                >
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="claaro-tile-icon inline-block text-2xl mb-3 opacity-30">{icon}</span>
                <h3 className="font-semibold text-sm mb-1.5 text-white/30">{name}</h3>
                <p className="text-xs leading-relaxed text-white/20">{description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Testimonial ────────────────────────────────────────────────────── */}
      <div className="bg-white/5 border-y border-white/10 py-10 sm:py-16">
        <div
          ref={testimonialRef}
          className="max-w-2xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center gap-4 sm:gap-6"
        >
          <span
            className="text-5xl sm:text-6xl text-[var(--c-accent)] leading-none select-none"
            style={serif}
            aria-hidden="true"
          >
            „
          </span>
          <p
            className="text-base sm:text-xl lg:text-2xl text-white leading-relaxed -mt-2 sm:-mt-4"
            style={serif}
          >
            Seit claaro läuft der Papierkram von selbst. Wir haben endlich Zeit
            fürs Wesentliche.
          </p>
          <div className="flex flex-col items-center gap-3" style={sans}>
            <div className="w-10 h-10 rounded-full bg-[var(--c-accent)] flex items-center justify-center text-white text-sm font-bold">
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
            <a href="/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              Impressum
            </a>
            <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">
              Datenschutz
            </a>
            <span>Version 0.1</span>
          </div>
        </div>
      </footer>

      <PendingTasksWidget userPlan={userPlan} displayAvatar={displayAvatar} />

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
                onClick={() => { setHelpOpen(false); if (item === "Kurzanleitung") setAnleitungOpen(true); else setSupportOpen(true); }}
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
          className="claaro-help-pulse w-11 h-11 rounded-full bg-[var(--c-accent)] text-white flex items-center justify-center shadow-lg hover:bg-[#b03f25] transition-colors text-base font-bold"
        >
          ?
        </button>
      </div>

      {/* ── Locked-Feature Modal ───────────────────────────────────────────── */}
      {lockedModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setLockedModal(null)}
        >
          <div
            className="relative w-full max-w-sm bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl p-8 text-center"
            style={sans}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 16 16">
                <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2" style={serif}>
              {lockedModal.name} nicht verfügbar
            </h3>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Für dieses Feature benötigst du mindestens den{" "}
              <span className="text-white font-medium">{lockedModal.minPlan}-Plan</span>.
            </p>
            <Link
              href="/dashboard/konto"
              onClick={() => setLockedModal(null)}
              className="block w-full text-sm py-2.5 rounded-xl font-medium text-white mb-3 transition-colors"
              style={{ backgroundColor: "var(--c-accent)" }}
            >
              Plan upgraden →
            </Link>
            <button
              onClick={() => setLockedModal(null)}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* ── Kurzanleitung Modal ────────────────────────────────────────────── */}
      {anleitungOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => { setAnleitungOpen(false); setAnleitungTool(null); setAnleitungStep(0); }}>
          <div className="relative w-full max-w-lg bg-[#1a1814] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {anleitungTool !== null && (
                  <button onClick={anleitungPrev}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
                <h2 className="text-base font-semibold text-white" style={serif}>
                  {anleitungTool === null ? "Kurzanleitung" : anleitungTools[anleitungTool].name}
                </h2>
              </div>
              <button onClick={() => { setAnleitungOpen(false); setAnleitungTool(null); setAnleitungStep(0); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Overview: tool grid */}
            {anleitungTool === null && (
              <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {anleitungTools.map(({ icon, name, color }, idx) => (
                  <button key={name} onClick={() => selectAnleitungTool(idx)}
                    className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-white/10 bg-white/4 hover:bg-white/8 hover:border-white/20 transition-all group">
                    <span className="text-3xl group-hover:scale-110 transition-transform duration-200">{icon}</span>
                    <span className="text-xs font-medium text-white/70 group-hover:text-white transition-colors">{name}</span>
                    <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color, opacity: 0.5 }} />
                  </button>
                ))}
              </div>
            )}

            {/* Step view */}
            {anleitungTool !== null && (() => {
              const tool = anleitungTools[anleitungTool];
              const step = tool.steps[anleitungStep];
              const total = tool.steps.length;
              const isLast = anleitungStep === total - 1;
              return (
                <>
                  {/* Progress dots */}
                  <div className="flex items-center justify-center gap-2 pt-5 pb-1">
                    {tool.steps.map((_, i) => (
                      <div key={i} className="rounded-full transition-all duration-300"
                        style={{
                          width: i === anleitungStep ? 20 : 6,
                          height: 6,
                          backgroundColor: i === anleitungStep ? tool.color : "rgba(255,255,255,0.15)",
                        }} />
                    ))}
                  </div>
                  <p className="text-center text-xs text-white/30 mt-1 mb-0">
                    Schritt {anleitungStep + 1} von {total}
                  </p>

                  {/* Illustration */}
                  <div key={anleitungKey}
                    className={anleitungDir === "fwd" ? "anleitung-fwd" : "anleitung-bwd"}
                    style={{ padding: "32px 32px 24px" }}>
                    <div className="flex flex-col items-center text-center gap-6">
                      {/* Icon circle */}
                      <div className="w-28 h-28 rounded-full flex items-center justify-center"
                        style={{ background: `radial-gradient(circle, ${tool.color}22 0%, ${tool.color}08 70%)`, border: `1.5px solid ${tool.color}30` }}>
                        <span className="text-5xl">{step.emoji}</span>
                      </div>
                      {/* Text */}
                      <div className="space-y-2 max-w-xs">
                        <p className="text-base font-semibold text-white" style={serif}>{step.title}</p>
                        <p className="text-sm text-white/55 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center gap-3 px-6 pb-6">
                    <button onClick={anleitungPrev}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-white/50 hover:text-white hover:border-white/20 transition-all">
                      {anleitungStep === 0 ? "← Übersicht" : "← Zurück"}
                    </button>
                    <button onClick={anleitungNext}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all"
                      style={{ backgroundColor: tool.color }}>
                      {isLast ? "Fertig ✓" : "Weiter →"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Support Modal ───────────────────────────────────────────────────── */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setSupportOpen(false)}>
          <div className="relative w-full max-w-md bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-lg text-white" style={serif}>Support kontaktieren</h2>
                <p className="text-xs text-white/40 mt-0.5">Direkt an das Claaro-Team</p>
              </div>
              <button onClick={() => setSupportOpen(false)}
                className="text-white/30 hover:text-white transition-colors p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              {supportSuccess ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
                    style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.2)" }}>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "var(--c-teal)" }}>
                      <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">Nachricht gesendet!</p>
                  <p className="text-white/50 text-sm">Wir melden uns so schnell wie möglich.</p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-white/40 mb-1">Name *</label>
                      <input required className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                        value={supportName} onChange={(e) => setSupportName(e.target.value)} placeholder="Dein Name"/>
                    </div>
                    <div>
                      <label className="block text-xs text-white/40 mb-1">E-Mail *</label>
                      <input required type="email" className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                        value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="deine@email.de"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1">Nachricht *</label>
                    <textarea required rows={4} className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                      value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Wie können wir dir helfen?"/>
                  </div>
                  {supportError && (
                    <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">{supportError}</p>
                  )}
                  <button type="submit" disabled={supportLoading || supportMsg.trim().length < 10}
                    className="w-full text-sm py-2.5 rounded-lg font-medium text-white transition-colors disabled:opacity-40"
                    style={{ backgroundColor: "var(--c-accent)" }}>
                    {supportLoading ? "Wird gesendet…" : "Nachricht senden"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Features Modal ─────────────────────────────────────────────────── */}
      {featuresOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={closeFeatures}
        >
          <div
            className="relative w-full max-w-3xl bg-[#1a1814] border border-white/10 rounded-2xl p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl text-white" style={serif}>
                Was kann claaro?
              </h2>
              <button
                onClick={closeFeatures}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Schließen"
              >
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {tiles.map(({ id, icon, name, description }) => (
                <Link
                  key={id}
                  href={`/dashboard/${id}`}
                  onClick={closeFeatures}
                  className="claaro-tile flex flex-col gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/[0.08] hover:border-white/20 p-5 transition-all text-left"
                >
                  <span className="claaro-tile-icon text-2xl">{icon}</span>
                  <div>
                    <p className="text-white text-sm font-semibold mb-1">{name}</p>
                    <p className="text-white/50 text-xs leading-relaxed">{description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
