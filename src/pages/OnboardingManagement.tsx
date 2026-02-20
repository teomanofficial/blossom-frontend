import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingEntry {
  id: number
  user_id: string
  email: string
  profile_name: string | null
  full_name: string | null
  current_step: number
  is_completed: boolean
  completed_at: string | null
  social_profiles: { instagram?: string; tiktok?: string } | null
  content_description: string | null
  category_id: number | null
  category_title: string | null
  selected_domain_ids: number[] | null
  linked_platform: string | null
  analysis_status: string | null
  analysis_progress: any
  analysis_error: string | null
  created_at: string
  updated_at: string
}

interface OnboardingStats {
  total: string
  completed: string
  in_progress: string
  not_started: string
  avg_step: string | null
}

interface OnboardingDetail extends OnboardingEntry {
  domain_names: string[]
  linked_username: string | null
  linked_acct_platform: string | null
}

interface Category {
  id: number
  title: string
  description: string
  icon: string | null
}

interface Domain {
  id: number
  name: string
  category: string | null
  video_count: number
  category_id: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return d.toLocaleDateString()
}

function stepLabel(step: number, completed: boolean): string {
  if (completed) return 'Completed'
  const labels: Record<number, string> = {
    1: 'Name',
    2: 'Social Profiles',
    3: 'Content Description',
    4: 'Category',
    5: 'Domains',
    6: 'Link Account',
    7: 'Analysis',
  }
  return labels[step] || `Step ${step}`
}

function getStatusColor(completed: boolean, step: number): string {
  if (completed) return 'bg-teal-400/10 text-teal-400'
  if (step > 3) return 'bg-yellow-400/10 text-yellow-400'
  return 'bg-orange-400/10 text-orange-400'
}

function getAnalysisColor(status: string | null): string {
  switch (status) {
    case 'completed': return 'bg-teal-400/10 text-teal-400'
    case 'analyzing': case 'syncing': return 'bg-blue-400/10 text-blue-400'
    case 'error': return 'bg-red-400/10 text-red-400'
    case 'skipped': return 'bg-slate-400/10 text-slate-500'
    default: return 'bg-slate-400/10 text-slate-600'
  }
}

// ---------------------------------------------------------------------------
// Detail Modal
// ---------------------------------------------------------------------------

function DetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<OnboardingDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch(`/api/onboarding/admin/${userId}`)
      .then((r) => r.json())
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [userId])

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-y-auto dashboard-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black">Onboarding Details</h3>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times text-lg" />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !detail ? (
            <p className="text-slate-500 text-sm text-center py-8">No data found</p>
          ) : (
            <div className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Email" value={detail.email} />
                <InfoBlock label="Full Name" value={detail.full_name || detail.profile_name || '—'} />
                <InfoBlock label="Current Step" value={`${detail.current_step} — ${stepLabel(detail.current_step, detail.is_completed)}`} />
                <InfoBlock label="Status" value={detail.is_completed ? 'Completed' : 'In Progress'} />
                <InfoBlock label="Started" value={new Date(detail.created_at).toLocaleString()} />
                <InfoBlock label="Last Updated" value={detail.updated_at ? new Date(detail.updated_at).toLocaleString() : '—'} />
              </div>

              {/* Social Profiles */}
              {detail.social_profiles && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Social Profiles</h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.social_profiles.instagram && (
                      <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-xs font-bold">
                        IG: {detail.social_profiles.instagram}
                      </span>
                    )}
                    {detail.social_profiles.tiktok && (
                      <span className="px-3 py-1.5 bg-pink-500/10 text-pink-400 rounded-lg text-xs font-bold">
                        TT: {detail.social_profiles.tiktok}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Content Description */}
              {detail.content_description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content Description</h4>
                  <p className="text-sm text-slate-300 bg-white/5 rounded-xl p-4 border border-white/5">{detail.content_description}</p>
                </div>
              )}

              {/* Category & Domains */}
              <div className="grid grid-cols-2 gap-4">
                <InfoBlock label="Category" value={detail.category_title || '—'} />
                <InfoBlock label="Linked Platform" value={detail.linked_username ? `${detail.linked_acct_platform} (@${detail.linked_username})` : detail.linked_platform || '—'} />
              </div>

              {detail.domain_names && detail.domain_names.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selected Domains</h4>
                  <div className="flex flex-wrap gap-2">
                    {detail.domain_names.map((d, i) => (
                      <span key={i} className="px-3 py-1.5 bg-pink-500/10 text-pink-300 rounded-lg text-xs font-bold">{d}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis */}
              {detail.analysis_status && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Analysis</h4>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${getAnalysisColor(detail.analysis_status)}`}>
                        {detail.analysis_status}
                      </span>
                    </div>
                    {detail.analysis_progress && (
                      <p className="text-xs text-slate-400">
                        {detail.analysis_progress.videos_analyzed ?? 0}/{detail.analysis_progress.total_videos ?? 0} videos analyzed
                        {detail.analysis_progress.keywords_found != null && `, ${detail.analysis_progress.keywords_found} keywords`}
                      </p>
                    )}
                    {detail.analysis_error && (
                      <p className="text-xs text-red-400">{detail.analysis_error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/5">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-sm font-semibold text-white truncate">{value}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

function OnboardingSimulation() {
  const [categories, setCategories] = useState<Category[]>([])
  const [domainsByCategory, setDomainsByCategory] = useState<Record<number, Domain[]>>({})
  const [loading, setLoading] = useState(true)

  // Simulation state
  const [simStep, setSimStep] = useState(1)
  const [simName, setSimName] = useState('')
  const [simSocials, setSimSocials] = useState({ instagram: '', tiktok: '' })
  const [simDescription, setSimDescription] = useState('')
  const [simCategory, setSimCategory] = useState<number | null>(null)
  const [simDomains, setSimDomains] = useState<number[]>([])

  const TOTAL_STEPS = 6

  useEffect(() => {
    authFetch('/api/onboarding/admin/simulation/data')
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories || [])
        setDomainsByCategory(data.domainsByCategory || {})
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const resetSim = () => {
    setSimStep(1)
    setSimName('')
    setSimSocials({ instagram: '', tiktok: '' })
    setSimDescription('')
    setSimCategory(null)
    setSimDomains([])
  }

  const currentDomains = simCategory ? (domainsByCategory[simCategory] || []) : []

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Simulation Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-black">Onboarding Simulation</h3>
          <p className="text-xs text-slate-500 mt-1">Preview exactly what users see during onboarding (read-only, nothing is saved)</p>
        </div>
        <button
          onClick={resetSim}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <i className="fas fa-arrows-rotate mr-2" />
          Reset
        </button>
      </div>

      {/* Simulation Container - mimics the real onboarding look */}
      <div className="bg-slate-950 rounded-3xl border border-white/10 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
              <i className="fas fa-seedling text-white text-xs" />
            </div>
            <span className="text-lg font-bold tracking-tighter">Blossom AI</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded-full">
              Simulation Mode
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-6 py-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-[11px] font-bold mb-4 tracking-widest uppercase">
              <i className="fas fa-star text-[10px]" />
              LET'S GET STARTED
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Set Up Your <span className="bg-gradient-to-r from-pink-500 to-orange-400 bg-clip-text text-transparent">Profile</span>
            </h1>
          </div>

          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-8 w-full max-w-lg">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-10">
              {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                const s = i + 1
                const isActive = s === simStep
                const isCompleted = s < simStep
                return (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-orange-400 text-white scale-110'
                          : isCompleted
                            ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                            : 'bg-white/5 text-slate-600 border border-white/10'
                      }`}
                    >
                      {isCompleted ? <i className="fas fa-check text-[10px]" /> : s}
                    </div>
                    {s < TOTAL_STEPS && (
                      <div className={`w-8 h-0.5 ${isCompleted ? 'bg-teal-500/30' : 'bg-white/10'}`} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Step 1: Name */}
            {simStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">What's your name?</h2>
                  <p className="text-slate-400 text-sm font-medium">Let us know who you are</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  onClick={() => simName.trim() && setSimStep(2)}
                  disabled={!simName.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Social Profiles */}
            {simStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Your Social Profiles</h2>
                  <p className="text-slate-400 text-sm font-medium">Share your social media handles (optional)</p>
                </div>
                {[
                  { key: 'instagram' as const, label: 'Instagram', icon: 'IG', placeholder: '@yourusername' },
                  { key: 'tiktok' as const, label: 'TikTok', icon: 'TT', placeholder: '@yourusername' },
                ].map((p) => (
                  <div key={p.key}>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{p.label}</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 flex-shrink-0">
                        {p.icon}
                      </div>
                      <input
                        type="text"
                        value={simSocials[p.key]}
                        onChange={(e) => setSimSocials({ ...simSocials, [p.key]: e.target.value })}
                        placeholder={p.placeholder}
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                ))}
                <div className="flex gap-3">
                  <button onClick={() => setSimStep(1)} className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all">Back</button>
                  <button onClick={() => setSimStep(3)} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02]">Continue</button>
                </div>
              </div>
            )}

            {/* Step 3: Content Description */}
            {simStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Your Content</h2>
                  <p className="text-slate-400 text-sm font-medium">Describe the kind of content you create on social media</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content Description</label>
                  <textarea
                    value={simDescription}
                    onChange={(e) => setSimDescription(e.target.value)}
                    placeholder="I create short-form videos about cooking healthy meals, sharing recipes and kitchen tips..."
                    rows={5}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 focus:outline-none transition-colors resize-none"
                  />
                  <p className="text-[10px] text-slate-600 mt-1">{simDescription.length} characters (minimum 10)</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSimStep(2)} className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all">Back</button>
                  <button onClick={() => simDescription.trim().length >= 10 && setSimStep(4)} disabled={simDescription.trim().length < 10} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]">Continue</button>
                </div>
              </div>
            )}

            {/* Step 4: Category */}
            {simStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Your Category</h2>
                  <p className="text-slate-400 text-sm font-medium">Select the category that best describes your content</p>
                </div>
                {categories.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">No categories available.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 dashboard-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { setSimCategory(cat.id); setSimDomains([]) }}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                          simCategory === cat.id
                            ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {cat.icon && <div className="text-2xl mb-2">{cat.icon}</div>}
                        <h3 className="text-sm font-black mb-1">{cat.title}</h3>
                        {cat.description && <p className="text-[10px] text-slate-500 line-clamp-2">{cat.description}</p>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setSimStep(3)} className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all">Back</button>
                  <button onClick={() => simCategory && setSimStep(5)} disabled={!simCategory} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]">Continue</button>
                </div>
              </div>
            )}

            {/* Step 5: Domains */}
            {simStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Your Domains</h2>
                  <p className="text-slate-400 text-sm font-medium">Select the topics you're interested in (at least 1)</p>
                </div>
                {currentDomains.length === 0 ? (
                  <p className="text-center text-slate-500 py-8 text-sm">No domains available for this category.</p>
                ) : (
                  <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1 dashboard-scrollbar">
                    {currentDomains.map((d) => {
                      const sel = simDomains.includes(d.id)
                      return (
                        <button
                          key={d.id}
                          onClick={() => setSimDomains(sel ? simDomains.filter((x) => x !== d.id) : [...simDomains, d.id])}
                          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                            sel
                              ? 'bg-pink-500/20 border border-pink-500/40 text-pink-300'
                              : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {d.name}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setSimStep(4)} className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all">Back</button>
                  <button onClick={() => simDomains.length > 0 && setSimStep(6)} disabled={simDomains.length === 0} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02]">Continue</button>
                </div>
              </div>
            )}

            {/* Step 6: Link Account */}
            {simStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-black tracking-tight mb-2">Link Your Account</h2>
                  <p className="text-slate-400 text-sm font-medium">Connect your social account so we can analyze your content</p>
                </div>
                <div className="space-y-3">
                  <button className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-sm">IG</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-black">Connect Instagram</h3>
                      <p className="text-[10px] text-slate-500">Link your Instagram Business Account</p>
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase">Disabled in Sim</span>
                  </button>
                  <button className="w-full flex items-center gap-4 p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all opacity-60 cursor-not-allowed">
                    <div className="w-12 h-12 rounded-xl bg-black border border-white/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-black text-sm">TT</span>
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-sm font-black">Connect TikTok</h3>
                      <p className="text-[10px] text-slate-500">Link your TikTok Creator Account</p>
                    </div>
                    <span className="text-[9px] font-black text-slate-600 uppercase">Disabled in Sim</span>
                  </button>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSimStep(5)} className="flex-1 py-3.5 bg-white/10 border border-white/10 rounded-2xl text-sm font-black text-white hover:bg-white/15 transition-all">Back</button>
                  <button onClick={resetSim} className="flex-1 py-3.5 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02]">
                    Restart Simulation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function OnboardingManagement() {
  const [tab, setTab] = useState<'responses' | 'simulation'>('responses')
  const [entries, setEntries] = useState<OnboardingEntry[]>([])
  const [stats, setStats] = useState<OnboardingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [detailUserId, setDetailUserId] = useState<string | null>(null)

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (statusFilter !== 'all') params.set('status', statusFilter)

    authFetch(`/api/onboarding/admin/list?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data.entries || [])
        setStats(data.stats || null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tab === 'responses') fetchData()
  }, [tab, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchData()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">View user onboarding answers and preview the flow</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Users</div>
            <div className="text-2xl font-black">{stats.total}</div>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-teal-500 uppercase tracking-wider mb-1">Completed</div>
            <div className="text-2xl font-black text-teal-400">{stats.completed}</div>
          </div>
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-yellow-500 uppercase tracking-wider mb-1">In Progress</div>
            <div className="text-2xl font-black text-yellow-400">{stats.in_progress}</div>
          </div>
          <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-5">
            <div className="text-[10px] font-black text-orange-500 uppercase tracking-wider mb-1">Avg Step</div>
            <div className="text-2xl font-black text-orange-400">{stats.avg_step ? Number(stats.avg_step).toFixed(1) : '—'}</div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 w-fit mb-8">
        <button
          onClick={() => setTab('responses')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'responses' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fas fa-table-list mr-2" />
          User Responses
        </button>
        <button
          onClick={() => setTab('simulation')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            tab === 'simulation' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-white'
          }`}
        >
          <i className="fas fa-play mr-2" />
          Simulation
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'responses' && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <form onSubmit={handleSearch} className="flex-1 max-w-sm">
              <div className="relative">
                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-600 focus:border-pink-500/50 focus:outline-none transition-colors"
                />
              </div>
            </form>
            <div className="flex gap-2">
              {['all', 'completed', 'in_progress', 'not_started'].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === s
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                      : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s === 'all' ? 'All' : s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Not Started'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16">
              <i className="fas fa-inbox text-3xl text-slate-700 mb-4" />
              <p className="text-slate-500 text-sm font-medium">No onboarding entries found</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Progress</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Linked</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Analysis</th>
                    <th className="text-left px-5 py-4 text-[10px] font-black text-slate-500 uppercase tracking-wider">Updated</th>
                    <th className="w-12" />
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setDetailUserId(entry.user_id)}
                    >
                      <td className="px-5 py-4">
                        <div className="text-sm font-bold text-white truncate max-w-[180px]">{entry.full_name || entry.profile_name || '—'}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{entry.email}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${getStatusColor(entry.is_completed, entry.current_step)}`}>
                            {stepLabel(entry.current_step, entry.is_completed)}
                          </span>
                          {!entry.is_completed && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: 6 }, (_, i) => (
                                <div
                                  key={i}
                                  className={`w-3 h-1.5 rounded-full ${i < entry.current_step - 1 ? 'bg-pink-500' : 'bg-white/10'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-400 font-medium">{entry.category_title || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        {entry.linked_platform ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-400/10 text-purple-400">
                            {entry.linked_platform}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {entry.analysis_status ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${getAnalysisColor(entry.analysis_status)}`}>
                            {entry.analysis_status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-slate-500">{timeAgo(entry.updated_at || entry.created_at)}</span>
                      </td>
                      <td className="px-3 py-4">
                        <i className="fas fa-chevron-right text-[10px] text-slate-600" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'simulation' && <OnboardingSimulation />}

      {/* Detail Modal */}
      {detailUserId && <DetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />}
    </div>
  )
}
