import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'

interface Subscription {
  id: number
  plan_name: string
  plan_slug: string
  status: string
  price_amount: number
  price_currency: string
  billing_interval: string
  features: string[]
  current_billing_period_end: string
  canceled_at: string | null
  effective_cancel_at: string | null
  paddle_price_id: string
}

export default function Settings() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subStatus, setSubStatus] = useState<string>('none')
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)

  // Fetch subscription
  useEffect(() => {
    authFetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription || null)
        setSubStatus(data.status || 'none')
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const refreshSubscription = async () => {
    try {
      const res = await authFetch('/api/billing/subscription')
      const data = await res.json()
      setSubscription(data.subscription || null)
      setSubStatus(data.status || 'none')
    } catch (err) {
      console.error('Error refreshing subscription:', err)
    }
  }

  const handleCancel = async () => {
    if (
      !confirm(
        'Are you sure you want to cancel? You will retain access until the end of your billing period.'
      )
    ) {
      return
    }
    setCanceling(true)
    try {
      const res = await authFetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        await refreshSubscription()
      } else {
        alert(data.error || 'Failed to cancel')
      }
    } catch (err) {
      console.error('Cancel error:', err)
    } finally {
      setCanceling(false)
    }
  }

  const handleManageBilling = async () => {
    try {
      const res = await authFetch('/api/billing/portal')
      const data = await res.json()
      if (data.portalUrl) {
        window.open(data.portalUrl, '_blank')
      } else if (data.updatePaymentUrl) {
        window.open(data.updatePaymentUrl, '_blank')
      } else {
        alert('Portal not available')
      }
    } catch (err) {
      console.error('Portal error:', err)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
            Settings
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2">
          Billing & <span className="gradient-text">Subscription</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Manage your plan, payment method, and billing details.
        </p>
      </div>


      {/* Current Subscription Card */}
      {subscription && subStatus !== 'none' ? (
        <div className="glass-card rounded-2xl p-7 mb-10">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-5">
            Current Plan
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black mb-1">
                {subscription.plan_name}
              </div>
              <div className="text-sm text-slate-400 font-semibold">
                {formatPrice(subscription.price_amount)}/
                {subscription.billing_interval}
              </div>
              {subscription.current_billing_period_end && (
                <div className="text-xs text-slate-500 mt-1">
                  {subscription.canceled_at
                    ? `Cancels on ${new Date(subscription.effective_cancel_at || subscription.current_billing_period_end).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.current_billing_period_end).toLocaleDateString()}`}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  subStatus === 'active'
                    ? 'bg-teal-400/10 text-teal-400'
                    : subStatus === 'canceled'
                      ? 'bg-red-400/10 text-red-400'
                      : subStatus === 'past_due'
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-slate-400/10 text-slate-400'
                }`}
              >
                {subStatus}
              </span>
            </div>
          </div>

          {/* Features list */}
          {subscription.features && subscription.features.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                Your Features
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subscription.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <i className="fas fa-check text-teal-400 text-xs mt-1" />
                    <span className="text-slate-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleManageBilling}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
            >
              <i className="fas fa-credit-card mr-2 text-xs" />
              Manage Payment
            </button>
            {subStatus === 'active' && !subscription.canceled_at && (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
              >
                {canceling ? 'Canceling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-7 text-center">
          <p className="text-slate-400 font-medium">
            No active subscription found.
          </p>
        </div>
      )}
    </>
  )
}
