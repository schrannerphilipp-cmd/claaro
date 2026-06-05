import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { createServerClient } from "@/lib/supabase";
import { sendTrialExpiredEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Only send once per user — use a long window (7 days)
  const rl = checkRateLimit(`trial-expired:${user.id}`, 1, 7 * 24 * 60 * 60 * 1000);
  if (!rl.allowed) return NextResponse.json({ skipped: true, reason: "already_sent" });

  if (!user.email) return NextResponse.json({ error: "Keine E-Mail." }, { status: 400 });

  // Don't send to paying users
  const supabase = createServerClient();
  const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
  if (HAUPTACCOUNT_ID) {
    const { data: settings } = await supabase
      .from("company_settings")
      .select("abo_seit")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .maybeSingle();
    if (settings?.abo_seit) return NextResponse.json({ skipped: true, reason: "already_paid" });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  await sendTrialExpiredEmail({
    to:       user.email,
    username: profile?.username ?? undefined,
  });

  return NextResponse.json({ success: true });
}
