import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUpgrade } from '../context/UpgradeContext'
import McpIntegrationsSection from '../components/McpIntegrationsSection'

const TOOL_GROUPS = [
  {
    icon: 'fa-rectangle-list',
    title: 'Read',
    tools: [
      'list_videos · get_video',
      'list_influencers · get_influencer',
      'list_formats · get_format',
      'list_hooks · get_hook',
      'list_tactics · get_tactic',
      'list_music · get_track',
      'list_suggestions · get_suggestion',
      'list_trending',
      'list_categories',
    ],
  },
  {
    icon: 'fa-wand-magic-sparkles',
    title: 'Analyze',
    tools: ['trigger_analysis', 'get_analysis_status'],
  },
  {
    icon: 'fa-circle-info',
    title: 'Account',
    tools: ['get_account_info'],
  },
]

const STEPS = [
  {
    n: 1,
    title: 'Create an API key',
    body: (
      <>
        Open <span className="text-pink-400 font-bold">Account → API</span> and
        click <span className="text-pink-400 font-bold">Create Key</span>. Copy
        the <code className="text-pink-400">blsm_…</code> string — it shows
        once.
      </>
    ),
    ctaLabel: 'Go to API Keys',
    ctaHref: '/dashboard/account/api',
  },
  {
    n: 2,
    title: 'Pick your client',
    body: (
      <>
        Choose Claude Desktop, OpenClaw, or Hermes Agent below and copy the
        one-line install. Paste it into your config and replace{' '}
        <code className="text-pink-400">blsm_...</code> with your key.
      </>
    ),
  },
  {
    n: 3,
    title: 'Restart & verify',
    body: (
      <>
        Restart your MCP client. You'll see Blossom tools (like{' '}
        <code className="text-pink-400">list_videos</code>,{' '}
        <code className="text-pink-400">trigger_analysis</code>) appear in the
        tool list. Ask your agent something like "What's trending on TikTok in
        my niche?"
      </>
    ),
  },
]

export default function AccountMcp() {
  const { isFreeTier } = useAuth()
  const { openUpgrade } = useUpgrade()

  // Free-tier users can't create keys, so the whole MCP flow is gated.
  if (isFreeTier) {
    return (
      <div>
        <div className="pb-6 mb-6 border-b border-white/[0.06]">
          <h2 className="text-xl font-black tracking-tight">MCP Server</h2>
          <p className="text-slate-500 text-sm mt-1">
            Drive Blossom from Claude, OpenClaw, or Hermes Agent.
          </p>
        </div>
        <div className="glass-card rounded-3xl p-10 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 border border-pink-500/30 mb-4">
            <i className="fas fa-plug text-pink-400 text-xl" />
          </div>
          <h3 className="text-xl font-black mb-2">
            The MCP server is a paid feature
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
            The MCP server uses an API key — and API keys require an active
            Pro, Premium, or Platin plan. Upgrade to wire Blossom into Claude,
            OpenClaw, Hermes, and any other MCP client.
          </p>
          <button
            onClick={() => openUpgrade('mcp-server')}
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
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-xl font-black tracking-tight">MCP Server</h2>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-[9px] font-black text-emerald-400 uppercase tracking-widest">
            <span className="w-1 h-1 bg-emerald-400 rounded-full" /> Ready
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Wire Blossom into Claude Desktop, OpenClaw, Hermes Agent — or any
          MCP-compatible client. One npm package, your API key, 20 tools.
        </p>
      </div>

      {/* Step-by-step guide */}
      <div className="mb-8 glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-5">
          <i className="fas fa-rocket text-pink-400 text-xs mr-2" />
          Setup in 3 steps
        </h3>
        <div className="space-y-5">
          {STEPS.map((step) => (
            <div key={step.n} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-pink-500/20">
                {step.n}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white mb-1">
                  {step.title}
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {step.body}
                </p>
                {step.ctaHref && (
                  <Link
                    to={step.ctaHref}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-pink-400 hover:text-pink-300 transition-colors"
                  >
                    {step.ctaLabel}
                    <i className="fas fa-arrow-right text-[9px]" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integration cards — same component as the marketing landing */}
      <div className="mb-8">
        <h3 className="text-sm font-bold text-white mb-4">
          <i className="fas fa-cube text-pink-400 text-xs mr-2" />
          Pick your client
        </h3>
        <McpIntegrationsSection variant="embedded" />
      </div>

      {/* Available tools — what the LLM can actually do */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-bold text-white mb-1">
          <i className="fas fa-toolbox text-pink-400 text-xs mr-2" />
          What your agent can do
        </h3>
        <p className="text-[11px] text-slate-500 mb-5">
          Tools exposed by{' '}
          <code className="text-pink-400">@blossai/mcp-server</code>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TOOL_GROUPS.map((group) => (
            <div
              key={group.title}
              className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <i className={`fas ${group.icon} text-pink-400 text-xs`} />
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">
                  {group.title}
                </span>
              </div>
              <ul className="space-y-1.5 text-[11px] font-mono text-slate-400">
                {group.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Troubleshooting */}
      <details className="glass-card rounded-2xl p-5 group">
        <summary className="cursor-pointer list-none flex items-center justify-between">
          <span className="text-sm font-bold text-white">
            <i className="fas fa-circle-question text-pink-400 text-xs mr-2" />
            Troubleshooting
          </span>
          <i className="fas fa-chevron-down text-xs text-slate-500 group-open:rotate-180 transition-transform" />
        </summary>
        <div className="mt-4 space-y-3 text-xs text-slate-400 leading-relaxed">
          <div>
            <span className="text-slate-300 font-bold block mb-1">
              Tools don't appear in my client
            </span>
            Restart the MCP client completely. Verify your API key starts with{' '}
            <code className="text-pink-400">blsm_</code> and matches an active
            key in <Link to="/dashboard/account/api" className="text-pink-400 hover:underline">Account → API</Link>.
          </div>
          <div>
            <span className="text-slate-300 font-bold block mb-1">
              "Rate limit exceeded" from a tool
            </span>
            Your plan's rate limit kicked in. Check{' '}
            <Link to="/dashboard/account/api" className="text-pink-400 hover:underline">
              Account → API
            </Link>{' '}
            to see your tier limit, or upgrade for a higher ceiling.
          </div>
          <div>
            <span className="text-slate-300 font-bold block mb-1">
              "Insufficient plan" from the MCP server
            </span>
            The key was created under a paid plan but the subscription has
            since lapsed. Renew under{' '}
            <Link
              to="/dashboard/account/billing"
              className="text-pink-400 hover:underline"
            >
              Account → Billing
            </Link>
            .
          </div>
          <div>
            <span className="text-slate-300 font-bold block mb-1">
              I want to debug what the server is doing
            </span>
            Run it locally with the MCP Inspector:{' '}
            <code className="text-pink-400">
              BLOSSOM_API_KEY=blsm_... npx -y @modelcontextprotocol/inspector
              npx -y @blossai/mcp-server
            </code>
            .
          </div>
        </div>
      </details>
    </div>
  )
}
