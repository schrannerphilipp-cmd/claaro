"use client";

import { useState, useEffect, useRef } from "react";
import { getBrowserClient } from "@/lib/supabase";

type Status = "offen" | "angenommen" | "abgelehnt";

type Angebot = {
  id: string;
  angebotsnummer: string;
  angebotsdatum: string;
  kunde_firma: string;
  kunde_email: string | null;
  brutto: number;
  rabatt: number;
  status: Status;
};

const STATUS: Record<Status, { label: string; badge: string; dot: string }> = {
  offen:      { label: "Offen",      badge: "bg-amber-400/15 text-amber-300 border border-amber-400/25",    dot: "bg-amber-400" },
  angenommen: { label: "Angenommen", badge: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/25", dot: "bg-emerald-400" },
  abgelehnt:  { label: "Abgelehnt",  badge: "bg-red-400/15 text-red-400 border border-red-400/25",          dot: "bg-red-400" },
};

function formatEuro(v: number) {
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE");
}

export default function AngeboteListe() {
  const [angebote, setAngebote] = useState<Angebot[]>([]);
  const [laden, setLaden]       = useState(true);
  const [openId, setOpenId]     = useState<string | null>(null);
  const listRef                 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (listRef.current && !listRef.current.contains(e.target as Node))
        setOpenId(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) { setLaden(false); return; }
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLaden(false); return; }
      supabase
        .from("angebote")
        .select("id,angebotsnummer,angebotsdatum,kunde_firma,kunde_email,brutto,rabatt,status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          if (data) setAngebote(data as Angebot[]);
          setLaden(false);
        });
    });
  }, []);

  async function statusAendern(id: string, status: Status) {
    setAngebote(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    setOpenId(null);
    const supabase = getBrowserClient();
    if (!supabase) return;
    await supabase.from("angebote")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
  }

  if (laden) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white/70 animate-spin" />
      </div>
    );
  }

  if (angebote.length === 0) return null;

  return (
    <div ref={listRef} className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Meine Angebote</h2>
        <span className="text-xs text-white/30">{angebote.length} Angebot{angebote.length !== 1 ? "e" : ""}</span>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-visible">
        {/* Tabellenkopf (Desktop) */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 text-xs font-medium text-white/25 uppercase tracking-wide border-b border-white/5">
          <div className="col-span-2">Nummer</div>
          <div className="col-span-2">Datum</div>
          <div className="col-span-4">Kunde</div>
          <div className="col-span-2 text-right">Brutto</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        <div className="divide-y divide-white/5">
          {angebote.map(a => (
            <div key={a.id} className="grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-white/[0.03] transition-colors">
              {/* Nummer */}
              <div className="col-span-7 md:col-span-2">
                <p className="text-sm font-mono text-white/60 tracking-tight">{a.angebotsnummer}</p>
              </div>
              {/* Datum (mobile: rechts oben) */}
              <div className="col-span-5 md:col-span-2 text-right md:text-left">
                <p className="text-sm text-white/35">{formatDatum(a.angebotsdatum)}</p>
              </div>
              {/* Kunde */}
              <div className="col-span-12 md:col-span-4 md:mt-0 -mt-1">
                <p className="text-sm font-medium text-white">{a.kunde_firma}</p>
                {a.kunde_email && (
                  <p className="text-xs text-white/30 mt-0.5 truncate">{a.kunde_email}</p>
                )}
              </div>
              {/* Betrag */}
              <div className="col-span-5 md:col-span-2 md:text-right">
                <p className="text-sm font-semibold text-white">{formatEuro(a.brutto)} €</p>
                {a.rabatt > 0 && (
                  <p className="text-xs text-white/25 mt-0.5">{a.rabatt} % Rabatt</p>
                )}
              </div>
              {/* Status */}
              <div className="col-span-7 md:col-span-2 flex justify-end">
                <div className="relative">
                  <button
                    onClick={() => setOpenId(openId === a.id ? null : a.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity hover:opacity-80 ${STATUS[a.status].badge}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS[a.status].dot}`} />
                    {STATUS[a.status].label}
                    <svg className="w-3 h-3 opacity-40 ml-0.5" fill="none" viewBox="0 0 12 12">
                      <path d="M2.5 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {openId === a.id && (
                    <div className="absolute right-0 top-8 z-40 w-38 bg-[#23211c] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      {(["offen", "angenommen", "abgelehnt"] as Status[]).map(s => (
                        <button
                          key={s}
                          onClick={() => statusAendern(a.id, s)}
                          className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs text-left transition-colors hover:bg-white/5 ${a.status === s ? "text-white" : "text-white/45"}`}
                        >
                          <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS[s].dot}`} />
                          {STATUS[s].label}
                          {a.status === s && <span className="ml-auto text-white/30 text-[10px]">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
