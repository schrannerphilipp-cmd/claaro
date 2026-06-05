"use client";

export interface ConsentState {
  necessary:  true;
  analytics:  boolean;
  marketing:  boolean;
}

const CONSENT_KEY = "claaro-cookie-consent";

export function getConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConsentState;
  } catch {
    return null;
  }
}

export function saveConsent(state: Omit<ConsentState, "necessary">): ConsentState {
  const full: ConsentState = { necessary: true, ...state };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(full));
    window.dispatchEvent(new CustomEvent("claaro:consent-updated", { detail: full }));
  } catch { /* ignore */ }
  return full;
}

export function hasConsented(): boolean {
  return getConsent() !== null;
}
