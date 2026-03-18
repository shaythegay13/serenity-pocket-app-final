"use client"

import { useState, useMemo, useRef, useEffect } from "react"
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

// ── filter options ────────────────────────────────────────────────────────────

const DATE_RANGES = [
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

// ── layout ────────────────────────────────────────────────────────────────────

const LABEL_W  = 148   // Y-axis label column width
const PAD_R    = 28    // right padding
const AXIS_TOP = 48    // top space for X-axis labels
const CAT_H    = 28    // category header row height
const ROW_H    = 24    // emotion row height
const MIN_W    = 520   // minimum SVG width

// ── helpers ───────────────────────────────────────────────────────────────────

type Metric = 'winRate' | 'roi'

function toX(value: number, metric: Metric, chartW: number): number {
  if (metric === 'winRate') {
    return Math.max(0, Math.min(chartW, (value / 100) * chartW))
  }
  const clamped = Math.max(-100, Math.min(100, value))
  return ((clamped + 100) / 200) * chartW
}

function baselineX(metric: Metric, chartW: number): number {
  return metric === 'winRate' ? toX(50, metric, chartW) : toX(0, metric, chartW)
}

/** RdYlGn: t=0 → red, t=0.5 → yellow, t=1 → green */
function rdylgn(t: number): string {
  const hue = Math.round(Math.max(0, Math.min(1, t)) * 120)
  return `hsl(${hue}, 72%, 40%)`
}

function metricColor(value: number, metric: Metric): string {
  const t = metric === 'winRate'
    ? Math.max(0, Math.min(1, value / 100))
    : Math.max(0, Math.min(1, (Math.max(-100, Math.min(100, value)) + 100) / 200))
  return rdylgn(t)
}

/** Dot radius: sqrt-scaled, clamped 4–12 px */
function dotR(n: number): number {
  return Math.max(4, Math.min(12, Math.sqrt(n) * 2))
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
  cx:       number
  cy:       number
}

type LayoutItem =
  | { kind: 'header'; cat: string; y: number }
  | { kind: 'dot';    row: EmotionRow; cy: number }

interface EmotionDotPlotProps {
  trades:            Trade[]
  comprehensiveBets: ComprehensiveBet[]
}

// ── component ─────────────────────────────────────────────────────────────────

export function EmotionDotPlot({ trades, comprehensiveBets }: EmotionDotPlotProps) {
  const [metric,    setMetric]    = useState<Metric>('winRate')
  const [dateRange, setDateRange] = useState('30')
  const [minBets,   setMinBets]   = useState('0')
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [tooltip,   setTooltip]   = useState<Tooltip | null>(null)
  const [svgW,      setSvgW]      = useState(MIN_W)
  const containerRef = useRef<HTMLDivElement>(null)

  // Measure container width for responsiveness
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect.width ?? MIN_W
      setSvgW(Math.max(MIN_W, w))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chartW = svgW - LABEL_W - PAD_R

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

  // ── per-category sorted rows ─────────────────────────────────────────────────
  const byCategory = useMemo(() => {
    const minN = parseInt(minBets)
    const out = new Map<string, EmotionRow[]>()
    CATEGORY_ORDER.forEach(cat => {
      out.set(cat, EMOTIONS_BY_CATEGORY[cat]
        .map(emotion => {
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
      )
    })
    return out
  }, [rawStats, minBets])

  // ── layout ───────────────────────────────────────────────────────────────────
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
    return { layout: items, svgH: y + 28 }
  }, [byCategory, collapsed])

  const toggleCat = (cat: string) =>
    setCollapsed(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n })

  const blineX = LABEL_W + baselineX(metric, chartW)

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <Card className="p-5">
      {/* Header + controls */}
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h4 className="text-base font-semibold text-foreground">Emotions vs Success</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dot size = N bets · Color = performance (RdYlGn) · Click a group label to collapse
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

      {/* Chart */}
      <div ref={containerRef} className="relative overflow-y-auto overflow-x-auto" style={{ maxHeight: 560 }}>
        <svg width={svgW} height={svgH} style={{ display: 'block' }}>

          {/* X-axis ticks + gridlines */}
          {xTicks(metric).map(tick => {
            const x = LABEL_W + toX(tick.v, metric, chartW)
            const isBase = tick.v === (metric === 'winRate' ? 50 : 0)
            return (
              <g key={tick.v}>
                <line
                  x1={x} y1={AXIS_TOP - 6}
                  x2={x} y2={svgH - 10}
                  stroke="hsl(var(--border))"
                  strokeOpacity={isBase ? 0.85 : 0.45}
                  strokeWidth={isBase ? 1.5 : 1}
                  strokeDasharray={isBase ? undefined : '3,6'}
                />
                <text
                  x={x} y={AXIS_TOP - 10}
                  textAnchor="middle" fontSize={10}
                  fontWeight={isBase ? '600' : '400'}
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={isBase ? 1 : 0.75}
                >
                  {tick.label}
                </text>
              </g>
            )
          })}

          {/* Layout rows */}
          {layout.map(item => {

            // ── category separator + label ──────────────────────────────────
            if (item.kind === 'header') {
              const meta   = CATEGORY_META[item.cat]
              const isOpen = !collapsed.has(item.cat)
              const total  = (byCategory.get(item.cat) ?? []).reduce((s, r) => s + r.count, 0)
              const yMid   = item.y + CAT_H * 0.58

              return (
                <g key={`h-${item.cat}`} onClick={() => toggleCat(item.cat)} style={{ cursor: 'pointer' }}>
                  {/* Full-width separator line (subtle) */}
                  <line
                    x1={0} y1={item.y + 1}
                    x2={svgW} y2={item.y + 1}
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.7}
                  />
                  {/* Colored accent bar on far left */}
                  <rect x={0} y={item.y + 4} width={3} height={CAT_H - 8} rx={1.5} fill={meta.color} />
                  {/* Chevron + label */}
                  <text x={10} y={yMid} fontSize={10} fontWeight="700" fill={meta.color} dominantBaseline="middle">
                    {isOpen ? '▼' : '▶'}
                  </text>
                  <text x={22} y={yMid} fontSize={11} fontWeight="700" fill={meta.color} dominantBaseline="middle">
                    {meta.emoji} {meta.label}
                  </text>
                  {/* Bet count badge */}
                  {total > 0 && (
                    <text
                      x={LABEL_W - 8} y={yMid}
                      textAnchor="end" fontSize={9}
                      fill={`${meta.color}88`} dominantBaseline="middle"
                    >
                      {total} bet{total !== 1 ? 's' : ''}
                    </text>
                  )}
                  {/* Dashed line across chart area when collapsed */}
                  {!isOpen && (
                    <line
                      x1={LABEL_W} y1={yMid}
                      x2={svgW - PAD_R} y2={yMid}
                      stroke={`${meta.color}18`} strokeWidth={1} strokeDasharray="4,6"
                    />
                  )}
                </g>
              )
            }

            // ── emotion dot row ─────────────────────────────────────────────
            const { row, cy } = item
            const val     = metric === 'winRate' ? row.winRate : row.roi
            const hasData = row.count > 0
            const lowN    = hasData && row.count < 5
            const cx      = LABEL_W + toX(val, metric, chartW)
            const r       = hasData ? dotR(row.count) : 0
            const color   = metricColor(val, metric)

            return (
              <g key={`d-${row.emotion}`}>
                {/* Subtle guide line */}
                <line
                  x1={LABEL_W} y1={cy}
                  x2={svgW - PAD_R} y2={cy}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.4}
                />
                {/* Emotion name */}
                <text
                  x={LABEL_W - 10} y={cy}
                  textAnchor="end" fontSize={10.5} dominantBaseline="middle"
                  fill="hsl(var(--foreground))"
                  fillOpacity={hasData ? 0.85 : 0.5}
                >
                  {row.emotion}
                </text>

                {hasData ? (
                  <>
                    {/* Lollipop stem from baseline to dot */}
                    <line
                      x1={blineX} y1={cy}
                      x2={cx}     y2={cy}
                      stroke={color} strokeOpacity={lowN ? 0.4 : 0.5} strokeWidth={1.5}
                    />
                    {/* Dot */}
                    <circle
                      cx={cx} cy={cy} r={r}
                      fill={color}
                      fillOpacity={lowN ? 0.55 : 0.9}
                      stroke={lowN ? 'hsl(var(--foreground))' : color}
                      strokeOpacity={lowN ? 0.6 : 1}
                      strokeWidth={lowN ? 1 : 0}
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setTooltip({ emotion: row.emotion, category: row.category, count: row.count, winRate: row.winRate, roi: row.roi, cx, cy })}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    {/* Value label next to dot (only if enough space / dot large enough) */}
                    {row.count >= 3 && (
                      <text
                        x={cx + r + 5} y={cy}
                        fontSize={9} dominantBaseline="middle"
                        fill="hsl(var(--muted-foreground))"
                        fillOpacity={0.7}
                      >
                        {metric === 'winRate'
                          ? `${val.toFixed(0)}%`
                          : `${val >= 0 ? '+' : ''}${val.toFixed(0)}%`}
                      </text>
                    )}
                  </>
                ) : (
                  <text x={LABEL_W + 6} y={cy} fontSize={9} dominantBaseline="middle" fill="hsl(var(--muted-foreground))" fillOpacity={0.6}>—</text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            style={{
              position: 'absolute',
              left: (LABEL_W + toX(
                metric === 'winRate' ? tooltip.winRate : tooltip.roi,
                metric, chartW
              )) > svgW * 0.68 ? tooltip.cx - 148 : tooltip.cx + 14,
              top: Math.max(4, tooltip.cy - 72),
              pointerEvents: 'none',
              zIndex: 50,
            }}
            className="bg-popover border border-border/80 rounded-xl px-3.5 py-2.5 text-xs shadow-2xl min-w-[140px]"
          >
            <p className="font-bold capitalize text-foreground text-sm">{tooltip.emotion}</p>
            <p className="text-[10px] text-muted-foreground mb-2 capitalize">
              {CATEGORY_META[tooltip.category]?.emoji} {CATEGORY_META[tooltip.category]?.label}
            </p>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Bets</span>
                <span className="font-semibold">{tooltip.count}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Win Rate</span>
                <span className="font-semibold">{tooltip.winRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Avg ROI</span>
                <span className="font-semibold">{tooltip.roi >= 0 ? '+' : ''}{tooltip.roi.toFixed(1)}%</span>
              </div>
            </div>
            {tooltip.count < 5 && (
              <p className="text-[9px] text-amber-400/80 mt-2 border-t border-border/50 pt-1.5">
                ⚠ Small sample — interpret with caution
              </p>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-5 items-center">
        <div className="flex items-center gap-2">
          <div style={{
            width: 80, height: 6, borderRadius: 3,
            background: 'linear-gradient(to right, hsl(0,72%,40%), hsl(60,72%,40%), hsl(120,72%,40%))',
          }} />
          <span className="text-[10px] text-muted-foreground">Worst → Best</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg width="8" height="8"><circle cx="4" cy="4" r="3" fill="hsl(var(--muted-foreground))" fillOpacity="0.5"/></svg>
            Few bets
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="hsl(var(--muted-foreground))" fillOpacity="0.5"/></svg>
            Many bets
          </span>
          <span>Faded = &lt;5 bets (low confidence)</span>
        </div>
      </div>
    </Card>
  )
}
