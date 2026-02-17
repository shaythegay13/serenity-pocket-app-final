"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { X, Plus, TrendingUp, AlertTriangle, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { ParlayLeg, CorrelationWarning } from "@/lib/types/ai-models"
import { 
  calculateCombinedOdds, 
  calculateParlayEV, 
  calculateParlayEVPercentage, 
  detectCorrelations,
  americanToDecimal,
  formatOdds
} from "@/lib/parlay-utils"
import { toast } from "sonner"

interface ParlayBuilderProps {
  selectedLegs: ParlayLeg[]
  onClearSelection: () => void
  onAnalyzeParlay: (legs: ParlayLeg[], stake: number) => void
  onRemoveLeg: (pickId: string) => void
}

export function ParlayBuilder({ 
  selectedLegs, 
  onClearSelection, 
  onAnalyzeParlay,
  onRemoveLeg 
}: ParlayBuilderProps) {
  const [stake, setStake] = useState<string>("100")
  const [isExpanded, setIsExpanded] = useState(false)
  
  const stakeAmount = parseFloat(stake) || 0
  
  // Calculate combined odds
  const combinedDecimalOdds = calculateCombinedOdds(selectedLegs)
  const combinedAmericanOdds = Math.round((combinedDecimalOdds - 1) * 100)
  const potentialPayout = stakeAmount * combinedDecimalOdds
  
  // Calculate EV
  const ev = calculateParlayEV(selectedLegs, stakeAmount)
  const evPercentage = calculateParlayEVPercentage(selectedLegs)
  
  // Detect correlations
  const correlations = detectCorrelations(selectedLegs)
  
  const handleAnalyze = () => {
    if (stakeAmount <= 0) {
      toast.error("Please enter a valid stake amount")
      return
    }
    onAnalyzeParlay(selectedLegs, stakeAmount)
  }
  
  const handleStakeChange = (value: string) => {
    // Only allow numbers and decimal point
    const cleanValue = value.replace(/[^0-9.]/g, '')
    // Only allow one decimal point
    const parts = cleanValue.split('.')
    if (parts.length > 2) {
      return
    }
    setStake(cleanValue)
  }
  
  if (selectedLegs.length < 2) return null
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg pb-[env(safe-area-inset-bottom)] md:pb-0 mb-16 md:mb-0">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <Card className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">
                  {selectedLegs.length} Leg{selectedLegs.length === 1 ? '' : 's'} Selected
                </span>
              </div>
              
              {/* Correlation Warnings */}
              {correlations.length > 0 && (
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    correlations.some(w => w.severity === 'high') ? 'text-red-500' :
                    correlations.some(w => w.severity === 'medium') ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  <span className="text-xs text-muted-foreground">
                    {correlations.length} warning{correlations.length === 1 ? '' : 's'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearSelection}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Expanded View */}
          {isExpanded && (
            <div className="space-y-4 mb-4">
              {/* Selected Legs */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">Selected Picks</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedLegs.map((leg, index) => (
                    <div key={leg.pickId} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium truncate">{leg.teams}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{leg.betType}</span>
                          <span>•</span>
                          <span>{leg.line}</span>
                          <span>•</span>
                          <span className="font-medium">{formatOdds(leg.odds)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveLeg(leg.pickId)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Correlation Warnings */}
              {correlations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-foreground">Correlation Analysis</h4>
                  <div className="space-y-1">
                    {correlations.map((warning, index) => (
                      <div key={index} className={`p-2 rounded-lg text-xs ${
                        warning.severity === 'high' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                        warning.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20' :
                        'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                      }`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">{warning.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Main Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Stake Input */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Stake Amount</label>
              <Input
                type="text"
                value={stake}
                onChange={(e) => handleStakeChange(e.target.value)}
                placeholder="100"
                className="h-9"
              />
            </div>
            
            {/* Combined Odds */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Combined Odds</label>
              <div className="h-9 flex items-center px-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium">{formatOdds(combinedAmericanOdds)}</span>
              </div>
            </div>
            
            {/* Potential Payout */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Potential Payout</label>
              <div className="h-9 flex items-center px-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-green-600">
                  ${potentialPayout.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* EV */}
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Expected Value</label>
              <div className={`h-9 flex items-center px-3 rounded-lg ${
                ev >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              }`}>
                <span className={`text-sm font-medium ${
                  ev >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ev >= 0 ? '+' : ''}${ev.toFixed(2)} ({ev >= 0 ? '+' : ''}{evPercentage.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            <Button
              onClick={handleAnalyze}
              className="flex-1"
              disabled={stakeAmount <= 0}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Analyze Parlay
            </Button>
            <Button
              variant="outline"
              onClick={onClearSelection}
            >
              Clear All
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
