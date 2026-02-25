import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'

interface Plan {
  id: number
  name: string
  slug: string
  description: string
  paddle_product_id: string
  paddle_price_id: string
  paddle_product_id_sandbox: string
  paddle_price_id_sandbox: string
  price_amount: number
  price_currency: string
  billing_interval: string
  features: string[]
  sort_order: number
  is_active: boolean
  coming_soon: boolean
}

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [featureInput, setFeatureInput] = useState('')

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const res = await authFetch('/api/billing/admin/plans')
      const data = await res.json()
      setPlans(data.plans || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
      setErrorMsg('Failed to load plans')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan })
    setFeatureInput('')
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  const handleCancel = () => {
    setEditingPlan(null)
    setFeatureInput('')
    setErrorMsg(null)
  }

  const handleSave = async () => {
    if (!editingPlan) return
    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const res = await authFetch(`/api/billing/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlan.name,
          slug: editingPlan.slug,
          description: editingPlan.description,
          paddle_product_id: editingPlan.paddle_product_id,
          paddle_price_id: editingPlan.paddle_price_id,
          paddle_product_id_sandbox: editingPlan.paddle_product_id_sandbox,
          paddle_price_id_sandbox: editingPlan.paddle_price_id_sandbox,
          price_amount: editingPlan.price_amount,
          price_currency: editingPlan.price_currency,
          billing_interval: editingPlan.billing_interval,
          features: editingPlan.features,
          sort_order: editingPlan.sort_order,
          is_active: editingPlan.is_active,
          coming_soon: editingPlan.coming_soon,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error || 'Failed to save')
        return
      }

      setSuccessMsg(`"${editingPlan.name}" plan updated successfully`)
      setEditingPlan(null)
      await fetchPlans()
    } catch (err) {
      console.error('Save error:', err)
      setErrorMsg('Failed to save plan')
    } finally {
      setSaving(false)
    }
  }

  const addFeature = () => {
    if (!editingPlan || !featureInput.trim()) return
    setEditingPlan({
      ...editingPlan,
      features: [...editingPlan.features, featureInput.trim()],
    })
    setFeatureInput('')
  }

  const removeFeature = (index: number) => {
    if (!editingPlan) return
    setEditingPlan({
      ...editingPlan,
      features: editingPlan.features.filter((_, i) => i !== index),
    })
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded">
            Management
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter font-display mb-2">
          Subscription <span className="gradient-text">Plans</span>
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Manage subscription plans, pricing, features, and Paddle integration.
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-semibold flex items-center justify-between">
          <span>
            <i className="fas fa-check-circle mr-2" />
            {successMsg}
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-teal-400/60 hover:text-teal-400">
            <i className="fas fa-times" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold flex items-center justify-between">
          <span>
            <i className="fas fa-exclamation-circle mr-2" />
            {errorMsg}
          </span>
          <button onClick={() => setErrorMsg(null)} className="text-red-400/60 hover:text-red-400">
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      {/* Plans List */}
      <div className="space-y-6">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card rounded-2xl p-7">
            {editingPlan?.id === plan.id ? (
              /* ============ EDIT MODE ============ */
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-black">Editing: {plan.name}</h2>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.coming_soon}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, coming_soon: e.target.checked })
                        }
                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-orange-500 focus:ring-orange-500/30"
                      />
                      <span className="text-sm font-semibold text-slate-300">Coming Soon</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingPlan.is_active}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, is_active: e.target.checked })
                        }
                        className="w-4 h-4 rounded bg-white/5 border-white/10 text-pink-500 focus:ring-pink-500/30"
                      />
                      <span className="text-sm font-semibold text-slate-300">Active</span>
                    </label>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={editingPlan.name}
                      onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Slug
                    </label>
                    <input
                      type="text"
                      value={editingPlan.slug}
                      onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={editingPlan.sort_order}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, sort_order: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingPlan.description}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, description: e.target.value })
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors resize-none"
                  />
                </div>

                {/* Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Price (cents)
                    </label>
                    <input
                      type="number"
                      value={editingPlan.price_amount}
                      onChange={(e) =>
                        setEditingPlan({
                          ...editingPlan,
                          price_amount: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                    <p className="text-xs text-slate-600 mt-1">
                      = {formatPrice(editingPlan.price_amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Currency
                    </label>
                    <input
                      type="text"
                      value={editingPlan.price_currency}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, price_currency: e.target.value })
                      }
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                      Billing Interval
                    </label>
                    <select
                      value={editingPlan.billing_interval}
                      onChange={(e) =>
                        setEditingPlan({ ...editingPlan, billing_interval: e.target.value })
                      }
                      className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                </div>

                {/* Paddle IDs */}
                <div className="p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">
                    <i className="fas fa-link mr-1" /> Paddle Integration
                  </div>

                  {/* Production IDs */}
                  <div className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-3">
                    Production
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Product ID
                      </label>
                      <input
                        type="text"
                        value={editingPlan.paddle_product_id}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, paddle_product_id: e.target.value })
                        }
                        placeholder="pro_..."
                        className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-mono focus:border-indigo-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Price ID
                      </label>
                      <input
                        type="text"
                        value={editingPlan.paddle_price_id}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, paddle_price_id: e.target.value })
                        }
                        placeholder="pri_..."
                        className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-mono focus:border-indigo-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Sandbox IDs */}
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-3">
                    Sandbox
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Product ID
                      </label>
                      <input
                        type="text"
                        value={editingPlan.paddle_product_id_sandbox || ''}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, paddle_product_id_sandbox: e.target.value })
                        }
                        placeholder="pro_..."
                        className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-mono focus:border-orange-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                        Price ID
                      </label>
                      <input
                        type="text"
                        value={editingPlan.paddle_price_id_sandbox || ''}
                        onChange={(e) =>
                          setEditingPlan({ ...editingPlan, paddle_price_id_sandbox: e.target.value })
                        }
                        placeholder="pri_..."
                        className="w-full px-4 py-2.5 glass-input rounded-xl text-sm font-mono focus:border-orange-500/50 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                    Features
                  </label>
                  <div className="space-y-2 mb-3">
                    {editingPlan.features.map((feature, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl"
                      >
                        <i className="fas fa-check text-teal-400 text-xs" />
                        <span className="flex-1 text-sm font-medium text-slate-300">{feature}</span>
                        <button
                          onClick={() => removeFeature(i)}
                          className="text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <i className="fas fa-times text-xs" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addFeature()}
                      placeholder="Add a feature..."
                      className="flex-1 px-4 py-2.5 glass-input rounded-xl text-sm font-medium focus:border-pink-500/50 focus:outline-none transition-colors"
                    />
                    <button
                      onClick={addFeature}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
                    >
                      <i className="fas fa-plus text-xs" />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-400 hover:to-orange-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ============ VIEW MODE ============ */
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-black">{plan.name}</h2>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        plan.is_active
                          ? 'bg-teal-400/10 text-teal-400'
                          : 'bg-slate-400/10 text-slate-500'
                      }`}
                    >
                      {plan.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {plan.coming_soon && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-400/10 text-orange-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 font-medium mb-4">{plan.description}</p>

                  <div className="flex flex-wrap gap-6 text-sm mb-4">
                    <div>
                      <span className="text-slate-600 font-semibold">Price: </span>
                      <span className="text-white font-bold">
                        {formatPrice(plan.price_amount)}/{plan.billing_interval}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-semibold">Slug: </span>
                      <span className="text-slate-300 font-mono text-xs">{plan.slug}</span>
                    </div>
                    <div>
                      <span className="text-slate-600 font-semibold">Order: </span>
                      <span className="text-slate-300">{plan.sort_order}</span>
                    </div>
                  </div>

                  {/* Paddle IDs - Production */}
                  <div className="flex flex-wrap gap-4 mb-2">
                    <div className="px-3 py-1.5 bg-teal-500/5 border border-teal-500/10 rounded-lg">
                      <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                        Live Product:{' '}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {plan.paddle_product_id}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-teal-500/5 border border-teal-500/10 rounded-lg">
                      <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">
                        Live Price:{' '}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {plan.paddle_price_id}
                      </span>
                    </div>
                  </div>
                  {/* Paddle IDs - Sandbox */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="px-3 py-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                        Sandbox Product:{' '}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {plan.paddle_product_id_sandbox || '—'}
                      </span>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                      <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
                        Sandbox Price:{' '}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {plan.paddle_price_id_sandbox || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Features */}
                  {plan.features && plan.features.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {plan.features.map((feature, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-slate-400 font-medium"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleEdit(plan)}
                  className="ml-4 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-colors flex-shrink-0"
                >
                  <i className="fas fa-pen text-xs mr-2" />
                  Edit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {plans.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <i className="fas fa-credit-card text-3xl text-slate-600 mb-4" />
          <p className="text-slate-400 font-medium">No subscription plans found.</p>
        </div>
      )}
    </>
  )
}
