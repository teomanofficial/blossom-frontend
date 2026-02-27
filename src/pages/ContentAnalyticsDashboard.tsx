import { useEffect, useState } from 'react'
import { authFetch } from '../lib/api'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

interface Summary {
  total_posts: number
  total_influencers: number
  total_categories: number
  total_domains: number
  total_hashtags: number
}

interface CategoryStat {
  id: number
  title: string
  icon: string | null
  post_count: number
  influencer_count: number
  domain_count: number
}

interface DomainStat {
  id: number
  name: string
  icon: string | null
  category: string | null
  post_count: number
  influencer_count: number
}

interface HashtagStat {
  name: string
  post_count: number
  influencer_count: number
}

interface ContentAnalytics {
  summary: Summary
  by_category: CategoryStat[]
  by_domain: DomainStat[]
  by_hashtag: HashtagStat[]
}

function fmt(n: number): string {
  if (!n) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k'
  return String(Math.round(n))
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-slate-800 border border-white/10 px-3 py-2 shadow-xl">
      <p className="text-xs text-white font-bold mb-1">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-slate-300">{entry.name}:</span>
          <span className="font-semibold text-white">{fmt(entry.value)}</span>
        </div>
      ))}
    </div>
  )
}

const PINK = '#ec4899'
const ORANGE = '#f97316'

export default function ContentAnalyticsDashboard() {
  const [data, setData] = useState<ContentAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const res = await authFetch('/api/content-analytics/overview')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch content analytics:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <h3 className="font-black text-lg mb-2">Failed to load analytics</h3>
        <p className="text-slate-500 text-sm">Please try again later.</p>
      </div>
    )
  }

  const kpiCards = [
    { label: 'Total Posts', value: fmt(data.summary.total_posts), icon: 'fa-video', color: PINK },
    { label: 'Total Influencers', value: fmt(data.summary.total_influencers), icon: 'fa-users', color: ORANGE },
    { label: 'Total Categories', value: fmt(data.summary.total_categories), icon: 'fa-folder-tree', color: '#a78bfa' },
    { label: 'Total Domains', value: fmt(data.summary.total_domains), icon: 'fa-layer-group', color: '#06b6d4' },
    { label: 'Total Hashtags', value: fmt(data.summary.total_hashtags), icon: 'fa-hashtag', color: '#22c55e' },
  ]

  const categoryData = data.by_category.filter(c => c.post_count > 0 || c.influencer_count > 0)
  const domainData = data.by_domain.slice(0, 20)
  const hashtagData = data.by_hashtag.slice(0, 20).map(h => ({ ...h, name: `#${h.name}` }))

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded">
              Analytics
            </span>
          </div>
          <h1 className="text-4xl font-black font-display tracking-tighter mb-2">CONTENT OVERVIEW</h1>
          <p className="text-slate-500 text-sm font-medium">
            Distribution of posts and influencers across categories, domains, and hashtags.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
        {kpiCards.map(card => (
          <div key={card.label} className="glass-card rounded-2xl p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-black text-white">{card.value}</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{card.label}</div>
              </div>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${card.color}18` }}>
                <i className={`fas ${card.icon}`} style={{ color: card.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* By Category */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <i className="fas fa-folder-tree text-purple-400 text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">By Category</h2>
            <p className="text-xs text-slate-500 font-medium">Posts and influencers per content category</p>
          </div>
        </div>
        {categoryData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, categoryData.length * 50)}>
            <BarChart data={categoryData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="title" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={95} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="post_count" name="Posts" fill={PINK} radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="influencer_count" name="Influencers" fill={ORANGE} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-600 text-sm">No category data available</div>
        )}
      </div>

      {/* By Domain */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <i className="fas fa-layer-group text-cyan-400 text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">By Domain</h2>
            <p className="text-xs text-slate-500 font-medium">Top 20 domains by post count</p>
          </div>
        </div>
        {domainData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={domainData} margin={{ top: 4, right: 24, bottom: 60, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                interval={0}
              />
              <YAxis tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="post_count" name="Posts" fill={PINK} radius={[4, 4, 0, 0]} barSize={16} />
              <Bar dataKey="influencer_count" name="Influencers" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-600 text-sm">No domain data available</div>
        )}
      </div>

      {/* By Hashtag */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <i className="fas fa-hashtag text-green-400 text-sm" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">By Hashtag</h2>
            <p className="text-xs text-slate-500 font-medium">Top 20 hashtags by post count</p>
          </div>
        </div>
        {hashtagData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(300, hashtagData.length * 50)}>
            <BarChart data={hashtagData} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 110 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" tickFormatter={fmt} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={105} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="post_count" name="Posts" fill={PINK} radius={[0, 4, 4, 0]} barSize={16} />
              <Bar dataKey="influencer_count" name="Influencers" fill={ORANGE} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center py-12 text-slate-600 text-sm">No hashtag data available</div>
        )}
      </div>
    </>
  )
}
