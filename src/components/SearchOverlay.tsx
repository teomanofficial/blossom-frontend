import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

interface FormatResult {
  id: number
  name: string
  description: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: any | null
}

interface HookResult {
  id: number
  name: string
  description: string | null
  hook_technique: string | null
  video_count: number
  avg_views: number
  avg_engagement_rate: number
  class_analysis: any | null
}

interface TacticResult {
  id: number
  name: string
  category: string
  description: string | null
  video_count: number
  avg_views_when_present: number
  avg_execution_score: number
}

interface InfluencerResult {
  id: number
  platform: string
  username: string
  display_name: string | null
  avatar_url: string | null
  local_avatar_path: string | null
  follower_count: number | null
  avg_views: number | null
  avg_engagement_rate: number | null
  is_verified: boolean
  tier: string | null
}

interface SearchResults {
  formats: FormatResult[]
  hooks: HookResult[]
  tactics: TacticResult[]
  influencers: InfluencerResult[]
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

function getFormatEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('tutorial') || lower.includes('how')) return '📚'
  if (lower.includes('reaction')) return '😱'
  if (lower.includes('comparison') || lower.includes('vs')) return '📸'
  if (lower.includes('story') || lower.includes('arc') || lower.includes('journey')) return '✨'
  if (lower.includes('review') || lower.includes('unbox')) return '📦'
  if (lower.includes('challenge')) return '🏆'
  if (lower.includes('comedy') || lower.includes('skit') || lower.includes('funny')) return '😂'
  if (lower.includes('dance') || lower.includes('trend')) return '💃'
  if (lower.includes('asmr') || lower.includes('satisf')) return '🎧'
  if (lower.includes('cook') || lower.includes('food') || lower.includes('recipe')) return '🍳'
  if (lower.includes('fitness') || lower.includes('workout')) return '💪'
  if (lower.includes('beauty') || lower.includes('makeup') || lower.includes('glow')) return '💄'
  if (lower.includes('pov')) return '🎬'
  if (lower.includes('vlog') || lower.includes('day')) return '📹'
  if (lower.includes('tip') || lower.includes('hack') || lower.includes('trick')) return '🔥'
  return '🎯'
}

function getHookEmoji(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('question') || lower.includes('ask')) return '❓'
  if (lower.includes('shock') || lower.includes('surprise') || lower.includes('unexpected')) return '😱'
  if (lower.includes('curiosity') || lower.includes('mystery') || lower.includes('secret')) return '🔍'
  if (lower.includes('controversy') || lower.includes('debate') || lower.includes('hot take')) return '🔥'
  if (lower.includes('story') || lower.includes('storytime') || lower.includes('narrative')) return '📖'
  if (lower.includes('before') || lower.includes('after') || lower.includes('transformation')) return '✨'
  if (lower.includes('list') || lower.includes('ranking') || lower.includes('top')) return '📋'
  if (lower.includes('challenge') || lower.includes('dare')) return '🏆'
  if (lower.includes('hack') || lower.includes('tip') || lower.includes('trick')) return '💡'
  if (lower.includes('fail') || lower.includes('wrong') || lower.includes('mistake')) return '⚠️'
  if (lower.includes('money') || lower.includes('cost') || lower.includes('price')) return '💰'
  if (lower.includes('wait') || lower.includes('watch') || lower.includes('end')) return '👀'
  if (lower.includes('pov') || lower.includes('relatable')) return '🎭'
  return '🧲'
}

const categoryColors: Record<string, string> = {
  audio_design: 'bg-violet-500/20 text-violet-400',
  text_overlay: 'bg-cyan-500/20 text-cyan-400',
  framing_angle: 'bg-emerald-500/20 text-emerald-400',
  content_structure: 'bg-sky-500/20 text-sky-400',
  shareability: 'bg-orange-500/20 text-orange-400',
  engagement_bait: 'bg-yellow-500/20 text-yellow-400',
  trend_leverage: 'bg-lime-500/20 text-lime-400',
  identity_signal: 'bg-fuchsia-500/20 text-fuchsia-400',
  visual_storytelling: 'bg-rose-500/20 text-rose-400',
  pacing: 'bg-indigo-500/20 text-indigo-400',
  hook_technique: 'bg-pink-500/20 text-pink-400',
  emotional_trigger: 'bg-red-500/20 text-red-400',
}

