/**
 * TacticNetwork — small SVG force-directed graph for tactic
 * co-occurrence visualization.
 *
 * Used by Tier 3 Tactic Co-Occurrence Network widget. Each node is a
 * tactic; each edge represents how often two tactics co-occur in
 * top-decile videos, with thickness ∝ frequency.
 *
 * Bundle math (see Stage 3 FE3 report): d3-force (89 kB unpacked, ~25
 * kB gzipped) + d3-dispatch + d3-quadtree + d3-timer (already pulled
 * in by Recharts). Compare to react-force-graph-2d at ~1.7 MB
 * unpacked plus the force-graph dep — > 400 kB gzipped — way over
 * budget.
 *
 * Behavior: runs the simulation for a fixed number of ticks on mount
 * (synchronously), then renders the final layout. No animation in the
 * dashboard mount path — keeps things deterministic and avoids
 * re-render churn. Drag/zoom out of scope for v1; the dashboard uses
 * this read-only.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceCenter,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'

export interface TacticNetworkNode {
  id: string
  label: string
  category?: string
  weight?: number
}

export interface TacticNetworkEdge {
  source: string
  target: string
  weight: number
}

interface TacticNetworkProps {
  nodes: TacticNetworkNode[]
  edges: TacticNetworkEdge[]
  height?: number
  /**
   * Category-to-color map. Falls back to palette rotation by category
   * order, then a default for missing categories.
   */
  categoryColors?: Record<string, string>
}

interface SimNode extends SimulationNodeDatum {
  id: string
  label: string
  category?: string
  weight: number
}

interface SimEdge extends SimulationLinkDatum<SimNode> {
  weight: number
}

const DEFAULT_PALETTE = [
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#fb7185',
  '#38bdf8',
  '#e879f9',
  '#22d3ee',
  '#f472b6',
  '#fcd34d',
  '#86efac',
]

const WIDTH = 480

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

