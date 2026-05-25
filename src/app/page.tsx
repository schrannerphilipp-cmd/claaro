/**
 * Root-Route ("/")
 *
 * – Eingeloggte User  → direkt zu /dashboard weiterleiten
 * – Nicht eingeloggte → vollständige Landingpage anzeigen
 *
 * Server Component: Auth-Check passiert serverseitig (kein Flash)
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default async function RootPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL     ?? "";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  // Konfiguration fehlt (z.B. Demo-Setup) → Landingpage zeigen
  if (!supabaseUrl || supabaseUrl.includes("placeholder") || !supabaseKey) {
    return <LandingPage />;
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Server Components können keine Cookies setzen –
        // Session-Refresh übernimmt die Middleware für /dashboard/*
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <LandingPage />;
}
