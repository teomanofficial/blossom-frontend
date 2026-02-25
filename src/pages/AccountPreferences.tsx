import { useState, useEffect } from 'react'
import { authFetch } from '../lib/api'

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
}

export default function AccountPreferences() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Current preferences
  const [category, setCategory] = useState<Category | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [contentDescription, setContentDescription] = useState('')

  // All available options
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([])
  const [domainsLoading, setDomainsLoading] = useState(false)

  // Edit state
  const [editing, setEditing] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [editDomainIds, setEditDomainIds] = useState<number[]>([])
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const res = await authFetch('/api/onboarding/preferences')
      if (res.ok) {
        const data = await res.json()
        setCategory(data.category)
        setDomains(data.domains || [])
        setContentDescription(data.contentDescription || '')
        setAllCategories(data.allCategories || [])

        // Pre-populate edit state
        setEditCategoryId(data.category?.id || null)
        setEditDomainIds((data.domains || []).map((d: Domain) => d.id))
        setEditDescription(data.contentDescription || '')
      }
    } catch (err) {
      console.error('Failed to load preferences:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load domains when category changes in edit mode
  useEffect(() => {
    if (!editing || !editCategoryId) return
    setDomainsLoading(true)
    authFetch(`/api/onboarding/categories/${editCategoryId}/domains`)
      .then((res) => res.json())
      .then((data) => {
        setAvailableDomains(data)
        // If category changed, reset domain selection
        if (editCategoryId !== category?.id) {
          setEditDomainIds([])
        }
      })
      .catch(() => {})
      .finally(() => setDomainsLoading(false))
  }, [editing, editCategoryId])

  const toggleDomain = (id: number) => {
    setEditDomainIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await authFetch('/api/onboarding/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: editCategoryId,
          domainIds: editDomainIds,
          contentDescription: editDescription,
        }),
      })
      if (res.ok) {
        await loadPreferences()
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditCategoryId(category?.id || null)
    setEditDomainIds(domains.map((d) => d.id))
    setEditDescription(contentDescription)
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No preferences yet (user hasn't completed onboarding)
  if (!category && domains.length === 0 && !contentDescription) {
    return (
      <div>
        <div className="pb-6 mb-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-black tracking-tight">Content Preferences</h2>
        </div>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-sliders-h text-2xl text-slate-600"></i>
          </div>
          <h3 className="text-lg font-bold mb-2">No preferences set</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Complete the onboarding flow to set your content category and domains.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06] flex items-center justify-between">
        <h2 className="text-xl font-black tracking-tight">Content Preferences</h2>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <i className="fas fa-pen text-[10px] mr-1.5"></i>
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        /* ====== VIEW MODE ====== */
        <div className="space-y-8">
          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Category
            </label>
            {category ? (
              <div className="flex items-center gap-4 glass-card rounded-3xl p-5 sm:p-7">
                {category.icon && <span className="text-2xl">{category.icon}</span>}
                <div>
                  <p className="text-sm font-bold">{category.title}</p>
                  {category.description && (
                    <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No category selected</p>
            )}
          </div>

          {/* Domains */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Domains
            </label>
            {domains.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => (
                  <span
                    key={d.id}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-pink-500/10 border border-pink-500/20 text-pink-300"
                  >
                    {d.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No domains selected</p>
            )}
          </div>

          {/* Content Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Content Description
            </label>
            {contentDescription ? (
              <p className="text-sm text-slate-300 leading-relaxed glass-card rounded-3xl p-5 sm:p-7">
                {contentDescription}
              </p>
            ) : (
              <p className="text-sm text-slate-500">No description provided</p>
            )}
          </div>

          {saved && (
            <span className="text-sm font-semibold text-teal-400 flex items-center gap-1.5">
              <i className="fas fa-check text-xs"></i>
              Preferences updated
            </span>
          )}
        </div>
      ) : (
        /* ====== EDIT MODE ====== */
        <div className="space-y-8">
          {/* Content Description */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Content Description
            </label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Describe the type of content you create..."
              rows={3}
              className="glass-input w-full resize-none"
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setEditCategoryId(cat.id)}
                  className={`group p-4 rounded-xl border text-left transition-all ${
                    editCategoryId === cat.id
                      ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20'
                      : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {cat.icon && <span className="text-xl">{cat.icon}</span>}
                    <div>
                      <h3 className="text-sm font-bold">{cat.title}</h3>
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Domain Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Domains
            </label>
            {domainsLoading ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-400">Loading domains...</span>
              </div>
            ) : availableDomains.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableDomains.map((d) => {
                  const selected = editDomainIds.includes(d.id)
                  return (
                    <button
                      key={d.id}
                      onClick={() => toggleDomain(d.id)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        selected
                          ? 'bg-pink-500/15 border-2 border-pink-500/40 text-pink-300'
                          : 'bg-white/[0.04] border-2 border-transparent text-slate-400 hover:bg-white/[0.08] hover:text-white'
                      }`}
                    >
                      {selected && (
                        <svg className="w-3 h-3 inline mr-1 -mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                      {d.name}
                    </button>
                  )
                })}
              </div>
            ) : editCategoryId ? (
              <p className="text-sm text-slate-500">No domains available for this category.</p>
            ) : (
              <p className="text-sm text-slate-500">Select a category first to see available domains.</p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
            >
              {saving ? 'Saving...' : 'Save preferences'}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
