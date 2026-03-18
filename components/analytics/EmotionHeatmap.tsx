"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Trade } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { EMOTION_CATEGORIES, EMOTION_SCORE_LOOKUP } from "./constants"

interface EmotionHeatmapProps {
  trades: Trade[]
  comprehensiveBets: ComprehensiveBet[]
}

interface EmotionRow {
  emotion: string        // e.g. "anxious"
  category: string       // e.g. "fear"
  winRate: number
  roi: number
  avgStake: number
  count: number
}

const DATE_RANGES = [
  { value: "7",   label: "Last 7 days" },
  { value: "30",  label: "Last 30 days" },
  { value: "90",  label: "Last 90 days" },
  { value: "all", label: "All time" },
]

const SORT_OPTIONS = [
  { value: "winRate", label: "Win Rate" },
  { value: "roi",     label: "Avg ROI" },
  { value: "count",   label: "Most Bets" },
  { value: "score",   label: "Emotion Score" },
]

// Category badge colors
const CATEGORY_COLORS: Record<string, string> = {
  joy:         'bg-yellow-500/20 text-yellow-400',
  calm:        'bg-sky-500/20 text-sky-400',
  fear:        'bg-purple-500/20 text-purple-400',
  greed:       'bg-orange-500/20 text-orange-400',
  frustration: 'bg-red-500/20 text-red-400',
  sadness:     'bg-slate-500/20 text-slate-400',
}

const CELL_H = 44

// Per-column normalization: maps a value to hue 0–120 (red→green)
// higher = better (green), lower = worse (red)
function normalizedBg(value: number, min: number, max: number): string {
  if (max === min) return 'hsl(60,65%,28%)' // single value = yellow
  const t = Math.max(0, Math.min(1, (value - min) / (max - min)))
  return `hsl(${Math.round(t * 120)},65%,28%)`
}

function buildEmotionStats(
  trades: Trade[],
  comprehensiveBets: ComprehensiveBet[],
  cutoff: Date | null
): Map<string, { wins: number; losses: number; pushes: number; stake: number; pl: number }> {
  const stats = new Map<string, { wins: number; losses: number; pushes: number; stake: number; pl: number }>()

  const ensure = (key: string) => {
    if (!stats.has(key)) stats.set(key, { wins: 0, losses: 0, pushes: 0, stake: 0, pl: 0 })
    return stats.get(key)!
  }

  trades.forEach(trade => {
    if (!trade.preTradeEmotion) return
    if (cutoff && new Date(trade.timestamp) < cutoff) return
    const outcome = trade.outcome || trade.result
    if (!outcome) return
    const key = trade.preTradeEmotion.toLowerCase()
    const s = ensure(key)
    s.stake += trade.stake ?? 0
    s.pl += (trade.actualReturn ?? 0) - (trade.stake ?? 0)
    if (outcome === 'profit' || outcome === 'win') s.wins++
    else if (outcome === 'loss') s.losses++
    else s.pushes++
  })

  comprehensiveBets.forEach(bet => {
    if (!bet.emotions?.before?.emotion) return
    if (cutoff && new Date(bet.timestamp) < cutoff) return
    if (!bet.outcome || bet.outcome === 'pending') return
    const key = bet.emotions.before.emotion.toLowerCase()
    const s = ensure(key)
    s.stake += bet.stake
    s.pl += bet.profitLoss ?? 0
    if (bet.outcome === 'win') s.wins++
    else if (bet.outcome === 'loss') s.losses++
    else s.pushes++
  })

  return stats
}

