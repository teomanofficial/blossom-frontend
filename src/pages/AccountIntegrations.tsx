import { useState, useEffect, useCallback } from 'react'
import { authFetch } from '../lib/api'

interface SocialAccount {
  id: number
  platform: 'instagram' | 'tiktok'
  username: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  follower_count: number
  following_count: number
  post_count: number
  status: string
  has_oauth: boolean
  token_valid: boolean
  last_synced_at: string | null
  created_at: string
}

const PLATFORMS = [
  {
    key: 'instagram' as const,
    label: 'Instagram',
    icon: 'fa-instagram',
    iconBrand: true,
    gradient: 'from-purple-500 via-pink-500 to-orange-400',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10',
    description: 'Connect your Instagram Business or Creator account to sync posts, track metrics, and publish content.',
  },
  {
    key: 'tiktok' as const,
    label: 'TikTok',
    icon: 'fa-tiktok',
    iconBrand: true,
    gradient: 'from-cyan-400 to-pink-500',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    description: 'Connect your TikTok account to sync videos, monitor performance, and publish new content.',
  },
]

export default function AccountIntegrations() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState<number | null>(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await authFetch('/api/social/accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data)
      }
    } catch (err) {
      console.error('Failed to fetch accounts:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleConnect = async (platform: 'instagram' | 'tiktok') => {
    setConnecting(platform)
    try {
      const res = await authFetch(`/api/social/${platform}/auth-url`)
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to get authorization URL')
        return
      }
      const { url } = await res.json()

      // Open OAuth popup
      const width = 600
      const height = 700
      const left = window.screenX + (window.innerWidth - width) / 2
      const top = window.screenY + (window.innerHeight - height) / 2
      const popup = window.open(
        url,
        `${platform}_oauth`,
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
      )

      // Poll for popup close
      const pollTimer = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(pollTimer)
          setConnecting(null)
          // Refetch accounts after popup closes
          fetchAccounts()
        }
      }, 500)
    } catch (err) {
      console.error('Connect error:', err)
      alert('Failed to initiate connection')
    } finally {
      // connecting state is cleared when popup closes
    }
  }

  const handleDisconnect = async (account: SocialAccount) => {
    if (!confirm(`Disconnect @${account.username} from ${account.platform === 'instagram' ? 'Instagram' : 'TikTok'}? You can reconnect anytime.`)) {
      return
    }
    setDisconnecting(account.id)
    try {
      const res = await authFetch(`/api/social/accounts/${account.id}/disconnect`, { method: 'POST' })
      if (res.ok) {
        await fetchAccounts()
      }
    } catch (err) {
      console.error('Disconnect error:', err)
    } finally {
      setDisconnecting(null)
    }
  }

  const getAccountForPlatform = (platform: string) =>
    accounts.find((a) => a.platform === platform && a.status === 'active')

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

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <div>
      {/* Section title */}
      <div className="pb-6 mb-6 border-b border-white/[0.06]">
        <h2 className="text-xl font-black tracking-tight">Integrations</h2>
        <p className="text-slate-500 text-sm mt-1">
          Connect your social media accounts to sync content and track performance.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-slate-500 text-xl"></i>
        </div>
      ) : (
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const account = getAccountForPlatform(platform.key)
            const isConnecting = connecting === platform.key
            const isDisconnecting = account ? disconnecting === account.id : false

            return (
              <div
                key={platform.key}
                className="border border-white/[0.08] rounded-2xl bg-white/[0.02] overflow-hidden"
              >
                {/* Platform header */}
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl ${platform.bgColor} flex items-center justify-center`}>
                      <i className={`${platform.iconBrand ? 'fab' : 'fas'} ${platform.icon} ${platform.color} text-lg`}></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{platform.label}</h3>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-md">
                        {platform.description}
                      </p>
                    </div>
                  </div>

                  {!account ? (
                    <button
                      onClick={() => handleConnect(platform.key)}
                      disabled={isConnecting}
                      className="px-5 py-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 shadow-lg shadow-pink-500/20 flex items-center gap-2"
                    >
                      {isConnecting ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-xs"></i>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-plug text-xs"></i>
                          Connect
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDisconnect(account)}
                      disabled={isDisconnecting}
                      className="px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {isDisconnecting ? (
                        <>
                          <i className="fas fa-spinner fa-spin text-xs"></i>
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-unlink text-xs"></i>
                          Disconnect
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Connected account details */}
                {account && (
                  <div className="border-t border-white/[0.06] px-5 py-4 bg-white/[0.01]">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-white/5 flex-shrink-0">
                        {account.avatar_url ? (
                          <img src={account.avatar_url} alt={account.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${platform.gradient} flex items-center justify-center text-sm font-bold text-white`}>
                            {account.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            @{account.username}
                          </span>
                          {account.token_valid ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                              Active
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                              Token Expired
                            </span>
                          )}
                        </div>
                        {account.display_name && (
                          <p className="text-xs text-slate-500 truncate">{account.display_name}</p>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-5 text-center">
                        <div>
                          <div className="text-sm font-bold text-white">{formatNumber(account.follower_count)}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Followers</div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{formatNumber(account.post_count)}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Posts</div>
                        </div>
                        <div>
                          <div className="text-xs text-slate-400">{formatDate(account.last_synced_at)}</div>
                          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Last Sync</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
