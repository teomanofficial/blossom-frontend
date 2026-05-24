import { useState } from 'react'

/**
 * Three-card MCP integrations strip used on:
 *  - Landing.tsx (marketing) between Pricing and Final CTA
 *  - AccountMcp.tsx (in-app setup guide)
 *
 * Edit the install commands HERE — they are the single source of truth.
 * Logos live in /public/logos/ (claude.png, openclaw.svg, hermes.png).
 */

interface Integration {
  id: 'claude' | 'openclaw' | 'hermes'
  name: string
  tagline: string
  logo: string
  /** Accent color used for the gradient stripe + glow on each card. */
  accentFrom: string
  accentTo: string
  docsUrl: string
  /** Short label shown above the code block ("CLI" / "Config"). */
  commandLabel: string
  /** The actual one-line install command shown in the mono block. */
  command: string
  /** Optional secondary command (e.g. "or edit config" alternative). */
  altCommand?: { label: string; command: string }
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'claude',
    name: 'Claude Desktop',
    tagline: 'Anthropic · macOS · Windows',
    logo: '/logos/claude.png',
    accentFrom: 'from-orange-500',
    accentTo: 'to-amber-400',
    docsUrl: 'https://modelcontextprotocol.io/quickstart/user',
    commandLabel: 'claude_desktop_config.json',
    command: `{
  "mcpServers": {
    "blossom": {
      "command": "npx",
      "args": ["-y", "@blossai/mcp-server"],
      "env": { "BLOSSOM_API_KEY": "blsm_..." }
    }
  }
}`,
  },
  {
    id: 'openclaw',
    name: 'OpenClaw',
    tagline: 'The AI that actually does things',
    logo: '/logos/openclaw.svg',
    accentFrom: 'from-red-500',
    accentTo: 'to-rose-400',
    docsUrl: 'https://docs.openclaw.ai/cli/mcp',
    commandLabel: 'one-line CLI',
    command: `openclaw mcp set blossom '{"command":"npx","args":["-y","@blossai/mcp-server"],"env":{"BLOSSOM_API_KEY":"blsm_..."}}'`,
  },
  {
    id: 'hermes',
    name: 'Hermes Agent',
    tagline: 'Open-source · Nous Research',
    logo: '/logos/hermes.png',
    accentFrom: 'from-indigo-500',
    accentTo: 'to-violet-400',
    docsUrl: 'https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp',
    commandLabel: 'one-line CLI',
    command: `hermes mcp add blossom --command npx --arg "-y" --arg "@blossai/mcp-server" --env "BLOSSOM_API_KEY=blsm_..."`,
  },
]

interface McpIntegrationsSectionProps {
  /**
   * Tweak the section header + outer padding for in-app vs marketing usage.
   * `marketing` = full landing section with eyebrow + h2 + py-24 wrapper.
   * `embedded`  = just the cards, no chrome (for /dashboard/account/mcp).
   */
  variant?: 'marketing' | 'embedded'
}

export default function McpIntegrationsSection({
  variant = 'marketing',
}: McpIntegrationsSectionProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      // Non-HTTPS fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopiedId(id)
        setTimeout(() => setCopiedId(null), 2000)
      } finally {
        document.body.removeChild(ta)
      }
    }
  }

  const cards = (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {INTEGRATIONS.map((integration) => (
        <div
          key={integration.id}
          className="relative glass-card rounded-3xl p-6 sm:p-7 overflow-hidden group hover:scale-[1.01] transition-transform"
        >
          {/* Accent stripe along the top */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${integration.accentFrom} ${integration.accentTo}`}
          />
          {/* Subtle glow on hover */}
          <div
            className={`absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${integration.accentFrom} ${integration.accentTo} opacity-0 group-hover:opacity-20 rounded-full blur-3xl transition-opacity`}
          />

          {/* Header: logo + name + tagline */}
          <div className="relative flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={integration.logo}
                alt={`${integration.name} logo`}
                className="w-9 h-9 object-contain"
                onError={(e) => {
                  // Hide broken images gracefully — show monogram fallback
                  ;(e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black truncate">
                {integration.name}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {integration.tagline}
              </p>
            </div>
          </div>

          {/* Command label */}
          <div className="relative flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {integration.commandLabel}
            </span>
            <button
              type="button"
              onClick={() => handleCopy(integration.id, integration.command)}
              className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 transition-all flex items-center gap-1.5"
              aria-label={`Copy ${integration.name} install command`}
            >
              <i
                className={`fas ${copiedId === integration.id ? 'fa-check' : 'fa-copy'} text-[9px]`}
              />
              {copiedId === integration.id ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Code block */}
          <pre className="relative bg-black/40 border border-white/[0.05] rounded-xl px-3 py-3 text-[11px] sm:text-[12px] font-mono text-slate-300 leading-relaxed overflow-x-auto max-h-[180px] mb-4">
            <code>{integration.command}</code>
          </pre>

          {/* Footer link */}
          <a
            href={integration.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-pink-400 transition-colors"
          >
            Setup docs
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </a>
        </div>
      ))}
    </div>
  )

  if (variant === 'embedded') {
    return cards
  }

  return (
    <section
      id="mcp"
      className="py-24 sm:py-32 px-4 sm:px-6 relative z-10 overflow-hidden"
    >
      {/* Background mesh — keeps section aligned with rest of landing */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 15% 30%, rgba(139,92,246,0.10) 0%, transparent 45%), radial-gradient(circle at 85% 70%, rgba(244,114,182,0.10) 0%, transparent 45%)',
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        <div className="text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
              MCP Ready
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black mb-4 tracking-tight">
            Drive Blossom from your <span className="gradient-text">AI</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto font-medium">
            Plug{' '}
            <code className="text-pink-400 font-mono text-sm">
              @blossai/mcp-server
            </code>{' '}
            into Claude, OpenClaw, or Hermes with one line. Your viral
            library, trends, and analysis pipeline become callable tools
            inside any agent.
          </p>
        </div>

        {cards}

        {/* Stats strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {[
            { icon: 'fa-bolt', label: '20 tools' },
            { icon: 'fa-cube', label: 'npm-published' },
            { icon: 'fa-terminal', label: 'One-line install' },
            { icon: 'fa-shield-halved', label: 'Your API key, your scope' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] font-bold text-slate-400"
            >
              <i className={`fas ${stat.icon} text-pink-400 text-[10px]`} />
              {stat.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
