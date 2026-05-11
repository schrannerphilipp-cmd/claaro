const serif = { fontFamily: "var(--font-dm-serif)" } as const;
const sans  = { fontFamily: "var(--font-dm-sans)"  } as const;

export default function PaymentSuccessPage() {
  return (
    <div
      className="min-h-screen bg-[#1a1814] flex items-center justify-center px-6"
      style={sans}
    >
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-[#1e7a6b]/20 flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-[#1e7a6b]" fill="none" viewBox="0 0 24 24">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1
          className="text-3xl text-white mb-3"
          style={serif}
        >
          Zahlung bestätigt
        </h1>
        <p className="text-white/50 text-base leading-relaxed">
          Vielen Dank für Ihre Zahlung. Die Rechnung wurde als beglichen
          markiert. Sie erhalten keine weiteren Mahnungen.
        </p>
      </div>
    </div>
  );
}
