"use client";

import { useState, useEffect, useCallback } from "react";
import { OnboardAssignment, AssignmentStatus } from "@/types/onboard";

const STORAGE_KEY = "claaro_onboard_assignments";

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function useOnboardAssignments() {
  const [assignments, setAssignments] = useState<OnboardAssignment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setAssignments(JSON.parse(raw) as OnboardAssignment[]);
    } catch {
      // corrupt storage — start fresh
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments, isLoaded]);

  const createAssignment = useCallback(
    (data: Pick<OnboardAssignment, "templateId" | "employeeId" | "employeeName" | "dueDate">): OnboardAssignment => {
      const a: OnboardAssignment = {
        id: genId(),
        ...data,
        assignedAt: new Date().toISOString(),
        progress: [],
        status: "not_started",
      };
      setAssignments((prev) => [...prev, a]);
      return a;
    },
    []
  );

  const updateProgress = useCallback(
    (assignmentId: string, stepId: string, quizScore?: number) => {
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== assignmentId) return a;
          if (a.progress.some((p) => p.stepId === stepId)) return a;
          return {
            ...a,
            status: "in_progress" as AssignmentStatus,
            progress: [
              ...a.progress,
              {
                stepId,
                completedAt: new Date().toISOString(),
                ...(quizScore !== undefined ? { quizScore } : {}),
              },
            ],
          };
        })
      );
    },
    []
  );

  const completeAssignment = useCallback((assignmentId: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === assignmentId
          ? { ...a, status: "completed" as AssignmentStatus }
          : a
      )
    );
  }, []);

  const deleteAssignment = useCallback((id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const getAssignment = useCallback(
    (id: string): OnboardAssignment | null =>
      assignments.find((a) => a.id === id) ?? null,
    [assignments]
  );

  return {
    assignments,
    isLoaded,
    createAssignment,
    updateProgress,
    completeAssignment,
    deleteAssignment,
    getAssignment,
  };
}
