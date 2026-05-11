"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewEntry, EntryStatus } from "@/types/bewertung";

const KEY = "claaro_review_entries";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useReviewEntries() {
  const [entries, setEntries] = useState<ReviewEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setEntries(JSON.parse(raw) as ReviewEntry[]);
    } catch { /* start fresh */ }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(KEY, JSON.stringify(entries));
  }, [entries, isLoaded]);

  const addEntry = useCallback((data: Omit<ReviewEntry, "id">): ReviewEntry => {
    const e: ReviewEntry = { id: genId(), ...data };
    setEntries((prev) => [e, ...prev]);
    return e;
  }, []);

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<ReviewEntry, "id">>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    []
  );

  const markRead = useCallback((id: string) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.id === id && e.status === "new" ? { ...e, status: "read" as EntryStatus } : e
      )
    );
  }, []);

  const respond = useCallback(
    (id: string, responseText: string, responseTemplateId?: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? {
                ...e,
                responseText,
                responseTemplateId,
                respondedAt: new Date().toISOString(),
                status: "responded" as EntryStatus,
              }
            : e
        )
      );
    },
    []
  );

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, isLoaded, addEntry, updateEntry, markRead, respond, deleteEntry };
}
