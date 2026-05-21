import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServerClient } from "@supabase/ssr";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_IDS: Record<string, string | undefined> = {
  starter_monatlich: process.env.STRIPE_PRICE_ID_STARTER_MONTHLY,
  starter_jaehrlich: process.env.STRIPE_PRICE_ID_STARTER_YEARLY,
  profi_monatlich:   process.env.STRIPE_PRICE_ID_PROFI_MONTHLY,
  profi_jaehrlich:   process.env.STRIPE_PRICE_ID_PROFI_YEARLY,
  team_monatlich:    process.env.STRIPE_PRICE_ID_TEAM_MONTHLY,
  team_jaehrlich:    process.env.STRIPE_PRICE_ID_TEAM_YEARLY,
};

export async function POST(request: NextRequest) {
  // Auth-Check: Session aus Cookie lesen (serverseitig)
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  // Client-Input für hauptaccountId wird ignoriert — wir verwenden die verifizierte User-ID
  const hauptaccountId = user.id;

  const { planId, interval, customerEmail } = await request.json();

  if (!planId || !interval) {
    return NextResponse.json({ error: "planId und interval sind erforderlich" }, { status: 400 });
  }

  const priceId = PRICE_IDS[`${planId}_${interval}`];
  if (!priceId) {
    return NextResponse.json({ error: "Ungültige Plan/Interval-Kombination" }, { status: 400 });
  }

  const base = new URL(request.url).origin;
  const meta = { planId, interval, hauptaccountId };

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/dashboard/konto?success=1`,
    cancel_url: `${base}/dashboard/konto?cancelled=1`,
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    metadata: meta,
    subscription_data: { metadata: meta },
  });

  return NextResponse.json({ url: session.url });
}
