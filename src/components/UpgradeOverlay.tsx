import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch, apiFetch } from '../lib/api'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { trackEvent, trackPricingView } from '../lib/analytics'
import { useUpgrade } from '../context/UpgradeContext'
import PlanCard, { type Plan } from './PlanCard'

/**
 * Full-screen pricing overlay shown when a Free-tier user tries to use a
 * gated surface (Dashboard widget, Virality Check, API Keys). Reuses
 * <PlanCard> so visuals stay aligned with /choose-plan.
 */
export default function UpgradeOverlay() {
  const { isOpen, source, closeUpgrade } = useUpgrade()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [paddleInstance, setPaddleInstance] = useState<Paddle>()

  // Initialize Paddle once when the overlay first opens
  useEffect(() => {
    if (!isOpen || paddleInstance) return
    initializePaddle({
      environment:
        import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string,
    }).then((instance) => {
      if (instance) setPaddleInstance(instance)
    })
  }, [isOpen, paddleInstance])

  // Lazy-load plans when overlay opens
  useEffect(() => {
    if (!isOpen || plans.length > 0) return
    setLoading(true)
    apiFetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || [])
        if (source) trackEvent('upgrade_overlay_view', 'conversion', { source })
      })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [isOpen, plans.length, source])

  // ESC to close
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeUpgrade()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, closeUpgrade])

  // Prevent body scroll while open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const handleSubscribe = async (plan: Plan) => {
    trackEvent('plan_checkout_initiated', 'conversion', {
      plan: plan.slug,
      price: plan.price_amount,
      source: source || 'upgrade_overlay',
    })
    trackPricingView('click_cta', plan.slug, plan.name, plan.price_amount, plan.billing_interval)
    setSubscribing(plan.paddle_price_id)
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.paddle_price_id }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout')
        return
      }
      paddleInstance?.Checkout.open({
        ...data.checkoutConfig,
        customer: data.checkoutConfig.customer?.id
          ? { id: data.checkoutConfig.customer.id }
          : undefined,
      })
    } catch (err) {
      console.error('Upgrade overlay checkout error:', err)
    } finally {
      setSubscribing(null)
    }
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade your plan"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 backdrop-blur-md p-4"
      onClick={closeUpgrade}
    >
      <div
        className="relative max-w-5xl w-full my-12"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeUpgrade}
          aria-label="Close upgrade overlay"
          className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-6 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
            Upgrade required
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight mb-3">
            Unlock <span className="gradient-text">Blossom</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
            Pick a plan to use the Dashboard, Virality Check, and the rest of the platform. Cancel anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                subscribingPriceId={subscribing}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
