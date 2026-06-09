import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getRequestUser, unauthorized } from "@/lib/api-auth";
import { checkRateLimit, rateLimitExceeded } from "@/lib/rate-limit";

// GET  /api/dienstplan/mitarbeiter?hauptaccount_id=...
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  const hauptaccountId = req.nextUrl.searchParams.get("hauptaccount_id");
  if (!hauptaccountId) {
    return NextResponse.json({ error: "hauptaccount_id fehlt." }, { status: 400 });
  }

  // IDOR guard: only the account owner may query their own employees
  if (user.id !== hauptaccountId) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
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
  const user = await getRequestUser(req);
  if (!user) return unauthorized();

  // Rate limit for invite actions: 20 per minute per user
  const rl = checkRateLimit(`mitarbeiter:${user.id}`, 20, 60_000);
  if (!rl.allowed) return rateLimitExceeded();

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

  // IDOR guard: ignore client-supplied hauptaccount_id, use verified session user
  if (user.id !== body.hauptaccount_id) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });
  }

  const supabase = createServerClient();

  // ── Plan-Limit prüfen ────────────────────────────────────────────────────
  const EMPLOYEE_LIMITS: Record<string, number> = {
    starter: 3,
    profi:   15,
    team:    Infinity,
  };
  const NEXT_PLAN: Record<string, string> = {
    starter: "Profi",
    profi:   "Team",
  };

  const { data: settings } = await supabase
    .from("company_settings")
    .select("abo_plan")
    .eq("hauptaccount_id", user.id)
    .maybeSingle();

  const plan = settings?.abo_plan ?? null;
  const limit = plan ? (EMPLOYEE_LIMITS[plan] ?? Infinity) : 3; // trial = 3

  if (limit !== Infinity) {
    const { count } = await supabase
      .from("employees")
      .select("id", { count: "exact", head: true })
      .eq("hauptaccount_id", user.id)
      .eq("aktiv", true);

    if ((count ?? 0) >= limit) {
      const next = plan ? (NEXT_PLAN[plan] ?? null) : "Starter";
      const hint = next
        ? ` Upgrade auf ${next} für mehr.`
        : "";
      return NextResponse.json(
        { error: `Dein Plan erlaubt maximal ${limit} Mitarbeiter.${hint}` },
        { status: 403 }
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { data: employee, error: insertError } = await supabase
    .from("employees")
    .insert({
      hauptaccount_id: user.id,
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

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    body.email,
    {
      data: {
        employee_id: employee.id,
        hauptaccount_id: user.id,
        rolle: body.rolle,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/dienstplan/verfuegbarkeit`,
    }
  );

  if (inviteError) {
    console.warn("[dienstplan/mitarbeiter] Invite fehlgeschlagen:", inviteError.message);
  } else if (inviteData?.user) {
    await supabase
      .from("employees")
      .update({ auth_user_id: inviteData.user.id })
      .eq("id", employee.id);
  }

  return NextResponse.json({ employee, inviteGesendet: !inviteError }, { status: 201 });
}
