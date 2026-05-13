"use client";

import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID  = "service_8b5ibjd";
const EMAILJS_TEMPLATE_ID = "template_emiu248";
const EMAILJS_PUBLIC_KEY  = "EfcnQ7wc4gnfWtpt5";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;
const serif = { fontFamily: "var(--font-dm-serif)" } as const;

const inputClass =
  "w-full bg-[#2a2620] border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

const KATEGORIEN = ["Fehler melden", "Funktion vorschlagen", "Lob", "Sonstiges"];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kategorie, setKategorie] = useState(KATEGORIEN[0]);
  const [nachricht, setNachricht] = useState("");
  const [sterne, setSterne] = useState(0);
  const [sterneHover, setSterneHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nachricht.trim().length < 20) {
      setError("Nachricht muss mindestens 20 Zeichen lang sein.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          email,
          kategorie,
          nachricht,
          sterne: sterne ? `${"★".repeat(sterne)}${"☆".repeat(5 - sterne)} (${sterne}/5)` : "Keine Bewertung",
        },
        EMAILJS_PUBLIC_KEY,
      );
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setNachricht(""); setSterne(0); }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-Mail konnte nicht gesendet werden.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={sans}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div>
            <h2 className="text-lg text-white" style={serif}>Feedback senden</h2>
            <p className="text-xs text-white/40 mt-0.5">Direkt an das Claaro-Team</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 16 16">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {success ? (
            <div className="py-8 text-center">
              <div
                className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4"
                style={{ backgroundColor: "rgba(30,122,107,0.2)" }}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" style={{ color: "var(--c-teal)" }}>
                  <path d="M5 12l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Vielen Dank!</p>
              <p className="text-white/50 text-sm">Dein Feedback ist angekommen.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    required
                    className={inputClass}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dein Name"
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
                    placeholder="deine@email.de"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Kategorie</label>
                <select
                  className={inputClass}
                  value={kategorie}
                  onChange={(e) => setKategorie(e.target.value)}
                >
                  {KATEGORIEN.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Bewertung</label>
                <div className="flex gap-1.5 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = n <= (sterneHover || sterne);
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSterne(n)}
                        onMouseEnter={() => setSterneHover(n)}
                        onMouseLeave={() => setSterneHover(0)}
                        aria-label={`${n} Stern${n > 1 ? "e" : ""}`}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className="w-7 h-7 transition-colors duration-100"
                          viewBox="0 0 24 24"
                          fill={filled ? "#c84b2f" : "none"}
                          stroke={filled ? "#c84b2f" : "rgba(255,255,255,0.2)"}
                          strokeWidth="1.5"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>Nachricht * (min. 20 Zeichen)</label>
                <textarea
                  required
                  rows={4}
                  className={`${inputClass} resize-none`}
                  value={nachricht}
                  onChange={(e) => setNachricht(e.target.value)}
                  placeholder="Was möchtest du uns mitteilen?"
                />
                <p className="text-right text-[10px] text-white/20 mt-1">
                  {nachricht.length} / 20 Zeichen
                </p>
              </div>

              {error && (
                <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || nachricht.trim().length < 20}
                className="w-full flex items-center justify-center gap-2 text-sm py-2.5 rounded-lg border transition-colors disabled:opacity-40"
                style={{
                  backgroundColor: "rgba(200,75,47,0.2)",
                  borderColor: "rgba(200,75,47,0.4)",
                  color: "var(--c-accent)",
                }}
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                    <path d="M2 8l5-5 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? "Wird gesendet…" : "Feedback senden"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
