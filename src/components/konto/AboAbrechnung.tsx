"use client";

import { useState, useEffect, useRef } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";
import { useTrial } from "@/hooks/useTrial";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

type Plan = "starter" | "profi" | "team";
type Interval = "monatlich" | "jaehrlich";

interface PlanData {
  name: string;
  subtitle: string;
  monthly: number;
  yearly: number;
  badge?: string;
  features: string[];
  color: string;
}

const PLANS: Record<Plan, PlanData> = {
  starter: {
    name: "Starter",
    subtitle: "Für kleine Teams & Einsteiger",
    monthly: 29,
    yearly: 23,
    features: [
      "Wähle 3 der 6 Module",
      "Bis zu 3 Mitarbeiter",
      "50 Angebote pro Monat",
      "E-Mail-Support",
      "Basis-KI-Funktionen",
      "Datenhaltung in Deutschland",
    ],
    color: "rgba(255,255,255,0.6)",
  },
  profi: {
    name: "Profi",
    subtitle: "Für wachsende Unternehmen",
    monthly: 59,
    yearly: 47,
    badge: "Beliebtester Plan",
    features: [
      "Alle 6 Module inklusive",
      "Bis zu 15 Mitarbeiter",
      "Unbegrenzte Angebote",
      "Volle KI-Unterstützung",
      "Telefon & Chat-Support",
      "Compliance-Vorlagen",
      "API-Zugang",
    ],
    color: "var(--c-accent)",
  },
  team: {
    name: "Team",
    subtitle: "Für große Teams & Filialisten",
    monthly: 99,
    yearly: 79,
    features: [
      "Alles aus Profi",
      "Unbegrenzte Mitarbeiterzahl",
      "Mehrere Standorte",
      "Dedizierter Account Manager",
      "Custom Branding",
      "Prioritäts-Support (2h SLA)",
      "Persönliche Onboarding-Session",
      "99,9 % Uptime-Garantie",
    ],
    color: "var(--c-teal)",
  },
};

const UPGRADE_TARGET: Record<Plan, Plan | null> = {
  starter: "profi",
  profi: "team",
  team: null,
};

const ADD_ONS = [
  { name: "Zusatz-Standort", detail: "19 €/Monat ab Profi" },
  { name: "Einzel-Onboarding", detail: "149 € einmalig" },
];

const SHARED_STYLES = `
  @keyframes aboCardIn {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes aboPriceIn {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes aboBadgePop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.3); }
    70%  { transform: scale(0.92); }
    100% { transform: scale(1); }
  }
  .abo-badge-pulse { animation: aboBadgePop 500ms cubic-bezier(0.34,1.56,0.64,1) both; }
  .abo-price-in    { animation: aboPriceIn 220ms ease both; }
  @keyframes aboSpin {
    to { transform: rotate(360deg); }
  }
  .abo-spin { animation: aboSpin 700ms linear infinite; }
  @keyframes aboCircleDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes aboCheckDraw {
    to { stroke-dashoffset: 0; }
  }
  @keyframes aboFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes aboModalIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes aboModalUp {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }
`;

const CONFETTI_COLORS = ["#c84b2f", "#1e7a6b", "#ffffff", "#f5c842"];

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Size canvas to match its rendered CSS size (the modal card)
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: -Math.random() * 60,
      w: Math.random() * 9 + 5,
      h: Math.random() * 5 + 3,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 2.5 + 1.5,
      rot: Math.random() * Math.PI * 2,
      rotV: (Math.random() - 0.5) * 0.18,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }));

    const start = Date.now();
    let raf = 0;

    function draw() {
      const elapsed = Date.now() - start;
      if (elapsed > 3200) {
        ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
        return;
      }
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
      const alpha = elapsed > 2400 ? 1 - (elapsed - 2400) / 800 : 1;

      for (const p of particles) {
        p.vy += 0.07;
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotV;
        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.fillStyle = p.color;
        ctx!.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx!.restore();
      }
      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-teal)" }}>
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Ersetzt mailto-Links — kopiert E-Mail-Adresse in die Zwischenablage */
function CopyEmailButton() {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    try { navigator.clipboard.writeText("upgrade@claaro.de"); } catch {/* ignore */}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs shrink-0 transition-colors"
      style={copied
        ? { backgroundColor: "rgba(var(--c-teal-rgb),0.15)", color: "var(--c-teal)", border: "1px solid rgba(var(--c-teal-rgb),0.25)" }
        : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {copied ? (
        "✓ Kopiert"
      ) : (
        <>
          <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 12 12">
            <rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 3V2a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          upgrade@claaro.de
        </>
      )}
    </button>
  );
}

