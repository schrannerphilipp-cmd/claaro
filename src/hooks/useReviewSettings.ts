"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewSettings, ReviewPlatform } from "@/types/bewertung";

const KEY = "claaro_review_settings";

const DEFAULT_PLATFORMS: ReviewPlatform[] = [
  {
    id: "google",
    name: "Google",
    url: "",
    isActive: true,
    type: "google",
    isDefault: true,
  },
  {
    id: "yelp",
    name: "Yelp",
    url: "",
    isActive: false,
    type: "yelp",
  },
  {
    id: "trustpilot",
    name: "Trustpilot",
    url: "",
    isActive: false,
    type: "trustpilot",
  },
];

const DEFAULT_SETTINGS: ReviewSettings = {
  platforms: DEFAULT_PLATFORMS,
  autoSendEnabled: false,
  autoSendDelayMinutes: 60,
  autoSendTrigger: "transaction",
  defaultChannel: "whatsapp",
  defaultRequestTemplateId: "",
  businessName: "Mein Betrieb",
  testPhone: "",
};

export function useReviewSettings() {
  const [settings, setSettings] = useState<ReviewSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ReviewSettings;
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      }
    } catch { /* start fresh */ }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(KEY, JSON.stringify(settings));
  }, [settings, isLoaded]);

  const updateSettings = useCallback((patch: Partial<ReviewSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const updatePlatform = useCallback(
    (id: string, patch: Partial<ReviewPlatform>) => {
      setSettings((prev) => ({
        ...prev,
        platforms: prev.platforms.map((p) =>
          p.id === id ? { ...p, ...patch } : p
        ),
      }));
    },
    []
  );

  const addPlatform = useCallback((platform: ReviewPlatform) => {
    setSettings((prev) => ({
      ...prev,
      platforms: [...prev.platforms, platform],
    }));
  }, []);

  const removePlatform = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      platforms: prev.platforms.filter((p) => p.id !== id),
    }));
  }, []);

  const setDefaultPlatform = useCallback((id: string) => {
    setSettings((prev) => ({
      ...prev,
      platforms: prev.platforms.map((p) => ({
        ...p,
        isDefault: p.id === id,
      })),
    }));
  }, []);

  return {
    settings,
    isLoaded,
    updateSettings,
    updatePlatform,
    addPlatform,
    removePlatform,
    setDefaultPlatform,
  };
}
