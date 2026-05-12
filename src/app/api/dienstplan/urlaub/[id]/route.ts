import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// PATCH /api/dienstplan/urlaub/[id] — genehmigen oder ablehnen
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: { status: "genehmigt" | "abgelehnt"; ablehngrund?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vacations")
    .update({
      status: body.status,
      ablehngrund: body.ablehngrund ?? null,
    })
    .eq("id", id)
    .select("*, employees(name, telefon)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // WhatsApp-Benachrichtigung auslösen
  const emp = (data as { employees?: { name: string; telefon: string } }).employees;
  if (emp?.telefon) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    await fetch(`${baseUrl}/api/dienstplan/whatsapp-senden`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        typ: "urlaub",
        employeeIds: [data.employee_id],
        nachricht:
          body.status === "genehmigt"
            ? `Hallo ${emp.name},\n\nIhr Urlaubsantrag vom ${formatDate(data.von)} bis ${formatDate(data.bis)} wurde ✅ *genehmigt*.\n\n– Ihr claaro-Team`
            : `Hallo ${emp.name},\n\nIhr Urlaubsantrag vom ${formatDate(data.von)} bis ${formatDate(data.bis)} wurde ❌ *abgelehnt*.\n${body.ablehngrund ? `Grund: ${body.ablehngrund}\n` : ""}\n– Ihr claaro-Team`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ vacation: data });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
