"use client";

import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import { triggerZeitersparnisToast } from "@/lib/zeitersparnis";
import { FIRMENDATEN_LS_KEY, type Firmendaten } from "@/components/settings/FirmendatenForm";
import { getBrowserClient } from "@/lib/supabase";

const LOGO_LS_KEY     = "claaro-logo-url";
const VORLAGEN_LS_KEY = "claaro-vorlagen";

const EMAILJS_SERVICE_ID  = "service_8b5ibjd";
const EMAILJS_ANGEBOT_TID = "template_angebot";
const EMAILJS_PUBLIC_KEY  = "EfcnQ7wc4gnfWtpt5";

const EMPTY_FIRMA: Firmendaten = {
  firmenname: "", strasse: "", plz: "", ort: "",
  telefon: "", email: "", website: "", ust_id_nr: "",
};

type Kundendaten = {
  firma: string; kontakt: string; strasse: string;
  plz: string; ort: string; email: string;
};

type MwStSatz = 0 | 7 | 19;

type Leistung = {
  id: string; beschreibung: string; menge: string;
  einheit: string; einzelpreis: string; mwst: MwStSatz;
};

type Vorlage = Omit<Leistung, "id"> & { id: string };

const EINHEITEN   = ["Stück", "Std.", "Tage", "Pauschal", "m²", "lfd. m"];
const MWST_SAETZE = [19, 7, 0] as const;