export function EmotionHeatmap({ trades, comprehensiveBets }: EmotionHeatmapProps) {
  const [dateRange, setDateRange] = useState("30")
  const [sortBy, setSortBy] = useState("winRate")
  const [showCategories, setShowCategories] = useState(false)

  const cutoff = useMemo<Date | null>(() => {
    if (dateRange === "all") return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(dateRange))
    return d
  }, [dateRange])

  const rows = useMemo<EmotionRow[]>(() => {
    const stats = buildEmotionStats(trades, comprehensiveBets, cutoff)

    return Array.from(stats.entries())
      .map(([emotion, s]) => {
        const count = s.wins + s.losses + s.pushes
        return {
          emotion,
          category: EMOTION_CATEGORIES[emotion] ?? 'other',
          winRate: count > 0 ? ((s.wins + s.pushes * 0.5) / count) * 100 : 0,
          roi: s.stake > 0 ? (s.pl / s.stake) * 100 : 0,
          avgStake: count > 0 ? s.stake / count : 0,
          count,
        }
      })
      .filter(r => r.count >= 1)
      .sort((a, b) => {
        if (sortBy === 'count')   return b.count - a.count
        if (sortBy === 'roi')     return b.roi - a.roi
        if (sortBy === 'score')   return (EMOTION_SCORE_LOOKUP[b.emotion] ?? 50) - (EMOTION_SCORE_LOOKUP[a.emotion] ?? 50)
        return b.winRate - a.winRate  // default: winRate
      })
  }, [trades, comprehensiveBets, cutoff, sortBy])

  // Per-column min/max (only rows with data)
  const colRanges = useMemo(() => {
    if (rows.length === 0) return { winRate: [0, 100], roi: [-50, 50] }
    const winRates = rows.map(r => r.winRate)
    const rois = rows.map(r => r.roi)
    return {
      winRate: [Math.min(...winRates), Math.max(...winRates)],
      roi:     [Math.min(...rois),     Math.max(...rois)],
    }
  }, [rows])

  if (rows.length === 0) {
    return (
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
          <div>
            <h4 className="text-base font-semibold">Your Emotions vs Bet Performance</h4>
            <p className="text-xs text-muted-foreground mt-0.5">Heatmap · Green = profitable · Red = destructive</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">
          No bet data with emotion logs for this period. Log your emotion before placing bets to see correlations here.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h4 className="text-base font-semibold text-foreground">Your Emotions vs Bet Performance</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Heatmap · {rows.length} emotion{rows.length !== 1 ? 's' : ''} tracked · Colors normalized per column
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div style={{ display: 'inline-block', minWidth: 'max-content' }}>

          {/* Column headers */}
          <div className="flex gap-px mb-px" style={{ paddingLeft: 188 }}>
            {[
              { label: 'Win Rate', sub: 'per-col scale' },
              { label: 'Avg ROI',  sub: 'per-col scale' },
              { label: 'Avg Stake', sub: 'neutral' },
              { label: 'Bets',     sub: 'count' },
            ].map(h => (
              <div key={h.label} style={{ width: 100 }} className="text-center pb-1">
                <div className="text-xs font-semibold text-muted-foreground">{h.label}</div>
                <div className="text-[9px] text-muted-foreground/40">{h.sub}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex flex-col gap-px">
            {rows.map(row => {
              const lowSample = row.count < 3
              const winBg  = normalizedBg(row.winRate, colRanges.winRate[0], colRanges.winRate[1])
              const roiBg  = normalizedBg(row.roi,     colRanges.roi[0],     colRanges.roi[1])

              return (
                <div key={row.emotion} className="flex items-stretch gap-px">
                  {/* Row label */}
                  <div
                    style={{ width: 184, height: CELL_H, flexShrink: 0 }}
                    className="flex items-center gap-2 pr-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground capitalize">{row.emotion}</span>
                        {showCategories && (
                          <span className={`text-[9px] px-1 py-0.5 rounded font-medium ${CATEGORY_COLORS[row.category] ?? 'bg-muted/30 text-muted-foreground'}`}>
                            {row.category}
                          </span>
                        )}
                        {lowSample && (
                          <span className="text-[9px] text-muted-foreground/50" title="Small sample">*</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div
                    style={{ width: 100, height: CELL_H, backgroundColor: lowSample ? 'rgba(255,255,255,0.05)' : winBg, flexShrink: 0 }}
                    className="flex flex-col items-center justify-center rounded-sm"
                    title={`Win Rate: ${row.winRate.toFixed(1)}% · ${row.count} bet${row.count !== 1 ? 's' : ''}`}
                  >
                    <span className={`text-sm font-bold ${lowSample ? 'text-muted-foreground' : 'text-white'}`}>
                      {row.winRate.toFixed(1)}%
                    </span>
                    {lowSample && <span className="text-[9px] text-muted-foreground/50">low n</span>}
                  </div>

                  {/* ROI */}
                  <div
                    style={{ width: 100, height: CELL_H, backgroundColor: lowSample ? 'rgba(255,255,255,0.05)' : roiBg, flexShrink: 0 }}
                    className="flex flex-col items-center justify-center rounded-sm"
                    title={`ROI: ${row.roi >= 0 ? '+' : ''}${row.roi.toFixed(1)}% · ${row.count} bet${row.count !== 1 ? 's' : ''}`}
                  >
                    <span className={`text-sm font-bold ${lowSample ? 'text-muted-foreground' : 'text-white'}`}>
                      {row.roi >= 0 ? '+' : ''}{row.roi.toFixed(1)}%
                    </span>
                    {lowSample && <span className="text-[9px] text-muted-foreground/50">low n</span>}
                  </div>

                  {/* Avg Stake — neutral */}
                  <div
                    style={{ width: 100, height: CELL_H, flexShrink: 0 }}
                    className="flex items-center justify-center rounded-sm bg-muted/15"
                  >
                    <span className="text-sm font-medium text-muted-foreground">${row.avgStake.toFixed(0)}</span>
                  </div>

                  {/* Bet Count — neutral */}
                  <div
                    style={{ width: 100, height: CELL_H, flexShrink: 0 }}
                    className="flex items-center justify-center rounded-sm bg-muted/15"
                  >
                    <span className="text-sm font-medium text-muted-foreground">{row.count}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Color scale legend */}
          <div className="mt-4 flex items-center gap-4 flex-wrap" style={{ paddingLeft: 188 }}>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 100,
                  height: 7,
                  borderRadius: 3,
                  background: 'linear-gradient(to right, hsl(0,65%,28%), hsl(60,65%,28%), hsl(120,65%,28%))',
                }}
              />
              <span className="text-[10px] text-muted-foreground">Worst → Best (per column)</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground/50">* = &lt;3 bets (low confidence)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category toggle */}
      <button
        className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShowCategories(v => !v)}
      >
        {showCategories ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {showCategories ? 'Hide' : 'Show'} emotion categories
      </button>
    </Card>
  )
}
