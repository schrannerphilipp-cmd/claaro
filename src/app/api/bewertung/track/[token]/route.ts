import { NextRequest, NextResponse } from "next/server";
import { trackingStore } from "@/lib/bewertung-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const entry = trackingStore.get(token);

  if (!entry) {
    return NextResponse.json(
      { error: "Ungültiger oder abgelaufener Link." },
      { status: 404 }
    );
  }

  entry.clickedAt = new Date().toISOString();
  trackingStore.set(token, entry);

  return NextResponse.redirect(entry.platformUrl, { status: 302 });
}
