import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRef, useState, useCallback, useEffect } from 'react'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  supportUnreadCount: number
  hasAnalysis: boolean
  showManagement: boolean
}

/* ── Navigation groups with semantic organization ── */
const generalItems = [
  { to: '/dashboard/platforms', icon: 'fa-tower-broadcast', label: 'Platforms', color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { to: '/dashboard/trends', icon: 'fa-arrow-trend-up', label: 'Trends', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
]

const creatorsItem = { to: '/dashboard/influencers', icon: 'fa-users', label: 'Creators', color: 'text-cyan-400', bg: 'bg-cyan-500/10' }

const intelligenceItems = [
  { to: '/dashboard/analyze', icon: 'fa-chart-simple', label: 'Analysis', color: 'text-orange-400', bg: 'bg-orange-500/10' },
  { to: '/dashboard/suggestions', icon: 'fa-lightbulb', label: 'Suggestions', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  { to: '/dashboard/formats', icon: 'fa-shapes', label: 'Formats', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { to: '/dashboard/hooks', icon: 'fa-magnet', label: 'Hooks', color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { to: '/dashboard/tactics', icon: 'fa-chess', label: 'Tactics', color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

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
  { to: '/dashboard/ai-model-lab', icon: 'fa-microchip', label: 'AI Model Lab', color: 'text-violet-400', bg: 'bg-violet-500/10' },
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

const CLOSE_THRESHOLD = 120

export default function MobileDrawer({ open, onClose, supportUnreadCount, hasAnalysis, showManagement }: MobileDrawerProps) {
  const { user, signOut } = useAuth()
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'
  const email = user?.email ?? ''

  const [closing, setClosing] = useState(false)
  const [dragY, setDragY] = useState(0)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setClosing(false)
      setDragY(0)
    }
  }, [open])

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(onClose, 280)
  }, [onClose])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag from the handle area or when scroll is at top
    const scrollEl = scrollRef.current
    const isScrolledToTop = !scrollEl || scrollEl.scrollTop <= 0
    const touch = e.touches[0]
    if (!touch) return
    const touchY = touch.clientY
    const panelTop = panelRef.current?.getBoundingClientRect().top ?? 0
    const isNearTop = touchY - panelTop < 60

    if (isNearTop || isScrolledToTop) {
      dragStartY.current = touch.clientY
      isDragging.current = true
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return
    const touch = e.touches[0]
    if (!touch) return
    const currentY = touch.clientY
    const diff = currentY - dragStartY.current
    // Only allow dragging downward
    if (diff > 0) {
      setDragY(diff)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    if (dragY > CLOSE_THRESHOLD) {
      handleClose()
    } else {
      setDragY(0)
    }
  }, [dragY, handleClose])

  if (!open) return null

  const dragProgress = Math.min(dragY / CLOSE_THRESHOLD, 1)
  const backdropOpacity = 1 - dragProgress * 0.6

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}
        style={dragY > 0 ? { opacity: backdropOpacity } : undefined}
        onClick={handleClose}
      />

      {/* Fullscreen Drawer Panel */}
      <div
        ref={panelRef}
        className={`fixed inset-0 z-[70] lg:hidden ${closing ? 'animate-slide-down' : 'animate-slide-up'}`}
        style={dragY > 0 && !closing ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-full bg-[#070d1a] flex flex-col">
          {/* Header with drag handle + close button */}
          <div className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),12px)] pb-2 shrink-0">
            {/* Drag Handle centered */}
            <div className="flex-1" />
            <div className="w-9 h-[3px] bg-white/15 rounded-full" />
            <div className="flex-1 flex justify-end">
              <button
                onClick={handleClose}
                className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center active:bg-white/10 transition-colors"
              >
                <i className="fas fa-xmark text-base text-slate-300" />
              </button>
            </div>
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
                onClick={handleClose}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0"
              >
                <i className="fas fa-pen text-[10px] text-slate-400" />
              </NavLink>
            </div>
          </div>

          {/* Scrollable Nav Items */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-[max(env(safe-area-inset-bottom),24px)] drawer-scrollbar">
            {/* General Section */}
            <SectionHeader label="General" />
            <div className="space-y-0.5">
              {generalItems.map((item) => (
                <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={handleClose} />
              ))}
              {hasAnalysis && (
                <NavItem item={creatorsItem} supportUnreadCount={supportUnreadCount} onClose={handleClose} />
              )}
            </div>

            {/* Intelligence Section */}
            <SectionHeader label="Intelligence" />
            <div className="space-y-0.5">
              {intelligenceItems.map((item) => (
                <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={handleClose} />
              ))}
            </div>

            {/* Account Section */}
            <SectionHeader label="Account" />
            <div className="space-y-0.5">
              {accountItems.map((item) => (
                <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={handleClose} />
              ))}
            </div>

            {/* Management Section (Admin Only) */}
            {showManagement && (
              <>
                <SectionHeader label="Management" />
                <div className="space-y-0.5">
                  {managementItems.map((item) => (
                    <NavItem key={item.to} item={item} supportUnreadCount={supportUnreadCount} onClose={handleClose} />
                  ))}
                </div>
              </>
            )}

            {/* Sign Out */}
            <div className="mt-5 pt-4 border-t border-white/5">
              <button
                onClick={() => { handleClose(); signOut() }}
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
