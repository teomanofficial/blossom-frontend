/**
 * PostMortem — dedicated forensic page at `/dashboard/post-mortem/:videoId`.
 *
 * This is the #1 wedge feature: emotional clarity + actionable
 * prescriptions for "why did this video flop?". Layout designed so
 * the headline finding (DivergedVariableCard) sits above the fold
 * on every viewport.
 *
 * Backend: `POST /api/insights/tier2/post-mortem` body `{ video_id }`
 *   returning a `PostMortemResponse`. Owned by BE3 (Stage 2). When
 *   the backend returns 501 (BE3 not yet shipped), we fall back to
 *   a dev-only mock from `lib/mockPostMortem.ts` and surface a
 *   "Showing mock data" banner. Production users with a real 501
 *   see the empty/coming-soon state instead.
 */

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useInsights } from '../lib/useInsights'
import { buildMockPostMortem } from '../lib/mockPostMortem'
import type { PostMortemResponse } from '../types/insights'

import LockedWidget from '../components/insights/shared/LockedWidget'
import VideoMetaHeader from '../components/postmortem/VideoMetaHeader'
import VideoSelector from '../components/postmortem/VideoSelector'
import DivergedVariableCard from '../components/postmortem/DivergedVariableCard'
import HitsComparison from '../components/postmortem/HitsComparison'
import NichePercentileRing from '../components/postmortem/NichePercentileRing'
import MissingTacticsList from '../components/postmortem/MissingTacticsList'
import RetentionCurveOverlay from '../components/postmortem/RetentionCurveOverlay'
import PrescriptionsList from '../components/postmortem/PrescriptionsList'

/**
 * Probe the user's analyzed-video count so we can offer a friendlier
 * "you need more videos" empty state. Light, single fetch, no cache —
 * fires once when the page mounts.
 */
function useAnalyzedVideoCount(): { count: number | null; loading: boolean } {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await authFetch('/api/content-analysis?limit=1&offset=0')
        if (!res.ok) throw new Error(`API ${res.status}`)
        const data = await res.json()
        if (cancelled) return
        const total =
          typeof data?.total === 'number'
            ? data.total
            : Array.isArray(data?.uploads)
              ? data.uploads.length
              : 0
        setCount(total)
      } catch {
        if (!cancelled) setCount(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])
  return { count, loading }
}

/**
 * Empty-state envelope the backend returns (200 + body) when it has
 * nothing to diagnose — target missing, no analysis, fewer than 3 hits,
 * or no diverged variable. Distinct from the success shape which has
 * `video`, `diverged_variable`, etc.
 */
type PostMortemEnvelope = { data: null; reason: string }
type PostMortemApiBody = PostMortemResponse | PostMortemEnvelope

function isEmptyEnvelope(body: PostMortemApiBody | null): body is PostMortemEnvelope {
  return Boolean(
    body &&
      typeof body === 'object' &&
      'data' in body &&
      (body as { data: unknown }).data === null,
  )
}

function isValidPostMortem(
  body: PostMortemApiBody | null,
): body is PostMortemResponse {
  // Defensive: trust the type contract but verify the load-bearing field
  // so a partial response can't crash the page.
  return Boolean(body && typeof body === 'object' && 'video' in body && (body as PostMortemResponse).video)
}

/**
 * Decide what to render given the API state + dev mode + video id.
 * Returns either real data, mock data (with banner), or a friendly
 * non-error empty state.
 */
function useResolvedPostMortem(
  videoId: string | undefined,
): {
  data: PostMortemResponse | null
  loading: boolean
  source: 'real' | 'mock' | 'none'
  error: string | null
  reason: string | null
  retry: () => void
} {
  const { data: rawData, loading, error, retry } = useInsights<PostMortemApiBody>(
    'tier2/post-mortem',
    {
      method: 'POST',
      body: { video_id: videoId },
      enabled: Boolean(videoId),
    },
  )

  const envelopeReason = isEmptyEnvelope(rawData) ? rawData.reason : null
  const data = isValidPostMortem(rawData) ? rawData : null

  // Use mock data when:
  //   1. We're in dev mode
  //   2. The backend returned an error, an empty envelope, or no data
  //   3. We have a videoId to attach the mock to
  if (videoId && data) {
    return { data, loading: false, source: 'real', error: null, reason: null, retry }
  }
  if (videoId && !loading && (error || !data)) {
    if (import.meta.env.DEV) {
      return {
        data: buildMockPostMortem(videoId),
        loading: false,
        source: 'mock',
        error,
        reason: envelopeReason,
        retry,
      }
    }
    return { data: null, loading: false, source: 'none', error, reason: envelopeReason, retry }
  }
  return { data: null, loading, source: 'none', error: null, reason: null, retry }
}

