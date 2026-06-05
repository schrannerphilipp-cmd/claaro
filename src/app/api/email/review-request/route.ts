import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { sendReviewRequestEmail } from "@/lib/email";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  const rl = checkRateLimit(`review-email:${user.id}`, 20, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

  let body: {
    to: string;
    customerName: string;
    businessName: string;
    platformName: string;
    reviewUrl: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!body.to || !body.customerName || !body.reviewUrl) {
    return NextResponse.json({ error: "Fehlende Pflichtfelder (to, customerName, reviewUrl)." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.to)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  // Validate review URL scheme
  try {
    const parsed = new URL(body.reviewUrl);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return NextResponse.json({ error: "Ungültige Bewertungs-URL." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Ungültige Bewertungs-URL." }, { status: 400 });
  }

  await sendReviewRequestEmail(body);

  return NextResponse.json({ success: true });
}
