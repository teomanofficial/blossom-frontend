import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { authFetch } from '../lib/api'
import {
  ACCOUNT_TYPE_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  DEFAULT_ACCOUNT_TYPE,
  DEFAULT_PRIMARY_GOAL,
  accountTypeLabel,
  primaryGoalLabel,
  type IntentOption,
} from '../lib/intentOptions'

/**
 * Goal & Intent settings card.
 *
 * Self-contained: reads the current values from the auth profile and persists
 * via PUT /api/auth/profile, then refreshes the profile so the rest of the app
 * sees the new intent immediately. Lives above the onboarding content
 * preferences and renders regardless of onboarding completion.
 */
export default function IntentPreferences() {
  const { profile, refreshProfile } = useAuth()

  const currentAccountType = profile?.account_type || DEFAULT_ACCOUNT_TYPE
  const currentGoal = profile?.primary_goal || DEFAULT_PRIMARY_GOAL

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editAccountType, setEditAccountType] = useState(currentAccountType)
  const [editGoal, setEditGoal] = useState(currentGoal)

  const startEdit = () => {
    setEditAccountType(currentAccountType)
    setEditGoal(currentGoal)
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_type: editAccountType, primary_goal: editGoal }),
      })
      if (res.ok) {
        await refreshProfile()
        setEditing(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error('Failed to save intent:', err)
    } finally {
      setSaving(false)
    }
  }

  const renderOptionGrid = (
    options: IntentOption[],
    selected: string,
    onSelect: (value: string) => void,
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`group p-4 rounded-xl border text-left transition-all ${
            selected === opt.value
              ? 'border-pink-500/50 bg-pink-500/10 ring-1 ring-pink-500/20'
              : 'border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              selected === opt.value ? 'bg-pink-500/20 text-pink-300' : 'bg-white/[0.04] text-slate-400'
            }`}>
              <i className={`fas ${opt.icon} text-sm`}></i>
            </span>
            <div>
              <h3 className="text-sm font-bold">{opt.label}</h3>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{opt.description}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )

  return (
    <div>
      <div className="pb-6 mb-6 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight">Goal &amp; Intent</h2>
          <p className="text-xs text-slate-500 mt-1">
            Tailors AI analysis, suggestions, and CTAs to what you&apos;re trying to achieve.
          </p>
        </div>
        {!editing && (
          <button
            onClick={startEdit}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-all shrink-0"
          >
            <i className="fas fa-pen text-[10px] mr-1.5"></i>
            Edit
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              I am a…
            </label>
            <div className="glass-card rounded-3xl p-5 sm:p-7">
              <p className="text-sm font-bold">{accountTypeLabel(currentAccountType)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {ACCOUNT_TYPE_OPTIONS.find((o) => o.value === currentAccountType)?.description}
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              My main goal
            </label>
            <div className="glass-card rounded-3xl p-5 sm:p-7">
              <p className="text-sm font-bold">{primaryGoalLabel(currentGoal)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {PRIMARY_GOAL_OPTIONS.find((o) => o.value === currentGoal)?.description}
              </p>
            </div>
          </div>
          {saved && (
            <span className="text-sm font-semibold text-teal-400 flex items-center gap-1.5">
              <i className="fas fa-check text-xs"></i>
              Intent updated
            </span>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              I am a…
            </label>
            {renderOptionGrid(ACCOUNT_TYPE_OPTIONS, editAccountType, setEditAccountType)}
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              My main goal
            </label>
            {renderOptionGrid(PRIMARY_GOAL_OPTIONS, editGoal, setEditGoal)}
          </div>
          <div className="pt-4 border-t border-white/[0.06] flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20"
            >
              {saving ? 'Saving...' : 'Save intent'}
            </button>
            <button
              onClick={() => setEditing(false)}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