function PageHeader({
  videoId,
  rightSlot,
}: {
  videoId: string
  rightSlot: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors"
        >
          <i className="fas fa-arrow-left text-[10px]" />
          Back to dashboard
        </Link>
        <div className="text-[10px] font-bold text-slate-600 truncate max-w-[60%]">
          Video <span className="font-mono">{videoId}</span>
        </div>
      </div>
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            <span className="gradient-text font-display">Forensics</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide uppercase mt-1">
            Why this one didn&apos;t hit — and exactly what to fix.
          </p>
        </div>
        {rightSlot}
      </div>
    </div>
  )
}

function MockDataBanner({ retry }: { retry: () => void }) {
  return (
    <div className="mb-4 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-start gap-2.5 min-w-0">
        <i className="fas fa-flask text-amber-300 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-widest text-amber-200">
            Showing mock data
          </div>
          <div className="text-[11px] text-amber-100/80 mt-0.5">
            Backend post-mortem endpoint isn&apos;t live yet. This is realistic placeholder
            data so you can preview the experience.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={retry}
        className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-200 transition-colors shrink-0"
      >
        <i className="fas fa-rotate-right mr-1.5 text-[9px]" />
        Try real data
      </button>
    </div>
  )
}

function NotEnoughVideosBanner({ count }: { count: number }) {
  return (
    <div className="mb-6 px-4 py-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-start gap-3">
      <i className="fas fa-circle-info text-blue-300 text-sm mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="text-xs font-black uppercase tracking-widest text-blue-200 mb-1">
          Forensics gets sharper with more data
        </div>
        <p className="text-[12px] text-blue-100/80 leading-relaxed">
          You have <span className="font-bold text-white">{count}</span> analyzed video
          {count === 1 ? '' : 's'}. Analyze at least <span className="font-bold">3</span>{' '}
          of your own posts to unlock per-video diagnostics — we need enough of your hits
          to baseline against.
        </p>
        <Link
          to="/dashboard/analyze"
          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-black text-blue-300 hover:text-blue-200 uppercase tracking-widest transition-colors"
        >
          Analyze a video <i className="fas fa-arrow-right text-[10px]" />
        </Link>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-3xl p-6 animate-pulse">
        <div className="h-4 w-32 bg-white/5 rounded mb-3" />
        <div className="h-8 w-2/3 bg-white/5 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-white/5 rounded-2xl" />
          <div className="h-20 bg-white/5 rounded-2xl" />
          <div className="h-20 bg-white/5 rounded-2xl" />
        </div>
      </div>
      <div className="rounded-3xl bg-white/[0.04] border border-white/[0.06] p-6 sm:p-8 animate-pulse">
        <div className="h-3 w-28 bg-white/5 rounded mb-3" />
        <div className="h-10 w-3/4 bg-white/5 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-16 bg-white/5 rounded-2xl" />
          <div className="h-16 bg-white/5 rounded-2xl" />
          <div className="h-16 bg-white/5 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

function emptyStateMessage(reason: string | null, error: string | null): string {
  if (reason === 'insufficient_hits') {
    return "We need at least 3 of your hit posts to baseline against before we can autopsy this one. Analyze a few more of your top performers and try again."
  }
  if (reason) {
    return `Nothing to diagnose yet (${reason}). The forensic analyzer needs a baseline of your hits to compare against.`
  }
  if (error) {
    return `${error}. The forensic analyzer needs a baseline of your hits to compare against — try again once a few more of your posts are analyzed.`
  }
  return 'The post-mortem service is coming soon. Once it ships, this page will fill with your diagnostic.'
}

function EmptyState({ message, icon }: { message: string; icon: string }) {
  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
        <i className={`fas ${icon} text-slate-500 text-xl`} />
      </div>
      <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">
        We can&apos;t autopsy this video yet
      </h2>
      <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">{message}</p>
      <Link
        to="/dashboard"
        className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-black text-pink-400 hover:text-pink-300 uppercase tracking-widest transition-colors"
      >
        <i className="fas fa-arrow-left text-[10px]" />
        Back to dashboard
      </Link>
    </div>
  )
}

function PostMortemLockedPage() {
  return (
    <div>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-white transition-colors mb-6"
      >
        <i className="fas fa-arrow-left text-[10px]" />
        Back to dashboard
      </Link>
      <LockedWidget
        requiredPlan="premium"
        tier="flagship"
        widgetTitle="Forensics"
        variant="page"
      />
    </div>
  )
}

export default function PostMortem() {
  const { planSlug, userType, loading: authLoading } = useAuth()
  const isAdmin = userType === 'admin'
  const hasFlagshipAccess =
    isAdmin || planSlug === 'premium' || planSlug === 'platin'
  if (!authLoading && !hasFlagshipAccess) {
    return <PostMortemLockedPage />
  }
  return <PostMortemInner />
}

function PostMortemInner() {
  const { videoId } = useParams<{ videoId: string }>()

  const videoCount = useAnalyzedVideoCount()
  const resolved = useResolvedPostMortem(videoId)

  if (!videoId || videoId.trim().length === 0) {
    return (
      <div>
        <PageHeader
          videoId="—"
          rightSlot={<VideoSelector currentVideoId="" />}
        />
        <div className="glass-card rounded-3xl p-8 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-magnifying-glass-chart text-purple-300 text-xl" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-slate-200 mb-2">
            Pick a video to autopsy
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed mb-5">
            Use the dropdown above to choose one of your analyzed posts. We&apos;ll show
            you exactly what diverged from your hits — and what to fix.
          </p>
          <Link
            to="/dashboard/analyze"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-pink-500/90 hover:bg-pink-500 text-white text-xs font-black uppercase tracking-widest transition-colors"
          >
            <i className="fas fa-plus text-[10px]" />
            Analyze a new video
          </Link>
        </div>
      </div>
    )
  }

  // While the video count is loading, we still render the page chrome.
  const tooFewVideos =
    videoCount.count !== null && videoCount.count < 3 && videoCount.count >= 0

  // Header right-slot is always the video selector so the user can
  // pivot to a different post without going back.
  const selector = <VideoSelector currentVideoId={videoId} />

  return (
    <div>
      <PageHeader videoId={videoId} rightSlot={selector} />

      {tooFewVideos ? <NotEnoughVideosBanner count={videoCount.count!} /> : null}

      {resolved.source === 'mock' ? <MockDataBanner retry={resolved.retry} /> : null}

      {resolved.loading ? (
        <LoadingState />
      ) : !resolved.data ? (
        <EmptyState
          icon="fa-pen-ruler"
          message={emptyStateMessage(resolved.reason, resolved.error)}
        />
      ) : (
        <>
          {/* Above the fold — video meta + hero finding */}
          <VideoMetaHeader video={resolved.data.video} className="mb-4" />
          <DivergedVariableCard
            diverged={resolved.data.diverged_variable}
            className="mb-6"
          />

          {/* Comparison + benchmark stack — two equally-important
              orientation widgets. 2-column on lg, stacked otherwise. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">
            <NichePercentileRing benchmark={resolved.data.niche_benchmark} />
            <HitsComparison comparedToHits={resolved.data.compared_to_hits} />
          </div>

          {/* Retention overlay — full-width because the chart needs room. */}
          <RetentionCurveOverlay
            retention={resolved.data.retention_curve}
            className="mb-5"
          />

          {/* Missing tactics + prescriptions */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-5">
            <div className="lg:col-span-2">
              <MissingTacticsList missing={resolved.data.missing_tactics} />
            </div>
            <div className="lg:col-span-3">
              <PrescriptionsList prescriptions={resolved.data.prescriptions} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
