import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerClient } from "@/lib/supabase";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Du bist ein Experte für Arbeitszeitplanung in Deutschland, Österreich und der Schweiz. Erstelle einen gesetzeskonformen Schichtplan basierend auf den Mitarbeiter-Verfügbarkeiten.

DEUTSCHLAND (ArbZG): Max. 8h/Tag regulär, bis 10h erlaubt wenn Ausgleich innerhalb 6 Monate. Mind. 11h Ruhezeit zwischen Schichten. Pause: ab 6h Arbeit 30min, ab 9h 45min. Max. 48h/Woche im Durchschnitt über 6 Monate. Sonn- und Feiertagsruhe beachten.

ÖSTERREICH (AZG): Max. 8h/Tag, bis 10h mit Überstundenzuschlag. Mind. 11h Ruhezeit (bei Saisonbetrieb 8h möglich). Pause: ab 6h 30min. Max. 40h/Woche.

SCHWEIZ (ArG): Max. 9h/Tag (Industrie), 10h (Gewerbe). Mind. 11h Ruhezeit. Pause: ab 5,5h 15min, ab 7h 30min, ab 9h 60min. Max. 45h/Woche (Industrie/Büro), 50h (andere).

Planung: Verteile Stunden möglichst gleichmäßig entsprechend dem Vertragstyp. Vollzeit: Wochenstunden vollständig planen. Teilzeit/Minijob: anteilig und gesetzeskonform.

Antworte NUR als gültiges JSON ohne Erklärungstext davor oder danach:
{"schichten":[{"employee_id":"string","datum":"YYYY-MM-DD","von":"HH:MM","bis":"HH:MM","pause_minuten":number,"rolle_im_dienst":"string"}],"begruendung":"string","warnungen":["string"]}`;

export async function POST(req: NextRequest) {
  let body: { woche: string; hauptaccount_id: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY nicht konfiguriert." }, { status: 503 });
  }

  const supabase = createServerClient();

  // 1. Mitarbeiter laden
  const { data: employees, error: empError } = await supabase
    .from("employees")
    .select("id, name, land, stunden_pro_woche, vertrag_typ")
    .eq("hauptaccount_id", body.hauptaccount_id)
    .eq("aktiv", true);

  if (empError || !employees?.length) {
    return NextResponse.json({ error: "Keine aktiven Mitarbeiter gefunden." }, { status: 404 });
  }

  // 2. Verfügbarkeiten der Woche laden
  const employeeIds = employees.map((e) => e.id);
  const { data: availability } = await supabase
    .from("availability")
    .select("*")
    .in("employee_id", employeeIds)
    .eq("woche", body.woche);

  // 3. Genehmigte Urlaube laden (Datumbereich der Woche)
  const [year, week] = body.woche.replace("W", "").split("-").map(Number);
  const weekStart = isoWeekToDate(year, week);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const { data: vacations } = await supabase
    .from("vacations")
    .select("employee_id, von, bis")
    .in("employee_id", employeeIds)
    .eq("status", "genehmigt")
    .lte("von", weekEnd.toISOString().slice(0, 10))
    .gte("bis", weekStart.toISOString().slice(0, 10));

  // 4. Kontext für KI aufbauen
  const context = {
    woche: body.woche,
    wochenstart: weekStart.toISOString().slice(0, 10),
    mitarbeiter: employees.map((e) => ({
      ...e,
      verfuegbarkeit: (availability ?? [])
        .filter((a) => a.employee_id === e.id)
        .map((a) => ({
          tag: a.tag,
          tagName: ["Mo","Di","Mi","Do","Fr","Sa","So"][a.tag],
          datum: dateOfWeekDay(weekStart, a.tag),
          verfuegbar: a.verfuegbar,
          von: a.von,
          bis: a.bis,
          notiz: a.notiz,
        })),
      urlaub: (vacations ?? [])
        .filter((v) => v.employee_id === e.id)
        .map((v) => ({ von: v.von, bis: v.bis })),
    })),
  };

  // 5. Claude API aufrufen (mit Prompt Caching für System-Prompt)
  let raw: string;
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Erstelle einen Schichtplan für Woche ${body.woche}:\n\n${JSON.stringify(context, null, 2)}`,
        },
      ],
    });
    raw = msg.content[0].type === "text" ? msg.content[0].text : "";
  } catch (err) {
    const msg = err instanceof Error ? err.message : "KI-Fehler";
    return NextResponse.json({ error: `Claude API: ${msg}` }, { status: 502 });
  }

  // 6. JSON parsen
  let result: {
    schichten: {
      employee_id: string;
      datum: string;
      von: string;
      bis: string;
      pause_minuten: number;
      rolle_im_dienst: string;
    }[];
    begruendung: string;
    warnungen: string[];
  };

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    result = JSON.parse(jsonMatch?.[0] ?? raw);
  } catch {
    return NextResponse.json({ error: "KI-Antwort konnte nicht geparst werden.", raw }, { status: 502 });
  }

  // 7. Entwurf in DB speichern
  const { data: plan, error: planError } = await supabase
    .from("shift_plans")
    .insert({
      hauptaccount_id: body.hauptaccount_id,
      woche: body.woche,
      status: "entwurf",
      ki_begruendung: result.begruendung,
    })
    .select()
    .single();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  // 8. Schichten speichern
  const shiftsToInsert = result.schichten.map((s) => ({
    employee_id: s.employee_id,
    shift_plan_id: plan.id,
    hauptaccount_id: body.hauptaccount_id,
    datum: s.datum,
    von: s.von,
    bis: s.bis,
    pause_minuten: s.pause_minuten,
    rolle_im_dienst: s.rolle_im_dienst,
    status: "entwurf",
    erstellt_von_ki: true,
  }));

  const { data: savedShifts, error: shiftsError } = await supabase
    .from("shifts")
    .insert(shiftsToInsert)
    .select();

  if (shiftsError) {
    return NextResponse.json({ error: shiftsError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    plan,
    schichten: savedShifts,
    begruendung: result.begruendung,
    warnungen: result.warnungen ?? [],
  });
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function isoWeekToDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7;
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - (dayOfWeek - 1));
  const result = new Date(startOfWeek1);
  result.setDate(startOfWeek1.getDate() + (week - 1) * 7);
  return result;
}

function dateOfWeekDay(weekStart: Date, dayIndex: number): string {
  const d = new Date(weekStart);
  d.setDate(weekStart.getDate() + dayIndex);
  return d.toISOString().slice(0, 10);
}
