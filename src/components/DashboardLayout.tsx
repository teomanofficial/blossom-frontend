import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useImpersonation } from '../context/ImpersonationContext'
import { authFetch } from '../lib/api'
import SearchOverlay from './SearchOverlay'
import MobileDrawer from './MobileDrawer'

/* ── Top-level standalone nav items (outside any group) ── */
const topItems = [
  { to: '/dashboard', icon: 'fa-house', label: 'Dashboard', end: true },
  { to: '/dashboard/analyze', icon: 'fa-chart-simple', label: 'Virality Check' },
]

/* ── Nav item groups matching the sidebar screenshots ── */
const generalItems = [
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'Platforms' },
  { to: '/dashboard/trends', icon: 'fa-bolt', label: 'Trends' },
  { to: '/dashboard/influencers', icon: 'fa-users', label: 'Creators' },
]

const intelligenceItems = [
  { to: '/dashboard/suggestions', icon: 'fa-scroll', label: 'Scripts' },
  { to: '/dashboard/formats', icon: 'fa-shapes', label: 'Formats' },
  { to: '/dashboard/hooks', icon: 'fa-comment-dots', label: 'Hooks' },
  { to: '/dashboard/tactics', icon: 'fa-chess', label: 'Tactics' },
]

const bottomItems = [
  { to: '/dashboard/support', icon: 'fa-headset', label: 'Support' },
  { to: '/dashboard/account', icon: 'fa-gear', label: 'Settings' },
]

const managementItems = [
  { to: '/dashboard/users', icon: 'fa-users-gear', label: 'Users' },
  { to: '/dashboard/subscription-plans', icon: 'fa-credit-card', label: 'Plans' },
  { to: '/dashboard/content-analytics', icon: 'fa-chart-pie', label: 'Content' },
  { to: '/dashboard/domain-management', icon: 'fa-layer-group', label: 'Domains' },
  { to: '/dashboard/categories', icon: 'fa-folder-tree', label: 'Categories' },
  { to: '/dashboard/videos', icon: 'fa-satellite-dish', label: 'Scan & Analyze' },
  { to: '/dashboard/discovery', icon: 'fa-bolt', label: 'Discovery' },
  { to: '/dashboard/support-management', icon: 'fa-ticket', label: 'Support Tickets' },
  { to: '/dashboard/bulk-management', icon: 'fa-arrows-rotate', label: 'Training' },
  { to: '/dashboard/duplicate-management', icon: 'fa-code-merge', label: 'Duplicates' },
  { to: '/dashboard/onboarding-management', icon: 'fa-clipboard-check', label: 'Onboarding' },
  { to: '/dashboard/category-requests', icon: 'fa-inbox', label: 'Category Requests' },
  { to: '/dashboard/ai-model-lab', icon: 'fa-microchip', label: 'AI Model Lab' },
  { to: '/dashboard/hashtags', icon: 'fa-hashtag', label: 'Hashtags' },
  { to: '/dashboard/site-analytics', icon: 'fa-chart-line', label: 'Site Analytics' },
]

/* Bottom tab items for mobile */
const bottomTabs = [
  { to: '/dashboard', icon: 'fa-chart-pie', label: 'Home', end: true },
  { to: '/dashboard/analyze', icon: 'fa-microscope', label: 'Virality' },
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'Platforms' },
  { to: '/dashboard/suggestions', icon: 'fa-scroll', label: 'Scripts' },
  { to: '__more__', icon: 'fa-grid-2', label: 'More' },
]

