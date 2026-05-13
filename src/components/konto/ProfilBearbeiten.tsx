"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getBrowserClient, supabaseConfigured } from "@/lib/supabase";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

const BUCKET = "claaro logos";
const MAX_SIZE = 3 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PROFILE_LS_KEY = "claaro-profil";

export function dispatchProfilUpdated(username: string, avatarUrl: string | null) {
  localStorage.setItem(PROFILE_LS_KEY, JSON.stringify({ username, avatarUrl }));
  window.dispatchEvent(new CustomEvent("claaro:profil-updated", { detail: { username, avatarUrl } }));
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
  const [origUsername, setOrigUsername] = useState("");
  const [origAvatarUrl, setOrigAvatarUrl] = useState<string | null>(null);
  const [origAvatarPath, setOrigAvatarPath] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load profile on mount
  useEffect(() => {
    const stored = loadProfilFromStorage();
    if (stored.username) {
      setUsername(stored.username);
      setOrigUsername(stored.username);
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
        .select("username, avatar_url, avatar_path")
        .eq("id", res.data.user.id)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then((res: any) => {
          const p = res.data;
          if (!p) return;
          const u = (p.username as string) ?? "";
          const av = (p.avatar_url as string | null) ?? null;
          setUsername(u);
          setOrigUsername(u);
          setOrigAvatarUrl(av);
          setOrigAvatarPath((p.avatar_path as string | null) ?? null);
        });
    });
  }, []);

  const runCheck = useCallback(
    (val: string, uid: string | null) => {
      if (val === origUsername) { setAvailable(null); setChecking(false); return; }
      if (!uid) { setChecking(false); return; }
      setChecking(true);
      if (!supabaseConfigured) { setChecking(false); return; }
      const supabase = getBrowserClient()!;
      supabase
        .from("profiles")
        .select("id")
        .eq("username", val)
        .neq("id", uid)
        .maybeSingle()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(({ data }: { data: any }) => {
          setAvailable(!data);
          setChecking(false);
        });
    },
    [origUsername]
  );

  function handleUsernameChange(val: string) {
    if (!/^[a-zA-Z0-9_]*$/.test(val) && val !== "") return;
    setUsername(val);
    setAvailable(null);
    setSaved(false);
    if (checkTimer.current) clearTimeout(checkTimer.current);
    if (val.length >= 3) {
      checkTimer.current = setTimeout(() => runCheck(val, userId), 500);
    }
  }

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
    dispatchProfilUpdated(origUsername, null);
  }

  async function handleSave() {
    setError(null);
    const trimmed = username.trim();
    if (trimmed.length < 3) { setError("Benutzername mind. 3 Zeichen."); return; }
    if (trimmed.length > 30) { setError("Benutzername max. 30 Zeichen."); return; }

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
          setSaving(false);
          setUploading(false);
          return;
        }
        const ext = avatarFile.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
        if (upErr) {
          console.error("[ProfilBearbeiten] Avatar-Upload Fehler:", upErr);
          setError(upErr.message);
          setSaving(false);
          setUploading(false);
          return;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newAvatarUrl = data.publicUrl + `?t=${Date.now()}`;
        newAvatarPath = path;
        console.log("[ProfilBearbeiten] Avatar hochgeladen:", newAvatarUrl);
      } catch (err) {
        console.error("[ProfilBearbeiten] Unbekannter Fehler:", err);
        setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
        setSaving(false);
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setOrigUsername(trimmed);
    setOrigAvatarUrl(newAvatarUrl);
    setOrigAvatarPath(newAvatarPath);
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvailable(null);
    dispatchProfilUpdated(trimmed, newAvatarUrl);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  }

  const displayAvatar = avatarPreview ?? origAvatarUrl;
  const initials = (username || origUsername || "?").slice(0, 2).toUpperCase();
  const usernameValid = /^[a-zA-Z0-9_]{3,30}$/.test(username);
  const usernameChanged = username !== origUsername;
  const avatarChanged = avatarFile !== null;
  const hasChanges = usernameChanged || avatarChanged;
  const canSave =
    hasChanges &&
    usernameValid &&
    !checking &&
    !saving &&
    (usernameChanged ? available !== false : true);

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
              backgroundColor: displayAvatar ? "transparent" : "rgba(200,75,47,0.2)",
            }}
          >
            {uploading ? (
              <svg className="w-6 h-6 animate-spin text-white/60" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            ) : displayAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
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
              className="block text-xs text-white/35 hover:text-white/60 transition-colors"
            >
              Bild entfernen
            </button>
          )}
          {avatarFile && (
            <button
              onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
              className="block text-xs text-white/35 hover:text-white/60 transition-colors"
            >
              Auswahl verwerfen
            </button>
          )}
          <p className="text-xs text-white/25">PNG, JPEG, WebP · max. 3 MB</p>
        </div>
      </div>

      {/* Username */}
      <div>
        <label className="block text-xs text-white/40 mb-1.5">Benutzername</label>
        <div className="relative">
          <input
            className={`${inputClass} pr-8`}
            value={username}
            onChange={(e) => handleUsernameChange(e.target.value)}
            maxLength={30}
            placeholder="dein_name"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {checking && (
              <svg className="w-3.5 h-3.5 animate-spin text-white/40" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {!checking && available === true && (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16" style={{ color: "var(--c-teal)" }}>
                <path d="M3 8l3.5 3.5L13 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {!checking && available === false && (
              <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 16 16">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs text-white/25">
            {available === false ? (
              <span className="text-red-400">Dieser Name ist bereits vergeben.</span>
            ) : (
              "Buchstaben, Zahlen und _ · 3–30 Zeichen"
            )}
          </p>
          <p className="text-xs text-white/20">{username.length}/30</p>
        </div>
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
          backgroundColor: saved ? "rgba(30,122,107,0.2)" : "rgba(200,75,47,0.15)",
          borderColor: saved ? "rgba(30,122,107,0.4)" : "rgba(200,75,47,0.35)",
          color: saved ? "var(--c-teal)" : "var(--c-accent)",
        }}
      >
        {saving ? "Wird gespeichert…" : saved ? "Gespeichert ✓" : "Änderungen speichern"}
      </button>

      {!supabaseConfigured && (
        <p className="text-xs text-white/25 text-center">
          Für Avatar-Upload Supabase konfigurieren.
        </p>
      )}
    </div>
  );
}
