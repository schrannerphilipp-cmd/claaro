"use client";

import { useState, useEffect } from "react";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";
import { FIRMENDATEN_LS_KEY, type Firmendaten } from "@/components/settings/FirmendatenForm";

const LOGO_LS_KEY = "claaro-logo-url";

const EMPTY_FIRMA: Firmendaten = {
  firmenname: "", strasse: "", plz: "", ort: "",
  telefon: "", email: "", website: "", ust_id_nr: "",
};

type Kundendaten = {
  firma: string;
  kontakt: string;
  strasse: string;
  plz: string;
  ort: string;
  email: string;
};

type Leistung = {
  id: string;
  beschreibung: string;
  menge: string;
  einheit: string;
  einzelpreis: string;
};

const EINHEITEN = ["Stück", "Std.", "Tage", "Pauschal", "m²", "lfd. m"];
const MwSt = 0.19;

function formatEuro(value: number): string {
  return value.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseDecimal(value: string): number {
  return parseFloat(value.replace(",", ".")) || 0;
}

function neueLeistung(): Leistung {
  return {
    id: crypto.randomUUID(),
    beschreibung: "",
    menge: "1",
    einheit: "Stück",
    einzelpreis: "",
  };
}

const SCHRITTE = ["Kundendaten", "Leistungen", "Vorschau"];

const inputClass =
  "w-full border border-[#1a1814]/20 rounded-lg px-3.5 py-2.5 text-sm text-[#1a1814] placeholder:text-[#1a1814]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent";

export default function AngebotFormular() {
  const [schritt, setSchritt] = useState(0);
  const [kunde, setKunde] = useState<Kundendaten>({
    firma: "",
    kontakt: "",
    strasse: "",
    plz: "",
    ort: "",
    email: "",
  });
  const [leistungen, setLeistungen] = useState<Leistung[]>([neueLeistung()]);
  const [angebotsnummer] = useState(
    () => `AN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const [angebotsdatum] = useState(
    () => new Date().toLocaleDateString("de-DE")
  );
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [firma, setFirma] = useState<Firmendaten>(EMPTY_FIRMA);

  useEffect(() => {
    setLogoUrl(localStorage.getItem(LOGO_LS_KEY));
    try {
      const raw = localStorage.getItem(FIRMENDATEN_LS_KEY);
      if (raw) setFirma({ ...EMPTY_FIRMA, ...JSON.parse(raw) });
    } catch {/* ignore */}
  }, []);

  const netto = leistungen.reduce((sum, l) => {
    return sum + parseDecimal(l.menge) * parseDecimal(l.einzelpreis);
  }, 0);
  const mwstBetrag = netto * MwSt;
  const brutto = netto + mwstBetrag;

  const kundeValid =
    kunde.firma.trim() !== "" &&
    kunde.strasse.trim() !== "" &&
    kunde.plz.trim() !== "" &&
    kunde.ort.trim() !== "";

  const leistungenValid = leistungen.every(
    (l) => l.beschreibung.trim() !== "" && parseDecimal(l.einzelpreis) > 0
  );

  function updateLeistung(id: string, field: keyof Leistung, value: string) {
    setLeistungen((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [field]: value } : l))
    );
  }

  function leistungHinzufuegen() {
    setLeistungen((prev) => [...prev, neueLeistung()]);
  }

  function leistungEntfernen(id: string) {
    setLeistungen((prev) => prev.filter((l) => l.id !== id));
  }

  function drucken() {
    window.print();
  }

  return (
    <div>
      {/* Fortschrittsanzeige */}
      <div className="flex items-center gap-2 mb-8 print:hidden">
        {SCHRITTE.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                i <= schritt
                  ? "bg-[#c84b2f] text-white"
                  : "bg-white/20 text-white/40"
              }`}
            >
              {i < schritt ? "✓" : i + 1}
            </div>
            <span
              className={`text-sm font-medium ${
                i === schritt ? "text-white" : "text-white/40"
              }`}
            >
              {name}
            </span>
            {i < SCHRITTE.length - 1 && (
              <div
                className={`h-px w-8 ${
                  i < schritt ? "bg-[#c84b2f]" : "bg-white/20"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Schritt 1: Kundendaten */}
      {schritt === 0 && (
        <div className="bg-[#f2ede4] rounded-xl border border-[#1a1814]/10 p-8">
          <h2 className="text-xl font-semibold text-[#1a1814] mb-6">
            Kundendaten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                Firma / Kundenname <span className="text-[#c84b2f]">*</span>
              </label>
              <input
                type="text"
                value={kunde.firma}
                onChange={(e) => setKunde({ ...kunde, firma: e.target.value })}
                placeholder="Mustermann GmbH"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                Ansprechpartner
              </label>
              <input
                type="text"
                value={kunde.kontakt}
                onChange={(e) => setKunde({ ...kunde, kontakt: e.target.value })}
                placeholder="Max Mustermann"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                E-Mail
              </label>
              <input
                type="email"
                value={kunde.email}
                onChange={(e) => setKunde({ ...kunde, email: e.target.value })}
                placeholder="max@beispiel.de"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                Straße und Hausnummer <span className="text-[#c84b2f]">*</span>
              </label>
              <input
                type="text"
                value={kunde.strasse}
                onChange={(e) => setKunde({ ...kunde, strasse: e.target.value })}
                placeholder="Musterstraße 1"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                PLZ <span className="text-[#c84b2f]">*</span>
              </label>
              <input
                type="text"
                value={kunde.plz}
                onChange={(e) => setKunde({ ...kunde, plz: e.target.value })}
                placeholder="12345"
                maxLength={5}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">
                Ort <span className="text-[#c84b2f]">*</span>
              </label>
              <input
                type="text"
                value={kunde.ort}
                onChange={(e) => setKunde({ ...kunde, ort: e.target.value })}
                placeholder="Musterstadt"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={() => setSchritt(1)}
              disabled={!kundeValid}
              className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter: Leistungen →
            </button>
          </div>
        </div>
      )}

      {/* Schritt 2: Leistungen */}
      {schritt === 1 && (
        <div className="bg-[#f2ede4] rounded-xl border border-[#1a1814]/10 p-8">
          <h2 className="text-xl font-semibold text-[#1a1814] mb-6">
            Leistungen & Positionen
          </h2>

          <div className="space-y-3">
            {/* Tabellenkopf */}
            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-[#1a1814]/50 uppercase tracking-wide px-1">
              <div className="col-span-5">Beschreibung</div>
              <div className="col-span-2">Menge</div>
              <div className="col-span-2">Einheit</div>
              <div className="col-span-2">Einzelpreis (€)</div>
              <div className="col-span-1" />
            </div>

            {leistungen.map((l, idx) => (
              <div key={l.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-5">
                  <input
                    type="text"
                    value={l.beschreibung}
                    onChange={(e) =>
                      updateLeistung(l.id, "beschreibung", e.target.value)
                    }
                    placeholder={`Position ${idx + 1}: z. B. Beratungsleistung`}
                    className={inputClass}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    value={l.menge}
                    onChange={(e) =>
                      updateLeistung(l.id, "menge", e.target.value)
                    }
                    placeholder="1"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <select
                    value={l.einheit}
                    onChange={(e) =>
                      updateLeistung(l.id, "einheit", e.target.value)
                    }
                    className="w-full border border-[#1a1814]/20 rounded-lg px-3 py-2.5 text-sm text-[#1a1814] bg-white focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent"
                  >
                    {EINHEITEN.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    type="text"
                    value={l.einzelpreis}
                    onChange={(e) =>
                      updateLeistung(l.id, "einzelpreis", e.target.value)
                    }
                    placeholder="0,00"
                    className={inputClass}
                  />
                </div>
                <div className="col-span-1 flex items-center justify-center pt-1">
                  <button
                    onClick={() => leistungEntfernen(l.id)}
                    disabled={leistungen.length === 1}
                    className="text-[#1a1814]/30 hover:text-[#c84b2f] transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-lg leading-none"
                    title="Position entfernen"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={leistungHinzufuegen}
            className="mt-4 text-sm text-[#c84b2f] hover:text-[#b03f25] font-medium transition-colors flex items-center gap-1"
          >
            + Position hinzufügen
          </button>

          {/* Summen-Vorschau */}
          <div className="mt-8 border-t border-[#1a1814]/10 pt-6">
            <div className="flex flex-col items-end gap-1.5 text-sm">
              <div className="flex gap-8 text-[#1a1814]/60">
                <span>Nettobetrag</span>
                <span className="w-28 text-right">{formatEuro(netto)} €</span>
              </div>
              <div className="flex gap-8 text-[#1a1814]/60">
                <span>zzgl. 19 % MwSt.</span>
                <span className="w-28 text-right">{formatEuro(mwstBetrag)} €</span>
              </div>
              <div className="flex gap-8 font-semibold text-[#1a1814] text-base mt-1 pt-2 border-t border-[#1a1814]/10">
                <span>Gesamtbetrag</span>
                <span className="w-28 text-right">{formatEuro(brutto)} €</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={() => setSchritt(0)}
              className="text-[#1a1814]/70 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#1a1814]/10 transition-colors border border-[#1a1814]/20"
            >
              ← Zurück
            </button>
            <button
              onClick={() => { setSchritt(2); triggerZeitersparnisToast("Angebot erstellt", 45); }}
              disabled={!leistungenValid}
              className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Weiter: Vorschau →
            </button>
          </div>
        </div>
      )}

      {/* Schritt 3: Vorschau / Druck */}
      {schritt === 2 && (
        <>
          {/* Druckaktionen (nur am Bildschirm sichtbar) */}
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button
              onClick={() => setSchritt(1)}
              className="text-white/70 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors border border-white/20"
            >
              ← Bearbeiten
            </button>
            <button
              onClick={drucken}
              className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors flex items-center gap-2"
            >
              🖨️ Als PDF speichern / Drucken
            </button>
          </div>

          {/* Angebotsdokument – bleibt hell, da Druckvorschau */}
          <div className="bg-white rounded-xl border border-white/10 p-12 print:border-0 print:rounded-none print:shadow-none print:p-0">
            {/* Kopfzeile */}
            <div className="flex justify-between items-start mb-12">
              {/* Absender links */}
              <div className="space-y-2">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="Firmen-Logo" className="max-w-[200px] max-h-[80px] object-contain mb-2" />
                ) : null}
                {firma.firmenname ? (
                  <p className="font-bold text-gray-900 text-base">{firma.firmenname}</p>
                ) : (
                  !logoUrl && <h1 className="text-2xl font-bold text-[#c84b2f] tracking-tight">Claaro</h1>
                )}
                {(firma.strasse || firma.plz || firma.ort) && (
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {firma.strasse && <p>{firma.strasse}</p>}
                    {(firma.plz || firma.ort) && <p>{[firma.plz, firma.ort].filter(Boolean).join(" ")}</p>}
                  </div>
                )}
                {(firma.telefon || firma.email) && (
                  <div className="text-sm text-gray-500 leading-relaxed">
                    {firma.telefon && <p>Tel: {firma.telefon}</p>}
                    {firma.email && <p>{firma.email}</p>}
                  </div>
                )}
                {firma.website && <p className="text-sm text-gray-500">{firma.website}</p>}
              </div>

              {/* Angebotsdaten rechts */}
              <div className="text-right text-sm text-gray-600 shrink-0 ml-8">
                <p className="font-semibold text-gray-900 text-base">
                  Angebot {angebotsnummer}
                </p>
                <p className="mt-1">Datum: {angebotsdatum}</p>
                <p>
                  Gültig bis:{" "}
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE")}
                </p>
              </div>
            </div>

            {/* Empfänger */}
            <div className="mb-10">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                Angebot für
              </p>
              <p className="font-semibold text-gray-900">{kunde.firma}</p>
              {kunde.kontakt && (
                <p className="text-gray-600">z. Hd. {kunde.kontakt}</p>
              )}
              <p className="text-gray-600">{kunde.strasse}</p>
              <p className="text-gray-600">
                {kunde.plz} {kunde.ort}
              </p>
              {kunde.email && <p className="text-gray-600">{kunde.email}</p>}
            </div>

            {/* Betreff */}
            <p className="font-semibold text-gray-900 mb-6">
              Angebot {angebotsnummer}
            </p>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              vielen Dank für Ihre Anfrage. Wir freuen uns, Ihnen folgendes
              Angebot zu unterbreiten:
            </p>

            {/* Positionstabelle */}
            <table className="w-full text-sm mb-8">
              <thead>
                <tr className="bg-[#f2ede4] text-[#1a1814]/70">
                  <th className="text-left px-4 py-3 rounded-l-lg font-medium w-8">
                    Pos.
                  </th>
                  <th className="text-left px-4 py-3 font-medium">
                    Beschreibung
                  </th>
                  <th className="text-right px-4 py-3 font-medium w-20">
                    Menge
                  </th>
                  <th className="text-right px-4 py-3 font-medium w-24">
                    Einzelpreis
                  </th>
                  <th className="text-right px-4 py-3 rounded-r-lg font-medium w-28">
                    Gesamtpreis
                  </th>
                </tr>
              </thead>
              <tbody>
                {leistungen.map((l, idx) => {
                  const pos =
                    parseDecimal(l.menge) * parseDecimal(l.einzelpreis);
                  return (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {l.beschreibung}
                        <span className="text-gray-400 ml-1 text-xs">
                          ({l.einheit})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {l.menge}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatEuro(parseDecimal(l.einzelpreis))} €
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">
                        {formatEuro(pos)} €
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summen */}
            <div className="flex justify-end">
              <div className="w-72 text-sm">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Nettobetrag</span>
                  <span>{formatEuro(netto)} €</span>
                </div>
                <div className="flex justify-between py-2 text-gray-600 border-b border-gray-100">
                  <span>zzgl. 19 % Mehrwertsteuer</span>
                  <span>{formatEuro(mwstBetrag)} €</span>
                </div>
                <div className="flex justify-between py-3 font-bold text-gray-900 text-base">
                  <span>Gesamtbetrag</span>
                  <span>{formatEuro(brutto)} €</span>
                </div>
              </div>
            </div>

            {/* Fußtext */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-xs text-gray-400">
              <div className="flex justify-between gap-8">
                <div className="space-y-0.5">
                  <p>Dieses Angebot ist 30 Tage gültig. Bitte nehmen Sie das Angebot schriftlich an.</p>
                  {firma.ust_id_nr && <p>USt-IdNr.: {firma.ust_id_nr}</p>}
                </div>
                {firma.firmenname && (
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="font-medium text-gray-500">{firma.firmenname}</p>
                    {(firma.strasse || firma.plz || firma.ort) && (
                      <p>{[firma.strasse, [firma.plz, firma.ort].filter(Boolean).join(" ")].filter(Boolean).join(", ")}</p>
                    )}
                    {firma.telefon && <p>Tel: {firma.telefon}</p>}
                    {firma.email && <p>{firma.email}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
