import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// PATCH /api/dienstplan/mitarbeiter/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const allowed = [
    "name","email","telefon","rolle","land",
    "stunden_pro_woche","vertrag_typ","aktiv","urlaub_tage_jahr",
  ];
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  );

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employee: data });
}

// DELETE /api/dienstplan/mitarbeiter/[id] — deaktiviert statt löscht
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServerClient();
  const { error } = await supabase
    .from("employees")
    .update({ aktiv: false })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
