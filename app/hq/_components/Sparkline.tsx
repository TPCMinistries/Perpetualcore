import type { SparkPoint } from '@/lib/hq/metrics';

/** Tiny inline sparkline — no axes, last-point dot, stroke inherits currentColor. */
export function Sparkline({ points }: { points: SparkPoint[] }) {
  if (points.length < 2) return null;

  const width = 90;
  const height = 24;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * width,
    y: height - ((p.value - min) / range) * height,
  }));
  const last = coords[coords.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline
        points={coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={2} fill="currentColor" />
    </svg>
  );
}
