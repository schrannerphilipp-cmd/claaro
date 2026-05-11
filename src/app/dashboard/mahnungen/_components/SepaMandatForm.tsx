"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSepaMandat } from "@/app/actions/mahnungen";

function formatIban(raw: string): string {
  const clean = raw.replace(/\s/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

export default function SepaMandatForm({
  kundeId,
  onSaved,
}: {
  kundeId: string;
  onSaved: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [kontoinhaber, setKontoinhaber] = useState("");
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [datum] = useState(() => new Date().toISOString().split("T")[0]);
  const [unterschrift, setUnterschrift] = useState(false);

  function handleIbanChange(val: string) {
    setIban(formatIban(val));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await saveSepaMandat({
        kundeId,
        kontoinhaber,
        iban,
        bic,
        datum,
        unterschrift,
      });
      if (result.success) {
        onSaved();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  const inputClass =
    "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
  const labelClass = "block text-xs text-white/40 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 pt-1">
      <div>
        <label className={labelClass}>Kontoinhaber</label>
        <input
          required
          type="text"
          value={kontoinhaber}
          onChange={(e) => setKontoinhaber(e.target.value)}
          placeholder="Max Mustermann"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>IBAN</label>
        <input
          required
          type="text"
          value={iban}
          onChange={(e) => handleIbanChange(e.target.value)}
          placeholder="DE89 3704 0044 0532 0130 00"
          className={`${inputClass} font-mono tracking-wider`}
          maxLength={42}
        />
      </div>

      <div>
        <label className={labelClass}>BIC</label>
        <input
          required
          type="text"
          value={bic}
          onChange={(e) => setBic(e.target.value.toUpperCase())}
          placeholder="COBADEFFXXX"
          className={`${inputClass} font-mono`}
          maxLength={11}
        />
      </div>

      <div>
        <label className={labelClass}>Datum</label>
        <input
          required
          type="date"
          defaultValue={datum}
          readOnly
          className={`${inputClass} text-white/50`}
        />
      </div>

      <label className="flex items-start gap-2.5 cursor-pointer group">
        <div className="relative mt-0.5 shrink-0">
          <input
            type="checkbox"
            checked={unterschrift}
            onChange={(e) => setUnterschrift(e.target.checked)}
            className="sr-only"
          />
          <div
            className="w-4 h-4 rounded border transition-colors flex items-center justify-center"
            style={{
              borderColor: unterschrift
                ? "var(--c-teal)"
                : "rgba(255,255,255,0.2)",
              backgroundColor: unterschrift
                ? "rgba(30,122,107,0.3)"
                : "transparent",
            }}
          >
            {unterschrift && (
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 10 10">
                <path
                  d="M1.5 5l2.5 2.5 4.5-4"
                  stroke="var(--c-teal)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        </div>
        <span className="text-xs text-white/40 leading-relaxed group-hover:text-white/60 transition-colors">
          Ich erteile hiermit ein SEPA-Lastschriftmandat und ermächtige zur
          Einziehung des fälligen Betrags von meinem Konto. Dieses Mandat dient
          als digitale Unterschrift.
        </span>
      </label>

      {error && (
        <p
          className="text-xs px-3 py-2 rounded-lg"
          style={{ backgroundColor: "rgba(200,75,47,0.15)", color: "var(--c-accent)" }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || !unterschrift}
        className="w-full text-sm font-medium py-2 px-4 rounded-lg transition-all"
        style={
          !isPending && unterschrift
            ? { backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }
            : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
        }
      >
        {isPending ? "Wird gespeichert…" : "Mandat speichern"}
      </button>
    </form>
  );
}
