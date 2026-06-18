import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authFetch } from '../lib/api'
import type { SavedIdea } from '../types/business'

const STATUS_LABEL: Record<string, string> = {
  scripting: 'Generating…',
  topic: 'Generating…',
  script_ready: 'Ready',
  error: 'Failed',
}

export default function MyIdeas() {
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<SavedIdea[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await authFetch('/api/business-profiles/playbooks')
      if (!res.ok) throw new Error('load_failed')
      const data = await res.json()
      setIdeas(data.playbooks || [])
    } catch {
      toast.error('Could not load your ideas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await authFetch(`/api/business-profiles/playbook/${id}`, { method: 'DELETE' })
    if (res.ok) setIdeas((prev) => prev.filter((i) => i.id !== id))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">My Ideas</h1>
          <p className="text-slate-400 text-sm mt-1">
            Every content playbook you’ve generated, saved automatically.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/inspiration')}
          className="px-4 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-violet-500 to-pink-500 text-sm"
        >
          <i className="fas fa-wand-magic-sparkles mr-2" />
          New idea
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : ideas.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 text-center border border-white/[0.08]">
          <i className="fas fa-lightbulb text-3xl text-slate-600 mb-3" />
          <p className="text-slate-400">No saved ideas yet.</p>
          <button
            onClick={() => navigate('/dashboard/inspiration')}
            className="mt-4 px-5 py-2.5 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-orange-400"
          >
            Find inspiration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              onClick={() => navigate(`/dashboard/playbook/${idea.id}`)}
              className="glass-card rounded-3xl p-5 border border-white/[0.08] cursor-pointer hover:border-pink-500/30 transition group"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-pink-400">
                  {idea.business_name || 'Idea'}
                </span>
                <button
                  onClick={(e) => remove(idea.id, e)}
                  className="text-slate-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <i className="fas fa-trash text-xs" />
                </button>
              </div>
              <p className="text-white font-bold mt-1 line-clamp-2">
                {idea.concept || idea.topic || 'Untitled idea'}
              </p>
              <div className="flex items-center gap-2 mt-3 text-[11px]">
                {idea.format && (
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-slate-300">
                    {idea.format}
                  </span>
                )}
                <span
                  className={
                    idea.status === 'script_ready'
                      ? 'text-emerald-400'
                      : idea.status === 'error'
                      ? 'text-red-400'
                      : 'text-slate-400'
                  }
                >
                  {STATUS_LABEL[idea.status] || idea.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
