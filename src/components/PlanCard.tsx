import { type ReactNode } from 'react'

export interface Plan {
  id: number
  name: string
  slug: string
  description: string
  price_amount: number
  price_currency: string
  billing_interval: string
  features: string[]
  paddle_price_id: string
  coming_soon: boolean
}

interface PlanCardProps {
  plan: Plan
  /** Plan slug currently being checked-out so we can show a loading state. */
  subscribingPriceId: string | null
  onSubscribe: (plan: Plan) => void
  /** Override the CTA copy (defaults to "Start Free Trial"). */
  ctaLabel?: ReactNode
  /** Override the secondary copy shown under the CTA. */
  ctaSubcopy?: ReactNode
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

/**
 * Shared pricing card used by /choose-plan (full-page picker) and
 * <UpgradeOverlay> (in-app modal). Keep visual semantics aligned — both
 * surfaces compete for the same "click to checkout" intent.
 */
export default function PlanCard({
  plan,
  subscribingPriceId,
  onSubscribe,
  ctaLabel,
  ctaSubcopy,
}: PlanCardProps) {
  const isFeatured = plan.slug === 'premium'

  return (
    <div
      className={`glass-card rounded-[2.5rem] p-8 sm:p-10 relative transition-all hover:scale-[1.02] ${
        isFeatured ? 'border-pink-500/30 ring-1 ring-pink-500/20 scale-105' : ''
      }`}
    >
      {isFeatured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
          Most Popular
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
        <p className="text-xs text-slate-500 font-medium">{plan.description}</p>
      </div>

      <div className="mb-8">
        <span className="text-5xl font-black">{formatPrice(plan.price_amount)}</span>
        <span className="text-sm text-slate-500 font-semibold">/{plan.billing_interval}</span>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <svg
              className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-slate-300 font-medium">{feature}</span>
          </li>
        ))}
      </ul>

      {plan.coming_soon ? (
        <button
          disabled
          className="w-full py-4 rounded-2xl text-sm font-black bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed"
        >
          Coming Soon
        </button>
      ) : (
        <>
          <button
            onClick={() => onSubscribe(plan)}
            disabled={subscribingPriceId === plan.paddle_price_id}
            className={`w-full py-4 rounded-2xl text-sm font-black transition-all disabled:opacity-50 ${
              isFeatured
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white glow-button hover:scale-105'
                : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
            }`}
          >
            {subscribingPriceId === plan.paddle_price_id
              ? 'Opening checkout...'
              : ctaLabel || 'Start Free Trial'}
          </button>
          <div className="text-emerald-400/80 text-xs font-medium mt-2 text-center flex items-center justify-center gap-1">
            {ctaSubcopy || (
              <>
                <svg
                  className="w-3.5 h-3.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
                No payment due now
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
