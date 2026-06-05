import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { sendLoyaltyUpgradeEmail } from "@/lib/email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type LoyaltyStatus = "standard" | "silber" | "gold";

const COUPON_CONFIG: Record<Exclude<LoyaltyStatus, "standard">, { id: string; percent: number; label: string }> = {
  silber: { id: "LOYALTY_SILBER", percent: 10, label: "Silber" },
  gold:   { id: "LOYALTY_GOLD",   percent: 15, label: "Gold"   },
};

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "CLR-";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function ensureCoupon(id: string, percent: number, name: string): Promise<void> {
  try {
    await stripe.coupons.retrieve(id);
  } catch {
    try {
      await stripe.coupons.create({ id, percent_off: percent, duration: "forever", name });
    } catch (err) {
      console.warn(`[loyalty/check] Coupon ${id} erstellen fehlgeschlagen:`, err);
    }
  }
}

async function applyCoupon(subscriptionId: string, couponId: string): Promise<boolean> {
  try {
    // Stripe SDK ≥ 14: use discounts array instead of deprecated coupon field
    await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }],
    } as Parameters<typeof stripe.subscriptions.update>[1]);
    return true;
  } catch (err) {
    console.error("[loyalty/check] Coupon anwenden fehlgeschlagen:", err);
    return false;
  }
}


export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  const supabase = createServerClient();

  // Load or create loyalty record
  let { data: loyalty } = await supabase
    .from("loyalty_status")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!loyalty) {
    // Generate collision-free referral code
    let code = generateReferralCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabase
        .from("loyalty_status").select("id").eq("referral_code", code).maybeSingle();
      if (!clash) break;
      code = generateReferralCode();
    }
    const { data: created } = await supabase
      .from("loyalty_status")
      .insert({ user_id: user.id, referral_code: code })
      .select()
      .single();
    loyalty = created;
  }

  if (!loyalty) {
    return NextResponse.json({ error: "Loyalty-Daten konnten nicht geladen werden." }, { status: 500 });
  }

  // Calculate months since account creation
  const { data: profile } = await supabase
    .from("profiles").select("created_at").eq("id", user.id).single();

  const monthsSince = profile?.created_at
    ? Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    : 0;

  // Determine target status
  const current = loyalty.status as LoyaltyStatus;
  let target: LoyaltyStatus = current;
  if (current === "standard" && monthsSince >= 13) target = "silber";
  if (current === "silber"   && monthsSince >= 30) target = "gold";

  if (target !== current) {
    const cfg = COUPON_CONFIG[target as Exclude<LoyaltyStatus, "standard">];

    // Ensure Stripe coupon exists
    await ensureCoupon(cfg.id, cfg.percent, `Claaro Treue-Rabatt ${cfg.label} (${cfg.percent}%)`);

    // Apply to subscription if available
    const { data: cs } = await supabase
      .from("company_settings")
      .select("stripe_subscription_id")
      .eq("hauptaccount_id", user.id)
      .maybeSingle();

    const discountApplied = cs?.stripe_subscription_id
      ? await applyCoupon(cs.stripe_subscription_id, cfg.id)
      : false;

    await supabase
      .from("loyalty_status")
      .update({ status: target, status_since: new Date().toISOString(), discount_applied: discountApplied, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    loyalty = { ...loyalty, status: target, discount_applied: discountApplied };

    if (user.email) {
      await sendLoyaltyUpgradeEmail({ to: user.email, status: target as "silber" | "gold", months: monthsSince });
    }
  }

  // Load referral count for this user
  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id)
    .in("status", ["converted", "rewarded"]);

  return NextResponse.json({
    loyalty: {
      ...loyalty,
      referral_count: referralCount ?? loyalty.referral_count,
      months_since_creation: monthsSince,
      months_to_silber: Math.max(0, 13 - monthsSince),
      months_to_gold:   Math.max(0, 30 - monthsSince),
    },
  });
}
