"use client";

import { useState } from "react";
import type { Employee, Land, Rolle, VertragTyp } from "@/types/dienstplan";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

const LAND_PREFIXES: Record<Land, string> = { DE: "+49", AT: "+43", CH: "+41" };

interface Props {
  onSuccess: (employee: Employee) => void;
  hauptaccountId: string;
}

export default function MitarbeiterForm({ onSuccess, hauptaccountId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [telefon, setTelefon] = useState("");
  const [rolle, setRolle] = useState<Rolle>("mitarbeiter");
  const [land, setLand] = useState<Land>("DE");
  const [stundenProWoche, setStundenProWoche] = useState(40);
  const [vertragTyp, setVertragTyp] = useState<VertragTyp>("vollzeit");
  const [urlaubTage, setUrlaubTage] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fullTelefon = `${LAND_PREFIXES[land]}${telefon.replace(/^0/, "")}`;

    try {
      const res = await fetch("/api/dienstplan/mitarbeiter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hauptaccount_id: hauptaccountId,
          name,
          email,
          telefon: fullTelefon,
          rolle,
          land,
          stunden_pro_woche: stundenProWoche,
          vertrag_typ: vertragTyp,
          urlaub_tage_jahr: urlaubTage,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fehler beim Anlegen.");

      setSuccess(true);
      onSuccess(data.employee);
      triggerZeitersparnisToast("Mitarbeiter eingeladen", 25);

      // Reset
      setName(""); setEmail(""); setTelefon("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" style={sans}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vorname Nachname"
          />
        </div>
        <div>
          <label className={labelClass}>E-Mail *</label>
          <input
            required
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mitarbeiter@beispiel.de"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Land</label>
          <select
            className={inputClass}
            value={land}
            onChange={(e) => setLand(e.target.value as Land)}
          >
            <option value="DE">🇩🇪 Deutschland</option>
            <option value="AT">🇦🇹 Österreich</option>
            <option value="CH">🇨🇭 Schweiz</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Telefonnummer *</label>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-white/40 bg-white/5 border border-white/15 rounded-lg px-3 py-2 flex-shrink-0">
              {LAND_PREFIXES[land]}
            </span>
            <input
              required
              className={inputClass}
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="1511234567"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Rolle</label>
          <select
            className={inputClass}
            value={rolle}
            onChange={(e) => setRolle(e.target.value as Rolle)}
          >
            <option value="mitarbeiter">Mitarbeiter</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Vertragsart</label>
          <select
            className={inputClass}
            value={vertragTyp}
            onChange={(e) => setVertragTyp(e.target.value as VertragTyp)}
          >
            <option value="vollzeit">Vollzeit</option>
            <option value="teilzeit">Teilzeit</option>
            <option value="minijob">Minijob</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Stunden pro Woche</label>
          <input
            type="number"
            min={1}
            max={60}
            step={0.5}
            className={inputClass}
            value={stundenProWoche}
            onChange={(e) => setStundenProWoche(parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className={labelClass}>Urlaubstage/Jahr</label>
          <input
            type="number"
            min={0}
            max={60}
            className={inputClass}
            value={urlaubTage}
            onChange={(e) => setUrlaubTage(parseInt(e.target.value))}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20" style={{ color: "var(--c-teal)" }}>
          Mitarbeiter angelegt & Einladungs-E-Mail versendet.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 text-sm py-2.5 px-4 rounded-lg border transition-colors disabled:opacity-40"
        style={{
          backgroundColor: "rgba(30,122,107,0.2)",
          borderColor: "rgba(30,122,107,0.4)",
          color: "var(--c-teal)",
        }}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        )}
        Mitarbeiter anlegen & einladen
      </button>
    </form>
  );
}
