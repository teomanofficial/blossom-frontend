/**
 * AudienceArchetypeMap — Tier 4 widget visualising the top 10 audience
 * archetypes that leading creators in the user's niche attract.
 *
 * Backend: `GET /api/insights/tier4/audience-archetypes?niche=`
 *   → { niche, archetypes: [{ archetype, count }] }
 *
 * Renders a horizontal Recharts bar chart sorted by audience size. Each
 * bar shows the archetype name, raw count, and the % of the surveyed
 * pool — this lets the user spot dominant clusters at a glance. When
 * archetype data is empty (which is common until creator_disc_profiles
 * fills out), shows a friendly empty state.
 */

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'

interface ArchetypeRow {
  archetype: string
  count: number
}

interface ArchetypesResponse {
  niche: string | null
  archetypes: ArchetypeRow[]
}

interface AudienceArchetypeMapProps {
  className?: string
}

// Cycle through this palette so adjacent bars are visually distinct.
const PALETTE = [
  '#22d3ee', // cyan-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#fb923c', // orange-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#60a5fa', // blue-400
  '#f87171', // red-400
  '#c084fc', // purple-400
  '#2dd4bf', // teal-400
]

function titleCase(s: string): string {
  return (s || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface ChartDatum {
  name: string
  display: string
  count: number
  pct: number
  fill: string
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartDatum }>
}) {
  if (!active || !payload || payload.length === 0) return null
  const datum = payload[0]?.payload
  if (!datum) return null
  return (
    <div className="rounded-xl bg-slate-950/95 border border-white/10 px-3 py-2 shadow-xl">
      <div className="text-xs font-black text-slate-100">{datum.display}</div>
      <div className="text-[10px] font-medium text-slate-400 mt-0.5">
        {datum.count} creator{datum.count === 1 ? '' : 's'} ·{' '}
        <span className="tabular-nums">{datum.pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default function AudienceArchetypeMap({
  className = '',
}: AudienceArchetypeMapProps) {
  const { data, loading, error, retry } = useInsights<ArchetypesResponse>(
    'tier4/audience-archetypes',
  )

  const archetypes = data?.archetypes ?? []
  const total = archetypes.reduce((sum, a) => sum + a.count, 0)

  const chartData: ChartDatum[] = archetypes.map((a, i) => ({
    name: a.archetype,
    display: titleCase(a.archetype) || 'Unspecified',
    count: a.count,
    pct: total > 0 ? (a.count / total) * 100 : 0,
    fill: PALETTE[i % PALETTE.length] ?? '#94a3b8',
  }))

  // Recharts horizontal bar wants ascending so the largest bar lands on
  // top when YAxis reversed=false; we instead leave them in descending
  // order and reverse the YAxis so #1 is at the top.
  const chartHeight = Math.max(220, chartData.length * 32)

  return (
    <WidgetCard
      title="Audience archetypes"
      subtitle="The fan clusters leading creators attract — and how they overlap."
      icon="fa-people-group"
      iconBg="bg-cyan-500/15"
      iconColor="text-cyan-400"
      size="lg"
      className={className}
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && archetypes.length === 0}
      emptyIcon="fa-users-slash"
      emptyMessage="No audience archetypes detected yet. Profile more creators to fill this map."
    >
      <div style={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 4, right: 24, bottom: 4, left: 0 }}
          >
            <XAxis
              type="number"
              hide
              domain={[0, 'dataMax']}
            />
            <YAxis
              type="category"
              dataKey="display"
              width={140}
              tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            />
            <Bar
              dataKey="count"
              radius={[0, 6, 6, 0]}
              isAnimationActive={false}
              label={{
                position: 'right',
                fill: '#94a3b8',
                fontSize: 11,
                fontWeight: 700,
                formatter: (label: any) => {
                  const value = typeof label === 'object' && label !== null ? label.value : label
                  return String(value ?? '')
                },
              }}
            >
              {chartData.map((d, i) => (
                <Cell key={`cell-${i}`} fill={d.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {total > 0 ? (
        <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span>
            <i className="fas fa-users mr-1 text-[9px]" />
            {total} creators surveyed
          </span>
          <span className="font-black text-slate-400">
            Top {chartData.length} archetypes
          </span>
        </div>
      ) : null}
    </WidgetCard>
  )
}
