"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import FadeIn from "@/components/ui/FadeIn";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export function ComingSoon() {
  return (
    <FadeIn>
      <div className="bg-white/5 border border-white/10 rounded-xl py-20 px-8 text-center">
        <p className="text-4xl mb-5">🔧</p>
        <p className="text-white font-semibold mb-2">In Entwicklung</p>
        <p className="text-white/40 text-sm max-w-sm mx-auto leading-relaxed">
          Dieses Feature wird gerade gebaut und ist bald verfügbar.
        </p>
      </div>
    </FadeIn>
  );
}

export default function FeatureLayout({
  name,
  description,
  children,
  backHref,
}: {
  name: string;
  description: string;
  children: React.ReactNode;
  backHref?: string;
}) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  function handleBack() {
    const el = wrapperRef.current;
    sessionStorage.setItem("claaro-nav-back", "1");
    const dest = backHref ?? "/dashboard";

    if (!el || reduced) {
      router.push(dest);
      return;
    }

    // Slide out to right, then navigate
    el.classList.add("page-exit");
    setTimeout(() => router.push(dest), 390);
  }

  return (
    <motion.div
      ref={wrapperRef}
      className="min-h-screen bg-[#1a1814]"
      style={sans}
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {/* Top bar */}
      <header className="border-b border-white/10 sticky top-0 z-30 bg-[#1a1814]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 grid grid-cols-3 items-center">
          <button
            onClick={handleBack}
            className="c-btn flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Zurück
          </button>
          <p className="text-center text-sm text-white" style={serif}>
            {name}
          </p>
          <div />
        </div>
      </header>

      {/* Description + content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <FadeIn className="mb-10">
          <h1 className="text-3xl lg:text-4xl text-white mb-4" style={serif}>
            {name}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-2xl">
            {description}
          </p>
        </FadeIn>
        <FadeIn delay={0.05}>
          {children}
        </FadeIn>
      </main>
    </motion.div>
  );
}
