import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import SearchOverlay from './SearchOverlay'
import MobileDrawer from './MobileDrawer'

const navItems = [
  { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard', end: true },
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'Platforms' },
  { to: '/dashboard/analyze', icon: 'fa-microscope', label: 'Content Analysis' },
  { to: '/dashboard/formats', icon: 'fa-shapes', label: 'Viral Formats' },
  { to: '/dashboard/hooks', icon: 'fa-magnet', label: 'Viral Hooks' },
  { to: '/dashboard/tactics', icon: 'fa-chess', label: 'Viral Tactics' },
  { to: '/dashboard/trends', icon: 'fa-arrow-trend-up', label: 'Trends' },
  { to: '/dashboard/influencers', icon: 'fa-users', label: 'Influencers' },
  { to: '/dashboard/suggestions', icon: 'fa-lightbulb', label: 'Suggestions' },
  { to: '/dashboard/support', icon: 'fa-headset', label: 'Support' },
  { to: '/dashboard/account', icon: 'fa-gear', label: 'Account' },
]

const managementItems = [
  { to: '/dashboard/users', icon: 'fa-users-gear', label: 'Users' },
  { to: '/dashboard/subscription-plans', icon: 'fa-credit-card', label: 'Subscription Plans' },
  { to: '/dashboard/content-management', icon: 'fa-layer-group', label: 'Content Management' },
  { to: '/dashboard/categories', icon: 'fa-folder-tree', label: 'Categories' },
  { to: '/dashboard/videos', icon: 'fa-satellite-dish', label: 'Scan & Analyze' },
  { to: '/dashboard/discovery', icon: 'fa-bolt', label: 'Discovery' },
  { to: '/dashboard/support-management', icon: 'fa-ticket', label: 'Support Tickets' },
  { to: '/dashboard/bulk-management', icon: 'fa-arrows-rotate', label: 'Bulk Retrain' },
  { to: '/dashboard/onboarding-management', icon: 'fa-clipboard-check', label: 'Onboarding' },
  { to: '/dashboard/ai-model-lab', icon: 'fa-microchip', label: 'AI Model Lab' },
  { to: '/dashboard/hashtags', icon: 'fa-hashtag', label: 'Hashtags' },
]

/* Bottom tab items for mobile — the 4 most-used features + More */
const bottomTabs = [
  { to: '/dashboard', icon: 'fa-chart-pie', label: 'Home', end: true },
  { to: '/dashboard/analyze', icon: 'fa-microscope', label: 'Analyze' },
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'Platforms' },
  { to: '/dashboard/suggestions', icon: 'fa-lightbulb', label: 'Ideas' },
  { to: '__more__', icon: 'fa-grid-2', label: 'More' },
]

/* Routes that live in the "More" drawer — used to highlight the More tab */
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
  '/dashboard/content-management',
  '/dashboard/categories',
  '/dashboard/videos',
  '/dashboard/discovery',
  '/dashboard/support-management',
  '/dashboard/bulk-management',
  '/dashboard/onboarding-management',
  '/dashboard/ai-model-lab',
  '/dashboard/hashtags',
]

export default function DashboardLayout() {
  const { user, signOut, userType, planSlug } = useAuth()
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

  // Close drawer & search on navigation
  useEffect(() => {
    setDrawerOpen(false)
    setMobileSearchOpen(false)
  }, [location.pathname])

  const hasAnalysis = userType === 'admin' || planSlug === 'premium' || planSlug === 'platin'
  const showManagement = userType === 'admin'

  const visibleNavItems = navItems.filter((item) => {
    if (item.to === '/dashboard/influencers') return hasAnalysis
    return true
  })

  const isDrawerRouteActive = drawerRoutes.some((r) => location.pathname.startsWith(r))

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {/* ═══════════ Desktop Sidebar (lg+) ═══════════ */}
      <aside className="hidden lg:flex w-64 flex-shrink-0 border-r border-white/5 flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <img src="/logo-light.png" alt="Blossom AI" className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tighter">Blossom AI</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/20 via-orange-400/20 to-yellow-400/20 text-white shadow-[inset_0_0_10px_rgba(244,114,182,0.15)] font-bold border border-pink-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <i className={`fas ${item.icon} w-5`}></i>
              {item.label}
              {item.to === '/dashboard/support' && supportUnreadCount > 0 && (
                <span className="ml-auto px-2 py-0.5 bg-pink-500 text-white text-[10px] font-black rounded-full min-w-[20px] text-center">
                  {supportUnreadCount}
                </span>
              )}
            </NavLink>
          ))}

          {showManagement && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Management
              </div>
              {managementItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-pink-500/20 via-orange-400/20 to-yellow-400/20 text-white shadow-[inset_0_0_10px_rgba(244,114,182,0.15)] font-bold border border-pink-500/20'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                    }`
                  }
                >
                  <i className={`fas ${item.icon} w-5`}></i>
                  {item.label}
                  {item.to === '/dashboard/support-management' && supportUnreadCount > 0 && (
                    <span className="ml-auto px-2 py-0.5 bg-pink-500 text-white text-[10px] font-black rounded-full min-w-[20px] text-center">
                      {supportUnreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="px-6 py-4 border-t border-white/5">
          <p className="text-[10px] text-slate-600 font-medium tracking-wide">blossom v1.0.0</p>
        </div>
      </aside>

      {/* ═══════════ Main Content ═══════════ */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* ── Desktop Top Header (lg+) ── */}
        <header className="hidden lg:flex h-20 border-b border-white/5 items-center justify-between px-10 bg-slate-950/20 backdrop-blur-xl z-10">
          <SearchOverlay />
          <div className="flex items-center gap-4 ml-6">
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
              <div className="text-right">
                <div className="text-[11px] font-black text-white">{displayName}</div>
                <button
                  onClick={signOut}
                  className="text-[9px] font-black text-slate-500 uppercase tracking-tighter hover:text-pink-400 transition-colors"
                >
                  Sign Out
                </button>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* ── Mobile Top Header (<lg) ── */}
        <header className="flex lg:hidden h-14 border-b border-white/5 items-center justify-between px-4 bg-slate-950/80 backdrop-blur-xl z-30 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/logo-light.png" alt="Blossom AI" className="w-7 h-7" />
            <span className="text-base font-bold tracking-tighter">Blossom AI</span>
          </div>
          <div className="flex items-center gap-2">
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

        {/* ── Mobile Search Dropdown ── */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 py-3 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 z-20">
            <SearchOverlay />
          </div>
        )}

        {/* ── Page Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 pb-24 lg:pb-10 dashboard-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>

      {/* ═══════════ Mobile Bottom Tab Bar (<lg) ═══════════ */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden z-40 bg-[#020617]/95 backdrop-blur-xl border-t border-white/10 safe-bottom">
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
