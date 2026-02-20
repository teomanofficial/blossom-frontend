import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const accountNavItems = [
  { to: '/dashboard/account', label: 'Profile', icon: 'fa-user', end: true },
  { to: '/dashboard/account/integrations', label: 'Integrations', icon: 'fa-plug', end: false },
  { to: '/dashboard/account/billing', label: 'Billing & Plans', icon: 'fa-credit-card', end: false },
]

export default function AccountLayout() {
  const { user, profile } = useAuth()
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  return (
    <>
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 text-[10px] font-black uppercase tracking-widest rounded">
            Account
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2">
          {displayName}
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Manage your account settings and preferences.
        </p>
      </div>

      {/* GitHub-style layout: sidebar + content */}
      <div className="flex gap-8">
        {/* Sidebar nav */}
        <nav className="w-56 flex-shrink-0">
          <div className="space-y-0.5">
            {accountNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-white/10 text-white border border-white/[0.08]'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <i className={`fas ${item.icon} w-4 text-xs`}></i>
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <Outlet />
        </div>
      </div>
    </>
  )
}
