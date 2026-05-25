/**
 * Claaro – Trial-Gate Middleware
 *
 * Prüft bei jedem /dashboard/*-Request (außer /dashboard/konto):
 *   1. Hat der Account ein bezahltes Abo? (company_settings.abo_seit gesetzt)
 *      → Ja: Request durchlassen
 *   2. Ist der 30-Tage-Testzeitraum noch aktiv?
 *      → Ja: Request durchlassen
 *      → Nein: Redirect auf /dashboard/konto?tab=abo
 *
 * Demo-Modus / fehlende Env-Variablen → immer durchlassen.
 */

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

const HAUPTACCOUNT_ID =
  process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
const TRIAL_DAYS = 30;

/** Diese Routen bleiben immer zugänglich – auch bei abgelaufenem Trial */
const ALWAYS_ALLOWED = ["/dashboard/konto"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Nur /dashboard/* prüfen ────────────────────────────────────────────────
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  // ── Immer erlaubte Routen ──────────────────────────────────────────────────
  if (ALWAYS_ALLOWED.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // ── Demo-Modus / fehlende Konfiguration → bypass ──────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (
    !HAUPTACCOUNT_ID ||
    HAUPTACCOUNT_ID === "demo" ||
    !supabaseUrl ||
    supabaseUrl.includes("placeholder") ||
    !supabaseKey ||
    supabaseKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder")
  ) {
    return NextResponse.next();
  }

  // ── Supabase-Client mit Cookie-Handling (Session-Refresh) ──────────────────
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        // Cookies in den Request schreiben (damit spätere Middleware lesen kann)
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        // Neue Response mit aktualisierten Cookies aufbauen
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // ── User verifizieren (refresht auch abgelaufene Sessions) ────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Nicht eingeloggt → andere Guards (Auth-Middleware) übernehmen
    return response;
  }

  // ── 1. Bezahltes Abo prüfen (schneller Pfad) ──────────────────────────────
  const { data: settings } = await supabase
    .from("company_settings")
    .select("abo_seit")
    .eq("hauptaccount_id", HAUPTACCOUNT_ID)
    .maybeSingle();

  if (settings?.abo_seit) {
    // Bezahlt → uneingeschränkter Zugang
    return response;
  }

  // ── 2. Trial-Ablauf prüfen ────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at")
    .eq("id", user.id)
    .maybeSingle();

  // Fallback: user.created_at + 30 Tage (falls kein Profil-Eintrag existiert)
  const trialEndsAt = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : new Date(
        new Date(user.created_at).getTime() +
          TRIAL_DAYS * 24 * 60 * 60 * 1000
      );

  if (trialEndsAt < new Date()) {
    // Trial abgelaufen → zur Abo-Auswahl weiterleiten
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard/konto";
    redirectUrl.searchParams.set("tab", "abo");
    // Hash kann serverseitig nicht gesetzt werden → tab-Parameter genügt
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  /**
   * Middleware läuft nur für /dashboard/*-Routen.
   * Statische Dateien (_next, Bilder etc.) werden automatisch ausgeschlossen.
   */
  matcher: ["/dashboard/:path*"],
};
