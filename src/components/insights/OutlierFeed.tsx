/**
 * OutlierFeed — Tier 1 widget that ships a 3-card preview of the most
 * dramatic recent outliers, plus a "View all outliers →" CTA into the
 * dedicated Outlier Hunter page at `/dashboard/outliers`.
 *
 * Why inline (and not a full OutlierCard repeat)? The Tier 1 slot is
 * meant to *tease* the wedge — the user has 200ms to decide whether to
 * click through. A tight horizontal strip with thumbnail + hero multiple
 * + creator handle delivers exactly that signal, then hands off to the
 * dedicated page for the actual analysis flow.
 *
 * Data source: `GET /api/insights/tier1/outliers?limit=3` — same endpoint
 * the page uses, so the 5-min cache shared by useInsights means navigating
 * page ↔ widget is free after the first hit.
 */

import { Link } from 'react-router-dom'
import { useInsights } from '../../lib/useInsights'
import type { OutlierVideo } from '../../types/insights'
import WidgetCard from './shared/WidgetCard'

interface OutlierFeedResponse {
  outliers: OutlierVideo[]
}

interface OutlierFeedProps {
  className?: string
}

function compact(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(n))
}

function formatMultiple(multiple: number): string {
  if (!Number.isFinite(multiple) || multiple <= 0) return '0x'
  if (multiple >= 100) return `${Math.round(multiple)}x`
  return `${multiple.toFixed(1).replace(/\.0$/, '')}x`
}

function OutlierMiniCard({ outlier }: { outlier: OutlierVideo }) {
  return (
    <Link
      to={`/dashboard/outliers?focus=${encodeURIComponent(outlier.video_id)}`}
      className="group block rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:border-pink-500/30 hover:bg-white/[0.05] transition-colors"
    >
      <div className="relative aspect-[16/10] bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-slate-900 overflow-hidden">
        {outlier.thumbnail_url ? (
          <img
            src={outlier.thumbnail_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <i className="fas fa-image text-slate-700 text-xl" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute top-2 left-2">
          <div className="relative">
            <div className="absolute -inset-1.5 bg-gradient-to-br from-pink-500/40 to-purple-500/40 rounded-xl blur-md opacity-90" />
            <span className="relative inline-flex items-center px-2 py-0.5 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-500 text-white text-sm font-black tabular-nums shadow-lg shadow-pink-500/30 border border-white/15 font-display">
              {formatMultiple(outlier.multiple)}
            </span>
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="text-xs font-bold text-slate-100 truncate">
          @{outlier.influencer.username || 'unknown'}
        </div>
        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
          {compact(outlier.views)} views · {compact(outlier.creator_median_views)} median
        </div>
      </div>
    </Link>
  )
}

export default function OutlierFeed({ className = '' }: OutlierFeedProps) {
  const { data, loading, error, retry, locked } = useInsights<OutlierFeedResponse>(
    'tier1/outliers?limit=3',
  )

  const outliers = data?.outliers ?? []

  return (
    <WidgetCard
      title="Outlier feed"
      subtitle="Videos breaking 3×+ their creator's median — receipts attached."
      icon="fa-meteor"
      iconBg="bg-orange-500/15"
      iconColor="text-orange-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={!loading && !error && outliers.length === 0}
      emptyIcon="fa-satellite-dish"
      emptyMessage="No outliers indexed yet — check back in a few hours."
      size="lg"
      className={className}
      locked={locked}
      tier={1}
      info={{
        what: "Videos in your niche getting 3× or more their creator's median views.",
        howToRead:
          "These are outliers — they punched way above their author's typical performance. The structural reasons (hooks, formats, tactics) are repeatable, even if the original creator can't reproduce them themselves.",
        computation:
          "Sourced from the 30-day outliers materialized view. We filter to your niche and rank by the 'multiple' factor (video views ÷ creator median views).",
        example:
          "A 10k-follower creator pulling 500k views is a 50× outlier — worth reverse-engineering.",
      }}
      actions={
        <Link
          to="/dashboard/outliers"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500/20 to-fuchsia-500/20 hover:from-pink-500/30 hover:to-fuchsia-500/30 border border-pink-500/30 text-[10px] font-black uppercase tracking-widest text-pink-200 transition-colors"
        >
          View all
          <i className="fas fa-arrow-right text-[9px]" />
        </Link>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {outliers.map((outlier) => (
          <OutlierMiniCard key={outlier.video_id} outlier={outlier} />
        ))}
      </div>
      <Link
        to="/dashboard/outliers"
        className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-black text-pink-300 hover:text-pink-200 uppercase tracking-widest transition-colors"
      >
        <i className="fas fa-magnifying-glass-plus text-[10px]" />
        Open Outlier Hunter
        <i className="fas fa-arrow-right text-[9px]" />
      </Link>
    </WidgetCard>
  )
}
