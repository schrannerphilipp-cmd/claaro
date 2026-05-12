import FeatureLayout from "../_components/feature-layout";
import LogoUpload from "@/components/settings/LogoUpload";
import FirmendatenForm from "@/components/settings/FirmendatenForm";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

export default function EinstellungenPage() {
  return (
    <FeatureLayout
      name="Einstellungen"
      description="Passen Sie claaro an Ihr Unternehmen an — Logo, Firmendaten und mehr."
    >
      <div className="max-w-xl space-y-8" style={sans}>
        {/* Logo */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <LogoUpload />
        </div>

        {/* Firmendaten */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <FirmendatenForm />
        </div>
      </div>
    </FeatureLayout>
  );
}
