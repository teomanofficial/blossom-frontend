import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch, apiFetch } from '../lib/api'

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

interface Plan {
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

interface ConfirmModalState {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  confirmStyle: 'upgrade' | 'danger' | 'default'
  onConfirm: () => void
}

const emptyModal: ConfirmModalState = {
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirm',
  confirmStyle: 'default',
  onConfirm: () => {},
}

const PLAN_TIER: Record<string, number> = { pro: 1, premium: 2, platin: 3 }

function ConfirmModal({
  modal,
  onClose,
}: {
  modal: ConfirmModalState
  onClose: () => void
}) {
  if (!modal.open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-3xl p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          {modal.confirmStyle === 'upgrade' && (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-arrow-up-right-dots text-pink-400" />
            </div>
          )}
          {modal.confirmStyle === 'danger' && (
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-triangle-exclamation text-red-400" />
            </div>
          )}
          {modal.confirmStyle === 'default' && (
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-repeat text-slate-400" />
            </div>
          )}
          <h3 className="text-lg font-black">{modal.title}</h3>
        </div>

        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
          {modal.message}
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              modal.onConfirm()
              onClose()
            }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              modal.confirmStyle === 'upgrade'
                ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:scale-105'
                : modal.confirmStyle === 'danger'
                  ? 'bg-red-500/80 hover:bg-red-500 text-white'
                  : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
            }`}
          >
            {modal.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AccountBilling() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subStatus, setSubStatus] = useState<string>('none')
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])
  const [showChangePlan, setShowChangePlan] = useState(false)
  const [upgrading, setUpgrading] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(emptyModal)

  useEffect(() => {
    Promise.all([
      authFetch('/api/billing/subscription')
        .then((r) => r.json())
        .then((data) => {
          setSubscription(data.subscription || null)
          setSubStatus(data.status || 'none')
        }),
      apiFetch('/api/billing/plans')
        .then((r) => r.json())
        .then((data) => setPlans(data.plans || [])),
    ])
      .catch(() => toast.error('Failed to load billing data'))
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

  const executeCancelSubscription = async () => {
    setCanceling(true)
    try {
      const res = await authFetch('/api/billing/cancel', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        await refreshSubscription()
      } else {
        toast.error(data.error || 'Failed to cancel')
      }
    } catch (err) {
      console.error('Cancel error:', err)
    } finally {
      setCanceling(false)
    }
  }

  const handleCancel = () => {
    setConfirmModal({
      open: true,
      title: 'Cancel Subscription',
      message:
        'Are you sure you want to cancel? You will retain access to all features until the end of your current billing period.',
      confirmLabel: 'Cancel Subscription',
      confirmStyle: 'danger',
      onConfirm: executeCancelSubscription,
    })
  }

  const handleManageBilling = async () => {
    try {
      const res = await authFetch('/api/billing/portal')
      const data = await res.json()
      if (data.updatePaymentUrl) {
        window.open(data.updatePaymentUrl, '_blank')
      } else {
        toast.error('Payment management is not available right now. Please try again later.')
      }
    } catch (err) {
      console.error('Portal error:', err)
    }
  }

  const executePlanChange = async (plan: Plan) => {
    setUpgrading(plan.paddle_price_id)
    try {
      const res = await authFetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.paddle_price_id }),
      })
      const data = await res.json()
      if (res.ok) {
        setShowChangePlan(false)
        setTimeout(() => refreshSubscription(), 2000)
        toast.success('Plan change initiated! Your subscription will update shortly.')
      } else {
        toast.error(data.error || 'Failed to change plan')
      }
    } catch (err) {
      console.error('Upgrade error:', err)
      toast.error('An error occurred. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  const handleChangePlan = (plan: Plan) => {
    const currentTier = PLAN_TIER[subscription?.plan_slug || ''] || 0
    const newTier = PLAN_TIER[plan.slug] || 0
    const isUpgrade = newTier > currentTier

    setConfirmModal({
      open: true,
      title: isUpgrade ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`,
      message: isUpgrade
        ? `You'll be upgraded to ${plan.name} at ${formatPrice(plan.price_amount)}/${plan.billing_interval}. The price difference will be charged immediately (prorated).`
        : `You'll be switched to ${plan.name} at ${formatPrice(plan.price_amount)}/${plan.billing_interval}. The change will be prorated on your next billing cycle.`,
      confirmLabel: isUpgrade ? 'Upgrade Now' : 'Switch Plan',
      confirmStyle: isUpgrade ? 'upgrade' : 'default',
      onConfirm: () => executePlanChange(plan),
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  // Plans available for upgrading (only show higher-tier plans)
  const currentTier = PLAN_TIER[subscription?.plan_slug || ''] || 0
  const availablePlans = plans.filter(
    (p) => p.slug !== subscription?.plan_slug && !p.coming_soon && (PLAN_TIER[p.slug] || 0) > currentTier
  )

