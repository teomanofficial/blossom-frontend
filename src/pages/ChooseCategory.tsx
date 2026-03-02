import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'

interface Category {
  id: number
  title: string
  description: string
  icon: string | null
  thumbnail_url: string | null
}

interface CategoryRequest {
  id: number
  status: string
  requested_name: string
  requested_description: string | null
  admin_notes: string | null
  created_at: string
}

export default function ChooseCategory() {
  const { user, signOut, categoryStatus, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestName, setRequestName] = useState('')
  const [requestDescription, setRequestDescription] = useState('')
  const [lastRequest, setLastRequest] = useState<CategoryRequest | null>(null)

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Creator'

  // Redirect if already has a selected category
  useEffect(() => {
    if (categoryStatus === 'selected') {
      navigate('/choose-plan', { replace: true })
    }
  }, [categoryStatus, navigate])

  // Fetch categories and last request status
  useEffect(() => {
    if (!user) return
    Promise.all([
      authFetch('/api/onboarding/categories').then((r) => r.json()),
      authFetch('/api/onboarding/category-request-status').then((r) => r.json()),
    ])
      .then(([cats, reqData]) => {
        setCategories(cats)
        setLastRequest(reqData.request || null)
      })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false))
  }, [user])

  const handleSelectCategory = async () => {
    if (!selectedId) return
    setSubmitting(true)
    try {
      const res = await authFetch('/api/onboarding/select-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: selectedId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to select category')
        return
      }
      await refreshProfile()
      navigate('/choose-plan')
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitRequest = async () => {
    if (!requestName.trim()) {
      toast.error('Category name is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch('/api/onboarding/request-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: requestName.trim(),
          description: requestDescription.trim(),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to submit request')
        return
      }
      await refreshProfile()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Pending screen
  if (categoryStatus === 'pending') {
    return (
      <div className="min-h-screen bg-[#050508] overflow-x-hidden relative">
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(circle at 10% 20%, rgba(139,92,246,0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(244,114,182,0.15) 0%, transparent 40%)',
          }}
        />
        <div className="relative z-10 flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-3">
            <img src="/logo-light.png" alt="Blossom" className="w-9 h-9" />
            <span className="text-xl font-bold tracking-tighter">Blossom</span>
          </div>
          <button
            onClick={signOut}
            className="text-xs text-slate-500 hover:text-pink-400 font-bold uppercase tracking-wider transition-colors"
          >
            Sign Out
          </button>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-24">
          <div className="glass-card rounded-[2.5rem] p-10 sm:p-14 max-w-lg w-full text-center">
            <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <svg className="w-10 h-10 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Category Under Review
            </h2>
            <p className="text-slate-400 text-base font-medium mb-3 leading-relaxed">
              Your category request is being reviewed by our team. We'll let you know once it's approved.
            </p>
            <p className="text-slate-500 text-sm mb-10">
              You can log out and check back later.
            </p>
            <button
              onClick={signOut}
              className="px-10 py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-2xl text-sm font-black text-white transition-all"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050508] overflow-x-hidden relative">
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
          <img src="/logo-light.png" alt="Blossom" className="w-9 h-9" />
          <span className="text-xl font-bold tracking-tighter">Blossom</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 font-medium">
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

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center px-4 sm:px-6 pt-12 pb-24">
        {/* Rejected request banner */}
        {lastRequest && lastRequest.status === 'rejected' && (
          <div className="max-w-3xl w-full mb-8 px-6 py-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-sm text-red-400 font-medium">
              Your previous category request "{lastRequest.requested_name}" was not approved.
              {lastRequest.admin_notes && (
                <span className="text-red-400/70"> Reason: {lastRequest.admin_notes}</span>
              )}
              {' '}Please select from available categories or submit a new request.
            </p>
          </div>
        )}

        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-violet-400 text-[11px] font-bold mb-6 tracking-widest uppercase">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
            </svg>
            FIRST STEP
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black font-display tracking-tight mb-4">
            Choose Your <span className="gradient-text">Category</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Select the category that best describes the content you create
          </p>
        </div>

        {showRequestForm ? (
          /* Request form */
          <div className="max-w-xl w-full">
            <div className="glass-card rounded-[2.5rem] p-8 sm:p-10">
              <h3 className="text-2xl font-black mb-2">Request a Category</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Tell us about your content category and we'll review it
              </p>

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                    placeholder="e.g. Pet Care, Automotive, Real Estate"
                    maxLength={255}
                    className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-base text-white placeholder-slate-600 focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                    Description
                  </label>
                  <textarea
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    placeholder="Describe what kind of content this category would include..."
                    rows={4}
                    className="w-full px-5 py-4 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-base text-white placeholder-slate-600 focus:border-pink-500/40 focus:ring-2 focus:ring-pink-500/10 focus:outline-none transition-all resize-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowRequestForm(false)}
                  className="px-8 py-4 rounded-2xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitRequest}
                  disabled={!requestName.trim() || submitting}
                  className="px-10 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-pink-500/20"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Category grid */
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedId(cat.id)}
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

              {/* "Not listed" card */}
              <button
                onClick={() => setShowRequestForm(true)}
                className="group p-6 rounded-2xl border-2 border-dashed border-white/[0.1] text-left transition-all hover:border-white/[0.2] hover:bg-white/[0.03]"
              >
                <div className="text-3xl mb-3 opacity-40">+</div>
                <h3 className="text-base font-bold mb-1.5 text-slate-400">
                  My category is not listed
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Request a new category for review
                </p>
              </button>
            </div>

            <button
              onClick={handleSelectCategory}
              disabled={!selectedId || submitting}
              className="px-14 py-4 bg-gradient-to-r from-pink-500 to-orange-400 rounded-2xl text-sm font-black text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-pink-500/20"
            >
              {submitting ? 'Saving...' : 'Continue'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
