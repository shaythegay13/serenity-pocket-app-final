"use client"

import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import type { Trade } from "@/lib/types"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { EMOTION_CATEGORIES } from "./constants"

interface EmotionHeatmapProps {
  trades: Trade[]
  comprehensiveBets: ComprehensiveBet[]
}

interface RowMetrics {
  label: string
  emoji: string
  winRate: number
  roi: number
  avgStake: number
  count: number
}

const EMOTION_ORDER = ['joy', 'calm', 'fear', 'greed', 'frustration', 'sadness'] as const

const EMOTION_META: Record<string, { label: string; emoji: string }> = {
  joy:         { label: 'Joy',         emoji: '😊' },
  calm:        { label: 'Calm',        emoji: '😌' },
  fear:        { label: 'Fear',        emoji: '😨' },
  greed:       { label: 'Greed',       emoji: '🤑' },
  frustration: { label: 'Frustration', emoji: '😤' },
  sadness:     { label: 'Sadness',     emoji: '😞' },
}

const DATE_RANGES = [
  { value: "7",   label: "Last 7 days" },
  { value: "30",  label: "Last 30 days" },
  { value: "90",  label: "Last 90 days" },
  { value: "all", label: "All time" },
]

function winRateBg(v: number): string {
  const hue = Math.round(Math.min(100, Math.max(0, v)) * 1.2)
  return `hsl(${hue}, 65%, 32%)`
}

function roiBg(v: number): string {
  const clamped = Math.max(-50, Math.min(50, v))
  const hue = Math.round(((clamped + 50) / 100) * 120)
  return `hsl(${hue}, 65%, 32%)`
}

function buildStats(
  trades: Trade[],
  comprehensiveBets: ComprehensiveBet[],
  cutoff: Date | null,
  keyFn: (trade: Trade) => string | null,
  betKeyFn: (bet: ComprehensiveBet) => string | null
): Map<string, { wins: number; losses: number; pushes: number; stake: number; pl: number }> {
  const stats = new Map<string, { wins: number; losses: number; pushes: number; stake: number; pl: number }>()

  const ensure = (key: string) => {
    if (!stats.has(key)) stats.set(key, { wins: 0, losses: 0, pushes: 0, stake: 0, pl: 0 })
    return stats.get(key)!
  }

  trades.forEach(trade => {
    const key = keyFn(trade)
    if (!key) return
    if (cutoff && new Date(trade.timestamp) < cutoff) return
    const outcome = trade.outcome || trade.result
    if (!outcome) return
    const s = ensure(key)
    s.stake += trade.stake ?? 0
    s.pl += (trade.actualReturn ?? 0) - (trade.stake ?? 0)
    if (outcome === 'profit' || outcome === 'win') s.wins++
    else if (outcome === 'loss') s.losses++
    else s.pushes++
  })

  comprehensiveBets.forEach(bet => {
    const key = betKeyFn(bet)
    if (!key) return
    if (cutoff && new Date(bet.timestamp) < cutoff) return
    if (!bet.outcome || bet.outcome === 'pending') return
    const s = ensure(key)
    s.stake += bet.stake
    s.pl += bet.profitLoss ?? 0
    if (bet.outcome === 'win') s.wins++
    else if (bet.outcome === 'loss') s.losses++
    else s.pushes++
  })

  return stats
}

function toRow(label: string, emoji: string, s: { wins: number; losses: number; pushes: number; stake: number; pl: number }): RowMetrics {
  const count = s.wins + s.losses + s.pushes
  return {
    label,
    emoji,
    winRate: count > 0 ? ((s.wins + s.pushes * 0.5) / count) * 100 : 0,
    roi: s.stake > 0 ? (s.pl / s.stake) * 100 : 0,
    avgStake: count > 0 ? s.stake / count : 0,
    count,
  }
}

function HeatCell({ value, count, type, fmt }: {
  value: number
  count: number
  type: 'winRate' | 'roi' | 'neutral'
  fmt: (v: number) => string
}) {
  if (count === 0) {
    return (
      <div className="h-12 flex items-center justify-center rounded text-xs text-muted-foreground bg-muted/20">
        —
      </div>
    )
  }
  if (type === 'neutral') {
    return (
      <div className="h-12 flex items-center justify-center rounded text-sm font-medium bg-muted/20 text-foreground">
        {fmt(value)}
      </div>
    )
  }
  const bg = type === 'winRate' ? winRateBg(value) : roiBg(value)
  const display = fmt(value)
  return (
    <div
      className="h-12 flex items-center justify-center rounded text-sm font-semibold text-white"
      style={{ backgroundColor: bg }}
      title={`${display} (${count} bet${count !== 1 ? 's' : ''})`}
    >
      {display}
    </div>
  )
}

