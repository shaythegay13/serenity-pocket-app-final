"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertTriangle,
  TrendingUp,
  Timer,
  Zap,
  Heart,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
  Coffee
} from "lucide-react"
import { supabase } from "@/lib/supabase"

interface EscalationPattern {
  type: string
  severity: string
  description: string
  occurrences: number
}

interface SequenceAnalysis {
  escalationRisk: number
  patterns: EscalationPattern[]
  velocityTrend: string
  stakeTrend: string
  liveBettingRatio: number
  confidence: number
}

interface RiskPatternWarningProps {
  /** If provided, uses this data instead of fetching */
  sequenceAnalysis?: SequenceAnalysis
  /** Called when user dismisses the warning */
  onDismiss?: () => void
  /** Whether to show in compact mode */
  compact?: boolean
  /** Custom class name */
  className?: string
}

const patternIcons: Record<string, React.ReactNode> = {
  loss_chasing: <TrendingUp className="h-4 w-4" />,
  stake_escalation: <TrendingUp className="h-4 w-4" />,
  velocity_increase: <Timer className="h-4 w-4" />,
  live_betting_spike: <Zap className="h-4 w-4" />,
  emotional_betting: <Heart className="h-4 w-4" />
}

const patternLabels: Record<string, string> = {
  loss_chasing: "Loss Chasing",
  stake_escalation: "Stake Escalation",
  velocity_increase: "Betting Velocity",
  live_betting_spike: "Live Betting",
  emotional_betting: "Emotional Betting"
}

const severityColors: Record<string, string> = {
  low: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  medium: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  high: "bg-red-500/10 text-red-600 border-red-500/30"
}

const interventionSuggestions: Record<string, string[]> = {
  loss_chasing: [
    "Take a 15-minute break before your next bet",
    "Set a strict loss limit for today",
    "Review your betting strategy"
  ],
  stake_escalation: [
    "Return to your original stake size",
    "Set a maximum stake limit",
    "Take a break to reset"
  ],
  velocity_increase: [
    "Slow down - wait at least 10 minutes between bets",
    "Review each bet more carefully",
    "Consider stepping away for an hour"
  ],
  live_betting_spike: [
    "Avoid live bets for the rest of the day",
    "Switch to pre-game betting only",
    "Live betting increases impulsivity risk"
  ],
  emotional_betting: [
    "Log your emotions before placing the next bet",
    "Use a breathing exercise to center yourself",
    "Consider if you're in the right state to bet"
  ]
}

export function RiskPatternWarning({
  sequenceAnalysis: providedAnalysis,
  onDismiss,
  compact = false,
  className = ""
}: RiskPatternWarningProps) {
  const [analysis, setAnalysis] = useState<SequenceAnalysis | null>(providedAnalysis || null)
  const [loading, setLoading] = useState(!providedAnalysis)
  const [expanded, setExpanded] = useState(!compact)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (providedAnalysis) {
      setAnalysis(providedAnalysis)
      setLoading(false)
      return
    }

    const fetchRiskData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        const response = await fetch(`/api/risk/${user.id}`)
        if (!response.ok) {
          setLoading(false)
          return
        }

        const data = await response.json()
        if (data.sequenceAnalysis) {
          setAnalysis(data.sequenceAnalysis)
        }
      } catch (error) {
        console.error("Error fetching risk data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRiskData()
  }, [providedAnalysis])

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  // Don't render if dismissed, loading, no analysis, or no patterns detected
  if (dismissed || loading || !analysis || analysis.patterns.length === 0) {
    return null
  }

  // Only show if escalation risk is above threshold
  if (analysis.escalationRisk < 0.2) {
    return null
  }

  const highSeverityPatterns = analysis.patterns.filter(p => p.severity === "high")
  const hasHighSeverity = highSeverityPatterns.length > 0

  const getRiskLevelColor = (risk: number) => {
    if (risk >= 0.7) return "text-red-500"
    if (risk >= 0.5) return "text-orange-500"
    if (risk >= 0.3) return "text-yellow-500"
    return "text-green-500"
  }

  const getRiskLevelLabel = (risk: number) => {
    if (risk >= 0.7) return "High"
    if (risk >= 0.5) return "Elevated"
    if (risk >= 0.3) return "Moderate"
    return "Low"
  }

  if (compact && !expanded) {
    return (
      <Card
        className={`border-orange-500/50 bg-orange-500/5 cursor-pointer ${className}`}
        onClick={() => setExpanded(true)}
      >
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${hasHighSeverity ? "text-red-500" : "text-orange-500"}`} />
            <div>
              <p className="font-medium text-sm">
                {analysis.patterns.length} betting pattern{analysis.patterns.length > 1 ? "s" : ""} detected
              </p>
              <p className="text-xs text-muted-foreground">
                Tap to view details
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-orange-500/50 bg-orange-500/5 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-5 w-5 ${hasHighSeverity ? "text-red-500" : "text-orange-500"}`} />
            <CardTitle className="text-base">Betting Pattern Alert</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {compact && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setExpanded(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Risk Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Escalation Risk</span>
            <span className={`font-bold ${getRiskLevelColor(analysis.escalationRisk)}`}>
              {getRiskLevelLabel(analysis.escalationRisk)} ({Math.round(analysis.escalationRisk * 100)}%)
            </span>
          </div>
          <Progress
            value={analysis.escalationRisk * 100}
            className="h-2"
          />
        </div>

        {/* Detected Patterns */}
        <div className="space-y-3">
          <p className="text-sm font-medium">Detected Patterns:</p>
          {analysis.patterns.map((pattern, index) => (
            <div
              key={index}
              className={`rounded-lg border p-3 ${severityColors[pattern.severity]}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {patternIcons[pattern.type] || <AlertTriangle className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                      {patternLabels[pattern.type] || pattern.type}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        pattern.severity === "high"
                          ? "border-red-500 text-red-600"
                          : pattern.severity === "medium"
                          ? "border-orange-500 text-orange-600"
                          : "border-yellow-500 text-yellow-600"
                      }`}
                    >
                      {pattern.severity}
                    </Badge>
                  </div>
                  <p className="text-xs mt-1 opacity-90">{pattern.description}</p>

                  {/* Intervention suggestions for high severity */}
                  {pattern.severity === "high" && interventionSuggestions[pattern.type] && (
                    <div className="mt-2 pt-2 border-t border-current/20">
                      <p className="text-xs font-medium mb-1">Suggested actions:</p>
                      <ul className="text-xs space-y-0.5 opacity-90">
                        {interventionSuggestions[pattern.type].slice(0, 2).map((suggestion, i) => (
                          <li key={i}>• {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px]"
            onClick={() => {
              // Could navigate to breathing exercises or cooldown
              window.location.href = "/?tab=behavior"
            }}
          >
            <Coffee className="h-4 w-4 mr-2" />
            Take a Break
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-w-[120px]"
            onClick={() => {
              window.location.href = "/?tab=account"
            }}
          >
            <Shield className="h-4 w-4 mr-2" />
            Set Limits
          </Button>
        </div>

        {/* Confidence indicator */}
        {analysis.confidence < 0.7 && (
          <p className="text-xs text-muted-foreground text-center">
            Analysis based on limited data ({Math.round(analysis.confidence * 100)}% confidence)
          </p>
        )}
      </CardContent>
    </Card>
  )
}
