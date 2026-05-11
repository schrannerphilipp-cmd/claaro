"use client";

import { useState, useEffect, useCallback } from "react";
import { ReviewRequest, RequestStatus } from "@/types/bewertung";

const KEY = "claaro_review_requests";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useReviewRequests() {
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRequests(JSON.parse(raw) as ReviewRequest[]);
    } catch { /* start fresh */ }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(KEY, JSON.stringify(requests));
  }, [requests, isLoaded]);

  const addRequest = useCallback(
    (data: Omit<ReviewRequest, "id">): ReviewRequest => {
      const r: ReviewRequest = { id: genId(), ...data };
      setRequests((prev) => [r, ...prev]);
      return r;
    },
    []
  );

  const updateStatus = useCallback(
    (id: string, status: RequestStatus, extra?: Partial<ReviewRequest>) => {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status, ...extra } : r))
      );
    },
    []
  );

  const deleteRequest = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { requests, isLoaded, addRequest, updateStatus, deleteRequest };
}
