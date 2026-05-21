/**
 * WidgetErrorBoundary — generic React error boundary scoped to a single
 * insights widget. If a widget crashes during render (e.g. malformed
 * backend payload, undefined access in a chart library), the boundary
 * catches the error and renders a small in-card fallback while leaving
 * the rest of the tier intact.
 *
 * Usage:
 *   <WidgetErrorBoundary name="NicheLeaderboard">
 *     <NicheLeaderboard />
 *   </WidgetErrorBoundary>
 *
 * The fallback intentionally mimics WidgetCard's error state so the
 * dashboard's visual rhythm stays consistent — same glass card, same
 * iconography, same "Retry" affordance (which here forces a remount via
 * resetKey bump).
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface WidgetErrorBoundaryProps {
  /** Friendly name surfaced in the fallback ("NicheLeaderboard") */
  name: string
  /** Optional CSS class forwarded to the fallback wrapper */
  className?: string
  children: ReactNode
}

interface WidgetErrorBoundaryState {
  error: Error | null
  resetKey: number
}

export default class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  constructor(props: WidgetErrorBoundaryProps) {
    super(props)
    this.state = { error: null, resetKey: 0 }
  }

  static getDerivedStateFromError(error: Error): Partial<WidgetErrorBoundaryState> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console so developers see the stack — production observers
    // can wire this into Sentry later without breaking the contract.
    // eslint-disable-next-line no-console
    console.error(`[WidgetErrorBoundary:${this.props.name}]`, error, info)
  }

  handleRetry = () => {
    this.setState((s) => ({ error: null, resetKey: s.resetKey + 1 }))
  }

  render() {
    const { error, resetKey } = this.state
    const { name, className = '', children } = this.props

    if (error) {
      return (
        <section
          role="alert"
          className={`glass-card rounded-3xl p-5 sm:p-6 ${className}`}
        >
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center">
              <i className="fas fa-triangle-exclamation text-rose-400 text-sm" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200 mb-1">
                {name} crashed
              </div>
              <div className="text-xs text-slate-500 max-w-xs">
                Something went wrong rendering this widget. The rest of the
                dashboard is unaffected.
              </div>
            </div>
            <button
              onClick={this.handleRetry}
              className="mt-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[11px] font-black uppercase tracking-widest text-slate-200 transition-colors"
            >
              <i className="fas fa-rotate-right mr-1.5 text-[10px]" />
              Reload widget
            </button>
          </div>
        </section>
      )
    }

    // Bumping the key forces React to remount the subtree on retry —
    // useful because the offending render may have left the widget in
    // an inconsistent local-state.
    return <div key={resetKey}>{children}</div>
  }
}
