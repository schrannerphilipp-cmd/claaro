"use client";

import { useState, useEffect } from "react";

export interface LoyaltyData {
  status:                "standard" | "silber" | "gold";
  status_since:          string;
  discount_applied:      boolean;
  referral_code:         string;
  referral_count:        number;
  free_month_pending:    boolean;
  months_since_creation: number;
  months_to_silber:      number;
  months_to_gold:        number;
}

interface CacheEntry {
  data:      LoyaltyData;
  fetchedAt: number;
}

const CACHE_KEY = "claaro-loyalty-cache";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function readCache(): LoyaltyData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache(data: LoyaltyData) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));
  } catch { /* ignore */ }
}

export function useLoyalty() {
  const [loyalty,  setLoyalty]  = useState<LoyaltyData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setLoyalty(cached);
      setLoading(false);
      return;
    }

    fetch("/api/loyalty/check", { method: "POST" })
      .then(async (res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        const json = await res.json();
        const data: LoyaltyData = json.loyalty;
        writeCache(data);
        setLoyalty(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function invalidateCache() {
    try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
  }

  return { loyalty, loading, error, invalidateCache };
}
