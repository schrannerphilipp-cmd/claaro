"use client";

/**
 * Skeleton loaders for Claaro.
 * Uses the .c-skeleton CSS class defined in globals.css (wave animation).
 */

import { CSSProperties } from "react";

// ── Base skeleton block ───────────────────────────────────────────────────────

type SkeletonProps = {
  width?: string | number;
  height?: string | number;
  rounded?: string;
  className?: string;
  style?: CSSProperties;
};

export function Skeleton({
  width = "100%",
  height = "1rem",
  rounded = "8px",
  className = "",
  style,
}: SkeletonProps) {
  return (
    <div
      className={`c-skeleton ${className}`}
      style={{ width, height, borderRadius: rounded, ...style }}
      aria-hidden="true"
    />
  );
}

// ── Card skeleton ─────────────────────────────────────────────────────────────

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 border border-white/10 rounded-xl p-6 space-y-3 ${className}`}
      aria-hidden="true"
    >
      <Skeleton height="1.1rem" width="60%" />
      <Skeleton height="0.85rem" width="85%" />
      <Skeleton height="0.85rem" width="70%" />
      <div className="pt-2">
        <Skeleton height="2rem" width="40%" rounded="8px" />
      </div>
    </div>
  );
}

// ── Table row skeleton ────────────────────────────────────────────────────────

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <Skeleton
            height="0.875rem"
            width={i === 0 ? "70%" : i === cols - 1 ? "50%" : "60%"}
          />
        </td>
      ))}
    </tr>
  );
}

// ── List of skeleton cards ────────────────────────────────────────────────────

export function SkeletonCards({ count = 3, className = "" }: { count?: number; className?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

// ── Profile skeleton ──────────────────────────────────────────────────────────

export function SkeletonProfile() {
  return (
    <div className="flex items-center gap-4" aria-hidden="true">
      <Skeleton width={80} height={80} rounded="50%" />
      <div className="space-y-2 flex-1">
        <Skeleton height="1rem" width="40%" />
        <Skeleton height="0.8rem" width="60%" />
      </div>
    </div>
  );
}

// ── Text block skeleton ───────────────────────────────────────────────────────

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  const widths = ["100%", "85%", "70%", "90%", "60%"];
  return (
    <div className="space-y-2" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.875rem" width={widths[i % widths.length]} />
      ))}
    </div>
  );
}
