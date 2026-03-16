import { useEffect, useState, useCallback } from 'react'
import { authFetch } from '../lib/api'

interface OverviewStats {
  new_visitors: number
  total_sessions: number
  reached_pricing: number
  reached_signup: number
  conversions: number
  avg_session_duration: number
  avg_pageviews_per_session: number
  total_pageviews: number
}

interface FunnelData {
  total_sessions: number
  engaged_sessions: number
  viewed_pricing: number
  reached_signup: number
  reached_login: number
  converted: number
}

interface PageStats {
  page_path: string
  views: number
  unique_visitors: number
  avg_time_seconds: number
  avg_scroll_depth: number
}

interface EventStats {
  event_name: string
  event_category: string
  count: number
  unique_visitors: number
}

interface PricingStats {
  plan_slug: string
  plan_name: string
  plan_price_cents: number
  billing_interval: string
  interaction_type: string
  count: number
  unique_visitors: number
  avg_time_spent: number
}

interface DeviceStats {
  device_type: string
  visitors: number
  conversions: number
}

interface BrowserStats {
  browser: string
  visitors: number
  conversions: number
}

interface UtmStats {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  sessions: number
  conversions: number
  avg_duration: number
}

interface ReferrerStats {
  referrer: string
  sessions: number
  conversions: number
}

interface VariantStats {
  landing_variant: string
  sessions: number
  viewed_pricing: number
  reached_signup: number
  conversions: number
  avg_duration: number
  avg_pageviews: number
}

interface TimelinePoint {
  period: string
  visitors: number
}

interface SessionRow {
  id: number
  started_at: string
  duration_seconds: number | null
  landing_page: string
  exit_page: string | null
  referrer: string | null
  utm_source: string | null
  pageview_count: number
  event_count: number
  reached_pricing: boolean
  reached_signup: boolean
  converted: boolean
  device_type: string | null
  browser: string | null
  os: string | null
  ip_address: string
  visitor_first_seen: string
  visitor_total_sessions: number
  visitor_registered: string | null
}

const DAYS_OPTIONS = [7, 14, 30, 60, 90]

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0s'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  if (m === 0) return `${s}s`
  return `${m}m ${s}s`
}

