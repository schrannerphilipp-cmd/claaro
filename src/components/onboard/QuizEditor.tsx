"use client";

import { QuizContent, QuizQuestion } from "@/types/onboard";

const inputClass =
  "w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors";
const labelClass = "block text-xs text-white/40 mb-1";

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

interface QuizEditorProps {
  content: QuizContent;
  onChange: (content: QuizContent) => void;
}

export default function QuizEditor({ content, onChange }: QuizEditorProps) {
  function addQuestion() {
    onChange({
      questions: [
        ...content.questions,
        {
          id: genId(),
          question: "",
          options: ["", "", "", ""],
          correctIndex: 0,
          explanation: "",
        },
      ],
    });
  }

  function updateQuestion(id: string, patch: Partial<QuizQuestion>) {
    onChange({
      questions: content.questions.map((q) =>
        q.id === id ? { ...q, ...patch } : q
      ),
    });
  }

  function removeQuestion(id: string) {
    onChange({ questions: content.questions.filter((q) => q.id !== id) });
  }

  function updateOption(q: QuizQuestion, optIdx: number, value: string) {
    const options = q.options.map((o, i) => (i === optIdx ? value : o));
    updateQuestion(q.id, { options });
  }

  return (
    <div className="space-y-5">
      {content.questions.length === 0 && (
        <p className="text-xs text-white/30 py-3 text-center">
          Noch keine Fragen — füge die erste hinzu.
        </p>
      )}

      {content.questions.map((q, qIdx) => (
        <div key={q.id} className="border border-white/10 rounded-xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-medium text-white/50">Frage {qIdx + 1}</p>
            <button
              onClick={() => removeQuestion(q.id)}
              className="text-white/30 hover:text-white/70 transition-colors"
              title="Frage löschen"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div>
            <label className={labelClass}>Frage</label>
            <textarea
              value={q.question}
              onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
              placeholder="Wie lautet die Frage?"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Antwortmöglichkeiten (richtige anklicken)</label>
            {q.options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2">
                <button
                  onClick={() => updateQuestion(q.id, { correctIndex: optIdx })}
                  className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    q.correctIndex === optIdx
                      ? "border-[var(--c-teal)] bg-[var(--c-teal)]/20"
                      : "border-white/20"
                  }`}
                >
                  {q.correctIndex === optIdx && (
                    <div className="w-2 h-2 rounded-full bg-[var(--c-teal)]" />
                  )}
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(q, optIdx, e.target.value)}
                  placeholder={`Option ${optIdx + 1}`}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div>
            <label className={labelClass}>Erklärung (nach der Antwort angezeigt)</label>
            <textarea
              value={q.explanation}
              onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
              placeholder="Warum ist das die richtige Antwort?"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addQuestion}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Frage hinzufügen
      </button>
    </div>
  );
}