function formatEuro(v: number) {
  return v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function parseDecimal(v: string) {
  return parseFloat(v.replace(",", ".")) || 0;
}
function neueLeistung(): Leistung {
  return { id: crypto.randomUUID(), beschreibung: "", menge: "1", einheit: "Stück", einzelpreis: "", mwst: 19 };
}

const SCHRITTE = ["Kundendaten", "Leistungen", "Vorschau"];

const inputClass =
  "w-full border border-[#1a1814]/20 rounded-lg px-3.5 py-2.5 text-sm text-[#1a1814] placeholder:text-[#1a1814]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent";
const selectClass =
  "w-full border border-[#1a1814]/20 rounded-lg px-3 py-2.5 text-sm text-[#1a1814] bg-white focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent";

interface Props {
  onSaved?: () => void;
}

export default function AngebotFormular({ onSaved }: Props) {
  const [schritt, setSchritt]   = useState(0);
  const [kunde, setKunde]       = useState<Kundendaten>({ firma: "", kontakt: "", strasse: "", plz: "", ort: "", email: "" });
  const [leistungen, setLeistungen] = useState<Leistung[]>([neueLeistung()]);
  const [rabatt, setRabatt]     = useState(0);

  // Vorlagen
  const [vorlagen, setVorlagen]         = useState<Vorlage[]>([]);
  const [vorlagenOffen, setVorlagenOffen] = useState(false);
  const vorlagenRef                     = useRef<HTMLDivElement>(null);

  // E-Mail-Modal
  const [emailOffen, setEmailOffen]         = useState(false);
  const [emailAn, setEmailAn]               = useState("");
  const [emailNachricht, setEmailNachricht] = useState("");
  const [emailSending, setEmailSending]     = useState(false);
  const [emailGesendet, setEmailGesendet]   = useState(false);
  const [emailFehler, setEmailFehler]       = useState<string | null>(null);

  // Kundenliste
  const [kunden, setKunden]               = useState<Kundendaten[]>([]);
  const [suche, setSuche]                 = useState("");
  const [dropdownOffen, setDropdownOffen] = useState(false);
  const sucheRef                          = useRef<HTMLDivElement>(null);

  const [angebotsnummer] = useState(
    () => `AN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`
  );
  const [angebotsdatum] = useState(() => new Date().toLocaleDateString("de-DE"));
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [firma, setFirma]     = useState<Firmendaten>(EMPTY_FIRMA);

  // Click-outside für beide Dropdowns
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (sucheRef.current && !sucheRef.current.contains(e.target as Node))
        setDropdownOffen(false);
      if (vorlagenRef.current && !vorlagenRef.current.contains(e.target as Node))
        setVorlagenOffen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FIRMENDATEN_LS_KEY);
      if (raw) setFirma({ ...EMPTY_FIRMA, ...JSON.parse(raw) });
    } catch {/* ignore */}

    try {
      const raw = localStorage.getItem(VORLAGEN_LS_KEY);
      if (raw) setVorlagen(JSON.parse(raw));
    } catch {/* ignore */}

    const supabase = getBrowserClient();
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) return;
        supabase
          .from("kunden")
          .select("firma,kontakt,strasse,plz,ort,email")
          .eq("user_id", user.id)
          .order("firma")
          .then(({ data }) => { if (data) setKunden(data as Kundendaten[]); });
      });
    }

    const cached = localStorage.getItem(LOGO_LS_KEY);
    if (cached) { setLogoUrl(cached); return; }
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      for (const ext of ["png", "jpg", "svg"]) {
        const { data } = supabase.storage.from("claaro logos").getPublicUrl(`${user.id}/logo.${ext}`);
        if (data?.publicUrl) {
          fetch(data.publicUrl, { method: "HEAD" }).then((res) => {
            if (res.ok) { setLogoUrl(data.publicUrl); localStorage.setItem(LOGO_LS_KEY, data.publicUrl); }
          });
          break;
        }
      }
    });
  }, []);

  // ── Berechnungen ──────────────────────────────────────
  const nettoOhneRabatt = leistungen.reduce(
    (s, l) => s + parseDecimal(l.menge) * parseDecimal(l.einzelpreis), 0
  );
  const rabattBetrag    = nettoOhneRabatt * (rabatt / 100);
  const nettoNachRabatt = nettoOhneRabatt - rabattBetrag;

  const mwstGruppen = ([0, 7, 19] as MwStSatz[])
    .map(rate => {
      const basis = leistungen
        .filter(l => l.mwst === rate)
        .reduce((s, l) => s + parseDecimal(l.menge) * parseDecimal(l.einzelpreis), 0)
        * (1 - rabatt / 100);
      return { rate, basis, betrag: basis * rate / 100 };
    })
    .filter(g => g.basis > 0);

  const mwstGesamt = mwstGruppen.reduce((s, g) => s + g.betrag, 0);
  const brutto      = nettoNachRabatt + mwstGesamt;

  // ── Validation ────────────────────────────────────────
  const kundeValid =
    kunde.firma.trim() !== "" && kunde.strasse.trim() !== "" &&
    kunde.plz.trim()   !== "" && kunde.ort.trim()    !== "";

  const leistungenValid = leistungen.every(
    l => l.beschreibung.trim() !== "" && parseDecimal(l.einzelpreis) > 0
  );

  // ── Leistungen ────────────────────────────────────────
  function updateLeistung(id: string, field: keyof Leistung, value: string | MwStSatz) {
    setLeistungen(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  }
  function leistungHinzufuegen() { setLeistungen(prev => [...prev, neueLeistung()]); }
  function leistungEntfernen(id: string) { setLeistungen(prev => prev.filter(l => l.id !== id)); }

  // ── Vorlagen ─────────────────────────────────────────
  function vorlageSpeichern(l: Leistung) {
    if (!l.beschreibung.trim()) return;
    const neu: Vorlage = { id: crypto.randomUUID(), beschreibung: l.beschreibung, menge: l.menge, einheit: l.einheit, einzelpreis: l.einzelpreis, mwst: l.mwst };
    const updated = [...vorlagen, neu];
    setVorlagen(updated);
    localStorage.setItem(VORLAGEN_LS_KEY, JSON.stringify(updated));
  }
  function vorlageHinzufuegen(v: Vorlage) {
    setLeistungen(prev => [...prev, { ...v, id: crypto.randomUUID() }]);
    setVorlagenOffen(false);
  }
  function vorlageLoeschen(id: string) {
    const updated = vorlagen.filter(v => v.id !== id);
    setVorlagen(updated);
    localStorage.setItem(VORLAGEN_LS_KEY, JSON.stringify(updated));
  }

  // ── E-Mail ───────────────────────────────────────────
  const emailBetreff = `Angebot ${angebotsnummer} von ${firma.firmenname || "Claaro"}`;
  const gueltigBis   = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE");

  function emailModalOeffnen() {
    setEmailAn(kunde.email || "");
    setEmailNachricht("");
    setEmailGesendet(false);
    setEmailFehler(null);
    setEmailOffen(true);
  }

  function buildAngebotstext(): string {
    const lines: string[] = [
      emailNachricht ? emailNachricht + "\n" : "",
      `ANGEBOT ${angebotsnummer}`,
      `Datum: ${angebotsdatum}  |  Gültig bis: ${gueltigBis}`,
      "",
      `Empfänger:`,
      kunde.firma,
      kunde.kontakt ? `z. Hd. ${kunde.kontakt}` : "",
      kunde.strasse,
      `${kunde.plz} ${kunde.ort}`,
      "",
      `Positionen:`,
      ...leistungen.map((l, i) => {
        const pos = parseDecimal(l.menge) * parseDecimal(l.einzelpreis);
        return `${i + 1}. ${l.beschreibung}  |  ${l.menge} ${l.einheit} × ${formatEuro(parseDecimal(l.einzelpreis))} €  =  ${formatEuro(pos)} €  (${l.mwst} % MwSt)`;
      }),
      "",
      `Nettobetrag:          ${formatEuro(nettoOhneRabatt)} €`,
      ...(rabatt > 0
        ? [
            `Rabatt (${rabatt} %):         − ${formatEuro(rabattBetrag)} €`,
            `Netto nach Rabatt:    ${formatEuro(nettoNachRabatt)} €`,
          ]
        : []),
      ...mwstGruppen.map(g => `zzgl. ${g.rate} % MwSt.:       ${formatEuro(g.betrag)} €`),
      `─────────────────────────────`,
      `Gesamtbetrag:         ${formatEuro(brutto)} €`,
      "",
      `Dieses Angebot ist 30 Tage gültig. Bitte nehmen Sie das Angebot schriftlich an.`,
      "",
      `Mit freundlichen Grüßen`,
      firma.firmenname || "Claaro",
      ...(firma.strasse ? [`${firma.strasse}, ${firma.plz} ${firma.ort}`] : []),
      ...(firma.telefon ? [`Tel: ${firma.telefon}`] : []),
      ...(firma.email   ? [firma.email] : []),
    ];
    return lines.join("\n");
  }

  async function angebotSenden() {
    if (!emailAn.trim()) return;
    setEmailSending(true);
    setEmailFehler(null);
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_ANGEBOT_TID,
        {
          to_email:      emailAn,
          betreff:       emailBetreff,
          angebotsnummer,
          kunde_firma:   kunde.firma,
          absender_firma: firma.firmenname || "Claaro",
          nachricht:     buildAngebotstext(),
        },
        EMAILJS_PUBLIC_KEY
      );
      setEmailGesendet(true);
      setTimeout(() => { setEmailOffen(false); setEmailGesendet(false); }, 2500);
    } catch {
      setEmailFehler("E-Mail konnte nicht gesendet werden. Bitte prüfe die EmailJS-Konfiguration.");
    } finally {
      setEmailSending(false);
    }
  }

  // ── Angebot in Supabase speichern ────────────────────
  async function angebotSpeichern() {
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const heute    = new Date();
    const gueltig  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await supabase.from("angebote").upsert(
      {
        user_id:        user.id,
        angebotsnummer,
        angebotsdatum:  heute.toISOString().split("T")[0],
        gueltig_bis:    gueltig.toISOString().split("T")[0],
        kunde_firma:    kunde.firma,
        kunde_kontakt:  kunde.kontakt || null,
        kunde_email:    kunde.email   || null,
        netto:          nettoNachRabatt,
        brutto,
        rabatt,
        updated_at:     heute.toISOString(),
      },
      { onConflict: "user_id,angebotsnummer" }
    );
    onSaved?.();
  }

  // ── Kunde speichern ───────────────────────────────────
  async function kundeWeiterUndSpeichern() {
    setSchritt(1);
    const supabase = getBrowserClient();
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("kunden").upsert({ user_id: user.id, ...kunde }, { onConflict: "user_id,firma" });
    setKunden(prev => {
      const exists = prev.some(k => k.firma === kunde.firma);
      return exists
        ? prev.map(k => k.firma === kunde.firma ? { ...kunde } : k)
        : [...prev, { ...kunde }].sort((a, b) => a.firma.localeCompare(b.firma));
    });
  }

  return (
    <div>
      {/* Fortschrittsanzeige */}
      <div className="flex items-center gap-2 mb-8 print:hidden">
        {SCHRITTE.map((name, i) => (
          <div key={name} className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold transition-colors ${i <= schritt ? "bg-[#c84b2f] text-white" : "bg-white/20 text-white/40"}`}>
              {i < schritt ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-medium ${i === schritt ? "text-white" : "text-white/40"}`}>{name}</span>
            {i < SCHRITTE.length - 1 && (
              <div className={`h-px w-8 ${i < schritt ? "bg-[#c84b2f]" : "bg-white/20"}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Schritt 1: Kundendaten ── */}
      {schritt === 0 && (
        <div className="bg-[#f2ede4] rounded-xl border border-[#1a1814]/10 p-8">
          <h2 className="text-xl font-semibold text-[#1a1814] mb-6">Kundendaten</h2>

          {/* Kundensuche */}
          <div ref={sucheRef} className="relative mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1814]/30" fill="none" viewBox="0 0 16 16">
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                value={suche}
                onChange={e => { setSuche(e.target.value); setDropdownOffen(true); }}
                onFocus={() => setDropdownOffen(true)}
                placeholder="Bestehenden Kunden suchen…"
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#1a1814]/15 bg-white text-sm text-[#1a1814] placeholder:text-[#1a1814]/30 focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent"
              />
            </div>
            {dropdownOffen && kunden.filter(k =>
              k.firma.toLowerCase().includes(suche.toLowerCase()) ||
              (k.kontakt ?? "").toLowerCase().includes(suche.toLowerCase())
            ).length > 0 && (
              <ul className="absolute z-20 w-full mt-1 bg-white border border-[#1a1814]/10 rounded-lg shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                {kunden
                  .filter(k => k.firma.toLowerCase().includes(suche.toLowerCase()) || (k.kontakt ?? "").toLowerCase().includes(suche.toLowerCase()))
                  .map(k => (
                    <li key={k.firma}>
                      <button type="button" onClick={() => { setKunde({ ...k }); setSuche(""); setDropdownOffen(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[#f2ede4] transition-colors">
                        <span className="text-sm font-medium text-[#1a1814]">{k.firma}</span>
                        {k.kontakt && <span className="text-xs text-[#1a1814]/40 ml-2">{k.kontakt}</span>}
                        <span className="block text-xs text-[#1a1814]/40">{k.plz} {k.ort}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">Firma / Kundenname <span className="text-[#c84b2f]">*</span></label>
              <input type="text" value={kunde.firma} onChange={e => setKunde({ ...kunde, firma: e.target.value })} placeholder="Mustermann GmbH" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">Ansprechpartner</label>
              <input type="text" value={kunde.kontakt} onChange={e => setKunde({ ...kunde, kontakt: e.target.value })} placeholder="Max Mustermann" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">E-Mail</label>
              <input type="email" value={kunde.email} onChange={e => setKunde({ ...kunde, email: e.target.value })} placeholder="max@beispiel.de" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">Straße und Hausnummer <span className="text-[#c84b2f]">*</span></label>
              <input type="text" value={kunde.strasse} onChange={e => setKunde({ ...kunde, strasse: e.target.value })} placeholder="Musterstraße 1" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">PLZ <span className="text-[#c84b2f]">*</span></label>
              <input type="text" value={kunde.plz} onChange={e => setKunde({ ...kunde, plz: e.target.value })} placeholder="12345" maxLength={5} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a1814] mb-1.5">Ort <span className="text-[#c84b2f]">*</span></label>
              <input type="text" value={kunde.ort} onChange={e => setKunde({ ...kunde, ort: e.target.value })} placeholder="Musterstadt" className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button onClick={kundeWeiterUndSpeichern} disabled={!kundeValid}
              className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Weiter: Leistungen →
            </button>
          </div>
        </div>
      )}

      {/* ── Schritt 2: Leistungen ── */}
      {schritt === 1 && (
        <div className="bg-[#f2ede4] rounded-xl border border-[#1a1814]/10 p-8">
          <h2 className="text-xl font-semibold text-[#1a1814] mb-6">Leistungen &amp; Positionen</h2>

          <div className="space-y-3">
            {/* Tabellenkopf (Desktop) */}
            <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-[#1a1814]/50 uppercase tracking-wide px-1">
              <div className="col-span-4">Beschreibung</div>
              <div className="col-span-1">Menge</div>
              <div className="col-span-2">Einheit</div>
              <div className="col-span-2">Einzelpreis (€)</div>
              <div className="col-span-2">MwSt</div>
              <div className="col-span-1" />
            </div>

            {leistungen.map((l, idx) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 items-start">
                {/* Beschreibung */}
                <div className="col-span-12 md:col-span-4">
                  <input type="text" value={l.beschreibung}
                    onChange={e => updateLeistung(l.id, "beschreibung", e.target.value)}
                    placeholder={`Position ${idx + 1}: z. B. Beratungsleistung`}
                    className={inputClass} />
                </div>
                {/* Menge */}
                <div className="col-span-3 md:col-span-1">
                  <input type="text" value={l.menge}
                    onChange={e => updateLeistung(l.id, "menge", e.target.value)}
                    placeholder="1" className={inputClass} />
                </div>
                {/* Einheit */}
                <div className="col-span-4 md:col-span-2">
                  <select value={l.einheit} onChange={e => updateLeistung(l.id, "einheit", e.target.value)} className={selectClass}>
                    {EINHEITEN.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
                {/* Einzelpreis */}
                <div className="col-span-4 md:col-span-2">
                  <input type="text" value={l.einzelpreis}
                    onChange={e => updateLeistung(l.id, "einzelpreis", e.target.value)}
                    placeholder="0,00" className={inputClass} />
                </div>
                {/* MwSt */}
                <div className="col-span-10 md:col-span-2">
                  <select value={l.mwst} onChange={e => updateLeistung(l.id, "mwst", Number(e.target.value) as MwStSatz)} className={selectClass}>
                    {MWST_SAETZE.map(rate => <option key={rate} value={rate}>{rate} %</option>)}
                  </select>
                </div>
                {/* Aktionen: Vorlage speichern + Entfernen */}
                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1 pt-1">
                  <button onClick={() => vorlageSpeichern(l)} disabled={!l.beschreibung.trim()}
                    title="Als Vorlage speichern"
                    className="text-[#1a1814]/25 hover:text-[#c84b2f] transition-colors disabled:opacity-0 text-base leading-none px-0.5">
                    ★
                  </button>
                  <button onClick={() => leistungEntfernen(l.id)} disabled={leistungen.length === 1}
                    title="Position entfernen"
                    className="text-[#1a1814]/30 hover:text-[#c84b2f] transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-lg leading-none px-0.5">
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Aktionsleiste */}
          <div className="mt-4 flex items-center gap-5">
            <button onClick={leistungHinzufuegen}
              className="text-sm text-[#c84b2f] hover:text-[#b03f25] font-medium transition-colors">
              + Position hinzufügen
            </button>

            {/* Vorlagen-Dropdown */}
            <div ref={vorlagenRef} className="relative">
              <button onClick={() => setVorlagenOffen(!vorlagenOffen)}
                className="text-sm text-[#1a1814]/50 hover:text-[#1a1814] font-medium transition-colors flex items-center gap-1.5">
                <span className="text-[#c84b2f]">★</span> Aus Vorlage
              </button>

              {vorlagenOffen && (
                <div className="absolute left-0 top-8 z-20 w-80 bg-white border border-[#1a1814]/10 rounded-xl shadow-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#1a1814]/8 bg-[#f9f7f3]">
                    <p className="text-xs font-semibold text-[#1a1814]/50 uppercase tracking-wide">Gespeicherte Vorlagen</p>
                  </div>
                  {vorlagen.length === 0 ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm text-[#1a1814]/40">Noch keine Vorlagen gespeichert.</p>
                      <p className="text-xs text-[#1a1814]/30 mt-1">Klicke auf ★ in einer Position zum Speichern.</p>
                    </div>
                  ) : (
                    <ul className="max-h-64 overflow-y-auto divide-y divide-[#1a1814]/5">
                      {vorlagen.map(v => (
                        <li key={v.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#f2ede4] transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1814] truncate">{v.beschreibung}</p>
                            <p className="text-xs text-[#1a1814]/40 mt-0.5">
                              {v.menge} {v.einheit} · {formatEuro(parseDecimal(v.einzelpreis))} € · {v.mwst} % MwSt
                            </p>
                          </div>
                          <button onClick={() => vorlageHinzufuegen(v)}
                            className="shrink-0 text-xs bg-[#c84b2f] text-white px-2.5 py-1 rounded-md hover:bg-[#b03f25] transition-colors font-medium">
                            Übernehmen
                          </button>
                          <button onClick={() => vorlageLoeschen(v.id)} title="Vorlage löschen"
                            className="shrink-0 text-[#1a1814]/25 hover:text-red-500 transition-colors text-lg leading-none">
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Rabatt + Summen */}
          <div className="mt-8 border-t border-[#1a1814]/10 pt-6">
            {/* Rabatt-Feld */}
            <div className="flex justify-end mb-5">
              <div className="flex items-center gap-3">
                <label className="text-sm text-[#1a1814]/60 font-medium">Rabatt</label>
                <div className="relative w-24">
                  <input
                    type="number" min="0" max="100" step="1"
                    value={rabatt === 0 ? "" : rabatt}
                    onChange={e => setRabatt(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-full border border-[#1a1814]/20 rounded-lg px-3 py-2 text-sm text-[#1a1814] bg-white text-right pr-7 focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-[#1a1814]/40 pointer-events-none">%</span>
                </div>
              </div>
            </div>

            {/* Summen */}
            <div className="flex flex-col items-end gap-1.5 text-sm">
              <div className="flex gap-8 text-[#1a1814]/60">
                <span>Nettobetrag</span>
                <span className="w-28 text-right">{formatEuro(nettoOhneRabatt)} €</span>
              </div>
              {rabatt > 0 && (
                <>
                  <div className="flex gap-8 text-[#c84b2f]">
                    <span>Rabatt ({rabatt} %)</span>
                    <span className="w-28 text-right">− {formatEuro(rabattBetrag)} €</span>
                  </div>
                  <div className="flex gap-8 text-[#1a1814]/60">
                    <span>Netto nach Rabatt</span>
                    <span className="w-28 text-right">{formatEuro(nettoNachRabatt)} €</span>
                  </div>
                </>
              )}
              {mwstGruppen.map(g => (
                <div key={g.rate} className="flex gap-8 text-[#1a1814]/60">
                  <span>zzgl. {g.rate} % MwSt.</span>
                  <span className="w-28 text-right">{formatEuro(g.betrag)} €</span>
                </div>
              ))}
              <div className="flex gap-8 font-semibold text-[#1a1814] text-base mt-1 pt-2 border-t border-[#1a1814]/10">
                <span>Gesamtbetrag</span>
                <span className="w-28 text-right">{formatEuro(brutto)} €</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <button onClick={() => setSchritt(0)}
              className="text-[#1a1814]/70 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#1a1814]/10 transition-colors border border-[#1a1814]/20">
              ← Zurück
            </button>
            <button onClick={() => { setSchritt(2); triggerZeitersparnisToast("Angebot erstellt", 45); void angebotSpeichern(); }}
              disabled={!leistungenValid}
              className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Weiter: Vorschau →
            </button>
          </div>
        </div>
      )}

      {/* ── Schritt 3: Vorschau / Druck ── */}
      {schritt === 2 && (
        <>
          <div className="flex justify-between items-center mb-6 print:hidden">
            <button onClick={() => setSchritt(1)}
              className="text-white/70 px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors border border-white/20">
              ← Bearbeiten
            </button>
            <div className="flex items-center gap-3">
              <button onClick={emailModalOeffnen}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-white border border-white/20 hover:bg-white/10 transition-colors">
                ✉ Per E-Mail senden
              </button>
              <button onClick={() => window.print()}
                className="bg-[#c84b2f] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#b03f25] transition-colors flex items-center gap-2">
                🖨️ Als PDF / Drucken
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-white/10 p-12 print:border-0 print:rounded-none print:shadow-none print:p-0">
            {/* Kopfzeile */}
            <div className="flex justify-between items-start mb-12">
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
              <div className="text-right text-sm text-gray-600 shrink-0 ml-8">
                <p className="font-semibold text-gray-900 text-base">Angebot {angebotsnummer}</p>
                <p className="mt-1">Datum: {angebotsdatum}</p>
                <p>Gültig bis: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("de-DE")}</p>
              </div>
            </div>

            {/* Empfänger */}
            <div className="mb-10">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Angebot für</p>
              <p className="font-semibold text-gray-900">{kunde.firma}</p>
              {kunde.kontakt && <p className="text-gray-600">z. Hd. {kunde.kontakt}</p>}
              <p className="text-gray-600">{kunde.strasse}</p>
              <p className="text-gray-600">{kunde.plz} {kunde.ort}</p>
              {kunde.email && <p className="text-gray-600">{kunde.email}</p>}
            </div>

            {/* Betreff */}
            <p className="font-semibold text-gray-900 mb-6">Angebot {angebotsnummer}</p>
            <p className="text-gray-600 mb-8 text-sm leading-relaxed">
              vielen Dank für Ihre Anfrage. Wir freuen uns, Ihnen folgendes Angebot zu unterbreiten:
            </p>

            {/* Positionstabelle */}
            <table className="w-full text-sm mb-8">
              <thead>
                <tr className="bg-[#f2ede4] text-[#1a1814]/70">
                  <th className="text-left px-4 py-3 rounded-l-lg font-medium w-8">Pos.</th>
                  <th className="text-left px-4 py-3 font-medium">Beschreibung</th>
                  <th className="text-right px-4 py-3 font-medium w-20">Menge</th>
                  <th className="text-right px-4 py-3 font-medium w-24">Einzelpreis</th>
                  <th className="text-right px-4 py-3 font-medium w-16">MwSt</th>
                  <th className="text-right px-4 py-3 rounded-r-lg font-medium w-28">Gesamtpreis</th>
                </tr>
              </thead>
              <tbody>
                {leistungen.map((l, idx) => {
                  const pos = parseDecimal(l.menge) * parseDecimal(l.einzelpreis);
                  return (
                    <tr key={l.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                      <td className="px-4 py-3 text-gray-900">
                        {l.beschreibung}
                        <span className="text-gray-400 ml-1 text-xs">({l.einheit})</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{l.menge}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatEuro(parseDecimal(l.einzelpreis))} €</td>
                      <td className="px-4 py-3 text-right text-gray-400 text-xs">{l.mwst} %</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatEuro(pos)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summen */}
            <div className="flex justify-end">
              <div className="w-80 text-sm">
                <div className="flex justify-between py-2 text-gray-600">
                  <span>Nettobetrag</span>
                  <span>{formatEuro(nettoOhneRabatt)} €</span>
                </div>
                {rabatt > 0 && (
                  <>
                    <div className="flex justify-between py-2 text-[#c84b2f]">
                      <span>Rabatt ({rabatt} %)</span>
                      <span>− {formatEuro(rabattBetrag)} €</span>
                    </div>
                    <div className="flex justify-between py-2 text-gray-600">
                      <span>Netto nach Rabatt</span>
                      <span>{formatEuro(nettoNachRabatt)} €</span>
                    </div>
                  </>
                )}
                {mwstGruppen.map(g => (
                  <div key={g.rate} className="flex justify-between py-2 text-gray-600">
                    <span>zzgl. {g.rate} % Mehrwertsteuer</span>
                    <span>{formatEuro(g.betrag)} €</span>
                  </div>
                ))}
                <div className="flex justify-between py-3 font-bold text-gray-900 text-base border-t border-gray-100 mt-1">
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

      {/* ── E-Mail-Modal ── */}
      {emailOffen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm print:hidden"
          onClick={e => { if (e.target === e.currentTarget) setEmailOffen(false); }}>
          <div className="bg-[#f2ede4] rounded-2xl w-full max-w-md mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#1a1814]/10">
              <div>
                <h3 className="text-base font-semibold text-[#1a1814]">Angebot per E-Mail senden</h3>
                <p className="text-xs text-[#1a1814]/40 mt-0.5">{angebotsnummer}</p>
              </div>
              <button onClick={() => setEmailOffen(false)}
                className="text-[#1a1814]/30 hover:text-[#1a1814] transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center">
                ×
              </button>
            </div>

            {/* Felder */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1a1814]/50 uppercase tracking-wide mb-1.5">Empfänger</label>
                <input type="email" value={emailAn} onChange={e => setEmailAn(e.target.value)}
                  placeholder="kunde@beispiel.de" className={inputClass} autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a1814]/50 uppercase tracking-wide mb-1.5">Betreff</label>
                <input type="text" value={emailBetreff} readOnly
                  className="w-full border border-[#1a1814]/10 rounded-lg px-3.5 py-2.5 text-sm text-[#1a1814]/50 bg-[#1a1814]/5 cursor-default select-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#1a1814]/50 uppercase tracking-wide mb-1.5">Nachricht (optional)</label>
                <textarea value={emailNachricht} onChange={e => setEmailNachricht(e.target.value)}
                  rows={3}
                  placeholder="Vielen Dank für Ihre Anfrage. Anbei finden Sie unser Angebot…"
                  className="w-full border border-[#1a1814]/20 rounded-lg px-3.5 py-2.5 text-sm text-[#1a1814] placeholder:text-[#1a1814]/30 bg-white focus:outline-none focus:ring-2 focus:ring-[#c84b2f] focus:border-transparent resize-none" />
              </div>
              <p className="text-xs text-[#1a1814]/35 leading-relaxed">
                Das vollständige Angebot wird als Text im E-Mail-Inhalt mitgesendet. Für eine PDF-Version nutze „Als PDF / Drucken".
              </p>
              {emailFehler && (
                <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">{emailFehler}</p>
              )}
              {emailGesendet && (
                <p className="text-xs px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 font-medium">✓ E-Mail erfolgreich gesendet!</p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setEmailOffen(false)}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-[#1a1814]/60 border border-[#1a1814]/15 hover:bg-[#1a1814]/5 transition-colors">
                Abbrechen
              </button>
              <button onClick={angebotSenden}
                disabled={!emailAn.trim() || emailSending || emailGesendet}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-[#c84b2f] text-white hover:bg-[#b03f25] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {emailSending ? "Wird gesendet…" : emailGesendet ? "✓ Gesendet" : "E-Mail senden"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
