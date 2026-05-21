/**
 * WidgetSlot — temporary placeholder for an unfilled widget slot.
 *
 * Stage 3 FE1 ships each tier with a grid of these named slots so
 * Stage 4 widget agents (W0-W4) know exactly where their widget
 * components plug in. When a widget agent ships, they import their
 * widget into the matching tier file and replace the `<WidgetSlot
 * name="..." />` element with their `<RealWidget />`.
 *
 * The visual treatment intentionally signals "incomplete":
 *  - "Coming soon" pill with pulsing dot
 *  - Widget title displayed as it will appear when shipped
 *  - Optional one-line description hint
 *  - Glass card surface matching the rest of the dashboard
 */

import type { ReactNode } from 'react'

interface WidgetSlotProps {
  /** Slot identifier — must match the widget file name Stage 4 will ship */
  name: string
  /** Optional one-line hint about what the widget will show */
  hint?: string
  /** Optional FontAwesome icon class (e.g. "fa-bolt") */
  icon?: string
  /** Optional Tailwind background tint for the icon chip */
  iconBg?: string
  /** Optional Tailwind text color for the icon */
  iconColor?: string
  /** Optional CSS class to control slot sizing within the tier grid */
  className?: string
  /** Optional override body — Stage 4 widgets pass their content here */
  children?: ReactNode
}

export default function WidgetSlot({
  name,
  hint,
  icon = 'fa-puzzle-piece',
  iconBg = 'bg-white/[0.04]',
  iconColor = 'text-slate-400',
  className,
  children,
}: WidgetSlotProps) {
  if (children) {
    // Stage 4 has shipped real content into this slot.
    return <div className={className}>{children}</div>
  }

  return (
    <div
      className={
        'glass-card rounded-3xl p-5 sm:p-6 flex flex-col gap-3 min-h-[180px] ' +
        (className ?? '')
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            'w-8 h-8 sm:w-9 sm:h-9 ' +
            iconBg +
            ' rounded-xl flex items-center justify-center shrink-0 ' +
            iconColor
          }
        >
          <i className={'fas ' + icon + ' text-xs sm:text-sm'} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-bold leading-tight">{name}</h3>
          {hint && (
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1 leading-snug">
              {hint}
            </p>
          )}
        </div>
      </div>
      <div className="mt-auto inline-flex items-center gap-2 self-start px-2.5 py-1 rounded-full bg-white/[0.04]">
        <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400">
          Coming soon
        </span>
      </div>
    </div>
  )
}
