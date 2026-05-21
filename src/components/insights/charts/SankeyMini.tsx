/**
 * SankeyMini — compact sankey flow diagram built on d3-sankey.
 *
 * Used for the Category × Format Sankey widget in Tier 3, plus any
 * other "flow A → flow B" relationship we want to visualize without
 * paying the @nivo/sankey bundle tax.
 *
 * Bundle math (see Stage 3 FE3 report): d3-sankey + d3-array +
 * d3-shape (already pulled in by Recharts) ≈ 15 kB gzipped. Compare
 * to @nivo/sankey which drags in @nivo/core + @react-spring/web +
 * lodash for > 200 kB gzipped.
 *
 * Layout: viewBox-based SVG so the chart scales fluidly with its
 * parent. Nodes drawn as filled rects with text labels on the outer
 * sides (left labels left-anchored, right labels right-anchored).
 * Links drawn with sankeyLinkHorizontal as semi-transparent paths,
 * thickness ∝ value. Hover a link → highlights + tooltip showing
 * source → target → value.
 */

import { useMemo, useState } from 'react'
import {
  sankey,
  sankeyLinkHorizontal,
  sankeyJustify,
  type SankeyGraph,
} from 'd3-sankey'

export interface SankeyNodeInput {
  id: string
  label: string
  color?: string
}

export interface SankeyLinkInput {
  source: string
  target: string
  value: number
}

interface SankeyMiniProps {
  nodes: SankeyNodeInput[]
  links: SankeyLinkInput[]
  height?: number
  /** Optional value formatter for the tooltip. */
  formatValue?: (v: number) => string
}

interface NodeDatum {
  id: string
  label: string
  color?: string
}

interface LinkDatum {
  source: string | number | (NodeDatum & { x0?: number; x1?: number; y0?: number; y1?: number })
  target: string | number | (NodeDatum & { x0?: number; x1?: number; y0?: number; y1?: number })
  value: number
}

const DEFAULT_PALETTE = [
  '#a78bfa', // violet-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#fb7185', // rose-400
  '#38bdf8', // sky-400
  '#e879f9', // fuchsia-400
]

function defaultFormatValue(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(Math.round(v))
}

export default function SankeyMini({
  nodes,
  links,
  height = 320,
  formatValue = defaultFormatValue,
}: SankeyMiniProps) {
  const [hoveredLinkIdx, setHoveredLinkIdx] = useState<number | null>(null)

  const layout = useMemo(() => {
    if (nodes.length === 0 || links.length === 0) return null

    // Filter out links referencing unknown nodes (defensive — backend may
    // emit transitional data during streaming).
    const nodeIds = new Set(nodes.map((n) => n.id))
    const validLinks: LinkDatum[] = links
      .filter((l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.value > 0)
      .map((l) => ({ source: l.source, target: l.target, value: l.value }))

    if (validLinks.length === 0) return null

    const width = 480
    const innerHeight = height

    const sankeyGen = sankey<NodeDatum, LinkDatum>()
      .nodeId((d) => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(10)
      .nodePadding(10)
      .extent([
        [110, 8],
        [width - 110, innerHeight - 8],
      ])

    // d3-sankey mutates its input — clone defensively.
    const graphInput: SankeyGraph<NodeDatum, LinkDatum> = {
      nodes: nodes.map((n) => ({ ...n })),
      links: validLinks.map((l) => ({ ...l })),
    }
    const graph = sankeyGen(graphInput)
    const linkGen = sankeyLinkHorizontal<NodeDatum, LinkDatum>()
    return { graph, linkGen, width, innerHeight }
  }, [nodes, links, height])

  if (!layout) {
    return (
      <div
        className="flex items-center justify-center text-slate-600 text-xs"
        style={{ height }}
      >
        No flow data to display
      </div>
    )
  }

  const { graph, linkGen, width, innerHeight } = layout

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${width} ${innerHeight}`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`Sankey flow with ${graph.nodes.length} nodes and ${graph.links.length} links`}
      >
        {/* Links */}
        <g fill="none">
          {graph.links.map((link, i) => {
            const path = linkGen(link) ?? ''
            // Default link color: blend of source node color.
            const src = link.source as NodeDatum
            const tgt = link.target as NodeDatum
            const baseColor =
              src.color ??
              tgt.color ??
              DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ??
              '#a78bfa'
            const isHovered = hoveredLinkIdx === i
            return (
              <path
                key={`link-${i}`}
                d={path}
                stroke={baseColor}
                strokeOpacity={isHovered ? 0.55 : 0.22}
                strokeWidth={Math.max(1, link.width ?? 1)}
                onMouseEnter={() => setHoveredLinkIdx(i)}
                onMouseLeave={() => setHoveredLinkIdx(null)}
                style={{ cursor: 'pointer', transition: 'stroke-opacity 0.15s' }}
              />
            )
          })}
        </g>

        {/* Nodes */}
        <g>
          {graph.nodes.map((node, i) => {
            const x0 = node.x0 ?? 0
            const x1 = node.x1 ?? 0
            const y0 = node.y0 ?? 0
            const y1 = node.y1 ?? 0
            const w = x1 - x0
            const h = y1 - y0
            const fill =
              node.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length] ?? '#a78bfa'
            // Decide which side to put the label.
            const labelOnRight = x0 < width / 2
            const tx = labelOnRight ? x1 + 6 : x0 - 6
            const ty = y0 + h / 2 + 4
            return (
              <g key={`node-${node.id}-${i}`}>
                <rect
                  x={x0}
                  y={y0}
                  width={Math.max(w, 0)}
                  height={Math.max(h, 0)}
                  fill={fill}
                  rx={2}
                  ry={2}
                />
                <text
                  x={tx}
                  y={ty}
                  fill="#cbd5e1"
                  fontSize={11}
                  textAnchor={labelOnRight ? 'start' : 'end'}
                  className="select-none"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </g>
      </svg>

      {hoveredLinkIdx !== null
        ? (() => {
            const link = graph.links[hoveredLinkIdx]
            if (!link) return null
            const src = link.source as NodeDatum
            const tgt = link.target as NodeDatum
            const midX = (((link.source as { x1?: number }).x1 ?? 0) + ((link.target as { x0?: number }).x0 ?? 0)) / 2
            const midY = ((link.y0 ?? 0) + (link.y1 ?? 0)) / 2
            // Convert from viewBox coordinates to percentage placement.
            const xPct = (midX / width) * 100
            const yPct = (midY / innerHeight) * 100
            return (
              <div
                className="absolute z-50 pointer-events-none rounded-lg bg-slate-900/95 border border-white/10 px-3 py-2 shadow-xl text-xs whitespace-nowrap"
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="text-slate-300 text-[10px] font-medium uppercase tracking-widest mb-1">
                  Flow
                </div>
                <div className="text-white font-bold">
                  {src.label} → {tgt.label}
                </div>
                <div className="text-slate-300 mt-0.5">
                  {formatValue(link.value)}
                </div>
              </div>
            )
          })()
        : null}
    </div>
  )
}