function HeatRow({ row }: { row: RowMetrics }) {
  return (
    <>
      <div className="h-12 flex items-center gap-2 px-1">
        <span className="text-base">{row.emoji}</span>
        <span className="text-sm font-medium truncate">{row.label}</span>
        {row.count > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">({row.count})</span>
        )}
      </div>
      <HeatCell value={row.winRate} count={row.count} type="winRate" fmt={v => `${v.toFixed(1)}%`} />
      <HeatCell value={row.roi}     count={row.count} type="roi"     fmt={v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`} />
      <HeatCell value={row.avgStake} count={row.count} type="neutral" fmt={v => `$${v.toFixed(0)}`} />
    </>
  )
}

export function EmotionHeatmap({ trades, comprehensiveBets }: EmotionHeatmapProps) {
  const [dateRange, setDateRange] = useState("30")
  const [showSubEmotions, setShowSubEmotions] = useState(false)

  const cutoff = useMemo<Date | null>(() => {
    if (dateRange === "all") return null
    const d = new Date()
    d.setDate(d.getDate() - parseInt(dateRange))
    return d
  }, [dateRange])

  const categoryRows = useMemo<RowMetrics[]>(() => {
    const stats = buildStats(
      trades,
      comprehensiveBets,
      cutoff,
      trade => trade.preTradeEmotion
        ? (EMOTION_CATEGORIES[trade.preTradeEmotion.toLowerCase()] ?? null)
        : null,
      bet => bet.emotions?.before?.emotion
        ? (EMOTION_CATEGORIES[bet.emotions.before.emotion.toLowerCase()] ?? null)
        : null
    )

    // Ensure all 6 categories present even with zero data
    EMOTION_ORDER.forEach(e => {
      if (!stats.has(e)) stats.set(e, { wins: 0, losses: 0, pushes: 0, stake: 0, pl: 0 })
    })

    return EMOTION_ORDER.map(emotion => {
      const { label, emoji } = EMOTION_META[emotion]
      return toRow(label, emoji, stats.get(emotion)!)
    })
  }, [trades, comprehensiveBets, cutoff])

  const subEmotionRows = useMemo<RowMetrics[]>(() => {
    if (!showSubEmotions) return []

    const stats = buildStats(
      trades,
      comprehensiveBets,
      cutoff,
      trade => trade.preTradeEmotion?.toLowerCase() ?? null,
      bet => bet.emotions?.before?.emotion?.toLowerCase() ?? null
    )

    return Array.from(stats.entries())
      .map(([emotion, s]) => toRow(
        emotion.charAt(0).toUpperCase() + emotion.slice(1),
        '',
        s
      ))
      .filter(r => r.count >= 2)
      .sort((a, b) => b.winRate - a.winRate)
  }, [trades, comprehensiveBets, cutoff, showSubEmotions])

  const hasAnyData = categoryRows.some(r => r.count > 0)

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h4 className="text-base font-semibold text-foreground">
            Your Emotions vs Bet Performance
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Green = profitable states &middot; Red = destructive states
          </p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-36 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map(r => (
              <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <div
        className="grid gap-y-1 gap-x-2"
        style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
      >
        {/* Header */}
        <div className="text-xs font-medium text-muted-foreground pb-1 pl-1">Emotion</div>
        <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Win Rate</div>
        <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Avg ROI</div>
        <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Avg Stake</div>

        {/* Category rows */}
        {categoryRows.map(row => (
          <HeatRow key={row.label} row={row} />
        ))}
      </div>

      {!hasAnyData && (
        <p className="text-xs text-muted-foreground text-center mt-4 py-2">
          No bet data for this period. Log emotions before placing bets to see correlations.
        </p>
      )}

      {/* Sub-emotion toggle */}
      <button
        className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
        onClick={() => setShowSubEmotions(v => !v)}
      >
        {showSubEmotions ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        {showSubEmotions ? 'Hide' : 'Show'} sub-emotion detail
        {subEmotionRows.length > 0 && showSubEmotions && (
          <span className="ml-1 text-muted-foreground">({subEmotionRows.length} emotions with ≥2 bets)</span>
        )}
      </button>

      {showSubEmotions && (
        <div className="mt-3 pt-3 border-t border-border">
          {subEmotionRows.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No individual emotions have 2+ bets in this period yet.
            </p>
          ) : (
            <div
              className="grid gap-y-1 gap-x-2"
              style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr' }}
            >
              <div className="text-xs font-medium text-muted-foreground pb-1 pl-1">Emotion</div>
              <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Win Rate</div>
              <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Avg ROI</div>
              <div className="text-xs font-medium text-muted-foreground pb-1 text-center">Avg Stake</div>
              {subEmotionRows.map(row => (
                <HeatRow key={row.label} row={row} />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
