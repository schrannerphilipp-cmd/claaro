"use client";

import { useState, useEffect } from "react";
import type { Shift, ShiftSwap } from "@/types/dienstplan";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

type EnrichedSwap = ShiftSwap & {
  shift_original?: { datum: string; von: string; bis: string; rolle_im_dienst: string };
  shift_angebot?: { datum: string; von: string; bis: string; rolle_im_dienst: string } | null;
  emp_anfrage?: { name: string };
  emp_angebot?: { name: string } | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function statusColor(status: ShiftSwap["status"]) {
  if (status === "angenommen") return "var(--c-teal)";
  if (status === "abgelehnt") return "var(--c-accent)";
  return "var(--c-amber)";
}

interface Props {
  employeeId?: string;
  hauptaccountId?: string;
  isAdmin?: boolean;
  myShifts?: Shift[];
}

export default function TauschBoerse({ employeeId, hauptaccountId, isAdmin, myShifts = [] }: Props) {
  const [swaps, setSwaps] = useState<EnrichedSwap[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOwnShift, setSelectedOwnShift] = useState<string>("");
  const [selectedCounterShift, setSelectedCounterShift] = useState<string>("");
  const [offering, setOffering] = useState(false);

  useEffect(() => {
    loadSwaps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSwaps() {
    setLoading(true);
    try {
      const param = isAdmin && hauptaccountId
        ? `hauptaccount_id=${hauptaccountId}`
        : `employee_id=${employeeId}`;
      const res = await fetch(`/api/dienstplan/tausch?${param}`);
      const data = await res.json();
      setSwaps(data.swaps ?? []);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }

  async function anbieten() {
    if (!selectedOwnShift || !employeeId) return;
    setOffering(true);
    try {
      const res = await fetch("/api/dienstplan/tausch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aktion: "anbieten",
          shift_id_original: selectedOwnShift,
          employee_id_anfrage: employeeId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSwaps((prev) => [data.swap, ...prev]);
        setSelectedOwnShift("");
      }
    } catch {/* ignore */} finally {
      setOffering(false);
    }
  }

  async function gegenangebot(swapId: string) {
    if (!selectedCounterShift || !employeeId) return;
    await fetch("/api/dienstplan/tausch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aktion: "gegenangebot",
        swap_id: swapId,
        shift_id_angebot: selectedCounterShift,
        employee_id_angebot: employeeId,
      }),
    });
    loadSwaps();
    setSelectedCounterShift("");
  }

  async function adminEntscheiden(swapId: string, aktion: "genehmigen" | "ablehnen") {
    await fetch("/api/dienstplan/tausch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aktion, swap_id: swapId }),
    });
    loadSwaps();
  }

  const openSwaps = swaps.filter((s) => s.status === "offen");
  const mySwaps = swaps.filter((s) => s.employee_id_anfrage === employeeId);

  return (
    <div className="space-y-6" style={sans}>
      {/* Schicht zum Tausch anbieten (Mitarbeiter) */}
      {!isAdmin && myShifts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <p className="text-sm text-white/70 font-medium mb-4">Schicht zum Tausch anbieten</p>
          <div className="flex gap-2 flex-wrap">
            <select
              className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              value={selectedOwnShift}
              onChange={(e) => setSelectedOwnShift(e.target.value)}
            >
              <option value="">Schicht auswählen…</option>
              {myShifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.datum)} · {s.von.slice(0, 5)}–{s.bis.slice(0, 5)}
                  {s.rolle_im_dienst ? ` · ${s.rolle_im_dienst}` : ""}
                </option>
              ))}
            </select>
            <button
              onClick={anbieten}
              disabled={!selectedOwnShift || offering}
              className="text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-40"
              style={{ backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.3)", color: "var(--c-amber)" }}
            >
              {offering ? "Wird angeboten…" : "Anbieten"}
            </button>
          </div>
        </div>
      )}

      {/* Offene Tauschangebote (Mitarbeiter) */}
      {!isAdmin && openSwaps.length > 0 && (
        <div>
          <p className="text-sm text-white/60 font-medium mb-3">Offene Tauschangebote</p>
          <div className="space-y-2">
            {openSwaps
              .filter((s) => s.employee_id_anfrage !== employeeId)
              .map((swap) => (
                <div key={swap.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm text-white">
                        {swap.emp_anfrage?.name} bietet an:
                      </p>
                      {swap.shift_original && (
                        <p className="text-xs text-white/50 mt-0.5">
                          {formatDate(swap.shift_original.datum)} · {swap.shift_original.von.slice(0, 5)}–{swap.shift_original.bis.slice(0, 5)}
                          {swap.shift_original.rolle_im_dienst && ` · ${swap.shift_original.rolle_im_dienst}`}
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Gegenangebot */}
                  {myShifts.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      <select
                        className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-white/30"
                        value={selectedCounterShift}
                        onChange={(e) => setSelectedCounterShift(e.target.value)}
                      >
                        <option value="">Gegenangebot auswählen…</option>
                        {myShifts.map((s) => (
                          <option key={s.id} value={s.id}>
                            {formatDate(s.datum)} · {s.von.slice(0, 5)}–{s.bis.slice(0, 5)}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => gegenangebot(swap.id)}
                        disabled={!selectedCounterShift}
                        className="text-xs px-3 py-1.5 rounded-lg border disabled:opacity-40"
                        style={{ backgroundColor: "rgba(30,122,107,0.2)", borderColor: "rgba(30,122,107,0.4)", color: "var(--c-teal)" }}
                      >
                        Gegenangebot machen
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Alle Tausche (Admin) */}
      {isAdmin && (
        <div>
          <p className="text-sm text-white/60 font-medium mb-3">Alle Tausch-Anfragen</p>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-white/5 border border-white/10 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : swaps.length === 0 ? (
            <p className="text-sm text-white/30 text-center py-8">Keine Tausch-Anfragen.</p>
          ) : (
            <div className="space-y-2">
              {swaps.map((swap) => (
                <div key={swap.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full border"
                          style={{ color: statusColor(swap.status), borderColor: statusColor(swap.status) + "44", backgroundColor: statusColor(swap.status) + "18" }}
                        >
                          {swap.status}
                        </span>
                      </div>
                      <p className="text-sm text-white/70">
                        <span className="text-white">{swap.emp_anfrage?.name}</span> möchte tauschen
                        {swap.emp_angebot && <> mit <span className="text-white">{swap.emp_angebot.name}</span></>}
                      </p>
                      <div className="flex gap-4 mt-1">
                        {swap.shift_original && (
                          <p className="text-[10px] text-white/35">
                            Original: {formatDate(swap.shift_original.datum)} {swap.shift_original.von.slice(0, 5)}–{swap.shift_original.bis.slice(0, 5)}
                          </p>
                        )}
                        {swap.shift_angebot && (
                          <p className="text-[10px] text-white/35">
                            Gegenangebot: {formatDate(swap.shift_angebot.datum)} {swap.shift_angebot.von.slice(0, 5)}–{swap.shift_angebot.bis.slice(0, 5)}
                          </p>
                        )}
                      </div>
                    </div>
                    {swap.status === "offen" && swap.shift_id_angebot && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => adminEntscheiden(swap.id, "genehmigen")}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: "rgba(30,122,107,0.2)", borderColor: "rgba(30,122,107,0.4)", color: "var(--c-teal)" }}
                        >
                          Genehmigen
                        </button>
                        <button
                          onClick={() => adminEntscheiden(swap.id, "ablehnen")}
                          className="text-xs px-3 py-1.5 rounded-lg border"
                          style={{ backgroundColor: "rgba(200,75,47,0.1)", borderColor: "rgba(200,75,47,0.3)", color: "var(--c-accent)" }}
                        >
                          Ablehnen
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Meine Angebote (Mitarbeiter) */}
      {!isAdmin && mySwaps.length > 0 && (
        <div>
          <p className="text-sm text-white/60 font-medium mb-3">Meine Tauschangebote</p>
          <div className="space-y-2">
            {mySwaps.map((swap) => (
              <div key={swap.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  {swap.shift_original && (
                    <p className="text-sm text-white/60">
                      {formatDate(swap.shift_original.datum)} · {swap.shift_original.von.slice(0, 5)}–{swap.shift_original.bis.slice(0, 5)}
                    </p>
                  )}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full border flex-shrink-0"
                    style={{ color: statusColor(swap.status), borderColor: statusColor(swap.status) + "44", backgroundColor: statusColor(swap.status) + "18" }}
                  >
                    {swap.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
