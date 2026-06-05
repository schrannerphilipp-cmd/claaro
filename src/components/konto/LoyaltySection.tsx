"use client";

import { useState } from "react";
import { useLoyalty } from "@/hooks/useLoyalty";

const sans  = { fontFamily: "var(--font-dm-sans)" }  as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://getclaaro.de";

const STATUS_META = {
  standard: {
    label:  "Standard",
    icon:   "🌱",
    color:  "rgba(255,255,255,0.55)",
    glow:   "rgba(255,255,255,0.08)",
  },
  silber: {
    label:  "Silber",
    icon:   "🥈",
    color:  "#C0C0C0",
    glow:   "rgba(192,192,192,0.12)",
  },
  gold: {
    label:  "Gold",
    icon:   "🥇",
    color:  "#FFD700",
    glow:   "rgba(255,215,0,0.12)",
  },
};

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    try { navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors shrink-0"
      style={
        copied
          ? { backgroundColor: "rgba(var(--c-teal-rgb),0.15)", color: "var(--c-teal)", border: "1px solid rgba(var(--c-teal-rgb),0.25)" }
          : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.1)" }
      }
    >
      {copied ? (
        <>
          <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Kopiert!
        </>
      ) : (
        <>
          <svg className="w-3 h-3 flex-none" fill="none" viewBox="0 0 12 12">
            <rect x="1" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M4 3V2a1 1 0 011-1h5a1 1 0 011 1v7a1 1 0 01-1 1H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

export default function LoyaltySection() {
  const { loyalty, loading } = useLoyalty();

  if (loading) {
    return (
      <div className="space-y-4" style={sans}>
        <p className="text-[10px] text-white/50 uppercase tracking-widest">Treue-Programm</p>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="c-skeleton rounded-xl h-16" />)}
        </div>
      </div>
    );
  }

  if (!loyalty) {
    return (
      <div className="space-y-4" style={sans}>
        <p className="text-[10px] text-white/50 uppercase tracking-widest">Treue-Programm</p>
        <p className="text-sm text-white/40">Treue-Daten konnten nicht geladen werden.</p>
      </div>
    );
  }

  const meta         = STATUS_META[loyalty.status];
  const referralUrl  = `${BASE_URL}/login?tab=register&ref=${loyalty.referral_code}`;
  const isStandard   = loyalty.status === "standard";
  const monthsToNext = loyalty.status === "standard" ? loyalty.months_to_silber : loyalty.months_to_gold;
  const nextLabel    = loyalty.status === "standard" ? "Silber" : loyalty.status === "silber" ? "Gold" : null;
  const progressMax  = loyalty.status === "standard" ? 13 : 30;
  const progressCur  = loyalty.status === "standard"
    ? Math.min(loyalty.months_since_creation, 13)
    : Math.min(loyalty.months_since_creation, 30);
  const progressPct  = Math.round((progressCur / progressMax) * 100);

  return (
    <div className="space-y-6" style={sans}>
      <p className="text-[10px] text-white/50 uppercase tracking-widest">Treue-Programm</p>

      {/* Free-month banner */}
      {loyalty.free_month_pending && (
        <div
          className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
          style={{ backgroundColor: "rgba(var(--c-teal-rgb),0.10)", border: "1px solid rgba(var(--c-teal-rgb),0.25)" }}
        >
          <span className="text-lg flex-none">🎁</span>
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--c-teal)" }}>
              Dein nächster Monat ist gratis!
            </p>
            <p className="text-xs text-white/55 mt-0.5 leading-relaxed">
              Dankeschön für deine Empfehlung — der Rabatt wird automatisch bei der nächsten Abrechnung berücksichtigt.
            </p>
          </div>
        </div>
      )}

      {/* Current status */}
      <div
        className="rounded-xl p-5 flex items-center gap-4"
        style={{
          background: `radial-gradient(ellipse at top left, ${meta.glow}, transparent 70%)`,
          border:     `1px solid ${meta.color}30`,
          backgroundColor: "rgba(255,255,255,0.04)",
        }}
      >
        <span className="text-3xl">{meta.icon}</span>
        <div className="flex-1">
          <p className="text-xs text-white/45 uppercase tracking-wider mb-0.5">Dein Status</p>
          <p className="text-xl font-bold" style={{ ...serif, color: meta.color }}>
            {meta.label}
          </p>
          {loyalty.discount_applied && (
            <p className="text-xs mt-0.5" style={{ color: meta.color, opacity: 0.7 }}>
              {loyalty.status === "silber" ? "10%" : "15%"} Treue-Rabatt aktiv
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{loyalty.months_since_creation}</p>
          <p className="text-[10px] text-white/40">Monate dabei</p>
        </div>
      </div>

      {/* Progress to next level */}
      {nextLabel && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/55">
              Fortschritt zu{" "}
              <span style={{ color: STATUS_META[loyalty.status === "standard" ? "silber" : "gold"].color }}>
                {nextLabel}
              </span>
            </p>
            <p className="text-xs text-white/40">
              {monthsToNext === 0
                ? "Status wird beim nächsten Login aktiviert"
                : `Noch ${monthsToNext} ${monthsToNext === 1 ? "Monat" : "Monate"}`}
            </p>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width:           `${progressPct}%`,
                backgroundColor: STATUS_META[loyalty.status === "standard" ? "silber" : "gold"].color,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30">
            <span>{isStandard ? "Start" : "Monat 13"}</span>
            <span>{isStandard ? "Monat 13 → Silber" : "Monat 30 → Gold"}</span>
          </div>
        </div>
      )}

      {loyalty.status === "gold" && (
        <div
          className="px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.2)", color: "#FFD700" }}
        >
          Höchster Status erreicht — dauerhaft 15% Treue-Rabatt aktiv. Vielen Dank!
        </div>
      )}

      {/* Referral section */}
      <div
        className="rounded-xl p-5 space-y-4"
        style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-white">Empfehlungsprogramm</p>
            <p className="text-xs text-white/45 mt-0.5">
              Empfehle Claaro weiter — du bekommst einen Monat gratis für jeden neuen Kunden.
            </p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-2xl font-bold text-white">{loyalty.referral_count}</p>
            <p className="text-[10px] text-white/40">Empfehlung{loyalty.referral_count !== 1 ? "en" : ""}</p>
          </div>
        </div>

        {/* Referral code */}
        <div>
          <p className="text-[10px] text-white/45 uppercase tracking-wider mb-1.5">Dein Referral-Code</p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 font-mono text-base font-bold tracking-widest px-3 py-2 rounded-lg"
              style={{
                backgroundColor: "rgba(var(--c-accent-rgb),0.08)",
                border:          "1px solid rgba(var(--c-accent-rgb),0.2)",
                color:           "var(--c-accent)",
              }}
            >
              {loyalty.referral_code}
            </div>
            <CopyButton text={loyalty.referral_code} label="Code" />
          </div>
        </div>

        {/* Shareable link */}
        <div>
          <p className="text-[10px] text-white/45 uppercase tracking-wider mb-1.5">Empfehlungs-Link</p>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 text-xs text-white/55 px-3 py-2 rounded-lg truncate"
              style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              {referralUrl}
            </div>
            <CopyButton text={referralUrl} label="Link" />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="space-y-2.5">
        <p className="text-xs text-white/40 uppercase tracking-wider">So funktioniert's</p>
        {[
          { icon: "📤", text: "Teile deinen Empfehlungs-Link mit einem Bekannten" },
          { icon: "✅", text: "Dein Kontakt startet seinen kostenlosen 30-Tage-Test" },
          { icon: "🎁", text: "Sobald er ein Abo abschließt, bekommst du einen Monat gratis" },
          { icon: "🥈", text: "Ab Monat 13 dauerhaft 10% Rabatt (Silber), ab Monat 30 dauerhaft 15% (Gold)" },
        ].map(({ icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <span className="text-base flex-none">{icon}</span>
            <p className="text-xs text-white/55 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
