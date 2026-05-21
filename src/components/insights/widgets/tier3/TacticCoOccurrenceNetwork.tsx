/**
 * TacticCoOccurrenceNetwork — Tier 3 Anatomy widget rendering a small
 * force-directed graph of which *pairs* of tactics co-occur in
 * top-decile videos.
 *
 * Node size encodes how much lift a given tactic contributes across all
 * its pairings; edge thickness encodes how much lift the *pair*
 * generates when used together. Nodes are colored by category so the
 * user can see, at a glance, whether the highest-lift cluster sits in
 * "Hook" tactics, "Production", "Caption", etc.
 *
 * Important caveat (per BE4a): the underlying materialised view
 * (`mv_tactic_cooccurrence`) is aggregated *globally* — it does not
 * support per-niche filtering yet. The backend echoes the requested
 * `?niche=` back in `niche_filter_note` so the frontend can warn the
 * user. We surface that note as a chip above the chart.
 *
 * Backend: `GET /api/insights/tier3/tactic-cooccurrence`
 *   → { nodes, edges, niche_filter, niche_filter_note, sample_size }
 */

import { useInsights } from '../../../../lib/useInsights'
import { TacticNetwork } from '../../charts'
import type { TacticNetworkEdge, TacticNetworkNode } from '../../charts'
import WidgetCard from '../../shared/WidgetCard'

interface TacticCoOccurrenceResponse {
  nodes: Array<TacticNetworkNode & { weight: number }>
  edges: Array<TacticNetworkEdge & { co_occurrence_count: number }>
  niche_filter: string | null
  niche_filter_note: string | null
  sample_size: number
}

interface TacticCoOccurrenceNetworkProps {
  className?: string
  niche?: string
}

export default function TacticCoOccurrenceNetwork({
  className = '',
  niche,
}: TacticCoOccurrenceNetworkProps) {
  const path = niche
    ? `tier3/tactic-cooccurrence?niche=${encodeURIComponent(niche)}`
    : 'tier3/tactic-cooccurrence'
  const { data, loading, error, retry, locked } = useInsights<TacticCoOccurrenceResponse>(path)

  const nodes = data?.nodes ?? []
  const edges = data?.edges ?? []
  const isEmpty = !loading && !error && nodes.length === 0

  return (
    <WidgetCard
      title="Tactic Co-Occurrence Network"
      subtitle="Which tactics compound when they appear together — the combos that lift virality the most."
      icon="fa-circle-nodes"
      iconBg="bg-purple-500/15"
      iconColor="text-purple-400"
      loading={loading}
      error={error}
      onRetry={retry}
      isEmpty={isEmpty}
      emptyIcon="fa-circle-nodes"
      emptyMessage="No tactic co-occurrence pairs above the noise floor yet."
      size="lg"
      className={className}
      locked={locked}
      tier={3}
      info={{
        what: 'Pairs of tactics that compound when they appear together.',
        howToRead:
          "Each node is a tactic; thicker edges between two nodes mean those tactics combo well — videos using both get more lift than videos using either alone. Bigger nodes are tactics that pair with many others. Color encodes tactic category (hook, production, caption, etc.).",
        computation:
          'Edge weight = lift when tactics are used together vs. either used alone. Computed across the top-decile slice globally.',
      }}
      actions={
        data ? (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {nodes.length} tactics · {edges.length} pairs
          </span>
        ) : null
      }
    >
      {data?.niche_filter_note ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-500/10 border border-amber-500/25 px-3 py-2">
          <i className="fas fa-info-circle text-amber-300 text-xs mt-0.5" />
          <p className="text-[11px] text-amber-200 font-medium leading-snug">
            Showing global pairings — niche filtering for tactic co-occurrence coming soon.
          </p>
        </div>
      ) : null}

      <TacticNetwork nodes={nodes} edges={edges} height={380} />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-500">
        <span className="text-slate-600">Node size</span>
        <span className="text-slate-400">= total lift across pairings</span>
        <span className="mx-2 text-slate-700">·</span>
        <span className="text-slate-600">Edge thickness</span>
        <span className="text-slate-400">= lift when combined</span>
        <span className="mx-2 text-slate-700">·</span>
        <span className="text-slate-600">Color</span>
        <span className="text-slate-400">= tactic category</span>
      </div>
    </WidgetCard>
  )
}
