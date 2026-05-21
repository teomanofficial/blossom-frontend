/**
 * WidgetInfoTooltip — the small `ⓘ` icon button that lives next to every
 * insight widget title. On hover (desktop) or click (mobile + a11y) it
 * surfaces a popover explaining what the widget shows, how to read it,
 * and — optionally — how it's computed.
 *
 * The component is intentionally lightweight: no Radix, no Floating UI.
 * Just Tailwind + a controlled `useState` + a global click-outside +
 * Escape listener. The positioning is "below the trigger" by default
 * and flips to "above" if the viewport bottom is too close, so it never
 * gets clipped at the bottom of a tall dashboard column.
 *
 * Mobile behavior: when the viewport is narrow (≤ 640px) the popover
 * promotes itself to a full-width bottom sheet anchored to the bottom
 * of the screen with a backdrop tap to dismiss. This way we don't fight
 * with thin tooltip rendering on tiny phones — long copy stays readable.
 *
 * Accessibility:
 *   - Trigger is a real <button> with `aria-haspopup="dialog"` and
 *     `aria-expanded`. Focus is trapped by the browser's normal tab
 *     order — we don't move focus into the popover automatically to
 *     keep the keyboard-only flow predictable, but the dialog wrapper
 *     IS labelled by the title.
 *   - The popover has role="dialog" and is `aria-modal="false"` so
 *     screen readers don't treat it as a hard modal.
 *   - Escape dismisses; click-outside dismisses.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface WidgetTooltipContent {
  /** Bold one-line "what this widget shows" sentence. */
  what: string
  /** 2-3 sentences explaining how to interpret it. */
  howToRead: string
  /** Optional: "How it's computed" footnote. */
  computation?: string
  /** Optional: example interpretation. */
  example?: string
}

interface WidgetInfoTooltipProps extends WidgetTooltipContent {
  /** The widget title — surfaced as the dialog heading. */
  title: string
}

const MOBILE_BREAKPOINT_PX = 640

function useIsMobile(): boolean {
  // Lazy default so SSR/hydration sees a sane initial value; the effect
  // refines once we know the actual viewport.
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= MOBILE_BREAKPOINT_PX
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    function onResize() {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT_PX)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return isMobile
}

export default function WidgetInfoTooltip({
  title,
  what,
  howToRead,
  computation,
  example,
}: WidgetInfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const isMobile = useIsMobile()
  const popoverId = useId()

  // Desktop positioning: flip to "above" when there's not enough room
  // below the trigger.
  const [placement, setPlacement] = useState<'below' | 'above'>('below')
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const POPOVER_W = 320
    const ESTIMATED_H = 240
    const GAP = 8
    const flipAbove = rect.bottom + GAP + ESTIMATED_H > viewportH - 12
    const nextPlacement = flipAbove ? 'above' : 'below'
    setPlacement(nextPlacement)

    // Anchor horizontally to the trigger but clamp to the viewport so
    // the popover never extends past the right edge.
    const desiredLeft = rect.left + rect.width / 2 - POPOVER_W / 2
    const clampedLeft = Math.max(
      12,
      Math.min(desiredLeft, viewportW - POPOVER_W - 12),
    )
    const top =
      nextPlacement === 'below' ? rect.bottom + GAP : rect.top - GAP
    setCoords({ top, left: clampedLeft })
  }, [])

  // Re-compute position when opened or when the viewport changes.
  useEffect(() => {
    if (!open || isMobile) return
    updatePosition()
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open, isMobile, updatePosition])

  // Click-outside + Escape to dismiss.
  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null
      if (!target) return
      // Ignore taps inside the popover or on the trigger itself.
      if (popoverRef.current?.contains(target)) return
      if (triggerRef.current?.contains(target)) return
      setOpen(false)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
        // Return focus to the trigger so keyboard users don't lose context.
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown, { passive: true })
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // Hover behavior on desktop: small delay before close so the user can
  // sweep into the popover content without losing it.
  const closeTimer = useRef<number | null>(null)
  const onMouseEnterTrigger = useCallback(() => {
    if (isMobile) return
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
    setOpen(true)
  }, [isMobile])

  const onMouseLeaveTrigger = useCallback(() => {
    if (isMobile) return
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }, [isMobile])

  const onMouseEnterPopover = useCallback(() => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  const onMouseLeavePopover = useCallback(() => {
    if (isMobile) return
    if (closeTimer.current) window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }, [isMobile])

  // Cleanup any straggling timer on unmount.
  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    }
  }, [])

  const onClickTrigger = useCallback(() => {
    setOpen((prev) => !prev)
  }, [])

  const popoverBody = (
    <>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5">
        About this widget
      </div>
      <h4
        id={`${popoverId}-title`}
        className="text-sm font-bold text-slate-100 leading-snug mb-2"
      >
        {title}
      </h4>
      <p className="text-[12px] font-semibold text-slate-200 leading-snug mb-2">
        {what}
      </p>
      <p className="text-[11px] text-slate-400 leading-snug mb-3">{howToRead}</p>
      {computation ? (
        <div className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-2.5 py-2 mb-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
            How it's computed
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">{computation}</p>
        </div>
      ) : null}
      {example ? (
        <div className="rounded-lg bg-amber-500/[0.06] border border-amber-500/[0.18] px-2.5 py-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-amber-300/80 mb-0.5">
            Example
          </div>
          <p className="text-[11px] text-amber-100/90 leading-snug italic">
            {example}
          </p>
        </div>
      ) : null}
    </>
  )

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        onClick={onClickTrigger}
        onMouseEnter={onMouseEnterTrigger}
        onMouseLeave={onMouseLeaveTrigger}
        onFocus={onMouseEnterTrigger}
        onBlur={onMouseLeaveTrigger}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        aria-label={`About ${title}`}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-slate-400/40 transition-colors shrink-0"
      >
        <i className="fas fa-circle-info text-[12px]" aria-hidden="true" />
      </button>

      {open
        ? isMobile
          ? createPortal(
              <div
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
                role="presentation"
              >
                {/* Backdrop */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Bottom sheet */}
                <div
                  ref={popoverRef}
                  id={popoverId}
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby={`${popoverId}-title`}
                  className="relative w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl bg-slate-900/98 backdrop-blur-xl border-t border-x border-white/10 sm:border shadow-2xl shadow-black/60 px-4 pt-3 pb-5 sm:p-5 max-h-[80vh] overflow-y-auto"
                >
                  {/* Drag handle decor */}
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
                  {popoverBody}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="mt-4 w-full px-3 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-200 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>,
              document.body,
            )
          : coords
            ? createPortal(
                <div
                  ref={popoverRef}
                  id={popoverId}
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby={`${popoverId}-title`}
                  onMouseEnter={onMouseEnterPopover}
                  onMouseLeave={onMouseLeavePopover}
                  style={{
                    position: 'fixed',
                    top: placement === 'below' ? coords.top : undefined,
                    bottom:
                      placement === 'above'
                        ? typeof window !== 'undefined'
                          ? window.innerHeight - coords.top
                          : undefined
                        : undefined,
                    left: coords.left,
                    width: 320,
                    zIndex: 100,
                  }}
                  className="rounded-2xl bg-slate-900/98 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/60 p-4 text-left"
                >
                  {popoverBody}
                </div>,
                document.body,
              )
            : null
        : null}
    </>
  )
}
