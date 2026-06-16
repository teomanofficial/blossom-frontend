import type { ScriptStatus } from '../../types/scripts'

export type WizardStep = 'topic' | 'research' | 'hooks' | 'script'

export const WIZARD_STEPS: { key: WizardStep; label: string; icon: string }[] = [
  { key: 'topic', label: 'Topic', icon: 'fa-lightbulb' },
  { key: 'research', label: 'Research', icon: 'fa-magnifying-glass-chart' },
  { key: 'hooks', label: 'Hook', icon: 'fa-bolt' },
  { key: 'script', label: 'Script', icon: 'fa-pen-nib' },
]

/** Map a backend status to the wizard step it belongs to. */
export function stepFromStatus(status: ScriptStatus): WizardStep {
  switch (status) {
    case 'topic':
      return 'topic'
    case 'researching':
    case 'research_ready':
      return 'research'
    case 'hooks_ready':
      return 'hooks'
    case 'scripting':
    case 'script_ready':
      return 'script'
    default:
      return 'topic'
  }
}

interface WizardStepsProps {
  /** The step currently shown. */
  current: WizardStep
  /** Allow jumping back to an already-reached step. */
  onSelect?: (step: WizardStep) => void
  /** Steps the user is allowed to navigate to (already completed/visited). */
  reachable?: WizardStep[]
}

/**
 * Horizontal 4-step header styled as Blossom glass pills. The active step
 * carries the pink/orange accent; completed steps show a check.
 */
export default function WizardSteps({ current, onSelect, reachable = [] }: WizardStepsProps) {
  const currentIdx = WIZARD_STEPS.findIndex((s) => s.key === current)

  return (
    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1">
      {WIZARD_STEPS.map((step, idx) => {
        const isActive = step.key === current
        const isDone = idx < currentIdx
        const canSelect = !!onSelect && (reachable.includes(step.key) || isDone)

        return (
          <div key={step.key} className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              disabled={!canSelect}
              onClick={canSelect ? () => onSelect?.(step.key) : undefined}
              className={`group inline-flex items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 transition-all ${
                isActive
                  ? 'border-pink-500/40 bg-gradient-to-r from-pink-500/15 to-orange-400/10 ring-1 ring-pink-500/20'
                  : isDone
                  ? 'border-emerald-500/25 bg-emerald-500/[0.06]'
                  : 'border-white/[0.06] bg-white/[0.03]'
              } ${canSelect ? 'cursor-pointer hover:border-white/20' : 'cursor-default'}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
                  isActive
                    ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white'
                    : isDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-white/5 text-slate-500 border border-white/10'
                }`}
              >
                {isDone ? (
                  <i className="fas fa-check text-[10px]" />
                ) : (
                  <i className={`fas ${step.icon} text-[11px]`} />
                )}
              </span>
              <span
                className={`text-[13px] font-bold tracking-wide ${
                  isActive ? 'text-white' : isDone ? 'text-emerald-300' : 'text-slate-500'
                }`}
              >
                {step.label}
              </span>
            </button>
            {idx < WIZARD_STEPS.length - 1 && (
              <div
                className={`h-[2px] w-5 sm:w-8 rounded-full ${
                  idx < currentIdx ? 'bg-emerald-500/40' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
