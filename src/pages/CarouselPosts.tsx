import { useEffect, useState, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'
import html2canvas from 'html2canvas'
import { authFetch } from '../lib/api'
import { getStorageUrl } from '../lib/media'

/* ── Constants ── */
const ASPECT_RATIOS = [
  { key: '9:16', label: '9:16', w: 1080, h: 1920 },
  { key: '4:5', label: '4:5', w: 1080, h: 1350 },
  { key: '1:1', label: '1:1', w: 1080, h: 1080 },
] as const

type AspectKey = (typeof ASPECT_RATIOS)[number]['key']

const CAROUSEL_TYPES = [
  { key: 'hooks', label: 'Hooks', icon: 'fa-comment-dots' },
  { key: 'formats', label: 'Formats', icon: 'fa-shapes' },
  { key: 'songs', label: 'Songs', icon: 'fa-music' },
  { key: 'content', label: 'Content', icon: 'fa-layer-group' },
] as const

type CarouselType = (typeof CAROUSEL_TYPES)[number]['key']

/* ── Interfaces (matching /api/trends/overview response) ── */
interface TrendingFormat {
  id: number; name: string; description: string | null
  avg_views: number; avg_engagement_rate: number
  total_video_count: number; recent_video_count: number; recent_avg_views: number
}
interface TrendingHook {
  id: number; name: string; description: string | null; hook_technique: string | null
  avg_views: number; avg_engagement_rate: number
  total_video_count: number; recent_video_count: number; recent_avg_views: number
}
interface TrendingContent {
  id: number; name: string; category: string; description: string | null; icon: string | null
  total_video_count: number; recent_video_count: number
  recent_avg_views: number; recent_avg_engagement: number
  sample_thumbnails: string[] | null
}
interface TrendingSong {
  id: number; title: string; artist: string | null; album: string | null
  cover_url: string | null; local_cover_path: string | null
  play_url: string | null; local_audio_path: string | null
  platform: string; is_original: boolean; duration_sec: number | null
  total_video_count: number; total_views: number; avg_views: number
  recent_video_count: number; recent_avg_views: number
  trending_score: number; count_3h: number; count_24h: number; count_7d: number; velocity: number
}
interface TrendingPost {
  id: number; platform: string; username: string
  thumbnail_url: string | null; local_thumbnail_path: string | null
  caption: string | null; views: number; likes: number
  engagement_rate: number; final_viral_probability: number | null
}
interface OverviewData {
  posts: { items: TrendingPost[]; total: number }
  formats: { items: TrendingFormat[]; total: number }
  hooks: { items: TrendingHook[]; total: number }
  contents: { items: TrendingContent[]; total: number }
  songs: { items: TrendingSong[]; total: number }
  days: number
}

/* ── Helpers ── */
function num(v: unknown): number {
  return Number(v) || 0
}

function fmt(n: number | string | null | undefined): string {
  const v = num(n)
  if (!v) return '0'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(v))
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function titleForType(type: CarouselType): string {
  switch (type) {
    case 'hooks': return "Today's Top Hooks"
    case 'formats': return "Today's Top Formats"
    case 'songs': return 'Trending Songs'
    case 'content': return 'Popular Content'
  }
}

function subtitleForType(type: CarouselType): string {
  switch (type) {
    case 'hooks': return 'The hooks driving virality right now'
    case 'formats': return 'Content formats blowing up today'
    case 'songs': return 'Sounds taking over the FYP'
    case 'content': return 'What the internet is talking about'
  }
}

function brief(text: string | null, max = 80): string | null {
  if (!text) return null
  // Take first sentence or truncate
  const firstSentence = text.split(/[.!?]/)[0]
  const s = firstSentence.length <= max ? firstSentence : firstSentence.slice(0, max)
  return s.trim() + (s.length < text.length ? '...' : '')
}

function getSongCover(song: TrendingSong): string | null {
  return getStorageUrl(song.local_cover_path) || song.cover_url
}

function getTopicThumbnail(thumbs: string[] | null, idx: number): string | null {
  if (!thumbs || !thumbs[idx]) return null
  return getStorageUrl(thumbs[idx])
}

/* ── Shared Slide Styles ── */
function slideBase(w: number, h: number): React.CSSProperties {
  return {
    width: w,
    height: h,
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  }
}

function gradientBg(w: number, h: number): React.CSSProperties {
  return {
    ...slideBase(w, h),
    background: 'linear-gradient(145deg, #1a0a2e 0%, #16213e 30%, #0a0a0f 60%, #1a0520 100%)',
  }
}

function darkBg(w: number, h: number): React.CSSProperties {
  return {
    ...slideBase(w, h),
    background: '#0a0a0f',
  }
}

interface SlideDims { w: number; h: number }

/* ── Cover Slide ── */
function CoverSlide({ type, size }: { type: CarouselType; size: SlideDims }) {
  return (
    <div style={gradientBg(size.w, size.h)}>
      {/* Decorative gradient orbs */}
      <div style={{
        position: 'absolute', top: -200, right: -200, width: 600, height: 600,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: -150, left: -150, width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
      }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: 80, textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <img
          src="/logo-light.png"
          alt="Blossom"
          style={{ width: 120, height: 120, marginBottom: 60, objectFit: 'contain' }}
        />

        <div style={{
          fontSize: 36, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
          textTransform: 'uppercase', letterSpacing: 8, marginBottom: 30,
        }}>
          blossom
        </div>

        <div style={{
          fontSize: 72, fontWeight: 900, color: '#fff',
          lineHeight: 1.1, marginBottom: 30, maxWidth: 900,
        }}>
          {titleForType(type)}
        </div>

        <div style={{
          fontSize: 32, color: 'rgba(255,255,255,0.6)',
          fontWeight: 500, marginBottom: 50, maxWidth: 800,
        }}>
          {subtitleForType(type)}
        </div>

        <div style={{
          width: 80, height: 4, borderRadius: 2,
          background: 'linear-gradient(90deg, #ec4899, #f97316)',
          marginBottom: 50,
        }} />

        <div style={{
          fontSize: 28, color: 'rgba(255,255,255,0.4)', fontWeight: 600,
          letterSpacing: 3, textTransform: 'uppercase',
        }}>
          {todayFormatted()}
        </div>
      </div>
    </div>
  )
}

/* ── Items Slide — Hooks ── */
function HooksItemsSlide({ items, size }: { items: TrendingHook[]; size: SlideDims }) {
  return (
    <div style={darkBg(size.w, size.h)}>
      <SlideHeader title="Top Hooks" />
      <div style={{ padding: '0 60px' }}>
        {items.slice(0, 5).map((h, i) => (
          <ItemRow key={h.id} rank={i + 1}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                {h.name}
              </div>
              {brief(h.description) && (
                <div style={{
                  fontSize: 20, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3,
                  marginBottom: 8,
                }}>
                  {brief(h.description)}
                </div>
              )}
              {h.hook_technique && (
                <div style={{
                  display: 'inline-block', padding: '4px 14px', borderRadius: 20,
                  background: 'rgba(236,72,153,0.15)', color: '#f472b6',
                  fontSize: 18, fontWeight: 600,
                }}>
                  {h.hook_technique}
                </div>
              )}
            </div>
            <StatsColumn stats={[
              { value: fmt(h.recent_avg_views), label: 'avg views' },
              { value: num(h.avg_engagement_rate).toFixed(1) + '%', label: 'eng. rate' },
            ]} />
          </ItemRow>
        ))}
      </div>
      <SlideWatermark />
    </div>
  )
}

/* ── Items Slide — Formats ── */
function FormatsItemsSlide({ items, size }: { items: TrendingFormat[]; size: SlideDims }) {
  return (
    <div style={darkBg(size.w, size.h)}>
      <SlideHeader title="Top Formats" />
      <div style={{ padding: '0 60px' }}>
        {items.slice(0, 5).map((f, i) => (
          <ItemRow key={f.id} rank={i + 1}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                {f.name}
              </div>
              {brief(f.description) && (
                <div style={{
                  fontSize: 20, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3,
                }}>
                  {brief(f.description)}
                </div>
              )}
            </div>
            <StatsColumn stats={[
              { value: fmt(f.recent_avg_views), label: 'avg views' },
              { value: num(f.avg_engagement_rate).toFixed(1) + '%', label: 'eng. rate' },
            ]} />
          </ItemRow>
        ))}
      </div>
      <SlideWatermark />
    </div>
  )
}

/* ── Items Slide — Songs ── */
function SongsItemsSlide({ items, size }: { items: TrendingSong[]; size: SlideDims }) {
  return (
    <div style={darkBg(size.w, size.h)}>
      <SlideHeader title="Trending Songs" />
      <div style={{ padding: '0 60px' }}>
        {items.slice(0, 5).map((s, i) => {
          const cover = getSongCover(s)
          return (
            <ItemRow key={s.id} rank={i + 1}>
              {cover ? (
                <img
                  crossOrigin="anonymous"
                  src={cover}
                  alt=""
                  style={{
                    width: 90, height: 90, borderRadius: 16,
                    objectFit: 'cover', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: 16,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, flexShrink: 0,
                }}>
                  🎵
                </div>
              )}
              <div style={{ flex: 1, marginLeft: 20 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                  {s.title}
                </div>
                <div style={{ fontSize: 22, color: 'rgba(255,255,255,0.5)' }}>
                  {s.artist || 'Unknown Artist'}
                </div>
              </div>
              <StatsColumn stats={[
                { value: fmt(s.recent_avg_views), label: 'avg views' },
                { value: fmt(s.recent_video_count), label: 'uses' },
              ]} />
            </ItemRow>
          )
        })}
      </div>
      <SlideWatermark />
    </div>
  )
}

/* ── Items Slide — Content (Domains) ── */
function ContentItemsSlide({ items, size }: { items: TrendingContent[]; size: SlideDims }) {
  return (
    <div style={darkBg(size.w, size.h)}>
      <SlideHeader title="Popular Content" />
      <div style={{ padding: '0 60px' }}>
        {items.slice(0, 5).map((t, i) => {
          const thumb = getTopicThumbnail(t.sample_thumbnails, 0)
          return (
            <ItemRow key={t.id} rank={i + 1}>
              {thumb ? (
                <img
                  crossOrigin="anonymous"
                  src={thumb}
                  alt=""
                  style={{
                    width: 90, height: 90, borderRadius: 16,
                    objectFit: 'cover', flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: 90, height: 90, borderRadius: 16,
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, flexShrink: 0,
                }}>
                  <img src="/logo-light.png" alt="" style={{ width: 36, height: 36, opacity: 0.4 }} />
                </div>
              )}
              <div style={{ flex: 1, marginLeft: 20, minWidth: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#fff', marginBottom: 6, lineHeight: 1.3 }}>
                  {t.name}
                </div>
                {brief(t.description) && (
                  <div style={{
                    fontSize: 20, color: 'rgba(255,255,255,0.4)', lineHeight: 1.3,
                  }}>
                    {brief(t.description)}
                  </div>
                )}
              </div>
              <StatsColumn stats={[
                { value: fmt(t.recent_avg_views), label: 'avg views' },
                { value: num(t.recent_avg_engagement).toFixed(1) + '%', label: 'eng. rate' },
              ]} />
            </ItemRow>
          )
        })}
      </div>
      <SlideWatermark />
    </div>
  )
}

/* ── CTA Slide ── */
function CTASlide({ size }: { size: SlideDims }) {
  return (
    <div style={gradientBg(size.w, size.h)}>
      {/* Decorative orbs */}
      <div style={{
        position: 'absolute', top: 200, left: -100, width: 400, height: 400,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 300, right: -100, width: 500, height: 500,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(249,115,22,0.1) 0%, transparent 70%)',
      }} />

      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: 80, textAlign: 'center',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontSize: 68, fontWeight: 900, color: '#fff',
          lineHeight: 1.15, marginBottom: 30, maxWidth: 850,
        }}>
          Want to Go Viral?
        </div>

        <div style={{
          fontSize: 32, color: 'rgba(255,255,255,0.6)',
          fontWeight: 500, lineHeight: 1.5, marginBottom: 60, maxWidth: 750,
        }}>
          Discover what's trending before everyone else.
          Get AI-powered content insights daily.
        </div>

        {/* CTA button */}
        <div style={{
          padding: '24px 64px', borderRadius: 60,
          background: 'linear-gradient(135deg, #ec4899, #f97316)',
          fontSize: 32, fontWeight: 800, color: '#fff',
          marginBottom: 60, boxShadow: '0 15px 40px rgba(236,72,153,0.35)',
        }}>
          Try Blossom Free
        </div>

        <div style={{
          width: 80, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.15)',
          marginBottom: 50,
        }} />

        <img src="/logo-light.png" alt="Blossom" style={{ width: 60, height: 60, opacity: 0.6, marginBottom: 20, objectFit: 'contain' }} />
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.7)', fontWeight: 700, marginBottom: 16 }}>
          www.blossai.com
        </div>
        <div style={{ fontSize: 26, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          @bloss.ai
        </div>
      </div>
    </div>
  )
}

/* ── Shared Sub-components for Item Slides ── */
function SlideHeader({ title }: { title: string }) {
  return (
    <div style={{
      padding: '60px 60px 40px', display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <img src="/logo-light.png" alt="" style={{ width: 36, height: 36, opacity: 0.6 }} />
      <div style={{ fontSize: 38, fontWeight: 800, color: '#fff', letterSpacing: 1 }}>
        {title}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{
        fontSize: 22, color: 'rgba(255,255,255,0.35)', fontWeight: 600,
        letterSpacing: 2, textTransform: 'uppercase',
      }}>
        {todayFormatted()}
      </div>
    </div>
  )
}

function ItemRow({ rank, children }: { rank: number; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 20,
      padding: '28px 30px', marginBottom: 16, borderRadius: 24,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 16,
        background: rank <= 3 ? 'rgba(236,72,153,0.18)' : 'rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, fontWeight: 800,
        color: rank <= 3 ? '#f472b6' : 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        {rank}
      </div>
      {children}
    </div>
  )
}

function StatsColumn({ stats }: { stats: { value: string; label: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 24, flexShrink: 0 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ textAlign: 'center', minWidth: 70 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f472b6' }}>{s.value}</div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function SlideWatermark() {
  return (
    <div style={{
      position: 'absolute', bottom: 40, left: 0, right: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <img src="/logo-light.png" alt="" style={{ width: 24, height: 24, opacity: 0.25 }} />
      <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: 3, textTransform: 'uppercase' }}>
        blossom
      </span>
    </div>
  )
}

/* ── Preview Wrapper ── */
function SlidePreview({
  slideRef,
  label,
  children,
  onDownload,
  onExpand,
  exporting,
  slideW,
  slideH,
  previewScale,
}: {
  slideRef: React.RefObject<HTMLDivElement | null>
  label: string
  children: React.ReactNode
  onDownload: () => void
  onExpand: () => void
  exporting: boolean
  slideW: number
  slideH: number
  previewScale: number
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</div>
      <div
        className="cursor-pointer group relative"
        onClick={onExpand}
        style={{
          width: slideW * previewScale,
          height: slideH * previewScale,
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
          <div ref={slideRef}>{children}</div>
        </div>
        {/* Expand overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <i className="fas fa-expand text-white/0 group-hover:text-white/80 text-lg transition-colors" />
        </div>
      </div>
      <button
        onClick={onDownload}
        disabled={exporting}
        className="text-xs text-slate-400 hover:text-pink-400 transition-colors disabled:opacity-30"
      >
        <i className="fas fa-download mr-1" /> Download
      </button>
    </div>
  )
}

/* ── Expanded Slide Modal ── */
function ExpandedSlideModal({
  children,
  onClose,
  slideW,
  slideH,
}: {
  children: React.ReactNode
  onClose: () => void
  slideW: number
  slideH: number
}) {
  const MODAL_SCALE = Math.min(0.5, window.innerHeight * 0.8 / slideH)
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()} className="relative">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm font-bold"
        >
          <i className="fas fa-times mr-1" /> Close
        </button>
        <div
          style={{
            width: slideW * MODAL_SCALE,
            height: slideH * MODAL_SCALE,
            overflow: 'hidden',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ transform: `scale(${MODAL_SCALE})`, transformOrigin: 'top left' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════════ */
export default function CarouselPosts() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<CarouselType>('hooks')
  const [exporting, setExporting] = useState(false)
  const [days, setDays] = useState(1)
  const [expandedSlide, setExpandedSlide] = useState<'cover' | 'items' | 'cta' | null>(null)
  const [aspect, setAspect] = useState<AspectKey>('9:16')

  const ar = ASPECT_RATIOS.find(a => a.key === aspect)!
  const SLIDE_W = ar.w
  const SLIDE_H = ar.h
  const PREVIEW_SCALE = aspect === '9:16' ? 0.25 : aspect === '4:5' ? 0.28 : 0.32

  const coverRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef<HTMLDivElement | null>(null)
  const ctaRef = useRef<HTMLDivElement | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await authFetch(`/api/trends/overview?days=${days}`)
      if (!res.ok) throw new Error(`API returned ${res.status}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
    } catch {
      toast.error('Failed to load trends data')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  /* ── Export helpers ── */
  async function downloadSlide(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    if (!ref.current) return

    // Clone the slide at full size into an off-screen container so html2canvas
    // captures it at 1080x1920 instead of the scaled-down preview size.
    const clone = ref.current.cloneNode(true) as HTMLDivElement
    clone.style.position = 'fixed'
    clone.style.left = '-9999px'
    clone.style.top = '0'
    clone.style.width = `${SLIDE_W}px`
    clone.style.height = `${SLIDE_H}px`
    clone.style.transform = 'none'
    clone.style.zIndex = '-1'
    document.body.appendChild(clone)

    try {
      await document.fonts.ready
      // Wait a tick for images to settle in cloned DOM
      await new Promise(r => setTimeout(r, 100))

      const canvas = await html2canvas(clone, {
        width: SLIDE_W,
        height: SLIDE_H,
        scale: 1,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = filename
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      document.body.removeChild(clone)
    }
  }

  async function downloadAll() {
    setExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      const prefix = `blossom-${activeType}`
      await downloadSlide(coverRef, `${prefix}-cover-${date}.png`)
      await downloadSlide(itemsRef, `${prefix}-items-${date}.png`)
      await downloadSlide(ctaRef, `${prefix}-cta-${date}.png`)
      toast.success('All slides downloaded!')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function downloadSingle(ref: React.RefObject<HTMLDivElement | null>, suffix: string) {
    setExporting(true)
    try {
      const date = new Date().toISOString().split('T')[0]
      await downloadSlide(ref, `blossom-${activeType}-${suffix}-${date}.png`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const size = { w: SLIDE_W, h: SLIDE_H }

  /* ── Get items for active type ── */
  function getItemsSlide() {
    if (!data) return null
    switch (activeType) {
      case 'hooks': return <HooksItemsSlide items={data.hooks.items} size={size} />
      case 'formats': return <FormatsItemsSlide items={data.formats.items} size={size} />
      case 'songs': return <SongsItemsSlide items={data.songs.items} size={size} />
      case 'content': {
        const items = data.contents.items
        return items.length ? <ContentItemsSlide items={items} size={size} /> : <EmptyItemsSlide type="content" size={size} />
      }
    }
  }

  function hasItems(): boolean {
    if (!data) return false
    switch (activeType) {
      case 'hooks': return data.hooks.items.length > 0
      case 'formats': return data.formats.items.length > 0
      case 'songs': return data.songs.items.length > 0
      case 'content': return data.contents.items.length > 0
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Carousel Posts</h1>
          <p className="text-sm text-slate-500 mt-1">Generate social media carousels from today's trending data</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Days selector */}
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
            {[1, 7, 30].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  days === d ? 'bg-pink-500/20 text-pink-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {d === 1 ? 'Today' : `${d}d`}
              </button>
            ))}
          </div>
          <button
            onClick={downloadAll}
            disabled={exporting || !hasItems()}
            className="glow-button px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-30"
          >
            {exporting ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <i className="fas fa-download" />
            )}
            Download All
          </button>
        </div>
      </div>

      {/* Type Selector + Aspect Ratio */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {CAROUSEL_TYPES.map(ct => (
            <button
              key={ct.key}
              onClick={() => setActiveType(ct.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeType === ct.key
                  ? 'bg-pink-500/20 text-pink-400 ring-1 ring-pink-500/30'
                  : 'bg-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/8'
              }`}
            >
              <i className={`fas ${ct.icon} text-[10px]`} />
              {ct.label}
            </button>
          ))}
        </div>
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
          {ASPECT_RATIOS.map(a => (
            <button
              key={a.key}
              onClick={() => setAspect(a.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                aspect === a.key ? 'bg-pink-500/20 text-pink-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slide Previews */}
      {data && (
        <div className="flex flex-wrap justify-center gap-6 xl:gap-8">
          <SlidePreview
            slideRef={coverRef}
            label="Cover"
            onDownload={() => downloadSingle(coverRef, 'cover')}
            onExpand={() => setExpandedSlide('cover')}
            exporting={exporting}
            slideW={SLIDE_W}
            slideH={SLIDE_H}
            previewScale={PREVIEW_SCALE}
          >
            <CoverSlide type={activeType} size={size} />
          </SlidePreview>

          <SlidePreview
            slideRef={itemsRef}
            label="Top Items"
            onDownload={() => downloadSingle(itemsRef, 'items')}
            onExpand={() => setExpandedSlide('items')}
            exporting={exporting}
            slideW={SLIDE_W}
            slideH={SLIDE_H}
            previewScale={PREVIEW_SCALE}
          >
            {getItemsSlide()}
          </SlidePreview>

          <SlidePreview
            slideRef={ctaRef}
            label="Call to Action"
            onDownload={() => downloadSingle(ctaRef, 'cta')}
            onExpand={() => setExpandedSlide('cta')}
            exporting={exporting}
            slideW={SLIDE_W}
            slideH={SLIDE_H}
            previewScale={PREVIEW_SCALE}
          >
            <CTASlide size={size} />
          </SlidePreview>
        </div>
      )}

      {/* Expanded slide modal (not part of export) */}
      {expandedSlide && data && (
        <ExpandedSlideModal onClose={() => setExpandedSlide(null)} slideW={SLIDE_W} slideH={SLIDE_H}>
          {expandedSlide === 'cover' && <CoverSlide type={activeType} size={size} />}
          {expandedSlide === 'items' && getItemsSlide()}
          {expandedSlide === 'cta' && <CTASlide size={size} />}
        </ExpandedSlideModal>
      )}

      {/* No data state */}
      {data && !hasItems() && (
        <div className="text-center py-10">
          <div className="text-slate-500 text-sm">
            No trending {activeType} found for the selected period.
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Empty Items Slide ── */
function EmptyItemsSlide({ type, size }: { type: string; size: SlideDims }) {
  return (
    <div style={darkBg(size.w, size.h)}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100%', padding: 80,
      }}>
        <img src="/logo-light.png" alt="" style={{ width: 64, height: 64, opacity: 0.2, marginBottom: 30 }} />
        <div style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
          No trending {type} today
        </div>
      </div>
    </div>
  )
}
