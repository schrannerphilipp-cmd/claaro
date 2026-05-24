"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ZeitersparnisToast from "./ZeitersparnisToast";
import FeedbackModal from "@/components/feedback/FeedbackModal";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();

  return (
    <>
      {/* Route-level fade transition — subtle, 200ms, no layout shift */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? {} : { opacity: 0 }}
          transition={{ duration: 0.18, ease: "easeInOut" }}
          style={{ flex: 1, display: "flex", flexDirection: "column" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Feedback-Button — global auf allen Seiten */}
      <motion.button
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-6 left-6 z-40 flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border"
        style={{
          ...sans,
          backgroundColor: "rgba(var(--c-accent-rgb),0.15)",
          borderColor: "rgba(var(--c-accent-rgb),0.5)",
          color: "#e8705a",
          backdropFilter: "blur(8px)",
          boxShadow: "0 0 16px rgba(var(--c-accent-rgb),0.2)",
        }}
        aria-label="Feedback senden"
        whileHover={reduced ? {} : { scale: 1.05, boxShadow: "0 0 24px rgba(200,75,47,0.35)" }}
        whileTap={reduced ? {} : { scale: 0.95 }}
        transition={{ duration: 0.15 }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 16 16">
          <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Feedback
      </motion.button>

      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
      <ZeitersparnisToast />
    </>
  );
}
