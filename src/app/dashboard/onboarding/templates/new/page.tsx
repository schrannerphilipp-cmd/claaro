"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardTemplates } from "@/hooks/useOnboardTemplates";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function NewTemplatePage() {
  const router = useRouter();
  const { createTemplate, isLoaded } = useOnboardTemplates();

  useEffect(() => {
    if (!isLoaded) return;
    const t = createTemplate();
    router.replace(`/dashboard/onboarding/templates/${t.id}`);
  }, [isLoaded, createTemplate, router]);

  return (
    <div
      className="min-h-screen bg-[#1a1814] flex items-center justify-center"
      style={sans}
    >
      <p className="text-sm text-white/30">Template wird erstellt…</p>
    </div>
  );
}
