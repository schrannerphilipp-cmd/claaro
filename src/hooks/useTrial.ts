"use client";

import { useState, useEffect, useCallback } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
const TRIAL_DAYS = 30;

/**
 * trial    = aktiver Testzeitraum (> 5 Tage übrig)
 * expiring = Testzeitraum läuft bald ab (≤ 5 Tage)
 * expired  = Testzeitraum abgelaufen, kein Abo
 * paid     = aktives bezahltes Abo
 * loading  = noch nicht geladen
 */
export type TrialStatus = "loading" | "trial" | "expiring" | "expired" | "paid";

export interface TrialState {
  status: TrialStatus;
  daysLeft: number;
  trialEndsAt: Date | null;
}

export function useTrial(): TrialState {
  const [state, setState] = useState<TrialState>({
    status: "loading",
    daysLeft: 0,
    trialEndsAt: null,
  });

  const load = useCallback(async () => {
    // Demo-Modus oder kein Supabase → keine Einschränkungen
    if (!supabaseConfigured || !HAUPTACCOUNT_ID || HAUPTACCOUNT_ID === "demo") {
      setState({ status: "paid", daysLeft: 0, trialEndsAt: null });
      return;
    }

    const supabase = getBrowserClient()!;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({ status: "paid", daysLeft: 0, trialEndsAt: null });
        return;
      }

      // ── Trial-Enddatum IMMER berechnen ────────────────────────────────────
      // Muss vor dem abo_seit-Check passieren, damit daysLeft auch für
      // Bestandskunden korrekt ist (DEV-Toggle zeigt sonst "0 Tage").
      //
      // Primär:  profiles.trial_ends_at (durch handle_new_user-Trigger gesetzt)
      // Fallback: user.created_at + 30 Tage
      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at")
        .eq("id", user.id)
        .maybeSingle();

      let trialEndsAt: Date;
      if (profile?.trial_ends_at) {
        trialEndsAt = new Date(profile.trial_ends_at);
      } else {
        trialEndsAt = new Date(
          new Date(user.created_at).getTime() +
            TRIAL_DAYS * 24 * 60 * 60 * 1000
        );
      }

      const now      = new Date();
      const msLeft   = trialEndsAt.getTime() - now.getTime();
      const daysLeft = Math.max(0, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

      // ── Bezahltes Abo prüfen ──────────────────────────────────────────────
      // abo_seit wird durch den Stripe-Webhook gesetzt → zuverlässiger Indikator.
      // trialEndsAt + daysLeft werden auch für Bestandskunden zurückgegeben,
      // damit der DEV-Toggle "Trial" die korrekte Restlaufzeit anzeigt.
      const { data: settings } = await supabase
        .from("company_settings")
        .select("abo_seit")
        .eq("hauptaccount_id", HAUPTACCOUNT_ID)
        .maybeSingle();

      if (settings?.abo_seit) {
        setState({ status: "paid", daysLeft, trialEndsAt });
        return;
      }

      // ── Trial-Status bestimmen ────────────────────────────────────────────
      let status: TrialStatus;
      if (daysLeft <= 0) {
        status = "expired";
      } else if (daysLeft <= 5) {
        status = "expiring";
      } else {
        status = "trial";
      }

      setState({ status, daysLeft, trialEndsAt });

      // ── E-Mail-Automatisierungen (fire-and-forget) ────────────────────────
      try {
        // Welcome email: send once after first login (flag set during registration)
        if (localStorage.getItem("claaro-send-welcome") === "1") {
          localStorage.removeItem("claaro-send-welcome");
          fetch("/api/email/welcome", { method: "POST" }).catch(() => {});
        }

        // Trial reminder: 3-day specific window (send once in the 3-day window)
        if (status === "expiring") {
          const lastKey = "claaro-trial-reminder-sent";
          const last = parseInt(localStorage.getItem(lastKey) ?? "0", 10);
          if (Date.now() - last > 24 * 60 * 60 * 1000) {
            localStorage.setItem(lastKey, Date.now().toString());
            fetch("/api/email/trial-reminder", { method: "POST" }).catch(() => {});
          }
        }

        // Trial expired: fire once
        if (status === "expired") {
          const expKey = "claaro-trial-expired-sent";
          if (!localStorage.getItem(expKey)) {
            localStorage.setItem(expKey, "1");
            fetch("/api/email/trial-expired", { method: "POST" }).catch(() => {});
          }
        }
      } catch {/* localStorage may be unavailable in private mode */}
    } catch {
      // Bei Fehler → permissiv (lieber offen lassen als User sperren)
      setState({ status: "trial", daysLeft: TRIAL_DAYS, trialEndsAt: null });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();

    // Nach Tab-Fokus neu laden (z.B. wenn User von Stripe-Checkout zurückkommt)
    function onFocus()      { load(); }
    function onAboUpdated() { load(); }

    window.addEventListener("focus",             onFocus);
    window.addEventListener("claaro:abo-updated", onAboUpdated);

    return () => {
      window.removeEventListener("focus",             onFocus);
      window.removeEventListener("claaro:abo-updated", onAboUpdated);
    };
  }, [load]);

  return state;
}
