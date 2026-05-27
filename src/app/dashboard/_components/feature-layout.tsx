"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export function ComingSoon() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl py-20 px-8 text-center">
      <p className="text-4xl mb-5">🔧</p>
      <p className="text-white font-semibold mb-2">In Entwicklung</p>
      <p className="text-white/55 text-sm max-w-sm mx-auto leading-relaxed">
        Dieses Feature wird gerade gebaut und ist bald verfügbar.
      </p>
    </div>
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

  function handleBack() {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("claaro-nav-back", "1");
    }
    router.push(backHref ?? "/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#241c14]" style={sans}>
      {/* Top bar */}
      <header className="border-b border-white/10 sticky top-0 z-30 bg-[#241c14]">
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 c-fade-up">
        <div className="mb-10">
          <h1 className="text-3xl lg:text-4xl text-white mb-4" style={serif}>
            {name}
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-2xl">
            {description}
          </p>
        </div>
        <div>
          {children}
        </div>
      </main>

      {/* Legal footer */}
      <footer className="border-t border-white/8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-white/28">
          <span>© 2026 claaro</span>
          <div className="flex items-center gap-4">
            <Link href="/impressum" className="hover:text-white/50 transition-colors">Impressum</Link>
            <Link href="/datenschutz" className="hover:text-white/50 transition-colors">Datenschutz</Link>
            <Link href="/agb" className="hover:text-white/50 transition-colors">AGB</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
