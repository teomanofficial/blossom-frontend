import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'

interface OnboardingData {
  fullName: string
  socialProfiles: { instagram: string; tiktok: string }
  contentDescription: string
  categoryId: number | null
  selectedDomainIds: number[]
  linkedAccountId: number | null
  linkedPlatform: string | null
}

interface Category {
  id: number
  title: string
  description: string
  icon: string | null
  thumbnail_url: string | null
}

interface Domain {
  id: number
  name: string
  category: string | null
  video_count: number
}

const TOTAL_STEPS = 6

const defaultData: OnboardingData = {
  fullName: '',
  socialProfiles: { instagram: '', tiktok: '' },
  contentDescription: '',
  categoryId: null,
  selectedDomainIds: [],
  linkedAccountId: null,
  linkedPlatform: null,
}

// ============ PROGRESS BAR ============

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current - 1) / (total - 1)) * 100
  return (
    <div className="w-full mb-16 md:mb-20">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          Step {current} of {total}
        </span>
        <span className="text-xs font-semibold text-slate-500 tracking-wide">
          {Math.round(((current - 1) / total) * 100)}% complete
        </span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-500 to-orange-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ============ STEP 1: NAME ============

function StepName({
  value,
  onChange,
  onNext,
  saving,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  saving: boolean
}) {
  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          What's your name?
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-md">
          Let us know who you are so we can personalize your experience
        </p>
      </div>
      <div className="max-w-xl mb-10">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Full Name
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onNext()}
          placeholder="Enter your full name"
          className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-base md:text-lg text-white placeholder-slate-600 focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all"
          autoFocus
        />
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={onNext}
          disabled={!value.trim() || saving}
          className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-pink-500/20"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
        <span className="text-xs text-slate-600 hidden sm:inline">
          or press Enter
        </span>
      </div>
    </div>
  )
}

// ============ STEP 2: SOCIAL PROFILES ============

