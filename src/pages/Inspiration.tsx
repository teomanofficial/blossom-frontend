import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'
import VideoDetailModal from '../components/VideoDetailModal'
import type {
  BusinessProfile,
  FilterBucket,
  InspirationFilters,
  InspirationItem,
  InspirationSort,
} from '../types/business'

const PAGE = 30

function formatCount(n: number | null): string {
  if (n == null) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const SORTS: { key: InspirationSort; label: string }[] = [
  { key: 'top', label: 'Top outliers' },
  { key: 'views', label: 'Most viewed' },
  { key: 'recent', label: 'Newest' },
  { key: 'shuffle', label: 'Surprise me' },
]

export default function Inspiration() {
  const navigate = useNavigate()
  const [profiles, setProfiles] = useState<BusinessProfile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [items, setItems] = useState<InspirationItem[]>([])
  const [filters, setFilters] = useState<InspirationFilters>({ formats: [], industries: [], platforms: [] })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [adaptingId, setAdaptingId] = useState<number | null>(null)
  const [openVideoId, setOpenVideoId] = useState<number | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [platform, setPlatform] = useState<string>('')
  const [format, setFormat] = useState<string>('') // format bucket key
  const [industry, setIndustry] = useState<string>('') // industry bucket key
  const [windowDays, setWindowDays] = useState<number>(0) // 0 = all time
  const [sort, setSort] = useState<InspirationSort>('top')
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 8))

  // Debounce search input.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => clearTimeout(t)
  }, [search])

  const buildQuery = useCallback(
    (offset: number) => {
      const p = new URLSearchParams()
      p.set('limit', String(PAGE))
      p.set('offset', String(offset))
      p.set('sort', sort)
      if (sort === 'shuffle') p.set('seed', seed)
      if (platform) p.set('platform', platform)
      if (format) p.set('format', format)
      if (industry) p.set('industry', industry)
      if (windowDays > 0) p.set('windowDays', String(windowDays))
      if (debouncedSearch) p.set('search', debouncedSearch)
      return p.toString()
    },
    [sort, seed, platform, format, industry, windowDays, debouncedSearch]
  )

  // Load profiles + filter options once.
  useEffect(() => {
    ;(async () => {
      try {
        const [pRes, fRes] = await Promise.all([
          authFetch('/api/business-profiles'),
          authFetch('/api/business-profiles/inspiration/filters'),
        ])
        if (pRes.ok) {
          const pData = await pRes.json()
          const ready: BusinessProfile[] = (pData.profiles || []).filter(
            (p: BusinessProfile) => p.status === 'ready'
          )
          setProfiles(ready)
          const active = ready.find((p) => p.is_active) || ready[0]
          setActiveId(active?.id ?? null)
        }
        if (fRes.ok) setFilters(await fRes.json())
      } catch {
        /* non-fatal */
      }
    })()
  }, [])

  // (Re)load the feed whenever filters change.
  const loadFeed = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/business-profiles/inspiration?${buildQuery(0)}`)
      if (!res.ok) throw new Error('feed_failed')
      const data = await res.json()
      const next: InspirationItem[] = data.items || []
      setItems(next)
      setHasMore(next.length >= PAGE)
    } catch {
      toast.error('Could not load inspiration')
    } finally {
      setLoading(false)
    }
  }, [buildQuery])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const res = await authFetch(`/api/business-profiles/inspiration?${buildQuery(items.length)}`)
      if (res.ok) {
        const data = await res.json()
        const next: InspirationItem[] = data.items || []
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.video_id))
          return [...prev, ...next.filter((n) => !seen.has(n.video_id))]
        })
        setHasMore(next.length >= PAGE)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [buildQuery, items.length, hasMore, loadingMore])

  // Infinite scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '600px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) || null,
    [profiles, activeId]
  )

  const handleAdapt = async (videoId: number) => {
    if (!activeId) {
      toast.error('Add and analyze a business first')
      navigate('/dashboard/business-studio')
      return
    }
    setAdaptingId(videoId)
    try {
      const res = await authFetch(`/api/business-profiles/${activeId}/adapt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceVideoId: videoId }),
      })
      if (res.status === 409) {
        toast.error('This video isn’t analyzed yet — try another one')
        return
      }
      if (res.status === 403) {
        toast.error('Adapting is a Creator-tier feature. Upgrade to use it.')
        return
      }
      if (!res.ok) {
        toast.error('Could not adapt this video')
        return
      }
      const script = await res.json()
      toast.success('Building your content playbook…')
      navigate(`/dashboard/playbook/${script.id}`)
    } catch {
      toast.error('Something went wrong')
    } finally {
      setAdaptingId(null)
    }
  }

  const resetShuffle = () => {
    setSeed(Math.random().toString(36).slice(2, 8))
    setSort('shuffle')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-5 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inspiration</h1>
          <p className="text-slate-400 text-sm mt-1">
            The biggest outliers across every niche on TikTok & Instagram. Pick anything — even
            something unrelated — and we’ll turn it into a full content playbook for your business.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard/analyze')}
            className="px-3 py-2 rounded-xl bg-white/[0.05] border border-white/[0.08] text-slate-200 text-sm font-bold hover:bg-white/[0.1] transition whitespace-nowrap"
            title="Analyze any TikTok/Instagram video by URL, then adapt it"
          >
            <i className="fas fa-link mr-1.5" />
            Import a video
          </button>
          {profiles.length > 0 && (
          <>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Adapt for
            </span>
            <select
              value={activeId ?? ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/50"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#0e0e14]">
                  {p.name || p.source_url}
                </option>
              ))}
            </select>
          </>
          )}
        </div>
      </div>

      {profiles.length === 0 && !loading && (
        <div className="glass-card rounded-3xl p-6 mb-6 border border-pink-500/30 bg-pink-500/[0.04] flex items-center justify-between gap-4">
          <p className="text-slate-200 text-sm">
            Add your business first so we know what niche to adapt these into.
          </p>
          <button
            onClick={() => navigate('/dashboard/business-studio')}
            className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400 whitespace-nowrap"
          >
            Add business
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div className="glass-card rounded-2xl p-3 mb-5 border border-white/[0.08] flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <i className="fas fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search captions, hooks, niches…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/50"
        >
          <option value="" className="bg-[#0e0e14]">All platforms</option>
          {filters.platforms.map((p) => (
            <option key={p} value={p} className="bg-[#0e0e14] capitalize">
              {p}
            </option>
          ))}
        </select>

        <select
          value={windowDays}
          onChange={(e) => setWindowDays(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/50"
        >
          <option value={0} className="bg-[#0e0e14]">All time</option>
          <option value={30} className="bg-[#0e0e14]">This month</option>
          <option value={7} className="bg-[#0e0e14]">This week</option>
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as InspirationSort)}
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-pink-500/50"
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key} className="bg-[#0e0e14]">
              {s.label}
            </option>
          ))}
        </select>

        <button
          onClick={resetShuffle}
          title="Shuffle"
          className="px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm hover:bg-white/[0.08] transition"
        >
          <i className="fas fa-shuffle" />
        </button>
      </div>

      {/* Format + industry buckets (single-select each, like SpyTok) */}
      {(filters.formats.length > 0 || filters.industries.length > 0) && (
        <div className="mb-5 space-y-2">
          {filters.formats.length > 0 && (
            <ChipRow
              label="Format"
              options={filters.formats}
              value={format}
              onChange={setFormat}
            />
          )}
          {filters.industries.length > 0 && (
            <ChipRow
              label="Industry"
              options={filters.industries}
              value={industry}
              onChange={setIndustry}
            />
          )}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[9/16] rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-white/[0.08]">
          <p className="text-slate-400">No videos match these filters. Try clearing them.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {items.map((it) => (
              <InspirationCard
                key={it.video_id}
                item={it}
                adapting={adaptingId === it.video_id}
                businessLabel={activeProfile?.name || null}
                onAdapt={() => handleAdapt(it.video_id)}
                onOpen={() => setOpenVideoId(it.video_id)}
              />
            ))}
          </div>
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
            {loadingMore && <i className="fas fa-spinner fa-spin text-slate-500" />}
            {!hasMore && items.length > 0 && (
              <span className="text-xs text-slate-600">That’s everything for these filters.</span>
            )}
          </div>
        </>
      )}

      {openVideoId != null && (
        <VideoDetailModal
          videoId={openVideoId}
          businessLabel={activeProfile?.name || null}
          adapting={adaptingId === openVideoId}
          onAdapt={(id) => handleAdapt(id)}
          onClose={() => setOpenVideoId(null)}
        />
      )}
    </div>
  )
}

