import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_URL } from '../lib/api'
import VideoStoryCarousel, { type CarouselVideo } from '../components/VideoStoryCarousel'
import AnalysisOverview from '../components/analysis/AnalysisOverview'
import AnalysisBenchmarks from '../components/analysis/AnalysisBenchmarks'
import TabImprovements from '../components/analysis/TabImprovements'
import TabHook from '../components/analysis/TabHook'
import TabStructure from '../components/analysis/TabStructure'
import TabTactics from '../components/analysis/TabTactics'
import TabEmotions from '../components/analysis/TabEmotions'
import TabVirality from '../components/analysis/TabVirality'
import TabWeaknesses from '../components/analysis/TabWeaknesses'

export default function SharedAnalysis() {
  const { token } = useParams<{ token: string }>()

  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requiresPassword, setRequiresPassword] = useState(false)
  const [shareTitle, setShareTitle] = useState('Shared Analysis')
  const [password, setPassword] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState('improvements')
  const [carouselVideos, setCarouselVideos] = useState<CarouselVideo[] | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)

  // Fetch shared analysis
  useEffect(() => {
    if (!token) return

    const fetchShared = async () => {
      setLoading(true)
      try {
        const headers: Record<string, string> = {}
        if (sessionToken) {
          headers['Authorization'] = `Bearer ${sessionToken}`
        }

        const resp = await fetch(`${API_URL}/api/shared/view/${token}`, { headers })
        const data = await resp.json()

        if (!resp.ok) {
          setError(data.error || 'Failed to load shared analysis')
          return
        }

        if (data.requiresPassword) {
          setRequiresPassword(true)
          setShareTitle(data.title || 'Shared Analysis')
          return
        }

        setAnalysisResult(data)
        setRequiresPassword(false)
      } catch {
        setError('Failed to load shared analysis')
      } finally {
        setLoading(false)
      }
    }

    fetchShared()
  }, [token, sessionToken])

  const verifyPassword = async () => {
    if (!password.trim() || !token) return
    setVerifying(true)
    setPasswordError(null)

    try {
      const resp = await fetch(`${API_URL}/api/shared/view/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      const data = await resp.json()

      if (!resp.ok) {
        setPasswordError(data.error || 'Invalid password')
        return
      }

      // Store session token for subsequent requests, set analysis data
      if (data.sessionToken) {
        setSessionToken(data.sessionToken)
      }
      setAnalysisResult(data)
      setRequiresPassword(false)
    } catch {
      setPasswordError('Failed to verify password')
    } finally {
      setVerifying(false)
    }
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

  // === Shell: minimal chrome, centered content ===

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#050508] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#050508]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center">
              <i className="fas fa-seedling text-white text-xs"></i>
            </div>
            <span className="text-sm font-black tracking-tight">Blossom</span>
          </div>
          <div className="text-xs text-slate-500 font-bold">
            <i className="fas fa-share-alt mr-1.5"></i>Shared Analysis
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-center gap-2 text-xs text-slate-600">
          <span>Powered by</span>
          <a href="/" className="text-pink-400 hover:text-pink-300 font-black transition-colors">Blossom</a>
          <span>- Viral Content Intelligence</span>
        </div>
      </footer>
    </div>
  )

  // === Loading state ===
  if (loading) {
    return shell(
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-2xl text-pink-400 mr-3"></i>
        <span className="text-slate-400">Loading shared analysis...</span>
      </div>
    )
  }

  // === Error state ===
  if (error) {
    return shell(
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <i className="fas fa-exclamation-triangle text-2xl text-red-400"></i>
        </div>
        <h2 className="text-lg font-black text-white mb-2">Link Not Available</h2>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    )
  }

  // === Password prompt ===
  if (requiresPassword) {
    return shell(
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <i className="fas fa-lock text-2xl text-amber-400"></i>
        </div>
        <h2 className="text-lg font-black text-white mb-1">{shareTitle}</h2>
        <p className="text-sm text-slate-400 mb-6">This analysis is password protected</p>

        <div className="w-full max-w-sm space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') verifyPassword() }}
            placeholder="Enter password..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-pink-500/50"
            autoFocus
          />
          {passwordError && (
            <p className="text-xs text-red-400 font-bold">{passwordError}</p>
          )}
          <button
            onClick={verifyPassword}
            disabled={verifying || !password.trim()}
            className="w-full px-4 py-3 bg-gradient-to-r from-pink-500/20 to-orange-500/20 border border-pink-500/30 rounded-xl text-pink-300 hover:text-white hover:from-pink-500/30 hover:to-orange-500/30 transition-all text-sm font-black disabled:opacity-50"
          >
            {verifying ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Verifying...</>
            ) : (
              <><i className="fas fa-unlock mr-2"></i>Unlock Analysis</>
            )}
          </button>
        </div>
      </div>
    )
  }

  // === Analysis result ===
  if (!analysisResult) {
    return shell(
      <div className="flex flex-col items-center justify-center py-20">
        <i className="fas fa-exclamation-circle text-2xl text-slate-500 mb-3"></i>
        <span className="text-slate-400">Analysis not found.</span>
      </div>
    )
  }

  const full = analysisResult?.fullAnalysis?.analysis_json
  const hook = analysisResult?.hookAnalysis?.analysis_json
  const virality = analysisResult?.viralityAnalysis?.analysis_json
  const improv = analysisResult?.improvement?.improvement_json
  const upload = analysisResult?.upload || analysisResult?.video
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
  ]

  return shell(
    <>
      <div className="space-y-6">
        {/* Overview Card */}
        <AnalysisOverview
          upload={upload}
          full={full}
          hook={hook}
          virality={virality}
          improv={improv}
          readOnly
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
            exampleVideos={null}
            onOpenCarousel={openExampleCarousel}
            disableLinks
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
