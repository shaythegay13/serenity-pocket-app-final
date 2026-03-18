"use client"

import { useState, useMemo, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Trade } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"

// ── emotion taxonomy ──────────────────────────────────────────────────────────

const EMOTIONS_BY_CATEGORY: Record<string, string[]> = {
  joy:         ['happy','excited','optimistic','grateful','confident','proud','hopeful','content','cheerful','inspired'],
  calm:        ['peaceful','relaxed','centered','focused','balanced','serene','patient','composed','tranquil','stable'],
  fear:        ['anxious','worried','nervous','scared','uncertain','panicked','hesitant','overwhelmed','tense','uneasy'],
  greed:       ['fomo','euphoric','impulsive','overconfident','eager','craving','obsessed','compulsive','restless','driven'],
  frustration: ['angry','irritated','disappointed','impatient','stressed','resentful','annoyed','agitated','bitter','exhausted'],
  sadness:     ['down','discouraged','regretful','defeated','helpless','lonely','empty','hopeless','dejected','grief'],
}

const CATEGORY_ORDER = ['joy','calm','fear','greed','frustration','sadness'] as const

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  joy:         { label: 'Joy',         color: '#f59e0b', emoji: '😊' },
  calm:        { label: 'Calm',        color: '#0ea5e9', emoji: '😌' },
  fear:        { label: 'Fear',        color: '#a855f7', emoji: '😨' },
  greed:       { label: 'Greed',       color: '#f97316', emoji: '🤑' },
  frustration: { label: 'Frustration', color: '#ef4444', emoji: '😤' },
  sadness:     { label: 'Sadness',     color: '#6b7280', emoji: '😞' },
}

// ── layout constants ──────────────────────────────────────────────────────────

const LABEL_W  = 160   // px reserved for Y-axis emotion labels
const PAD_R    = 20    // right padding
const AXIS_TOP = 44    // top margin for X-axis ticks
const CAT_H    = 30    // height of a category header row
const ROW_H    = 22    // height per emotion dot row
const SVG_W    = 580   // total SVG width
const CHART_W  = SVG_W - LABEL_W - PAD_R

// ── filter options ────────────────────────────────────────────────────────────

const DATE_RANGES    = [
  { value: '7',   label: 'Last 7 days'  },
  { value: '30',  label: 'Last 30 days' },
  { value: '90',  label: 'Last 90 days' },
  { value: 'all', label: 'All time'     },
]
const MIN_BETS_OPTS = [
  { value: '0',  label: 'All emotions' },
  { value: '2',  label: '≥ 2 bets'     },
  { value: '5',  label: '≥ 5 bets'     },
  { value: '10', label: '≥ 10 bets'    },
]

// ── helpers ───────────────────────────────────────────────────────────────────

type Metric = 'winRate' | 'roi'

function toX(value: number, metric: Metric): number {
  if (metric === 'winRate') {
    return Math.max(0, Math.min(CHART_W, (value / 100) * CHART_W))
  }
  const clamped = Math.max(-100, Math.min(100, value))
  return ((clamped + 100) / 200) * CHART_W
}

function baselineX(metric: Metric): number {
  return metric === 'winRate' ? toX(50, metric) : toX(0, metric)
}

/** RdYlGn: t=0 → red, t=0.5 → yellow, t=1 → green */
function rdylgn(t: number): string {
  const hue = Math.round(Math.max(0, Math.min(1, t)) * 120)
  return `hsl(${hue}, 68%, 42%)`
}

function metricColor(value: number, metric: Metric): string {
  const t = metric === 'winRate'
    ? Math.max(0, Math.min(1, value / 100))
    : Math.max(0, Math.min(1, (Math.max(-100, Math.min(100, value)) + 100) / 200))
  return rdylgn(t)
}

/** dot radius: sqrt-scaled, clamped 5–22 px */
function dotR(n: number): number {
  return Math.max(5, Math.min(22, Math.sqrt(n) * 3.6))
}

function xTicks(metric: Metric): Array<{ v: number; label: string }> {
  return metric === 'winRate'
    ? [0, 25, 50, 75, 100].map(v => ({ v, label: `${v}%` }))
    : [-100, -50, 0, 50, 100].map(v => ({ v, label: `${v >= 0 ? '+' : ''}${v}%` }))
}

// ── types ─────────────────────────────────────────────────────────────────────

interface EmotionRow {
  emotion:  string
  category: string
  count:    number
  winRate:  number
  roi:      number
}

interface Tooltip {
  emotion:  string
  category: string
  count:    number
  winRate:  number
  roi:      number
  cx:       number   // SVG x of dot centre
  cy:       number   // SVG y of dot centre
}

type LayoutItem =
  | { kind: 'header'; cat: string; y: number }
  | { kind: 'dot';    row: EmotionRow; cy: number }

// ── component ─────────────────────────────────────────────────────────────────

interface EmotionDotPlotProps {
  trades:            Trade[]
  comprehensiveBets: ComprehensiveBet[]
}