function StepSocialProfiles({
  value,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  value: { instagram: string; tiktok: string }
  onChange: (v: { instagram: string; tiktok: string }) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  const platforms = [
    {
      key: 'instagram' as const,
      label: 'Instagram',
      placeholder: '@yourusername',
      icon: 'IG',
      gradient: 'from-purple-500 via-pink-500 to-orange-400',
    },
    {
      key: 'tiktok' as const,
      label: 'TikTok',
      placeholder: '@yourusername',
      icon: 'TT',
      bg: 'bg-black border border-white/20',
    },
  ]

  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Your Social Profiles
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-md">
          Share your social media handles so we can find you (optional)
        </p>
      </div>
      <div className="max-w-xl space-y-6 mb-10">
        {platforms.map((p) => (
          <div key={p.key}>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              {p.label}
            </label>
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  p.gradient ? `bg-gradient-to-br ${p.gradient}` : p.bg
                }`}
              >
                <span className="text-white font-black text-xs">{p.icon}</span>
              </div>
              <input
                type="text"
                value={value[p.key]}
                onChange={(e) => onChange({ ...value, [p.key]: e.target.value })}
                placeholder={p.placeholder}
                className="flex-1 px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-base text-white placeholder-slate-600 focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={saving}
          className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ============ STEP 3: CONTENT DESCRIPTION ============

function StepContentDescription({
  value,
  onChange,
  onNext,
  onBack,
  saving,
}: {
  value: string
  onChange: (v: string) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Your Content
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg">
          Tell us about the kind of content you create on social media
        </p>
      </div>
      <div className="max-w-2xl mb-10">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Content Description
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I create short-form videos about cooking healthy meals, sharing recipes and kitchen tips..."
          rows={5}
          className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-base text-white placeholder-slate-600 focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all resize-none leading-relaxed"
        />
        <p className="text-xs text-slate-600 mt-2 font-medium">
          {value.length} characters (minimum 10)
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={value.trim().length < 10 || saving}
          className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ============ STEP 4: CATEGORY SELECTION ============

function StepCategory({
  selectedId,
  onSelect,
  onNext,
  onBack,
  saving,
}: {
  selectedId: number | null
  onSelect: (id: number) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/onboarding/categories')
      .then((r) => r.json())
      .then(setCategories)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Your Category
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-md">
          Select the category that best describes your content
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-slate-500 py-12 text-base">No categories available yet. Contact support.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`group p-6 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                selectedId === cat.id
                  ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20 shadow-lg shadow-pink-500/5'
                  : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]'
              }`}
            >
              {cat.icon && <div className="text-3xl mb-3">{cat.icon}</div>}
              <h3 className="text-base font-bold mb-1.5">{cat.title}</h3>
              {cat.description && (
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                  {cat.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedId || saving}
          className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ============ STEP 5: DOMAIN SELECTION ============

function StepDomains({
  categoryId,
  contentDescription,
  selectedIds,
  onToggle,
  onSetSelected,
  onNext,
  onBack,
  saving,
}: {
  categoryId: number | null
  contentDescription: string
  selectedIds: number[]
  onToggle: (id: number) => void
  onSetSelected: (ids: number[]) => void
  onNext: () => void
  onBack: () => void
  saving: boolean
}) {
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)

  useEffect(() => {
    if (!categoryId) return
    setLoading(true)
    let cancelled = false

    const load = async () => {
      try {
        const domainsRes = await authFetch(`/api/onboarding/categories/${categoryId}/domains`)
        const domainsData: Domain[] = await domainsRes.json()
        if (cancelled) return
        setDomains(domainsData)
        setLoading(false)

        if (selectedIds.length === 0 && contentDescription.trim().length >= 10) {
          setSuggesting(true)
          try {
            const suggestRes = await authFetch(`/api/onboarding/categories/${categoryId}/suggest-domains`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contentDescription }),
            })
            const { suggestedDomainIds } = await suggestRes.json()
            if (!cancelled && Array.isArray(suggestedDomainIds) && suggestedDomainIds.length > 0) {
              const validIds = new Set(domainsData.map((d) => d.id))
              const validSuggestions = suggestedDomainIds.filter((id: number) => validIds.has(id))
              if (validSuggestions.length > 0) {
                onSetSelected(validSuggestions)
              }
            }
          } catch {
            // Non-critical
          } finally {
            if (!cancelled) setSuggesting(false)
          }
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [categoryId])

  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Your Domains
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg">
          {suggesting
            ? 'Picking the best domains for you...'
            : 'We pre-selected domains based on your content. Feel free to adjust.'}
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <p className="text-slate-500 py-12 text-base">No domains available for this category.</p>
      ) : (
        <div className="mb-10">
          {suggesting && (
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400 font-medium">Analyzing your content...</span>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            {domains.map((d) => {
              const isSelected = selectedIds.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => onToggle(d.id)}
                  className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-pink-500/15 border-2 border-pink-500/40 text-pink-300 shadow-sm shadow-pink-500/10'
                      : 'bg-white/[0.04] border-2 border-transparent text-slate-400 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {d.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedIds.length === 0 || saving || suggesting}
          className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
        >
          {saving ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}

// ============ STEP 6: LINK ACCOUNT ============

function StepLinkAccount({
  userId,
  onLinked,
  onSkip,
  onBack,
}: {
  userId: string
  onLinked: (platform: string) => void
  onSkip: () => void
  onBack: () => void
}) {
  const [linking, setLinking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isMobile = () => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleLink = async (platform: 'instagram' | 'tiktok') => {
    setLinking(platform)
    setError(null)

    let popup: Window | null = null
    if (!isMobile()) {
      popup = window.open('about:blank', 'oauth_popup', 'width=600,height=700,scrollbars=yes')
      if (popup) {
        popup.document.write(
          '<html><body style="background:#0f1419;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><p style="color:#94a3b8">Connecting...</p></div></body></html>'
        )
      }
    }

    try {
      const mobile = isMobile()
      const res = await authFetch(`/api/social/${platform}/auth-url?user_id=${userId}${mobile ? '&mobile=1' : ''}`)
      const { url } = await res.json()

      if (mobile) {
        sessionStorage.setItem('onboarding_oauth_platform', platform)
        window.location.href = url
        return
      }

      if (popup && !popup.closed) {
        popup.location.href = url
      } else {
        sessionStorage.setItem('onboarding_oauth_platform', platform)
        window.location.href = url
        return
      }

      const interval = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(interval)
            const linkRes = await authFetch('/api/onboarding/link-account', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ platform }),
            })
            if (linkRes.ok) {
              onLinked(platform)
            } else {
              const data = await linkRes.json()
              setError(data.error || 'Failed to link account. Please try again.')
              setLinking(null)
            }
          }
        } catch {
          clearInterval(interval)
          setLinking(null)
        }
      }, 1000)
    } catch (err: any) {
      if (popup) popup.close()
      setError(err.message || 'Failed to start OAuth flow')
      setLinking(null)
    }
  }

  return (
    <div className="w-full">
      <div className="mb-10 md:mb-14">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
          Link Your Account
        </h2>
        <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg">
          Connect your social account so we can analyze your content and provide personalized insights
        </p>
      </div>

      {error && (
        <div className="px-5 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 mb-8 max-w-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mb-10">
        <button
          onClick={() => handleLink('instagram')}
          disabled={!!linking}
          className="group flex items-center gap-5 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">IG</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="text-base font-bold">Connect Instagram</h3>
            <p className="text-sm text-slate-500">Link your Business Account</p>
          </div>
          {linking === 'instagram' && (
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </button>

        <button
          onClick={() => handleLink('tiktok')}
          disabled={!!linking}
          className="group flex items-center gap-5 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all disabled:opacity-50"
        >
          <div className="w-14 h-14 rounded-xl bg-black border border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">TT</span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <h3 className="text-base font-bold">Connect TikTok</h3>
            <p className="text-sm text-slate-500">Link your Creator Account</p>
          </div>
          {linking === 'tiktok' && (
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Back
        </button>
        <button
          onClick={onSkip}
          disabled={!!linking}
          className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-500 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          Skip for now
        </button>
      </div>
    </div>
  )
}

// ============ ANALYZING STEP ============

function StepAnalyzing({ onContinue }: { onContinue: () => void }) {
  const [status, setStatus] = useState<{ status: string; progress: any; error: string | null }>({
    status: 'syncing',
    progress: {},
    error: null,
  })

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await authFetch('/api/onboarding/analysis-status')
        const data = await res.json()
        setStatus(data)
        if (data.status === 'completed' || data.status === 'error') {
          clearInterval(poll)
        }
      } catch {
        // keep polling
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [])

  const progress = status.progress || {}
  const totalVideos = progress.total_videos || 0
  const analyzed = progress.videos_analyzed || 0
  const isSyncing = status.status === 'syncing'
  const isError = status.status === 'error'
  const isComplete = status.status === 'completed'
  const pct = totalVideos > 0 ? Math.round((analyzed / totalVideos) * 100) : 0

  return (
    <div className="w-full">
      <div className="flex items-start gap-6 mb-10 md:mb-14">
        <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
          {isComplete ? (
            <svg className="w-8 h-8 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : isError ? (
            <svg className="w-8 h-8 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            {isComplete
              ? 'Analysis Complete!'
              : isError
                ? 'Analysis Error'
                : isSyncing
                  ? 'Fetching your videos...'
                  : 'Analyzing your content...'}
          </h2>
          <p className="text-slate-400 text-base md:text-lg font-medium max-w-lg">
            {isComplete
              ? `We analyzed ${analyzed} videos and found insights for your content strategy.`
              : isError
                ? status.error || 'Something went wrong. You can still continue to your dashboard.'
                : 'This may take a few minutes. You can continue to your dashboard anytime.'}
          </p>
        </div>
      </div>

      {!isSyncing && totalVideos > 0 && !isComplete && !isError && (
        <div className="max-w-md mb-10">
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-sm text-slate-500 mt-3 font-medium">
            {analyzed} / {totalVideos} videos analyzed
          </p>
        </div>
      )}

      {isSyncing && progress.videos_fetched > 0 && (
        <p className="text-sm text-slate-500 mb-8">{progress.videos_fetched} videos fetched</p>
      )}

      <button
        onClick={onContinue}
        className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-pink-500/20"
      >
        Continue to Dashboard
      </button>
      {!isComplete && !isError && (
        <p className="text-xs text-slate-600 mt-4">Analysis will continue in the background</p>
      )}
    </div>
  )
}

// ============ MAIN ONBOARDING COMPONENT ============

export default function Onboarding() {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAnalyzing, setShowAnalyzing] = useState(false)
  const [data, setData] = useState<OnboardingData>({ ...defaultData })

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    authFetch('/api/onboarding/status')
      .then((r) => r.json())
      .then((status) => {
        if (status.isCompleted) {
          navigate('/dashboard')
          return
        }
        if (status.data) {
          setData((prev) => ({
            ...prev,
            fullName: status.data.fullName || profile?.full_name || prev.fullName,
            socialProfiles: status.data.socialProfiles || prev.socialProfiles,
            contentDescription: status.data.contentDescription || prev.contentDescription,
            categoryId: status.data.categoryId || prev.categoryId,
            selectedDomainIds: status.data.selectedDomainIds || prev.selectedDomainIds,
            linkedAccountId: status.data.linkedAccountId || prev.linkedAccountId,
            linkedPlatform: status.data.linkedPlatform || prev.linkedPlatform,
          }))
        } else if (profile?.full_name) {
          setData((prev) => ({ ...prev, fullName: profile.full_name || '' }))
        }
        if (status.analysisStatus === 'syncing' || status.analysisStatus === 'analyzing') {
          setShowAnalyzing(true)
        }
        setStep(status.currentStep || 1)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user, navigate, profile])

  const saveStep = async (stepNum: number, stepData: Record<string, any>) => {
    setSaving(true)
    try {
      const res = await authFetch(`/api/onboarding/step/${stepNum}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stepData),
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Save step error:', err)
        return false
      }
      return true
    } catch (e) {
      console.error('Save step error:', e)
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleNext = async (stepNum: number, stepData: Record<string, any>) => {
    const success = await saveStep(stepNum, stepData)
    if (success) {
      setStep(stepNum + 1)
    }
  }

  const handleComplete = async () => {
    await authFetch('/api/onboarding/complete', { method: 'POST' })
    await refreshProfile()
    navigate('/dashboard')
  }

  const handleSkipLinking = async () => {
    await authFetch('/api/onboarding/skip-linking', { method: 'POST' })
    await refreshProfile()
    navigate('/dashboard')
  }

  const handleAccountLinked = (platform: string) => {
    setData((prev) => ({ ...prev, linkedPlatform: platform }))
    setShowAnalyzing(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden relative">
      {/* Background mesh */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.12) 0%, transparent 50%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Blossom" className="w-9 h-9" />
          <span className="text-xl font-bold tracking-tighter hidden sm:inline">Blossom</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-medium hidden sm:inline">
            Welcome, {displayName}
          </span>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-pink-400 font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content - full width, generous padding */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-16 xl:px-24 pt-6 sm:pt-10 pb-24 max-w-6xl mx-auto">
        {!showAnalyzing && <ProgressBar current={step} total={TOTAL_STEPS} />}

        {showAnalyzing ? (
          <StepAnalyzing onContinue={handleComplete} />
        ) : (
          <>
            {step === 1 && (
              <StepName
                value={data.fullName}
                onChange={(v) => setData((prev) => ({ ...prev, fullName: v }))}
                onNext={() => handleNext(1, { fullName: data.fullName })}
                saving={saving}
              />
            )}

            {step === 2 && (
              <StepSocialProfiles
                value={data.socialProfiles}
                onChange={(v) => setData((prev) => ({ ...prev, socialProfiles: v }))}
                onNext={() => handleNext(2, { socialProfiles: data.socialProfiles })}
                onBack={() => setStep(1)}
                saving={saving}
              />
            )}

            {step === 3 && (
              <StepContentDescription
                value={data.contentDescription}
                onChange={(v) => setData((prev) => ({ ...prev, contentDescription: v }))}
                onNext={() => handleNext(3, { contentDescription: data.contentDescription })}
                onBack={() => setStep(2)}
                saving={saving}
              />
            )}

            {step === 4 && (
              <StepCategory
                selectedId={data.categoryId}
                onSelect={(id) => setData((prev) => ({ ...prev, categoryId: id, selectedDomainIds: [] }))}
                onNext={() => handleNext(4, { categoryId: data.categoryId })}
                onBack={() => setStep(3)}
                saving={saving}
              />
            )}

            {step === 5 && (
              <StepDomains
                categoryId={data.categoryId}
                contentDescription={data.contentDescription}
                selectedIds={data.selectedDomainIds}
                onToggle={(id) =>
                  setData((prev) => ({
                    ...prev,
                    selectedDomainIds: prev.selectedDomainIds.includes(id)
                      ? prev.selectedDomainIds.filter((d) => d !== id)
                      : [...prev.selectedDomainIds, id],
                  }))
                }
                onSetSelected={(ids) =>
                  setData((prev) => ({ ...prev, selectedDomainIds: ids }))
                }
                onNext={() => handleNext(5, { domainIds: data.selectedDomainIds })}
                onBack={() => setStep(4)}
                saving={saving}
              />
            )}

            {step >= 6 && (
              <StepLinkAccount
                userId={user?.id || ''}
                onLinked={handleAccountLinked}
                onSkip={handleSkipLinking}
                onBack={() => setStep(5)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
