import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(`referral-validate:${ip}`, 20, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

  const code = req.nextUrl.searchParams.get("code")?.toUpperCase().trim();
  if (!code) return NextResponse.json({ valid: false });

  const supabase = createServerClient();
  const { data } = await supabase
    .from("loyalty_status")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();

  return NextResponse.json({ valid: !!data });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(`referral:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

  let body: { ref_code: string; referred_email: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const { ref_code, referred_email } = body;
  if (!ref_code || !referred_email) {
    return NextResponse.json({ error: "ref_code und referred_email sind erforderlich." }, { status: 400 });
  }

  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(referred_email)) {
    return NextResponse.json({ error: "Ungültige E-Mail." }, { status: 400 });
  }

  const supabase = createServerClient();

  // Validate referral code
  const { data: referrerLoyalty } = await supabase
    .from("loyalty_status")
    .select("user_id")
    .eq("referral_code", ref_code.toUpperCase().trim())
    .maybeSingle();

  if (!referrerLoyalty) {
    // Return success silently to not leak code validity
    return NextResponse.json({ success: true });
  }

  // Prevent self-referral
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrerAuth } = await (supabase.auth as any).admin.getUserById(referrerLoyalty.user_id);
  if (referrerAuth?.user?.email === referred_email) {
    return NextResponse.json({ success: true }); // silent
  }

  // Idempotent: if referral already recorded, return success
  const { data: existing } = await supabase
    .from("referrals")
    .select("id")
    .eq("referred_email", referred_email)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true });
  }

  await supabase.from("referrals").insert({
    referrer_id:    referrerLoyalty.user_id,
    referred_email: referred_email.toLowerCase().trim(),
    referral_code:  ref_code.toUpperCase().trim(),
    status:         "pending",
  });

  return NextResponse.json({ success: true });
}
