"use client";

import { useState, useEffect, useRef } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const BUCKET = "claaro logos";
const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PROFILE_LS_KEY = "claaro-profil";

export function dispatchProfilUpdated(name: string, avatarUrl: string | null) {
  localStorage.setItem(PROFILE_LS_KEY, JSON.stringify({ username: name, avatarUrl }));
  window.dispatchEvent(new CustomEvent("claaro:profil-updated", { detail: { username: name, avatarUrl } }));
}

export function loadProfilFromStorage(): { username: string; avatarUrl: string | null } {
  try {
    const raw = localStorage.getItem(PROFILE_LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {/* ignore */}
  return { username: "", avatarUrl: null };
}

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";

export default function ProfilBearbeiten() {
  const [userId, setUserId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [origName, setOrigName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [origCompanyName, setOrigCompanyName] = useState("");

  const [origAvatarUrl, setOrigAvatarUrl] = useState<string | null>(null);
  const [origAvatarPath, setOrigAvatarPath] = useState<string | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Load profile on mount
  useEffect(() => {
    const stored = loadProfilFromStorage();
    if (stored.username) {
      setName(stored.username);
      setOrigName(stored.username);
      setOrigAvatarUrl(stored.avatarUrl);
    }

    if (!supabaseConfigured) return;
    const supabase = getBrowserClient()!;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.auth.getUser().then((res: any) => {
      if (!res.data?.user) return;
      setUserId(res.data.user.id);

      supabase
        .from("profiles")
        .select("username, avatar_url, avatar_path, company_name")
        .eq("id", res.data.user.id)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((res: any) => {
          if (res.error) {
            console.warn("[ProfilBearbeiten] profiles-Fehler:", res.error.message);
            return;
          }
          const p = res.data;
          if (!p) return;
          const n = (p.username as string) || "";
          const av = (p.avatar_url as string | null) ?? null;
          const cn = (p.company_name as string) || "";
          setName(n);
          setOrigName(n);
          setOrigAvatarUrl(av);
          setOrigAvatarPath((p.avatar_path as string | null) ?? null);
          setCompanyName(cn);
          setOrigCompanyName(cn);
        });
    });
  }, []);

  function handleFile(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Nur PNG, JPEG oder WebP erlaubt.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Datei zu groß (max. 3 MB).");
      return;
    }
    setAvatarFile(file);
    setSaved(false);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleRemoveAvatar() {
    if (!origAvatarPath || !supabaseConfigured) return;
    try {
      const supabase = getBrowserClient()!;
      await supabase.storage.from(BUCKET).remove([origAvatarPath]);
    } catch (err) {
      console.error("[ProfilBearbeiten] Avatar löschen Fehler:", err);
    }
    setOrigAvatarUrl(null);
    setOrigAvatarPath(null);
    setAvatarPreview(null);
    setAvatarFile(null);
    dispatchProfilUpdated(origName, null);
  }

  async function handleSave() {
    setError(null);
    const trimmedName = name.trim();
    const trimmedCompany = companyName.trim();

    if (trimmedName.length < 2) { setError("Der Name muss mindestens 2 Zeichen lang sein."); return; }
    if (trimmedName.length > 50) { setError("Der Name darf maximal 50 Zeichen lang sein."); return; }

    setSaving(true);

    let newAvatarUrl = origAvatarUrl;
    let newAvatarPath = origAvatarPath;

    if (avatarFile && supabaseConfigured) {
      setUploading(true);
      try {
        const supabase = getBrowserClient()!;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Nicht eingeloggt – bitte zuerst anmelden.");
          setSaving(false); setUploading(false);
          return;
        }
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) {
          setError(upErr.message);
          setSaving(false); setUploading(false);
          return;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newAvatarUrl = data.publicUrl + `?t=${Date.now()}`;
        newAvatarPath = path;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
        setSaving(false); setUploading(false);
        return;
      }
      setUploading(false);
    }

    if (supabaseConfigured && userId) {
      const supabase = getBrowserClient()!;
      const { error: dbErr } = await supabase.from("profiles").upsert({
        id: userId,
        username: trimmedName,
        company_name: trimmedCompany || null,
        avatar_url: newAvatarUrl,
        avatar_path: newAvatarPath,
        updated_at: new Date().toISOString(),
      });
      if (dbErr) {
        console.error("[ProfilBearbeiten] Speichern Fehler:", dbErr);
        setError(dbErr.message);
        setSaving(false);
        return;
      }
    }

    setOrigName(trimmedName);
    setOrigCompanyName(trimmedCompany);
    setOrigAvatarUrl(newAvatarUrl);
    setOrigAvatarPath(newAvatarPath);
    setAvatarFile(null);
    setAvatarPreview(null);
    dispatchProfilUpdated(trimmedName, newAvatarUrl);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const displayAvatar = avatarPreview ?? origAvatarUrl;
  const initials = (name || "?").slice(0, 2).toUpperCase();
  const nameValid = name.trim().length >= 2 && name.trim().length <= 50;
  const hasChanges =
    name !== origName ||
    companyName !== origCompanyName ||
    avatarFile !== null;
  const canSave = hasChanges && nameValid && !saving;

  return (
    <div className="space-y-6" style={sans}>
      {/* Avatar */}
      <div className="flex items-center gap-6">
        <div
          className="relative group"
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
          }}
        >
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer w-20 h-20 rounded-full overflow-hidden flex items-center justify-center relative"
            style={{
              border: dragging ? "2px solid var(--c-teal)" : "2px solid rgba(255,255,255,0.15)",
              backgroundColor: displayAvatar ? "transparent" : "rgba(var(--c-accent-rgb),0.2)",
            }}
          >
            {displayAvatar ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                {uploading && (
                  /* Semi-transparentes Overlay während Upload — Bild bleibt sichtbar */
                  <div className="absolute inset-0 bg-black/55 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                  </div>
                )}
              </>
            ) : uploading ? (
              <svg className="w-6 h-6 animate-spin text-white/70" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : (
              <span className="text-white font-semibold text-lg">{initials}</span>
            )}
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => inputRef.current?.click()}
            className="text-sm text-white/70 hover:text-white transition-colors"
          >
            Bild ändern
          </button>
          {(origAvatarUrl || avatarPreview) && !avatarFile && (
            <button
              onClick={handleRemoveAvatar}
              className="block text-xs text-white/50 hover:text-white/60 transition-colors"
            >
              Bild entfernen
            </button>
          )}
          {avatarFile && (
            <button
              onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
              className="block text-xs text-white/50 hover:text-white/60 transition-colors"
            >
              Auswahl verwerfen
            </button>
          )}
          <p className="text-xs text-white/45">PNG, JPEG, WebP · max. 3 MB</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-white/55 mb-1.5">Name</label>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => { setName(e.target.value); setSaved(false); }}
          maxLength={50}
          placeholder="Dein Name"
        />
        <p className="text-xs text-white/45 mt-1">2–50 Zeichen</p>
      </div>

      {/* Firmenname */}
      <div>
        <label className="block text-xs text-white/55 mb-1.5">Firmenname <span className="text-white/40">(optional)</span></label>
        <input
          className={inputClass}
          value={companyName}
          onChange={(e) => { setCompanyName(e.target.value); setSaved(false); }}
          maxLength={100}
          placeholder="Deine Firma GmbH"
        />
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave}
        className="w-full text-sm py-2.5 rounded-lg border transition-all disabled:opacity-40"
        style={{
          backgroundColor: saved ? "rgba(var(--c-teal-rgb),0.2)" : "rgba(var(--c-accent-rgb),0.15)",
          borderColor: saved ? "rgba(var(--c-teal-rgb),0.4)" : "rgba(var(--c-accent-rgb),0.35)",
          color: saved ? "var(--c-teal)" : "var(--c-accent)",
        }}
      >
        {saving ? "Wird gespeichert…" : saved ? "Gespeichert ✓" : "Änderungen speichern"}
      </button>

      {!supabaseConfigured && (
        <p className="text-xs text-white/45 text-center">
          Für Avatar-Upload Supabase konfigurieren.
        </p>
      )}
    </div>
  );
}
