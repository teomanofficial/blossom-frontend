/**
 * PredictedRetentionPreview — wraps the shared RetentionCurve chart
 * for the Greenlight result. We feed the curve as the "actual" series
 * (it's the model's prediction of THIS concept's retention) and
 * overlay the backend-supplied danger zones.
 *
 * Below the chart we surface each danger zone as a small reason card
 * so users can read the predicted drop-offs even on a small screen
 * where the chart hover doesn't work as well.
 *
 * Pure presentational. The shared chart owns rendering; we just shape
 * the framing copy.
 */

import type { GreenlightResponse } from '../../types/insights'
import RetentionCurve from '../insights/charts/RetentionCurve'

interface PredictedRetentionPreviewProps {
  retention: GreenlightResponse['retention_prediction']
  className?: string
}

export default function PredictedRetentionPreview({
  retention,
  className = '',
}: PredictedRetentionPreviewProps) {
  const hasCurve = retention.curve && retention.curve.length > 0
  const dangerZones = retention.danger_zones || []
  const hasDangers = dangerZones.length > 0

  return (
    <section
      className={`glass-card rounded-3xl p-5 sm:p-6 lg:p-7 ${className}`}
      aria-label="Predicted retention preview"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
          <i className="fas fa-chart-line text-emerald-400 text-xs sm:text-sm" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm sm:text-base font-bold text-slate-100 leading-tight">
            Predicted retention
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-snug">
            Where viewers are predicted to drop off if you film this as-is. Red zones are the
            highest-risk moments.
          </p>
        </div>
      </div>

      {hasCurve ? (
        <>
          <RetentionCurve
            curve={retention.curve}
            dangerZones={dangerZones}
            height={300}
            actualLabel="Predicted retention"
          />
          {hasDangers ? (
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-300 mb-2">
                <i className="fas fa-triangle-exclamation mr-1.5" />
                Predicted drop-off zones
              </h4>
              <ul className="space-y-1.5">
                {dangerZones.map((zone, i) => (
                  <li
                    key={`danger-${zone.sec}-${i}`}
                    className="text-xs text-slate-300 flex items-start gap-2"
                  >
                    <span className="text-[10px] font-black text-rose-300 tabular-nums mt-0.5 shrink-0">
                      {Math.round(zone.sec)}s
                    </span>
                    <span className="leading-snug">{zone.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center gap-2 text-[11px] text-emerald-300 font-medium">
              <i className="fas fa-circle-check text-[10px]" />
              No high-risk drop-off zones detected in the predicted curve.
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <i className="fas fa-chart-line text-slate-500 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">
            No predicted retention curve was computable for this concept. Try a more specific
            description.
          </p>
        </div>
      )}
    </section>
  )
}
