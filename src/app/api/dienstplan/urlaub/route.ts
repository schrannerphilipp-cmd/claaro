import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dienstplan/urlaub?hauptaccount_id=... (alle) oder ?employee_id=... (eigene)
export async function GET(req: NextRequest) {
  const hauptaccountId = req.nextUrl.searchParams.get("hauptaccount_id");
  const employeeId = req.nextUrl.searchParams.get("employee_id");
  const supabase = createServerClient();

  if (hauptaccountId) {
    const { data: employees } = await supabase
      .from("employees")
      .select("id")
      .eq("hauptaccount_id", hauptaccountId);

    const empIds = employees?.map((e) => e.id) ?? [];

    const { data: vacations, error } = await supabase
      .from("vacations")
      .select("*, employees(name, email)")
      .in("employee_id", empIds)
      .order("von", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vacations });
  }

  if (employeeId) {
    const { data, error } = await supabase
      .from("vacations")
      .select("*")
      .eq("employee_id", employeeId)
      .order("von", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vacations: data });
  }

  return NextResponse.json(
    { error: "hauptaccount_id oder employee_id erforderlich." },
    { status: 400 }
  );
}

// POST /api/dienstplan/urlaub — Antrag stellen
export async function POST(req: NextRequest) {
  let body: { employee_id: string; von: string; bis: string; notiz?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("vacations")
    .insert({
      employee_id: body.employee_id,
      von: body.von,
      bis: body.bis,
      notiz: body.notiz ?? null,
      status: "beantragt",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vacation: data }, { status: 201 });
}
