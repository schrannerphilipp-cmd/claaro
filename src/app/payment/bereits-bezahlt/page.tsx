const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)"  } as const;

export default function BereitsBezahltPage() {
  return (
    <div
      className="min-h-screen bg-[#1a1814] flex items-center justify-center px-6"
      style={sans}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1
          className="text-3xl text-white mb-3"
          style={serif}
        >
          Bereits bezahlt
        </h1>
        <p className="text-white/50 text-base leading-relaxed">
          Diese Rechnung wurde bereits beglichen. Falls Sie Fragen haben,
          wenden Sie sich bitte direkt an Ihren Ansprechpartner.
        </p>
      </div>
    </div>
  );
}
