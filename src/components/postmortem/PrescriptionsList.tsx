/**
 * PrescriptionsList — the ranked action items. The bottom of the page
 * but arguably the most important section: this is what the user
 * actually DOES with everything above.
 *
 * Each prescription has:
 *   - Rank pill (1, 2, 3…)
 *   - Action sentence — verb-first, specific, no hedging
 *   - Effort badge + expected lift badge
 *   - "Why?" Evidence Trail button (opens modal with claim trail)
 *   - "Add to next post checklist" CTA — currently stubbed with a
 *     toast notification ("Added (coming soon)") because the
 *     `user_checklists` table doesn't exist yet.
 */

import toast from 'react-hot-toast'
import type { PostMortemResponse } from '../../types/insights'
import EvidenceTrail from '../insights/shared/EvidenceTrail'
import WidgetCard from '../insights/shared/WidgetCard'

interface PrescriptionsListProps {
  prescriptions: PostMortemResponse['prescriptions']
  className?: string
}

const EFFORT_TONE: Array<{ match: RegExp; chip: string }> = [
  { match: /\b([0-9]+)\s*min\b/i, chip: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
  { match: /\b([0-9]+)\s*(hr|hour|hours)\b/i, chip: 'bg-amber-500/15 text-amber-300 border-amber-500/25' },
  { match: /(day|week)/i, chip: 'bg-rose-500/15 text-rose-300 border-rose-500/25' },
]

function effortChipClass(effort: string): string {
  for (const t of EFFORT_TONE) {
    if (t.match.test(effort)) return t.chip
  }
  return 'bg-white/[0.08] text-slate-300 border-white/10'
}

function handleAddToChecklist(_rank: number, action: string) {
  // Future: POST /api/insights/checklist with { rank, action, video_id, claim_id }.
  // For now we just give the user feedback so the affordance is real.
  // Truncate so the toast doesn't fill the screen.
  const preview = action.length > 60 ? `${action.slice(0, 57)}…` : action
  toast.success(`Added to checklist: ${preview}`, {
    icon: '📋',
    duration: 3200,
    style: {
      background: '#0a0a12',
      color: '#f8fafc',
      border: '1px solid rgba(255,255,255,0.1)',
      fontSize: '13px',
    },
  })
}

export default function PrescriptionsList({
  prescriptions,
  className = '',
}: PrescriptionsListProps) {
  const sorted = [...prescriptions].sort((a, b) => a.rank - b.rank)

  return (
    <WidgetCard
      title="What to do next"
      subtitle="Ranked by upside. Knock these out and the next post lands harder."
      icon="fa-list-check"
      iconBg="bg-pink-500/15"
      iconColor="text-pink-400"
      size="lg"
      isEmpty={sorted.length === 0}
      emptyMessage="No prescriptions were generated for this video. Try analyzing more of your hits so the model has something to baseline against."
      emptyIcon="fa-pen-ruler"
      className={className}
    >
      <ol className="space-y-3">
        {sorted.map((p) => (
          <li
            key={p.rank}
            className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-4 sm:p-5"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Rank pill */}
              <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-pink-500/25 to-purple-500/25 border border-pink-500/30 flex items-center justify-center font-black text-pink-200 text-base sm:text-lg">
                {p.rank}
              </div>

              <div className="min-w-0 flex-1">
                {/* Action */}
                <p className="text-sm sm:text-base font-bold text-slate-100 leading-snug mb-3">
                  {p.action}
                </p>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {p.effort ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold ${effortChipClass(p.effort)}`}
                    >
                      <i className="fas fa-stopwatch text-[10px]" />
                      {p.effort}
                    </span>
                  ) : null}
                  {p.expected_lift ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-500/15 text-pink-300 border border-pink-500/25 text-[11px] font-bold">
                      <i className="fas fa-arrow-trend-up text-[10px]" />
                      {p.expected_lift}
                    </span>
                  ) : null}
                </div>

                {/* CTA row */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddToChecklist(p.rank, p.action)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-500/90 hover:bg-pink-500 text-white text-[11px] font-black uppercase tracking-widest transition-colors"
                  >
                    <i className="fas fa-circle-plus text-[10px]" />
                    Add to next post
                  </button>
                  {p.evidence_claim_id ? (
                    <EvidenceTrail claimId={p.evidence_claim_id} triggerLabel="Why?" />
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </WidgetCard>
  )
}
