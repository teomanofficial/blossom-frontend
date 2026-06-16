import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '../../lib/api'
import type { ScriptPersona } from '../../types/scripts'

const FIELDS: {
  key: keyof ScriptPersona
  label: string
  helper: string
  max: number
  rows: number
  placeholder: string
}[] = [
  {
    key: 'content_description',
    label: 'Content description',
    helper: 'Your niche. Personalizes research and hook discovery.',
    max: 5000,
    rows: 4,
    placeholder: 'e.g. I make short-form videos about personal finance for people in their 20s...',
  },
  {
    key: 'brand_context',
    label: 'Brand context',
    helper: 'Your brand/expertise. Used in every script.',
    max: 5000,
    rows: 4,
    placeholder: 'e.g. Former financial advisor, no-jargon, slightly contrarian, big on actionable steps...',
  },
  {
    key: 'writing_style_sample',
    label: 'Writing style',
    helper: 'Paste a script you want to sound like. Sample only, no instructions.',
    max: 3000,
    rows: 6,
    placeholder: 'Paste a full script here that captures the voice you want to emulate...',
  },
]

const EMPTY: ScriptPersona = { content_description: '', brand_context: '', writing_style_sample: '' }

/**
 * Persona settings — three labeled fields with char counters. Loads from
 * GET /api/analysis/scripts/persona and saves via PUT.
 */
export default function PersonaPanel() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [persona, setPersona] = useState<ScriptPersona>(EMPTY)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await authFetch('/api/analysis/scripts/persona')
        if (res.ok) {
          const data = (await res.json()) as Partial<ScriptPersona>
          if (!cancelled) {
            setPersona({
              content_description: data.content_description ?? '',
              brand_context: data.brand_context ?? '',
              writing_style_sample: data.writing_style_sample ?? '',
            })
          }
        }
      } catch (err) {
        console.error('Failed to load persona:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const update = (key: keyof ScriptPersona, value: string, max: number) => {
    setPersona((prev) => ({ ...prev, [key]: value.slice(0, max) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await authFetch('/api/analysis/scripts/persona', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(persona),
      })
      if (res.ok) {
        toast.success('Persona saved')
      } else {
        toast.error('Could not save persona')
      }
    } catch (err) {
      console.error('Save persona error:', err)
      toast.error('Could not save persona')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black tracking-tight">Persona</h2>
        <p className="mt-1 text-sm text-slate-500">
          Personalizes research, hooks, and every script we generate for you.
        </p>
      </div>

      {FIELDS.map((field) => {
        const value = persona[field.key]
        return (
          <div key={field.key}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {field.label}
              </label>
              <span className="text-[11px] font-semibold text-slate-600">
                {value.length}/{field.max}
              </span>
            </div>
            <textarea
              value={value}
              onChange={(e) => update(field.key, e.target.value, field.max)}
              placeholder={field.placeholder}
              rows={field.rows}
              maxLength={field.max}
              className="glass-input w-full resize-y px-4 py-3 text-sm text-white placeholder-slate-500"
            />
            <p className="mt-1.5 text-xs text-slate-500">{field.helper}</p>
          </div>
        )
      })}

      <div className="flex items-center gap-3 border-t border-white/[0.06] pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-r from-pink-500 to-orange-400 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 transition-all hover:from-pink-600 hover:to-orange-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save persona'}
        </button>
      </div>
    </div>
  )
}
