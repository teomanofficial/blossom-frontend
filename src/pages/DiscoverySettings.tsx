import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface DiscoveryConfig {
  max_videos_per_hashtag: number
  discover_influencers: boolean
  influencer_posts_to_fetch: number
}

export default function DiscoverySettings() {
  const navigate = useNavigate()
  const [config, setConfig] = useState<DiscoveryConfig>({
    max_videos_per_hashtag: 30,
    discover_influencers: false,
    influencer_posts_to_fetch: 10,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    authFetch('/api/analysis/trending/discovery-config')
      .then(r => r.json())
      .then(data => setConfig(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function save() {
    try {
      setSaving(true)
      setSaved(false)
      await authFetch('/api/analysis/trending/discovery-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save discovery config:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => navigate('/dashboard/discovery')}
          className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <i className="fas fa-arrow-left text-xs text-slate-400"></i>
        </button>
        <div>
          <h1 className="text-lg font-black text-white tracking-tight">Discovery Settings</h1>
          <p className="text-[10px] font-bold text-slate-600 mt-0.5">Configure global discovery behavior</p>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-4">
        {/* Max Videos Per Hashtag */}
        <div className="flex items-center justify-between py-4 border-b border-white/5">
          <div>
            <div className="text-xs font-black text-white mb-1">Max Videos Per Hashtag</div>
            <div className="text-[10px] font-bold text-slate-600">Number of videos to fetch per hashtag during each discovery run</div>
          </div>
          <input
            type="number"
            min={1}
            max={200}
            value={config.max_videos_per_hashtag}
            onChange={(e) => setConfig({ ...config, max_videos_per_hashtag: parseInt(e.target.value) || 30 })}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-black text-white w-24 text-center focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Discover Influencers */}
        <div className="flex items-center justify-between py-4 border-b border-white/5">
          <div>
            <div className="text-xs font-black text-white mb-1">Discover Influencers</div>
            <div className="text-[10px] font-bold text-slate-600">When a new influencer is found, automatically fetch their recent posts</div>
          </div>
          <button
            onClick={() => setConfig({ ...config, discover_influencers: !config.discover_influencers })}
            className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${config.discover_influencers ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${config.discover_influencers ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Influencer Posts to Fetch */}
        {config.discover_influencers && (
          <div className="flex items-center justify-between py-4 border-b border-white/5">
            <div>
              <div className="text-xs font-black text-white mb-1">Influencer Posts to Fetch</div>
              <div className="text-[10px] font-bold text-slate-600">Number of recent posts to fetch per newly discovered influencer</div>
            </div>
            <input
              type="number"
              min={1}
              max={100}
              value={config.influencer_posts_to_fetch}
              onChange={(e) => setConfig({ ...config, influencer_posts_to_fetch: parseInt(e.target.value) || 10 })}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm font-black text-white w-24 text-center focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        )}
      </div>

      {/* Save */}
      <div className="mt-8 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        {saved && (
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
            <i className="fas fa-check text-[8px]"></i> Saved
          </span>
        )}
      </div>
    </div>
  )
}
