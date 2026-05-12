import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET  /api/dienstplan/mitarbeiter?hauptaccount_id=...
export async function GET(req: NextRequest) {
  const hauptaccountId = req.nextUrl.searchParams.get("hauptaccount_id");
  if (!hauptaccountId) {
    return NextResponse.json({ error: "hauptaccount_id fehlt." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("hauptaccount_id", hauptaccountId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employees: data });
}

// POST /api/dienstplan/mitarbeiter — Mitarbeiter anlegen & einladen
export async function POST(req: NextRequest) {
  let body: {
    hauptaccount_id: string;
    name: string;
    email: string;
    telefon: string;
    rolle: string;
    land: string;
    stunden_pro_woche: number;
    vertrag_typ: string;
    urlaub_tage_jahr?: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();

  // 1. Mitarbeiter in employees eintragen
  const { data: employee, error: insertError } = await supabase
    .from("employees")
    .insert({
      hauptaccount_id: body.hauptaccount_id,
      name: body.name,
      email: body.email,
      telefon: body.telefon,
      rolle: body.rolle,
      land: body.land,
      stunden_pro_woche: body.stunden_pro_woche,
      vertrag_typ: body.vertrag_typ,
      urlaub_tage_jahr: body.urlaub_tage_jahr ?? 25,
      aktiv: true,
    })
    .select()
    .single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  // 2. Supabase Auth Invite — sendet Einladungs-E-Mail
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    body.email,
    {
      data: {
        employee_id: employee.id,
        hauptaccount_id: body.hauptaccount_id,
        rolle: body.rolle,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/dienstplan/verfuegbarkeit`,
    }
  );

  if (inviteError) {
    console.warn("[dienstplan/mitarbeiter] Invite fehlgeschlagen:", inviteError.message);
  } else if (inviteData?.user) {
    // auth_user_id hinterlegen
    await supabase
      .from("employees")
      .update({ auth_user_id: inviteData.user.id })
      .eq("id", employee.id);
  }

  return NextResponse.json({ employee, inviteGesendet: !inviteError }, { status: 201 });
}
