interface MetricsCardProps {
  label: string;
  value: string | number;
  delta?: number;
  icon?: string;
  iconColor?: string;
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta}%`;
}

export default function MetricsCard({
  label,
  value,
  delta,
  icon,
  iconColor = '#ec4899',
}: MetricsCardProps) {
  const showDelta = delta !== undefined && delta !== 0;
  const isPositive = (delta ?? 0) > 0;

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          {/* Value */}
          <span className="text-2xl font-bold text-white truncate">
            {value}
          </span>

          {/* Label */}
          <span className="text-sm text-slate-500">{label}</span>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Icon */}
          {icon && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-base"
              style={{ backgroundColor: `${iconColor}18` }}
            >
              <i className={`fas ${icon}`} style={{ color: iconColor }} />
            </div>
          )}

          {/* Delta badge */}
          {showDelta && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-md ${
                isPositive
                  ? 'text-emerald-400 bg-emerald-400/10'
                  : 'text-red-400 bg-red-400/10'
              }`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className={isPositive ? '' : 'rotate-180'}
              >
                <path
                  d="M5 2L8.5 6.5H1.5L5 2Z"
                  fill="currentColor"
                />
              </svg>
              {formatDelta(Math.abs(delta!))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
