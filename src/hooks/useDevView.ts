"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * DEV Toggle – wird nur angezeigt wenn NEXT_PUBLIC_DEV_TOGGLE=true in .env.local gesetzt ist.
 * Niemals in Produktion setzen. Ändert nur den lokalen UI-Zustand, schreibt nichts in die DB.
 *
 * 4 Zustände (Cycle: trial → paid → expired → landing → trial → …):
 *   "trial"    → Zustand A: Trial aktiv (Banner, Social Proof, Abo-Pläne)
 *   "paid"     → Zustand B: Bestandskunde mit aktivem Abo (kein Banner, Testimonial, Was gibt's Neues)
 *   "expired"  → Zustand C: Trial abgelaufen, kein Abo (Overlay mit Upgrade-CTA)
 *   "landing"  → Zustand D: Nicht eingeloggt (vollständige Landing-Page als Overlay)
 *
 * null = initialer Zustand vor localStorage-Read (zeigt Echtdaten bis erster Klick).
 */

const IS_DEV_INSTANCE = process.env.NEXT_PUBLIC_DEV_TOGGLE === "true";

const STORAGE_KEY = "claaro-dev-view";

export type DevView = "trial" | "paid" | "expired" | "landing" | null;

const CYCLE: DevView[] = ["trial", "paid", "expired", "landing"];
const VALID: readonly string[] = ["trial", "paid", "expired", "landing"];

const LABELS: Record<NonNullable<DevView>, string> = {
  trial:   "Trial",
  paid:    "Bestandskunde",
  expired: "Abgelaufen",
  landing: "Nicht eingeloggt",
};

function readStored(): DevView {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v && VALID.includes(v) ? (v as DevView) : null;
  } catch {
    return null;
  }
}

export function useDevView(): {
  devView: DevView;
  isDev: boolean;
  cycleDevView: () => void;
  devLabel: string;
} {
  const [devView, setDevView] = useState<DevView>(null);

  useEffect(() => {
    if (!IS_DEV_INSTANCE) return;
    const stored = readStored();
    if (stored) setDevView(stored);

    function onChanged() {
      setDevView(readStored());
    }
    window.addEventListener("claaro:dev-view-changed", onChanged);
    return () => window.removeEventListener("claaro:dev-view-changed", onChanged);
  }, []);

  const cycleDevView = useCallback(() => {
    if (!IS_DEV_INSTANCE) return;
    setDevView((current) => {
      // Wenn noch kein Zustand aktiv (null), beim ersten Klick direkt zu "trial"
      const idx  = current === null ? -1 : CYCLE.indexOf(current);
      const next = CYCLE[(idx + 1) % CYCLE.length];
      try {
        localStorage.setItem(STORAGE_KEY, next!);
      } catch {/* ignore */}
      return next;
    });
    // dispatchEvent außerhalb des Updaters – verhindert "Cannot update a
    // component while rendering a different component".
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("claaro:dev-view-changed"));
    }, 0);
  }, []);

  return {
    devView:   IS_DEV_INSTANCE ? devView : null,
    isDev:     IS_DEV_INSTANCE,
    cycleDevView,
    devLabel:  devView ? LABELS[devView] : "–",
  };
}
