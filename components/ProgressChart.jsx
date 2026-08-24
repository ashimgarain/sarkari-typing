"use client";

export default function ProgressChart({ points = [] }) {
  const data = points.slice(-14);
  if (data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-50 text-sm font-semibold text-slate-400 dark:bg-slate-950/60">
        Complete at least 2 saved tests to unlock your trend chart.
      </div>
    );
  }

  const width = 600;
  const height = 180;
  const pad = 18;
  const values = data.map((item) => Number(item.netWpm) || 0);
  const max = Math.max(20, ...values) + 5;
  const min = Math.max(0, Math.min(...values) - 5);
  const span = Math.max(1, max - min);
  const coords = data.map((item, index) => {
    const x = pad + (index / Math.max(1, data.length - 1)) * (width - pad * 2);
    const y = height - pad - (((Number(item.netWpm) || 0) - min) / span) * (height - pad * 2);
    return { x, y, value: Number(item.netWpm) || 0 };
  });
  const path = coords.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-violet-50 p-3 dark:from-sky-500/10 dark:to-violet-500/10">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 w-full" role="img" aria-label="Recent Net WPM progress chart">
        <path d={path} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-500" />
        {coords.map((point, index) => (
          <g key={`${point.x}-${index}`}>
            <circle cx={point.x} cy={point.y} r="6" className="fill-white stroke-violet-500 dark:fill-slate-900" strokeWidth="4" />
            <text x={point.x} y={Math.max(12, point.y - 11)} textAnchor="middle" className="fill-slate-500 text-[12px] font-bold dark:fill-slate-300">
              {point.value}
            </text>
          </g>
        ))}
      </svg>
      <div className="text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Recent Net WPM</div>
    </div>
  );
}
