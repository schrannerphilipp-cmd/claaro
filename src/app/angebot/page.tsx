import Link from "next/link";
import AngebotFormular from "./AngebotFormular";

export default function AngebotPage() {
  return (
    <div className="min-h-screen bg-[#1a1814]">
      <header className="bg-[#1a1814] border-b border-white/10">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#c84b2f] tracking-tight">
            Claaro
          </Link>
          <span className="text-sm text-white/40">Neues Angebot erstellen</span>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <AngebotFormular />
      </main>
    </div>
  );
}
