/**
 * ShareMotivationMix — Tier 3 Anatomy widget breaking down *why*
 * audiences share viral content: relate / teach / surprise / tribe /
 * etc.
 *
 * Data reality: currently sparse (~58 rows tagged with
 * `share_motivation`). The backend flags this with `sparse: true` and
 * a `note` explaining the caveat — we surface that banner so users
 * don't over-interpret early numbers.
 *
 * Backend: `GET /api/insights/tier3/share-motivation`
 *   → { distribution: [{motivation, count, pct}], sample_size, sparse, note }
 *
 * Visual: a stacked horizontal bar (single row) for the macro picture
 * + a small breakdown table beneath it. Stacking conveys "share of the
 * pie" without the legibility problems of a small pie chart.
 */

import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface MotivationRow {
  motivation: string
  count: number
  pct: number
}

interface ShareMotivationResponse {
  distribution: MotivationRow[]
  sample_size: number
  sparse: boolean
  note: string | null
}

interface ShareMotivationMixProps {
  className?: string
}

const MOTIVATION_PALETTE = [
  '#34d399', // emerald
  '#38bdf8', // sky
  '#fbbf24', // amber
  '#f472b6', // pink
  '#a78bfa', // violet
  '#fb7185', // rose
  '#22d3ee', // cyan
  '#fcd34d', // yellow
  '#86efac', // green
  '#e879f9', // fuchsia
]

function colorFor(idx: number): string {
  return MOTIVATION_PALETTE[idx % MOTIVATION_PALETTE.length] ?? '#94a3b8'
}

export default function ShareMotivationMix({ className = '' }: ShareMotivationMixProps) {
  const { data, loading, error, retry, locked } =
    useInsights<ShareMotivationResponse>('tier3/share-motivation')

  const rows = data?.distribution ?? []
  const isEmpty = !loading && !error && rows.length === 0

  return (
    <WidgetCard
      title="Share Motivation Mix"
      subtitle="Why audiences forward viral content — relate, teach, surprise, tribe-signal?"
      icon="fa-share-nodes"
      iconBg="bg-sky-500/15"
      iconColor="text-sky-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-share-nodes"
      emptyMessage="No share-motivation tags yet — virality analysis is the source and is still being seeded."
      size="md"
      className={className}
      locked={locked}
      tier={3}
      info={{
        what: 'The reasons audiences forward viral content — relate, teach, surprise, tribe-signal, and more.',
        howToRead:
          "Stacked bar shows the share of each motivation across viral analyses. The top 2-3 motivations are the levers a hit script tends to pull. Match your call-to-share to one of the dominant motivations rather than fighting the trend.",
        computation:
          "Counts of share_motivation tags from virality-level AI analysis, divided by sample size.",
      }}
      actions={
        data && data.sample_size > 0 ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            n={compactNumber(data.sample_size)}
          </span>
        ) : null
      }
    >
      {data?.sparse ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2">
          <i className="fas fa-info-circle text-amber-300 text-xs mt-0.5" />
          <p className="text-[11px] text-amber-200 font-medium leading-snug">
            Sparse data — only {compactNumber(data.sample_size)} viral analyses include{' '}
            <code className="px-1 py-0.5 rounded bg-amber-500/15 text-[10px]">
              share_motivation
            </code>
            . Building coverage.
          </p>
        </div>
      ) : null}

      {rows.length > 0 ? (
        <div className="space-y-4">
          {/* Stacked bar */}
          <div className="h-4 rounded-full bg-white/[0.04] overflow-hidden flex">
            {rows.map((row, i) => (
              <div
                key={`stack-${row.motivation}`}
                className="h-full"
                style={{
                  width: `${row.pct}%`,
                  background: colorFor(i),
                  opacity: 0.85,
                }}
                title={`${row.motivation} · ${row.pct.toFixed(1)}%`}
              />
            ))}
          </div>

          {/* Breakdown */}
          <ul className="space-y-1.5">
            {rows.slice(0, 8).map((row, i) => (
              <li
                key={row.motivation}
                className="flex items-center justify-between gap-3 text-[11px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: colorFor(i) }}
                  />
                  <span className="font-bold text-slate-200 capitalize truncate">
                    {row.motivation}
                  </span>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <span className="font-black text-slate-100">{row.pct.toFixed(1)}%</span>
                  <span className="ml-1.5 text-[10px] text-slate-600">
                    ({compactNumber(row.count)})
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </WidgetCard>
  )
}
