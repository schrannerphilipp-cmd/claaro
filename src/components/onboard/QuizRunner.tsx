"use client";

import { useState } from "react";
import { QuizContent } from "@/types/onboard";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

interface QuizRunnerProps {
  content: QuizContent;
  onComplete: (score: number) => void;
}

export default function QuizRunner({ content, onComplete }: QuizRunnerProps) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  const { questions } = content;
  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-white/30 text-sm" style={sans}>
        Dieses Quiz hat keine Fragen.
      </div>
    );
  }

  const q = questions[qIdx];
  const isAnswered = selected !== null;
  const isCorrect = selected === q.correctIndex;
  const isLastQuestion = qIdx === questions.length - 1;

  function handleSelect(optIdx: number) {
    if (isAnswered) return;
    setSelected(optIdx);
  }

  function handleNext() {
    const newAnswers = [...answers, selected!];
    if (isLastQuestion) {
      const correct = newAnswers.filter(
        (ans, i) => ans === questions[i].correctIndex
      ).length;
      const score = Math.round((correct / questions.length) * 100);
      onComplete(score);
    } else {
      setAnswers(newAnswers);
      setQIdx((i) => i + 1);
      setSelected(null);
    }
  }

  return (
    <div style={sans} className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-colors ${
              i < qIdx
                ? "bg-[var(--c-teal)]"
                : i === qIdx
                ? "bg-white/40"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <div>
        <p className="text-xs text-white/40 mb-2">
          Frage {qIdx + 1} von {questions.length}
        </p>
        <p className="text-base font-medium text-white leading-relaxed">{q.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {q.options.map((opt, optIdx) => {
          let style = "border-white/10 bg-white/5 text-white/70 hover:border-white/20";
          if (isAnswered) {
            if (optIdx === q.correctIndex) {
              style = "border-[var(--c-teal)]/60 bg-[var(--c-teal)]/10 text-[var(--c-teal)]";
            } else if (optIdx === selected) {
              style = "border-[var(--c-accent)]/60 bg-[var(--c-accent)]/10 text-[var(--c-accent)]";
            } else {
              style = "border-white/5 bg-white/[0.02] text-white/30";
            }
          }
          return (
            <button
              key={optIdx}
              onClick={() => handleSelect(optIdx)}
              disabled={isAnswered}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ${style}`}
            >
              <span className="font-medium text-xs mr-2 opacity-60">
                {String.fromCharCode(65 + optIdx)}.
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && (
        <div
          className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
            isCorrect
              ? "bg-[var(--c-teal)]/10 text-[var(--c-teal)]"
              : "bg-[var(--c-accent)]/10 text-[var(--c-accent)]"
          }`}
        >
          <p className="font-medium mb-1">{isCorrect ? "Richtig! ✓" : "Leider falsch."}</p>
          {q.explanation && <p className="opacity-80 text-xs">{q.explanation}</p>}
        </div>
      )}

      {/* Next */}
      {isAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
          style={{ backgroundColor: "rgba(30,122,107,0.25)", color: "var(--c-teal)" }}
        >
          {isLastQuestion ? "Auswertung anzeigen" : "Nächste Frage →"}
        </button>
      )}
    </div>
  );
}
