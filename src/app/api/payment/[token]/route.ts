import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const base = new URL(request.url).origin;

  const rechnung = await db.rechnung.findUnique({
    where: { zahlungsToken: token },
    include: { mahnungen: true },
  });

  if (!rechnung) {
    return new NextResponse("Ungültiger Zahlungslink.", { status: 404 });
  }

  if (rechnung.status === "bezahlt") {
    return NextResponse.redirect(new URL("/payment/bereits-bezahlt", base));
  }

  // Mark Rechnung and all open Mahnungen as bezahlt
  await db.$transaction([
    db.rechnung.update({
      where: { id: rechnung.id },
      data: { status: "bezahlt" },
    }),
    ...rechnung.mahnungen
      .filter((m) => m.status !== "bezahlt")
      .map((m) =>
        db.mahnung.update({ where: { id: m.id }, data: { status: "bezahlt" } })
      ),
  ]);

  return NextResponse.redirect(new URL("/payment/success", base));
}
