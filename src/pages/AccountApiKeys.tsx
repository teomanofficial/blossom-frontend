import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../context/UpgradeContext'
import DisabledUpsellButton from '../components/upsell/DisabledUpsellButton'
import UpsellBadge from '../components/upsell/UpsellBadge'
import { hasTier } from '../components/upsell/tierUtils'

const PLAN_RATE_LIMITS: Record<string, { limit: number; label: string }> = {
  pro: { limit: 30, label: 'Pro' },
  premium: { limit: 60, label: 'Premium' },
  platin: { limit: 100, label: 'Platin' },
}

interface ApiKey {
  id: number
  name: string
  key_prefix: string
  scopes: string[]
  is_active: boolean
  last_used_at: string | null
  expires_at: string | null
  created_at: string
}

interface UsageDay {
  date: string
  request_count: number
}

export default function AccountApiKeys() {
  const { isFreeTier, planSlug, userType } = useAuth()
  const { openUpgrade } = useUpgrade()
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [mcpCopied, setMcpCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [revoking, setRevoking] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedKeyUsage, setSelectedKeyUsage] = useState<{ keyId: number; usage: UsageDay[]; total: number } | null>(null)
  const [loadingUsage, setLoadingUsage] = useState<number | null>(null)

  const fetchKeys = useCallback(async () => {
    try {
      const res = await authFetch('/api/api-keys')
      if (res.ok) {
        const data = await res.json()
        setKeys(data.keys)
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreate = async () => {
    if (!newKeyName.trim()) return
    setCreating(true)
    setError(null)
    try {
      const res = await authFetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create API key.')
        return
      }
      setRevealedKey(data.key)
      setNewKeyName('')
      await fetchKeys()
    } catch (err) {
      console.error('Create key error:', err)
      setError('Failed to create API key.')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id: number) => {
    if (!confirm('Revoke this API key? Any applications using it will stop working immediately.')) return
    setRevoking(id)
    try {
      const res = await authFetch(`/api/api-keys/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchKeys()
        if (selectedKeyUsage?.keyId === id) setSelectedKeyUsage(null)
      }
    } catch (err) {
      console.error('Revoke error:', err)
    } finally {
      setRevoking(null)
    }
  }

  const handleCopyKey = async () => {
    if (!revealedKey) return
    try {
      await navigator.clipboard.writeText(revealedKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for non-HTTPS
      const textarea = document.createElement('textarea')
      textarea.value = revealedKey
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleViewUsage = async (keyId: number) => {
    if (selectedKeyUsage?.keyId === keyId) {
      setSelectedKeyUsage(null)
      return
    }
    setLoadingUsage(keyId)
    try {
      const res = await authFetch(`/api/api-keys/${keyId}/usage`)
      if (res.ok) {
        const data = await res.json()
        setSelectedKeyUsage({ keyId, usage: data.usage, total: data.total_requests })
      }
    } catch (err) {
      console.error('Usage fetch error:', err)
    } finally {
      setLoadingUsage(null)
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  const activeKeys = keys.filter((k) => k.is_active)
  const revokedKeys = keys.filter((k) => !k.is_active)

  // API key *creation* is gated to premium+ (Pro tier in new naming).
  // Pro (Creator) sees a locked button + explainer; admin/vip pass through.
  const isAdminOrVip = userType === 'admin' || userType === 'vip'
  const canCreateKeys = isAdminOrVip || hasTier(planSlug, 'premium')

  const tierInfo =
    userType === 'admin'
      ? { limit: 600, label: 'Admin' }
      : (planSlug && PLAN_RATE_LIMITS[planSlug]) || { limit: 30, label: 'Pro' }

  const mcpConfig = `{
  "mcpServers": {
    "blossom": {
      "command": "npx",
      "args": ["-y", "@blossai/mcp-server"],
      "env": { "BLOSSOM_API_KEY": "blsm_your_key_here" }
    }
  }
}`

  const handleCopyMcp = async () => {
    try {
      await navigator.clipboard.writeText(mcpConfig)
      setMcpCopied(true)
      setTimeout(() => setMcpCopied(false), 2000)
    } catch {
      // ignore — non-HTTPS contexts
    }
  }

  // Free-tier users see a locked CTA instead of the full management UI —
  // backend would 403 on create anyway, but a locked surface is friendlier.
  if (isFreeTier) {
    return (
      <div>
        <div className="pb-6 mb-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-black tracking-tight">API Access</h2>
          <p className="text-slate-500 text-sm mt-1">
            Create and manage API keys to access Blossom data programmatically.
          </p>
        </div>
        <div className="glass-card rounded-3xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 mb-4">
            <i className="fas fa-key text-pink-400 text-xl" />
          </div>
          <h3 className="text-xl font-black mb-2">API access is a paid feature</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            Upgrade to Pro, Premium, or Platin to create API keys, hit the public
            API at <code className="text-pink-400">/api/v1</code>, and drive Blossom
            from Claude, Cursor, or your own tooling via the MCP server.
          </p>
          <button
            onClick={() => openUpgrade('api-keys')}
            className="px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-500/25 transition-all text-sm"
          >
            <i className="fas fa-arrow-up-right-from-square mr-2" />
            See plans
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-black tracking-tight">API Access</h2>
          {!canCreateKeys && <UpsellBadge tier="premium" />}
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Create and manage API keys to access Blossom data programmatically.
          <span className="ml-2 text-slate-400">
            Your <strong className="text-pink-400">{tierInfo.label}</strong> plan:{' '}
            <strong>{tierInfo.limit} requests/min</strong>.
          </span>
        </p>
      </div>

      {/* Creator-tier explainer: API key creation needs Pro (premium) or above */}
      {!canCreateKeys && (
        <div className="mb-6 glass-card rounded-2xl p-5 border border-purple-400/30 bg-gradient-to-br from-purple-500/10 to-pink-500/5">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
              <i className="fas fa-key text-purple-300 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-sm font-black text-white">
                  Public API access requires Pro plan or above
                </h3>
                <UpsellBadge tier="premium" size="sm" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                Your <strong className="text-white">Creator</strong> plan includes the MCP
                server. To create REST API keys and hit{' '}
                <code className="text-pink-400">/api/v1</code> directly from your own apps,
                upgrade to Pro.
              </p>
              <button
                type="button"
                onClick={() => openUpgrade('api-keys-explainer')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-transform shadow-lg shadow-purple-500/25"
              >
                <i className="fas fa-bolt text-[10px]" />
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Revealed Modal */}
      {revealedKey && (
        <div className="mb-6 glass-card rounded-2xl p-5 border-2 border-emerald-500/30 bg-emerald-500/[0.03]">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <i className="fas fa-key text-emerald-400 text-sm"></i>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">API Key Created</h3>
              <p className="text-xs text-amber-400 mt-0.5">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Copy this key now. It will not be shown again.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2.5 bg-black/30 rounded-xl text-xs font-mono text-emerald-400 break-all select-all border border-white/[0.06]">
              {revealedKey}
            </code>
            <button
              onClick={handleCopyKey}
              className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-[10px]`}></i>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            I've saved the key, close this
          </button>
        </div>
      )}

      {/* Create Key Form */}
      <div className="glass-card rounded-2xl p-5 mb-6">
        <h3 className="text-sm font-bold text-white mb-3">Create New API Key</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="Key name (e.g., Production App, Dev Testing)"
            maxLength={100}
            className="flex-1 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/40 focus:ring-1 focus:ring-pink-500/20 transition-all"
          />
          <DisabledUpsellButton
            requiredTier="premium"
            upgradeSource="api-keys-create"
            onClick={handleCreate}
            disabled={creating || !newKeyName.trim()}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20 flex items-center gap-2 justify-center"
          >
            {creating ? (
              <>
                <i className="fas fa-spinner fa-spin text-xs"></i>
                Creating...
              </>
            ) : (
              <>
                <i className="fas fa-plus text-xs"></i>
                Create Key
              </>
            )}
          </DisabledUpsellButton>
        </div>
        {error && (
          <p className="mt-2 text-xs text-red-400">
            <i className="fas fa-exclamation-circle mr-1"></i>
            {error}
          </p>
        )}
        <p className="mt-2 text-[11px] text-slate-600">
          Keys authenticate requests via the <code className="text-slate-400">X-API-Key</code> header. Max 5 active keys per account.
        </p>
      </div>

      {/* Keys List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-slate-500 text-xl"></i>
        </div>
      ) : activeKeys.length === 0 && revokedKeys.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-key text-slate-600 text-xl"></i>
          </div>
          <h3 className="text-sm font-bold text-white mb-1">No API Keys</h3>
          <p className="text-xs text-slate-500">Create your first API key to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeKeys.map((key) => (
            <div key={key.id} className="glass-card rounded-2xl overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-key text-pink-400 text-sm"></i>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white truncate">{key.name}</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider flex-shrink-0">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <code className="text-[11px] text-slate-500 font-mono">{key.key_prefix}...</code>
                      <span className="text-[11px] text-slate-600">Created {formatDate(key.created_at)}</span>
                      {key.last_used_at && (
                        <span className="text-[11px] text-slate-600">Last used {formatDate(key.last_used_at)}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleViewUsage(key.id)}
                    disabled={loadingUsage === key.id}
                    className="px-3 py-1.5 border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.04] rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    {loadingUsage === key.id ? (
                      <i className="fas fa-spinner fa-spin text-[10px]"></i>
                    ) : (
                      <i className="fas fa-chart-bar text-[10px]"></i>
                    )}
                    Usage
                  </button>
                  <button
                    onClick={() => handleRevoke(key.id)}
                    disabled={revoking === key.id}
                    className="px-3 py-1.5 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                  >
                    {revoking === key.id ? (
                      <i className="fas fa-spinner fa-spin text-[10px]"></i>
                    ) : (
                      <i className="fas fa-ban text-[10px]"></i>
                    )}
                    Revoke
                  </button>
                </div>
              </div>

              {/* Usage Panel */}
              {selectedKeyUsage?.keyId === key.id && (
                <div className="border-t border-white/[0.06] px-4 sm:px-5 py-4 bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-white">Usage (Last 30 Days)</h4>
                    <span className="text-xs text-slate-500">
                      Total: <span className="text-white font-bold">{selectedKeyUsage.total.toLocaleString()}</span> requests
                    </span>
                  </div>
                  {selectedKeyUsage.usage.length === 0 ? (
                    <p className="text-xs text-slate-600 py-2">No usage recorded yet.</p>
                  ) : (
                    <div className="flex items-end gap-[2px] h-16">
                      {(() => {
                        const maxCount = Math.max(...selectedKeyUsage.usage.map((u) => u.request_count), 1)
                        return selectedKeyUsage.usage
                          .slice()
                          .reverse()
                          .map((day, i) => {
                            const height = Math.max(2, (day.request_count / maxCount) * 100)
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-pink-500/40 hover:bg-pink-500/60 rounded-t transition-colors cursor-default"
                                style={{ height: `${height}%` }}
                                title={`${new Date(day.date).toLocaleDateString()}: ${day.request_count} requests`}
                              />
                            )
                          })
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Revoked Keys */}
          {revokedKeys.length > 0 && (
            <>
              <div className="pt-4 pb-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revoked Keys</h3>
              </div>
              {revokedKeys.map((key) => (
                <div key={key.id} className="glass-card rounded-2xl p-4 sm:p-5 opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-key text-slate-600 text-sm"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-400 truncate">{key.name}</span>
                        <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                          Revoked
                        </span>
                      </div>
                      <code className="text-[11px] text-slate-600 font-mono">{key.key_prefix}...</code>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* API Documentation Quick Reference */}
      <div className="mt-8 glass-card rounded-2xl p-5">
        <h3 className="text-sm font-bold text-white mb-3">Quick Reference</h3>
        <div className="space-y-3 text-xs text-slate-400">
          <div>
            <span className="text-slate-500 font-semibold">Base URL:</span>
            <code className="ml-2 text-pink-400">{window.location.origin}/api/v1</code>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Authentication:</span>
            <code className="ml-2 text-slate-300">X-API-Key: blsm_your_key_here</code>
          </div>
          <div>
            <span className="text-slate-500 font-semibold">Rate Limit:</span>
            <span className="ml-2">
              {tierInfo.limit} requests/minute ({tierInfo.label} plan)
            </span>
          </div>
          <div className="pt-2 border-t border-white/[0.04]">
            <span className="text-slate-500 font-semibold block mb-2">Available Endpoints:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {[
                { method: 'GET', path: '/videos', desc: 'List & filter videos' },
                { method: 'GET', path: '/videos/:id', desc: 'Video detail with analysis' },
                { method: 'GET', path: '/influencers', desc: 'List & filter creators' },
                { method: 'GET', path: '/influencers/:id', desc: 'Creator profile & videos' },
                { method: 'GET', path: '/formats', desc: 'Viral format classes' },
                { method: 'GET', path: '/hooks', desc: 'Hook classes' },
                { method: 'GET', path: '/tactics', desc: 'Viral tactics' },
                { method: 'GET', path: '/music', desc: 'Music tracks' },
                { method: 'GET', path: '/suggestions', desc: 'Content suggestions' },
                { method: 'GET', path: '/trending/posts', desc: 'Trending posts' },
                { method: 'GET', path: '/trending/formats', desc: 'Trending formats' },
                { method: 'GET', path: '/trending/hooks', desc: 'Trending hooks' },
                { method: 'GET', path: '/trending/songs', desc: 'Trending songs' },
                { method: 'GET', path: '/categories', desc: 'Your categories' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold rounded font-mono">
                    {ep.method}
                  </span>
                  <code className="text-slate-300">{ep.path}</code>
                  <span className="text-slate-600 hidden sm:inline">- {ep.desc}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-white/[0.04]">
            <span className="text-slate-500 font-semibold">Example:</span>
            <pre className="mt-1.5 px-3 py-2 bg-black/30 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-white/[0.04]">
{`curl -H "X-API-Key: blsm_your_key" \\
  "${window.location.origin}/api/v1/videos?limit=10&sort_by=views&order=desc"`}
            </pre>
          </div>
        </div>
      </div>

      {/* ── MCP Server: drop into Claude Desktop / Cursor / Continue ── */}
      <div className="mt-6 glass-card rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <i className="fas fa-plug text-pink-400 text-xs" />
              Connect to Claude / Cursor (MCP)
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Drop this into your MCP client config to drive Blossom from any
              LLM. Uses one of your API keys.
            </p>
          </div>
          <button
            onClick={handleCopyMcp}
            className="px-3 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] rounded-lg text-[11px] font-bold text-slate-300 transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            <i className={`fas ${mcpCopied ? 'fa-check' : 'fa-copy'} text-[10px]`} />
            {mcpCopied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="px-3 py-2.5 bg-black/30 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto border border-white/[0.04] leading-relaxed">
{mcpConfig}
        </pre>
        <p className="mt-2 text-[11px] text-slate-600">
          Replace <code className="text-slate-400">blsm_your_key_here</code> with a key you create above. See the{' '}
          <a
            href="https://www.npmjs.com/package/@blossai/mcp-server"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300"
          >
            @blossai/mcp-server
          </a>{' '}
          README for full tool reference.
        </p>
      </div>
    </div>
  )
}