const PLAN_ORDER: Plan[] = ["starter", "profi", "team"];

interface Props {
  showSuccess?: boolean;
  onSuccessDismissed?: () => void;
}

export default function AboAbrechnung({ showSuccess: showSuccessProp = false, onSuccessDismissed }: Props) {
  const trial = useTrial();
  const [plan, setPlan] = useState<Plan>("starter");
  const [hasPlan, setHasPlan] = useState<boolean | null>(null);
  const [interval, setInterval] = useState<Interval>("monatlich");
  const [aboSeit, setAboSeit] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | undefined>(undefined);
  const [hoveredCard, setHoveredCard] = useState<Plan | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<Plan | null>(null);
  const [pressedBtn, setPressedBtn] = useState<Plan | null>(null);
  const [priceVersion, setPriceVersion] = useState(0);
  const [badgePulse, setBadgePulse] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(showSuccessProp);

  useEffect(() => {
    if (supabaseConfigured) {
      const supabase = getBrowserClient()!;
      supabase.auth.getUser().then(({ data }) => {
        if (data.user?.email) setCustomerEmail(data.user.email);
      });
    }

    if (!HAUPTACCOUNT_ID || !supabaseConfigured) {
      setHasPlan(false);
      return;
    }

    let retries = 0;
    const maxRetries = 5;

    function loadPlan() {
      const supabase = getBrowserClient()!;
      supabase
        .from("company_settings")
        .select("abo_plan, abo_zahlungsintervall, abo_seit")
        .eq("hauptaccount_id", HAUPTACCOUNT_ID)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          // abo_seit = Stripe hat die Zahlung bestätigt (konsistent mit useTrial).
          // abo_plan allein reicht nicht – es kann auf 'starter' defaulten ohne Zahlung.
          const hasActivePlan = !!data?.abo_seit;
          if (hasActivePlan) {
            const p = (data.abo_plan ?? "starter") as Plan;
            setPlan(p);
            setHasPlan(true);
            if (data.abo_zahlungsintervall) setInterval(data.abo_zahlungsintervall as Interval);
            setAboSeit(data.abo_seit);
            // useTrial-Hook (im Layout) über Abo-Aktivierung informieren →
            // Banner verschwindet sofort, kein Seiten-Reload nötig
            window.dispatchEvent(new CustomEvent("claaro:abo-updated"));
          } else if (showSuccessProp && retries < maxRetries) {
            retries++;
            setTimeout(loadPlan, 2000);
          } else {
            setHasPlan(false);
          }
        });
    }

    // After a Stripe redirect give the webhook ~1.5s head-start before first check
    setTimeout(loadPlan, showSuccessProp ? 1500 : 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleInterval() {
    const next: Interval = interval === "monatlich" ? "jaehrlich" : "monatlich";
    setInterval(next);
    setPriceVersion((v) => v + 1);
    if (next === "jaehrlich") {
      setBadgePulse(true);
      setTimeout(() => setBadgePulse(false), 600);
    }
  }

  async function handleCheckout(targetPlan: Plan) {
    setLoadingPlan(targetPlan);
    setCheckoutError(null);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: targetPlan, interval, customerEmail, hauptaccountId: HAUPTACCOUNT_ID }),
      });
      const { url, error } = await res.json();
      if (error || !url) throw new Error(error ?? "Kein Checkout-Link erhalten");
      window.location.href = url;
    } catch {
      setLoadingPlan(null);
      setCheckoutError("Checkout konnte nicht gestartet werden. Bitte versuche es erneut.");
    }
  }

  const intervalToggle = (
    <div className="flex items-center gap-3">
      <span className="text-sm text-white/50" style={{ minWidth: "4rem" }}>Monatlich</span>
      <button
        onClick={toggleInterval}
        role="switch"
        aria-checked={interval === "jaehrlich"}
        aria-label="Jährliche Abrechnung (20% Rabatt)"
        className="relative w-10 h-5 rounded-full transition-colors overflow-hidden flex-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        style={{ backgroundColor: interval === "jaehrlich" ? "var(--c-teal)" : "rgba(255,255,255,0.2)" }}
      >
        <span
          className="absolute top-0.5 left-0 w-4 h-4 rounded-full bg-white transition-transform"
          style={{ transform: interval === "jaehrlich" ? "translateX(20px)" : "translateX(2px)" }}
        />
      </button>
      <span className="text-sm text-white/50">
        Jährlich
        <span
          className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-medium inline-block${badgePulse ? " abo-badge-pulse" : ""}`}
          style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.2)", color: "var(--c-teal)" }}
        >
          20% sparen
        </span>
      </span>
    </div>
  );

  function dismissModal() {
    setShowSuccessModal(false);
    onSuccessDismissed?.();
  }


  // Success modal overlay
  const successModal = showSuccessModal ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backdropFilter: "blur(12px)",
        backgroundColor: "rgba(15,13,10,0.85)",
        animation: "aboModalIn 300ms ease both",
      }}
      onClick={dismissModal}
    >
      <div
        className="relative overflow-hidden bg-white/6 border border-white/12 rounded-3xl p-10 flex flex-col items-center text-center w-full max-w-sm"
        style={{ animation: "aboModalUp 300ms cubic-bezier(0.34,1.56,0.64,1) both" }}
        onClick={(e) => e.stopPropagation()}
      >
        <Confetti active={showSuccessModal} />
        {/* Content sits above the confetti canvas */}
        <div className="relative flex flex-col items-center" style={{ zIndex: 2 }}>
          {/* Animated checkmark SVG */}
          <svg viewBox="0 0 100 100" className="w-28 h-28 mb-6" aria-hidden>
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="var(--c-teal)"
              strokeWidth="3.5"
              strokeLinecap="round"
              pathLength="1"
              style={{
                strokeDasharray: "1",
                strokeDashoffset: "1",
                animation: "aboCircleDraw 600ms cubic-bezier(0.65,0,0.35,1) forwards",
              }}
            />
            <path
              d="M27 51 L42 66 L73 33"
              fill="none"
              stroke="var(--c-teal)"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              style={{
                strokeDasharray: "1",
                strokeDashoffset: "1",
                animation: "aboCheckDraw 400ms cubic-bezier(0.65,0,0.35,1) 600ms forwards",
              }}
            />
          </svg>

          {/* Text + button — fade in after checkmark */}
          <div style={{ animation: "aboFadeUp 400ms ease 850ms both" }}>
            <p className="text-[28px] text-white mb-2 leading-tight" style={serif}>
              Zahlung erfolgreich!
            </p>
            {hasPlan ? (
              <p className="text-white/55 text-sm mb-8">
                Willkommen im{" "}
                <span className="text-white font-semibold">{PLANS[plan].name}</span>
                {" "}Plan!
              </p>
            ) : (
              <p className="text-white/55 text-sm mb-8">Ihr Plan wird aktiviert …</p>
            )}
            <button
              onClick={dismissModal}
              className="px-8 py-2.5 rounded-xl text-sm font-semibold"
              style={{
                backgroundColor: "var(--c-accent)",
                color: "white",
                transition: "opacity 150ms ease, transform 100ms ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Loslegen →
            </button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  // Loading state
  if (hasPlan === null) {
    return (
      <>
        <style>{SHARED_STYLES}</style>
        {successModal}
        <div className="h-40 flex items-center justify-center text-white/50 text-sm" style={sans}>
          Laden …
        </div>
      </>
    );
  }

  // No active plan → show all 3 plans for selection
  if (!hasPlan) {
    // Trial-Status-Info für den Nutzer
    const trialInfoBanner = (() => {
      if (trial.status === "loading" || trial.status === "paid") return null;
      if (trial.status === "expired") {
        return (
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(var(--c-accent-rgb),0.1)",
              border: "1px solid rgba(var(--c-accent-rgb),0.2)",
            }}
          >
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-accent)" }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--c-accent)" }}>
                Dein Testzeitraum ist abgelaufen
              </p>
              <p className="text-xs text-white/55 mt-0.5">
                Wähle einen Plan um weiterhin auf alle Funktionen zuzugreifen.{" "}
                Die meisten Unternehmen starten mit{" "}
                <span style={{ color: "var(--c-accent)" }}>Profi</span>.
              </p>
            </div>
          </div>
        );
      }
      const urgent = trial.status === "expiring";
      return (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{
            backgroundColor: urgent ? "rgba(245,158,11,0.1)" : "rgba(var(--c-teal-rgb),0.08)",
            border: urgent ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(var(--c-teal-rgb),0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 16 16" style={{ color: urgent ? "rgb(245,158,11)" : "var(--c-teal)" }}>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 5v3L10 9.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <p className="text-sm" style={{ color: urgent ? "rgb(245,158,11)" : "var(--c-teal)" }}>
              <span className="font-medium">Testzeitraum aktiv</span>
              {" "}— noch{" "}
              <span className="font-medium">{trial.daysLeft} {trial.daysLeft === 1 ? "Tag" : "Tage"}</span>
              {trial.trialEndsAt && (
                <span className="text-white/45 ml-1 text-xs">
                  (bis {trial.trialEndsAt.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })})
                </span>
              )}
            </p>
          </div>
        </div>
      );
    })();

    return (
      <>
        <style>{SHARED_STYLES}</style>
        {successModal}
        <div className="space-y-8" style={sans}>
          <div className="space-y-3">
            {trialInfoBanner}
            <p className="text-white/50 text-sm">Wählen Sie einen Plan um loszulegen.</p>
            {intervalToggle}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLAN_ORDER.map((key, i) => {
              const p = PLANS[key];
              const price = interval === "jaehrlich" ? p.yearly : p.monthly;
              const isProfi = key === "profi";
              const isLoading = loadingPlan === key;
              const isCardHovered = hoveredCard === key;
              const isBtnHovered = hoveredBtn === key;
              const isBtnPressed = pressedBtn === key;

              const cardBorder = isProfi
                ? (isCardHovered ? "rgba(var(--c-accent-rgb),0.6)" : "rgba(var(--c-accent-rgb),0.35)")
                : (isCardHovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.12)");
              const cardShadow = isProfi
                ? (isCardHovered ? "0 8px 40px rgba(var(--c-accent-rgb),0.3)" : "0 0 30px rgba(var(--c-accent-rgb),0.15)")
                : (isCardHovered ? "0 8px 40px rgba(255,255,255,0.08)" : "none");

              return (
                <div
                  key={key}
                  onMouseEnter={() => setHoveredCard(key)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="rounded-2xl flex flex-col p-4 sm:p-7"
                  style={{
                    border: `1px solid ${cardBorder}`,
                    backgroundColor: isProfi ? "rgba(var(--c-accent-rgb),0.07)" : "rgba(255,255,255,0.06)",
                    boxShadow: cardShadow,
                    transform: isCardHovered ? "scale(1.03)" : "scale(1)",
                    transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                    animation: `aboCardIn 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 100}ms both`,
                    willChange: "transform",
                  }}
                >
                  {/* Header */}
                  <div className="mb-6">
                    {p.badge && (
                      <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-medium mb-3"
                        style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.18)", color: "var(--c-accent)" }}>
                        {p.badge}
                      </span>
                    )}
                    <h3 className="text-xl sm:text-2xl text-white mb-0.5" style={serif}>{p.name}</h3>
                    <p className="text-xs text-white/45 mb-3">{p.subtitle}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span
                        key={`${key}-${priceVersion}`}
                        className="abo-price-in text-3xl sm:text-4xl font-bold text-white"
                        style={serif}
                      >
                        {price} €
                      </span>
                      <span className="text-sm text-white/55">/ Monat zzgl. MwSt.</span>
                    </div>
                    {interval === "jaehrlich" && (
                      <p className="text-xs text-white/50 mt-1">jährlich abgerechnet</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 flex-1 mb-7">
                    {p.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5">
                        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-teal)" }}>
                          <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <span className="text-sm text-white/60 leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleCheckout(key)}
                    disabled={!!loadingPlan}
                    onMouseEnter={() => setHoveredBtn(key)}
                    onMouseLeave={() => { setHoveredBtn(null); setPressedBtn(null); }}
                    onMouseDown={() => setPressedBtn(key)}
                    onMouseUp={() => setPressedBtn(null)}
                    className="w-full text-sm py-3 rounded-xl font-semibold"
                    style={{
                      backgroundColor: isProfi ? "var(--c-accent)" : "rgba(255,255,255,0.92)",
                      color: isProfi ? "white" : "#241c14",
                      opacity: loadingPlan && !isLoading ? 0.4 : 1,
                      transform: isBtnPressed ? "translateY(0)" : isBtnHovered ? "translateY(-2px)" : "translateY(0)",
                      boxShadow: isBtnHovered && !isBtnPressed
                        ? (isProfi ? "0 4px 16px rgba(var(--c-accent-rgb),0.45)" : "0 4px 16px rgba(0,0,0,0.35)")
                        : "none",
                      transition: "transform 150ms ease, box-shadow 150ms ease, opacity 200ms ease",
                    }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="abo-spin w-4 h-4 flex-none" fill="none" viewBox="0 0 16 16">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"
                            strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round"/>
                        </svg>
                        Weiterleitung …
                      </span>
                    ) : "Plan wählen"}
                  </button>
                </div>
              );
            })}
          </div>

          {checkoutError && (
            <p className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
              {checkoutError}
            </p>
          )}

          {/* Add-ons */}
          <div>
            <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Add-ons</p>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
              <div>
                <p className="text-white text-sm font-medium">Zusatz-Standort</p>
                <p className="text-white/50 text-xs">19 €/Monat — ab Profi-Plan</p>
              </div>
              <CopyEmailButton />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
              <div>
                <p className="text-white text-sm font-medium">Einzel-Onboarding</p>
                <p className="text-white/50 text-xs">149 € einmalig — persönliche Einführung</p>
              </div>
              <CopyEmailButton />
            </div>
          </div>
        </div>
      </>
    );
  }

  // Active plan → show all 3 plans
  const currentIdx = PLAN_ORDER.indexOf(plan);

  return (
    <>
      <style>{SHARED_STYLES}</style>
      {successModal}
      <div className="space-y-8" style={sans}>
        {intervalToggle}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLAN_ORDER.map((key, i) => {
            const p = PLANS[key];
            const price = interval === "jaehrlich" ? p.yearly : p.monthly;
            const isActive = key === plan;
            const isBelow = i < currentIdx;
            const isAbove = i > currentIdx;
            const isLoading = loadingPlan === key;

            return (
              <div
                key={key}
                className="rounded-2xl flex flex-col p-4 sm:p-7"
                style={{
                  border: isActive
                    ? "1px solid rgba(var(--c-teal-rgb),0.4)"
                    : "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: isActive ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)",
                  animation: `aboCardIn 500ms cubic-bezier(0.34,1.56,0.64,1) ${i * 100}ms both`,
                }}
              >
                {/* Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-2 min-h-[1.5rem]">
                    {isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.25)", color: "var(--c-teal)" }}>
                        Aktiv
                      </span>
                    )}
                    {p.badge && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.18)", color: "var(--c-accent)" }}>
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl text-white mb-0.5" style={serif}>{p.name}</h3>
                  <p className="text-xs text-white/45 mb-3">{p.subtitle}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span key={`${key}-${priceVersion}`} className="abo-price-in text-3xl sm:text-4xl font-bold text-white" style={serif}>
                      {price} €
                    </span>
                    <span className="text-sm text-white/55">/ Monat</span>
                  </div>
                  {interval === "jaehrlich" && (
                    <p className="text-xs text-white/50 mt-1">jährlich abgerechnet</p>
                  )}
                  {isActive && aboSeit && (
                    <p className="text-xs text-white/50 mt-1">
                      Aktiv seit {new Date(aboSeit).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-2.5 flex-1 mb-7">
                  {p.features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <CheckIcon />
                      <span className="text-sm text-white/60 leading-snug">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {isActive ? null : isBelow ? (
                  <p className="text-sm text-white/50 text-center py-1">Nicht verfügbar</p>
                ) : isAbove ? (
                  <button
                    onClick={() => handleCheckout(key)}
                    disabled={!!loadingPlan}
                    className="w-full text-sm py-2.5 rounded-xl font-medium transition-opacity"
                    style={{ backgroundColor: "var(--c-accent)", color: "white", opacity: loadingPlan ? 0.6 : 1 }}
                  >
                    {isLoading ? "Weiterleitung …" : `Upgrade → ${p.name}`}
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {checkoutError && (
          <p className="text-sm px-4 py-3 rounded-xl" style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.12)", color: "var(--c-accent)" }}>
            {checkoutError}
          </p>
        )}

        {/* Add-ons */}
        <div>
          <p className="text-xs text-white/50 uppercase tracking-widest mb-3">Add-ons</p>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
            <div>
              <p className="text-white text-sm font-medium">Zusatz-Standort</p>
              <p className="text-white/50 text-xs">19 €/Monat — ab Profi-Plan</p>
            </div>
            <CopyEmailButton />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 mt-2">
            <div>
              <p className="text-white text-sm font-medium">Einzel-Onboarding</p>
              <p className="text-white/50 text-xs">149 € einmalig — persönliche Einführung</p>
            </div>
            <CopyEmailButton />
          </div>
        </div>
      </div>
    </>
  );
}
