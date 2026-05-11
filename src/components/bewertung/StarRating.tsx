"use client";

import { StarRating as StarRatingType } from "@/types/bewertung";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (rating: StarRatingType) => void;
}

const SIZES = { sm: 12, md: 16, lg: 24 };

export default function StarRating({
  rating,
  max = 5,
  size = "md",
  interactive = false,
  onChange,
}: StarRatingProps) {
  const px = SIZES[size];
  const color = rating >= 4 ? "var(--c-amber)" : rating >= 3 ? "#f59e0b" : "var(--c-accent)";

  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= rating;
        return (
          <svg
            key={i}
            width={px}
            height={px}
            viewBox="0 0 16 16"
            fill={filled ? color : "none"}
            stroke={filled ? color : "rgba(255,255,255,0.2)"}
            strokeWidth="1.2"
            onClick={interactive && onChange ? () => onChange((i + 1) as StarRatingType) : undefined}
            style={interactive ? { cursor: "pointer" } : undefined}
          >
            <path d="M8 1l1.9 3.8 4.2.6-3 3 .7 4.2L8 10.4 4.2 12.6l.7-4.2-3-3 4.2-.6z" />
          </svg>
        );
      })}
    </span>
  );
}
