import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient as ssrBrowserClient } from "@supabase/ssr";

const url      = process.env.NEXT_PUBLIC_SUPABASE_URL      ?? "";
const anonKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY   ?? "";

export const supabaseConfigured =
  url.length > 0 &&
  !url.includes("placeholder") &&
  anonKey.length > 0 &&
  !anonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder");

// Browser-Client mit Cookie-Persistenz (für Auth in Next.js)
let browserInstance: SupabaseClient | null = null;
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!browserInstance) {
    browserInstance = ssrBrowserClient(url, anonKey) as unknown as SupabaseClient;
  }
  return browserInstance;
}

// Server-Client (API-Routes, Server Components)
export function createServerClient(): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
