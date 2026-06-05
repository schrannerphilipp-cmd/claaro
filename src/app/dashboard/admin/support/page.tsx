"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getBrowserClient } from "@/lib/supabase";
import FeatureLayout from "../../_components/feature-layout";

const ADMIN_ID = process.env.NEXT_PUBLIC_SUPABASE_HAUPTACCOUNT_ID ?? "";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

interface Anfrage {
  id:             string;
  user_email:     string;
  user_name:      string;
  betreff:        string;
  nachricht:      string;
  erstellt_am:    string;
  bearbeitet:     boolean;
  beantwortet_am: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [anfragen,    setAnfragen]    = useState<Anfrage[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [showAll,     setShowAll]     = useState(false);
  const [expanded,    setExpanded]    = useState<string | null>(null);
  const [isAdmin,     setIsAdmin]     = useState<boolean | null>(null);
  const [updating,    setUpdating]    = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) { router.replace("/dashboard"); return; }
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user || data.user.id !== ADMIN_ID) {
        router.replace("/dashboard");
      } else {
        setIsAdmin(true);
      }
    });
  }, [router]);

  const fetchAnfragen = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/support/anfragen?open=${!showAll}`);
    if (res.ok) {
      const json = await res.json();
      setAnfragen(json.anfragen ?? []);
    }
    setLoading(false);
  }, [showAll]);

  useEffect(() => {
    if (isAdmin) fetchAnfragen();
  }, [isAdmin, fetchAnfragen]);

  async function markBearbeitet(id: string, bearbeitet: boolean) {
    setUpdating(id);
    await fetch("/api/support/anfragen", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, bearbeitet }),
    });
    setAnfragen((prev) =>
      bearbeitet
        ? prev.filter((a) => a.id !== id)
        : prev.map((a) => a.id === id ? { ...a, bearbeitet: false, beantwortet_am: null } : a)
    );
    setUpdating(null);
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-[#241c14] flex items-center justify-center">
        <p className="text-white/40 text-sm">Wird geladen …</p>
      </div>
    );
  }

  const openCount = anfragen.filter((a) => !a.bearbeitet).length;

  return (
    <FeatureLayout
      name="Support-Anfragen"
      description="Offene Kundenanfragen einsehen, beantworten und als erledigt markieren."
    >
      <div className="space-y-5" style={sans}>
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/60">
              {loading ? "Lädt…" : `${openCount} offene ${openCount === 1 ? "Anfrage" : "Anfragen"}`}
            </span>
            {openCount > 0 && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.15)", color: "var(--c-accent)" }}
              >
                {openCount} neu
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
              style={
                showAll
                  ? { backgroundColor: "rgba(255,255,255,0.1)", borderColor: "rgba(255,255,255,0.2)", color: "white" }
                  : { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {showAll ? "Nur offene" : "Alle anzeigen"}
            </button>
            <button
              onClick={fetchAnfragen}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/4 text-white/50 hover:text-white hover:bg-white/8 transition-colors"
            >
              Aktualisieren ↻
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="c-skeleton rounded-xl h-20" />)}
          </div>
        ) : anfragen.length === 0 ? (
          <div className="py-20 text-center bg-white/5 border border-white/10 rounded-xl">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-sm text-white font-medium">Keine offenen Anfragen</p>
            <p className="text-xs text-white/45 mt-1">Alle Support-Anfragen wurden bearbeitet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {anfragen.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border transition-colors"
                style={{
                  backgroundColor: a.bearbeitet ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.05)",
                  borderColor:     a.bearbeitet ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.10)",
                }}
              >
                {/* Header row */}
                <div
                  className="flex items-start gap-4 px-5 py-4 cursor-pointer"
                  onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-white truncate">{a.user_name}</p>
                      <span className="text-xs text-white/40">&lt;{a.user_email}&gt;</span>
                      {!a.bearbeitet && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: "rgba(var(--c-accent-rgb),0.15)", color: "var(--c-accent)" }}
                        >
                          Neu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/70 truncate">{a.betreff}</p>
                    <p className="text-xs text-white/35 mt-0.5">{formatDate(a.erstellt_am)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* mailto reply */}
                    <a
                      href={`mailto:${a.user_email}?subject=Re: ${encodeURIComponent(a.betreff)}`}
                      className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/55 hover:text-white hover:bg-white/10 transition-colors"
                      title="E-Mail-Draft öffnen"
                    >
                      ✉ Antworten
                    </a>
                    <button
                      onClick={() => markBearbeitet(a.id, !a.bearbeitet)}
                      disabled={updating === a.id}
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
                      style={
                        a.bearbeitet
                          ? { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.40)" }
                          : { backgroundColor: "rgba(var(--c-teal-rgb),0.15)", borderColor: "rgba(var(--c-teal-rgb),0.30)", color: "var(--c-teal)" }
                      }
                    >
                      {updating === a.id ? "…" : a.bearbeitet ? "Wieder öffnen" : "✓ Beantwortet"}
                    </button>
                  </div>
                </div>

                {/* Expanded nachricht */}
                {expanded === a.id && (
                  <div
                    className="px-5 pb-5 border-t border-white/8 pt-4"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Nachricht</p>
                    <p className="text-sm text-white/70 leading-relaxed">{a.nachricht}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </FeatureLayout>
  );
}
