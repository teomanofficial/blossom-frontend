import { NavLink, Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import SearchOverlay from './SearchOverlay'

const navItems = [
  { to: '/dashboard', icon: 'fa-chart-pie', label: 'Dashboard', end: true },
  { to: '/dashboard/analyze', icon: 'fa-microscope', label: 'Content Analysis' },
  { to: '/dashboard/formats', icon: 'fa-shapes', label: 'Viral Formats' },
  { to: '/dashboard/hooks', icon: 'fa-magnet', label: 'Viral Hooks' },
  { to: '/dashboard/tactics', icon: 'fa-chess', label: 'Viral Tactics' },
  { to: '/dashboard/trending', icon: 'fa-arrow-trend-up', label: 'Trending Posts' },
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
]

export default function DashboardLayout() {
  const { user, signOut, userType, planSlug } = useAuth()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  const [supportUnreadCount, setSupportUnreadCount] = useState(0)

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

  const hasAnalysis = userType === 'admin' || planSlug === 'premium' || planSlug === 'platin'
  const showManagement = userType === 'admin'

  const visibleNavItems = navItems.filter((item) => {
    if (item.to === '/dashboard/influencers') {
      return hasAnalysis
    }
    return true
  })

  return (
    <div className="flex h-screen overflow-hidden bg-[#020617]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/20">
              <i className="fas fa-seedling text-white text-sm"></i>
            </div>
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
                    ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] font-bold'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

          {/* Management Section - admin only */}
          {showManagement && (
            <div className="pt-4 mt-4 border-t border-white/5">
              <div className="px-4 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">
                Management
              </div>
              {managementItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-white shadow-[inset_0_0_10px_rgba(255,255,255,0.05)] font-bold'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
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

      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-slate-950/20 backdrop-blur-xl z-10">
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

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-10 dashboard-scrollbar">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}
