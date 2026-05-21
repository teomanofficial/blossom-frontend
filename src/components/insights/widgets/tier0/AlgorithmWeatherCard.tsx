/**
 * AlgorithmWeatherCard — Tier 0 widget summarising what the algorithm
 * is rewarding this week, per-platform.
 *
 * UI shape:
 *   - Platform toggle (Instagram / TikTok) — refetches via re-key path
 *   - Plain-English summary headline (1-2 sentences, weather-report tone)
 *   - Signal pills underneath, each with direction arrow + change_pct
 *   - "Why?" EvidenceTrail button per signal (claim_id = signal.evidence_query)
 *
 * Data source: `GET /api/insights/tier0/algorithm-weather?platform=...`
 * → AlgorithmWeatherResponse. The endpoint returns an empty-signals
 * placeholder until the weekly Stage 6 P1 job ships; this widget shows a
 * friendly fallback in that case.
 */

import { useState } from 'react'
import { useInsights } from '../../../../lib/useInsights'
import type { AlgorithmWeatherResponse, Platform } from '../../../../types/insights'
import { formatChangePercent } from '../../../../lib/format'
import EvidenceTrail from '../../shared/EvidenceTrail'
import WidgetCard from '../../shared/WidgetCard'

interface AlgorithmWeatherCardProps {
  className?: string
}

const PLATFORM_META: Record<
  Platform,
  { label: string; icon: string; accent: string; ring: string }
> = {
  instagram: {
    label: 'Instagram',
    icon: 'fa-instagram',
    accent: 'text-pink-300',
    ring: 'ring-pink-500/30',
  },
  tiktok: {
    label: 'TikTok',
    icon: 'fa-tiktok',
    accent: 'text-sky-300',
    ring: 'ring-sky-500/30',
  },
}

function PlatformToggle({
  platform,
  onChange,
}: {
  platform: Platform
  onChange: (next: Platform) => void
}) {
  const baseBtn =
    'px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors inline-flex items-center gap-1.5'
  const active =
    'bg-white/10 text-white border border-white/15 shadow-sm shadow-black/30'
  const idle =
    'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-transparent'
  return (
    <div
      role="tablist"
      aria-label="Platform"
      className="inline-flex items-center gap-1 p-0.5 rounded-full bg-black/30 border border-white/[0.06]"
    >
      {(['instagram', 'tiktok'] as Platform[]).map((p) => {
        const meta = PLATFORM_META[p]
        const isActive = platform === p
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(p)}
            className={`${baseBtn} ${isActive ? active : idle}`}
          >
            <i className={`fab ${meta.icon} text-[10px] ${isActive ? meta.accent : ''}`} />
            <span>{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function SignalPill({
  signal,
  changePct,
  claimId,
  confidence,
}: {
  signal: string
  changePct: number
  claimId: string
  confidence: number
}) {
  const positive = changePct > 0
  const flat = Math.abs(changePct) < 0.5
  const tone = flat
    ? 'bg-slate-500/10 text-slate-300 border-slate-500/20'
    : positive
      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/25'
      : 'bg-rose-500/10 text-rose-200 border-rose-500/25'
  const confPct = Math.round(
    (Math.abs(confidence) <= 1 ? confidence * 100 : confidence) || 0,
  )
  return (
    <div
      className={`flex items-center gap-2 rounded-2xl border ${tone} px-3 py-2`}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[11px] sm:text-xs font-bold text-slate-100 truncate leading-tight">
          {signal}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] font-black tabular-nums">
            {formatChangePercent(changePct)}
          </span>
          <span className="text-[9px] text-slate-500 font-bold">
            · {confPct}% conf
          </span>
        </div>
      </div>
      {claimId ? (
        <EvidenceTrail claimId={claimId} iconOnly triggerLabel="Why?" />
      ) : null}
    </div>
  )
}

export default function AlgorithmWeatherCard({
  className = '',
}: AlgorithmWeatherCardProps) {
  const [platform, setPlatform] = useState<Platform>('instagram')

  const { data, loading, error, retry } = useInsights<AlgorithmWeatherResponse>(
    `tier0/algorithm-weather?platform=${platform}`,
  )

  const signals = data?.signals ?? []
  const meta = PLATFORM_META[platform]

  // Show empty UI when the endpoint returns no actionable signals (the
  // current backend fallback before the weekly job has run).
  const showEmpty = !loading && !error && signals.length === 0

  return (
    <WidgetCard
      title="Algorithm Weather"
      subtitle="What the platform is rewarding this week."
      icon="fa-cloud-bolt"
      iconBg="bg-sky-500/15"
      iconColor="text-sky-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={false /* we render our own empty body below to preserve the toggle */}
      size="lg"
      className={className}
      actions={<PlatformToggle platform={platform} onChange={setPlatform} />}
    >
      {showEmpty ? (
        <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/15 flex items-center justify-center">
            <i className="fas fa-sun text-amber-300 text-base" />
          </div>
          <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xs">
            {data?.summary ||
              'All quiet on the algorithm front this week — no significant shifts detected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.summary ? (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              <i className={`fab ${meta.icon} ${meta.accent} mr-2 text-[11px]`} />
              <span className="font-semibold">{meta.label}:</span> {data.summary}
            </p>
          ) : null}
          <ul className="grid grid-cols-1 gap-2">
            {signals.map((s, idx) => (
              <li key={`${s.signal}-${idx}`}>
                <SignalPill
                  signal={s.signal}
                  changePct={Number(s.change_pct) || 0}
                  claimId={s.evidence_query}
                  confidence={Number(s.confidence) || 0}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </WidgetCard>
  )
}
