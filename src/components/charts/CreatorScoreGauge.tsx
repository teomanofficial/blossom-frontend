interface CreatorScoreGaugeProps {
  score: number | null;
  label?: string;
  size?: number;
}

function getGradientId(score: number): string {
  if (score <= 30) return 'gaugeRed';
  if (score <= 60) return 'gaugeYellow';
  return 'gaugeGreen';
}

export default function CreatorScoreGauge({
  score,
  label,
  size = 160,
}: CreatorScoreGaugeProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const clampedScore =
    score !== null ? Math.max(0, Math.min(100, score)) : 0;
  const dashOffset =
    circumference - (clampedScore / 100) * circumference;
  const gradientId =
    score !== null ? getGradientId(clampedScore) : 'gaugeMuted';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <defs>
            <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#dc2626" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
            <linearGradient
              id="gaugeYellow"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <linearGradient
              id="gaugeGreen"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#16a34a" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
            <linearGradient
              id="gaugeMuted"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#475569" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />

          {/* Score arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center text overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          {score !== null ? (
            <span
              className="font-bold text-white"
              style={{ fontSize: size * 0.28 }}
            >
              {Math.round(score)}
            </span>
          ) : (
            <span
              className="font-bold text-slate-600"
              style={{ fontSize: size * 0.28 }}
            >
              &mdash;
            </span>
          )}
        </div>
      </div>

      {label && (
        <span className="text-xs font-medium text-slate-500">{label}</span>
      )}
    </div>
  );
}
