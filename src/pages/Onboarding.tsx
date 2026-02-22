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

// ============ STEP INDICATOR ============

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-10">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1
        const isActive = step === current
        const isCompleted = step < current
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white scale-110'
                  : isCompleted
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-white/5 text-slate-600 border border-white/10'
              }`}
            >
              {isCompleted ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step
              )}
            </div>
            {step < total && (
              <div className={`w-8 h-0.5 ${isCompleted ? 'bg-teal-500/30' : 'bg-white/10'}`} />
            )}
          </div>
        )
      })}
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">What's your name?</h2>
        <p className="text-slate-400 text-sm font-medium">Let us know who you are</p>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && value.trim() && onNext()}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors"
          autoFocus
        />
      </div>
      <button
        onClick={onNext}
        disabled={!value.trim() || saving}
        className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        {saving ? 'Saving...' : 'Continue'}
      </button>
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
    { key: 'instagram' as const, label: 'Instagram', placeholder: '@yourusername', icon: 'IG' },
    { key: 'tiktok' as const, label: 'TikTok', placeholder: '@yourusername', icon: 'TT' },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Your Social Profiles</h2>
        <p className="text-slate-400 text-sm font-medium">Share your social media handles (optional)</p>
      </div>
      <div className="space-y-4">
        {platforms.map((p) => (
          <div key={p.key}>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{p.label}</label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 flex-shrink-0">
                {p.icon}
              </div>
              <input
                type="text"
                value={value[p.key]}
                onChange={(e) => onChange({ ...value, [p.key]: e.target.value })}
                placeholder={p.placeholder}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={saving}
          className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Your Content</h2>
        <p className="text-slate-400 text-sm font-medium">
          Describe the kind of content you create on social media
        </p>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content Description</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="I create short-form videos about cooking healthy meals, sharing recipes and kitchen tips..."
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors resize-none"
        />
        <p className="text-[10px] text-slate-600 mt-1">{value.length} characters (minimum 10)</p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={value.trim().length < 10 || saving}
          className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Your Category</h2>
        <p className="text-slate-400 text-sm font-medium">Select the category that best describes your content</p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : categories.length === 0 ? (
        <p className="text-center text-slate-500 py-8 text-sm">No categories available yet. Contact support.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1 dashboard-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                selectedId === cat.id
                  ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              {cat.icon && <div className="text-2xl mb-2">{cat.icon}</div>}
              <h3 className="text-sm font-black mb-1">{cat.title}</h3>
              {cat.description && (
                <p className="text-[10px] text-slate-500 line-clamp-2">{cat.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedId || saving}
          className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
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
        // Fetch domains
        const domainsRes = await authFetch(`/api/onboarding/categories/${categoryId}/domains`)
        const domainsData: Domain[] = await domainsRes.json()
        if (cancelled) return
        setDomains(domainsData)
        setLoading(false)

        // Only auto-suggest if user hasn't already selected domains for this category
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
              // Only pre-select domains that are in the loaded list
              const validIds = new Set(domainsData.map((d) => d.id))
              const validSuggestions = suggestedDomainIds.filter((id: number) => validIds.has(id))
              if (validSuggestions.length > 0) {
                onSetSelected(validSuggestions)
              }
            }
          } catch {
            // Non-critical, just skip suggestions
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Your Domains</h2>
        <p className="text-slate-400 text-sm font-medium">
          {suggesting
            ? 'Picking the best domains for you...'
            : 'We pre-selected domains based on your content. Feel free to adjust.'}
        </p>
      </div>
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : domains.length === 0 ? (
        <p className="text-center text-slate-500 py-8 text-sm">No domains available for this category.</p>
      ) : (
        <>
          {suggesting && (
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-400 font-medium">Analyzing your content...</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 max-h-72 overflow-y-auto pr-1 dashboard-scrollbar">
            {domains.map((d) => {
              const isSelected = selectedIds.includes(d.id)
              return (
                <button
                  key={d.id}
                  onClick={() => onToggle(d.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                      : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {d.name}
                </button>
              )
            })}
          </div>
        </>
      )}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={selectedIds.length === 0 || saving || suggesting}
          className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]"
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

    // On desktop, open blank popup immediately to preserve user gesture context
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
        // Mobile: store platform in sessionStorage so we can resume onboarding after redirect back
        sessionStorage.setItem('onboarding_oauth_platform', platform)
        window.location.href = url
        return
      }

      if (popup && !popup.closed) {
        popup.location.href = url
      } else {
        // Popup blocked — fall back to redirect
        sessionStorage.setItem('onboarding_oauth_platform', platform)
        window.location.href = url
        return
      }

      const interval = setInterval(async () => {
        try {
          if (!popup || popup.closed) {
            clearInterval(interval)
            // Check if an account was linked
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-black tracking-tight mb-2">Link Your Account</h2>
        <p className="text-slate-400 text-sm font-medium">
          Connect your social account so we can analyze your content and provide personalized insights
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => handleLink('instagram')}
          disabled={!!linking}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">IG</span>
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-black">Connect Instagram</h3>
            <p className="text-[10px] text-slate-500">Link your Instagram Business Account</p>
          </div>
          {linking === 'instagram' && (
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          )}
        </button>

        <button
          onClick={() => handleLink('tiktok')}
          disabled={!!linking}
          className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <div className="w-12 h-12 rounded-xl bg-black border border-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-black text-sm">TT</span>
          </div>
          <div className="text-left flex-1">
            <h3 className="text-sm font-black">Connect TikTok</h3>
            <p className="text-[10px] text-slate-500">Link your TikTok Creator Account</p>
          </div>
          {linking === 'tiktok' && (
            <div className="w-5 h-5 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
          )}
        </button>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all"
        >
          Back
        </button>
        <button
          onClick={onSkip}
          disabled={!!linking}
          className="flex-1 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-slate-500 hover:text-white hover:bg-white/10 transition-all"
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
    <div className="text-center space-y-6 py-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-pink-500/20 flex items-center justify-center">
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
        <h2 className="text-2xl font-black mb-2">
          {isComplete
            ? 'Analysis Complete!'
            : isError
              ? 'Analysis Error'
              : isSyncing
                ? 'Fetching your videos...'
                : `Analyzing your content...`}
        </h2>
        <p className="text-slate-400 text-sm font-medium">
          {isComplete
            ? `We analyzed ${analyzed} videos and found insights for your content strategy.`
            : isError
              ? status.error || 'Something went wrong. You can still continue to your dashboard.'
              : 'This may take a few minutes. You can continue to your dashboard anytime.'}
        </p>
      </div>

      {!isSyncing && totalVideos > 0 && !isComplete && !isError && (
        <div className="w-64 mx-auto">
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-orange-400 transition-all duration-500 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {analyzed} / {totalVideos} videos analyzed
          </p>
        </div>
      )}

      {isSyncing && progress.videos_fetched > 0 && (
        <p className="text-xs text-slate-500">{progress.videos_fetched} videos fetched</p>
      )}

      <button
        onClick={onContinue}
        className="px-10 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        Continue to Dashboard
      </button>
      {!isComplete && !isError && (
        <p className="text-[10px] text-slate-600">Analysis will continue in the background</p>
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

  // On mount: fetch onboarding status to resume
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
        // If analysis is running, show analyzing screen
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
            'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <img src="/logo-light.png" alt="Blossom AI" className="w-9 h-9" />
          <span className="text-xl font-bold tracking-tighter">Blossom AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-medium">Welcome, {displayName}</span>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-pink-400 font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-8 pb-24">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-4 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            LET'S GET STARTED
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
            Set Up Your <span className="gradient-text">Profile</span>
          </h1>
        </div>

        <div className="glass-card rounded-[2.5rem] p-8 sm:p-10 w-full max-w-lg">
          {showAnalyzing ? (
            <StepAnalyzing onContinue={handleComplete} />
          ) : (
            <>
              <StepIndicator current={step} total={TOTAL_STEPS} />

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
    </div>
  )
}
