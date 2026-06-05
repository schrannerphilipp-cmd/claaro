import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase";
import { sendPaymentConfirmationEmail } from "@/lib/email";

export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function validateHauptaccountId(
  supabase: ReturnType<typeof createServerClient>,
  hauptaccountId: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.auth as any).admin.getUserById(hauptaccountId);
    if (error || !data?.user) {
      console.warn("[stripe/webhook] hauptaccountId ist kein gültiger Auth-User:", hauptaccountId);
      return false;
    }
    return true;
  } catch {
    console.warn("[stripe/webhook] getUserById fehlgeschlagen für:", hauptaccountId);
    return false;
  }
}

async function handleReferralConversion(
  supabase: ReturnType<typeof createServerClient>,
  referredEmail: string,
  hauptaccountId: string
): Promise<void> {
  // Find pending referral for this email
  const { data: referral } = await supabase
    .from("referrals")
    .select("id, referrer_id, referral_code")
    .eq("referred_email", referredEmail.toLowerCase())
    .eq("status", "pending")
    .maybeSingle();

  if (!referral) return;

  console.log("[stripe/webhook] Referral-Konvertierung für:", referredEmail, "Referrer:", referral.referrer_id);

  // Mark referral as converted
  await supabase
    .from("referrals")
    .update({ status: "converted", referred_user_id: hauptaccountId })
    .eq("id", referral.id);

  // Increment referrer's referral_count directly (no RPC needed)
  const { data: lsRow } = await supabase
    .from("loyalty_status")
    .select("referral_count")
    .eq("user_id", referral.referrer_id)
    .maybeSingle();
  if (lsRow) {
    await supabase
      .from("loyalty_status")
      .update({ referral_count: (lsRow.referral_count ?? 0) + 1 })
      .eq("user_id", referral.referrer_id);
  }

  // Get referrer's Stripe subscription
  const { data: referrerSettings } = await supabase
    .from("company_settings")
    .select("stripe_subscription_id")
    .eq("hauptaccount_id", referral.referrer_id)
    .maybeSingle();

  if (referrerSettings?.stripe_subscription_id) {
    try {
      // Create a unique 100%-off, one-time coupon for this referral
      const freeCouponId = `FREE_MONTH_${referral.referrer_id.slice(0, 8)}_${Date.now()}`;
      await stripe.coupons.create({
        id:           freeCouponId,
        percent_off:  100,
        duration:     "once",
        name:         "Empfehlungsbonus — 1 Monat gratis",
        max_redemptions: 1,
      });
      await stripe.subscriptions.update(referrerSettings.stripe_subscription_id, {
        discounts: [{ coupon: freeCouponId }],
      } as Parameters<typeof stripe.subscriptions.update>[1]);

      // Mark referral as rewarded
      await supabase.from("referrals").update({ status: "rewarded" }).eq("id", referral.id);
      await supabase
        .from("loyalty_status")
        .update({ free_month_pending: false })
        .eq("user_id", referral.referrer_id);

      console.log("[stripe/webhook] ✓ Gratis-Monat angewendet für Referrer:", referral.referrer_id);
    } catch (err) {
      console.error("[stripe/webhook] Gratis-Monat-Coupon fehlgeschlagen:", err);
      // Set pending flag so it can be processed manually or on next check
      await supabase
        .from("loyalty_status")
        .update({ free_month_pending: true })
        .eq("user_id", referral.referrer_id);
    }
  } else {
    // Referrer has no active subscription — show banner in dashboard
    await supabase
      .from("loyalty_status")
      .update({ free_month_pending: true })
      .eq("user_id", referral.referrer_id);
  }
}

