/**
 * WidgetCard — the standard glass-card wrapper every insights widget
 * mounts inside. Handles the four lifecycle states (loading / error /
 * empty / content) consistently so widget authors only have to provide
 * the success-state children.
 *
 * Size variants control padding and the skeleton silhouette. Slot
 * named `actions` is where widgets drop an "Why?" Evidence Trail
 * trigger, or a filter dropdown, etc.
 *
 * No data fetching here — the parent widget owns the `useInsights`
 * call and threads loading/error/onRetry in as props.
 */

import type { ReactNode } from 'react'
import type { LockedState } from '../../../lib/useInsights'
import LockedWidget, { type LockTier } from './LockedWidget'

interface WidgetCardProps {
  title: string
  subtitle?: string
  loading?: boolean
  error?: Error | string | null
  isEmpty?: boolean
  emptyMessage?: string
  emptyIcon?: string
  onRetry?: () => void
  actions?: ReactNode
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Optional icon class (e.g. `fa-bolt`) shown beside the title. */
  icon?: string
  /** Tailwind tint utility for the icon chip, e.g. `bg-pink-500/20`. */
  iconBg?: string
  /** Tailwind text utility for the icon glyph, e.g. `text-pink-400`. */
  iconColor?: string
  /**
   * When the backend returned 403 (`tier_required`), `useInsights`
   * surfaces this. WidgetCard then renders a <LockedWidget> in place of
   * the loading/error/empty/content branches.
   */
  locked?: LockedState
  /**
   * Tier the widget belongs to — drives the LockedWidget copy block.
   * Required when `locked` is set; ignored otherwise.
   */
  tier?: LockTier
}

const SIZE_PADDING: Record<NonNullable<WidgetCardProps['size']>, string> = {
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-5 sm:p-7',
  xl: 'p-6 sm:p-8 lg:p-10',
}

const SIZE_RADIUS: Record<NonNullable<WidgetCardProps['size']>, string> = {
  sm: 'rounded-2xl',
  md: 'rounded-2xl',
  lg: 'rounded-3xl',
  xl: 'rounded-3xl',
}

const SIZE_TITLE: Record<NonNullable<WidgetCardProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg',
  xl: 'text-lg sm:text-xl',
}

const SKELETON_ROWS: Record<NonNullable<WidgetCardProps['size']>, number> = {
  sm: 2,
  md: 3,
  lg: 4,
  xl: 6,
}

function ErrorState({
  error,
  onRetry,
}: {
  error: Error | string
  onRetry?: () => void
}) {
  const message = typeof error === 'string' ? error : error.message || 'Something went wrong.'
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3"
    >
      <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
        <i className="fas fa-exclamation-triangle text-rose-400 text-sm" />
      </div>
      <div>
        <div className="text-sm font-bold text-slate-200 mb-1">Failed to load</div>
        <div className="text-xs text-slate-500 max-w-xs">{message}</div>
      </div>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-200 transition-colors"
        >
          <i className="fas fa-rotate-right mr-1.5 text-[10px]" />
          Retry
        </button>
      ) : null}
    </div>
  )
}

function EmptyState({
  message,
  icon,
}: {
  message: string
  icon: string
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-white/[0.04] flex items-center justify-center">
        <i className={`fas ${icon} text-slate-500 text-base`} />
      </div>
      <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs">{message}</p>
    </div>
  )
}

function SkeletonBody({ rows }: { rows: number }) {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/5 shrink-0" />
          <div className="flex-1 space-y-2">
            <div
              className="h-3 bg-white/5 rounded"
              style={{ width: `${60 + ((i * 13) % 30)}%` }}
            />
            <div
              className="h-2.5 bg-white/[0.04] rounded"
              style={{ width: `${30 + ((i * 7) % 25)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function WidgetCard({
  title,
  subtitle,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = 'No data yet.',
  emptyIcon = 'fa-inbox',
  onRetry,
  actions,
  children,
  className = '',
  size = 'md',
  icon,
  iconBg = 'bg-white/[0.05]',
  iconColor = 'text-slate-300',
  locked = null,
  tier,
}: WidgetCardProps) {
  // Tier-locked path — render <LockedWidget> in place of the whole
  // card. The LockedWidget owns its own glass + gradient treatment so
  // we bypass the normal header/body chrome entirely; this also means
  // tier locks are immediately recognisable as a different surface
  // from loading/error/empty states.
  if (locked) {
    return (
      <LockedWidget
        requiredPlan={locked.requiredPlan}
        tier={tier ?? 'flagship'}
        widgetTitle={title}
        className={className}
      />
    )
  }

  const padding = SIZE_PADDING[size]
  const radius = SIZE_RADIUS[size]
  const titleSize = SIZE_TITLE[size]
  const skeletonRows = SKELETON_ROWS[size]

  let body: ReactNode
  if (loading) {
    body = <SkeletonBody rows={skeletonRows} />
  } else if (error) {
    body = <ErrorState error={error} onRetry={onRetry} />
  } else if (isEmpty) {
    body = <EmptyState message={emptyMessage} icon={emptyIcon} />
  } else {
    body = children
  }

  return (
    <section
      className={`glass-card ${radius} ${padding} ${className}`}
      aria-busy={loading || undefined}
    >
      <header className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-start gap-3 min-w-0">
          {icon ? (
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}
            >
              <i className={`fas ${icon} ${iconColor} text-xs sm:text-sm`} />
            </div>
          ) : null}
          <div className="min-w-0">
            <h3 className={`${titleSize} font-bold leading-tight text-slate-100 truncate`}>
              {title}
            </h3>
            {subtitle ? (
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5 leading-snug">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        ) : null}
      </header>
      <div>{body}</div>
    </section>
  )
}
