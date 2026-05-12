import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dienstplan/verfuegbarkeit?employee_id=...&woche=2026-W21
export async function GET(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const woche = req.nextUrl.searchParams.get("woche");

  if (!employeeId || !woche) {
    return NextResponse.json({ error: "employee_id und woche erforderlich." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("woche", woche)
    .order("tag");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ availability: data });
}

// GET all employees for a week (Hauptaccount)
// GET /api/dienstplan/verfuegbarkeit?hauptaccount_id=...&woche=2026-W21
// handled via same route with different query params

// POST /api/dienstplan/verfuegbarkeit — upsert one day's availability
export async function POST(req: NextRequest) {
  let body: {
    employee_id: string;
    woche: string;
    tag: number;
    von?: string | null;
    bis?: string | null;
    verfuegbar: boolean;
    notiz?: string | null;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("availability")
    .upsert(
      {
        employee_id: body.employee_id,
        woche: body.woche,
        tag: body.tag,
        von: body.von ?? null,
        bis: body.bis ?? null,
        verfuegbar: body.verfuegbar,
        notiz: body.notiz ?? null,
      },
      { onConflict: "employee_id,woche,tag" }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ availability: data });
}

// DELETE /api/dienstplan/verfuegbarkeit?employee_id=...&woche=...
export async function DELETE(req: NextRequest) {
  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const woche = req.nextUrl.searchParams.get("woche");

  if (!employeeId || !woche) {
    return NextResponse.json({ error: "employee_id und woche erforderlich." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("employee_id", employeeId)
    .eq("woche", woche);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
