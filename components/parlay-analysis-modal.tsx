"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, TrendingUp, AlertTriangle, CheckCircle2, Target, DollarSign, Shield, Info } from "lucide-react"
import { CorrelationWarning } from "@/lib/types/ai-models"
import { formatOdds } from "@/lib/parlay-utils"

interface ParlayAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  analysis: any
  onLogParlay: () => void
  onAdjustLegs: () => void
}

export function ParlayAnalysisModal({ 
  isOpen, 
  onClose, 
  analysis, 
  onLogParlay,
  onAdjustLegs 
}: ParlayAnalysisModalProps) {
  if (!isOpen || !analysis) return null

  const getAssessmentColor = (assessment: string) => {
    switch (assessment) {
      case 'PREFERRED':
        return 'bg-green-500/20 text-green-700 border-green-500/30'
      case 'REASONABLE':
        return 'bg-blue-500/20 text-blue-700 border-blue-500/30'
      case 'CAUTION':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      case 'DISCOURAGED':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-700 border-gray-500/30'
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'text-green-600'
      case 'MEDIUM':
        return 'text-blue-600'
      case 'HIGH':
        return 'text-yellow-600'
      case 'VERY_HIGH':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getEVColor = (ev: number) => {
    return ev >= 0 ? 'text-green-600' : 'text-red-600'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold text-foreground">Parlay Analysis</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Assessment Badge */}
          <div className="mb-6">
            <Badge className={`text-lg px-4 py-2 ${getAssessmentColor(analysis.assessment)}`}>
              {analysis.assessment}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">{analysis.summary}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {formatOdds(analysis.combinedOdds.american)}
              </div>
              <div className="text-xs text-muted-foreground">Combined Odds</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                ${analysis.potentialPayout}
              </div>
              <div className="text-xs text-muted-foreground">Potential Payout</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">
                {analysis.impliedProbability}%
              </div>
              <div className="text-xs text-muted-foreground">Implied Probability</div>
            </Card>
            
            <Card className="p-4 text-center">
              <div className={`text-2xl font-bold ${getEVColor(parseFloat(analysis.expectedValue.absolute))}`}>
                {parseFloat(analysis.expectedValue.absolute) >= 0 ? '+' : ''}${analysis.expectedValue.absolute}
              </div>
              <div className="text-xs text-muted-foreground">Expected Value</div>
            </Card>
          </div>

          {/* Risk Level */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Risk Level:</span>
                <span className={`font-bold ${getRiskColor(analysis.riskLevel)}`}>
                  {analysis.riskLevel.replace('_', ' ')}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">EV %</div>
                <div className={`font-bold ${getEVColor(parseFloat(analysis.expectedValue.percentage))}`}>
                  {parseFloat(analysis.expectedValue.percentage) >= 0 ? '+' : ''}{analysis.expectedValue.percentage}%
                </div>
              </div>
            </div>
          </Card>

          {/* Stake Recommendation */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-medium">Recommended Stake:</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-foreground">
                ${analysis.stakeRecommendation.amount}
              </span>
              <span className="text-sm text-muted-foreground">
                {analysis.stakeRecommendation.reasoning}
              </span>
            </div>
          </Card>

          {/* Warnings */}
          {analysis.warnings && analysis.warnings.length > 0 && (
            <Card className="p-4 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Warnings & Considerations</span>
              </div>
              <div className="space-y-2">
                {analysis.warnings.map((warning: CorrelationWarning, index: number) => (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg text-sm ${
                      warning.severity === 'high' ? 'bg-red-500/10 text-red-700 border border-red-500/20' :
                      warning.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-700 border border-yellow-500/20' :
                      'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>{warning.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Legs Breakdown */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-5 w-5" />
              <span className="font-medium">Parlay Legs ({analysis.legs.length})</span>
            </div>
            <div className="space-y-2">
              {analysis.legs.map((leg: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs">
                      {leg.leg}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{leg.teams}</div>
                      <div className="text-xs text-muted-foreground">
                        {leg.betType} • {leg.line}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatOdds(leg.odds)}</div>
                    <div className="text-xs text-muted-foreground">{leg.probability}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5" />
              <span className="font-medium">AI Recommendation</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {analysis.recommendation}
            </p>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={onLogParlay}
              className="flex-1"
              disabled={analysis.assessment === 'DISCOURAGED'}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Log Parlay
            </Button>
            <Button variant="outline" onClick={onAdjustLegs} className="flex-1">
              <Target className="h-4 w-4 mr-2" />
              Adjust Legs
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Disclaimer:</strong> This analysis is for informational purposes only. 
              Always bet responsibly and never wager more than you can afford to lose.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
