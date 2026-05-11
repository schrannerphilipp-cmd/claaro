"use client";

import { VideoContent } from "@/types/onboard";

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

function getEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

interface VideoEmbedEditorProps {
  content: VideoContent;
  onChange: (content: VideoContent) => void;
}

export default function VideoEmbedEditor({ content, onChange }: VideoEmbedEditorProps) {
  const embedUrl = content.url ? getEmbedUrl(content.url) : null;

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Video-URL (YouTube oder Vimeo)</label>
        <input
          type="url"
          value={content.url}
          onChange={(e) => onChange({ ...content, url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=..."
          className={inputClass}
        />
      </div>

      {content.url && !embedUrl && (
        <p className="text-xs text-[var(--c-accent)] bg-[var(--c-accent)]/10 px-3 py-2 rounded-lg">
          Ungültige URL — bitte YouTube- oder Vimeo-Link einfügen.
        </p>
      )}

      {embedUrl && (
        <div className="rounded-xl overflow-hidden border border-white/10 aspect-video">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={content.title || "Video-Vorschau"}
          />
        </div>
      )}

      <div>
        <label className={labelClass}>Titel</label>
        <input
          type="text"
          value={content.title}
          onChange={(e) => onChange({ ...content, title: e.target.value })}
          placeholder="Einführungsvideo Betrieb"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Beschreibung</label>
        <textarea
          value={content.description}
          onChange={(e) => onChange({ ...content, description: e.target.value })}
          placeholder="Was soll der Mitarbeiter aus diesem Video mitnehmen?"
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </div>

      <div>
        <label className={labelClass}>Dauer (Minuten)</label>
        <input
          type="number"
          min={0}
          value={content.duration}
          onChange={(e) => onChange({ ...content, duration: Number(e.target.value) })}
          className={`${inputClass} w-28`}
        />
      </div>
    </div>
  );
}
