import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase";
import { sendTrialReminderEmail } from "@/lib/email";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Rate limit: max 1 reminder per user per 24h
  const rl = checkRateLimit(`trial-reminder:${user.id}`, 1, 24 * 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ skipped: true, reason: "already_sent_today" });

  if (!user.email) {
    return NextResponse.json({ error: "Keine E-Mail-Adresse gefunden." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("trial_ends_at, username")
    .eq("id", user.id)
    .maybeSingle();

  // Also check abo_seit — don't send reminder to paying users
  const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
  if (HAUPTACCOUNT_ID) {
    const { data: settings } = await supabase
      .from("company_settings")
      .select("abo_seit")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .maybeSingle();
    if (settings?.abo_seit) {
      return NextResponse.json({ skipped: true, reason: "already_paid" });
    }
  }

  const trialEndsAt = profile?.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const msLeft  = trialEndsAt.getTime() - Date.now();
  const daysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));

  await sendTrialReminderEmail({
    to:          user.email,
    username:    profile?.username ?? undefined,
    daysLeft,
    trialEndsAt,
  });

  return NextResponse.json({ success: true, daysLeft });
}
