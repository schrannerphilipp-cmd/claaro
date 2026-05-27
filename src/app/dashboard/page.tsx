"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import {
  canAccess,
  requiredPlan,
  PLAN_NAMES,
  STARTER_MODULES_LS_KEY,
  STARTER_ONBOARDING_DONE_KEY,
  type Plan,
  type ModuleId,
} from "@/lib/plan-gate";
import StarterOnboardingModal from "@/components/dashboard/StarterOnboardingModal";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";
import PendingTasksWidget from "@/components/dashboard/PendingTasksWidget";
import dynamic from "next/dynamic";
import { useTrial } from "@/hooks/useTrial";
import { useDevView } from "@/hooks/useDevView";
import LandingPage from "@/components/landing/LandingPage";

// DEV-Toggle wird nur client-seitig gerendert (ssr: false) – keine Hydration-Konflikte
const DevToggleButton = dynamic(() => import("@/components/dashboard/DevToggleButton"), { ssr: false });

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)" } as const;

// ─── tiles ───────────────────────────────────────────────────────────────────

const tiles: { id: ModuleId; icon: string; name: string; description: string }[] = [
  { id: "angebote",    icon: "📄", name: "Angebote",    description: "Professionelle Angebote schnell erstellen & versenden" },
  { id: "mahnungen",  icon: "⏰", name: "Mahnungen",   description: "Zahlungserinnerungen automatisch & rechtssicher" },
  { id: "onboarding", icon: "🤝", name: "Onboarding",  description: "Neue Kunden & Mitarbeiter strukturiert einführen" },
  { id: "bewertungen",icon: "⭐", name: "Bewertungen", description: "Kundenbewertungen einholen & verwalten" },
  { id: "compliance", icon: "🔒", name: "Compliance",  description: "Vorschriften & Pflichten einfach im Blick behalten" },
  { id: "dienstplan", icon: "📅", name: "Dienstplan",  description: "Schichten planen & Team koordinieren" },
];

// ─── setup steps (Fortschrittsbalken) ────────────────────────────────────────

const SETUP_STEPS: { label: string; shortLabel: string; href: string }[] = [
  { label: "Firmendaten hinterlegt",  shortLabel: "Firmendaten",    href: "/dashboard/einstellungen" },
  { label: "Erstes Angebot erstellt", shortLabel: "Erstes Angebot", href: "/dashboard/angebote" },
  { label: "Erste Mahnung gesendet",  shortLabel: "Erste Mahnung",  href: "/dashboard/mahnungen" },
  { label: "Profilbild hinzugefügt",  shortLabel: "Profilbild",     href: "/dashboard/konto" },
  { label: "Team eingeladen",         shortLabel: "Team einladen",  href: "/dashboard/dienstplan/mitarbeiter" },
];

// ─── account menu ────────────────────────────────────────────────────────────

const accountLinks: { label: string; href?: string; danger?: boolean }[] = [
  { label: "Profil bearbeiten",     href: "/dashboard/konto#profil" },
  { label: "Firmendaten",           href: "/dashboard/einstellungen" },
  { label: "Abo & Abrechnung",      href: "/dashboard/konto#abo" },
  { label: "Benachrichtigungen",    href: "/dashboard/konto#benachrichtigungen" },
  { label: "Passwort & Sicherheit", href: "/dashboard/konto#sicherheit" },
  { label: "Abmelden", danger: true },
];

// ─── testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Seit claaro läuft der Papierkram von selbst. Wir haben endlich Zeit fürs Wesentliche.",
    name: "Markus B.",
    role: "Inhaber, Elektrobetrieb München",
    initials: "MB",
    color: "var(--c-accent)",
  },
  {
    quote: "Die Compliance-Checklisten haben uns schon mehrfach vor vergessenen Fristen bewahrt.",
    name: "Sandra M.",
    role: "Inhaberin, Pflegedienst Mitte",
    initials: "SM",
    color: "#2a7a6a",
  },
  {
    quote: "Das Onboarding neuer Mitarbeiter dauert jetzt halb so lang. Strukturiert und stressfrei.",
    name: "Thomas K.",
    role: "Geschäftsführer, Handwerk & Service GmbH",
    initials: "TK",
    color: "#7a5a2a",
  },
];

const TESTIMONIAL_AVATARS = [
  { initials: "MB", color: "var(--c-accent)" },
  { initials: "SM", color: "#2a7a6a" },
  { initials: "TK", color: "#7a5a2a" },
];

// ─── plans overview (State A only) ───────────────────────────────────────────

const PLAN_OVERVIEW: {
  key: Plan; name: string; priceMonthly: number; priceYearly: number;
  features: string[]; badge?: string; color: string;
}[] = [
  {
    key: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceYearly: 23,
    features: ["3 Module deiner Wahl", "Bis zu 3 Mitarbeiter", "E-Mail-Support"],
    color: "rgba(255,255,255,0.55)",
  },
  {
    key: "profi",
    name: "Profi",
    priceMonthly: 59,
    priceYearly: 47,
    badge: "Beliebtester Plan",
    features: ["Alle 6 Module inklusive", "Bis zu 15 Mitarbeiter", "Compliance-Vorlagen & Fristen-Alerts"],
    color: "var(--c-accent)",
  },
  {
    key: "team",
    name: "Team",
    priceMonthly: 99,
    priceYearly: 79,
    features: ["Alles aus Profi", "Unbegrenzte Mitarbeiter", "Mehrere Standorte"],
    color: "var(--c-teal)",
  },
];

// ─── what's new (State B only) ────────────────────────────────────────────────

