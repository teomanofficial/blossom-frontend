import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_URL } from '../lib/api'
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
import TabVirality from '../components/analysis/TabVirality'
import TabWeaknesses from '../components/analysis/TabWeaknesses'
import TabComments from '../components/analysis/TabComments'

export default function AnalysisDetail() {
  const { id } = useParams<{ id: string }>()
  const { session } = useAuth()
  const navigate = useNavigate()

  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const uploadId = id ? parseInt(id) : null

  const [activeTab, setActiveTab] = useState('improvements')
  const [exampleVideos, setExampleVideos] = useState<any>(null)
  const [carouselVideos, setCarouselVideos] = useState<CarouselVideo[] | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [showRecheck, setShowRecheck] = useState(false)

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
        setActiveTab('improvements')
      }
    } catch (err) {
      console.error('Failed to fetch result:', err)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

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

  const tabs = [
    ...(improv ? [{ id: 'improvements', label: 'Improvements', icon: 'fa-rocket' }] : []),
    { id: 'hook', label: 'Hook', icon: 'fa-magnet' },
    { id: 'structure', label: 'Structure', icon: 'fa-layer-group' },
    { id: 'tactics', label: 'Tactics', icon: 'fa-chess' },
    { id: 'emotions', label: 'Emotions', icon: 'fa-heart' },
    ...(virality ? [{ id: 'virality', label: 'Virality', icon: 'fa-fire' }] : []),
    { id: 'weaknesses', label: 'Weaknesses', icon: 'fa-exclamation-triangle' },
    ...(upload?.platform && upload?.platform_id ? [{ id: 'comments', label: 'Comments', icon: 'fa-comments' }] : []),
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
              onClick={() => setShowRecheck(!showRecheck)}
              className="px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-500/20 to-teal-500/20 border border-purple-500/30 rounded-xl text-purple-300 hover:text-white hover:from-purple-500/30 hover:to-teal-500/30 transition-all text-xs sm:text-sm font-bold"
            >
              <i className="fas fa-redo sm:mr-2"></i>
              <span className="hidden sm:inline">Improve & Re-check</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 sm:gap-6 overflow-x-hidden">
        <div className="flex-1 min-w-0">
          <div>
            {/* Re-check Form */}
            {showRecheck && uploadId && session?.access_token && (
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

            {/* Version Timeline */}
            {analysisResult?.versionInfo && uploadId && (
              <VersionTimeline
                uploadId={uploadId}
                versionInfo={analysisResult.versionInfo}
                onVersionSelect={handleVersionSelect}
              />
            )}

            {/* Version Comparison */}
            {analysisResult?.versionInfo && uploadId && (
              <VersionComparison
                uploadId={uploadId}
                versionInfo={analysisResult.versionInfo}
              />
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
              {activeTab === 'improvements' && improv && (
                <TabImprovements
                  improv={improv}
                  exampleVideos={exampleVideos}
                  onOpenCarousel={openExampleCarousel}
                />
              )}

              {activeTab === 'hook' && (
                <TabHook
                  hook={hook}
                  hookTacticFrequency={hookTacticFrequency}
                  benchmarks={benchmarks}
                  virality={virality}
                  topHookVideos={topHookVideos || []}
                  onOpenCarousel={openExampleCarousel}
                />
              )}

              {activeTab === 'structure' && (
                <TabStructure full={full} upload={upload} improv={improv} />
              )}

              {activeTab === 'tactics' && (
                <TabTactics full={full} />
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
    </>
  )
}
