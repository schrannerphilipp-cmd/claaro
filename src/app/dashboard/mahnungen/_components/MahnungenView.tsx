"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMahnung } from "@/app/actions/mahnungen";
import SepaMandatForm from "./SepaMandatForm";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type MahnungData = {
  id: string;
  stufe: number;
  versandtAm: string | null;
  kanal: string;
  status: string;
};

type SepaMandatData = {
  id: string;
  kontoinhaber: string;
  iban: string;
} | null;

type KundeData = {
  id: string;
  name: string;
  email: string;
  phone: string;
  sepaMandat: SepaMandatData;
};

type RechnungData = {
  id: string;
  rechnungsnummer: string;
  betrag: number;
  faelligkeitsdatum: string;
  status: string;
  kunde: KundeData;
  mahnungen: MahnungData[];
};

type DisplayStatus = "offen" | "überfällig" | "bezahlt" | "gemahnt";
type Kanal = "email" | "whatsapp";

// ── Constants ─────────────────────────────────────────────────────────────────

const STUFEN = [
  { stufe: 1, title: "Freundliche Erinnerung",    subtitle: "ab 1 Tag überfällig",    minDays: 1  },
  { stufe: 2, title: "Zweite Mahnung",             subtitle: "ab 7 Tagen überfällig",  minDays: 7  },
  { stufe: 3, title: "Letzte Mahnung vor Inkasso", subtitle: "ab 14 Tagen überfällig", minDays: 14 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysOverdue(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function getDisplayStatus(r: RechnungData): DisplayStatus {
  if (r.status === "bezahlt") return "bezahlt";
  if (r.status === "gemahnt") return "gemahnt";
  if (daysOverdue(r.faelligkeitsdatum) > 0) return "überfällig";
  return "offen";
}

function nextSendableStufe(r: RechnungData): 1 | 2 | 3 | null {
  const days = daysOverdue(r.faelligkeitsdatum);
  const sent = r.mahnungen.map((m) => m.stufe);
  for (const { stufe, minDays } of STUFEN) {
    if (!sent.includes(stufe) && days >= minDays) return stufe as 1 | 2 | 3;
  }
  return null;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function maskIban(iban: string) {
  if (iban.length < 8) return iban;
  return iban.slice(0, 4) + " •••• •••• " + iban.slice(-4);
}

// ── Small UI components ───────────────────────────────────────────────────────

const BADGE_STYLES: Record<DisplayStatus, { bg: string; color: string; label: string }> = {
  offen:      { bg: "rgba(245,158,11,0.12)",  color: "var(--c-amber)",  label: "Offen"      },
  überfällig: { bg: "rgba(200,75,47,0.18)",   color: "var(--c-accent)", label: "Überfällig" },
  bezahlt:    { bg: "rgba(30,122,107,0.18)",  color: "var(--c-teal)",   label: "Bezahlt"    },
  gemahnt:    { bg: "rgba(245,158,11,0.12)",  color: "var(--c-amber)",  label: "Gemahnt"    },
};

function StatusBadge({ status }: { status: DisplayStatus }) {
  const s = BADGE_STYLES[status];
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

const MAHNUNG_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  ausstehend: { bg: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)", label: "Ausstehend" },
  gesendet:   { bg: "rgba(30,122,107,0.18)",  color: "var(--c-teal)",         label: "Gesendet"   },
  bezahlt:    { bg: "rgba(30,122,107,0.28)",  color: "var(--c-teal)",         label: "Bezahlt"    },
};

function MahnungPill({ status }: { status: string }) {
  const s = MAHNUNG_STATUS[status] ?? MAHNUNG_STATUS.ausstehend;
  return (
    <span
      className="text-xs px-2.5 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

function KanalToggle({ value, onChange }: { value: Kanal; onChange: (k: Kanal) => void }) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-white/10 text-xs font-medium">
      {(["email", "whatsapp"] as Kanal[]).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className="flex items-center gap-1.5 px-3 py-1.5 transition-colors"
          style={
            value === k
              ? { backgroundColor: "rgba(200,75,47,0.18)", color: "var(--c-accent)" }
              : { color: "rgba(255,255,255,0.4)" }
          }
        >
          {k === "email" ? (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
              <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.3" />
              <path d="M1 5l7 5 7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
              <path d="M2 13l1-3A6 6 0 1 1 5 12l-3 1z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
            </svg>
          )}
          {k === "email" ? "E-Mail" : "WhatsApp"}
        </button>
      ))}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer group">
      <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors select-none">
        {label}
      </span>
      <div
        onClick={() => onChange(!checked)}
        className="relative w-8 h-4.5 rounded-full transition-colors shrink-0"
        style={{
          backgroundColor: checked ? "var(--c-teal)" : "rgba(255,255,255,0.12)",
          height: "18px",
          width: "32px",
        }}
      >
        <div
          className="absolute top-0.5 rounded-full bg-white transition-transform"
          style={{
            width: "14px",
            height: "14px",
            transform: checked ? "translateX(16px)" : "translateX(2px)",
          }}
        />
      </div>
    </label>
  );
}

// ── Eskalations-Timeline ──────────────────────────────────────────────────────

function EskalationsTimeline({
  rechnung,
  onClose,
}: {
  rechnung: RechnungData;
  onClose: () => void;
}) {
  const router = useRouter();
  const [kanal, setKanal] = useState<Kanal>("email");
  const [sepaEnabled, setSepaEnabled] = useState(false);
  const [showMandatForm, setShowMandatForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const days = daysOverdue(rechnung.faelligkeitsdatum);
  const nextStufe = nextSendableStufe(rechnung);
  const allSent = rechnung.mahnungen.length >= 3;
  const isPaid = rechnung.status === "bezahlt";
  const hasMandat = rechnung.kunde.sepaMandat !== null;

  function handleSepaToggle(val: boolean) {
    setSepaEnabled(val);
    if (val && !hasMandat) setShowMandatForm(true);
    if (!val) setShowMandatForm(false);
  }

  function handleSend() {
    setFeedback(null);
    startTransition(async () => {
      const result = await sendMahnung(rechnung.id, kanal, sepaEnabled);
      if (result.success) {
        setFeedback({ ok: true, msg: `Stufe ${result.stufe} erfolgreich gesendet.` });
        router.refresh();
      } else {
        setFeedback({ ok: false, msg: result.error });
      }
    });
  }

  const canSend = nextStufe !== null && !isPaid && !isPending;
  const stufeLabel =
    nextStufe !== null
      ? `Stufe ${nextStufe} senden`
      : allSent
      ? "Alle Stufen gesendet"
      : "Noch nicht verfügbar";

  return (
    <aside className="bg-white/5 border border-white/10 rounded-xl p-6 shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs text-white/35 uppercase tracking-wider mb-1">
            Eskalationsstufen
          </p>
          <p className="text-white font-medium text-sm" style={serif}>
            {rechnung.kunde.name}
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {rechnung.rechnungsnummer} · {formatCurrency(rechnung.betrag)}
          </p>
        </div>
        <button
          onClick={onClose}
          aria-label="Schließen"
          className="text-white/30 hover:text-white/70 transition-colors p-1 -mr-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Steps */}
      <div className="mb-6">
        {STUFEN.map(({ stufe, title, subtitle, minDays }, i) => {
          const mahnung = rechnung.mahnungen.find((m) => m.stufe === stufe);
          const available = days >= minDays;
          const mahnungStatus = mahnung?.status ?? (available ? "ausstehend" : null);
          const done = mahnung && mahnung.status !== "ausstehend";
          const isLast = i === STUFEN.length - 1;

          return (
            <div key={stufe} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="relative z-10 mt-0.5">
                  {done ? (
                    <div className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "var(--c-teal)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    </div>
                  ) : available ? (
                    <div className="w-4 h-4 rounded-full border-2"
                      style={{ borderColor: "var(--c-accent)" }} />
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-white/10" />
                  )}
                </div>
                {!isLast && (
                  <div className="w-px flex-1 mt-1 mb-1"
                    style={{
                      backgroundColor: available ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.05)",
                      minHeight: "28px",
                    }} />
                )}
              </div>
              <div className={`pb-6 min-w-0 ${!available ? "opacity-35" : ""}`}>
                <p className="text-sm font-medium text-white leading-snug">
                  Stufe {stufe} — {title}
                </p>
                <p className="text-xs text-white/40 mt-0.5 mb-2">{subtitle}</p>
                {mahnungStatus ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <MahnungPill status={mahnungStatus} />
                    {mahnung?.kanal && mahnung.status !== "ausstehend" && (
                      <span className="text-xs text-white/30 capitalize">{mahnung.kanal}</span>
                    )}
                    {mahnung?.versandtAm && (
                      <span className="text-xs text-white/30">{formatDate(mahnung.versandtAm)}</span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-white/25">Noch nicht verfügbar</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Send action */}
      {!isPaid && (
        <div className="border-t border-white/10 pt-4 space-y-3">
          {/* SEPA toggle */}
          <Toggle
            label="SEPA-Lastschrift anbieten"
            checked={sepaEnabled}
            onChange={handleSepaToggle}
          />

          {/* SEPA mandat info / form */}
          {sepaEnabled && (
            <div
              className="rounded-lg p-3 space-y-2"
              style={{ backgroundColor: "rgba(30,122,107,0.08)", border: "1px solid rgba(30,122,107,0.2)" }}
            >
              {hasMandat ? (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: "rgba(30,122,107,0.2)", color: "var(--c-teal)" }}
                    >
                      SEPA Mandat vorhanden
                    </span>
                  </div>
                  <p className="text-xs text-white/40">
                    {rechnung.kunde.sepaMandat!.kontoinhaber} ·{" "}
                    {maskIban(rechnung.kunde.sepaMandat!.iban)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--c-teal)", opacity: 0.8 }}>
                    SEPA-Option wird in der Nachricht erwähnt.
                  </p>
                </>
              ) : showMandatForm ? (
                <>
                  <p className="text-xs text-white/50 font-medium">Mandat erfassen</p>
                  <SepaMandatForm
                    kundeId={rechnung.kunde.id}
                    onSaved={() => {
                      setShowMandatForm(false);
                    }}
                  />
                </>
              ) : (
                <button
                  onClick={() => setShowMandatForm(true)}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "var(--c-teal)" }}
                >
                  + Mandat jetzt erfassen
                </button>
              )}
            </div>
          )}

          {/* Kanal + send */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-white/40">Kanal</span>
            <KanalToggle value={kanal} onChange={setKanal} />
          </div>

          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-full text-sm font-medium py-2.5 px-4 rounded-lg transition-all"
            style={
              canSend
                ? { backgroundColor: "var(--c-accent)", color: "#fff" }
                : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
            }
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"
                    strokeDasharray="20" strokeDashoffset="10" />
                </svg>
                Wird gesendet…
              </span>
            ) : stufeLabel}
          </button>

          {feedback && (
            <p
              className="text-xs text-center py-1.5 rounded-lg px-3"
              style={
                feedback.ok
                  ? { backgroundColor: "rgba(30,122,107,0.15)", color: "var(--c-teal)" }
                  : { backgroundColor: "rgba(200,75,47,0.15)", color: "var(--c-accent)" }
              }
            >
              {feedback.msg}
            </p>
          )}
        </div>
      )}

      {isPaid && (
        <div className="border-t border-white/10 pt-4">
          <p
            className="text-xs text-center py-2 rounded-lg"
            style={{ backgroundColor: "rgba(30,122,107,0.15)", color: "var(--c-teal)" }}
          >
            Diese Rechnung wurde bezahlt.
          </p>
        </div>
      )}
    </aside>
  );
}

// ── Main view ─────────────────────────────────────────────────────────────────

export default function MahnungenView({ rechnungen }: { rechnungen: RechnungData[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = rechnungen.find((r) => r.id === selectedId) ?? null;

  function toggleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <>
      {/* Action row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/40">
          {rechnungen.length} {rechnungen.length === 1 ? "Rechnung" : "Rechnungen"}
        </p>
        <button className="text-sm font-medium px-4 py-2 rounded-lg border border-white/15 text-white/70 hover:text-white hover:bg-white/5 transition-colors">
          + Neue Rechnung
        </button>
      </div>

      {rechnungen.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl py-20 px-8 text-center">
          <p className="text-2xl mb-4" aria-hidden="true">✅</p>
          <p className="text-white font-semibold mb-2">Keine offenen Rechnungen</p>
          <p className="text-white/40 text-sm">Alle Rechnungen wurden beglichen.</p>
        </div>
      ) : (
        <div className={`grid grid-cols-1 gap-6 items-start ${selected ? "lg:grid-cols-[1fr_340px]" : ""}`}>
          {/* Rechnungs-Übersicht */}
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-white/10">
                    {["Kunde", "Rechnungsnr.", "Betrag", "Fällig am", "Status", ""].map((h, i) => (
                      <th
                        key={i}
                        className={`px-5 py-3 text-xs font-medium uppercase tracking-wider text-white/30 ${
                          i === 2 || i === 3 ? "text-right" : "text-left"
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rechnungen.map((r) => {
                    const ds = getDisplayStatus(r);
                    const isSelected = r.id === selectedId;
                    const days = daysOverdue(r.faelligkeitsdatum);
                    const canSendNext = nextSendableStufe(r) !== null && r.status !== "bezahlt";

                    return (
                      <tr
                        key={r.id}
                        onClick={() => toggleSelect(r.id)}
                        className={`border-b border-white/5 last:border-b-0 cursor-pointer transition-colors ${
                          isSelected ? "bg-white/10" : "hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Kunde + SEPA badge */}
                        <td className="px-5 py-4">
                          <p className="text-sm text-white font-medium">{r.kunde.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-white/35">{r.kunde.email}</p>
                            {r.kunde.sepaMandat && (
                              <span
                                className="text-xs px-1.5 py-px rounded font-medium"
                                style={{ backgroundColor: "rgba(30,122,107,0.2)", color: "var(--c-teal)" }}
                              >
                                SEPA
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-sm text-white/60 font-mono">{r.rechnungsnummer}</span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="text-sm text-white font-medium">
                            {formatCurrency(r.betrag)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span
                            className="text-sm"
                            style={{
                              color: ds === "überfällig" ? "var(--c-accent)" : "rgba(255,255,255,0.55)",
                            }}
                          >
                            {formatDate(r.faelligkeitsdatum)}
                          </span>
                          {days > 0 && ds !== "bezahlt" && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--c-accent)", opacity: 0.7 }}>
                              {days} {days === 1 ? "Tag" : "Tage"} überfällig
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <StatusBadge status={ds} />
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                            style={
                              canSendNext
                                ? { backgroundColor: "rgba(200,75,47,0.12)", color: "var(--c-accent)" }
                                : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)" }
                            }
                          >
                            Mahnung senden
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Eskalationsstufen */}
          {selected && (
            <EskalationsTimeline
              key={selected.id}
              rechnung={selected}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      )}
    </>
  );
}
