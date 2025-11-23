"use client";

type Point = {
  date: string;
  nav: number;
};

export function Sparkline({ points, width = 220, height = 80 }: { points: Point[]; width?: number; height?: number }) {
  if (!points.length) {
    return <div role="img" aria-label="NAV sparkline" data-empty="true" />;
  }
  const normalized = normalize(points, width, height);
  const path = toPath(normalized);
  return (
    <svg width={width} height={height} role="img" aria-label="NAV sparkline">
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
        </linearGradient>
      </defs>
      <path d={path} fill="none" stroke="#16a34a" strokeWidth={2} />
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#spark)" opacity={0.25} />
    </svg>
  );
}

function normalize(points: Point[], width: number, height: number) {
  const minNav = Math.min(...points.map((p) => p.nav));
  const maxNav = Math.max(...points.map((p) => p.nav));
  const span = maxNav - minNav || 1;
  return points.map((point, index) => {
    const x = (index / Math.max(points.length - 1, 1)) * width;
    const y = height - ((point.nav - minNav) / span) * height;
    return { x, y };
  });
}

function toPath(points: { x: number; y: number }[]) {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ");
}