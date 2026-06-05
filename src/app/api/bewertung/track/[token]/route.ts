import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/bewertung-store";

function isSafeRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Validate token format (UUID only) to prevent path traversal
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return NextResponse.json({ error: "Ungültiger Link." }, { status: 400 });
  }

  const entry = trackingStore.get(token);

  if (!entry) {
    return NextResponse.json(
      { error: "Ungültiger oder abgelaufener Link." },
      { status: 404 }
    );
  }

  // Guard against open redirect — only allow http/https targets
  if (!isSafeRedirectUrl(entry.platformUrl)) {
    console.error("[bewertung/track] Abgelehnte platformUrl:", entry.platformUrl);
    return NextResponse.json({ error: "Ungültige Zieladresse." }, { status: 400 });
  }

  entry.clickedAt = new Date().toISOString();
  trackingStore.set(token, entry);

  return NextResponse.redirect(entry.platformUrl, { status: 302 });
}
