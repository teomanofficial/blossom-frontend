export type StepState = 'done' | 'running' | 'pending' | 'error'

export interface PipelineStep {
  key: string
  label: string
  subtitle?: string | null
}

interface PipelineStepperProps {
  steps: PipelineStep[]
  /** Resolve the state for a step by index. */
  stateOf: (index: number) => StepState
}

/**
 * Vertical, color-coded progress stepper — done (emerald), running (pink
 * pulse), pending (muted), error (red). Visual treatment mirrors the
 * stepper in ContentAnalysis.tsx so async Script Studio steps feel native.
 */
export default function PipelineStepper({ steps, stateOf }: PipelineStepperProps) {
  return (
    <div className="space-y-0 relative">
      {steps.map((step, idx) => {
        const state = stateOf(idx)
        const isLast = idx === steps.length - 1
        const isPending = state === 'pending'

        return (
          <div
            key={step.key}
            className={`flex items-start gap-4 pb-5 relative transition-opacity duration-500 ${
              isPending ? 'opacity-30' : ''
            }`}
          >
            {/* Connector line */}
            {!isLast && (
              <div
                className={`absolute left-[13px] top-[28px] bottom-0 w-[2px] transition-all duration-500 ${
                  state === 'done'
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-500/20'
                    : 'bg-white/5'
                }`}
              />
            )}

            {/* Step circle */}
            <div
              className={`w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all duration-500 ${
                state === 'done'
                  ? 'bg-emerald-500/20 border border-emerald-500'
                  : state === 'running'
                  ? 'bg-pink-500/20 border border-pink-500 analysis-active-step'
                  : state === 'error'
                  ? 'bg-red-500/20 border border-red-500'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {state === 'done' ? (
                <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              ) : state === 'running' ? (
                <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping" />
              ) : state === 'error' ? (
                <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <div className="w-1 h-1 bg-white/20 rounded-full" />
              )}
            </div>

            {/* Step text */}
            <div className="pt-0.5 min-w-0">
              <h4
                className={`font-bold text-[13px] tracking-wide transition-all ${
                  state === 'done'
                    ? 'text-emerald-500'
                    : state === 'error'
                    ? 'text-red-400'
                    : 'text-white'
                }`}
              >
                {step.label}
              </h4>
              {state === 'running' && step.subtitle && (
                <p className="text-[11px] text-slate-400 mt-0.5 transition-all duration-300">
                  {step.subtitle}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