function getTierColor(tier: string | null): string {
  switch (tier) {
    case 'mega': return 'text-pink-400 bg-pink-400/10'
    case 'macro': return 'text-orange-400 bg-orange-400/10'
    case 'mid': return 'text-yellow-400 bg-yellow-400/10'
    case 'micro': return 'text-teal-400 bg-teal-400/10'
    case 'nano': return 'text-blue-400 bg-blue-400/10'
    default: return 'text-slate-400 bg-slate-400/10'
  }
}

function getAvatarSrc(influencer: InfluencerResult): string | null {
  return getStorageUrl(influencer.local_avatar_path)
}

export default function SearchOverlay() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const totalResults = results
    ? results.formats.length + results.hooks.length + results.tactics.length + results.influencers.length
    : 0


  const search = useCallback(async (q: string) => {
    const trimmed = q.trim()
    const creatorMode = trimmed.startsWith('@')
    const searchQuery = creatorMode ? trimmed.slice(1).trim() : trimmed

    if (searchQuery.length < 2) {
      setResults(null)
      return
    }
    setLoading(true)
    try {
      const res = await authFetch(`/api/analysis/search?q=${encodeURIComponent(searchQuery)}&limit=5`)
      const data = await res.json()
      if (data.formats && data.hooks && data.tactics && data.influencers) {
        // Filter results based on search mode
        setResults(creatorMode
          ? { formats: [], hooks: [], tactics: [], influencers: data.influencers }
          : { formats: data.formats, hooks: data.hooks, tactics: data.tactics, influencers: [] }
        )
      } else {
        setResults(null)
      }
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Keyboard shortcut: Cmd/Ctrl+K to focus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const navigateTo = (path: string) => {
    navigate(path)
    setOpen(false)
    setQuery('')
    setResults(null)
    inputRef.current?.blur()
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      {/* Search Input */}
      <div className={`flex items-center gap-4 bg-white/5 border px-5 py-2.5 rounded-2xl transition-all ${open ? 'border-white/20 bg-white/[0.07]' : 'border-white/10'}`}>
        <i className={`fas fa-search text-sm ${open ? 'text-pink-400' : 'text-slate-500'} transition-colors`}></i>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Search formats, hooks, tactics or @creators..."
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-600 font-medium"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults(null) }}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <i className="fas fa-xmark text-xs"></i>
          </button>
        )}
        <kbd className="hidden lg:flex items-center gap-0.5 text-[10px] font-bold text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </div>

      {/* Results Dropdown */}
      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50 max-h-[70vh] overflow-y-auto dashboard-scrollbar">
          {loading && !results && (
            <div className="p-8 text-center">
              <i className="fas fa-spinner-third fa-spin text-pink-400 text-lg mb-2"></i>
              <p className="text-xs text-slate-500 font-bold">Searching...</p>
            </div>
          )}

          {results && totalResults === 0 && !loading && (
            <div className="p-8 text-center">
              <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-search text-slate-600"></i>
              </div>
              <p className="text-sm font-bold text-slate-400">No results found</p>
              <p className="text-xs text-slate-600 mt-1">Try a different search term</p>
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="py-2">
              {/* Formats */}
              {results.formats.length > 0 && (
                <div>
                  <div className="px-5 pt-3 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-shapes text-pink-400 text-[10px]"></i>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Formats</span>
                    </div>
                    <button
                      onClick={() => navigateTo('/dashboard/formats')}
                      className="text-[10px] font-bold text-slate-500 hover:text-pink-400 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {results.formats.map((f) => (
                    <button
                      key={`format-${f.id}`}
                      onClick={() => navigateTo(`/dashboard/formats/${f.id}`)}
                      className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                        {getFormatEmoji(f.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{f.name}</div>
                        {f.description && (
                          <div className="text-[11px] text-slate-500 truncate">{f.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-bold">Videos</div>
                          <div className="text-xs font-black text-white">{f.video_count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-bold">Eng.</div>
                          <div className="text-xs font-black text-teal-400">
                            {f.avg_engagement_rate ? Number(f.avg_engagement_rate).toFixed(1) + '%' : '--'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Hooks */}
              {results.hooks.length > 0 && (
                <div>
                  <div className="px-5 pt-3 pb-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-magnet text-amber-400 text-[10px]"></i>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hooks</span>
                    </div>
                    <button
                      onClick={() => navigateTo('/dashboard/hooks')}
                      className="text-[10px] font-bold text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {results.hooks.map((h) => (
                    <button
                      key={`hook-${h.id}`}
                      onClick={() => navigateTo(`/dashboard/hooks/${h.id}`)}
                      className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-base flex-shrink-0">
                        {getHookEmoji(h.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white truncate">{h.name}</div>
                        {(h.hook_technique || h.description) && (
                          <div className="text-[11px] text-slate-500 truncate">{h.hook_technique || h.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-bold">Videos</div>
                          <div className="text-xs font-black text-white">{h.video_count}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-slate-600 font-bold">Eng.</div>
                          <div className="text-xs font-black text-teal-400">
                            {h.avg_engagement_rate ? Number(h.avg_engagement_rate).toFixed(1) + '%' : '--'}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Tactics */}
              {results.tactics.length > 0 && (
                <div>
                  <div className="px-5 pt-3 pb-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-chess text-violet-400 text-[10px]"></i>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tactics</span>
                    </div>
                    <button
                      onClick={() => navigateTo('/dashboard/tactics')}
                      className="text-[10px] font-bold text-slate-500 hover:text-violet-400 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {results.tactics.map((t) => {
                    const score = Number(t.avg_execution_score) || 0
                    return (
                      <button
                        key={`tactic-${t.id}`}
                        onClick={() => navigateTo(`/dashboard/tactics/${t.id}`)}
                        className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                          <i className="fas fa-chess text-sm text-slate-400"></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">{t.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${categoryColors[t.category] || 'bg-slate-500/20 text-slate-400'}`}>
                              {t.category.replace(/_/g, ' ')}
                            </span>
                            {t.description && (
                              <span className="text-[11px] text-slate-500 truncate">{t.description}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-600 font-bold">Videos</div>
                            <div className="text-xs font-black text-white">{t.video_count}</div>
                          </div>
                          {score > 0 && (
                            <div className="text-right">
                              <div className="text-[10px] text-slate-600 font-bold">Score</div>
                              <div className={`text-xs font-black ${score >= 70 ? 'text-teal-400' : score >= 40 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                {Math.round(score)}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Influencers */}
              {results.influencers.length > 0 && (
                <div>
                  <div className="px-5 pt-3 pb-2 flex items-center justify-between border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-users text-cyan-400 text-[10px]"></i>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Influencers</span>
                    </div>
                    <button
                      onClick={() => navigateTo('/dashboard/influencers')}
                      className="text-[10px] font-bold text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      View All
                    </button>
                  </div>
                  {results.influencers.map((inf) => {
                    const avatar = getAvatarSrc(inf)
                    return (
                      <button
                        key={`influencer-${inf.id}`}
                        onClick={() => navigateTo(`/dashboard/influencers/${inf.id}`)}
                        className="w-full px-5 py-3 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                      >
                        <div className="relative flex-shrink-0">
                          {avatar ? (
                            <img
                              src={avatar}
                              alt={`@${inf.username}`}
                              className="w-9 h-9 rounded-xl object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500/20 to-orange-400/20 flex items-center justify-center border border-white/10">
                              <span className="text-sm font-black text-white/60">
                                {(inf.display_name || inf.username).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center border border-white/10">
                            <i className={`fab fa-${inf.platform === 'tiktok' ? 'tiktok' : 'instagram'} text-[7px] ${inf.platform === 'tiktok' ? 'text-white' : 'text-pink-400'}`}></i>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white truncate">
                              @{inf.display_name || inf.username}
                            </span>
                            {inf.is_verified && <i className="fas fa-check-circle text-blue-400 text-[10px] flex-shrink-0"></i>}
                            {inf.tier && (
                              <span className={`text-[8px] font-black uppercase px-1 py-0.5 rounded ${getTierColor(inf.tier)}`}>
                                {inf.tier}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 font-bold">@{inf.username}</div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-[10px] text-slate-600 font-bold">Followers</div>
                            <div className="text-xs font-black text-white">
                              {inf.follower_count ? formatNumber(inf.follower_count) : '--'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-600 font-bold">Eng.</div>
                            <div className="text-xs font-black text-teal-400">
                              {inf.avg_engagement_rate ? Number(inf.avg_engagement_rate).toFixed(1) + '%' : '--'}
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