export function EmotionDotPlot({ trades, comprehensiveBets }: EmotionDotPlotProps) {
  const [metric,    setMetric]    = useState<Metric>('winRate')
  const [dateRange, setDateRange] = useState('30')
  const [minBets,   setMinBets]   = useState('0')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [tooltip,   setTooltip]   = useState<Tooltip | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ── cutoff date ─────────────────────────────────────────────────────────────
  const cutoff = useMemo<Date | null>(() => {
    if (dateRange === 'all') return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(dateRange))
    return d
  }, [dateRange])

  // ── aggregate per emotion ───────────────────────────────────────────────────
  const rawStats = useMemo(() => {
    const map = new Map<string, { wins: number; losses: number; pushes: number; stake: number; pl: number }>()
    const ensure = (key: string) => {
      if (!map.has(key)) map.set(key, { wins: 0, losses: 0, pushes: 0, stake: 0, pl: 0 })
      return map.get(key)!
    }

    trades.forEach(trade => {
      if (!trade.preTradeEmotion) return
      if (cutoff && new Date(trade.timestamp) < cutoff) return
      const outcome = trade.outcome || trade.result
      if (!outcome) return
      const s = ensure(trade.preTradeEmotion.toLowerCase())
      s.stake += trade.stake ?? 0
      s.pl    += (trade.actualReturn ?? 0) - (trade.stake ?? 0)
      if (outcome === 'profit' || outcome === 'win') s.wins++
      else if (outcome === 'loss') s.losses++
      else s.pushes++
    })

    comprehensiveBets.forEach(bet => {
      if (!bet.emotions?.before?.emotion) return
      if (cutoff && new Date(bet.timestamp) < cutoff) return
      if (!bet.outcome || bet.outcome === 'pending') return
      const s = ensure(bet.emotions.before.emotion.toLowerCase())
      s.stake += bet.stake
      s.pl    += bet.profitLoss ?? 0
      if (bet.outcome === 'win') s.wins++
      else if (bet.outcome === 'loss') s.losses++
      else s.pushes++
    })

    return map
  }, [trades, comprehensiveBets, cutoff])

  // ── build per-category sorted lists ────────────────────────────────────────
  const byCategory = useMemo(() => {
    const minN = parseInt(minBets)
    const out = new Map<string, EmotionRow[]>()
    CATEGORY_ORDER.forEach(cat => {
      const rows: EmotionRow[] = EMOTIONS_BY_CATEGORY[cat].map(emotion => {
        const s = rawStats.get(emotion)
        const count = s ? s.wins + s.losses + s.pushes : 0
        return {
          emotion, category: cat, count,
          winRate: count > 0 ? ((s!.wins + s!.pushes * 0.5) / count) * 100 : 0,
          roi:     s && s.stake > 0 ? (s.pl / s.stake) * 100 : 0,
        }
      })
      .filter(r => r.count >= minN)
      .sort((a, b) => b.count - a.count)
      out.set(cat, rows)
    })
    return out
  }, [rawStats, minBets])

  // ── layout: assign y positions ──────────────────────────────────────────────
  const { layout, svgH } = useMemo(() => {
    const items: LayoutItem[] = []
    let y = AXIS_TOP
    CATEGORY_ORDER.forEach(cat => {
      items.push({ kind: 'header', cat, y })
      y += CAT_H
      if (!collapsed.has(cat)) {
        ;(byCategory.get(cat) ?? []).forEach(row => {
          items.push({ kind: 'dot', row, cy: y + ROW_H / 2 })
          y += ROW_H
        })
      }
    })
    return { layout: items, svgH: y + 24 }
  }, [byCategory, collapsed])

  const toggleCat = (cat: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n })

  const bline = LABEL_W + baselineX(metric)

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <Card className="p-5">
      {/* Controls */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h4 className="text-base font-semibold text-foreground">Emotions vs Success</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dot size = N bets (reliability) · Color = performance · Click group to collapse
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={metric} onValueChange={v => setMetric(v as Metric)}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="winRate" className="text-xs">Win Rate %</SelectItem>
              <SelectItem value="roi"     className="text-xs">Avg ROI %</SelectItem>
            </SelectContent>
          </Select>
          <Select value={minBets} onValueChange={setMinBets}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MIN_BETS_OPTS.map(o => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SVG chart */}
      <div ref={containerRef} className="relative overflow-y-auto overflow-x-auto" style={{ maxHeight: 520 }}>
        <svg width={SVG_W} height={svgH} style={{ display: 'block' }}>

          {/* X-axis gridlines + tick labels */}
          {xTicks(metric).map(tick => {
            const x = LABEL_W + toX(tick.v, metric)
            const isBase = tick.v === (metric === 'winRate' ? 50 : 0)
            return (
              <g key={tick.v}>
                <line
                  x1={x} y1={AXIS_TOP - 10}
                  x2={x} y2={svgH - 12}
                  stroke={isBase ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.06)'}
                  strokeWidth={isBase ? 1.5 : 1}
                  strokeDasharray={isBase ? undefined : '3,5'}
                />
                <text
                  x={x} y={AXIS_TOP - 14}
                  textAnchor="middle"
                  fontSize={isBase ? 10 : 9}
                  fontWeight={isBase ? '600' : '400'}
                  fill={isBase ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)'}
                >
                  {tick.label}
                </text>
              </g>
            )
          })}

          {/* Layout rows */}
          {layout.map((item, i) => {
            // ── category header ──────────────────────────────────────────────
            if (item.kind === 'header') {
              const meta = CATEGORY_META[item.cat]
              const isCollapsed = collapsed.has(item.cat)
              const totalBets = (byCategory.get(item.cat) ?? []).reduce((s, r) => s + r.count, 0)
              return (
                <g key={`h-${item.cat}`} onClick={() => toggleCat(item.cat)} style={{ cursor: 'pointer' }}>
                  <rect x={0} y={item.y} width={SVG_W} height={CAT_H} fill={`${meta.color}14`} rx={2} />
                  <text x={10} y={item.y + CAT_H * 0.66} fontSize={11} fontWeight="700" fill={meta.color}>
                    {isCollapsed ? '▶' : '▼'}{'  '}{meta.emoji} {meta.label}
                  </text>
                  {totalBets > 0 && (
                    <text x={LABEL_W - 6} y={item.y + CAT_H * 0.66} textAnchor="end" fontSize={9} fill={`${meta.color}88`}>
                      {totalBets} bet{totalBets !== 1 ? 's' : ''}
                    </text>
                  )}
                </g>
              )
            }

            // ── emotion dot row ──────────────────────────────────────────────
            const { row, cy } = item
            const val     = metric === 'winRate' ? row.winRate : row.roi
            const hasData = row.count > 0
            const lowN    = row.count > 0 && row.count < 5
            const cx      = LABEL_W + toX(val, metric)
            const r       = hasData ? dotR(row.count) : 0

            return (
              <g key={`d-${row.emotion}`}>
                {/* Horizontal guide */}
                <line
                  x1={LABEL_W} y1={cy} x2={SVG_W - PAD_R} y2={cy}
                  stroke="rgba(255,255,255,0.04)"
                />
                {/* Y-axis label */}
                <text
                  x={LABEL_W - 8} y={cy + 4}
                  textAnchor="end" fontSize={10}
                  fill={hasData ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.2)'}
                >
                  {row.emotion}
                </text>
                {/* Dot */}
                {hasData && (
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={metricColor(val, metric)}
                    opacity={lowN ? 0.32 : 0.88}
                    strokeWidth={lowN ? 1 : 0}
                    stroke={lowN ? 'rgba(255,255,255,0.3)' : 'none'}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setTooltip({ emotion: row.emotion, category: row.category, count: row.count, winRate: row.winRate, roi: row.roi, cx, cy })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                )}
                {!hasData && (
                  <text x={LABEL_W + 8} y={cy + 4} fontSize={9} fill="rgba(255,255,255,0.12)">—</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Floating tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.cx + LABEL_W > SVG_W * 0.72
                ? tooltip.cx - 130
                : tooltip.cx + 14,
              top: tooltip.cy - 8,
              pointerEvents: 'none',
              zIndex: 50,
            }}
            className="bg-popover border border-border rounded-lg px-3 py-2 text-xs shadow-xl"
          >
            <p className="font-semibold capitalize text-foreground">{tooltip.emotion}</p>
            <p className="text-[10px] text-muted-foreground mb-1.5 capitalize">
              {CATEGORY_META[tooltip.category]?.emoji} {CATEGORY_META[tooltip.category]?.label}
            </p>
            <div className="space-y-0.5 text-[11px]">
              <div><span className="text-muted-foreground">Bets: </span><span className="font-medium">{tooltip.count}</span></div>
              <div><span className="text-muted-foreground">Win Rate: </span><span className="font-medium">{tooltip.winRate.toFixed(1)}%</span></div>
              <div><span className="text-muted-foreground">Avg ROI: </span><span className="font-medium">{tooltip.roi >= 0 ? '+' : ''}{tooltip.roi.toFixed(1)}%</span></div>
            </div>
            {tooltip.count < 5 && (
              <p className="text-[9px] text-yellow-500/70 mt-1.5">⚠ Small sample (&lt;5 bets)</p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-5 items-center pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <div style={{
            width: 90, height: 7, borderRadius: 3,
            background: 'linear-gradient(to right, hsl(0,68%,42%), hsl(60,68%,42%), hsl(120,68%,42%))',
          }} />
          <span className="text-[10px] text-muted-foreground">Worst → Best</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>
            <svg width="10" height="10" style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}>
              <circle cx="5" cy="5" r="3.5" fill="rgba(255,255,255,0.3)" />
            </svg>
            Few bets
          </span>
          <span>
            <svg width="16" height="16" style={{ display:'inline', verticalAlign:'middle', marginRight:4 }}>
              <circle cx="8" cy="8" r="7" fill="rgba(255,255,255,0.3)" />
            </svg>
            Many bets
          </span>
          <span>Faded + outline = &lt;5 bets (low confidence)</span>
        </div>
      </div>
    </Card>
  )
}
