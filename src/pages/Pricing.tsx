/**
 * Pricing — public marketing page at `/pricing`.
 *
 * Layout:
 *   1. Hero: H1 + subhead + monthly/annual toggle ("Save 20%" pill on annual).
 *   2. 4-up tier card grid (Free / Creator / Pro / Agency). Pro is scaled up
 *      and gets the gradient "Most Popular" badge.
 *   3. "See all features" anchor scroll → full PricingComparisonTable.
 *   4. FAQ-style 4-question section answering the most common pricing Qs.
 *   5. Final CTA + Footer.
 *
 * CTA behavior:
 *   - Free → /signup
 *   - Logged-out + paid → /signup?plan=<slug>
 *   - Logged-in + paid → call /api/billing/checkout with Paddle priceId and
 *     open the Paddle overlay (matches AccountBilling / UpgradeOverlay flow).
 *
 * The Paddle price IDs come from `/api/billing/plans`. If a slug or interval
 * is missing from the backend response we fall through to a toast and leave
 * the user on the page — the marketing surface should never silently fail.
 */

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import PricingComparisonTable, {
  Check,
  Cross,
  Metric,
  type ComparisonSection,
  type PricingTier,
  type TierSlug,
} from '../components/PricingComparisonTable'
import { useAuth } from '../context/AuthContext'
import { apiFetch, authFetch } from '../lib/api'
import { trackEvent, trackPricingView } from '../lib/analytics'
import { Seo, SITE_URL, breadcrumbSchema } from '../lib/seo'

// ──────────────────────────────────────────────────────────────────────────
// Static tier configuration
// ──────────────────────────────────────────────────────────────────────────

type BillingInterval = 'month' | 'year'

interface TierDisplay {
  slug: TierSlug
  name: string
  tagline: string
  monthlyPrice: number
  /** Equivalent monthly price when paying annually (20% off). */
  annualPricePerMonth: number
  /** Top 5 feature bullets shown on the card. */
  features: string[]
  /** When true, render with the gradient ring + scale-up. */
  popular?: boolean
}

