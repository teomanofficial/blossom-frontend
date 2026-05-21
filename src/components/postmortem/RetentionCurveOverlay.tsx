/**
 * RetentionCurveOverlay — wraps the shared RetentionCurve chart with
 * the post-mortem framing. We compute the gap between "yours" and
 * "predicted_optimal" at each second and surface the steepest drops
 * as danger zones automatically (the API doesn't always supply them).
 *
 * The shared `RetentionCurve` component handles all the rendering —
 * we just feed it the right props with the post-mortem-specific
 * labels and derived danger zones.
 */

import { useMemo } from 'react'
import type { PostMortemResponse } from '../../types/insights'
import RetentionCurve, {
  type RetentionDangerZone as DangerZoneShape,
} from '../insights/charts/RetentionCurve'
import WidgetCard from '../insights/shared/WidgetCard'

interface RetentionCurveOverlayProps {
  retention: PostMortemResponse['retention_curve']
  className?: string
}

/**
 * Identify the top N timestamps where yours drops most relative to
 * predicted optimal. We use the *gap* between the two curves rather
 * than the absolute drop in `yours` — a 30% drop is fine if optimal
 * also drops 30%, but a 30% drop while optimal stays high is a
 * danger.
 */
function deriveDangerZones(
  yours: Array<{ sec: number; pct: number }>,
  optimal: Array<{ sec: number; pct: number }>,
  topN = 3,
): DangerZoneShape[] {
  if (yours.length === 0 || optimal.length === 0) return []
  const optimalBySec = new Map(optimal.map((p) => [p.sec, p.pct]))
  const points: Array<{ sec: number; gap: number }> = []
  for (const y of yours) {
    const o = optimalBySec.get(y.sec)
    if (typeof o !== 'number') continue
    const gap = o - y.pct
    if (gap > 10) {
      points.push({ sec: y.sec, gap })
    }
  }
  // Sort by gap desc, but also keep them de-duplicated to within 2s
  // of each other (so we don't surface 3 zones in a row).
  points.sort((a, b) => b.gap - a.gap)
  const picked: Array<{ sec: number; gap: number }> = []
  for (const p of points) {
    if (picked.length >= topN) break
    if (picked.some((q) => Math.abs(q.sec - p.sec) < 2)) continue
    picked.push(p)
  }
  picked.sort((a, b) => a.sec - b.sec)
  return picked.map((p) => ({
    sec: p.sec,
    reason: `Viewers drop ${Math.round(p.gap)} percentage points more here than top videos in your niche.`,
  }))
}

export default function RetentionCurveOverlay({
  retention,
  className = '',
}: RetentionCurveOverlayProps) {
  const dangerZones = useMemo(
    () => deriveDangerZones(retention.yours, retention.predicted_optimal, 3),
    [retention],
  )

  const hasData = retention.yours.length > 0

  return (
    <WidgetCard
      title="Your retention vs. the niche optimal"
      subtitle="Red zones mark where viewers leave you faster than they leave top creators."
      icon="fa-chart-line"
      iconBg="bg-emerald-500/15"
      iconColor="text-emerald-400"
      size="lg"
      isEmpty={!hasData}
      emptyMessage="No retention curve was computable for this video. This usually means the prediction model didn't have enough comparable data."
      emptyIcon="fa-chart-line"
      className={className}
    >
      <div>
        <RetentionCurve
          curve={retention.yours}
          predicted={retention.predicted_optimal}
          dangerZones={dangerZones}
          height={300}
          actualLabel="Your curve"
          predictedLabel="Niche top-decile (predicted)"
        />
        {dangerZones.length > 0 ? (
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-2">
              <i className="fas fa-triangle-exclamation mr-1.5" />
              Drop-off zones
            </h4>
            <ul className="space-y-1.5">
              {dangerZones.map((z, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-[10px] font-black text-rose-300 tabular-nums mt-0.5 shrink-0">
                    {Math.round(z.sec)}s
                  </span>
                  <span className="leading-snug">{z.reason}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </WidgetCard>
  )
}