/* Routes that live in the "More" drawer */
const drawerRoutes = [
  '/dashboard/platforms',
  '/dashboard/platforms/posts',
  '/dashboard/hooks',
  '/dashboard/tactics',
  '/dashboard/trends',
  '/dashboard/trends/posts',
  '/dashboard/trends/formats',
  '/dashboard/trends/hooks',
  '/dashboard/trends/contents',
  '/dashboard/trends/songs',
  '/dashboard/influencers',
  '/dashboard/support',
  '/dashboard/account',
  '/dashboard/users',
  '/dashboard/subscription-plans',
  '/dashboard/content-analytics',
  '/dashboard/domain-management',
  '/dashboard/categories',
  '/dashboard/videos',
  '/dashboard/discovery',
  '/dashboard/support-management',
  '/dashboard/bulk-management',
  '/dashboard/duplicate-management',
  '/dashboard/onboarding-management',
  '/dashboard/category-requests',
  '/dashboard/ai-model-lab',
  '/dashboard/hashtags',
  '/dashboard/site-analytics',
]

/* ── Nav Rail Link Component ── */
function RailLink({
  item,
  supportUnreadCount,
}: {
  item: { to: string; icon: string; label: string; end?: boolean }
  supportUnreadCount: number
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-2xl transition-all duration-200 overflow-hidden whitespace-nowrap ${
          isActive
            ? 'nav-link-active bg-white/[0.08] text-white'
            : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
        }`
      }
    >
      <div className="w-6 shrink-0 flex items-center justify-center">
        <i className={`fas ${item.icon} text-[15px]`} />
      </div>
      <span className="nav-label text-sm font-medium">{item.label}</span>
      {(item.to === '/dashboard/support' || item.to === '/dashboard/support-management') &&
        supportUnreadCount > 0 && (
          <span className="nav-label ml-auto px-2 py-0.5 bg-pink-500 text-white text-[10px] font-black rounded-full min-w-[20px] text-center">
            {supportUnreadCount}
          </span>
        )}
    </NavLink>
  )
}

export default function DashboardLayout() {
  const { user, signOut, userType, planSlug, vipCredits, proCredits } = useAuth()
  const { impersonating, stopImpersonation, isImpersonating } = useImpersonation()
  const location = useLocation()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  const [supportUnreadCount, setSupportUnreadCount] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await authFetch('/api/support/unread-count')
        const data = await res.json()
        setSupportUnreadCount(data.unreadCount || 0)
      } catch {
        // silent fail
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 45000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  const hasAnalysis = userType === 'admin' || planSlug === 'premium' || planSlug === 'platin'
  const showManagement = userType === 'admin' && !isImpersonating

  const visibleGeneralItems = generalItems.filter((item) => {
    if (item.to === '/dashboard/influencers') return hasAnalysis
    return true
  })

  const isDrawerRouteActive = drawerRoutes.some((r) => location.pathname.startsWith(r))

  return (
    <div className="h-screen overflow-hidden bg-[#050508]">
      {/* Mesh Gradient Background */}
      <div className="mesh-bg" />

      {/* ═══════════ Desktop Nav Rail (lg+) ═══════════ */}
      <aside className="nav-rail-sidebar hidden lg:flex fixed left-0 top-0 h-screen z-50 flex-col bg-[rgba(10,10,15,0.85)] backdrop-blur-2xl border-r border-white/[0.06]">
        {/* Logo */}
        <div className="flex items-center h-20 px-[18px] gap-3 shrink-0">
          <img src="/logo-light.png" alt="Blossom" className="w-9 h-9 shrink-0" />
          <span className="nav-label text-xl font-bold tracking-tighter">Blossom</span>
        </div>

        {/* Scrollable Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 dashboard-scrollbar">
          {/* Top-level standalone items */}
          <div className="space-y-0.5">
            {topItems.map((item) => (
              <RailLink key={item.to} item={item} supportUnreadCount={supportUnreadCount} />
            ))}
          </div>

          <div className="mx-4 my-3 border-t border-white/[0.06]" />

          {/* General Section */}
          <div className="px-5 pb-2">
            <span className="nav-section-label text-[10px] font-black text-slate-500 uppercase tracking-widest">
              General
            </span>
          </div>
          <div className="space-y-0.5">
            {visibleGeneralItems.map((item) => (
              <RailLink key={item.to} item={item} supportUnreadCount={supportUnreadCount} />
            ))}
          </div>

          {/* Intelligence Section */}
          <div className="px-5 pt-5 pb-2">
            <span className="nav-section-label text-[10px] font-black text-slate-500 uppercase tracking-widest">
              Intelligence
            </span>
          </div>
          <div className="space-y-0.5">
            {intelligenceItems.map((item) => (
              <RailLink key={item.to} item={item} supportUnreadCount={supportUnreadCount} />
            ))}
          </div>

          {/* Management Section (Admin) */}
          {showManagement && (
            <>
              <div className="px-5 pt-5 pb-2">
                <span className="nav-section-label text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  Management
                </span>
              </div>
              <div className="space-y-0.5">
                {managementItems.map((item) => (
                  <RailLink key={item.to} item={item} supportUnreadCount={supportUnreadCount} />
                ))}
              </div>
            </>
          )}
        </nav>

        {/* Bottom Section */}
        {isImpersonating && impersonating ? (
          <div className="shrink-0 border-t border-orange-500/30 bg-gradient-to-t from-orange-500/5 to-transparent py-3">
            <div className="mx-2 px-3 py-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <i className="fas fa-user-secret text-orange-400 text-[10px]" />
                </div>
                <span className="nav-label text-[10px] font-black uppercase tracking-widest text-orange-400">
                  Viewing as
                </span>
              </div>
              <div className="nav-label text-xs font-bold text-white truncate mb-0.5">
                {impersonating.displayName}
              </div>
              <div className="nav-label text-[10px] text-slate-400 truncate mb-3">
                {impersonating.email}
              </div>
              <button
                onClick={stopImpersonation}
                className="nav-label w-full px-3 py-2 rounded-xl bg-orange-500/20 text-orange-300 text-[10px] font-black uppercase tracking-widest
                           hover:bg-orange-500/30 transition-colors text-center"
              >
                <i className="fas fa-arrow-right-from-bracket mr-1.5" />
                Return to Admin
              </button>
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-t border-white/[0.06] py-3">
            <div className="space-y-0.5">
              {bottomItems.map((item) => (
                <RailLink key={item.to} item={item} supportUnreadCount={supportUnreadCount} />
              ))}
            </div>
            {/* User Profile */}
            <div className="mx-2 mt-2 flex items-center gap-3 px-3 py-2.5 rounded-2xl cursor-pointer hover:bg-white/[0.06] transition-colors overflow-hidden whitespace-nowrap group/profile">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="nav-label min-w-0">
                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                <button
                  onClick={signOut}
                  className="text-[9px] font-black text-slate-500 uppercase tracking-tighter hover:text-pink-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ═══════════ Main Content ═══════════ */}
      <main className="flex flex-col h-screen overflow-hidden lg:pl-[72px] relative z-10">
        {/* Desktop Top Header (lg+) */}
        <header className="hidden lg:flex h-16 items-center px-10 bg-transparent backdrop-blur-sm z-10 shrink-0">
          <SearchOverlay />
          <div className="flex-1" />
          {isImpersonating && impersonating ? (
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20">
              <i className="fas fa-user-secret text-orange-400 text-sm" />
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-300">
                Viewing as {impersonating.displayName}
              </div>
            </div>
          ) : (
            <>
              {userType === 'admin' && (
                <div className="relative group flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-pink-500/10 via-fuchsia-500/10 to-purple-500/10 border border-pink-400/20 cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-pink-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
                      <i className="fas fa-shield-halved text-[11px] text-white" />
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-pink-300">Admin</div>
                  </div>
                </div>
              )}
              {userType === 'vip' && (
                <div className="relative group flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-400/10 to-amber-500/10 border border-amber-400/20 cursor-default overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                  <div className="relative flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                      <i className="fas fa-crown text-[11px] text-amber-900" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-amber-300">VIP Access</div>
                      {vipCredits && (
                        <div className="text-[10px] font-bold text-amber-400/60">
                          {vipCredits.credits_total - vipCredits.credits_used} credits remaining
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {planSlug === 'pro' && proCredits && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-400/20">
                  <i className="fas fa-bolt text-[10px] text-blue-400" />
                  <div className="text-[10px] font-bold text-blue-300">
                    {proCredits.limit - proCredits.used}/{proCredits.limit} analyses left
                  </div>
                </div>
              )}
            </>
          )}
        </header>

        {/* Mobile Top Header (<lg) */}
        <header className="flex lg:hidden h-14 border-b border-white/5 items-center justify-between px-4 bg-[#050508]/80 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo-light.png" alt="Blossom" className="w-7 h-7" />
            <span className="text-base font-bold tracking-tighter">Blossom</span>
          </div>
          <div className="flex items-center gap-2">
            {isImpersonating ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-400/20">
                <i className="fas fa-user-secret text-[10px] text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-300">Viewing</span>
              </div>
            ) : (
              <>
                {userType === 'admin' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-400/20">
                    <i className="fas fa-shield-halved text-[10px] text-pink-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-300">Admin</span>
                  </div>
                )}
                {userType === 'vip' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-400/10 border border-amber-400/20">
                    <i className="fas fa-crown text-[10px] text-amber-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">VIP</span>
                  </div>
                )}
              </>
            )}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center"
            >
              <i className={`fas ${mobileSearchOpen ? 'fa-xmark' : 'fa-search'} text-sm text-slate-400`} />
            </button>
            <NavLink
              to="/dashboard/account"
              className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xs font-bold"
            >
              {displayName.charAt(0).toUpperCase()}
            </NavLink>
          </div>
        </header>

        {/* Mobile Search Dropdown */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 py-3 bg-[#050508]/95 backdrop-blur-xl border-b border-white/5 z-20">
            <SearchOverlay />
          </div>
        )}

        {/* Page Content */}
        <div className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 ${isImpersonating ? 'pb-36' : 'pb-24'} lg:pb-10 dashboard-scrollbar`}>
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ═══════════ Mobile Impersonation Banner (<lg) ═══════════ */}
      {isImpersonating && impersonating && (
        <div className="fixed bottom-16 left-0 right-0 lg:hidden z-[45] bg-[#050508]/95 backdrop-blur-xl border-t border-orange-500/20">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 shrink-0 rounded-full bg-orange-500/20 flex items-center justify-center">
                <i className="fas fa-user-secret text-orange-400 text-[11px]" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-orange-400">Viewing as</div>
                <div className="text-[11px] font-bold text-white truncate">{impersonating.displayName}</div>
              </div>
            </div>
            <button
              onClick={stopImpersonation}
              aria-label="Return to Admin"
              className="shrink-0 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 text-[10px] font-black uppercase tracking-widest hover:bg-orange-500/30"
            >
              Return
            </button>
          </div>
        </div>
      )}

      {/* ═══════════ Mobile Bottom Tab Bar (<lg) ═══════════ */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-[#050508]/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
        <div className="flex items-stretch justify-around h-16 px-2">
          {bottomTabs.map((tab) => {
            if (tab.to === '__more__') {
              return (
                <button
                  key="more"
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                    drawerOpen || isDrawerRouteActive ? 'text-pink-400' : 'text-slate-500'
                  }`}
                >
                  <i className={`fas ${drawerOpen ? 'fa-xmark' : tab.icon} text-base`} />
                  <span className="text-[10px] font-bold">{drawerOpen ? 'Close' : tab.label}</span>
                </button>
              )
            }
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 flex-1 transition-colors ${
                    isActive ? 'text-pink-400' : 'text-slate-500'
                  }`
                }
              >
                <i className={`fas ${tab.icon} text-base`} />
                <span className="text-[10px] font-bold">{tab.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>

      {/* ═══════════ Mobile "More" Drawer ═══════════ */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        supportUnreadCount={supportUnreadCount}
        hasAnalysis={hasAnalysis}
        showManagement={showManagement}
      />
    </div>
  )
}
