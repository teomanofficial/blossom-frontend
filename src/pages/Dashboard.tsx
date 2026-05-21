import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDashboardSection } from '../lib/useDashboardSection'
import { AccountsSkeleton } from '../components/DashboardSkeletons'
import Tier0Hero from '../components/insights/Tier0Hero'
import Tier1Actions from '../components/insights/Tier1Actions'
import ForensicsOnboardingBanner from '../components/insights/ForensicsOnboardingBanner'

// Tier 2+ sit below the fold — split out so the initial chunk only
// carries Tier 0 / Tier 1. Stage 3 FE1 will likely promote each tier
// to a heavier bundle once real widgets ship.
const Tier2Forensics = lazy(() => import('../components/insights/Tier2Forensics'))
const Tier3Anatomy = lazy(() => import('../components/insights/Tier3Anatomy'))
const Tier4Creators = lazy(() => import('../components/insights/Tier4Creators'))

/* ── Types (preserved widget only) ── */
interface ConnectedAccounts {
  total: number
  active: number
  total_followers: number
}

/* ── Helpers (preserved widget only) ── */
function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

/* ── Quick Action Card Data (preserved) ── */
const quickActions = [
  {
    to: '/dashboard/analyze',
    icon: 'fa-bolt',
    label: 'Analyze Content',
    desc: 'Check viral potential instantly',
    glow: 'bg-purple-500/10',
    glowHover: 'group-hover:bg-purple-500/20',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
  },
  {
    to: '/dashboard/suggestions',
    icon: 'fa-scroll',
    label: 'Scripts',
    desc: 'AI-driven content scripts',
    glow: 'bg-pink-500/10',
    glowHover: 'group-hover:bg-pink-500/20',
    iconBg: 'bg-pink-500/20',
    iconColor: 'text-pink-400',
  },
  {
    to: '/dashboard/formats',
    icon: 'fa-fire',
    label: 'Formats',
    desc: 'Browse high-retention frameworks',
    glow: 'bg-orange-500/10',
    glowHover: 'group-hover:bg-orange-500/20',
    iconBg: 'bg-orange-500/20',
    iconColor: 'text-orange-400',
  },
  {
    to: '/dashboard/influencers',
    icon: 'fa-user-group',
    label: 'Study Creators',
    desc: 'Deconstruct the top 1%',
    glow: 'bg-blue-500/10',
    glowHover: 'group-hover:bg-blue-500/20',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
]

/* ── Tier-section lazy-load fallback ── */
function TierLoadingFallback() {
  return (
    <section className="mb-8 lg:mb-12">
      <div className="glass-card rounded-3xl p-8 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-3" />
        <div className="h-6 w-64 bg-white/5 rounded" />
      </div>
    </section>
  )
}

/* ── Section Error (preserved for Your Accounts) ── */
function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center gap-3 py-8 px-4 text-slate-600">
      <i className="fas fa-exclamation-triangle text-lg text-red-400/60" />
      <span className="text-sm font-bold">Failed to load</span>
      <button
        onClick={onRetry}
        className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:text-pink-300 transition-colors ml-2"
      >
        Retry
      </button>
    </div>
  )
}

/* ── Main Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth()
  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  // Only the preserved "Your Accounts" widget still fetches.
  const connectedAccounts = useDashboardSection<ConnectedAccounts>('connected-accounts')

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 lg:mb-3">
          Welcome, <span className="gradient-text font-display">{displayName}</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase">
          Your viral intelligence hub. Five tiers, one question at a time.
        </p>
      </div>

      {/* ── Quick Actions Grid (preserved — static, no fetch) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-12">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="glass-card-lift p-4 sm:p-6 group cursor-pointer overflow-hidden relative"
          >
            <div
              className={`absolute -right-4 -top-4 w-24 h-24 ${a.glow} rounded-full blur-2xl ${a.glowHover} transition-colors`}
            />
            <div className="relative">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 ${a.iconBg} rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${a.iconColor}`}
              >
                <i className={`fas ${a.icon} text-base sm:text-lg`} />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold mb-0.5 sm:mb-1">{a.label}</h3>
              <p className="text-slate-400 text-[10px] sm:text-xs hidden sm:block">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Tier 0 — Hero (above the fold) ── */}
      <Tier0Hero />

      {/* ── Tier 1 — Action (above the fold) ── */}
      <Tier1Actions />

      {/* ── First-run onboarding (renders null when count >= 3) ── */}
      <ForensicsOnboardingBanner />

      {/* ── Tier 2 — Forensics (lazy) ── */}
      <Suspense fallback={<TierLoadingFallback />}>
        <Tier2Forensics />
      </Suspense>

      {/* ── Tier 3 — Anatomy (lazy) ── */}
      <Suspense fallback={<TierLoadingFallback />}>
        <Tier3Anatomy />
      </Suspense>

      {/* ── Tier 4 — Creators (lazy) ── */}
      <Suspense fallback={<TierLoadingFallback />}>
        <Tier4Creators />
      </Suspense>

      {/* ── Your Accounts (preserved) ── */}
      <div className="glass-card rounded-3xl p-5 sm:p-7 mb-8 lg:mb-12">
        {connectedAccounts.loading ? (
          <AccountsSkeleton />
        ) : connectedAccounts.error ? (
          <SectionError onRetry={connectedAccounts.retry} />
        ) : connectedAccounts.data ? (
          <>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-pink-500/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-chart-line text-pink-400 text-xs" />
              </div>
              <h2 className="text-sm sm:text-base font-bold">Your Accounts</h2>
            </div>
            {connectedAccounts.data.active > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="bg-white/[0.04] rounded-2xl p-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Connected
                    </div>
                    <div className="text-2xl font-black">{connectedAccounts.data.active}</div>
                  </div>
                  <div className="bg-white/[0.04] rounded-2xl p-4">
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">
                      Followers
                    </div>
                    <div className="text-2xl font-black">
                      {fmt(connectedAccounts.data.total_followers)}
                    </div>
                  </div>
                </div>
                <Link
                  to="/dashboard/platforms"
                  className="block text-center text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors py-2"
                >
                  View platforms <i className="fas fa-arrow-right ml-1" />
                </Link>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-link text-pink-400" />
                </div>
                <p className="text-sm font-bold mb-1">Connect Your Accounts</p>
                <p className="text-xs text-slate-500 mb-4">
                  Link Instagram or TikTok to track your growth
                </p>
                <Link
                  to="/dashboard/platforms"
                  className="inline-flex items-center gap-2 text-xs font-black text-pink-400 hover:text-pink-300 transition-colors"
                >
                  Connect Now <i className="fas fa-arrow-right" />
                </Link>
              </div>
            )}
          </>
        ) : null}
      </div>
    </>
  )
}
