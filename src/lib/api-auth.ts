import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

/**
 * Reads the authenticated user from the session cookie attached to a Request.
 * Uses the anon key + RLS — does NOT bypass row-level security.
 */
export async function getRequestUser(request: NextRequest): Promise<User | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() { /* read-only in route handlers */ },
      },
    },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
}

/** Standard 401 response. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
}
