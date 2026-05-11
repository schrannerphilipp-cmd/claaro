"use client";

import { useState, useEffect, useCallback } from "react";
import { OnboardTemplate, OnboardStep } from "@/types/onboard";

const STORAGE_KEY = "claaro_onboard_templates";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function totalMinutes(steps: OnboardStep[]): number {
  return steps.reduce((s, step) => s + step.estimatedMinutes, 0);
}

export function useOnboardTemplates() {
  const [templates, setTemplates] = useState<OnboardTemplate[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTemplates(JSON.parse(raw) as OnboardTemplate[]);
    } catch {
      // corrupt storage — start fresh
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  }, [templates, isLoaded]);

  const createTemplate = useCallback((): OnboardTemplate => {
    const now = new Date().toISOString();
    const t: OnboardTemplate = {
      id: genId(),
      title: "Neues Template",
      role: "",
      description: "",
      estimatedMinutes: 0,
      steps: [],
      createdAt: now,
      updatedAt: now,
      isPublished: false,
    };
    setTemplates((prev) => [...prev, t]);
    return t;
  }, []);

  const updateTemplate = useCallback(
    (id: string, patch: Partial<Omit<OnboardTemplate, "id" | "createdAt">>) => {
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          const merged = { ...t, ...patch, updatedAt: new Date().toISOString() };
          if (patch.steps) merged.estimatedMinutes = totalMinutes(patch.steps);
          return merged;
        })
      );
    },
    []
  );

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTemplate = useCallback(
    (id: string): OnboardTemplate | null =>
      templates.find((t) => t.id === id) ?? null,
    [templates]
  );

  return { templates, isLoaded, createTemplate, updateTemplate, deleteTemplate, getTemplate };
}
