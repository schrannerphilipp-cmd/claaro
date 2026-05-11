"use client";

import { useState } from "react";
import { ReviewEntry } from "@/types/bewertung";

const sans = { fontFamily: "var(--font-dm-sans)" } as const;

type Range = 30 | 90;

interface DataPoint {
  label: string;
  avg: number;
  count: number;
}

function buildChartData(entries: ReviewEntry[], range: Range): DataPoint[] {
  const now = Date.now();
  const buckets = range === 30 ? 10 : 13;
  const bucketMs = (range * 24 * 60 * 60 * 1000) / buckets;
  const cutoff = now - range * 24 * 60 * 60 * 1000;

  return Array.from({ length: buckets }, (_, i) => {
    const bucketStart = cutoff + i * bucketMs;
    const bucketEnd = bucketStart + bucketMs;
    const label = new Date(bucketStart + bucketMs / 2).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });
    const inBucket = entries.filter((e) => {
      const t = new Date(e.publishedAt).getTime();
      return t >= bucketStart && t < bucketEnd;
    });
    const avg =
      inBucket.length > 0
        ? inBucket.reduce((s, e) => s + e.rating, 0) / inBucket.length
        : 0;
    return { label, avg, count: inBucket.length };
  });
}

function buildStarDistribution(entries: ReviewEntry[]): { star: number; count: number; pct: number }[] {
  const total = entries.length;
  return [5, 4, 3, 2, 1].map((star) => {
    const count = entries.filter((e) => e.rating === star).length;
    return { star, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });
}

// SVG polyline chart
function LineChart({ data, height = 100 }: { data: DataPoint[]; height?: number }) {
  const width = 500;
  const padX = 30;
  const padY = 10;
  const chartW = width - padX;
  const chartH = height - padY;

  const hasData = data.some((d) => d.count > 0);
  if (!hasData) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-white/20">Noch keine Daten für diesen Zeitraum.</p>
      </div>
    );
  }

  const points = data.map((d, i) => {
    const x = padX + (i / (data.length - 1)) * chartW;
    const y = d.count > 0 ? padY + ((5 - d.avg) / 4) * chartH : -1;
    return { x, y, ...d };
  });

  const linePoints = points
    .filter((p) => p.y >= 0)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const areaPoints = [
    ...points.filter((p) => p.y >= 0).map((p) => `${p.x},${p.y}`),
    ...points
      .filter((p) => p.y >= 0)
      .reverse()
      .map((p) => `${p.x},${padY + chartH}`),
  ].join(" ");

  const yLabels = [5, 4, 3, 2, 1];

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="w-full" preserveAspectRatio="none">
      {/* Y-axis labels */}
      {yLabels.map((v) => {
        const y = padY + ((5 - v) / 4) * chartH;
        return (
          <text key={v} x={padX - 5} y={y + 4} textAnchor="end" fontSize="9" fill="rgba(255,255,255,0.2)"
            fontFamily="var(--font-dm-sans)">{v}</text>
        );
      })}
      {/* Y-axis grid lines */}
      {yLabels.map((v) => {
        const y = padY + ((5 - v) / 4) * chartH;
        return (
          <line key={v} x1={padX} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        );
      })}
      {/* Area fill */}
      {linePoints && (
        <polygon points={areaPoints} fill="url(#chartGrad)" opacity="0.3"/>
      )}
      {/* Line */}
      {linePoints && (
        <polyline points={linePoints} fill="none" stroke="var(--c-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
      {/* Dots */}
      {points.filter((p) => p.y >= 0 && p.count > 0).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="var(--c-teal)" stroke="#1a1814" strokeWidth="1.5"/>
      ))}
      {/* X-axis labels (show every 3rd) */}
      {points.map((p, i) => {
        if (i % Math.ceil(data.length / 5) !== 0) return null;
        return (
          <text key={i} x={p.x} y={height + 18} textAnchor="middle" fontSize="9"
            fill="rgba(255,255,255,0.2)" fontFamily="var(--font-dm-sans)">{p.label}</text>
        );
      })}
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--c-teal)" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="var(--c-teal)" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

interface RatingChartProps {
  entries: ReviewEntry[];
}

export default function RatingChart({ entries }: RatingChartProps) {
  const [range, setRange] = useState<Range>(30);
  const chartData = buildChartData(entries, range);
  const starDist = buildStarDistribution(entries);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={sans}>
      {/* Line chart */}
      <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-medium text-white/60">Ø Bewertungsverlauf</p>
          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-0.5">
            {([30, 90] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                  range === r ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                }`}
              >
                {r} Tage
              </button>
            ))}
          </div>
        </div>
        <LineChart data={chartData} />
      </div>

      {/* Star distribution */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-xs font-medium text-white/60 mb-4">Sternverteilung</p>
        {entries.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <p className="text-xs text-white/20">Keine Daten</p>
          </div>
        ) : (
          <div className="space-y-2">
            {starDist.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-3">{star}</span>
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 12 12" fill="var(--c-amber)">
                  <path d="M6 1l1.4 2.8 3.1.5-2.2 2.1.5 3.1L6 8.2 3.2 9.5l.5-3.1L1.5 4.3l3.1-.5z"/>
                </svg>
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: "var(--c-amber)" }}
                  />
                </div>
                <span className="text-xs text-white/30 w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