const TIERS: TierDisplay[] = [
  {
    slug: 'free',
    name: 'Free',
    tagline: "Try Blossom — see what's going viral",
    monthlyPrice: 0,
    annualPricePerMonth: 0,
    features: [
      '5 video analyses / month',
      'Top 10 hooks, formats, tactics',
      'Virality score',
      '1 category',
      '1 platform',
    ],
  },
  {
    slug: 'pro', // 'pro' slug = display name "Creator"
    name: 'Creator',
    tagline: 'Essential tools for solo creators',
    monthlyPrice: 39,
    annualPricePerMonth: 31,
    features: [
      '50 analyses / month',
      'AI Suggestions',
      'Audio analysis',
      'MCP server (Claude integration)',
      '2 categories',
    ],
  },
  {
    slug: 'premium', // 'premium' slug = display name "Pro"
    name: 'Pro',
    tagline: 'Decode virality with full AI power',
    monthlyPrice: 99,
    annualPricePerMonth: 79,
    features: [
      '250 analyses / month',
      'Public REST API (30 req/min)',
      'Analysis versioning',
      '5 categories',
      'Full trends history',
    ],
    popular: true,
  },
  {
    slug: 'platin',
    name: 'Agency',
    tagline: 'Built for agencies and brand teams',
    monthlyPrice: 299,
    annualPricePerMonth: 239,
    features: [
      '1,500 analyses / month',
      '5 team seats',
      '200 req/min API',
      'Unlimited categories',
      'Slack support',
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────
// Comparison table content — kept in this file so a single edit updates
// both the cards and the matrix.
// ──────────────────────────────────────────────────────────────────────────

const COMPARISON_SECTIONS: ComparisonSection[] = [
  {
    title: 'Usage',
    rows: [
      {
        feature: 'Monthly analyses',
        values: {
          free: <Metric>5</Metric>,
          pro: <Metric>50</Metric>,
          premium: <Metric>250</Metric>,
          platin: <Metric>1,500</Metric>,
        },
      },
      {
        feature: 'Hourly analysis limit',
        values: {
          free: <span className="text-slate-500">—</span>,
          pro: <Metric>10</Metric>,
          premium: <Metric>50</Metric>,
          platin: <Metric>100</Metric>,
        },
      },
      {
        feature: 'Platforms',
        helper: 'Instagram + TikTok',
        values: {
          free: <span className="text-slate-400">One only</span>,
          pro: <Metric>Both</Metric>,
          premium: <Metric>Both</Metric>,
          platin: <Metric>Both</Metric>,
        },
      },
      {
        feature: 'Categories tracked',
        values: {
          free: <Metric>1</Metric>,
          pro: <Metric>2</Metric>,
          premium: <Metric>5</Metric>,
          platin: <Metric>Unlimited</Metric>,
        },
      },
    ],
  },
  {
    title: 'Insights',
    rows: [
      {
        feature: 'Top hooks / formats / tactics',
        values: {
          free: <span className="text-slate-400">Top 10</span>,
          pro: <Metric>All</Metric>,
          premium: <Metric>All</Metric>,
          platin: <Metric>All</Metric>,
        },
      },
      {
        feature: 'Virality score',
        values: { free: Check, pro: Check, premium: Check, platin: Check },
      },
      {
        feature: 'Trends dashboard',
        values: {
          free: <span className="text-slate-400">Last 7 days</span>,
          pro: <span className="text-slate-300">Last 30 days</span>,
          premium: <Metric>Full history</Metric>,
          platin: <Metric>Full history</Metric>,
        },
      },
    ],
  },
  {
    title: 'AI Features',
    rows: [
      {
        feature: 'AI Suggestions engine',
        values: { free: Cross, pro: Check, premium: Check, platin: Check },
      },
      {
        feature: 'Audio analysis',
        values: { free: Cross, pro: Check, premium: Check, platin: Check },
      },
      {
        feature: 'Custom fine-tuning',
        helper: 'Train Blossom on your own classes',
        values: {
          free: Cross,
          pro: <span className="text-slate-300">3 classes</span>,
          premium: <Metric>15 classes</Metric>,
          platin: <Metric>Unlimited</Metric>,
        },
      },
      {
        feature: 'Analysis versioning',
        helper: 'Track improvements across iterations',
        values: { free: Cross, pro: Cross, premium: Check, platin: Check },
      },
    ],
  },
  {
    title: 'API & Integrations',
    rows: [
      {
        feature: 'Public REST API',
        values: {
          free: Cross,
          pro: Cross,
          premium: <Metric>30 req/min</Metric>,
          platin: <Metric>200 req/min</Metric>,
        },
      },
      {
        feature: 'MCP server (Claude)',
        helper: 'Use Blossom inside Claude Desktop',
        values: { free: Cross, pro: Check, premium: Check, platin: Check },
      },
    ],
  },
  {
    title: 'Team',
    rows: [
      {
        feature: 'Seats included',
        values: {
          free: <Metric>1</Metric>,
          pro: <Metric>1</Metric>,
          premium: <Metric>1</Metric>,
          platin: <Metric>5</Metric>,
        },
      },
      {
        feature: 'Priority support',
        values: {
          free: <span className="text-slate-400">Email</span>,
          pro: <span className="text-slate-300">Email</span>,
          premium: <Metric>Chat</Metric>,
          platin: <Metric>Slack</Metric>,
        },
      },
    ],
  },
]

// ──────────────────────────────────────────────────────────────────────────
// Card primitive — kept inline so it can read the toggle state directly
// without prop-drilling and so spacing matches the marketing aesthetic.
// ──────────────────────────────────────────────────────────────────────────

interface TierCardProps {
  tier: TierDisplay
  interval: BillingInterval
  onCta: (slug: TierSlug) => void
  loading: boolean
}

function TierCard({ tier, interval, onCta, loading }: TierCardProps) {
  const isFree = tier.slug === 'free'
  const displayPrice =
    interval === 'year' ? tier.annualPricePerMonth : tier.monthlyPrice

  return (
    <div
      className={`relative glass-card rounded-[2rem] p-6 sm:p-7 flex flex-col transition-all hover:scale-[1.02] ${
        tier.popular
          ? 'border-pink-500/30 ring-1 ring-pink-500/30 lg:scale-105 shadow-[0_0_60px_-15px_rgba(244,114,182,0.4)]'
          : ''
      }`}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-orange-400 rounded-full text-[9px] font-black uppercase tracking-widest text-white whitespace-nowrap">
          Most Popular
        </div>
      )}

      <div className="mb-5">
        <h3 className="text-2xl font-black mb-1">{tier.name}</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed min-h-[2.25rem]">
          {tier.tagline}
        </p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black">${displayPrice}</span>
          {!isFree && <span className="text-sm text-slate-500 font-semibold">/mo</span>}
        </div>
        {!isFree && interval === 'year' && (
          <div className="text-[11px] font-bold text-emerald-400 mt-1.5">
            Billed annually · ${tier.annualPricePerMonth * 12}/yr
          </div>
        )}
        {!isFree && interval === 'month' && (
          <div className="text-[11px] font-medium text-slate-600 mt-1.5">
            Save 20% with annual billing
          </div>
        )}
        {isFree && (
          <div className="text-[11px] font-bold text-emerald-400 mt-1.5">
            Free forever, no card required
          </div>
        )}
      </div>

      <ul className="space-y-3 mb-7 flex-1">
        {tier.features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm">
            <svg
              className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
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

      <button
        type="button"
        onClick={() => onCta(tier.slug)}
        disabled={loading}
        className={`w-full py-3.5 rounded-2xl text-sm font-black transition-all disabled:opacity-50 ${
          tier.popular
            ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white glow-button hover:scale-105'
            : 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
        }`}
      >
        {loading
          ? 'Opening checkout...'
          : isFree
            ? 'Get Started Free'
            : tier.popular
              ? 'Start Free Trial'
              : 'Choose Plan'}
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────
// FAQ data
// ──────────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Can I cancel anytime?',
    a: "Yes — every paid plan is month-to-month (or year-to-year) and you can cancel from your account billing page in one click. Cancellation takes effect at the end of your current billing period, so you keep access to everything you paid for. There are no cancellation fees and no clawback of analyses you've already run.",
  },
  {
    q: "What's the MCP server?",
    a: "MCP (Model Context Protocol) lets Claude Desktop and other AI assistants query your Blossom data directly. Install the connector once and you can ask Claude things like \"what hooks are trending in my category this week?\" or \"draft a script based on my top three viral analyses\" — all powered by your live Blossom data, no copy-paste required.",
  },
  {
    q: 'Can I upgrade or downgrade later?',
    a: 'Anytime. Upgrades pro-rate immediately so you only pay the difference for the rest of the billing period and unlock the new tier on the spot. Downgrades take effect at the next renewal, so you keep the higher-tier features until then. Your analyses, history, and fine-tuned classes are preserved across tier changes.',
  },
  {
    q: 'Do you offer refunds?',
    a: "If something is genuinely broken or didn't work as advertised, email us within 14 days of purchase and we'll refund you, no questions asked. For change-of-mind cancellations outside that window we don't issue refunds — but you keep access for the rest of the period you've already paid for.",
  },
]

const PRICING_FAQ_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ITEMS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
}

// ──────────────────────────────────────────────────────────────────────────

interface BillingPlan {
  slug: string
  paddle_price_id: string | null
  billing_interval: string
}

export default function Pricing() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [interval, setInterval] = useState<BillingInterval>('month')
  const [plans, setPlans] = useState<BillingPlan[]>([])
  const [paddle, setPaddle] = useState<Paddle>()
  const [checkingOut, setCheckingOut] = useState<TierSlug | null>(null)

  // Lazy-init Paddle (only needed once a paid CTA fires).
  useEffect(() => {
    initializePaddle({
      environment:
        import.meta.env.VITE_PADDLE_ENVIRONMENT === 'production'
          ? 'production'
          : 'sandbox',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string,
    })
      .then((instance) => {
        if (instance) setPaddle(instance)
      })
      .catch(() => {
        // Paddle failing to load is non-fatal — CTAs will fall back to
        // routing to /signup with the plan query param.
      })
  }, [])

  // Pull live Paddle price IDs so CTAs can open checkout for logged-in
  // users. We render the static prices either way (so the page works even
  // when this fetch fails or hasn't returned yet).
  useEffect(() => {
    apiFetch('/api/billing/plans')
      .then((r) => r.json())
      .then((data) => {
        setPlans(data.plans || [])
        // Fire one pricing_view event per visible plan for analytics
        // continuity with /choose-plan and the upgrade overlay.
        for (const plan of data.plans || []) {
          trackPricingView('view', plan.slug, plan.name, plan.price_amount, plan.billing_interval)
        }
      })
      .catch(() => {
        // Silently ignore — non-logged-in users will be routed to /signup
        // anyway. Logged-in users will see a toast when they try to check out.
      })
  }, [])

  // Look up the right Paddle priceId for (slug × interval).
  // Backend may key by 'month' / 'year' or 'monthly' / 'yearly' — match
  // whichever prefix is present so we're tolerant to either convention.
  const priceIdFor = useMemo(
    () => (slug: TierSlug): string | null => {
      const match = plans.find((p) => {
        if (p.slug !== slug) return false
        const bi = (p.billing_interval || '').toLowerCase()
        return interval === 'year' ? bi.startsWith('year') : bi.startsWith('month')
      })
      return match?.paddle_price_id ?? null
    },
    [plans, interval]
  )

  const handleCta = async (slug: TierSlug) => {
    trackEvent('pricing_cta_click', 'conversion', { slug, interval, loggedIn: !!user })
    trackPricingView('click_cta', slug, slug, 0, interval)

    // Free tier → straight to signup.
    if (slug === 'free') {
      navigate('/signup')
      return
    }

    // Logged-out paid tier → carry the intended plan through signup so
    // the post-signup flow can land them on the right checkout.
    if (!user) {
      navigate(`/signup?plan=${slug}&interval=${interval}`)
      return
    }

    // Logged-in paid tier → open Paddle checkout for the matching priceId.
    const priceId = priceIdFor(slug)
    if (!priceId) {
      toast.error('This plan is not available right now. Please try again in a moment.')
      return
    }

    setCheckingOut(slug)
    try {
      const res = await authFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to start checkout')
        return
      }
      paddle?.Checkout.open({
        ...data.checkoutConfig,
        customer: data.checkoutConfig.customer?.id
          ? { id: data.checkoutConfig.customer.id }
          : undefined,
      })
    } catch (err) {
      console.error('Pricing page checkout error:', err)
      toast.error('Failed to open checkout. Please try again.')
    } finally {
      setCheckingOut(null)
    }
  }

  // Tier slugs/prices for the comparison table header, computed from the
  // toggle so the bottom of the page always agrees with the cards above.
  const tableTiers: PricingTier[] = TIERS.map((t) => {
    if (t.slug === 'free') {
      return { slug: t.slug, name: t.name, price: '$0', priceSuffix: ' free' }
    }
    const price =
      interval === 'year'
        ? `$${t.annualPricePerMonth}`
        : `$${t.monthlyPrice}`
    return { slug: t.slug, name: t.name, price, priceSuffix: '/mo' }
  })

  return (
    <div className="min-h-screen bg-[#050508] overflow-x-hidden relative">
      <Seo
        title="Pricing — Blossom"
        description="Simple, transparent pricing. Decode viral Instagram and TikTok content with AI — from a free tier for casual research up to agency-scale plans."
        canonical={`${SITE_URL}/pricing`}
        jsonLd={[
          breadcrumbSchema([
            { name: 'Home', url: SITE_URL },
            { name: 'Pricing', url: `${SITE_URL}/pricing` },
          ]),
          PRICING_FAQ_JSONLD,
        ]}
      />

      {/* Soft mesh background — matches /choose-plan + Landing. */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        aria-hidden="true"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
        }}
      />

      <Navbar />

      <main className="relative z-10 pt-32 sm:pt-40 pb-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* ── Hero ────────────────────────────────────────────────── */}
          <div className="text-center mb-12 sm:mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-6 tracking-widest uppercase">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
              </svg>
              Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black font-display tracking-tight mb-4">
              Choose your <span className="gradient-text">plan</span>
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
              Decode viral content with AI. Start free, upgrade when you're ready —
              cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="mt-10 inline-flex items-center gap-2 p-1.5 rounded-full bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setInterval('month')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                  interval === 'month'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={interval === 'month'}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval('year')}
                className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  interval === 'year'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-pressed={interval === 'year'}
              >
                Annual
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                    interval === 'year'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* ── Tier cards (4 columns desktop / 2 tablet / 1 mobile) ─ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 max-w-7xl mx-auto items-stretch">
            {TIERS.map((tier) => (
              <TierCard
                key={tier.slug}
                tier={tier}
                interval={interval}
                onCta={handleCta}
                loading={checkingOut === tier.slug}
              />
            ))}
          </div>

          {/* Anchor: jump to comparison table */}
          <div className="text-center mt-14">
            <a
              href="#compare"
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors group"
            >
              See all features
              <svg
                className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </a>
          </div>

          {/* ── Full comparison table ───────────────────────────────── */}
          <section id="compare" className="mt-24 scroll-mt-24">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight mb-3">
                Compare <span className="gradient-text">every feature</span>
              </h2>
              <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium">
                Everything Blossom does, side by side. Pick the tier that fits your
                workflow.
              </p>
            </div>

            <PricingComparisonTable
              tiers={tableTiers}
              sections={COMPARISON_SECTIONS}
              onCtaClick={handleCta}
              loadingSlug={checkingOut}
            />
          </section>

          {/* ── FAQ ─────────────────────────────────────────────────── */}
          <section className="mt-24 max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight mb-3">
                Common <span className="gradient-text">questions</span>
              </h2>
            </div>
            <div className="space-y-4">
              {FAQ_ITEMS.map((item, i) => (
                <details
                  key={i}
                  className="glass-card rounded-2xl p-6 group [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex items-start justify-between gap-4 cursor-pointer list-none">
                    <span className="text-base sm:text-lg font-black text-white">
                      {item.q}
                    </span>
                    <svg
                      className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0 transition-transform group-open:rotate-180"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed mt-4">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* ── Final CTA ───────────────────────────────────────────── */}
          <section className="mt-24 text-center">
            <div className="glass-card rounded-3xl p-10 sm:p-14 max-w-3xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-black font-display tracking-tight mb-3">
                Start decoding <span className="gradient-text">virality</span> today
              </h2>
              <p className="text-slate-400 text-sm sm:text-base mb-8 font-medium">
                Free forever for casual research. Upgrade when you outgrow it.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  to="/signup"
                  className="bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black py-3.5 px-8 rounded-2xl glow-button text-sm tracking-tight"
                >
                  Get Started Free
                </Link>
                <a
                  href="#compare"
                  className="bg-white/10 hover:bg-white/15 border border-white/10 text-white font-black py-3.5 px-8 rounded-2xl text-sm tracking-tight transition-colors"
                >
                  Compare Plans
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
