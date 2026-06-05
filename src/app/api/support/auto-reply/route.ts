import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendSupportAutoReplyEmail, sendAdminNotificationEmail } from "@/lib/email";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

type Category = "pricing" | "cancellation" | "password" | "trial" | "invoice";

const KEYWORD_MAP: Record<Category, string[]> = {
  pricing:      ["preis", "kosten", "wie viel", "wieviel", "kostet", "abonnement", "plan", "paket", "tarif", "monat"],
  cancellation: ["kündigen", "kündigung", "kündige", "cancel", "beenden", "aufkündigen"],
  password:     ["passwort", "einloggen", "login", "anmelden", "vergessen", "zugang", "sperrt", "eingeloggt"],
  trial:        ["trial", "testphase", "test-monat", "testzeitraum", "probemonat", "kostenlos testen", "30 tage"],
  invoice:      ["rechnung", "invoice", "beleg", "quittung", "zahlung", "abbuchung", "stripe", "überweisung"],
};

function detectCategory(text: string): Category | null {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [Category, string[]][]) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return null;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(`support:${ip}`, 5, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

  let body: {
    name: string;
    email: string;
    betreff: string;
    nachricht: string;
    _honeypot?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  // Honeypot
  if (body._honeypot) return NextResponse.json({ success: true });

  const { name, email, betreff, nachricht } = body;

  if (!name?.trim() || !email?.trim() || !betreff?.trim() || !nachricht?.trim()) {
    return NextResponse.json({ error: "Alle Felder sind Pflichtfelder." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }
  if (nachricht.trim().length < 10) {
    return NextResponse.json({ error: "Nachricht zu kurz." }, { status: 400 });
  }

  const combined = `${betreff} ${nachricht}`;
  const category = detectCategory(combined);

  if (category) {
    // Auto-reply for known FAQ
    await sendSupportAutoReplyEmail({
      to:           email,
      customerName: name,
      category,
    });
    return NextResponse.json({ success: true, matched: true, category });
  }

  // Unknown topic — save to DB + notify admin
  const supabase = createServerClient();
  await supabase.from("support_anfragen").insert({
    user_email:  email.toLowerCase().trim(),
    user_name:   name.trim(),
    betreff:     escapeHtml(betreff.trim()),
    nachricht:   nachricht.trim(),
    erstellt_am: new Date().toISOString(),
    bearbeitet:  false,
  });

  await sendAdminNotificationEmail({
    customerEmail: email,
    customerName:  name,
    betreff:       betreff.trim(),
    nachricht:     nachricht.trim(),
  });

  return NextResponse.json({ success: true, matched: false });
}