function pct(part: number, total: number): string {
  if (!total) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`
}

export default function SiteAnalytics() {
  const [days, setDays] = useState(30)
  const [tab, setTab] = useState<'overview' | 'funnel' | 'pages' | 'events' | 'pricing' | 'sources' | 'sessions' | 'variants'>('overview')
  const [loading, setLoading] = useState(true)

  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [funnel, setFunnel] = useState<FunnelData | null>(null)
  const [timeline, setTimeline] = useState<TimelinePoint[]>([])
  const [pages, setPages] = useState<PageStats[]>([])
  const [events, setEvents] = useState<EventStats[]>([])
  const [pricing, setPricing] = useState<PricingStats[]>([])
  const [devices, setDevices] = useState<DeviceStats[]>([])
  const [browsers, setBrowsers] = useState<BrowserStats[]>([])
  const [utm, setUtm] = useState<UtmStats[]>([])
  const [referrers, setReferrers] = useState<ReferrerStats[]>([])
  const [variants, setVariants] = useState<VariantStats[]>([])
  const [sessions, setSessions] = useState<SessionRow[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const base = `/api/sa/admin`
      const q = `?days=${days}`

      if (tab === 'overview') {
        const [ovRes, tlRes, devRes, brRes] = await Promise.all([
          authFetch(`${base}/overview${q}`).then((r) => r.json()),
          authFetch(`${base}/timeline${q}`).then((r) => r.json()),
          authFetch(`${base}/devices${q}`).then((r) => r.json()),
          authFetch(`${base}/browsers${q}`).then((r) => r.json()),
        ])
        setOverview(ovRes)
        setTimeline(tlRes)
        setDevices(devRes)
        setBrowsers(brRes)
      } else if (tab === 'funnel') {
        const res = await authFetch(`${base}/funnel${q}`).then((r) => r.json())
        setFunnel(res)
      } else if (tab === 'pages') {
        const res = await authFetch(`${base}/pages${q}`).then((r) => r.json())
        setPages(res)
      } else if (tab === 'events') {
        const res = await authFetch(`${base}/events${q}`).then((r) => r.json())
        setEvents(res)
      } else if (tab === 'pricing') {
        const res = await authFetch(`${base}/pricing${q}`).then((r) => r.json())
        setPricing(res)
      } else if (tab === 'sources') {
        const [utmRes, refRes] = await Promise.all([
          authFetch(`${base}/utm${q}`).then((r) => r.json()),
          authFetch(`${base}/referrers${q}`).then((r) => r.json()),
        ])
        setUtm(utmRes)
        setReferrers(refRes)
      } else if (tab === 'sessions') {
        const res = await authFetch(`${base}/sessions?limit=100`).then((r) => r.json())
        setSessions(res)
      } else if (tab === 'variants') {
        const res = await authFetch(`${base}/variants${q}`).then((r) => r.json())
        setVariants(res)
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [days, tab])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'funnel', label: 'Funnel' },
    { key: 'pages', label: 'Pages' },
    { key: 'events', label: 'Events' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'sources', label: 'Sources' },
    { key: 'variants', label: 'Variants' },
    { key: 'sessions', label: 'Sessions' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Site Analytics</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Anonymous visitor behavior & conversion funnel</p>
        </div>
        <div className="flex items-center gap-2">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                days === d
                  ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
              tab === t.key
                ? 'bg-white/10 text-white border border-white/10'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'overview' && overview && <OverviewTab overview={overview} timeline={timeline} devices={devices} browsers={browsers} />}
          {tab === 'funnel' && funnel && <FunnelTab funnel={funnel} />}
          {tab === 'pages' && <PagesTab pages={pages} />}
          {tab === 'events' && <EventsTab events={events} />}
          {tab === 'pricing' && <PricingTab pricing={pricing} />}
          {tab === 'sources' && <SourcesTab utm={utm} referrers={referrers} />}
          {tab === 'variants' && <VariantsTab variants={variants} />}
          {tab === 'sessions' && <SessionsTab sessions={sessions} />}
        </>
      )}
    </div>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ overview, timeline, devices, browsers }: {
  overview: OverviewStats
  timeline: TimelinePoint[]
  devices: DeviceStats[]
  browsers: BrowserStats[]
}) {
  const convRate = overview.total_sessions > 0
    ? ((overview.conversions / overview.total_sessions) * 100).toFixed(2)
    : '0'

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="New Visitors" value={overview.new_visitors.toLocaleString()} />
        <KpiCard label="Total Sessions" value={overview.total_sessions.toLocaleString()} />
        <KpiCard label="Total Pageviews" value={overview.total_pageviews.toLocaleString()} />
        <KpiCard label="Conversions" value={overview.conversions.toLocaleString()} accent />
        <KpiCard label="Conversion Rate" value={`${convRate}%`} accent />
        <KpiCard label="Avg Session Duration" value={formatDuration(Number(overview.avg_session_duration))} />
        <KpiCard label="Avg Pages / Session" value={Number(overview.avg_pageviews_per_session).toFixed(1)} />
        <KpiCard label="Saw Pricing" value={overview.reached_pricing.toLocaleString()} />
      </div>

      {/* Timeline */}
      {timeline.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-4">New Visitors Over Time</h3>
          <div className="flex items-end gap-1 h-32">
            {timeline.map((point, i) => {
              const max = Math.max(...timeline.map((p) => Number(p.visitors)), 1)
              const height = (Number(point.visitors) / max) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-pink-500/60 to-pink-400/40 transition-all hover:from-pink-500/80"
                    style={{ height: `${Math.max(height, 2)}%` }}
                    title={`${new Date(point.period).toLocaleDateString()}: ${point.visitors} visitors`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-2">
            <span>{timeline[0] ? new Date(timeline[0].period).toLocaleDateString() : ''}</span>
            <span>{(() => { const last = timeline[timeline.length - 1]; return last ? new Date(last.period).toLocaleDateString() : '' })()}</span>
          </div>
        </div>
      )}

      {/* Device & Browser breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Devices</h3>
          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.device_type} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{d.device_type}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{d.visitors} visitors</span>
                  <span className="text-xs text-teal-400 font-bold">{d.conversions} conv.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-4">Browsers</h3>
          <div className="space-y-3">
            {browsers.map((b) => (
              <div key={b.browser} className="flex items-center justify-between">
                <span className="text-sm font-medium">{b.browser}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{b.visitors} visitors</span>
                  <span className="text-xs text-teal-400 font-bold">{b.conversions} conv.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Funnel Tab ───────────────────────────────────────────────────

function FunnelTab({ funnel }: { funnel: FunnelData }) {
  const steps = [
    { label: 'All Sessions', value: Number(funnel.total_sessions), color: 'bg-slate-500' },
    { label: 'Engaged (>1 page)', value: Number(funnel.engaged_sessions), color: 'bg-blue-500' },
    { label: 'Viewed Pricing', value: Number(funnel.viewed_pricing), color: 'bg-violet-500' },
    { label: 'Reached Signup', value: Number(funnel.reached_signup), color: 'bg-orange-500' },
    { label: 'Reached Login', value: Number(funnel.reached_login), color: 'bg-cyan-500' },
    { label: 'Converted', value: Number(funnel.converted), color: 'bg-teal-500' },
  ]

  const maxVal = Math.max(...steps.map((s) => s.value), 1)

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-sm font-bold text-slate-300 mb-6">Conversion Funnel</h3>
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium">{step.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">{step.value.toLocaleString()}</span>
                {i > 0 && (
                  <span className="text-xs text-slate-500">
                    ({pct(step.value, steps[0]!.value)} of total, {pct(step.value, steps[i - 1]!.value)} of prev)
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 bg-white/5 rounded-lg overflow-hidden">
              <div
                className={`h-full ${step.color} rounded-lg transition-all duration-500`}
                style={{ width: `${(step.value / maxVal) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pages Tab ────────────────────────────────────────────────────

function PagesTab({ pages }: { pages: PageStats[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-4">Page</th>
            <th className="px-4 py-4 text-right">Views</th>
            <th className="px-4 py-4 text-right">Unique</th>
            <th className="px-4 py-4 text-right">Avg Time</th>
            <th className="px-4 py-4 text-right">Scroll Depth</th>
          </tr>
        </thead>
        <tbody>
          {pages.map((p) => (
            <tr key={p.page_path} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-6 py-3 font-medium text-white">{p.page_path}</td>
              <td className="px-4 py-3 text-right text-slate-300">{Number(p.views).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{Number(p.unique_visitors).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{formatDuration(p.avg_time_seconds)}</td>
              <td className="px-4 py-3 text-right text-slate-400">{p.avg_scroll_depth}%</td>
            </tr>
          ))}
          {pages.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No pageview data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Events Tab ───────────────────────────────────────────────────

function EventsTab({ events }: { events: EventStats[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-4">Event</th>
            <th className="px-4 py-4">Category</th>
            <th className="px-4 py-4 text-right">Count</th>
            <th className="px-4 py-4 text-right">Unique Users</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-6 py-3 font-medium text-white">{e.event_name}</td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  e.event_category === 'conversion' ? 'bg-teal-500/20 text-teal-400' :
                  e.event_category === 'engagement' ? 'bg-blue-500/20 text-blue-400' :
                  e.event_category === 'interaction' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-white/10 text-slate-400'
                }`}>
                  {e.event_category}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-slate-300">{Number(e.count).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{Number(e.unique_visitors).toLocaleString()}</td>
            </tr>
          ))}
          {events.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">No events yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Pricing Tab ──────────────────────────────────────────────────

function PricingTab({ pricing }: { pricing: PricingStats[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-4">Plan</th>
            <th className="px-4 py-4">Price</th>
            <th className="px-4 py-4">Interaction</th>
            <th className="px-4 py-4 text-right">Count</th>
            <th className="px-4 py-4 text-right">Unique</th>
            <th className="px-4 py-4 text-right">Avg Time</th>
          </tr>
        </thead>
        <tbody>
          {pricing.map((p, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-6 py-3 font-medium text-white">{p.plan_name || p.plan_slug || '(all plans)'}</td>
              <td className="px-4 py-3 text-slate-400">
                {p.plan_price_cents ? `${formatPrice(p.plan_price_cents)}/${p.billing_interval}` : '-'}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  p.interaction_type === 'click_cta' ? 'bg-teal-500/20 text-teal-400' :
                  p.interaction_type === 'hover' ? 'bg-orange-500/20 text-orange-400' :
                  'bg-white/10 text-slate-400'
                }`}>
                  {p.interaction_type}
                </span>
              </td>
              <td className="px-4 py-3 text-right text-slate-300">{Number(p.count).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{Number(p.unique_visitors).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{formatDuration(p.avg_time_spent)}</td>
            </tr>
          ))}
          {pricing.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No pricing data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Sources Tab ──────────────────────────────────────────────────

function SourcesTab({ utm, referrers }: { utm: UtmStats[]; referrers: ReferrerStats[] }) {
  return (
    <div className="space-y-6">
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-slate-300">UTM Campaigns</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
              <th className="px-6 py-3">Source</th>
              <th className="px-4 py-3">Medium</th>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3 text-right">Sessions</th>
              <th className="px-4 py-3 text-right">Conv.</th>
              <th className="px-4 py-3 text-right">Avg Duration</th>
            </tr>
          </thead>
          <tbody>
            {utm.map((u, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-6 py-3 font-medium text-white">{u.utm_source}</td>
                <td className="px-4 py-3 text-slate-400">{u.utm_medium}</td>
                <td className="px-4 py-3 text-slate-400">{u.utm_campaign}</td>
                <td className="px-4 py-3 text-right text-slate-300">{Number(u.sessions).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-teal-400 font-bold">{Number(u.conversions)}</td>
                <td className="px-4 py-3 text-right text-slate-400">{formatDuration(u.avg_duration)}</td>
              </tr>
            ))}
            {utm.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-6 text-center text-slate-500">No UTM data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5">
          <h3 className="text-sm font-bold text-slate-300">Referrers</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
              <th className="px-6 py-3">Referrer</th>
              <th className="px-4 py-3 text-right">Sessions</th>
              <th className="px-4 py-3 text-right">Conversions</th>
            </tr>
          </thead>
          <tbody>
            {referrers.map((r, i) => (
              <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                <td className="px-6 py-3 font-medium text-white truncate max-w-xs">{r.referrer}</td>
                <td className="px-4 py-3 text-right text-slate-300">{Number(r.sessions).toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-teal-400 font-bold">{Number(r.conversions)}</td>
              </tr>
            ))}
            {referrers.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-500">No referrer data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Variants Tab ─────────────────────────────────────────────────

function VariantsTab({ variants }: { variants: VariantStats[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5">
        <h3 className="text-sm font-bold text-slate-300">Landing Page Variants (A/B Testing)</h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
            <th className="px-6 py-3">Variant</th>
            <th className="px-4 py-3 text-right">Sessions</th>
            <th className="px-4 py-3 text-right">Saw Pricing</th>
            <th className="px-4 py-3 text-right">Reached Signup</th>
            <th className="px-4 py-3 text-right">Conversions</th>
            <th className="px-4 py-3 text-right">Conv Rate</th>
            <th className="px-4 py-3 text-right">Avg Duration</th>
            <th className="px-4 py-3 text-right">Avg Pages</th>
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
              <td className="px-6 py-3 font-medium text-white">{v.landing_variant}</td>
              <td className="px-4 py-3 text-right text-slate-300">{Number(v.sessions).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{Number(v.viewed_pricing).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-slate-400">{Number(v.reached_signup).toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-teal-400 font-bold">{Number(v.conversions)}</td>
              <td className="px-4 py-3 text-right text-pink-400 font-bold">{pct(Number(v.conversions), Number(v.sessions))}</td>
              <td className="px-4 py-3 text-right text-slate-400">{formatDuration(v.avg_duration)}</td>
              <td className="px-4 py-3 text-right text-slate-400">{v.avg_pageviews}</td>
            </tr>
          ))}
          {variants.length === 0 && (
            <tr><td colSpan={8} className="px-6 py-6 text-center text-slate-500">No variant data yet</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Sessions Tab ─────────────────────────────────────────────────

function SessionsTab({ sessions }: { sessions: SessionRow[] }) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="text-left text-xs text-slate-400 font-bold uppercase tracking-wider border-b border-white/5">
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Landing</th>
              <th className="px-4 py-3">Exit</th>
              <th className="px-4 py-3 text-right">Pages</th>
              <th className="px-4 py-3 text-right">Events</th>
              <th className="px-4 py-3 text-right">Duration</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3 text-center">Pricing</th>
              <th className="px-4 py-3 text-center">Signup</th>
              <th className="px-4 py-3 text-center">Conv.</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id} className={`border-b border-white/[0.03] hover:bg-white/[0.02] ${s.converted ? 'bg-teal-500/5' : ''}`}>
                <td className="px-4 py-2.5 text-slate-300 text-xs">
                  {new Date(s.started_at).toLocaleString()}
                </td>
                <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{s.ip_address}</td>
                <td className="px-4 py-2.5 text-white font-medium text-xs">{s.landing_page}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{s.exit_page || '-'}</td>
                <td className="px-4 py-2.5 text-right text-slate-300">{s.pageview_count}</td>
                <td className="px-4 py-2.5 text-right text-slate-400">{s.event_count}</td>
                <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{s.duration_seconds ? formatDuration(s.duration_seconds) : '-'}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs capitalize">{s.device_type || '-'}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs">{s.utm_source || s.referrer || '(direct)'}</td>
                <td className="px-4 py-2.5 text-center">
                  {s.reached_pricing ? <span className="text-violet-400">&#10003;</span> : <span className="text-slate-600">-</span>}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {s.reached_signup ? <span className="text-orange-400">&#10003;</span> : <span className="text-slate-600">-</span>}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {s.converted ? <span className="text-teal-400 font-bold">&#10003;</span> : <span className="text-slate-600">-</span>}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-8 text-center text-slate-500">No sessions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── KPI Card ─────────────────────────────────────────────────────

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</div>
      <div className={`text-2xl font-black ${accent ? 'text-teal-400' : 'text-white'}`}>{value}</div>
    </div>
  )
}
