import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@/lib/supabase";

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

      // Sicherheitscheck: hauptaccountId muss ein echter Auth-User sein
      const isValid = await validateHauptaccountId(supabase, hauptaccountId);
      if (!isValid) {
        console.warn("[stripe/webhook] Ungültige hauptaccountId, DB-Update abgebrochen:", hauptaccountId);
        break; // Immer 200 an Stripe zurückgeben
      }

      const { error } = await supabase
        .from("company_settings")
        .upsert(
          {
            hauptaccount_id: hauptaccountId,
            abo_plan: planId,
            abo_zahlungsintervall: interval,
            abo_seit: new Date().toISOString(),
          },
          { onConflict: "hauptaccount_id" }
        );

      if (error) {
        console.error("[stripe/webhook] Supabase upsert Fehler:", JSON.stringify(error));
      } else {
        console.log("[stripe/webhook] ✓ abo_plan gesetzt:", planId, "für hauptaccount_id:", hauptaccountId);
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

      // Sicherheitscheck
      const isValid = await validateHauptaccountId(supabase, hauptaccountId);
      if (!isValid) {
        console.warn("[stripe/webhook] Ungültige hauptaccountId beim Subscription-Delete:", hauptaccountId);
        break;
      }

      const { error } = await supabase
        .from("company_settings")
        .upsert(
          { hauptaccount_id: hauptaccountId, abo_plan: "starter" },
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
