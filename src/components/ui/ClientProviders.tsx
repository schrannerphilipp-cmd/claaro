"use client";

import { useState } from "react";
import ZeitersparnisToast from "./ZeitersparnisToast";
import FeedbackModal from "@/components/feedback/FeedbackModal";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <>
      {children}

      {/* Feedback-Button — dezent, global auf allen Seiten */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all hover:scale-105"
        style={{
          ...sans,
          backgroundColor: "rgba(26,24,20,0.85)",
          borderColor: "rgba(255,255,255,0.12)",
          color: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(8px)",
        }}
        aria-label="Feedback senden"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 16 16">
          <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <ZeitersparnisToast />
    </>
  );
}
