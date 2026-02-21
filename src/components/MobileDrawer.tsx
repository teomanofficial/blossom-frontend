import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  supportUnreadCount: number
  hasAnalysis: boolean
  showManagement: boolean
}

/* ── Navigation groups with semantic organization ── */
const exploreItems = [
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'My Platforms', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { to: '/dashboard/hooks', icon: 'fa-magnet', label: 'Viral Hooks', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { to: '/dashboard/tactics', icon: 'fa-chess', label: 'Viral Tactics', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { to: '/dashboard/trends', icon: 'fa-arrow-trend-up', label: 'Trends', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const influencerItem = { to: '/dashboard/influencers', icon: 'fa-users', label: 'Influencers', color: 'text-cyan-400', bg: 'bg-cyan-500/10' }

const accountItems = [
  { to: '/dashboard/support', icon: 'fa-headset', label: 'Support', color: 'text-blue-400', bg: 'bg-blue-500/10', hasBadge: true },
  { to: '/dashboard/account', icon: 'fa-gear', label: 'Account Settings', color: 'text-slate-300', bg: 'bg-white/5' },
]

const managementItems = [
  { to: '/dashboard/users', icon: 'fa-users-gear', label: 'Users', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/subscription-plans', icon: 'fa-credit-card', label: 'Plans', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/content-management', icon: 'fa-layer-group', label: 'Content', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/categories', icon: 'fa-folder-tree', label: 'Categories', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/videos', icon: 'fa-satellite-dish', label: 'Scan & Analyze', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/discovery', icon: 'fa-bolt', label: 'Discovery', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/support-management', icon: 'fa-ticket', label: 'Support Tickets', color: 'text-slate-300', bg: 'bg-white/5', hasBadge: true },
  { to: '/dashboard/bulk-management', icon: 'fa-arrows-rotate', label: 'Bulk Retrain', color: 'text-slate-300', bg: 'bg-white/5' },
  { to: '/dashboard/onboarding-management', icon: 'fa-clipboard-check', label: 'Onboarding', color: 'text-slate-300', bg: 'bg-white/5' },
]

function NavItem({
  item,
  supportUnreadCount,
  onClose,
}: {
  item: { to: string; icon: string; label: string; color: string; bg: string; hasBadge?: boolean; end?: boolean }
  supportUnreadCount: number
  onClose: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClose}
      className={({ isActive }) =>
        `flex items-center gap-3.5 px-3 py-3 rounded-2xl transition-all duration-150 ${
          isActive
            ? 'bg-gradient-to-r from-pink-500/15 via-orange-400/10 to-transparent'
            : 'active:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`w-10 h-10 rounded-xl ${isActive ? 'bg-pink-500/20' : item.bg} flex items-center justify-center shrink-0 transition-colors`}>
            <i className={`fas ${item.icon} text-sm ${isActive ? 'text-pink-400' : item.color}`} />
          </div>
          <span className={`text-[13px] font-semibold flex-1 ${isActive ? 'text-white font-bold' : 'text-slate-200'}`}>
            {item.label}
          </span>
          {item.hasBadge && supportUnreadCount > 0 && (
            <span className="px-2 py-0.5 bg-pink-500 text-white text-[10px] font-black rounded-full min-w-[20px] text-center">
              {supportUnreadCount}
            </span>
          )}
          {isActive && (
            <div className="w-1.5 h-1.5 rounded-full bg-pink-400 shrink-0" />
          )}
        </>
      )}
    </NavLink>
  )
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 pt-5 pb-2 first:pt-0">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{label}</span>
    </div>
  )
}

export default function MobileDrawer({ open, onClose, supportUnreadCount, hasAnalysis, showManagement }: MobileDrawerProps) {
  const { user, signOut } = useAuth()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'
  const email = user?.email ?? ''

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed bottom-16 left-0 right-0 z-50 lg:hidden animate-slide-up">
        <div className="bg-[#070d1a] backdrop-blur-2xl border-t border-white/[0.12] rounded-t-[28px] max-h-[75vh] flex flex-col">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-9 h-[3px] bg-white/15 rounded-full" />
          </div>

          {/* User Profile Card */}
          <div className="px-5 py-3 shrink-0">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-sm font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">{displayName}</div>
                <div className="text-[11px] text-slate-400 font-medium truncate">{email}</div>
              </div>
              <NavLink
                to="/dashboard/account"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"
              >
                <i className="fas fa-pen text-[10px] text-slate-400" />
              </NavLink>
            </div>
          </div>

          {/* Scrollable Nav Items */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 drawer-scrollbar">
            {/* Explore Section */}
            <SectionHeader label="Explore" />
            <div className="space-y-0.5">
              {exploreItems.map((item) => (
                <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={onClose} />
              ))}
              {hasAnalysis && (
                <NavItem item={influencerItem} supportUnreadCount={supportUnreadCount} onClose={onClose} />
              )}
            </div>

            {/* Account Section */}
            <SectionHeader label="Account" />
            <div className="space-y-0.5">
              {accountItems.map((item) => (
                <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={onClose} />
              ))}
            </div>

            {/* Management Section (Admin Only) */}
            {showManagement && (
              <>
                <SectionHeader label="Management" />
                <div className="space-y-0.5">
                  {managementItems.map((item) => (
                    <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={onClose} />
                  ))}
                </div>
              </>
            )}

            {/* Sign Out */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <button
                onClick={() => { onClose(); signOut() }}
                className="flex items-center gap-3.5 px-3 py-3 rounded-2xl w-full active:bg-red-500/10 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <i className="fas fa-arrow-right-from-bracket text-sm text-red-400" />
                </div>
                <span className="text-[13px] font-semibold text-red-400">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
