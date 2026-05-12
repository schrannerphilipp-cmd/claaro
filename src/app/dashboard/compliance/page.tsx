import FeatureLayout from "../_components/feature-layout";
import ComplianceView from "./_components/ComplianceView";

export default function CompliancePage() {
  return (
    <FeatureLayout
      name="Compliance"
      description="Behalten Sie gesetzliche Fristen, Meldepflichten und branchenspezifische Vorschriften jederzeit im Blick. claaro erinnert Sie proaktiv an relevante Anforderungen und hilft Ihnen, compliant zu bleiben — ohne juristisches Fachwissen."
    >
      <ComplianceView />
    </FeatureLayout>
  );
}
