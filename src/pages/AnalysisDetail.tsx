import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../context/UpgradeContext'
import { API_URL } from '../lib/api'
import { FeatureLockedOverlay, hasTier } from '../components/upsell'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'
import VersionTimeline from '../components/VersionTimeline'
import VersionComparison from '../components/VersionComparison'
import AnalysisOverview from '../components/analysis/AnalysisOverview'
import AnalysisBenchmarks from '../components/analysis/AnalysisBenchmarks'
import RecheckForm from '../components/analysis/RecheckForm'
import TabImprovements from '../components/analysis/TabImprovements'
import TabHook from '../components/analysis/TabHook'
import TabStructure from '../components/analysis/TabStructure'
import TabTactics from '../components/analysis/TabTactics'
import TabEmotions from '../components/analysis/TabEmotions'
import TabScript from '../components/analysis/TabScript'
import TabVirality from '../components/analysis/TabVirality'
import TabWeaknesses from '../components/analysis/TabWeaknesses'
import TabComments from '../components/analysis/TabComments'
import TabChat from '../components/analysis/TabChat'
import ShareModal from '../components/ShareModal'
import { exportPdf, type PdfBlock } from '../lib/exportPdf'
import { MENTOR_LABEL } from '../lib/mentor'

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const { session, planSlug, userType } = useAuth()
  const { openUpgrade } = useUpgrade()
  const navigate = useNavigate()

  // Tier gating: Creator (pro) unlocks deep AI breakdowns (suggestions, hook
  // /format/tactic detail, audio analysis). Pro (premium) unlocks analysis
  // versioning. Admin/VIP bypass by being treated as the top tier upstream.
  const effectiveSlug =
    userType === 'admin' || userType === 'vip' ? 'platin' : planSlug ?? 'free'
  const hasCreatorTier = hasTier(effectiveSlug, 'pro')
  const hasProTier = hasTier(effectiveSlug, 'premium')

  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const uploadId = id ? parseInt(id) : null

  const [activeTab, setActiveTab] = useState('improvements')
  const [exampleVideos, setExampleVideos] = useState<any>(null)
  const [carouselVideos, setCarouselVideos] = useState<CarouselVideo[] | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [showRecheck, setShowRecheck] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)

  // === Data Fetching ===

  const fetchFullResult = useCallback(async (fetchId: number) => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const resp = await fetch(`${API_URL}/api/content-analysis/${fetchId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      const data = await resp.json()
      if (resp.ok && !data.error) {
        setAnalysisResult(data)
        // Free-tier responses strip improvements/full/hook — drop into the
        // virality tab (the only one with content) instead of an empty tab.
        setActiveTab(data?.tier_gated ? 'virality' : 'improvements')
        if (tabParam && ['improvements','hook','structure','script','tactics','emotions','virality','weaknesses','comments','chat'].includes(tabParam)) {
          setActiveTab(tabParam)
        }
      }
    } catch (err) {
      console.error('Failed to fetch result:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, tabParam])

  useEffect(() => {
    if (uploadId && session?.access_token) {
      fetchFullResult(uploadId)
    }
  }, [uploadId, session?.access_token, fetchFullResult])

  // Fetch example viral videos once improvement data is available
  useEffect(() => {
    if (!analysisResult?.improvement?.improvement_json || !uploadId || !session?.access_token) return
    setExampleVideos(null)
    fetch(`${API_URL}/api/content-analysis/${uploadId}/examples`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setExampleVideos(data) })
      .catch(() => {})
  }, [analysisResult, uploadId, session?.access_token])

  const handleVersionSelect = (newUploadId: number) => {
    if (newUploadId === uploadId) return
    navigate(`/dashboard/analyze/${newUploadId}`)
  }

  const openExampleCarousel = (videos: any[], index: number) => {
    const mapped: CarouselVideo[] = videos.map((v: any) => ({
      id: v.video_id,
      platform: v.platform,
      username: v.username,
      content_url: v.content_url,
      thumbnail_url: v.thumbnail_url,
      local_thumbnail_path: v.local_thumbnail_path || null,
      local_video_path: v.local_video_path || null,
      views: v.views,
      engagement_rate: v.engagement_rate,
      format_class_name: v.format_class_name || null,
      hook_class_name: v.hook_class_name || null,
      top_tactic_names: v.top_tactic_names || null,
    }))
    setCarouselVideos(mapped)
    setCarouselIndex(index)
  }

  // === Loading / Not Found ===

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-2xl text-pink-400 mr-3"></i>
        <span className="text-slate-400">Loading analysis...</span>
      </div>
    )
  }

  if (!analysisResult) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <i className="fas fa-exclamation-circle text-2xl text-slate-500 mb-3"></i>
        <span className="text-slate-400">Analysis not found.</span>
        <button
          onClick={() => navigate('/dashboard/analyze')}
          className="mt-4 text-pink-400 hover:text-pink-300 text-sm font-bold"
        >
          <i className="fas fa-arrow-left mr-2"></i>Back to Virality Check
        </button>
      </div>
    )
  }

  // === Destructure Analysis Data ===

  const full = analysisResult?.fullAnalysis?.analysis_json
  const hook = analysisResult?.hookAnalysis?.analysis_json
  const virality = analysisResult?.viralityAnalysis?.analysis_json
  const improv = analysisResult?.improvement?.improvement_json
  const upload = analysisResult?.upload
  const benchmarks = analysisResult?.benchmarks
  const topFormatVideos = analysisResult?.topFormatVideos
  const topHookVideos = analysisResult?.topHookVideos
  const hookTacticFrequency = analysisResult?.hookTacticFrequency
  const tierGated = !!analysisResult?.tier_gated

  // Free tier: only the virality tab is populated — collapse the tab list to
  // a single entry so locked tabs aren't even visible. Paid tiers see the full set.
  const tabs = tierGated
    ? (virality ? [{ id: 'virality', label: 'Virality', icon: 'fa-fire' }] : [])
    : [
        ...(improv ? [{ id: 'improvements', label: 'Improvements', icon: 'fa-rocket' }] : []),
        { id: 'hook', label: 'Hook', icon: 'fa-magnet' },
        { id: 'structure', label: 'Structure', icon: 'fa-layer-group' },
        { id: 'script', label: 'Script', icon: 'fa-quote-left' },
        { id: 'tactics', label: 'Tactics', icon: 'fa-chess' },
        { id: 'emotions', label: 'Emotions', icon: 'fa-heart' },
        ...(virality ? [{ id: 'virality', label: 'Virality', icon: 'fa-fire' }] : []),
        { id: 'weaknesses', label: 'Weaknesses', icon: 'fa-exclamation-triangle' },
        ...(upload?.platform && upload?.platform_id ? [{ id: 'comments', label: 'Comments', icon: 'fa-comments' }] : []),
        { id: 'chat', label: MENTOR_LABEL, icon: 'fa-seedling' },
      ]

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/analyze')}
          className="text-slate-400 hover:text-white text-sm font-bold transition-all mb-4 inline-block"
        >
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Virality Check
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tighter">
              Analysis <span className="gradient-text">Detail</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (!hasCreatorTier) {
                  openUpgrade('script-studio')
                  return
                }
                if (!uploadId) {
                  navigate('/dashboard/script-studio')
                  return
                }
                const up = analysisResult?.upload ?? {}
                // The content-analysis result is a content_uploads row, so we
                // seed Script Studio from the UPLOAD (not a content_videos id).
                navigate('/dashboard/script-studio', {
                  state: {
                    sourceUploadId: String(uploadId),
                    sourceVideo: {
                      handle: up.username ?? null,
                      // content_uploads.thumbnail_path is stored as a full URL.
                      thumbnailUrl: up.thumbnail_path ?? null,
                      title: up.caption ?? null,
                      platform: up.platform ?? null,
                      views: up.views ?? null,
                    },
                  },
                })
              }}
              className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-bold relative"
              aria-label={hasCreatorTier ? 'Create a script from this video' : 'Upgrade to Pro to create scripts'}
              title={hasCreatorTier ? undefined : 'Pro plan required to create scripts'}
            >
              <i className={`fas ${hasCreatorTier ? 'fa-wand-magic-sparkles' : 'fa-lock'} sm:mr-2`}></i>
              <span className="hidden sm:inline">Create script</span>
              {!hasCreatorTier && (
                <span className="ml-1 sm:ml-2 px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded text-[8px] font-black text-white uppercase tracking-widest align-middle">
                  Pro
                </span>
              )}
            </button>
            <button
              onClick={() => {
                const kv = (pairs: [string, any][]): [string, string][] =>
                  pairs.filter(([, v]) => v != null && v !== '').map(([k, v]) => [k, String(v)] as [string, string])
                const blocks: PdfBlock[] = []
                if (full) {
                  blocks.push({
                    heading: 'Overview',
                    keyValues: kv([
                      ['Title', full.title],
                      ['Verdict', full.one_line_verdict],
                      ['Format', full.format_class],
                      ['Niche', full.niche],
                    ]),
                  })
                  if (full.content_substance)
                    blocks.push({
                      heading: 'Substance',
                      paragraphs: [full.content_substance.summary, full.content_substance.unique_angle, full.content_substance.contrarian_angle].filter(Boolean),
                    })
                  if (Array.isArray(full.tactics) && full.tactics.length)
                    blocks.push({ heading: 'Tactics', bullets: full.tactics.slice(0, 12).map((t: any) => `${t.name}${t.why_it_works ? ` — ${t.why_it_works}` : ''}`) })
                  if (full.structural_breakdown)
                    blocks.push({
                      heading: 'Structure',
                      keyValues: kv([
                        ['Hook (s)', full.structural_breakdown.hook_seconds],
                        ['Pacing', full.structural_breakdown.pacing_style],
                        ['Loop', full.structural_breakdown.loop_description],
                      ]),
                    })
                  if (Array.isArray(full.weaknesses) && full.weaknesses.length)
                    blocks.push({ heading: 'Weaknesses', bullets: full.weaknesses.map((w: any) => `${w.what}${w.fix ? ` → ${w.fix}` : ''}`) })
                }
                if (hook)
                  blocks.push({ heading: 'Hook', keyValues: kv([['Class', hook.hook_class], ['Verdict', hook.verdict], ['Promise', hook.promise_setup?.promise_text]]) })
                if (virality)
                  blocks.push({ heading: 'Virality', keyValues: kv([['Overall score', virality.overall_virality_score]]) })
                if (improv && Array.isArray(improv.priority_actions))
                  blocks.push({ heading: 'Priority actions', numbered: improv.priority_actions.map((a: any) => ({ title: `#${a.rank} · ${a.effort} effort`, lines: [a.action] })) })
                exportPdf({
                  title: full?.title || upload?.caption || 'Video Analysis',
                  subtitle: [upload?.username ? `@${upload.username}` : '', upload?.platform].filter(Boolean).join(' · '),
                  blocks,
                })
              }}
              className="px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all text-xs sm:text-sm font-bold"
              aria-label="Export analysis as PDF"
            >
              <i className="fas fa-file-pdf sm:mr-2"></i>
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button
              onClick={() => setShowShareModal(true)}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-xl text-pink-300 hover:text-white hover:from-pink-500/30 hover:to-orange-500/30 transition-all text-xs sm:text-sm font-bold"
            >
              <i className="fas fa-share-alt sm:mr-2"></i>
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={() => {
                if (!hasProTier) {
                  openUpgrade('analysis-detail-recheck')
                  return
                }
                setShowRecheck(!showRecheck)
              }}
              className={`px-3 sm:px-4 py-2 rounded-xl transition-all text-xs sm:text-sm font-bold relative ${
                hasProTier
                  ? 'bg-gradient-to-r from-purple-500/20 to-teal-500/20 border border-purple-500/30 text-purple-300 hover:text-white hover:from-purple-500/30 hover:to-teal-500/30'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              aria-label={hasProTier ? 'Improve and re-check' : 'Upgrade to Pro to re-analyze versions'}
              title={hasProTier ? undefined : 'Pro plan required to re-analyze content versions'}
            >
              <i className={`fas ${hasProTier ? 'fa-redo' : 'fa-lock'} sm:mr-2`}></i>
              <span className="hidden sm:inline">Improve & Re-check</span>
              {!hasProTier && (
                <span className="ml-1 sm:ml-2 px-1.5 py-0.5 bg-gradient-to-r from-pink-500 to-fuchsia-500 rounded text-[8px] font-black text-white uppercase tracking-widest align-middle">
                  Pro
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-hidden">
        <div className="flex-1 min-w-0">
          <div>
            {/* Re-check Form — gated by Pro tier (re-analysis is a paid feature) */}
            {showRecheck && uploadId && session?.access_token && hasProTier && (
              <RecheckForm
                uploadId={uploadId}
                sessionToken={session.access_token}
                onClose={() => setShowRecheck(false)}
                onSuccess={(newId) => {
                  setShowRecheck(false)
                  navigate(`/dashboard/analyze/${newId}`)
                }}
              />
            )}

            {/* Version Timeline + Comparison — Pro tier gate. Free/Creator
                users see a compact locked notice in place of the timeline so
                they still know the feature exists. */}
            {analysisResult?.versionInfo && uploadId && (
              hasProTier ? (
                <>
                  <VersionTimeline
                    uploadId={uploadId}
                    versionInfo={analysisResult.versionInfo}
                    onVersionSelect={handleVersionSelect}
                  />
                  <VersionComparison
                    uploadId={uploadId}
                    versionInfo={analysisResult.versionInfo}
                  />
                </>
              ) : (
                analysisResult.versionInfo.totalVersions > 1 && (
                  <div className="mb-6">
                    <FeatureLockedOverlay
                      requiredTier="premium"
                      featureName="Track your version history"
                      description="See every iteration side-by-side, compare scores across versions, and re-run analysis on improved content."
                      preview="hide"
                      upgradeSource="analysis-detail-versioning"
                    >
                      <></>
                    </FeatureLockedOverlay>
                  </div>
                )
              )
            )}

            <div className="space-y-6">
              {/* Overview Card */}
              <AnalysisOverview
                upload={upload}
                full={full}
                hook={hook}
                virality={virality}
                improv={improv}
                uploadId={uploadId!}
                sessionToken={session?.access_token || ''}
                onTitleUpdate={(newTitle) => {
                  setAnalysisResult((prev: any) => prev ? { ...prev, upload: { ...prev.upload, title: newTitle } } : prev)
                }}
              />

              {/* Benchmarks */}
              {benchmarks && (
                <AnalysisBenchmarks
                  benchmarks={benchmarks}
                  virality={virality}
                  topFormatVideos={topFormatVideos || []}
                  topHookVideos={topHookVideos || []}
                  onOpenCarousel={openExampleCarousel}
                />
              )}

              {/* Divider */}
              <div className="flex items-center gap-4 pt-2">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Detailed Analysis</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              </div>

              {/* Tab Navigation */}
              <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto scrollbar-hide pb-1 sm:pb-0">
                <div className="flex gap-1.5 sm:gap-2 sm:flex-wrap min-w-max sm:min-w-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'bg-white/10 text-white font-black'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <i className={`fas ${tab.icon} text-[10px]`}></i>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'improvements' && (
                hasCreatorTier && improv ? (
                  <TabImprovements
                    improv={improv}
                    exampleVideos={exampleVideos}
                    onOpenCarousel={openExampleCarousel}
                  />
                ) : (
                  <FeatureLockedOverlay
                    requiredTier="pro"
                    featureName="AI Suggestions"
                    description="Get actionable improvement ideas: priority actions, alternative hooks, before/after rewrites, and missing high-impact tactics personalized to your content."
                    preview="hide"
                    upgradeSource="analysis-detail-suggestions"
                  >
                    <></>
                  </FeatureLockedOverlay>
                )
              )}

              {activeTab === 'hook' && (
                <TabHook
                  hook={hook}
                  hookTacticFrequency={hookTacticFrequency}
                  benchmarks={benchmarks}
                  virality={virality}
                  topHookVideos={topHookVideos || []}
                  onOpenCarousel={openExampleCarousel}
                  showDetail={hasCreatorTier}
                  onOpenUpgrade={openUpgrade}
                />
              )}

              {activeTab === 'structure' && (
                <TabStructure
                  full={full}
                  upload={upload}
                  improv={improv}
                  showDetail={hasCreatorTier}
                  onOpenUpgrade={openUpgrade}
                />
              )}

              {activeTab === 'tactics' && (
                <TabTactics
                  full={full}
                  showDetail={hasCreatorTier}
                  onOpenUpgrade={openUpgrade}
                />
              )}

              {activeTab === 'script' && (
                <TabScript full={full} />
              )}

              {activeTab === 'emotions' && (
                <TabEmotions full={full} />
              )}

              {activeTab === 'virality' && virality && (
                <TabVirality virality={virality} benchmarks={benchmarks} upload={upload} />
              )}

              {activeTab === 'weaknesses' && (
                <TabWeaknesses full={full} improv={improv} />
              )}

              {activeTab === 'comments' && uploadId && session?.access_token && (
                <TabComments
                  upload={upload}
                  uploadId={uploadId}
                  sessionToken={session.access_token}
                />
              )}

              {activeTab === 'chat' && (
                <TabChat
                  uploadId={uploadId!}
                  session={session}
                  analysisReady={analysisResult?.upload?.status === 'completed'}
                  planSlug={planSlug ?? null}
                  userType={userType ?? null}
                />
              )}

              {/* Free-tier upsell — sits below the virality tab to nudge upgrades. */}
              {tierGated && (
                <div className="glass-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-pink-500/20 bg-gradient-to-br from-pink-500/10 via-purple-500/5 to-transparent">
                  <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
                    <i className="fas fa-crown text-pink-400 text-lg" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight mb-2">
                    Unlock the full breakdown
                  </h3>
                  <p className="text-sm text-slate-400 font-medium mb-5 max-w-md mx-auto">
                    Format + hook classification, top-10 viral references, tactic breakdown, and 10 personalized improvement suggestions.
                  </p>
                  <button
                    onClick={() => openUpgrade('analysis-detail-full-report')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-black text-sm px-8 py-3 rounded-2xl transition-all active:scale-[0.97] shadow-lg shadow-pink-500/30"
                  >
                    <i className="fas fa-crown text-xs" />
                    See plans
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Overlay */}
      {carouselVideos && (
        <VideoStoryCarousel
          videos={carouselVideos}
          initialIndex={carouselIndex}
          onClose={() => setCarouselVideos(null)}
        />
      )}

      {/* Share Modal */}
      {showShareModal && uploadId && session?.access_token && (
        <ShareModal
          uploadId={uploadId}
          sessionToken={session.access_token}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  )
}
