import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'

function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

interface Hashtag {
  id: number
  name: string
  platform: string
  platform_id: string | null
  platform_video_count: number
  platform_view_count: number
  created_at: string
  updated_at: string
}

const PAGE_SIZE = 50

export default function Hashtags() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [platform, setPlatform] = useState<string>('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search) params.set('search', search)
      if (platform) params.set('platform', platform)
      const res = await authFetch(`/api/analysis/hashtags?${params}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setHashtags(data.hashtags || [])
      setTotal(data.total || 0)
    } catch {
      toast.error('Failed to load hashtags')
    } finally {
      setLoading(false)
    }
  }, [page, search, platform])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(0) }, [search, platform])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-violet-500/10 text-violet-400 text-[10px] font-black uppercase tracking-widest rounded">
            Management
          </span>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tighter mb-2">Hashtags</h1>
            <p className="text-slate-500 text-sm font-medium">
              All discovered hashtags with platform stats.{' '}
              {total > 0 && <span className="text-slate-400">{total.toLocaleString()} hashtags</span>}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Platform filter */}
            <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
              {[
                { value: '', label: 'All' },
                { value: 'tiktok', label: 'TikTok' },
                { value: 'instagram', label: 'Instagram' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPlatform(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    platform === opt.value
                      ? 'bg-pink-500/20 text-pink-400'
                      : 'text-slate-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search hashtags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50 w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : hashtags.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-hashtag text-violet-400 text-xl" />
          </div>
          <h3 className="text-lg font-black mb-2">No Hashtags Found</h3>
          <p className="text-sm text-slate-500">
            {search ? 'Try a different search term.' : 'Hashtags will appear here as videos are discovered.'}
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">#</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hashtag</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Platform</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Videos</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Views</th>
                  <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Added</th>
                </tr>
              </thead>
              <tbody>
                {hashtags.map((h, i) => (
                  <tr key={h.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-bold">{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-white">#{h.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        h.platform === 'tiktok'
                          ? 'bg-cyan-500/10 text-cyan-400'
                          : 'bg-pink-500/10 text-pink-400'
                      }`}>
                        <i className={h.platform === 'tiktok' ? 'fab fa-tiktok' : 'fab fa-instagram'} />
                        {h.platform === 'tiktok' ? 'TikTok' : 'Instagram'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-black text-white">{fmt(h.platform_video_count)}</td>
                    <td className="px-5 py-3 text-right font-bold text-slate-400">{fmt(h.platform_view_count)}</td>
                    <td className="px-5 py-3 text-right text-slate-500 text-xs">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-slate-500 font-medium">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <i className="fas fa-chevron-left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let p: number
                  if (totalPages <= 7) {
                    p = i
                  } else if (page < 4) {
                    p = i
                  } else if (page > totalPages - 5) {
                    p = totalPages - 7 + i
                  } else {
                    p = page - 3 + i
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-white/5 text-slate-500 hover:text-white'
                      }`}
                    >
                      {p + 1}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
