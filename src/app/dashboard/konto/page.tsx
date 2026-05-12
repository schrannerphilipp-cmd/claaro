"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import FeatureLayout from "../_components/feature-layout";
import ProfilBearbeiten from "@/components/konto/ProfilBearbeiten";
import AboAbrechnung from "@/components/konto/AboAbrechnung";
import FirmenChat from "@/components/konto/FirmenChat";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

type Tab = "profil" | "firmendaten" | "abo" | "benachrichtigungen" | "sicherheit";

const TABS: { id: Tab; label: string }[] = [
  { id: "profil", label: "Profil" },
  { id: "firmendaten", label: "Firmendaten" },
  { id: "abo", label: "Abo & Abrechnung" },
  { id: "benachrichtigungen", label: "Benachrichtigungen" },
  { id: "sicherheit", label: "Passwort & Sicherheit" },
];

function PlaceholderSection({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="py-14 text-center">
      <p className="text-4xl mb-5">{icon}</p>
      <p className="text-white font-medium mb-2">{title}</p>
      <p className="text-white/35 text-sm">Dieser Bereich wird bald verfügbar sein.</p>
    </div>
  );
}

export default function KontoPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  // Restore active tab from URL hash on first render
  useEffect(() => {
    const hash = window.location.hash.replace("#", "") as Tab;
    if (TABS.some((t) => t.id === hash)) setActiveTab(hash);
  }, []);

  // Update hash when tab changes (enables direct linking)
  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    history.replaceState(null, "", `#${tab}`);
  }

  return (
    <FeatureLayout
      name="Mein Konto"
      description="Profil, Abonnement und Teamkommunikation verwalten."
    >
      <div className="space-y-6" style={sans}>
        {/* Tab bar */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-shrink-0 text-sm px-4 py-2 rounded-xl border transition-all duration-150"
              style={
                activeTab === tab.id
                  ? {
                      backgroundColor: "rgba(255,255,255,0.1)",
                      borderColor: "rgba(255,255,255,0.2)",
                      color: "white",
                    }
                  : {
                      backgroundColor: "rgba(255,255,255,0.04)",
                      borderColor: "rgba(255,255,255,0.08)",
                      color: "rgba(255,255,255,0.4)",
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 min-h-[300px]">
          {activeTab === "profil" && <ProfilBearbeiten />}

          {activeTab === "firmendaten" && (
            <div className="space-y-4">
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Firmendaten</p>
              <div className="flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "rgba(200,75,47,0.15)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-accent)" }}>
                    <path d="M2 14V6l6-4 6 4v8H10v-4H6v4H2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white font-medium mb-1">Firmenlogo & Stammdaten</p>
                  <p className="text-xs text-white/45 leading-relaxed mb-3">
                    Logo, Firmenname, Adresse und Kontaktdaten verwalten Sie unter Einstellungen. Die Daten erscheinen automatisch auf Ihren Angeboten.
                  </p>
                  <Link
                    href="/dashboard/einstellungen"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                    style={{
                      backgroundColor: "rgba(200,75,47,0.12)",
                      borderColor: "rgba(200,75,47,0.3)",
                      color: "var(--c-accent)",
                    }}
                  >
                    Zu den Einstellungen
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
                      <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === "abo" && <AboAbrechnung />}

          {activeTab === "benachrichtigungen" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Team-Chat</p>
                <p className="text-xs text-white/25">Echtzeit · nur für Ihr Team</p>
              </div>
              <FirmenChat />
            </div>
          )}

          {activeTab === "sicherheit" && (
            <PlaceholderSection title="Passwort & Sicherheit" icon="🔐" />
          )}
        </div>
      </div>
    </FeatureLayout>
  );
}
