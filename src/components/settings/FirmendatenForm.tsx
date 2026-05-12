"use client";

import { useState, useEffect } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const HAUPTACCOUNT_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";
export const FIRMENDATEN_LS_KEY = "claaro-firmendaten";

export interface Firmendaten {
  firmenname: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  website: string;
  ust_id_nr: string;
}

const EMPTY: Firmendaten = {
  firmenname: "",
  strasse: "",
  plz: "",
  ort: "",
  telefon: "",
  email: "",
  website: "",
  ust_id_nr: "",
};

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

function loadFromStorage(): Firmendaten {
  try {
    const raw = localStorage.getItem(FIRMENDATEN_LS_KEY);
    if (raw) return { ...EMPTY, ...JSON.parse(raw) };
  } catch {/* ignore */}
  return EMPTY;
}

export default function FirmendatenForm() {
  const [form, setForm] = useState<Firmendaten>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(loadFromStorage());

    if (!HAUPTACCOUNT_ID || !supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    supabase
      .from("company_settings")
      .select("firmenname,strasse,plz,ort,telefon,email,website,ust_id_nr")
      .eq("hauptaccount_id", HAUPTACCOUNT_ID)
      .maybeSingle()
      .then(({ data }: { data: Record<string, string | null> | null }) => {
        if (data) {
          const merged: Firmendaten = {
            firmenname: data.firmenname ?? "",
            strasse:    data.strasse    ?? "",
            plz:        data.plz        ?? "",
            ort:        data.ort        ?? "",
            telefon:    data.telefon    ?? "",
            email:      data.email      ?? "",
            website:    data.website    ?? "",
            ust_id_nr:  data.ust_id_nr  ?? "",
          };
          setForm(merged);
          localStorage.setItem(FIRMENDATEN_LS_KEY, JSON.stringify(merged));
        }
      });
  }, []);

  function set(field: keyof Firmendaten, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      localStorage.setItem(FIRMENDATEN_LS_KEY, JSON.stringify(form));

      if (HAUPTACCOUNT_ID && supabaseConfigured) {
        const supabase = getBrowserClient()!;
        const { error: dbErr } = await supabase
          .from("company_settings")
          .upsert(
            { hauptaccount_id: HAUPTACCOUNT_ID, ...form },
            { onConflict: "hauptaccount_id" }
          );
        if (dbErr) throw dbErr;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4" style={sans}>
      <p className="text-[10px] text-white/30 uppercase tracking-widest">Firmendaten</p>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Firmenname */}
        <div>
          <label className={labelClass}>Firmenname</label>
          <input
            className={inputClass}
            value={form.firmenname}
            onChange={(e) => set("firmenname", e.target.value)}
            placeholder="Mustermann GmbH"
          />
        </div>

        {/* Adresse */}
        <div>
          <label className={labelClass}>Straße und Hausnummer</label>
          <input
            className={inputClass}
            value={form.strasse}
            onChange={(e) => set("strasse", e.target.value)}
            placeholder="Musterstraße 1"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>PLZ</label>
            <input
              className={inputClass}
              value={form.plz}
              onChange={(e) => set("plz", e.target.value)}
              placeholder="12345"
              maxLength={10}
            />
          </div>
          <div>
            <label className={labelClass}>Ort</label>
            <input
              className={inputClass}
              value={form.ort}
              onChange={(e) => set("ort", e.target.value)}
              placeholder="Musterstadt"
            />
          </div>
        </div>

        {/* Kontakt */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Telefon</label>
            <input
              className={inputClass}
              value={form.telefon}
              onChange={(e) => set("telefon", e.target.value)}
              placeholder="+49 89 123456"
            />
          </div>
          <div>
            <label className={labelClass}>E-Mail</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="info@firma.de"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Website <span className="text-white/20">(optional)</span></label>
            <input
              className={inputClass}
              value={form.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="www.firma.de"
            />
          </div>
          <div>
            <label className={labelClass}>USt-IdNr. <span className="text-white/20">(optional)</span></label>
            <input
              className={inputClass}
              value={form.ust_id_nr}
              onChange={(e) => set("ust_id_nr", e.target.value)}
              placeholder="DE123456789"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full text-sm py-2.5 rounded-lg border transition-all disabled:opacity-40"
          style={{
            backgroundColor: saved ? "rgba(30,122,107,0.2)" : "rgba(200,75,47,0.15)",
            borderColor:     saved ? "rgba(30,122,107,0.4)" : "rgba(200,75,47,0.35)",
            color:           saved ? "var(--c-teal)"        : "var(--c-accent)",
          }}
        >
          {saving ? "Wird gespeichert…" : saved ? "Gespeichert ✓" : "Firmendaten speichern"}
        </button>
      </form>

      <p className="text-xs text-white/25 leading-relaxed">
        Diese Daten erscheinen automatisch als Absender auf all Ihren Angeboten.
      </p>
    </div>
  );
}
