import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authFetch, apiFetch } from '../lib/api'
import { initializePaddle, Paddle } from '@paddle/paddle-js'

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

export default function ChoosePlan() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [paddleInstance, setPaddleInstance] = useState<Paddle>()
  const [checkoutSuccess, setCheckoutSuccess] = useState(false)

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  // Redirect to dashboard if user already has an active subscription
  useEffect(() => {
    if (!user) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') return // don't redirect during checkout flow
    authFetch('/api/billing/subscription')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'active' || data.status === 'trialing' || data.status === 'past_due') {
          navigate('/dashboard', { replace: true })
        }
      })
      .catch(() => {})
  }, [user, navigate])

  // Check URL params for checkout success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('checkout') === 'success') {
      setCheckoutSuccess(true)
      window.history.replaceState({}, '', '/choose-plan')
      // Poll for subscription to become active, then redirect
      const poll = setInterval(async () => {
        try {
          const res = await authFetch('/api/billing/subscription')
          const data = await res.json()
          if (data.status === 'active' || data.status === 'trialing') {
            clearInterval(poll)
            navigate('/onboarding')
          }
        } catch {}
      }, 2000)
      // Redirect after 10s anyway
      setTimeout(() => {
        clearInterval(poll)
        navigate('/onboarding')
      }, 10000)
      return () => clearInterval(poll)
    }
  }, [navigate])

  // Initialize Paddle
  useEffect(() => {
    initializePaddle({
      environment:
        import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production'
          ? 'production'
          : 'sandbox',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string,
    }).then((instance) => {
      if (instance) setPaddleInstance(instance)
    })
  }, [])

  // Fetch plans
  useEffect(() => {
    apiFetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => setPlans(data.plans || []))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  const handleSubscribe = async (plan: Plan) => {
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
        setSubscribing(null)
        return
      }

      paddleInstance?.Checkout.open({
        ...data.checkoutConfig,
        customer: data.checkoutConfig.customer?.id
          ? { id: data.checkoutConfig.customer.id }
          : undefined,
      })
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setSubscribing(null)
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(0)}`

  if (checkoutSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-black mb-2">Subscription Activated!</h2>
          <p className="text-slate-400 font-medium mb-6">
            Setting up your dashboard...
          </p>
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden relative">
      {/* Background mesh */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Blossom" className="w-9 h-9" />
          <span className="text-xl font-bold tracking-tighter">Blossom</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-medium">
            Welcome, {displayName}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-pink-400 font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-12 pb-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-6 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
            </svg>
            ALMOST THERE
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-4">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Pick the plan that fits your goals. You can upgrade or change anytime.
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-card rounded-[2.5rem] p-8 sm:p-10 relative transition-all hover:scale-[1.02] ${
                plan.slug === 'premium'
                  ? 'border-pink-500/30 ring-1 ring-pink-500/20 scale-105'
                  : ''
              }`}
            >
              {plan.slug === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full text-[9px] font-black uppercase tracking-widest text-white">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {plan.description}
                </p>
              </div>

              <div className="mb-8">
                <span className="text-5xl font-black">
                  {formatPrice(plan.price_amount)}
                </span>
                <span className="text-sm text-slate-500 font-semibold">
                  /{plan.billing_interval}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <svg className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={subscribing === plan.paddle_price_id}
                  className={`w-full py-4 rounded-2xl text-sm font-black transition-all disabled:opacity-50 ${
                    plan.slug === 'premium'
                      ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white glow-button hover:scale-105'
                      : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
                  }`}
                >
                  {subscribing === plan.paddle_price_id
                    ? 'Opening checkout...'
                    : 'Start Free Trial'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
