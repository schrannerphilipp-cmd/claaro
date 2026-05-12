import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

// True only when real (non-placeholder) credentials are present
export const supabaseConfigured =
  url.length > 0 &&
  !url.includes("placeholder") &&
  anonKey.length > 0 &&
  !anonKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder");

export function createBrowserClient(): SupabaseClient {
  return createClient(url, anonKey);
}

export function createServerClient(): SupabaseClient {
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

let browserInstance: SupabaseClient | null = null;
export function getBrowserClient(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!browserInstance) browserInstance = createBrowserClient();
  return browserInstance;
}