export default function TacticNetwork({
  nodes,
  edges,
  height = 380,
  categoryColors,
}: TacticNetworkProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; weight: number } | null>(
    null
  )

  const layout = useMemo(() => {
    if (nodes.length === 0) return null

    const nodeIds = new Set(nodes.map((n) => n.id))
    const validEdges: TacticNetworkEdge[] = edges.filter(
      (e) =>
        nodeIds.has(e.source) &&
        nodeIds.has(e.target) &&
        e.source !== e.target &&
        e.weight > 0
    )

    const minWeight = nodes.length
      ? Math.min(...nodes.map((n) => n.weight ?? 1))
      : 1
    const maxWeight = nodes.length
      ? Math.max(...nodes.map((n) => n.weight ?? 1))
      : 1
    const weightSpan = Math.max(1, maxWeight - minWeight)

    const minEdgeWeight = validEdges.length
      ? Math.min(...validEdges.map((e) => e.weight))
      : 1
    const maxEdgeWeight = validEdges.length
      ? Math.max(...validEdges.map((e) => e.weight))
      : 1
    const edgeSpan = Math.max(1, maxEdgeWeight - minEdgeWeight)

    const simNodes: SimNode[] = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      category: n.category,
      weight: n.weight ?? 1,
    }))
    const simEdges: SimEdge[] = validEdges.map((e) => ({
      source: e.source,
      target: e.target,
      weight: e.weight,
    }))

    // Run the simulation synchronously for a fixed number of ticks.
    const simulation = forceSimulation<SimNode>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimEdge>(simEdges)
          .id((d) => d.id)
          .distance((d) => 70 - ((d.weight - minEdgeWeight) / edgeSpan) * 30)
          .strength(0.6)
      )
      .force('charge', forceManyBody<SimNode>().strength(-180))
      .force('center', forceCenter<SimNode>(WIDTH / 2, height / 2))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => 10 + ((d.weight - minWeight) / weightSpan) * 14)
      )
      .stop()

    // 300 ticks is plenty for graphs up to ~50 nodes.
    for (let i = 0; i < 300; i++) simulation.tick()

    // Clamp positions inside the viewBox.
    for (const n of simNodes) {
      n.x = clamp(n.x ?? WIDTH / 2, 22, WIDTH - 22)
      n.y = clamp(n.y ?? height / 2, 22, height - 22)
    }

    // Category → color map
    const categories = Array.from(
      new Set(simNodes.map((n) => n.category ?? 'uncategorized'))
    )
    const colorMap = new Map<string, string>()
    categories.forEach((cat, i) => {
      colorMap.set(cat, categoryColors?.[cat] ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? '#a78bfa')
    })

    return {
      simNodes,
      simEdges,
      minWeight,
      weightSpan,
      minEdgeWeight,
      edgeSpan,
      colorMap,
    }
  }, [nodes, edges, height, categoryColors])

  // Re-clamp simNodes when height changes (above already handles it via useMemo).
  useEffect(() => {
    setHoveredId(null)
    setTooltip(null)
  }, [nodes, edges])

  if (!layout || layout.simNodes.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No co-occurrence data
      </div>
    )
  }

  const { simNodes, simEdges, minWeight, weightSpan, minEdgeWeight, edgeSpan, colorMap } = layout

  function nodeRadius(n: SimNode): number {
    return 6 + ((n.weight - minWeight) / weightSpan) * 12
  }

  function edgeWidth(weight: number): number {
    return 0.7 + ((weight - minEdgeWeight) / edgeSpan) * 3.3
  }

  function nodeColor(n: SimNode): string {
    return colorMap.get(n.category ?? 'uncategorized') ?? '#a78bfa'
  }

  // Build set of hovered edges (any edge incident to hoveredId).
  const hoveredEdgeIdxs = new Set<number>()
  if (hoveredId) {
    simEdges.forEach((e, i) => {
      const s = (e.source as SimNode).id ?? (e.source as unknown as string)
      const t = (e.target as SimNode).id ?? (e.target as unknown as string)
      if (s === hoveredId || t === hoveredId) hoveredEdgeIdxs.add(i)
    })
  }

  return (
    <div className="relative w-full" style={{ height }} data-tactic-network>
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Network of ${simNodes.length} tactics with ${simEdges.length} co-occurrences`}
      >
        {/* Edges */}
        <g>
          {simEdges.map((edge, i) => {
            const s = edge.source as SimNode
            const t = edge.target as SimNode
            const isHovered = hoveredEdgeIdxs.has(i)
            const baseOpacity = hoveredId ? (isHovered ? 0.7 : 0.05) : 0.25
            return (
              <line
                key={`edge-${i}`}
                x1={s.x ?? 0}
                y1={s.y ?? 0}
                x2={t.x ?? 0}
                y2={t.y ?? 0}
                stroke="#94a3b8"
                strokeOpacity={baseOpacity}
                strokeWidth={edgeWidth(edge.weight)}
                style={{ transition: 'stroke-opacity 0.15s' }}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g>
          {simNodes.map((n) => {
            const r = nodeRadius(n)
            const color = nodeColor(n)
            const isHovered = hoveredId === n.id
            const dimmed = hoveredId !== null && !isHovered
            return (
              <g
                key={`node-${n.id}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredId(n.id)
                  const target = e.currentTarget
                  const parent = target.closest('[data-tactic-network]')
                  if (!parent) return
                  const parentRect = parent.getBoundingClientRect()
                  const targetRect = target.getBoundingClientRect()
                  setTooltip({
                    x: targetRect.left - parentRect.left + targetRect.width / 2,
                    y: targetRect.top - parentRect.top,
                    label: n.label,
                    weight: n.weight,
                  })
                }}
                onMouseLeave={() => {
                  setHoveredId(null)
                  setTooltip(null)
                }}
              >
                <circle
                  cx={n.x ?? 0}
                  cy={n.y ?? 0}
                  r={r}
                  fill={color}
                  fillOpacity={dimmed ? 0.4 : 0.85}
                  stroke={isHovered ? '#fff' : 'rgba(15, 23, 42, 0.8)'}
                  strokeWidth={isHovered ? 1.5 : 1}
                  style={{ transition: 'fill-opacity 0.15s' }}
                />
                {/* Inline label only for high-weight nodes or hovered. */}
                {(n.weight - minWeight) / weightSpan > 0.5 || isHovered ? (
                  <text
                    x={n.x ?? 0}
                    y={(n.y ?? 0) + r + 10}
                    fill="#cbd5e1"
                    fontSize={10}
                    textAnchor="middle"
                    className="select-none pointer-events-none"
                  >
                    {n.label.length > 16 ? `${n.label.slice(0, 14)}…` : n.label}
                  </text>
                ) : null}
              </g>
            )
          })}
        </g>
      </svg>

      {tooltip ? (
        <div
          className="absolute z-50 pointer-events-none rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 8,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="text-white font-bold">{tooltip.label}</div>
          <div className="text-slate-400 mt-0.5">
            weight: <span className="text-slate-100 font-semibold">{tooltip.weight.toFixed(1)}</span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
