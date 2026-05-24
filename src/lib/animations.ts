/**
 * Shared framer-motion variants for Claaro.
 * Import and use with motion.div, motion.section, etc.
 */

import type { Variants } from "framer-motion";

// ── Page / section entrance ───────────────────────────────────────────────────

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.25, ease: "easeOut" } },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.4,  ease: [0.25, 0.1, 0.25, 1] } },
};

// ── Stagger container ─────────────────────────────────────────────────────────

export const staggerContainer = (staggerChildren = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show:   { transition: { staggerChildren, delayChildren } },
});

// ── Card hover (use with whileHover) ──────────────────────────────────────────

export const cardHover = {
  scale:     1.02,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.07)",
  transition: { duration: 0.2, ease: "easeOut" },
};

// ── Button tap (use with whileTap) ────────────────────────────────────────────

export const buttonTap = {
  scale:      0.97,
  transition: { duration: 0.12, ease: "easeOut" },
};

// ── Modal entrance ────────────────────────────────────────────────────────────

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.2 } },
  exit:   { opacity: 0, transition: { duration: 0.15 } },
};

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 8 },
  show:   { opacity: 1, scale: 1,    y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
  exit:   { opacity: 0, scale: 0.96, y: 4, transition: { duration: 0.15, ease: "easeIn" } },
};

// ── Page transition ───────────────────────────────────────────────────────────

export const pageEnter: Variants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

// ── List items ────────────────────────────────────────────────────────────────

export const listItem: Variants = {
  hidden: { opacity: 0, x: -12 },
  show:   { opacity: 1, x: 0,   transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] } },
};

// ── Success feedback ──────────────────────────────────────────────────────────

export const successPop: Variants = {
  hidden: { scale: 0.88, opacity: 0 },
  show:   { scale: 1,    opacity: 1, transition: { type: "spring", stiffness: 400, damping: 22 } },
};
