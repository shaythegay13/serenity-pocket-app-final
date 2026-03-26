'use client'

import React, { useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Plus, Trash2, AlertTriangle, TrendingUp } from 'lucide-react'
import type { ParlayLeg, CorrelationWarning } from '@/lib/types/ai-models'
import {
  calculateCombinedOdds,
  calculateSGPOdds,
  detectCorrelations,
  decimalToAmerican,
  impliedProbabilityFromOdds,
} from '@/lib/parlay-utils'
import { getPropMarketsForSport, PROP_MARKET_DISPLAY_NAMES } from '@/lib/types/player-props'
import type { SupportedSportKey } from '@/lib/ai-bet-advisor'

const LEG_BET_TYPES = [
  { value: 'moneyline', label: 'ML' },
  { value: 'spread', label: 'Spread' },
  { value: 'over', label: 'Over' },
  { value: 'under', label: 'Under' },
  { value: 'player_prop', label: 'Prop' },
]

interface TiltLabParlayBuilderProps {
  legs: ParlayLeg[]
  onChange: (legs: ParlayLeg[]) => void
  sport: SupportedSportKey
  isSGP: boolean
}

function emptyLeg(index: number): ParlayLeg {
  return {
    pickId: `manual-leg-${Date.now()}-${index}`,
    teams: '',
    betType: 'moneyline',
    line: '',
    odds: -110,
    selection: 'home',
  }
}

