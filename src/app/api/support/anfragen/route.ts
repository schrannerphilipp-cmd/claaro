import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { getRequestUser, unauthorized } from "@/lib/api-auth";

const ADMIN_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

function isAdmin(userId: string): boolean {
  return ADMIN_ID.length > 0 && userId === ADMIN_ID;
}

// GET /api/support/anfragen — list all (admin only)
export async function GET(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  if (!isAdmin(user.id)) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });

  const onlyOpen = req.nextUrl.searchParams.get("open") !== "false";
  const supabase = createServerClient();

  const query = supabase
    .from("support_anfragen")
    .select("*")
    .order("erstellt_am", { ascending: false });

  if (onlyOpen) query.eq("bearbeitet", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anfragen: data ?? [] });
}

// PATCH /api/support/anfragen — mark as done (admin only)
export async function PATCH(req: NextRequest) {
  const user = await getRequestUser(req);
  if (!user) return unauthorized();
  if (!isAdmin(user.id)) return NextResponse.json({ error: "Nicht autorisiert" }, { status: 403 });

  let body: { id: string; bearbeitet: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("support_anfragen")
    .update({
      bearbeitet:     body.bearbeitet,
      beantwortet_am: body.bearbeitet ? new Date().toISOString() : null,
    })
    .eq("id", body.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anfrage: data });
}
