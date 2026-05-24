"use client";

/**
 * AnimatedModal — drop-in replacement for fixed-overlay modals.
 * Uses framer-motion AnimatePresence for smooth enter/exit.
 * Respects prefers-reduced-motion.
 */

import { ReactNode, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { modalBackdrop, modalPanel } from "@/lib/animations";

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
};

export default function AnimatedModal({
  open,
  onClose,
  children,
  maxWidth = "max-w-md",
}: Props) {
  const reduced = useReducedMotion();

  // Lock scroll when open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(6px)" }}
          variants={reduced ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } } : modalBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          onClick={onClose}
        >
          {/* Scrim */}
          <div className="absolute inset-0 bg-black/60" />

          {/* Panel */}
          <motion.div
            className={`relative w-full ${maxWidth} bg-[#1a1814] border border-white/15 rounded-2xl shadow-2xl overflow-hidden`}
            variants={reduced ? {} : modalPanel}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
