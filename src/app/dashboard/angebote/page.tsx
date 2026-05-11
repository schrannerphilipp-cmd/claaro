import FeatureLayout from "../_components/feature-layout";
import AngebotFormular from "../../angebot/AngebotFormular";

export default function AngebotePage() {
  return (
    <FeatureLayout
      name="Angebote"
      description="Erstellen Sie in wenigen Minuten professionelle Angebote mit automatischer Berechnung, Mehrwertsteuerausweis und direktem PDF-Export. Ideal für Handwerksbetriebe und Dienstleister, die Zeit sparen und einen überzeugenden ersten Eindruck hinterlassen wollen."
    >
      <AngebotFormular />
    </FeatureLayout>
  );
}
