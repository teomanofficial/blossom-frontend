import { Link } from 'react-router-dom'

interface UpgradePremiumBannerProps {
  itemLabel: string // e.g. "hooks", "formats", "tactics"
  accentColor?: string // e.g. "pink", "amber"
}

export default function UpgradePremiumBanner({ itemLabel, accentColor = 'pink' }: UpgradePremiumBannerProps) {
  const colors: Record<string, { gradient: string; text: string; border: string; button: string }> = {
    pink: {
      gradient: 'from-pink-500/20 via-purple-500/10 to-transparent',
      text: 'text-pink-400',
      border: 'border-pink-500/20',
      button: 'bg-pink-500 hover:bg-pink-400',
    },
    amber: {
      gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      button: 'bg-amber-500 hover:bg-amber-400',
    },
  }
  const c = colors[accentColor] ?? { gradient: 'from-pink-500/20 via-purple-500/10 to-transparent', text: 'text-pink-400', border: 'border-pink-500/20', button: 'bg-pink-500 hover:bg-pink-400' }

  return (
    <div className={`relative col-span-full rounded-3xl border ${c.border} bg-gradient-to-br ${c.gradient} p-8 md:p-12 text-center overflow-hidden`}>
      {/* Blur overlay effect */}
      <div className="absolute inset-0 backdrop-blur-[1px] bg-slate-950/40 rounded-3xl" />

      <div className="relative z-10">
        <div className="w-14 h-14 mx-auto mb-5 bg-white/5 rounded-2xl flex items-center justify-center">
          <i className={`fas fa-crown ${c.text} text-xl`}></i>
        </div>

        <h3 className="text-xl md:text-2xl font-black tracking-tight mb-2">
          Get Full Access to All {itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)}
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-6 max-w-md mx-auto">
          Upgrade to Premium to unlock all {itemLabel} across every category, fine-tuning, and advanced analytics.
        </p>

        <Link
          to="/dashboard/account/billing"
          className={`inline-flex items-center gap-2 ${c.button} text-white font-black text-sm px-8 py-3 rounded-2xl transition-all active:scale-[0.97] shadow-lg`}
        >
          <i className="fas fa-crown text-xs"></i>
          Upgrade to Premium
        </Link>

        <p className="text-[10px] text-slate-500 font-bold mt-4 uppercase tracking-widest">
          All categories, fine-tuning & advanced analytics
        </p>
      </div>
    </div>
  )
}
