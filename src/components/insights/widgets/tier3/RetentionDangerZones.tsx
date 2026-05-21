/**
 * RetentionDangerZones — Tier 3 Anatomy widget showing the most common
 * timestamps where viewers drop off in the user's niche, with the
 * "common cause" the analyzer attributes to each zone.
 *
 * Data reality (per BE4a's report): `mv_retention_dangerzones` only has
 * 15 rows total across 5 niches right now (entertainment / music /
 * fashion / travel / +1). For any other niche the API returns an empty
 * `zones` array. We expose a niche picker so the user can sample the
 * niches that *do* have data instead of staring at an empty card.
 *
 * Backend: `GET /api/insights/tier3/retention-dangerzones?niche=…`
 *   → { zones: [{timestamp_sec, drop_pct, drop_pct_p50, drop_pct_p90,
 *                videos_affected, occurrence_count, common_cause,
 *                common_risk_level, niche}], niche, sample_size }
 *
 * Visual layout:
 *   - A small niche-selector chip row above the timeline.
 *   - A horizontal scrubbed "timeline" with bars at each `timestamp_sec`
 *     where the bar height encodes `drop_pct`.
 *   - A list below the timeline shows the timestamp + common_cause +
 *     risk level + how many videos in the niche show this drop.
 */

import { useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import { compactNumber } from '../../../../lib/format'
import WidgetCard from '../../shared/WidgetCard'

interface RetentionZoneRow {
  timestamp_sec: number
  drop_pct: number
  drop_pct_p50: number
  drop_pct_p90: number
  videos_affected: number
  occurrence_count: number
  common_cause: string
  common_risk_level: string
  niche: string
}

interface RetentionDangerZonesResponse {
  zones: RetentionZoneRow[]
  niche: string | null
  sample_size: number
}

interface RetentionDangerZonesProps {
  className?: string
  initialNiche?: string
}

// Niches in the materialised view that actually contain data. Keep this
// list in sync with the seeded set documented in BE4a's report.
const KNOWN_NICHES = ['entertainment', 'music', 'fashion', 'travel', 'comedy']

type RiskTone = { dot: string; text: string }

const DEFAULT_RISK_TONE: RiskTone = { dot: 'bg-amber-400', text: 'text-amber-300' }

const RISK_TONE: Record<string, RiskTone> = {
  low: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  medium: DEFAULT_RISK_TONE,
  high: { dot: 'bg-rose-400', text: 'text-rose-300' },
  critical: { dot: 'bg-red-500', text: 'text-red-400' },
}

function riskTone(level: string): RiskTone {
  return RISK_TONE[level?.toLowerCase() ?? ''] ?? DEFAULT_RISK_TONE
}

export default function RetentionDangerZones({
  className = '',
  initialNiche,
}: RetentionDangerZonesProps) {
  const [selected, setSelected] = useState<string | null>(initialNiche ?? null)

  const path = selected
    ? `tier3/retention-dangerzones?niche=${encodeURIComponent(selected)}`
    : 'tier3/retention-dangerzones'
  const { data, loading, error, retry, locked } = useInsights<RetentionDangerZonesResponse>(path)

  const zones = data?.zones ?? []
  const isEmpty = !loading && !error && zones.length === 0

  return (
    <WidgetCard
      title="Retention Danger Zones"
      subtitle="Common drop-off timestamps and the cause behind each — fix these and you fix the watch-through."
      icon="fa-triangle-exclamation"
      iconBg="bg-red-500/15"
      iconColor="text-red-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-triangle-exclamation"
      emptyMessage={
        selected
          ? `No danger zones logged in "${selected}" yet — try entertainment / music / fashion / travel.`
          : 'No danger zones in your scope yet — pick a seeded niche below.'
      }
      size="md"
      className={className}
      locked={locked}
      tier={3}
      info={{
        what: 'Where viewers commonly drop off in your niche.',
        howToRead:
          "Each bar is a second-mark where multiple videos lose audience. If you're filming, plan a pattern interrupt, B-roll cut, or hook re-engagement at these timestamps. The row beneath shows the common cause and risk level.",
        computation:
          'Aggregated from AI-predicted retention curves across videos in this niche. Sparse coverage — currently best in entertainment / music / fashion / travel / comedy.',
      }}
    >
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mr-1">
          Niche
        </span>
        <NicheChip
          label="All"
          active={selected === null}
          onClick={() => setSelected(null)}
        />
        {KNOWN_NICHES.map((n) => (
          <NicheChip
            key={n}
            label={n}
            active={selected === n}
            onClick={() => setSelected(n)}
          />
        ))}
      </div>

      {zones.length > 0 ? <Timeline zones={zones} /> : null}

      {zones.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {zones.map((z, idx) => {
            const tone = riskTone(z.common_risk_level)
            return (
              <li
                key={`${z.niche}-${z.timestamp_sec}-${idx}`}
                className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-red-500/20 transition-colors p-3"
              >
                <div className="flex flex-col items-center justify-center min-w-[58px] px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/25 shrink-0">
                  <span className="text-sm font-black tabular-nums text-rose-300 leading-none">
                    {formatTimestamp(z.timestamp_sec)}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400/70 mt-1">
                    drop
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] sm:text-xs font-bold text-slate-100 leading-tight truncate">
                      {z.common_cause}
                    </div>
                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${tone.text}`}
                      >
                        {z.common_risk_level}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-500 tabular-nums">
                    <span>
                      <span className="text-rose-300 font-bold">
                        −{z.drop_pct.toFixed(1)}%
                      </span>{' '}
                      avg
                    </span>
                    <span>
                      <span className="text-slate-300 font-bold">
                        −{z.drop_pct_p90.toFixed(1)}%
                      </span>{' '}
                      p90
                    </span>
                    <span>
                      <span className="text-slate-300 font-bold">
                        {compactNumber(z.videos_affected)}
                      </span>{' '}
                      videos
                    </span>
                    <span className="text-slate-600">{z.niche}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </WidgetCard>
  )
}

function NicheChip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest transition-colors ${
        active
          ? 'bg-red-500/20 border-red-500/40 text-red-200'
          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  )
}

function Timeline({ zones }: { zones: RetentionZoneRow[] }) {
  const maxTs = zones.reduce((m, z) => Math.max(m, z.timestamp_sec), 0) || 1
  const maxDrop = zones.reduce((m, z) => Math.max(m, z.drop_pct), 0) || 1
  // Cap timeline domain to either 60 s or maxTs * 1.1.
  const domain = Math.max(maxTs * 1.1, 30)

  return (
    <div className="relative">
      <div className="relative h-28 rounded-xl bg-white/[0.02] border border-white/[0.05] overflow-hidden">
        {zones.map((z, idx) => {
          const left = (z.timestamp_sec / domain) * 100
          const heightPct = Math.max(8, (z.drop_pct / maxDrop) * 100)
          return (
            <div
              key={`bar-${idx}-${z.timestamp_sec}`}
              className="absolute bottom-0 rounded-t-md bg-gradient-to-t from-rose-500/80 to-rose-300/80 group"
              style={{
                left: `calc(${left}% - 4px)`,
                width: 8,
                height: `${heightPct}%`,
              }}
              title={`${formatTimestamp(z.timestamp_sec)} · −${z.drop_pct.toFixed(1)}%`}
            />
          )
        })}
      </div>
      <div className="mt-1 flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
        <span>0s</span>
        <span>{formatTimestamp(domain / 2)}</span>
        <span>{formatTimestamp(domain)}</span>
      </div>
    </div>
  )
}

function formatTimestamp(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0s'
  if (sec < 60) return `${sec.toFixed(sec < 10 ? 1 : 0).replace(/\.0$/, '')}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec - m * 60)
  return `${m}m${s.toString().padStart(2, '0')}s`
}
