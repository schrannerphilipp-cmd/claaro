import { NextResponse } from "next/server";

/**
 * KI-Schichtplan-Generierung – derzeit deaktiviert.
 * Das Feature ist in Entwicklung und wird ohne ANTHROPIC_API_KEY-Kosten
 * in einer späteren Version verfügbar sein.
 *
 * Die ursprüngliche Implementierung (Anthropic claude-sonnet-4-6) bleibt
 * als Referenz im Git-Verlauf erhalten.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "KI-Schichtplan ist noch in Entwicklung und aktuell nicht verfügbar.",
      type: "not_configured",
    },
    { status: 503 },
  );
}
