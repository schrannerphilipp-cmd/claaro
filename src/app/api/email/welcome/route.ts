import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Rate limit: only 3 welcome emails per user (in case of retries)
  const rl = checkRateLimit(`welcome:${user.id}`, 3, 24 * 60 * 60 * 1000);
  if (!rl.allowed) return rateLimitExceeded();

  if (!user.email) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse gefunden." }, { status: 400 });
  }

  // Get trial end date from profiles
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, username")
    .eq("id", user.id)
    .maybeSingle();

  const trialEndsAt = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await sendWelcomeEmail({
    to:          user.email,
    username:    profile?.username ?? undefined,
    trialEndsAt,
  });

  return NextResponse.json({ success: true });
}