export function TiltLabParlayBuilder({ legs, onChange, sport, isSGP }: TiltLabParlayBuilderProps) {
  const addLeg = useCallback(() => {
    if (legs.length >= 12) return
    onChange([...legs, emptyLeg(legs.length)])
  }, [legs, onChange])

  const removeLeg = useCallback((index: number) => {
    onChange(legs.filter((_, i) => i !== index))
  }, [legs, onChange])

  const updateLeg = useCallback((index: number, patch: Partial<ParlayLeg>) => {
    const updated = legs.map((leg, i) => i === index ? { ...leg, ...patch } : leg)
    onChange(updated)
  }, [legs, onChange])

  // Live combined odds
  const oddsInfo = useMemo(() => {
    const validLegs = legs.filter(l => l.odds && Number.isFinite(l.odds))
    if (validLegs.length < 2) return null

    if (isSGP) {
      const result = calculateSGPOdds(validLegs)
      const americanOdds = decimalToAmerican(result.odds)
      const impliedProb = (1 / result.odds) * 100
      return {
        americanOdds,
        impliedProb,
        sgpTax: result.effectiveTax,
        correlationWarnings: result.correlationWarnings as CorrelationWarning[],
      }
    } else {
      const decimalOdds = calculateCombinedOdds(validLegs)
      const americanOdds = decimalToAmerican(decimalOdds)
      const impliedProb = (1 / decimalOdds) * 100
      const correlationWarnings = detectCorrelations(validLegs)
      return { americanOdds, impliedProb, sgpTax: null, correlationWarnings }
    }
  }, [legs, isSGP])

  const propMarkets = useMemo(() => getPropMarketsForSport(sport), [sport])

  const severityColor = (severity: CorrelationWarning['severity']) => {
    if (severity === 'high') return 'destructive'
    if (severity === 'medium') return 'outline'
    return 'secondary'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">
          {isSGP ? 'Same-Game Parlay Legs' : 'Parlay Legs'} ({legs.length})
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLeg}
          disabled={legs.length >= 12}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Leg
        </Button>
      </div>

      {legs.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
          No legs yet. Click "Add Leg" to build your {isSGP ? 'SGP' : 'parlay'}.
        </div>
      )}

      {legs.map((leg, index) => {
        const isPlayerProp = leg.betType === 'player_prop'
        const hasLine = leg.betType === 'spread' || leg.betType === 'over' || leg.betType === 'under'

        return (
          <div key={leg.pickId} className="border rounded-lg p-3 space-y-3 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Leg {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeLeg(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Leg type */}
            <SegmentedControl
              options={LEG_BET_TYPES}
              value={leg.betType}
              onChange={(v) => updateLeg(index, { betType: v, playerName: undefined, propStat: undefined, propLine: undefined, propDirection: undefined })}
            />

            {/* Teams or player */}
            {isPlayerProp ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Player Name</Label>
                  <Input
                    placeholder="e.g., LeBron James"
                    value={leg.playerName || ''}
                    onChange={(e) => updateLeg(index, { playerName: e.target.value, teams: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Team (optional)</Label>
                  <Input
                    placeholder="e.g., LAL"
                    value={leg.playerTeam || ''}
                    onChange={(e) => updateLeg(index, { playerTeam: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Stat / Prop Type</Label>
                  <Select
                    value={leg.propStat || ''}
                    onValueChange={(v) => updateLeg(index, { propStat: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select stat" />
                    </SelectTrigger>
                    <SelectContent>
                      {propMarkets.map((m) => (
                        <SelectItem key={m} value={m}>
                          {PROP_MARKET_DISPLAY_NAMES[m] || m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Line</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g., 25.5"
                    value={leg.propLine ?? ''}
                    onChange={(e) => updateLeg(index, { propLine: parseFloat(e.target.value) || undefined })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs">Over / Under</Label>
                  <SegmentedControl
                    options={[{ value: 'over', label: 'Over' }, { value: 'under', label: 'Under' }]}
                    value={leg.propDirection || 'over'}
                    onChange={(v) => updateLeg(index, { propDirection: v as 'over' | 'under', selection: v })}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs">Teams (Away @ Home)</Label>
                <Input
                  placeholder="e.g., Lakers @ Celtics"
                  value={leg.teams}
                  onChange={(e) => updateLeg(index, { teams: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            )}

            {/* Line (spread/total) */}
            {hasLine && !isPlayerProp && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Line</Label>
                  <Input
                    type="number"
                    step="0.5"
                    placeholder="e.g., -3.5 or 225.5"
                    value={leg.line || ''}
                    onChange={(e) => updateLeg(index, { line: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                {(leg.betType === 'spread') && (
                  <div>
                    <Label className="text-xs">Side</Label>
                    <SegmentedControl
                      options={[{ value: 'home', label: 'Home' }, { value: 'away', label: 'Away' }]}
                      value={leg.selection || 'home'}
                      onChange={(v) => updateLeg(index, { selection: v })}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Odds */}
            <div>
              <Label className="text-xs">Odds (American)</Label>
              <Input
                type="number"
                placeholder="e.g., -110 or +150"
                value={leg.odds || ''}
                onChange={(e) => updateLeg(index, { odds: parseInt(e.target.value) || 0 })}
                className="h-8 text-sm"
              />
            </div>
          </div>
        )
      })}

      {/* Live summary */}
      {oddsInfo && legs.length >= 2 && (
        <div className="rounded-lg border bg-muted/40 p-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              Combined Odds
            </span>
            <span className="font-semibold text-primary">
              {oddsInfo.americanOdds > 0 ? `+${oddsInfo.americanOdds}` : oddsInfo.americanOdds}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Implied Win Probability</span>
            <span>{oddsInfo.impliedProb.toFixed(1)}%</span>
          </div>
          {isSGP && oddsInfo.sgpTax !== null && (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>SGP correlation tax</span>
              <span>{(oddsInfo.sgpTax * 100).toFixed(0)}%</span>
            </div>
          )}

          {oddsInfo.correlationWarnings.length > 0 && (
            <div className="space-y-1 pt-1 border-t">
              <p className="text-xs font-medium flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                Correlation Warnings
              </p>
              {oddsInfo.correlationWarnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <Badge variant={severityColor(w.severity) as any} className="text-[10px] h-4 shrink-0">
                    {w.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{w.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TiltLabParlayBuilder