function InspirationCard({
  item,
  adapting,
  businessLabel,
  onAdapt,
  onOpen,
}: {
  item: InspirationItem
  adapting: boolean
  businessLabel: string | null
  onAdapt: () => void
  onOpen: () => void
}) {
  const thumb = getStorageUrl(item.thumbnail_path)
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = thumb && !imgFailed

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
      <div className="aspect-[9/16] relative cursor-pointer" onClick={onOpen}>
        {showImg ? (
          <img
            src={thumb}
            alt={item.caption || 'inspiration'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgFailed(true)}
          />
        ) : (
          // Caption-forward placeholder so users still know what the video is.
          <div className="absolute inset-0 p-3 flex flex-col justify-between bg-gradient-to-br from-violet-900/30 to-pink-900/20">
            <i className="fas fa-clapperboard text-slate-500" />
            <p className="text-[11px] text-slate-300 line-clamp-5 leading-snug">
              {item.caption || 'No preview available'}
            </p>
          </div>
        )}

        {item.multiple != null && (
          <span className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-pink-500 text-white text-xs font-black">
            {item.multiple.toFixed(1)}x
          </span>
        )}
        {item.format_class && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-white text-[9px] font-bold uppercase tracking-wide max-w-[70%] truncate">
            {item.format_class}
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/85 to-transparent">
          {item.influencer_username && (
            <p className="text-white text-xs font-semibold truncate">@{item.influencer_username}</p>
          )}
          <p className="text-slate-300 text-[10px] truncate">
            {item.views != null ? `${formatCount(item.views)} views` : ''}
            {item.platform ? ` · ${item.platform}` : ''}
            {item.niche ? ` · ${item.niche}` : ''}
          </p>
        </div>
      </div>

      <div className="p-2">
        <button
          onClick={onAdapt}
          disabled={adapting}
          className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 hover:scale-[1.02] transition disabled:opacity-50 disabled:hover:scale-100"
        >
          {adapting ? (
            <i className="fas fa-spinner fa-spin" />
          ) : (
            <>
              <i className="fas fa-wand-magic-sparkles mr-1" />
              Adapt{businessLabel ? ` for ${truncate(businessLabel, 12)}` : ''}
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function ChipRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: FilterBucket[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 w-16 shrink-0">
        {label}
      </span>
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
          value === '' ? 'bg-pink-500 text-white' : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'
        }`}
      >
        All
      </button>
      {options
        .filter((o) => o.key !== 'other')
        .map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(value === o.key ? '' : o.key)}
            title={o.description}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              value === o.key
                ? 'bg-pink-500 text-white'
                : 'bg-white/[0.05] text-slate-300 hover:bg-white/[0.1]'
            }`}
          >
            {o.label}
          </button>
        ))}
    </div>
  )
}
