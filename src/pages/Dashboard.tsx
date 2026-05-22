/**
 * Dashboard — the Overview page at `/dashboard`.
 *
 * The Overview is intentionally narrow: Quick Actions (preserved), the
 * Tier 0 hero strip (Algorithm Weather, Breakouts, Jump On Today,
 * Lifecycle), four rich teaser strips that point at the drill-down pages
 * (Action, Forensics, Anatomy, Creators), and the Your Accounts card.
 *
 * The 5 drill-down pages — Pulse, Action, Forensics, Anatomy, Creators —
 * live at `/dashboard/{pulse,action,forensics,anatomy,creators}` and own
 * the dense widget grids. The Overview's job is to:
 *   1. Tell the user what happened today (Algorithm Weather + Breakouts)
 *   2. Tease the four deeper surfaces (top 3 outliers, post-mortem CTA,
 *      1 anatomy preview, top 3 rising stars)
 *   3. Stay above-the-fold-friendly — no dense charts here.
 *
 * Replaces the old single-scroll 5-tier dashboard which packed 35+
 * widgets into one route at col-3/col-4 spans.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useDashboardSection } from '../lib/useDashboardSection'
import { AccountsSkeleton } from '../components/DashboardSkeletons'
import WidgetErrorBoundary from '../components/insights/WidgetErrorBoundary'
import OverviewTeaserStrip from '../components/insights/OverviewTeaserStrip'
import TierLockedCard from '../components/TierLockedCard'
import OutlierFeed from '../components/insights/OutlierFeed'
import AlgorithmWeatherCard from '../components/insights/widgets/tier0/AlgorithmWeatherCard'
import BreakoutsStrip from '../components/insights/widgets/tier0/BreakoutsStrip'
import JumpOnTodayFeed from '../components/insights/widgets/tier0/JumpOnTodayFeed'
import LifecycleDistribution from '../components/insights/widgets/tier0/LifecycleDistribution'
import PostMortemEntry from '../components/insights/widgets/tier2/PostMortemEntry'
import CognitiveInterruptionHeatmap from '../components/insights/widgets/tier3/CognitiveInterruptionHeatmap'
import RisingStars from '../components/insights/widgets/tier4/RisingStars'

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
  const { user, isFreeTier } = useAuth()
  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  // Only the preserved "Your Accounts" widget still fetches here.
  const connectedAccounts = useDashboardSection<ConnectedAccounts>('connected-accounts')

  /**
   * Wrap with <TierLockedCard> only for Free-tier users; paid users get the
   * raw widget. Keeps the JSX below readable without a forest of ternaries.
   */
  const gate = (source: string, children: React.ReactNode) =>
    isFreeTier ? <TierLockedCard source={source}>{children}</TierLockedCard> : <>{children}</>;

  return (
    <>
      {/* Page Header */}
      <div className="mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-2 lg:mb-3">
          Welcome, <span className="gradient-text font-display">{displayName}</span>
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase">
          Your viral intelligence hub. Open a page to go deep.
        </p>
      </div>

      {/* ── Quick Actions Grid (preserved — static, no fetch) ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-12">
        {quickActions.map((a) =>
          gate(
            `dashboard:quick:${a.label}`,
            <Link
              key={a.to}
              to={a.to}
              className="glass-card-lift p-4 sm:p-6 group cursor-pointer overflow-hidden relative block"
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
            </Link>,
          ),
        )}
      </div>

      {/* ── Pulse section — Tier 0 hero widgets (no teaser strip, this IS
          the overview content for "what happened today") ── */}
      {gate(
        'dashboard:pulse',
      <OverviewTeaserStrip
        eyebrow="Pulse"
        title="What's happening right now"
        subtitle="Algorithm Weather, breakouts, and what's worth riding today."
        icon="fa-wave-square"
        iconBg="bg-pink-500/15"
        iconColor="text-pink-400"
        viewAllHref="/dashboard/pulse"
      >
        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          <div className="col-span-12">
            <WidgetErrorBoundary name="AlgorithmWeatherCard">
              <AlgorithmWeatherCard />
            </WidgetErrorBoundary>
          </div>
          <div className="col-span-12">
            <WidgetErrorBoundary name="BreakoutsStrip">
              <BreakoutsStrip />
            </WidgetErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <WidgetErrorBoundary name="JumpOnTodayFeed">
              <JumpOnTodayFeed />
            </WidgetErrorBoundary>
          </div>
          <div className="col-span-12 lg:col-span-6">
            <WidgetErrorBoundary name="LifecycleDistribution">
              <LifecycleDistribution />
            </WidgetErrorBoundary>
          </div>
        </div>
      </OverviewTeaserStrip>,
      )}

      {/* ── Action teaser — top 3 outliers (via OutlierFeed) + CTA ── */}
      {gate(
        'dashboard:action',
      <OverviewTeaserStrip
        eyebrow="Action"
        title="What should I make next"
        subtitle="Outliers worth reverse-engineering, whitespace keywords, and sounds to ride."
        icon="fa-rocket"
        iconBg="bg-orange-500/15"
        iconColor="text-orange-400"
        viewAllHref="/dashboard/action"
        viewAllLabel="See all action"
      >
        <WidgetErrorBoundary name="OutlierFeed">
          <OutlierFeed />
        </WidgetErrorBoundary>
      </OverviewTeaserStrip>,
      )}

      {/* ── Forensics teaser — Post-Mortem hero CTA with 3 sample tiles ── */}
      {gate(
        'dashboard:forensics',
      <OverviewTeaserStrip
        eyebrow="Forensics"
        title="Why did this work — and why didn't this?"
        subtitle="Run a tactic-level autopsy on any video. See what diverged from your hits."
        icon="fa-magnifying-glass-chart"
        iconBg="bg-purple-500/15"
        iconColor="text-purple-400"
        viewAllHref="/dashboard/forensics"
        viewAllLabel="See all forensics"
      >
        <WidgetErrorBoundary name="PostMortemEntry">
          <PostMortemEntry />
        </WidgetErrorBoundary>
      </OverviewTeaserStrip>,
      )}

      {/* ── Anatomy teaser — one Cognitive Interruption mini ── */}
      {gate(
        'dashboard:anatomy',
      <OverviewTeaserStrip
        eyebrow="Anatomy"
        title="Under the hood"
        subtitle="Cognitive triggers, hook patterns, retention danger zones, sound DNA."
        icon="fa-dna"
        iconBg="bg-cyan-500/15"
        iconColor="text-cyan-400"
        viewAllHref="/dashboard/anatomy"
        viewAllLabel="See all anatomy"
      >
        <WidgetErrorBoundary name="CognitiveInterruptionHeatmap">
          <CognitiveInterruptionHeatmap />
        </WidgetErrorBoundary>
      </OverviewTeaserStrip>,
      )}

      {/* ── Creators teaser — Rising Stars (the most emotional widget) ── */}
      {gate(
        'dashboard:creators',
      <OverviewTeaserStrip
        eyebrow="Creators"
        title="Who's winning in your niche"
        subtitle="Rising stars, niche leaders, DISC profiles, audience archetypes."
        icon="fa-medal"
        iconBg="bg-amber-500/15"
        iconColor="text-amber-400"
        viewAllHref="/dashboard/creators"
        viewAllLabel="See all creators"
      >
        <WidgetErrorBoundary name="RisingStars">
          <RisingStars />
        </WidgetErrorBoundary>
      </OverviewTeaserStrip>,
      )}

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
