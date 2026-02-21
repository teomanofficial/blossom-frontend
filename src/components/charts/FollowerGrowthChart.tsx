import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useMemo } from 'react';

interface FollowerDataPoint {
  date: string;
  follower_count: number;
  platform?: string;
  username?: string;
}

interface FollowerGrowthChartProps {
  data: FollowerDataPoint[];
  height?: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#ec4899',
  tiktok: '#06b6d4',
  youtube: '#ef4444',
  twitter: '#3b82f6',
};

const FALLBACK_COLORS = ['#ec4899', '#06b6d4', '#a78bfa', '#f59e0b', '#22c55e'];

function formatCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">
        {label ? formatShortDate(label) : ''}
      </p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-white">
            {formatCount(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function FollowerGrowthChart({
  data,
  height = 280,
}: FollowerGrowthChartProps) {
  const { chartData, seriesKeys, colorMap } = useMemo(() => {
    if (!data.length)
      return { chartData: [], seriesKeys: [] as string[], colorMap: {} as Record<string, string> };

    // Group by unique platform/username combos
    const seriesSet = new Set<string>();
    data.forEach((d) => {
      const key = [d.platform, d.username].filter(Boolean).join(' / ') || 'Followers';
      seriesSet.add(key);
    });

    const keys = Array.from(seriesSet);

    // Build color map
    const colors: Record<string, string> = {};
    let fallbackIdx = 0;
    keys.forEach((key) => {
      const platform = key.split(' / ')[0]?.toLowerCase();
      if (platform && PLATFORM_COLORS[platform]) {
        colors[key] = PLATFORM_COLORS[platform];
      } else {
        colors[key] = FALLBACK_COLORS[fallbackIdx % FALLBACK_COLORS.length]!;
        fallbackIdx++;
      }
    });

    // Pivot data: each row is a date with series values
    const dateMap = new Map<string, Record<string, number>>();
    data.forEach((d) => {
      const key = [d.platform, d.username].filter(Boolean).join(' / ') || 'Followers';
      if (!dateMap.has(d.date)) {
        dateMap.set(d.date, { date: 0 } as unknown as Record<string, number>);
      }
      const row = dateMap.get(d.date)!;
      row[key] = d.follower_count;
    });

    const pivoted = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));

    return { chartData: pivoted, seriesKeys: keys, colorMap: colors };
  }, [data]);

  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-sm"
        style={{ height }}
      >
        No follower data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatCount}
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        {seriesKeys.length > 1 && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, color: '#94a3b8' }}
          />
        )}
        {seriesKeys.map((key) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={key}
            stroke={colorMap[key]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
