import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

// GET /api/dienstplan/tausch?hauptaccount_id=...
export async function GET(req: NextRequest) {
  const hauptaccountId = req.nextUrl.searchParams.get("hauptaccount_id");
  const employeeId = req.nextUrl.searchParams.get("employee_id");

  const supabase = createServerClient();

  if (hauptaccountId) {
    // Admin: alle offenen Tauschangebote seines Unternehmens
    const { data: empIds } = await supabase
      .from("employees")
      .select("id")
      .eq("hauptaccount_id", hauptaccountId);

    const ids = empIds?.map((e) => e.id) ?? [];

    const { data, error } = await supabase
      .from("shift_swaps")
      .select(`
        *,
        shift_original:shifts!shift_id_original(datum, von, bis, rolle_im_dienst),
        shift_angebot:shifts!shift_id_angebot(datum, von, bis, rolle_im_dienst),
        emp_anfrage:employees!employee_id_anfrage(name),
        emp_angebot:employees!employee_id_angebot(name)
      `)
      .in("employee_id_anfrage", ids)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ swaps: data });
  }

  if (employeeId) {
    // Mitarbeiter: eigene + offene Tauschangebote
    const { data, error } = await supabase
      .from("shift_swaps")
      .select(`
        *,
        shift_original:shifts!shift_id_original(datum, von, bis, rolle_im_dienst),
        shift_angebot:shifts!shift_id_angebot(datum, von, bis, rolle_im_dienst),
        emp_anfrage:employees!employee_id_anfrage(name),
        emp_angebot:employees!employee_id_angebot(name)
      `)
      .or(`employee_id_anfrage.eq.${employeeId},employee_id_angebot.eq.${employeeId},status.eq.offen`)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ swaps: data });
  }

  return NextResponse.json({ error: "hauptaccount_id oder employee_id erforderlich." }, { status: 400 });
}

// POST /api/dienstplan/tausch — Tausch anbieten oder Gegenangebot machen
export async function POST(req: NextRequest) {
  let body: {
    aktion: "anbieten" | "gegenangebot" | "genehmigen" | "ablehnen";
    shift_id_original: string;
    shift_id_angebot?: string;
    employee_id_anfrage: string;
    employee_id_angebot?: string;
    swap_id?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();

  if (body.aktion === "anbieten") {
    const { data, error } = await supabase
      .from("shift_swaps")
      .insert({
        shift_id_original: body.shift_id_original,
        employee_id_anfrage: body.employee_id_anfrage,
        status: "offen",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ swap: data }, { status: 201 });
  }

  if (body.aktion === "gegenangebot" && body.swap_id) {
    const { data, error } = await supabase
      .from("shift_swaps")
      .update({
        shift_id_angebot: body.shift_id_angebot,
        employee_id_angebot: body.employee_id_angebot,
      })
      .eq("id", body.swap_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Anfragenden per WhatsApp benachrichtigen
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    await fetch(`${baseUrl}/api/dienstplan/whatsapp-senden`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typ: "tausch", employeeIds: [body.employee_id_anfrage] }),
    }).catch(() => {});

    return NextResponse.json({ swap: data });
  }

  if (body.aktion === "genehmigen" && body.swap_id) {
    // Schichten tauschen
    const { data: swap, error: swapError } = await supabase
      .from("shift_swaps")
      .select("*, shifts_orig:shifts!shift_id_original(*), shifts_ang:shifts!shift_id_angebot(*)")
      .eq("id", body.swap_id)
      .single();

    if (swapError || !swap) {
      return NextResponse.json({ error: "Tausch nicht gefunden." }, { status: 404 });
    }

    // Mitarbeiter-IDs der Schichten tauschen
    if (swap.shift_id_angebot) {
      await supabase
        .from("shifts")
        .update({ employee_id: swap.employee_id_angebot, status: "getauscht" })
        .eq("id", swap.shift_id_original);

      await supabase
        .from("shifts")
        .update({ employee_id: swap.employee_id_anfrage, status: "getauscht" })
        .eq("id", swap.shift_id_angebot);
    }

    const { data, error } = await supabase
      .from("shift_swaps")
      .update({ status: "angenommen", admin_genehmigt: true })
      .eq("id", body.swap_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Beide Mitarbeiter benachrichtigen
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const notifIds = [swap.employee_id_anfrage, swap.employee_id_angebot].filter(Boolean);
    await fetch(`${baseUrl}/api/dienstplan/whatsapp-senden`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typ: "tausch", employeeIds: notifIds }),
    }).catch(() => {});

    return NextResponse.json({ swap: data });
  }

  if (body.aktion === "ablehnen" && body.swap_id) {
    const { data, error } = await supabase
      .from("shift_swaps")
      .update({ status: "abgelehnt", admin_genehmigt: false })
      .eq("id", body.swap_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ swap: data });
  }

  return NextResponse.json({ error: "Unbekannte Aktion." }, { status: 400 });
}
