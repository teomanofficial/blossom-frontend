/**
 * CrossNicheImports — Tier 1 widget surfacing formats that thrive in
 * adjacent niches the user has not yet tried.
 *
 * Backend: `GET /api/insights/tier1/cross-niche-imports` →
 *   {
 *     imports: Array<{
 *       format_class_id, format_name, source_niche,
 *       avg_views, lift, example_video_ids[]
 *     }>,
 *     baseline_avg_views_p75: number
 *   }
 *
 * Layout: a vertical stack of 3-5 import cards. Each card:
 *   - Format name as the headline
 *   - "from <niche>" source badge
 *   - Avg views in source niche (compact)
 *   - Lift vs P75 ("3.2× the P75 format")
 *   - Up to 3 example-video thumbnails (no thumbnails available from this
 *     endpoint, so we show id-stamped tiles linking to /videos/:id)
 *   - "Adapt this format" CTA → /dashboard/greenlight?seed_format=<name>
 *
 * Empty state nods at the symmetry — when there are no cross-niche
 * winners it often means the user's niche has already absorbed them.
 */

import { Link } from 'react-router-dom'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface CrossNicheImport {
  format_class_id: string
  format_name: string
  source_niche: string
  avg_views: number
  lift: number
  example_video_ids: string[]
}

interface CrossNicheImportsResponse {
  imports: CrossNicheImport[]
  baseline_avg_views_p75?: number
}

interface CrossNicheImportsProps {
  className?: string
}

function formatLift(lift: number): string {
  if (!Number.isFinite(lift) || lift <= 0) return '—'
  if (lift >= 10) return `${lift.toFixed(1).replace(/\.0$/, '')}×`
  return `${lift.toFixed(1).replace(/\.0$/, '')}×`
}

function ExampleThumb({ videoId }: { videoId: string }) {
  // The endpoint returns ids only — no thumbnail URLs — so we render a
  // labeled placeholder tile that deep-links into the existing video
  // detail surface. If the user has access via category filtering, the
  // route will render; otherwise it 404s, which is the correct behavior.
  return (
    <Link
      to={`/videos?focus=${encodeURIComponent(videoId)}`}
      className="relative aspect-[9/16] block rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/15 via-violet-500/10 to-slate-900 border border-white/[0.06] hover:border-purple-400/40 transition-colors group"
      title={`Example video #${videoId}`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <i className="fas fa-play text-purple-300/70 text-base group-hover:text-purple-200 transition-colors" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-[8px] font-black uppercase tracking-widest text-white/70 tabular-nums">
          #{videoId}
        </span>
      </div>
    </Link>
  )
}

function ImportCard({ item }: { item: CrossNicheImport }) {
  const examples = (item.example_video_ids || []).slice(0, 3)
  const liftBadge = formatLift(item.lift)
  const liftIsHot = item.lift >= 2

  return (
    <article className="rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] hover:border-purple-500/20 transition-colors p-3 group">
      <header className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-100 leading-tight truncate">
            {item.format_name}
          </h4>
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/25 text-[10px] font-bold">
              <i className="fas fa-shuffle text-[8px]" />
              from <span className="capitalize">{item.source_niche || 'general'}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500">
              <i className="fas fa-eye text-[9px]" />
              {compactNumber(item.avg_views)} avg
            </span>
          </div>
        </div>
        <div className="relative shrink-0" title="Lift vs the P75 format baseline.">
          <div
            className={`absolute -inset-1.5 rounded-xl blur-md opacity-80 ${
              liftIsHot
                ? 'bg-gradient-to-br from-purple-500/40 to-fuchsia-500/30'
                : 'bg-gradient-to-br from-slate-500/30 to-slate-700/30'
            }`}
          />
          <span
            className={`relative inline-flex flex-col items-center px-2 py-0.5 rounded-xl text-white border border-white/15 shadow-lg ${
              liftIsHot
                ? 'bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-purple-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-700 shadow-slate-500/20'
            }`}
          >
            <span className="text-xs font-black tabular-nums leading-none">
              {liftBadge}
            </span>
            <span className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-0.5">
              vs P75
            </span>
          </span>
        </div>
      </header>

      {examples.length > 0 ? (
        <div className="grid grid-cols-3 gap-1.5 mb-2.5">
          {examples.map((id) => (
            <ExampleThumb key={id} videoId={id} />
          ))}
        </div>
      ) : null}

      <Link
        to={`/dashboard/greenlight?seed_format=${encodeURIComponent(item.format_name)}`}
        className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-purple-300 hover:text-purple-200 transition-colors"
      >
        <i className="fas fa-wand-magic-sparkles text-[9px]" />
        Adapt this format
        <i className="fas fa-arrow-right text-[9px]" />
      </Link>
    </article>
  )
}

export default function CrossNicheImports({
  className = '',
}: CrossNicheImportsProps) {
  const { data, loading, error, retry, locked } = useInsights<CrossNicheImportsResponse>(
    'tier1/cross-niche-imports',
  )

  const imports = data?.imports ?? []
  // Backend orders by avg_views DESC; trim to the top 5 cards to avoid
  // overrunning the tier-grid column on tall screens.
  const top = imports.slice(0, 5)

  return (
    <WidgetCard
      title="Cross-niche imports"
      subtitle="Formats thriving in adjacent niches you haven't tried."
      icon="fa-shuffle"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && top.length === 0}
      emptyIcon="fa-globe"
      emptyMessage="No adjacent-niche imports found — your niche may already be saturating cross-overs."
      size="lg"
      className={className}
      locked={locked}
      tier={1}
      info={{
        what: 'Formats winning in adjacent niches that your niche has not absorbed yet.',
        howToRead:
          "These formats already work elsewhere — porting them into your niche is a high-leverage arbitrage move. The lift figure shows how much the format outperforms the P75 baseline in its source niche. The bigger the lift, the stronger the import candidate.",
        computation:
          'For each format class, we compare its avg views in adjacent niches to the global P75 format baseline. Ranked descending by avg views in source niche.',
      }}
    >
      <div className="space-y-2.5">
        {top.map((item) => (
          <ImportCard key={item.format_class_id} item={item} />
        ))}
      </div>
    </WidgetCard>
  )
}
