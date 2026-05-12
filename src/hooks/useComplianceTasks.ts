"use client";

import { useState, useEffect, useCallback } from "react";
import type { ComplianceTask, ComplianceStatus } from "@/types/compliance";
import { COMPLIANCE_SEED } from "@/lib/compliance-data";

const STORAGE_KEY = "claaro-compliance-tasks";

function computeStatus(task: ComplianceTask): ComplianceStatus {
  if (task.status === "erledigt") return "erledigt";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const frist = new Date(task.frist);
  frist.setHours(0, 0, 0, 0);
  return frist < today ? "überfällig" : "offen";
}

function hydrate(tasks: ComplianceTask[]): ComplianceTask[] {
  return tasks.map((t) => ({ ...t, status: computeStatus(t) }));
}

export function useComplianceTasks() {
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setTasks(hydrate(JSON.parse(raw) as ComplianceTask[]));
      } else {
        setTasks(hydrate(COMPLIANCE_SEED));
      }
    } catch {
      setTasks(hydrate(COMPLIANCE_SEED));
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, loaded]);

  const markErledigt = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "erledigt" } : t))
    );
  }, []);

  const markOffen = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: computeStatus({ ...t, status: "offen" }) } : t
      )
    );
  }, []);

  const reset = useCallback(() => {
    const fresh = hydrate(COMPLIANCE_SEED);
    setTasks(fresh);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  }, []);

  return { tasks, loaded, markErledigt, markOffen, reset };
}
