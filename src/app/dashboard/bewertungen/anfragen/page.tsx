"use client";

import FeatureLayout from "../../_components/feature-layout";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useReviewSettings } from "@/hooks/useReviewSettings";
import RequestStatusList from "@/components/bewertung/RequestStatusList";

export default function AnfragenPage() {
  const { requests, deleteRequest } = useReviewRequests();
  const { settings } = useReviewSettings();

  return (
    <FeatureLayout
      name="Anfragen"
      description="Alle gesendeten Bewertungsanfragen und ihr aktueller Status."
      backHref="/dashboard/bewertungen"
    >
      <RequestStatusList
        requests={requests}
        platforms={settings.platforms}
        onDelete={deleteRequest}
      />
    </FeatureLayout>
  );
}
