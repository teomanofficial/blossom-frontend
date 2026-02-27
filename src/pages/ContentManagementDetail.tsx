import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

interface Domain {
  id: number
  name: string
  name_normalized: string
  category: string | null
  description: string | null
  icon: string | null
  is_active: boolean
  display_order: number
  hashtags: string[]
  video_count: number
  avg_views_when_present: number
  avg_engagement_rate: number
  user_count: number
  influencer_count: number
  merged_into_id: number | null
  created_at: string
  updated_at: string
}

interface Video {
  id: number
  platform: string
  username: string
  caption: string | null
  content: string | null
  views: number
  likes: number
  engagement_rate: number | null
  thumbnail_url: string | null
  local_thumbnail_path: string | null
  content_url: string | null
  relevance_weight: number
}

interface Influencer {
  id: number
  username: string
  platform: string
  full_name: string | null
  profile_pic_url: string | null
  local_profile_pic_path: string | null
  follower_count: number
  following_count: number
  domain_video_count: number
  avg_relevance: number
}

interface DomainUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  domain_joined_at: string
}

type Tab = 'videos' | 'influencers' | 'users'

const CATEGORIES = ['topic', 'style', 'aesthetic', 'audience', 'niche', 'format', 'trend', 'product', 'emotion']

const CATEGORY_COLORS: Record<string, string> = {
  topic: 'bg-blue-500/10 text-blue-400',
  style: 'bg-purple-500/10 text-purple-400',
  aesthetic: 'bg-pink-500/10 text-pink-400',
  audience: 'bg-green-500/10 text-green-400',
  niche: 'bg-orange-500/10 text-orange-400',
  format: 'bg-teal-500/10 text-teal-400',
  trend: 'bg-red-500/10 text-red-400',
  product: 'bg-yellow-500/10 text-yellow-400',
  emotion: 'bg-indigo-500/10 text-indigo-400',
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function thumbnailSrc(v: { local_thumbnail_path?: string | null; thumbnail_url?: string | null }): string {
  return getStorageUrl(v.local_thumbnail_path) || ''
}

function profilePicSrc(inf: { local_profile_pic_path?: string | null; profile_pic_url?: string | null }): string {
  return getStorageUrl(inf.local_profile_pic_path) || ''
}

export default function ContentManagementDetail() {
  const { id } = useParams<{ id: string }>()

  const [domain, setDomain] = useState<Domain | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('videos')

  // Tab data
  const [videos, setVideos] = useState<Video[]>([])
  const [videosTotal, setVideosTotal] = useState(0)
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [influencersTotal, setInfluencersTotal] = useState(0)
  const [users, setUsers] = useState<DomainUser[]>([])
  const [usersTotal, setUsersTotal] = useState(0)
  const [tabLoading, setTabLoading] = useState(false)
  const [tabPage, setTabPage] = useState(0)

  // Edit mode
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({ name: '', description: '', icon: '', category: '', display_order: 0 })
  const [saving, setSaving] = useState(false)

  // Hashtag management
  const [hashtagInput, setHashtagInput] = useState('')
  const [savingHashtags, setSavingHashtags] = useState(false)

  // Merge
  const [showMerge, setShowMerge] = useState(false)
  const [mergeSearch, setMergeSearch] = useState('')
  const [mergeTargets, setMergeTargets] = useState<Domain[]>([])
  const [merging, setMerging] = useState(false)

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const PAGE_SIZE = 20

  const fetchDomain = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/management/domains/${id}?tab=videos&limit=${PAGE_SIZE}&offset=0`)
      const data = await res.json()
      setDomain(data.domain)
      setVideos(data.videos ?? [])
      setVideosTotal(data.videos_total ?? 0)
      setEditData({
        name: data.domain.name || '',
        description: data.domain.description || '',
        icon: data.domain.icon || '',
        category: data.domain.category || 'topic',
        display_order: data.domain.display_order || 0,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchDomain()
  }, [fetchDomain])

  const fetchTabData = useCallback(async (tab: Tab, page: number) => {
    setTabLoading(true)
    try {
      const res = await authFetch(`/api/management/domains/${id}?tab=${tab}&limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}`)
      const data = await res.json()
      if (tab === 'videos') {
        setVideos(data.videos ?? [])
        setVideosTotal(data.videos_total ?? 0)
      } else if (tab === 'influencers') {
        setInfluencers(data.influencers ?? [])
        setInfluencersTotal(data.influencers_total ?? 0)
      } else if (tab === 'users') {
        setUsers(data.users ?? [])
        setUsersTotal(data.users_total ?? 0)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setTabLoading(false)
    }
  }, [id])

  useEffect(() => {
    setTabPage(0)
    fetchTabData(activeTab, 0)
  }, [activeTab, fetchTabData])

  const handleTabPageChange = (newPage: number) => {
    setTabPage(newPage)
    fetchTabData(activeTab, newPage)
  }

  const toggleActive = async () => {
    try {
      const res = await authFetch(`/api/management/domains/${id}/toggle-active`, { method: 'PATCH' })
      if (res.ok) {
        const updated = await res.json()
        setDomain((prev) => prev ? { ...prev, is_active: updated.is_active } : prev)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch(`/api/management/domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })
      if (res.ok) {
        const updated = await res.json()
        setDomain((prev) => prev ? { ...prev, ...updated } : prev)
        setEditing(false)
        setMessage({ type: 'success', text: 'Domain updated successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to update domain' })
    } finally {
      setSaving(false)
    }
  }

  const addHashtag = () => {
    if (!hashtagInput.trim() || !domain) return
    const tag = hashtagInput.trim().toLowerCase().replace(/^#/, '')
    const newTag = `#${tag}`
    if (domain.hashtags.includes(newTag)) {
      setHashtagInput('')
      return
    }
    const updated = [...domain.hashtags, newTag]
    setDomain((prev) => prev ? { ...prev, hashtags: updated } : prev)
    setHashtagInput('')
  }

  const removeHashtag = (index: number) => {
    if (!domain) return
    const updated = domain.hashtags.filter((_, i) => i !== index)
    setDomain((prev) => prev ? { ...prev, hashtags: updated } : prev)
  }

  const saveHashtags = async () => {
    if (!domain) return
    setSavingHashtags(true)
    try {
      const res = await authFetch(`/api/management/domains/${id}/hashtags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags: domain.hashtags }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Hashtags saved' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to save hashtags' })
    } finally {
      setSavingHashtags(false)
    }
  }

  // Merge: search targets
  const searchMergeTargets = async () => {
    if (!mergeSearch.trim()) return
    try {
      const res = await authFetch(`/api/management/domains?search=${encodeURIComponent(mergeSearch)}&limit=10`)
      const data = await res.json()
      setMergeTargets((data.domains ?? []).filter((d: Domain) => d.id !== domain?.id))
    } catch (err) {
      console.error(err)
    }
  }

  const handleMerge = async (targetId: number) => {
    if (!confirm(`Merge "${domain?.name}" into the selected domain? This action cannot be undone.`)) return
    setMerging(true)
    try {
      const res = await authFetch(`/api/management/domains/${id}/merge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_id: targetId }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Domain merged successfully. Refreshing...' })
        setShowMerge(false)
        fetchDomain()
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Merge failed' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Merge failed' })
    } finally {
      setMerging(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!domain) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <h3 className="font-black text-lg mb-2">Domain Not Found</h3>
        <Link to="/dashboard/domain-management" className="text-pink-400 text-sm font-bold hover:underline">
          Back to Domain Management
        </Link>
      </div>
    )
  }

  const tabTotals = { videos: videosTotal, influencers: influencersTotal, users: usersTotal }
  const currentTabTotal = tabTotals[activeTab]
  const totalTabPages = Math.ceil(currentTabTotal / PAGE_SIZE)

  return (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-8">
        <Link to="/dashboard/domain-management" className="text-slate-500 hover:text-white transition-colors font-medium">
          Domain Management
        </Link>
        <i className="fas fa-chevron-right text-slate-600 text-[10px]"></i>
        <span className="text-white font-bold">{domain.name}</span>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 opacity-50 hover:opacity-100">
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Domain Header */}
      <div className="glass-card rounded-2xl p-8 mb-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl">
              {domain.icon || <i className="fas fa-layer-group text-slate-500"></i>}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight font-display">{domain.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                {domain.category && (
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${CATEGORY_COLORS[domain.category] || 'bg-white/5 text-slate-400'}`}>
                    {domain.category}
                  </span>
                )}
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${domain.is_active ? 'bg-teal-500/10 text-teal-400' : 'bg-red-500/10 text-red-400'}`}>
                  {domain.is_active ? 'Active' : 'Inactive'}
                </span>
                {domain.merged_into_id && (
                  <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-[10px] font-black rounded uppercase">
                    Merged into #{domain.merged_into_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(!editing); if (!editing) setEditData({ name: domain.name || '', description: domain.description || '', icon: domain.icon || '', category: domain.category || 'topic', display_order: domain.display_order || 0 }) }}
              className="px-4 py-2 rounded-xl text-[11px] font-bold bg-white/5 hover:bg-white/10 transition-colors"
            >
              <i className={`fas ${editing ? 'fa-times' : 'fa-pen'} mr-1`}></i>
              {editing ? 'Cancel' : 'Edit'}
            </button>
            <button
              onClick={toggleActive}
              className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-colors ${domain.is_active ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-teal-500/10 text-teal-400 hover:bg-teal-500/20'}`}
            >
              {domain.is_active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => setShowMerge(true)}
              className="px-4 py-2 rounded-xl text-[11px] font-bold bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition-colors"
            >
              <i className="fas fa-code-merge mr-1"></i> Merge
            </button>
          </div>
        </div>

        {domain.description && !editing && (
          <p className="text-sm text-slate-400 font-medium mb-6 leading-relaxed">{domain.description}</p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-5 gap-6 pt-6 border-t border-white/5">
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Videos</div>
            <div className="text-xl font-black">{domain.video_count}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Influencers</div>
            <div className="text-xl font-black">{domain.influencer_count}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Users</div>
            <div className="text-xl font-black">{domain.user_count}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Avg Views</div>
            <div className="text-xl font-black">{formatNumber(Math.round(domain.avg_views_when_present || 0))}</div>
          </div>
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Engagement</div>
            <div className="text-xl font-black">
              {domain.avg_engagement_rate ? Number(domain.avg_engagement_rate).toFixed(1) + '%' : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Section */}
      {editing && (
        <div className="glass-card rounded-2xl p-8 mb-8 border border-white/10">
          <h2 className="text-lg font-black tracking-tight mb-6">Edit Domain</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Name</label>
              <input
                type="text"
                value={editData.name}
                onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Category</label>
              <select
                value={editData.category}
                onChange={(e) => setEditData((prev) => ({ ...prev, category: e.target.value }))}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Icon (emoji)</label>
              <input
                type="text"
                value={editData.icon}
                onChange={(e) => setEditData((prev) => ({ ...prev, icon: e.target.value }))}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Display Order</label>
              <input
                type="number"
                value={editData.display_order}
                onChange={(e) => setEditData((prev) => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Description</label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setEditing(false)}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-bold bg-pink-500 hover:bg-pink-400 disabled:opacity-50 transition-colors"
            >
              {saving ? <i className="fas fa-spinner fa-spin"></i> : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Hashtag Management */}
      <div className="glass-card rounded-2xl p-8 mb-8">
        <h2 className="text-lg font-black tracking-tight mb-4">Hashtags</h2>
        <p className="text-xs text-slate-500 font-medium mb-4">Associated hashtags for auto-discovery of trending content.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {domain.hashtags.length === 0 && (
            <span className="text-sm text-slate-500 font-medium">No hashtags yet</span>
          )}
          {domain.hashtags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm font-bold text-slate-300">
              {tag}
              <button
                onClick={() => removeHashtag(i)}
                className="text-slate-500 hover:text-red-400 transition-colors"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHashtag() } }}
            placeholder="Add hashtag..."
            className="flex-1 glass-input px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-white/20"
          />
          <button
            onClick={addHashtag}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
          >
            Add
          </button>
          <button
            onClick={saveHashtags}
            disabled={savingHashtags}
            className="px-4 py-2.5 rounded-xl text-sm font-bold bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 transition-colors"
          >
            {savingHashtags ? <i className="fas fa-spinner fa-spin"></i> : 'Save'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/5 pb-0">
        {(['videos', 'influencers', 'users'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-bold transition-colors border-b-2 -mb-[1px] ${
              activeTab === tab
                ? 'text-white border-pink-500'
                : 'text-slate-500 border-transparent hover:text-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="ml-2 text-xs text-slate-500">
              ({tab === 'videos' ? domain.video_count : tab === 'influencers' ? domain.influencer_count : domain.user_count})
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tabLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {videos.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm font-medium">No videos linked to this domain.</div>
              ) : videos.map((video) => (
                <div key={video.id} className="glass-card rounded-xl p-4">
                  <div className="flex gap-3">
                    {(video.local_thumbnail_path || video.thumbnail_url) && (
                      <img
                        src={thumbnailSrc(video)}
                        alt=""
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase">{video.platform}</span>
                        <span className="text-[10px] font-bold text-slate-500">@{video.username}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium line-clamp-2 mb-2">
                        {video.content || video.caption || 'No description'}
                      </p>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500">
                        <span><i className="fas fa-eye mr-1"></i>{formatNumber(video.views || 0)}</span>
                        <span><i className="fas fa-heart mr-1"></i>{formatNumber(video.likes || 0)}</span>
                        <span className="px-1.5 py-0.5 bg-pink-500/10 text-pink-400 rounded text-[9px] font-black">
                          {(video.relevance_weight * 100).toFixed(0)}% relevant
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Influencers Tab */}
          {activeTab === 'influencers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {influencers.length === 0 ? (
                <div className="col-span-full text-center py-12 text-slate-500 text-sm font-medium">No influencers connected to this domain.</div>
              ) : influencers.map((inf) => (
                <Link
                  key={inf.id}
                  to={`/dashboard/influencers/${inf.id}`}
                  className="glass-card rounded-xl p-4 hover:bg-white/5 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    {(inf.local_profile_pic_path || inf.profile_pic_url) ? (
                      <img
                        src={profilePicSrc(inf)}
                        alt=""
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-500 text-sm font-bold flex-shrink-0">
                        {inf.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black group-hover:text-pink-400 transition-colors">
                        @{inf.username}
                      </div>
                      {inf.full_name && (
                        <div className="text-xs text-slate-500 font-medium">{inf.full_name}</div>
                      )}
                      <div className="flex gap-3 mt-1 text-[10px] font-bold text-slate-500">
                        <span>{formatNumber(inf.follower_count || 0)} followers</span>
                        <span>{inf.domain_video_count} videos</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-black text-slate-500 uppercase">{inf.platform}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-2">
              {users.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm font-medium">No users have selected this domain yet.</div>
              ) : users.map((user) => (
                <div key={user.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {(user.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{user.full_name || 'Unknown User'}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Joined domain {new Date(user.domain_joined_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Registered {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab Pagination */}
          {totalTabPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => handleTabPageChange(Math.max(0, tabPage - 1))}
                disabled={tabPage === 0}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="px-4 py-2 text-sm font-bold text-slate-400">
                Page {tabPage + 1} of {totalTabPages}
              </span>
              <button
                onClick={() => handleTabPageChange(Math.min(totalTabPages - 1, tabPage + 1))}
                disabled={tabPage >= totalTabPages - 1}
                className="px-3 py-2 rounded-lg text-sm font-bold bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Merge Modal */}
      {showMerge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMerge(false)}>
          <div className="glass-card rounded-3xl p-6 sm:p-8 w-full max-w-lg border border-white/10" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black tracking-tight mb-2">Merge Domain</h2>
            <p className="text-sm text-slate-400 font-medium mb-6">
              Merge <span className="text-white font-bold">"{domain.name}"</span> into another domain. All video links and user selections will be transferred.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={mergeSearch}
                onChange={(e) => setMergeSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') searchMergeTargets() }}
                placeholder="Search target domain..."
                className="flex-1 glass-input px-4 py-3 rounded-xl text-sm font-medium outline-none focus:border-white/20"
              />
              <button
                onClick={searchMergeTargets}
                className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/15 transition-colors"
              >
                Search
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {mergeTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleMerge(target.id)}
                  disabled={merging}
                  className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold">{target.name}</div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {target.video_count} videos | {target.category}
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-orange-400 uppercase">
                    {merging ? <i className="fas fa-spinner fa-spin"></i> : 'Merge Into'}
                  </span>
                </button>
              ))}
              {mergeTargets.length === 0 && mergeSearch && (
                <p className="text-sm text-slate-500 text-center py-4">No matching domains found</p>
              )}
            </div>

            <button
              onClick={() => setShowMerge(false)}
              className="w-full py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  )
}