const WHATS_NEW = [
  {
    icon: "📋",
    title: "Neue Mahnvorlagen für Handwerk & Pflege",
    date: "Mai 2026",
    description: "Drei neue, rechtssichere Mahnvorlagen für Handwerks- und Pflegebetriebe — angepasst an die gängigen Zahlungsfristen der jeweiligen Branche.",
  },
  {
    icon: "🔒",
    title: "Compliance: Handwerk & Gastronomie erweitert",
    date: "April 2026",
    description: "Neue Pflichten und Fristen für Handwerk und Gastronomie wurden hinzugefügt, inklusive Erinnerungsfunktion.",
  },
];

// ─── help & guide ─────────────────────────────────────────────────────────────

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

// ─── helpers ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void,
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

// ─── small sub-components ─────────────────────────────────────────────────────

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

// ─── main component ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();

  // ── trial & dev state ───────────────────────────────────────────────────────
  const { status: realStatus, daysLeft } = useTrial();
  const { devView } = useDevView();

  // Dev override takes priority over real status.
  // "expiring" is trial ≤ 5 days – dev "trial" simulates the "trial" branch.
  const effectiveStatus = devView ?? realStatus;

  const isTrialState   = effectiveStatus === "trial" || effectiveStatus === "expiring";
  const isPaidState    = effectiveStatus === "paid";
  const isExpiredState = effectiveStatus === "expired";
  const isLandingState = effectiveStatus === "landing";

  // ── ui state ────────────────────────────────────────────────────────────────
  const [accountOpen,    setAccountOpen]    = useState(false);
  const [helpOpen,       setHelpOpen]       = useState(false);
  const [featuresOpen,   setFeaturesOpen]   = useState(false);
  const [greeting,       setGreeting]       = useState("Hallo");
  const [displayName,    setDisplayName]    = useState("Philipp");
  const [displayAvatar,  setDisplayAvatar]  = useState<string | null>(null);
  const [chatUnread,     setChatUnread]     = useState(0);
  const [userPlan,       setUserPlan]       = useState<Plan | null>(null);
  const [starterModules,    setStarterModules]    = useState<ModuleId[]>([]);
  const [showStarterModal,  setShowStarterModal]  = useState(false);
  const [lockedModal,    setLockedModal]    = useState<{ name: string; minPlan: string; isStarterChoice?: boolean } | null>(null);
  const [infoTile,       setInfoTile]       = useState<typeof tiles[0] | null>(null);
  const [supportOpen,    setSupportOpen]    = useState(false);
  const [anleitungOpen,  setAnleitungOpen]  = useState(false);
  const [anleitungTool,  setAnleitungTool]  = useState<number | null>(null);
  const [anleitungStep,  setAnleitungStep]  = useState(0);
  const [anleitungDir,   setAnleitungDir]   = useState<"fwd" | "bwd">("fwd");
  const [anleitungKey,   setAnleitungKey]   = useState(0);
  const [supportName,    setSupportName]    = useState("");
  const [supportEmail,   setSupportEmail]   = useState("");
  const [supportMsg,     setSupportMsg]     = useState("");
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportSuccess, setSupportSuccess] = useState(false);
  const [supportError,   setSupportError]   = useState<string | null>(null);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [plansYearly,          setPlansYearly]          = useState(true);
  const [setupSteps,           setSetupSteps]           = useState<boolean[]>([false, false, false, false, false]);
  const [achievementOpen,      setAchievementOpen]      = useState(false);
  const [lastFeature,          setLastFeature]          = useState<string | null>(null);

  const accountRef    = useRef<HTMLDivElement>(null);
  const helpRef       = useRef<HTMLDivElement>(null);
  const tileRefs      = useRef<(HTMLAnchorElement | null)[]>([]);
  const testimonialRef = useRef<HTMLDivElement>(null);

  // ── init ────────────────────────────────────────────────────────────────────
  useEffect(() => {
    setGreeting(getGreeting());

    let avatarDone = false;
    try {
      const raw = localStorage.getItem("claaro-profil");
      if (raw) {
        const p = JSON.parse(raw);
        if (p.username) setDisplayName(p.username);
        if (p.avatarUrl) { setDisplayAvatar(p.avatarUrl); avatarDone = true; }
      }
    } catch {/* ignore */}

    // ── Starter-Module aus localStorage laden ─────────────────────────────
    try {
      const raw = localStorage.getItem(STARTER_MODULES_LS_KEY);
      if (raw) {
        const mods = JSON.parse(raw) as ModuleId[];
        if (Array.isArray(mods) && mods.length > 0) setStarterModules(mods);
      }
    } catch {/* ignore */}

    const stored = parseInt(localStorage.getItem("claaro-chat-unread") ?? "0", 10);
    if (stored > 0) setChatUnread(stored);

    const lf = localStorage.getItem("claaro-last-feature");
    if (lf) setLastFeature(lf);

    // ── Setup-Schritte ────────────────────────────────────────────────────────
    try {
      const angebot  = localStorage.getItem("claaro-setup-angebot") === "1";
      const mahnung  = localStorage.getItem("claaro-setup-mahnung") === "1";
      const teamDone = localStorage.getItem("claaro-setup-team")    === "1";
      const steps: boolean[] = [false, angebot, mahnung, avatarDone, teamDone];
      setSetupSteps(steps);
      const STEP_LABELS = ["Firmendaten hinterlegt", "Erstes Angebot erstellt", "Erste Mahnung gesendet", "Profilbild hinzugefügt", "Team eingeladen"];
      const celebrated: number[] = JSON.parse(localStorage.getItem("claaro-setup-celebrated") ?? "[]");
      const newlyDone = steps.map((done, i) => (done && !celebrated.includes(i) ? i : -1)).filter((i) => i >= 0);
      if (newlyDone.length > 0) {
        localStorage.setItem("claaro-setup-celebrated", JSON.stringify([...celebrated, ...newlyDone]));
        newlyDone.forEach((stepIdx, delay) => {
          setTimeout(() => triggerZeitersparnisToast(STEP_LABELS[stepIdx], 5), delay * 900);
        });
      }
    } catch {/* ignore */}

    if (supabaseConfigured) {
      const supabase = getBrowserClient();
      if (supabase) {
        // Load plan + firmenname from company_settings
        if (HAUPTACCOUNT_ID) {
          supabase
            .from("company_settings")
            .select("abo_plan, abo_seit, firmenname")
            .eq("hauptaccount_id", HAUPTACCOUNT_ID)
            .maybeSingle()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(({ data }: { data: any }) => {
              if (data?.abo_plan) {
                setUserPlan(data.abo_plan as Plan);
              } else if (data?.abo_seit) {
                // Abo aktiv (abo_seit gesetzt) aber abo_plan noch nicht in DB →
                // Webhook-Verzögerung oder fehlender Eintrag: "profi" als sicherer Fallback
                setUserPlan("profi");
              }
              if (data?.firmenname) {
                setSetupSteps((prev) => {
                  if (prev[0]) return prev; // already marked
                  const next = [...prev];
                  next[0] = true;
                  try {
                    const celebrated: number[] = JSON.parse(localStorage.getItem("claaro-setup-celebrated") ?? "[]");
                    if (!celebrated.includes(0)) {
                      localStorage.setItem("claaro-setup-celebrated", JSON.stringify([...celebrated, 0]));
                      setTimeout(() => triggerZeitersparnisToast("Firmendaten hinterlegt", 5), 200);
                    }
                  } catch {/* ignore */}
                  return next;
                });
              }
            });
        }

        // Load starter_modules from profiles
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        supabase.auth.getUser().then(({ data }: { data: any }) => {
          if (!data?.user) return;
          supabase
            .from("profiles")
            .select("starter_modules")
            .eq("id", data.user.id)
            .maybeSingle()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(({ data: p }: { data: any }) => {
              if (!p?.starter_modules) return;
              const mods = p.starter_modules as ModuleId[];
              if (Array.isArray(mods) && mods.length > 0) {
                setStarterModules(mods);
                // Keep localStorage in sync
                try { localStorage.setItem(STARTER_MODULES_LS_KEY, JSON.stringify(mods)); } catch {/* ignore */}
              }
            });
        });
      }
    }

    function onProfilUpdate(e: Event) {
      const d = (e as CustomEvent).detail;
      if (d.username) setDisplayName(d.username);
      setDisplayAvatar(d.avatarUrl ?? null);
    }
    function onChatUnread(e: Event) {
      setChatUnread((e as CustomEvent).detail.count ?? 0);
    }
    function onStarterModulesUpdated(e: Event) {
      const mods = (e as CustomEvent).detail?.modules as ModuleId[] | undefined;
      if (Array.isArray(mods) && mods.length > 0) setStarterModules(mods);
    }
    window.addEventListener("claaro:profil-updated", onProfilUpdate);
    window.addEventListener("claaro:chat-unread", onChatUnread);
    window.addEventListener("claaro:starter-modules-updated", onStarterModulesUpdated);
    return () => {
      window.removeEventListener("claaro:profil-updated", onProfilUpdate);
      window.removeEventListener("claaro:chat-unread", onChatUnread);
      window.removeEventListener("claaro:starter-modules-updated", onStarterModulesUpdated);
    };
  }, []);

  useOutsideClick(accountRef, accountOpen, () => setAccountOpen(false));
  useOutsideClick(helpRef, helpOpen, () => setHelpOpen(false));

  // ── scroll animations ────────────────────────────────────────────────────────
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
        { threshold: 0.15 },
      );
      obs.observe(valid[0]);
      observers.push(obs);
    }

    watchGroup(tileRefs.current, tiles.map((_, i) => i * 80));

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
        { threshold: 0.15 },
      );
      obs.observe(el);
      observers.push(obs);
    }

    return () => observers.forEach((obs) => obs.disconnect());
  }, [effectiveStatus]); // re-run when state changes (e.g. dev toggle)

  // ── Achievement: 3+ Module entdeckt ──────────────────────────────────────────
  useEffect(() => {
    if (!isTrialState) return;
    try {
      const visited: string[] = JSON.parse(localStorage.getItem("claaro-modules-visited") ?? "[]");
      if (visited.length >= 3) {
        const shown = localStorage.getItem("claaro-achievement-shown") === "1";
        if (!shown) {
          localStorage.setItem("claaro-achievement-shown", "1");
          setTimeout(() => setAchievementOpen(true), 1200);
        }
      }
    } catch {/* ignore */}
  }, [isTrialState]);

  // ── Starter-Modal: show once when Starter plan + no modules chosen yet ──────
  useEffect(() => {
    if (!isPaidState || userPlan !== "starter") return;
    if (starterModules.length > 0) return; // already chosen
    try {
      if (localStorage.getItem(STARTER_ONBOARDING_DONE_KEY) === "1") return;
    } catch {/* ignore */}
    // Small delay so the dashboard renders first
    const t = setTimeout(() => setShowStarterModal(true), 600);
    return () => clearTimeout(t);
  }, [isPaidState, userPlan, starterModules]);

  // ── handlers ────────────────────────────────────────────────────────────────
  async function handleSupportSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (supportMsg.trim().length < 10) { setSupportError("Nachricht zu kurz."); return; }
    setSupportError(null);
    setSupportLoading(true);
    try {
      await emailjs.send(
        "service_8b5ibjd", "template_emiu248",
        { email: supportEmail, nachricht: `[Support] ${supportName}: ${supportMsg}`, kategorie: "Support", sterne: "" },
        "EfcnQ7wc4gnfWtpt5",
      );
      setSupportSuccess(true);
      setTimeout(() => {
        setSupportOpen(false); setSupportSuccess(false);
        setSupportName(""); setSupportEmail(""); setSupportMsg("");
      }, 2500);
    } catch (err) {
      setSupportError(err instanceof Error ? err.message : "Fehler beim Senden.");
    } finally {
      setSupportLoading(false);
    }
  }

  const trackModuleVisit = useCallback((id: string) => {
    try {
      // Save last used feature for personalized greeting
      const tile = tiles.find((t) => t.id === id);
      if (tile) {
        localStorage.setItem("claaro-last-feature", tile.name);
        setLastFeature(tile.name);
      }

      // Achievement tracking (trial only)
      if (isTrialState) {
        const visited = new Set<string>(JSON.parse(localStorage.getItem("claaro-modules-visited") ?? "[]"));
        visited.add(id);
        localStorage.setItem("claaro-modules-visited", JSON.stringify([...visited]));
        if (visited.size >= 3) {
          const shown = localStorage.getItem("claaro-achievement-shown") === "1";
          if (!shown) {
            localStorage.setItem("claaro-achievement-shown", "1");
            setTimeout(() => setAchievementOpen(true), 400);
          }
        }
      }
    } catch {/* ignore */}
  }, [isTrialState]);

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

  async function handleLogout() {
    const supabase = getBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  // ── rotating testimonial index (changes daily) ────────────────────────────
  const rotatingTestimonialIndex = Math.floor(Date.now() / 86_400_000) % TESTIMONIALS.length;

  // ── show upgrade hint for paying Starter users ───────────────────────────
  const showUpgradeHint = isPaidState && userPlan === "starter";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#241c14] flex flex-col" style={sans}>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .claaro-tile {
            transition-duration: 220ms;
            transition-timing-function: ease-out;
            overflow: hidden;
          }
          .claaro-tile:hover { transform: translateY(-4px); }
          .claaro-tile::after {
            content: '';
            position: absolute; top: 0; left: -100%;
            width: 55%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.055), transparent);
            transform: skewX(-15deg);
            pointer-events: none;
          }
          .claaro-tile:hover::after { animation: tileShimmer 0.65s ease forwards; }
          @keyframes tileShimmer { to { left: 160%; } }
          .claaro-tile-icon { transition: transform 220ms ease-out; }
          .claaro-tile:hover .claaro-tile-icon { transform: scale(1.12); }
          @keyframes claaroPulse {
            0%, 100% { transform: scale(1); }
            50%       { transform: scale(1.08); }
          }
          .claaro-help-pulse { animation: claaroPulse 600ms ease-out 1; }
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
          @keyframes trialPulse {
            0%, 100% { opacity: 1; }
            50%       { opacity: 0.4; }
          }
          .trial-dot { animation: trialPulse 2s ease-in-out infinite; }
        }
      `}</style>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HEADER                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="border-b border-white/10 z-30 bg-[#241c14]">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <span className="text-xl font-bold text-[var(--c-accent)] tracking-tight flex-none" style={sans}>
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
              {displayAvatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={displayAvatar} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[var(--c-accent)]/20 flex items-center justify-center text-xs text-[var(--c-accent)] font-bold">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="hidden sm:inline">Mein Konto</span>
              {chatUnread > 0 && (
                <div className="relative group cursor-help">
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--c-accent)" }}>
                    {chatUnread > 9 ? "9+" : chatUnread}
                  </span>
                </div>
              )}
              <svg className={`w-3 h-3 text-white/50 transition-transform duration-150 ${accountOpen ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {accountOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white/5 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden py-1 backdrop-blur">
                {accountLinks.map(({ label, href, danger }) =>
                  href ? (
                    <Link key={label} href={href} onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 w-full text-left px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors hover:bg-white/5">
                      {label === "Benachrichtigungen" && chatUnread > 0 && (
                        <span className="ml-auto px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: "var(--c-accent)" }}>{chatUnread}</span>
                      )}
                      {label}
                    </Link>
                  ) : (
                    <button key={label}
                      onClick={() => { setAccountOpen(false); if (danger) handleLogout(); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                        danger ? "text-[var(--c-accent)] border-t border-white/10 mt-1 pt-3" : "text-white/70 hover:text-white"
                      }`}>
                      {label}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND A – Trial-Banner                                           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isTrialState && !trialBannerDismissed && (
        <div
          className="border-b"
          style={{
            backgroundColor: effectiveStatus === "expiring"
              ? "rgba(220,100,30,0.10)"
              : "rgba(200,155,40,0.08)",
            borderColor: effectiveStatus === "expiring"
              ? "rgba(220,100,30,0.25)"
              : "rgba(200,155,40,0.18)",
          }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="trial-dot w-1.5 h-1.5 rounded-full flex-none"
                style={{ backgroundColor: effectiveStatus === "expiring" ? "#e06820" : "#c8a030" }}
              />
              <p className="text-xs sm:text-sm min-w-0" style={{ color: effectiveStatus === "expiring" ? "#e09860" : "#c8b060" }}>
                {daysLeft <= 7
                  ? <>Nur noch <strong>{daysLeft} {daysLeft === 1 ? "Tag" : "Tage"}</strong> — deine Daten gehen danach verloren.</>
                  : <>Gespeicherte Daten noch <strong>{daysLeft} Tage</strong> zugänglich – danach nur mit Abo.</>}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-none">
              <Link
                href="/dashboard/konto#abo"
                className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors"
                style={{ backgroundColor: "var(--c-accent)" }}
              >
                {daysLeft <= 7 ? "Jetzt sichern →" : "Abo wählen →"}
              </Link>
              <button
                onClick={() => setTrialBannerDismissed(true)}
                aria-label="Banner schließen"
                className="w-6 h-6 flex items-center justify-center rounded text-white/30 hover:text-white/60 transition-colors"
              >
                <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                  <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* BEGRÜSSUNG (alle Zustände)                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-4">
        <h1 className="text-3xl text-white" style={serif}>
          {greeting}, {displayName} 👋
        </h1>
        <p className="text-white/50 mt-1 text-sm">
          {isPaidState
            ? lastFeature
              ? <>Du hast zuletzt <span className="text-white/70">{lastFeature}</span> genutzt — schön, dass du wieder da bist.</>
              : `Schön, dass du wieder da bist, ${displayName}.`
            : isExpiredState
            ? "Dein Testzeitraum ist abgelaufen — wähle ein Abo um weiterzumachen."
            : "Hier ist deine Übersicht für heute."}
        </p>

        {/* ── Setup-Fortschrittsbalken (Trial UND Bestandskunden) ──────── */}
        {(isTrialState || isPaidState) && (() => {
          const completedCount = setupSteps.filter(Boolean).length;
          if (completedCount === setupSteps.length) return null;
          const pct = Math.round((completedCount / setupSteps.length) * 100);
          return (
            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-white/45">Konto einrichten</span>
                <span className="text-xs text-white/30">{completedCount}/{setupSteps.length} erledigt</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: "var(--c-accent)" }}
                />
              </div>
              {/* Chips: erledigte = plain span; offen = klickbarer Link */}
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {SETUP_STEPS.map(({ shortLabel, href }, i) => {
                  const done = setupSteps[i];
                  const chipStyle = done
                    ? { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.38)", textDecoration: "line-through" as const }
                    : { backgroundColor: "rgba(var(--c-accent-rgb),0.08)", borderColor: "rgba(var(--c-accent-rgb),0.22)", color: "rgba(255,255,255,0.60)", cursor: "pointer" as const };
                  const chipClass = "text-[10px] px-2 py-0.5 rounded-full border transition-colors";
                  if (done) {
                    return (
                      <span key={shortLabel} className={chipClass} style={chipStyle}>
                        ✓ {shortLabel}
                      </span>
                    );
                  }
                  return (
                    <Link
                      key={shortLabel}
                      href={href}
                      className={chipClass + " hover:bg-white/10"}
                      style={chipStyle}
                    >
                      → {shortLabel}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FEATURE TILES (alle Zustände)                                      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="max-w-6xl mx-auto px-4 pt-4 pb-10 sm:px-6 sm:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiles.map(({ id, icon, name, description }, i) => {
            // Trial = vollständige 30-Tage-Testversion → alle 6 Module freigeschaltet
            // (isPaidState && userPlan === null): Plan lädt noch aus DB (Race-Condition
            // zwischen useTrial und dem separaten abo_plan-Query) → nicht sperren
            const accessible =
              effectiveStatus === "loading" ||
              isTrialState ||
              (isPaidState && userPlan === null) ||
              canAccess(userPlan, id, starterModules);
            const reqPlan = requiredPlan(id);
            const minPlan = PLAN_NAMES[reqPlan];
            // Locked because user is on Starter but didn't select this module
            const isStarterChoice = userPlan === "starter" && reqPlan === "starter" && !accessible;

            if (accessible) {
              return (
                <div
                  key={id}
                  ref={(el) => { tileRefs.current[i] = el as unknown as HTMLAnchorElement; }}
                  className="relative group/tile"
                >
                  <Link
                    href={`/dashboard/${id}`}
                    onClick={() => trackModuleVisit(id)}
                    className="claaro-tile c-card block relative text-left rounded-xl border p-6 transition-all bg-white/5 border-white/10 hover:bg-white/[0.08] hover:border-white/20"
                  >
                    <span className="claaro-tile-icon inline-block text-2xl mb-3">{icon}</span>
                    <h3 className="font-semibold text-sm mb-1.5 text-white">{name}</h3>
                    <p className="text-xs leading-relaxed text-white/50">{description}</p>
                  </Link>
                  {/* Per-Tile Info-Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setInfoTile({ id, icon, name, description }); }}
                    className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all z-10 opacity-0 group-hover/tile:opacity-100"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderColor:     "rgba(255,255,255,0.14)",
                      color:           "rgba(255,255,255,0.40)",
                    }}
                    aria-label={`Info zu ${name}`}
                  >
                    ?
                  </button>
                </div>
              );
            }

            return (
              <button
                key={id}
                ref={(el) => { tileRefs.current[i] = el as unknown as HTMLAnchorElement; }}
                onClick={() => setLockedModal({ name, minPlan, isStarterChoice })}
                className="claaro-tile relative text-left rounded-xl border p-6 transition-all bg-white/[0.02] border-white/[0.06] hover:bg-white/5 hover:border-white/10 w-full"
              >
                <svg className="absolute top-3 right-3 w-3.5 h-3.5 text-white/45" fill="none" viewBox="0 0 16 16">
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <span className="claaro-tile-icon inline-block text-2xl mb-3 opacity-30">{icon}</span>
                <h3 className="font-semibold text-sm mb-1.5 text-white/50">{name}</h3>
                <p className="text-xs leading-relaxed text-white/45">{description}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND B – Upgrade-Hinweis (nur Starter-Kunde)                    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showUpgradeHint && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
          <div
            className="flex items-center gap-3 rounded-xl px-5 py-3.5"
            style={{
              backgroundColor: "rgba(var(--c-accent-rgb),0.07)",
              border: "1px solid rgba(var(--c-accent-rgb),0.20)",
            }}
          >
            <span className="text-lg flex-none">🚀</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80">
                Du nutzt <span className="text-white font-medium">{lastFeature ?? "Angebote"}</span> täglich — Profi gibt dir alle 6 Module für{" "}
                <span className="text-white font-medium">30&nbsp;€ mehr</span> pro Monat.
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                Das sind nur 50&nbsp;Cent pro gesparter Arbeitsstunde.
              </p>
            </div>
            <Link
              href="/dashboard/konto#abo"
              className="flex-none text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-colors whitespace-nowrap"
              style={{ backgroundColor: "var(--c-accent)" }}
            >
              Profi entdecken →
            </Link>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND A – Social Proof + 3 Testimonials + Abo-Übersicht          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isTrialState && (
        <>
          {/* Social Proof */}
          <div className="bg-white/5 border-y border-white/10 py-12 sm:py-16">
            <div ref={testimonialRef} className="max-w-5xl mx-auto px-4 sm:px-6">

              {/* Avatar stack + user count */}
              <div className="flex flex-col items-center gap-3 mb-10">
                <div className="flex -space-x-2" aria-hidden="true">
                  {TESTIMONIAL_AVATARS.map(({ initials, color }) => (
                    <div
                      key={initials}
                      className="w-8 h-8 rounded-full border-2 border-[#2a2218] flex items-center justify-center text-xs font-bold text-white select-none"
                      style={{ backgroundColor: color }}
                    >
                      {initials}
                    </div>
                  ))}
                  <div
                    className="w-8 h-8 rounded-full border-2 border-[#2a2218] flex items-center justify-center text-[10px] font-semibold select-none"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}
                  >
                    +147
                  </div>
                </div>
                <p className="text-white/55 text-sm text-center" style={sans}>
                  <span className="text-white font-semibold">Über 150 KMU</span> vertrauen täglich auf Claaro
                </p>
              </div>

              {/* 3 Testimonial Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {TESTIMONIALS.map(({ quote, name, role, initials, color }) => (
                  <figure
                    key={name}
                    className="flex flex-col gap-4 rounded-xl p-6"
                    style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)" }}
                  >
                    <Stars />
                    <blockquote className="text-sm text-white/65 leading-relaxed flex-1" style={serif}>
                      &ldquo;{quote}&rdquo;
                    </blockquote>
                    <figcaption className="flex items-center gap-3 pt-1 border-t border-white/8">
                      <div className="w-8 h-8 rounded-full flex-none flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: color }} aria-hidden="true">
                        {initials}
                      </div>
                      <div>
                        <p className="text-white text-xs font-medium">{name}</p>
                        <p className="text-white/45 text-xs">{role}</p>
                      </div>
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>

          {/* Abo-Pläne Übersicht */}
          <div className="bg-[#1e1810] border-b border-white/8 py-12 sm:py-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-2">
                <h2 className="text-2xl text-white" style={serif}>Weiter nach dem Test?</h2>
                <p className="text-white/45 text-sm mt-2">
                  Wähle den Plan der zu dir passt — 14-Tage Geld-zurück-Garantie auf alle Pläne.
                </p>
              </div>

              {/* Jahres-/Monats-Toggle */}
              <div className="flex items-center justify-center gap-3 mt-5 mb-8">
                <span className={`text-sm transition-colors ${!plansYearly ? "text-white" : "text-white/35"}`}>Monatlich</span>
                <button
                  onClick={() => setPlansYearly((v) => !v)}
                  aria-label="Abrechnungszeitraum wechseln"
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ backgroundColor: plansYearly ? "var(--c-accent)" : "rgba(255,255,255,0.15)" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                    style={{ transform: plansYearly ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <span className={`text-sm transition-colors ${plansYearly ? "text-white" : "text-white/35"}`}>Jährlich</span>
                {plansYearly && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: "rgba(200,155,40,0.18)", color: "#c8b060", border: "1px solid rgba(200,155,40,0.28)" }}
                  >
                    20% sparen
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PLAN_OVERVIEW.map(({ key, name, priceMonthly, priceYearly, features, badge, color }) => {
                  const isHighlighted = key === "profi";
                  return (
                    <div
                      key={key}
                      className="relative rounded-xl p-5 flex flex-col gap-4"
                      style={{
                        backgroundColor: isHighlighted ? "rgba(var(--c-accent-rgb),0.08)" : "rgba(255,255,255,0.04)",
                        border: `1px solid ${isHighlighted ? "rgba(var(--c-accent-rgb),0.35)" : "rgba(255,255,255,0.08)"}`,
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
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          {plansYearly && (
                            <span className="text-sm text-white/30 line-through">{priceMonthly} €</span>
                          )}
                          <span className="text-2xl font-bold text-white">
                            {plansYearly ? priceYearly : priceMonthly} €
                          </span>
                          <span className="text-xs text-white/40">/Monat zzgl. MwSt.</span>
                        </div>
                        {plansYearly && (
                          <p className="text-[10px] text-white/28 mt-0.5">
                            {priceYearly * 12} € / Jahr abgerechnet
                          </p>
                        )}
                      </div>

                      <ul className="space-y-1.5 flex-1">
                        {features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                            <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 12 12" style={{ color }}>
                              <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Link
                        href={`/dashboard/konto?tab=abo`}
                        className="block text-center text-xs py-2 rounded-lg font-medium transition-colors"
                        style={isHighlighted
                          ? { backgroundColor: "var(--c-accent)", color: "white" }
                          : { backgroundColor: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.12)" }
                        }
                      >
                        {isHighlighted ? "Profi starten →" : "Mehr erfahren →"}
                      </Link>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-xs text-white/25 mt-6">
                Keine Kreditkarte · Endet automatisch nach 30 Tagen · Alle Preise zzgl. gesetzl. MwSt.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND B – Rotierendes Testimonial + Was gibt's Neues             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isPaidState && (() => {
        const t = TESTIMONIALS[rotatingTestimonialIndex];
        return (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-8">
            <figure
              className="rounded-xl p-5 flex flex-col gap-3"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Stars />
              <blockquote className="text-sm text-white/60 leading-relaxed" style={serif}>
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="flex items-center gap-3 pt-2 border-t border-white/8">
                <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: t.color }}>{t.initials}</div>
                <div>
                  <p className="text-white text-xs font-medium">{t.name}</p>
                  <p className="text-white/40 text-xs">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          </div>
        );
      })()}

      {isPaidState && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
          <div className="flex items-baseline gap-3 mb-4">
            <h2 className="text-base font-semibold text-white" style={serif}>Was gibt&apos;s Neues</h2>
            <span className="text-xs text-white/35">Claaro wird ständig verbessert</span>
          </div>
          <div className="space-y-3">
            {WHATS_NEW.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <span className="text-xl flex-none mt-0.5">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-1">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border text-white/40 bg-white/5 border-white/10">
                      {item.date}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FOOTER (alle Zustände)                                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between text-sm text-white/55">
          <span>© 2026 claaro</span>
          <div className="flex items-center gap-6">
            <a href="/impressum" className="hover:text-white/80 transition-colors">Impressum</a>
            <a href="/datenschutz" className="hover:text-white/80 transition-colors">Datenschutz</a>
            <a href="/agb" className="hover:text-white/80 transition-colors">AGB</a>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/8 text-white/60 border border-white/10">v0.1</span>
          </div>
        </div>
      </footer>

      <PendingTasksWidget userPlan={userPlan} displayAvatar={displayAvatar} isTrialState={isTrialState} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* HELP WIDGET (bottom-right)                                         */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2" ref={helpRef}>
        {helpOpen && (
          <div className="bg-white/5 border border-white/10 rounded-xl shadow-2xl w-52 overflow-hidden mb-1 backdrop-blur">
            {helpItems.map((item) => (
              <button key={item}
                onClick={() => { setHelpOpen(false); if (item === "Kurzanleitung") setAnleitungOpen(true); else setSupportOpen(true); }}
                className="w-full text-left px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors border-b border-white/10 last:border-b-0">
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* DEV TOGGLE – dynamisch geladen (ssr: false), client-only           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <DevToggleButton />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND C – Expired Overlay                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isExpiredState && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(36,28,20,0.97)", backdropFilter: "blur(12px)" }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{ backgroundColor: "#2a2218", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {/* Header */}
            <div className="px-8 pt-8 pb-5 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "radial-gradient(circle, rgba(200,60,30,0.20) 0%, rgba(200,60,30,0.05) 70%)", border: "1px solid rgba(200,60,30,0.30)" }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "#e06848" }}>
                  <rect x="5" y="11" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl text-white" style={serif}>Dein Test-Monat ist vorbei</h2>
            </div>

            {/* Was du verlässt */}
            <div className="px-8 pb-5">
              <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.42)" }}>Du verlässt gerade:</p>
              <ul className="space-y-2.5">
                {[
                  { icon: "📄", text: "Deine Angebote & Vorlagen" },
                  { icon: "⏰", text: "Alle offenen Mahnungen" },
                  { icon: "🏢", text: "Deine Firmendaten & Einstellungen" },
                ].map(({ icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>
                    <span className="text-base">{icon}</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial */}
            <div className="px-8 pb-5">
              <figure
                className="rounded-xl p-4"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
              >
                <Stars />
                <blockquote className="text-sm leading-relaxed mt-2" style={{ ...serif, color: "rgba(255,255,255,0.55)" }}>
                  &ldquo;Nach meinem Test-Monat war klar: ohne claaro geht&apos;s nicht mehr.&rdquo;
                </blockquote>
                <figcaption className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.30)" }}>
                  — Thomas K., Handwerk &amp; Service GmbH
                </figcaption>
              </figure>
            </div>

            {/* CTA */}
            <div className="px-8 pb-8">
              <Link
                href="/dashboard/konto?tab=abo"
                className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center transition-colors"
                style={{ backgroundColor: "var(--c-accent)" }}
              >
                Daten sichern &amp; Abo wählen →
              </Link>
              <p className="text-center text-xs mt-3" style={{ color: "rgba(255,255,255,0.28)" }}>
                14 Tage Geld-zurück-Garantie · Keine versteckten Kosten
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ZUSTAND D – Nicht eingeloggt / Landingpage Preview (DEV only)      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isLandingState && (
        <div className="fixed inset-0 z-50 overflow-auto">
          <LandingPage />
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ACHIEVEMENT POPUP – 3 Module entdeckt (Duolingo-Prinzip)           */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {achievementOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setAchievementOpen(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl p-6 text-center space-y-3"
            style={{ backgroundColor: "#2a2218", border: "1px solid rgba(255,255,255,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl">🎉</div>
            <div>
              <p className="text-base font-semibold text-white" style={serif}>Du hast 3 Module entdeckt!</p>
              <p className="text-sm leading-relaxed mt-1.5" style={{ color: "rgba(255,255,255,0.52)" }}>
                Die meisten Nutzer sparen ab jetzt bis zu 6 Stunden Papierkram pro Woche.
              </p>
            </div>
            <button
              onClick={() => setAchievementOpen(false)}
              className="text-xs transition-colors"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Weiter →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}

      {/* Feature-Info Overlay (? Klick auf Tile) */}
      {infoTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
          onClick={() => setInfoTile(null)}
        >
          <div
            className="relative w-full max-w-sm bg-[#241c14] border border-white/15 rounded-2xl shadow-2xl p-7 text-center"
            style={sans}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setInfoTile(null)}
              className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            <div className="text-4xl mb-4">{infoTile.icon}</div>
            <h3 className="text-base font-semibold text-white mb-2" style={serif}>{infoTile.name}</h3>
            <p className="text-sm text-white/55 leading-relaxed mb-6">{infoTile.description}</p>

            <div className="flex gap-2">
              <Link
                href={`/dashboard/${infoTile.id}`}
                onClick={() => setInfoTile(null)}
                className="flex-1 text-sm py-2.5 rounded-xl font-medium text-white text-center transition-colors"
                style={{ backgroundColor: "var(--c-accent)" }}
              >
                Modul öffnen →
              </Link>
              <button
                onClick={() => {
                  setInfoTile(null);
                  setAnleitungOpen(true);
                  const idx = anleitungTools.findIndex((t) => t.name === infoTile.name);
                  if (idx >= 0) selectAnleitungTool(idx);
                }}
                className="flex-1 text-sm py-2.5 rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors"
              >
                Kurzanleitung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starter-Onboarding: Modul-Auswahl */}
      {showStarterModal && (
        <StarterOnboardingModal
          initialModules={starterModules.length > 0 ? starterModules : undefined}
          allowDismiss={starterModules.length > 0}
          onConfirm={(mods) => {
            setStarterModules(mods);
            setShowStarterModal(false);
          }}
          onDismiss={() => setShowStarterModal(false)}
        />
      )}

      {/* Locked-Feature Modal */}
      {lockedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setLockedModal(null)}>
          <div className="relative w-full max-w-sm bg-[#241c14] border border-white/15 rounded-2xl shadow-2xl p-8 text-center"
            style={sans} onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-white/55" fill="none" viewBox="0 0 16 16">
                <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-2" style={serif}>
              {lockedModal.name} nicht verfügbar
            </h3>
            {lockedModal.isStarterChoice ? (
              <>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Dieses Modul gehört nicht zu deinen{" "}
                  <span className="text-white font-medium">3 gewählten Features</span>.
                  Passe deine Auswahl an oder upgrade auf Profi für alle 6 Module.
                </p>
                <button
                  onClick={() => { setLockedModal(null); setShowStarterModal(true); }}
                  className="block w-full text-sm py-2.5 rounded-xl font-medium text-white mb-3 transition-colors"
                  style={{ backgroundColor: "var(--c-accent)" }}
                >
                  Module neu wählen →
                </button>
                <Link
                  href="/dashboard/konto?tab=abo"
                  onClick={() => setLockedModal(null)}
                  className="block w-full text-sm py-2 rounded-xl border border-white/15 text-white/60 hover:text-white text-center mb-3 transition-colors"
                >
                  Auf Profi upgraden →
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-white/50 leading-relaxed mb-6">
                  Nur im{" "}
                  <span className="text-white font-medium">{lockedModal.minPlan}-Plan</span>{" "}
                  verfügbar — upgrade um dieses Feature freizuschalten.
                </p>
                <Link
                  href="/dashboard/konto?tab=abo"
                  onClick={() => setLockedModal(null)}
                  className="block w-full text-sm py-2.5 rounded-xl font-medium text-white mb-3 transition-colors text-center"
                  style={{ backgroundColor: "var(--c-accent)" }}
                >
                  Upgrade →
                </Link>
              </>
            )}
            <button onClick={() => setLockedModal(null)} className="text-sm text-white/55 hover:text-white/70 transition-colors">
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Kurzanleitung Modal */}
      {anleitungOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => { setAnleitungOpen(false); setAnleitungTool(null); setAnleitungStep(0); }}>
          <div className="relative w-full max-w-lg bg-[#241c14] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {anleitungTool !== null && (
                  <button onClick={anleitungPrev}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors">
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
                className="w-8 h-8 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/10 transition-colors">
                <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

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

            {anleitungTool !== null && (() => {
              const tool = anleitungTools[anleitungTool];
              const step = tool.steps[anleitungStep];
              const total = tool.steps.length;
              const isLast = anleitungStep === total - 1;
              return (
                <>
                  <div className="flex items-center justify-center gap-2 pt-5 pb-1">
                    {tool.steps.map((_, i) => (
                      <div key={i} className="rounded-full transition-all duration-300"
                        style={{ width: i === anleitungStep ? 20 : 6, height: 6, backgroundColor: i === anleitungStep ? tool.color : "rgba(255,255,255,0.15)" }} />
                    ))}
                  </div>
                  <p className="text-center text-xs text-white/50 mt-1">Schritt {anleitungStep + 1} von {total}</p>
                  <div key={anleitungKey} className={anleitungDir === "fwd" ? "anleitung-fwd" : "anleitung-bwd"}
                    style={{ padding: "32px 32px 24px" }}>
                    <div className="flex flex-col items-center text-center gap-6">
                      <div className="w-28 h-28 rounded-full flex items-center justify-center"
                        style={{ background: `radial-gradient(circle, ${tool.color}22 0%, ${tool.color}08 70%)`, border: `1.5px solid ${tool.color}30` }}>
                        <span className="text-5xl">{step.emoji}</span>
                      </div>
                      <div className="space-y-2 max-w-xs">
                        <p className="text-base font-semibold text-white" style={serif}>{step.title}</p>
                        <p className="text-sm text-white/55 leading-relaxed">{step.text}</p>
                      </div>
                    </div>
                  </div>
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

      {/* Support Modal */}
      {supportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
          onClick={() => setSupportOpen(false)}>
          <div className="relative w-full max-w-md bg-[#241c14] border border-white/15 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h2 className="text-lg text-white" style={serif}>Support kontaktieren</h2>
                <p className="text-xs text-white/55 mt-0.5">Direkt an das Claaro-Team</p>
              </div>
              <button onClick={() => setSupportOpen(false)} className="text-white/50 hover:text-white transition-colors p-1">
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
                      <label className="block text-xs text-white/55 mb-1">Name *</label>
                      <input required className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                        value={supportName} onChange={(e) => setSupportName(e.target.value)} placeholder="Dein Name"/>
                    </div>
                    <div>
                      <label className="block text-xs text-white/55 mb-1">E-Mail *</label>
                      <input required type="email" className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
                        value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="deine@email.de"/>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-white/55 mb-1">Nachricht *</label>
                    <textarea required rows={4} className="w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors resize-none"
                      value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="Wie können wir dir helfen?"/>
                    <p className="text-xs text-white/35 mt-1.5 leading-snug">
                      Je mehr Details du angibst — z.B. Schritt-für-Schritt was passiert ist — desto schneller können wir helfen. Mindestens 10 Zeichen.
                    </p>
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
    </div>
  );
}
