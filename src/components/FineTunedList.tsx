import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { authFetch } from '../lib/api'

interface FineTune {
  id: number
  item_type: string
  item_id: number
  item_name: string | null
  status: string
  video_count: number
  example_video_count: number
  custom_analysis: any
  created_at: string
  updated_at: string
}

interface FineTunedListProps {
  itemType: 'format' | 'hook' | 'tactic'
  detailBasePath: string // e.g., '/dashboard/formats'
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10', icon: 'fa-clock' },
  processing: { label: 'Processing', color: 'text-amber-400 bg-amber-500/10', icon: 'fa-spinner fa-spin' },
  completed: { label: 'Ready', color: 'text-emerald-400 bg-emerald-500/10', icon: 'fa-check' },
  failed: { label: 'Failed', color: 'text-red-400 bg-red-500/10', icon: 'fa-xmark' },
}

export default function FineTunedList({ itemType, detailBasePath }: FineTunedListProps) {
  const [fineTunes, setFineTunes] = useState<FineTune[]>([])
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<Record<string, number>>({ format: 0, hook: 0, tactic: 0 })
  const [limits, setLimits] = useState<Record<string, number | null>>({ format: null, hook: null, tactic: null })

  useEffect(() => {
    setLoading(true)
    authFetch(`/api/analysis/fine-tunes?item_type=${itemType}`)
      .then(r => r.json())
      .then(data => {
        setFineTunes(data.fine_tunes || [])
        setCounts(data.counts || {})
        setLimits(data.limits || {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [itemType])

  // Poll for processing items
  useEffect(() => {
    const hasProcessing = fineTunes.some(ft => ft.status === 'processing' || ft.status === 'pending')
    if (!hasProcessing) return

    const interval = setInterval(() => {
      authFetch(`/api/analysis/fine-tunes?item_type=${itemType}`)
        .then(r => r.json())
        .then(data => setFineTunes(data.fine_tunes || []))
        .catch(() => {})
    }, 5000)

    return () => clearInterval(interval)
  }, [fineTunes, itemType])

  const count = counts[itemType] || 0
  const limit = limits[itemType]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (fineTunes.length === 0) {
    return (
      <div className="glass-card rounded-3xl p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <i className="fas fa-sliders text-2xl text-slate-600"></i>
        </div>
        <h3 className="text-lg font-black text-white mb-2">No fine-tuned {itemType}s yet</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Go to any {itemType} detail page and click "Fine-tune" to customize it with your own example videos.
          {limit !== null && (
            <span className="block mt-2 text-slate-600">
              {count} / {limit} {itemType} fine-tunes used
            </span>
          )}
        </p>
      </div>
    )
  }

  return (
    <div>
      {limit !== null && (
        <div className="mb-4 text-xs font-bold text-slate-500">
          {count} / {limit} {itemType} fine-tunes used
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {fineTunes.map(ft => {
          const status = statusConfig[ft.status] ?? { label: 'Pending', color: 'text-yellow-400 bg-yellow-500/10', icon: 'fa-clock' }
          return (
            <Link
              key={ft.id}
              to={`${detailBasePath}/${ft.item_id}?fine_tune=${ft.id}`}
              className="glass-card rounded-2xl p-5 hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-black text-white group-hover:text-pink-400 transition-colors line-clamp-1 flex-1">
                  {ft.item_name || `${itemType} #${ft.item_id}`}
                </h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${status.color} shrink-0 ml-2`}>
                  <i className={`fas ${status.icon} mr-1`}></i>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500">
                <span>
                  <i className="fas fa-video mr-1"></i>
                  {ft.example_video_count} video{ft.example_video_count !== 1 ? 's' : ''}
                </span>
                <span>
                  <i className="fas fa-calendar mr-1"></i>
                  {formatDate(ft.updated_at)}
                </span>
              </div>

              {ft.status === 'completed' && ft.custom_analysis?.class_description && (
                <p className="mt-3 text-[11px] text-slate-400 line-clamp-2">
                  {ft.custom_analysis.class_description}
                </p>
              )}
              {ft.status === 'completed' && ft.custom_analysis?.tactic_description && (
                <p className="mt-3 text-[11px] text-slate-400 line-clamp-2">
                  {ft.custom_analysis.tactic_description}
                </p>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
