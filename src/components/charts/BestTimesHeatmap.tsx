import { useMemo, useState } from 'react';

interface HeatmapDataPoint {
  day_of_week: number;
  hour: number;
  avg_views: number;
  post_count: number;
}

interface BestTimesHeatmapProps {
  data: HeatmapDataPoint[];
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const HOUR_LABELS: Record<number, string> = {
  0: '12a',
  3: '3a',
  6: '6a',
  9: '9a',
  12: '12p',
  15: '3p',
  18: '6p',
  21: '9p',
};

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(Math.round(value));
}

export default function BestTimesHeatmap({ data }: BestTimesHeatmapProps) {
  const [tooltip, setTooltip] = useState<{
    day: number;
    hour: number;
    avgViews: number;
    postCount: number;
    x: number;
    y: number;
  } | null>(null);

  const { grid, maxViews } = useMemo(() => {
    const g: Record<string, HeatmapDataPoint> = {};
    let max = 0;

    data.forEach((d) => {
      const key = `${d.day_of_week}-${d.hour}`;
      g[key] = d;
      if (d.avg_views > max) max = d.avg_views;
    });

    return { grid: g, maxViews: max };
  }, [data]);

  function getCellOpacity(day: number, hour: number): number {
    const key = `${day}-${hour}`;
    const cell = grid[key];
    if (!cell || maxViews === 0) return 0;
    // Minimum opacity of 0.1 for cells with data, max 0.8
    return 0.1 + (cell.avg_views / maxViews) * 0.7;
  }

  function handleMouseEnter(
    e: React.MouseEvent<HTMLDivElement>,
    day: number,
    hour: number
  ) {
    const key = `${day}-${hour}`;
    const cell = grid[key];
    if (!cell) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect =
      e.currentTarget.closest('[data-heatmap]')?.getBoundingClientRect();
    if (!parentRect) return;

    setTooltip({
      day,
      hour,
      avgViews: cell.avg_views,
      postCount: cell.post_count,
      x: rect.left - parentRect.left + rect.width / 2,
      y: rect.top - parentRect.top,
    });
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-slate-600 text-sm h-48">
        No posting time data available
      </div>
    );
  }

  return (
    <div className="relative" data-heatmap>
      {/* Hour labels */}
      <div className="flex ml-6 sm:ml-8 mb-1 gap-px">
        {Array.from({ length: 24 }, (_, h) => (
          <div
            key={h}
            className="flex-1 text-center text-[9px] sm:text-[10px] text-slate-600"
          >
            {HOUR_LABELS[h] ?? ''}
          </div>
        ))}
      </div>

      {/* Grid rows */}
      <div className="flex flex-col gap-px">
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="flex items-center gap-px">
            {/* Day label */}
            <div className="w-6 sm:w-8 text-right pr-1.5 text-[10px] sm:text-xs text-slate-500 font-medium shrink-0">
              {DAY_LABELS[day]}
            </div>

            {/* Hour cells */}
            {Array.from({ length: 24 }, (_, hour) => {
              const opacity = getCellOpacity(day, hour);
              const hasData = grid[`${day}-${hour}`] !== undefined;

              return (
                <div
                  key={hour}
                  className="flex-1 aspect-square rounded-[2px] sm:rounded-sm cursor-default transition-colors"
                  style={{
                    backgroundColor: hasData
                      ? `rgba(236, 72, 153, ${opacity})`
                      : 'rgba(255,255,255,0.02)',
                    minWidth: 0,
                  }}
                  onMouseEnter={(e) => handleMouseEnter(e, day, hour)}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg bg-slate-800 border border-white/10 px-3 py-2 shadow-xl text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <span className="text-white font-medium">
            {DAY_NAMES[tooltip.day]} {formatHourLabel(tooltip.hour)}
          </span>
          <span className="text-slate-400">
            : {formatCount(tooltip.avgViews)} avg views, {tooltip.postCount}{' '}
            {tooltip.postCount === 1 ? 'post' : 'posts'}
          </span>
        </div>
      )}
    </div>
  );
}
