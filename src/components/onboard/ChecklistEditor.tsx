"use client";

import { ChecklistContent, ChecklistItem } from "@/types/onboard";

const inputClass =
  "flex-1 bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface ChecklistEditorProps {
  content: ChecklistContent;
  onChange: (content: ChecklistContent) => void;
}

export default function ChecklistEditor({ content, onChange }: ChecklistEditorProps) {
  function addItem() {
    onChange({
      items: [
        ...content.items,
        { id: genId(), label: "", required: true },
      ],
    });
  }

  function updateItem(id: string, patch: Partial<ChecklistItem>) {
    onChange({
      items: content.items.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      ),
    });
  }

  function removeItem(id: string) {
    onChange({ items: content.items.filter((item) => item.id !== id) });
  }

  return (
    <div className="space-y-2">
      {content.items.length === 0 && (
        <p className="text-xs text-white/30 py-3 text-center">
          Noch keine Aufgaben — füge die erste hinzu.
        </p>
      )}
      {content.items.map((item) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="text"
            value={item.label}
            onChange={(e) => updateItem(item.id, { label: e.target.value })}
            placeholder="Aufgabe beschreiben…"
            className={inputClass}
          />
          <button
            onClick={() => updateItem(item.id, { required: !item.required })}
            title={item.required ? "Pflicht" : "Optional"}
            className={`shrink-0 text-xs px-2 py-1 rounded border transition-colors ${
              item.required
                ? "border-[var(--c-accent)]/40 text-[var(--c-accent)] bg-[var(--c-accent)]/10"
                : "border-white/10 text-white/30 bg-white/5"
            }`}
          >
            {item.required ? "Pflicht" : "Optional"}
          </button>
          <button
            onClick={() => removeItem(item.id)}
            className="shrink-0 text-white/30 hover:text-white/70 transition-colors"
            title="Entfernen"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      ))}
      <button
        onClick={addItem}
        className="mt-1 flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Aufgabe hinzufügen
      </button>
    </div>
  );
}