  const canChangePlan =
    subscription &&
    (subStatus === 'active' || subStatus === 'trialing' || subStatus === 'past_due') &&
    !subscription.canceled_at

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-black tracking-tight">Billing & Subscription</h2>
        <p className="text-slate-500 text-sm mt-1">
          Manage your plan, payment method, and billing details.
        </p>
      </div>

      {/* Current Subscription Card */}
      {subscription && subStatus !== 'none' ? (
        <div className="glass-card rounded-3xl p-5 sm:p-7">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-5">
            Current Plan
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xl sm:text-2xl font-black mb-1">
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
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
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

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={handleManageBilling}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
            >
              <i className="fas fa-credit-card mr-2 text-xs" />
              Manage Payment
            </button>
            {canChangePlan && availablePlans.length > 0 && (
              <button
                onClick={() => setShowChangePlan(!showChangePlan)}
                className="px-5 py-2.5 bg-gradient-to-r from-pink-500/10 to-orange-400/10 hover:from-pink-500/20 hover:to-orange-400/20 border border-pink-500/20 text-pink-400 rounded-xl text-sm font-bold transition-colors"
              >
                <i className="fas fa-arrow-up-right-dots mr-2 text-xs" />
                Change Plan
              </button>
            )}
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
        <div className="glass-card rounded-3xl p-5 sm:p-7 text-center">
          <p className="text-slate-400 font-medium">
            No active subscription found.
          </p>
        </div>
      )}

      {/* Change Plan Section */}
      {showChangePlan && canChangePlan && (
        <div className="mt-6">
          <div className="glass-card rounded-3xl p-5 sm:p-7">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                Available Plans
              </h3>
              <button
                onClick={() => setShowChangePlan(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <i className="fas fa-xmark text-sm" />
              </button>
            </div>

            <div className="space-y-4">
              {availablePlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="flex items-center justify-between p-5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-lg font-black">{plan.name}</span>
                        <span className="px-2 py-0.5 bg-teal-400/10 text-teal-400 text-[9px] font-black uppercase tracking-widest rounded">
                          Upgrade
                        </span>
                      </div>
                      <div className="text-sm text-slate-400 font-semibold">
                        {formatPrice(plan.price_amount)}/{plan.billing_interval}
                      </div>
                      {plan.features.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.features.slice(0, 3).map((f, i) => (
                            <span
                              key={i}
                              className="text-[11px] text-slate-500 bg-white/[0.03] px-2 py-0.5 rounded font-medium"
                            >
                              {f}
                            </span>
                          ))}
                          {plan.features.length > 3 && (
                            <span className="text-[11px] text-slate-600 px-2 py-0.5 font-medium">
                              +{plan.features.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleChangePlan(plan)}
                      disabled={upgrading === plan.paddle_price_id}
                      className="ml-4 flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:scale-105"
                    >
                      {upgrading === plan.paddle_price_id ? 'Upgrading...' : 'Upgrade'}
                    </button>
                  </div>
                ))}
            </div>

            <p className="text-[11px] text-slate-600 mt-4 font-medium">
              Upgrades are prorated immediately.
            </p>
          </div>
        </div>
      )}

      <ConfirmModal
        modal={confirmModal}
        onClose={() => setConfirmModal(emptyModal)}
      />
    </div>
  )
}
