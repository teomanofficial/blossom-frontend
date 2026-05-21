/**
 * SaveShareRewatchQuadrant — Tier 3 Anatomy widget projecting the
 * three "deep virality" scores (save / share / rewatch) onto a 2D
 * quadrant so the user can see which axes their winners lean on.
 *
 * Defaults: x = save_score, y = share_score, bubble size =
 * overall_virality_score. Source type (`video` vs `upload`) is
 * encoded via bubble color so the user can see whether the data
 * point comes from a creator scan or one of their own drafts.
 *
 * Backend: `GET /api/insights/tier3/save-share-rewatch-quadrant`
 *   → { points: [...], sample_size, sparse, note }
 *
 * Data reality: currently sparse (≤ 200 points). We surface the
 * `sparse: true` banner returned by the backend.
 */

import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import { Quadrant } from '../../charts'
import type { QuadrantPoint } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface SaveShareRewatchPoint {
  video_id: string
  source_type: 'video' | 'upload'
  save: number
  share: number
  rewatch: number
  overall: number
  niche: string | null
  title: string | null
  thumbnail_url: string | null
  views: number
}

interface SaveShareRewatchResponse {
  points: SaveShareRewatchPoint[]
  niche: string | null
  sample_size: number
  sparse: boolean
  note: string | null
}

const SOURCE_COLOR: Record<'video' | 'upload', string> = {
  video: '#fbbf24', // amber-400
  upload: '#a78bfa', // violet-400
}

interface SaveShareRewatchQuadrantProps {
  className?: string
  niche?: string
}

export default function SaveShareRewatchQuadrant({
  className = '',
  niche,
}: SaveShareRewatchQuadrantProps) {
  const path = niche
    ? `tier3/save-share-rewatch-quadrant?niche=${encodeURIComponent(niche)}`
    : 'tier3/save-share-rewatch-quadrant'
  const { data, loading, error, retry, locked } = useInsights<SaveShareRewatchResponse>(path)

  const rows = data?.points ?? []
  const isEmpty = !loading && !error && rows.length === 0

  const points: QuadrantPoint[] = rows.map((p) => ({
    x: p.save,
    y: p.share,
    label: p.title?.slice(0, 80) ?? p.video_id,
    size: Math.max(0.5, p.overall || 1),
    color: SOURCE_COLOR[p.source_type],
    meta: {
      save: p.save.toFixed(0),
      share: p.share.toFixed(0),
      rewatch: p.rewatch.toFixed(0),
      overall: p.overall.toFixed(0),
      niche: p.niche ?? '—',
      source: p.source_type,
      views: p.views > 0 ? compactNumber(p.views) : '—',
    },
  }))

  return (
    <WidgetCard
      title="Save × Share × Rewatch Quadrant"
      subtitle="The virality triple-axis — see which axis a video is winning on (and which it's missing)."
      icon="fa-rotate"
      iconBg="bg-amber-500/15"
      iconColor="text-amber-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-rotate"
      emptyMessage="No save/share/rewatch scores yet — virality-level analysis is the source and is still being seeded."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
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
            {data.note ??
              'Sparse data — most videos do not yet have save/share/rewatch scores.'}
          </p>
        </div>
      ) : null}

      <Quadrant
        points={points}
        xLabel="Save score"
        yLabel="Share score"
        quadrantLabels={[
          'Bookmark Bait', // top-left   (low save, high share) — actually we have low x = low save, high y = high share
          'Power Virals', // top-right (high save + high share)
          'Word of Mouth', // bottom-right (high save, low share)
          'Quiet Skips', // bottom-left
        ]}
        height={360}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: SOURCE_COLOR.video }}
          />
          <span className="text-slate-400">Creator scans</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-full"
            style={{ background: SOURCE_COLOR.upload }}
          />
          <span className="text-slate-400">Your drafts</span>
        </span>
        <span className="ml-auto text-slate-600 hidden sm:inline">
          Bubble size = overall virality
        </span>
      </div>
    </WidgetCard>
  )
}