export async function POST(request: NextRequest) {
  console.log("[stripe/webhook] ← eingehender Request");

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    console.error("[stripe/webhook] Abgebrochen: Keine Stripe-Signatur");
    return NextResponse.json({ error: "Keine Stripe-Signatur" }, { status: 400 });
  }

  if (!webhookSecret || webhookSecret.length < 10) {
    console.error("[stripe/webhook] Abgebrochen: STRIPE_WEBHOOK_SECRET fehlt oder ist ungültig");
    return NextResponse.json({ error: "Webhook-Secret nicht konfiguriert" }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[stripe/webhook] Signaturprüfung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Signaturprüfung fehlgeschlagen" }, { status: 400 });
  }

  console.log("[stripe/webhook] ✓ Signatur OK — event.type:", event.type);

  const supabase = createServerClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { hauptaccountId, planId, interval } = session.metadata ?? {};

      console.log("[stripe/webhook] checkout.session.completed metadata:", { hauptaccountId, planId, interval });

      if (!hauptaccountId || !planId || !interval) {
        console.warn("[stripe/webhook] Fehlende Metadata — kein DB-Update");
        break;
      }

      const isValid = await validateHauptaccountId(supabase, hauptaccountId);
      if (!isValid) {
        console.warn("[stripe/webhook] Ungültige hauptaccountId, DB-Update abgebrochen:", hauptaccountId);
        break;
      }

      const stripeCustomerId     = typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
      const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null;

      const { error } = await supabase
        .from("company_settings")
        .upsert(
          {
            hauptaccount_id:        hauptaccountId,
            abo_plan:               planId,
            abo_zahlungsintervall:   interval,
            abo_seit:               new Date().toISOString(),
            stripe_customer_id:     stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
          },
          { onConflict: "hauptaccount_id" }
        );

      if (error) {
        console.error("[stripe/webhook] Supabase upsert Fehler:", JSON.stringify(error));
      } else {
        console.log("[stripe/webhook] ✓ abo_plan gesetzt:", planId, "für hauptaccount_id:", hauptaccountId);
      }

      // Handle referral conversion
      const referredEmail =
        session.customer_email ??
        (session.customer_details as { email?: string } | null)?.email ??
        null;

      if (referredEmail) {
        await handleReferralConversion(supabase, referredEmail, hauptaccountId);
      }

      // Send payment confirmation email
      if (referredEmail) {
        const PLAN_NAMES: Record<string, string> = { starter: "Starter", profi: "Profi", team: "Team" };
        const PLAN_PRICES: Record<string, Record<string, number>> = {
          starter: { monatlich: 29, jaehrlich: 23 },
          profi:   { monatlich: 59, jaehrlich: 47 },
          team:    { monatlich: 99, jaehrlich: 79 },
        };
        const betrag = PLAN_PRICES[planId]?.[interval] ?? 0;
        await sendPaymentConfirmationEmail({
          to:        referredEmail,
          planName:  PLAN_NAMES[planId] ?? planId,
          interval:  interval as "monatlich" | "jaehrlich",
          betrag,
        }).catch(() => {});
      }

      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const { hauptaccountId } = subscription.metadata ?? {};

      console.log("[stripe/webhook] customer.subscription.deleted für:", hauptaccountId);

      if (!hauptaccountId) {
        console.warn("[stripe/webhook] hauptaccountId fehlt in subscription.metadata");
        break;
      }

      const isValid = await validateHauptaccountId(supabase, hauptaccountId);
      if (!isValid) {
        console.warn("[stripe/webhook] Ungültige hauptaccountId beim Subscription-Delete:", hauptaccountId);
        break;
      }

      const { error } = await supabase
        .from("company_settings")
        .upsert(
          {
            hauptaccount_id:        hauptaccountId,
            abo_plan:               "starter",
            stripe_subscription_id: null,
          },
          { onConflict: "hauptaccount_id" }
        );

      if (error) {
        console.error("[stripe/webhook] Supabase upsert Fehler:", JSON.stringify(error));
      } else {
        console.log("[stripe/webhook] ✓ abo_plan zurückgesetzt auf starter für:", hauptaccountId);
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
