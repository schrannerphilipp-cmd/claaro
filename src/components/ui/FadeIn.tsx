"use client";

/**
 * FadeIn — scroll-triggered entrance animation using framer-motion viewport.
 * Fires once per element when it enters the viewport.
 * Respects prefers-reduced-motion.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode, CSSProperties } from "react";

type Props = {
  children: ReactNode;
  /** Stagger delay in seconds (e.g. 0.1 per item in a list) */
  delay?: number;
  /** How far the element starts below its final position */
  y?: number;
  /** Optional className on the wrapper div */
  className?: string;
  style?: CSSProperties;
  /** Render as a different element */
  as?: "div" | "section" | "article" | "li" | "span";
};

export default function FadeIn({
  children,
  delay = 0,
  y = 20,
  className,
  style,
  as = "div",
}: Props) {
  const reduced = useReducedMotion();

  const Tag = motion[as] as typeof motion.div;

  return (
    <Tag
      className={className}
      style={style}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: reduced ? 0.2 : 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * FadeInGroup — staggered children with IntersectionObserver on the container.
 * Each child needs its own FadeIn (or use staggerContainer variant directly).
 */
export function FadeInStagger({
  children,
  stagger = 0.07,
  className,
}: {
  children: ReactNode;
  stagger?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduced ? 0 : stagger,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * FadeInItem — use inside FadeInStagger.
 */
export function FadeInItem({
  children,
  className,
  y = 16,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: reduced ? 0 : y },
        show:   { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } },
      }}
    >
      {children}
    </motion.div>
  );
}
