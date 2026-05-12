"use client";

import { useState, useEffect } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

type Plan = "starter" | "profi" | "team";
type Interval = "monatlich" | "jaehrlich";

interface PlanData {
  name: string;
  monthly: number;
  yearly: number;
  badge?: string;
  features: string[];
  color: string;
}

const PLANS: Record<Plan, PlanData> = {
  starter: {
    name: "Starter",
    monthly: 29,
    yearly: 23,
    features: [
      "3 Module nach Wahl",
      "Bis zu 3 Nutzer",
      "50 Angebote/Monat",
      "E-Mail-Support",
      "Basis-KI-Funktionen",
      "Deutsche Datenhaltung",
    ],
    color: "rgba(255,255,255,0.6)",
  },
  profi: {
    name: "Profi",
    monthly: 59,
    yearly: 47,
    badge: "Beliebtester Plan",
    features: [
      "Alle 6 Module",
      "Bis zu 15 Nutzer",
      "Unbegrenzte Angebote",
      "WhatsApp-Integration",
      "Volle KI-Unterstützung",
      "Telefon & Chat-Support",
      "Compliance-Vorlagen",
      "API-Zugang",
    ],
    color: "var(--c-accent)",
  },
  team: {
    name: "Team",
    monthly: 99,
    yearly: 79,
    features: [
      "Alles aus Profi",
      "Unbegrenzte Nutzer",
      "Mehrere Standorte",
      "Dedizierter Account Manager",
      "Custom Branding",
      "Prioritäts-Support (2h)",
      "Onboarding-Session",
      "SLA 99,9 % Uptime",
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
  { name: "WhatsApp-Credits", detail: "0,08 € / Nachricht über 100/Monat" },
  { name: "Zusatz-Standort", detail: "19 €/Monat ab Profi" },
  { name: "Einzel-Onboarding", detail: "149 € einmalig" },
];

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-teal)" }}>
      <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function AboAbrechnung() {
  const [plan, setPlan] = useState<Plan>("starter");
  const [interval, setInterval] = useState<Interval>("monatlich");
  const [aboSeit, setAboSeit] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState(false);

  useEffect(() => {
    if (!HAUPTACCOUNT_ID || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    supabase
      .from("company_settings")
      .select("abo_plan, abo_zahlungsintervall, abo_seit")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data }: { data: any }) => {
        if (!data) return;
        if (data.abo_plan) setPlan(data.abo_plan as Plan);
        if (data.abo_zahlungsintervall) setInterval(data.abo_zahlungsintervall as Interval);
        if (data.abo_seit) setAboSeit(data.abo_seit);
      });
  }, []);

  const current = PLANS[plan];
  const price = interval === "jaehrlich" ? current.yearly : current.monthly;
  const upgradeTarget = UPGRADE_TARGET[plan];
  const upgradePlan = upgradeTarget ? PLANS[upgradeTarget] : null;
  const upgradePrice = upgradePlan
    ? interval === "jaehrlich" ? upgradePlan.yearly : upgradePlan.monthly
    : 0;

  return (
    <div className="space-y-8" style={sans}>
      {/* Interval toggle */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/40">Monatlich</span>
        <button
          onClick={() => setInterval((i) => i === "monatlich" ? "jaehrlich" : "monatlich")}
          className="relative w-10 h-5 rounded-full transition-colors"
          style={{ backgroundColor: interval === "jaehrlich" ? "var(--c-teal)" : "rgba(255,255,255,0.15)" }}
        >
          <span
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
            style={{ transform: interval === "jaehrlich" ? "translateX(22px)" : "translateX(2px)" }}
          />
        </button>
        <span className="text-xs text-white/40">
          Jährlich{" "}
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium"
            style={{ backgroundColor: "rgba(30,122,107,0.2)", color: "var(--c-teal)" }}>
            20% sparen
          </span>
        </span>
      </div>

      {/* Current plan */}
      <div
        className="rounded-2xl border p-6"
        style={{ borderColor: "rgba(30,122,107,0.4)", backgroundColor: "rgba(30,122,107,0.07)" }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}>
                Aktiv
              </span>
              {current.badge && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ backgroundColor: "rgba(200,75,47,0.18)", color: "var(--c-accent)" }}>
                  {current.badge}
                </span>
              )}
            </div>
            <h3 className="text-xl text-white" style={serif}>{current.name}</h3>
            {aboSeit && (
              <p className="text-xs text-white/30 mt-0.5">
                Aktiv seit {new Date(aboSeit).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white" style={serif}>{price} €</p>
            <p className="text-xs text-white/40">/ Monat</p>
            {interval === "jaehrlich" && (
              <p className="text-xs text-white/30 mt-0.5">jährlich abgerechnet</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {current.features.map((f) => (
            <div key={f} className="flex items-start gap-2">
              <CheckIcon />
              <span className="text-sm text-white/60">{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade section */}
      {upgradePlan && upgradeTarget ? (
        <div>
          <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Empfohlenes Upgrade</p>
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "rgba(200,75,47,0.3)", backgroundColor: "rgba(200,75,47,0.06)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                {upgradePlan.badge && (
                  <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1"
                    style={{ backgroundColor: "rgba(200,75,47,0.18)", color: "var(--c-accent)" }}>
                    {upgradePlan.badge}
                  </span>
                )}
                <h3 className="text-xl text-white" style={serif}>{upgradePlan.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white" style={serif}>{upgradePrice} €</p>
                <p className="text-xs text-white/40">/ Monat</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {upgradePlan.features.map((f) => (
                <div key={f} className="flex items-start gap-2">
                  <CheckIcon />
                  <span className="text-sm text-white/60">{f}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setUpgradeModal(true)}
              className="w-full text-sm py-2.5 rounded-xl font-medium transition-colors"
              style={{ backgroundColor: "var(--c-accent)", color: "white" }}
            >
              Jetzt upgraden → {upgradePlan.name}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/4 p-6 text-center">
          <p className="text-2xl mb-3">🏆</p>
          <p className="text-white font-medium mb-1" style={serif}>Sie nutzen unser bestes Paket</p>
          <p className="text-sm text-white/40">Danke, dass Sie uns vertrauen — wir geben unser Bestes für Sie.</p>
        </div>
      )}

      {/* Add-ons */}
      <div>
        <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Add-ons</p>
        <div className="space-y-2">
          {ADD_ONS.map((a) => (
            <div
              key={a.name}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 bg-white/3"
            >
              <span className="text-sm text-white/70">{a.name}</span>
              <span className="text-xs text-white/35">{a.detail}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-white/25 mt-3">
          Add-ons auf Anfrage — kontaktieren Sie uns unter{" "}
          <a href="mailto:upgrade@claaro.de" className="underline hover:text-white/50 transition-colors">
            upgrade@claaro.de
          </a>
        </p>
      </div>

      {/* Upgrade modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={sans}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setUpgradeModal(false)} />
          <div className="relative w-full max-w-sm bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl p-8 text-center">
            <p className="text-3xl mb-4">✉️</p>
            <h3 className="text-lg text-white mb-2" style={serif}>Upgrade anfragen</h3>
            <p className="text-sm text-white/50 leading-relaxed mb-6">
              Schreiben Sie uns eine E-Mail — wir kümmern uns innerhalb von 24 Stunden um Ihren Wechsel zu{" "}
              <span className="text-white">{upgradePlan?.name}</span>.
            </p>
            <a
              href="mailto:upgrade@claaro.de?subject=Upgrade-Anfrage"
              className="block w-full text-sm py-2.5 rounded-xl font-medium text-white mb-3 transition-colors"
              style={{ backgroundColor: "var(--c-accent)" }}
            >
              upgrade@claaro.de
            </a>
            <button
              onClick={() => setUpgradeModal(false)}
              className="text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
