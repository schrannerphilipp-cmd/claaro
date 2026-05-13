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

      {/* Feedback-Button — global auf allen Seiten */}
      <button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all hover:scale-105 hover:brightness-110"
        style={{
          ...sans,
          backgroundColor: "rgba(200,75,47,0.15)",
          borderColor: "rgba(200,75,47,0.5)",
          color: "#e8705a",
          backdropFilter: "blur(8px)",
          boxShadow: "0 0 16px rgba(200,75,47,0.2)",
        }}
        aria-label="Feedback senden"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Feedback
      </button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <ZeitersparnisToast />
    </>
  );
}
