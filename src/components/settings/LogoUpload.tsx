"use client";

import { useState, useRef, useCallback } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const BUCKET = "claaro logos";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const LOGO_LS_KEY = "claaro-logo-url";

interface Props {
  onLogoChange?: (url: string | null) => void;
}

export default function LogoUpload({ onLogoChange }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (typeof window !== "undefined") return localStorage.getItem(LOGO_LS_KEY);
    return null;
  });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Nur PNG, JPEG oder SVG erlaubt.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Datei zu groß (max. 5 MB).");
      return;
    }

    if (!supabaseConfigured) {
      setError("Supabase nicht konfiguriert – NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local prüfen.");
      return;
    }
    setUploading(true);
    try {
      const supabase = getBrowserClient()!;

      // User-ID ermitteln
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Nicht eingeloggt – bitte zuerst anmelden.");
        setUploading(false);
        return;
      }

      const ext = file.name.split(".").pop() ?? "png";
      const path = `${user.id}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const url = data.publicUrl + `?t=${Date.now()}`;

      localStorage.setItem(LOGO_LS_KEY, url);
      setLogoUrl(url);
      onLogoChange?.(url);
    } catch (err) {
      console.error("[LogoUpload] Fehler:", err);
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  }, [onLogoChange]);

  async function handleDelete() {
    if (!logoUrl || !supabaseConfigured) return;
    setUploading(true);
    try {
      const supabase = getBrowserClient()!;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const ext = logoUrl.includes(".svg") ? "svg" : logoUrl.includes(".jpg") || logoUrl.includes(".jpeg") ? "jpg" : "png";
      await supabase.storage.from(BUCKET).remove([`${user.id}/logo.${ext}`]);
      localStorage.removeItem(LOGO_LS_KEY);
      setLogoUrl(null);
      onLogoChange?.(null);
    } catch (err) {
      console.error("[LogoUpload] Löschen Fehler:", err);
    } finally {
      setUploading(false);
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="space-y-4" style={sans}>
      <p className="text-[10px] text-white/30 uppercase tracking-widest">Firmen-Logo</p>

      {logoUrl ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-4">
          {/* Preview */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt="Firmen-Logo"
            className="max-w-[200px] max-h-[80px] object-contain rounded"
          />
          <div className="flex flex-col gap-2">
            <p className="text-xs text-white/50">Logo hochgeladen</p>
            <button
              onClick={handleDelete}
              disabled={uploading}
              className="text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40"
              style={{ backgroundColor: "rgba(200,75,47,0.12)", borderColor: "rgba(200,75,47,0.3)", color: "var(--c-accent)" }}
            >
              {uploading ? "Wird gelöscht…" : "Logo entfernen"}
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 text-white/40 hover:text-white/70 transition-colors"
            >
              Anderes Logo wählen
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-xl border-2 border-dashed transition-colors p-10 text-center"
          style={{
            borderColor: dragging ? "rgba(30,122,107,0.6)" : "rgba(255,255,255,0.12)",
            backgroundColor: dragging ? "rgba(30,122,107,0.06)" : "transparent",
          }}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-8 h-8 animate-spin text-white/30" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm text-white/40">Wird hochgeladen…</p>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-white/25 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm text-white/50 mb-1">Logo hier ablegen oder klicken</p>
              <p className="text-xs text-white/25">PNG, JPEG, SVG · max. 5 MB</p>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
      />

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </p>
      )}

      <p className="text-xs text-white/25 leading-relaxed">
        Das Logo erscheint automatisch in der Kopfzeile all Ihrer Angebote (PDF-Export).
      </p>
    </div>
  );
}
