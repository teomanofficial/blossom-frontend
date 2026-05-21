/**
 * DiscDistribution — Tier 4 widget visualising the DISC primary-style
 * mix across creators in a given niche.
 *
 * Backend: `GET /api/insights/tier4/disc-distribution?niche=`
 *   → { niche, distribution: [{ disc_type, count, pct }] }
 *
 * Renders a Recharts donut with one segment per primary DISC archetype
 * (D = Driver, I = Influencer, S = Steady, C = Conscientious). Legend
 * spells out what each letter actually means — most creators have never
 * encountered DISC. Sparse-data banner appears when the underlying
 * sample size is too small to draw confident conclusions (< 10 profiles).
 */

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useInsights } from '../../../../lib/useInsights'
import WidgetCard from '../../shared/WidgetCard'

interface DiscDistributionRow {
  disc_type: string
  count: number
  pct: number
}

interface DiscDistributionResponse {
  niche: string | null
  distribution: DiscDistributionRow[]
}

interface DiscDistributionProps {
  className?: string
}

interface DiscMeta {
  letter: 'D' | 'I' | 'S' | 'C'
  label: string
  blurb: string
  color: string
  bg: string
  text: string
  border: string
}

const DISC_META: Record<string, DiscMeta> = {
  D: {
    letter: 'D',
    label: 'Driver',
    blurb: 'Bold, decisive, results-first.',
    color: '#f43f5e',
    bg: 'bg-rose-500/15',
    text: 'text-rose-300',
    border: 'border-rose-500/25',
  },
  I: {
    letter: 'I',
    label: 'Influencer',
    blurb: 'Outgoing, persuasive, social.',
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-500/25',
  },
  S: {
    letter: 'S',
    label: 'Steady',
    blurb: 'Patient, dependable, calm.',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-500/25',
  },
  C: {
    letter: 'C',
    label: 'Conscientious',
    blurb: 'Analytical, precise, careful.',
    color: '#06b6d4',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-500/25',
  },
}

const FALLBACK_META: DiscMeta = {
  letter: 'D',
  label: 'Other',
  blurb: 'Uncategorized.',
  color: '#94a3b8',
  bg: 'bg-slate-500/15',
  text: 'text-slate-300',
  border: 'border-slate-500/25',
}

function metaFor(disc: string): DiscMeta {
  const key = (disc || '').charAt(0).toUpperCase()
  return DISC_META[key] ?? { ...FALLBACK_META, label: disc || 'Other' }
}

interface ChartDatum {
  name: string
  value: number
  pct: number
  color: string
  meta: DiscMeta
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
      <div className="text-xs font-black text-slate-100">{datum.meta.label}</div>
      <div className="text-[10px] font-medium text-slate-400 mt-0.5">
        {datum.value} creator{datum.value === 1 ? '' : 's'} ·{' '}
        <span className="tabular-nums">{datum.pct.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default function DiscDistribution({ className = '' }: DiscDistributionProps) {
  const { data, loading, error, retry } = useInsights<DiscDistributionResponse>(
    'tier4/disc-distribution',
  )

  const distribution = data?.distribution ?? []
  const totalCount = distribution.reduce((sum, d) => sum + d.count, 0)

  const chartData: ChartDatum[] = distribution.map((d) => {
    const meta = metaFor(d.disc_type)
    return {
      name: meta.label,
      value: d.count,
      pct: d.pct,
      color: meta.color,
      meta,
    }
  })

  // Order chart segments to match D-I-S-C reading order for legend parity.
  const orderKey: Record<string, number> = { D: 0, I: 1, S: 2, C: 3 }
  chartData.sort(
    (a, b) => (orderKey[a.meta.letter] ?? 99) - (orderKey[b.meta.letter] ?? 99),
  )

  const sparse = totalCount > 0 && totalCount < 10

  return (
    <WidgetCard
      title="DISC mix"
      subtitle="Personality archetypes across top creators in your niche."
      icon="fa-chart-pie"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      size="lg"
      className={className}
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && distribution.length === 0}
      emptyIcon="fa-fingerprint"
      emptyMessage="DISC distribution populates as more creators are profiled. None yet for this niche."
    >
      {sparse ? (
        <div className="mb-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <i className="fas fa-circle-info text-amber-400 text-[11px] mt-0.5" />
          <p className="text-[11px] text-amber-200 font-medium leading-snug">
            DISC analysis populates as more creators are scanned. Currently{' '}
            <span className="font-black">{totalCount}</span> profiled — treat the
            mix below as directional, not definitive.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Donut chart */}
        <div className="relative" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="rgba(15, 23, 42, 0.8)"
                strokeWidth={2}
              >
                {chartData.map((d) => (
                  <Cell key={d.meta.letter} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-xl sm:text-2xl font-black text-slate-100 tabular-nums">
              {totalCount}
            </div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              creators
            </div>
          </div>
        </div>

        {/* Legend */}
        <ul className="space-y-2">
          {chartData.length === 0 ? (
            <li className="text-[11px] text-slate-500 font-medium">No data.</li>
          ) : (
            chartData.map((d) => (
              <li
                key={d.meta.letter}
                className={`flex items-start gap-2.5 p-2 rounded-xl border ${d.meta.bg} ${d.meta.border}`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-black shrink-0 ${d.meta.text} ${d.meta.bg} border ${d.meta.border}`}
                >
                  {d.meta.letter}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold ${d.meta.text}`}>
                      {d.meta.label}
                    </span>
                    <span className="text-[10px] font-black text-slate-400 tabular-nums">
                      {d.pct.toFixed(1)}% · {d.value}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium leading-snug mt-0.5">
                    {d.meta.blurb}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </WidgetCard>
  )
}
