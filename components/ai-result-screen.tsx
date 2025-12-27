"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SemiCircleGauge } from "@/components/ui/semi-circle-gauge"
import { BiasCard, BiasCarousel } from "@/components/ui/bias-card"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Brain,
  DollarSign,
  RefreshCw,
  Heart,
  Zap,
  Frown,
  TrendingDown,
  Target,
  Clock
} from "lucide-react"
import type { ComprehensiveAnalysis, BetScenario } from "@/lib/ai-bet-advisor"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface BiasInfo {
  key: string
  title: string
  description: string
  icon: LucideIcon
  severity: "low" | "moderate" | "high"
}

interface AIResultScreenProps {
  analysis: ComprehensiveAnalysis
  scenario: BetScenario
  onPlaceBet: () => void
  onDiscard: () => void
}

// Comprehensive behavioral biases configuration
const BIAS_DEFINITIONS: Record<string, Omit<BiasInfo, "key">> = {
  chasing: {
    title: "Chasing Losses",
    description: "Attempting to recover previous losses by placing more bets, often with larger amounts or riskier selections.",
    icon: RefreshCw,
    severity: "high",
  },
  favorite: {
    title: "Favorite Team Bias",
    description: "Overvaluing your favorite team's chances due to emotional attachment rather than objective analysis.",
    icon: Heart,
    severity: "moderate",
  },
  live: {
    title: "Live Betting Impulsivity",
    description: "Making rushed decisions during live games without proper analysis due to in-the-moment excitement.",
    icon: Zap,
    severity: "moderate",
  },
  tilt: {
    title: "Emotional Tilt",
    description: "Making irrational betting decisions while experiencing strong negative emotions like frustration or anger.",
    icon: Frown,
    severity: "high",
  },
  overconfidence: {
    title: "Overconfidence Bias",
    description: "Overestimating your ability to predict outcomes or believing you have an 'edge' without evidence.",
    icon: Target,
    severity: "moderate",
  },
  revenge: {
    title: "Revenge Betting",
    description: "Betting to 'get back at' the sportsbook or prove yourself right after a recent loss.",
    icon: TrendingDown,
    severity: "high",
  },
  recency: {
    title: "Recency Bias",
    description: "Overweighting recent results while ignoring longer-term trends and statistical patterns.",
    icon: Clock,
    severity: "low",
  },
}

export function AIResultScreen({ analysis, scenario, onPlaceBet, onDiscard }: AIResultScreenProps) {
  const { recommendation } = analysis

  // Calculate psychological edge score (inverse of emotional risk + factors)
  const calculatePsychologicalEdge = () => {
    let score = 100

    // Deduct based on emotional risk
    if (recommendation.emotionalAnalysis.emotionalRisk === "HIGH") score -= 40
    else if (recommendation.emotionalAnalysis.emotionalRisk === "MODERATE") score -= 20

    // Deduct based on safety signals
    score -= analysis.safety.signals.length * 10

    // Deduct based on scenario self-reported risk factors
    if (scenario.isChasingLoss) score -= 25
    if (scenario.isLiveBet) score -= 15
    if (scenario.isFavoriteTeam) score -= 10

    // Deduct based on bankroll concentration
    if (recommendation.budgetPercent > 10) {
      score -= Math.min(30, Math.round((recommendation.budgetPercent - 10) / 5) * 5)
    }

    // Deduct based on risk level
    if (recommendation.riskLevel === "HIGH") score -= 20
    else if (recommendation.riskLevel === "MODERATE") score -= 10

    // If we're explicitly advising against betting, the "edge" should reflect that.
    if (recommendation.recommendation === "DON'T PLACE BET") score -= 10

    // Add back based on confidence
    score = Math.max(0, Math.min(100, score))

    return score
  }

  const psychEdge = calculatePsychologicalEdge()

  // Determine status card styling
  const getStatusConfig = () => {
    switch (recommendation.recommendation) {
      case "PLACE BET":
        return {
          color: "bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/50",
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          textColor: "text-green-500",
          accentColor: "border-green-500",
        }
      case "PROCEED WITH CAUTION":
        return {
          color: "bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-yellow-500/50",
          icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
          textColor: "text-yellow-500",
          accentColor: "border-yellow-500",
        }
      default: // DON'T PLACE BET
        return {
          color: "bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/50",
          icon: <XCircle className="h-8 w-8 text-red-500" />,
          textColor: "text-red-500",
          accentColor: "border-red-500",
        }
    }
  }

  const statusConfig = getStatusConfig()

  // Identify biases
  const identifyBiases = (): BiasInfo[] => {
    const biases: BiasInfo[] = []

    if (scenario.isChasingLoss && BIAS_DEFINITIONS.chasing) {
      biases.push({ key: "chasing", ...BIAS_DEFINITIONS.chasing })
    }

    if (scenario.isFavoriteTeam && BIAS_DEFINITIONS.favorite) {
      biases.push({ key: "favorite", ...BIAS_DEFINITIONS.favorite })
    }

    if (scenario.isLiveBet && BIAS_DEFINITIONS.live) {
      biases.push({ key: "live", ...BIAS_DEFINITIONS.live })
    }

    // Check emotional state
    const emotionText = scenario.currentEmotion.toLowerCase()
    if (/frustrated|angry|upset/.test(emotionText) && BIAS_DEFINITIONS.tilt) {
      biases.push({ key: "tilt", ...BIAS_DEFINITIONS.tilt })
    }

    if (/greedy|lucky|fomo|confident/.test(emotionText) && BIAS_DEFINITIONS.overconfidence) {
      biases.push({ key: "overconfidence", ...BIAS_DEFINITIONS.overconfidence })
    }

    // Check last outcome
    if (scenario.lastOutcome === "Lost" && recommendation.emotionalAnalysis.emotionalRisk === "HIGH" && BIAS_DEFINITIONS.revenge) {
      biases.push({ key: "revenge", ...BIAS_DEFINITIONS.revenge })
    }

    // Check for recency bias based on recent history
    if (scenario.history && /yesterday|today|this week/i.test(scenario.history) && BIAS_DEFINITIONS.recency) {
      biases.push({ key: "recency", ...BIAS_DEFINITIONS.recency })
    }

    return biases
  }

  const detectedBiases = identifyBiases()

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Status Card Header */}
      <Card className={cn("border-2", statusConfig.color)}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0">{statusConfig.icon}</div>
            <div className="flex-1 space-y-2">
              <h2 className={cn("text-2xl font-bold", statusConfig.textColor)}>
                {recommendation.recommendation}
              </h2>
              <p className="text-base text-foreground/80 leading-relaxed">
                {recommendation.reason}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Badge variant="outline" className={cn("text-sm", statusConfig.accentColor)}>
                  Confidence: {recommendation.confidence}%
                </Badge>
                <Badge variant="outline" className={cn("text-sm", statusConfig.accentColor)}>
                  Risk: {recommendation.riskLevel}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Psychological Edge Meter */}
      <Card className={cn(
        "bg-card/50 backdrop-blur transition-all duration-300",
        psychEdge < 70 && "ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/20"
      )}>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Psychological Edge</h3>
            <SemiCircleGauge
              value={psychEdge}
              size={200}
              strokeWidth={14}
              label="/ 100"
            />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {psychEdge >= 70 && "Strong mental positioning for this bet"}
              {psychEdge >= 40 && psychEdge < 70 && "Moderate emotional stability - proceed with awareness"}
              {psychEdge < 40 && "High emotional risk detected - consider waiting"}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* The Why Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: The Math */}
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">The Math</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Bet Amount</span>
                <span className="text-lg font-bold tabular-nums">${scenario.betAmount}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Budget %</span>
                <span className="text-lg font-bold tabular-nums">{recommendation.budgetPercent}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Bet Type</span>
                <span className="text-lg font-bold">{scenario.betType}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Sport</span>
                <span className="text-lg font-bold">{scenario.sport}</span>
              </div>
              {recommendation.gameFactors.favoriteWinPct > 0 && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Win Probability</span>
                  <span className="text-lg font-bold tabular-nums">
                    {recommendation.gameFactors.favoriteWinPct}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-muted-foreground">Safety Signals</span>
                <span className={cn(
                  "text-lg font-bold tabular-nums",
                  analysis.safety.signals.length === 0 ? "text-green-500" : "text-red-500"
                )}>
                  {analysis.safety.signals.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Column 2: The Mind */}
        <Card className="bg-card/50 backdrop-blur border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">The Mind</h3>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3">Identified Biases</h4>
                {detectedBiases.length > 0 ? (
                  <BiasCarousel>
                    {detectedBiases.map((bias) => (
                      <BiasCard
                        key={bias.key}
                        icon={bias.icon}
                        title={bias.title}
                        description={bias.description}
                        severity={bias.severity}
                      />
                    ))}
                  </BiasCarousel>
                ) : (
                  <Badge variant="secondary" className="text-sm">
                    ✓ No Major Biases Detected
                  </Badge>
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Emotional State</h4>
                <Badge variant="outline" className="text-base">
                  {scenario.currentEmotion}
                </Badge>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Last Outcome</h4>
                <Badge
                  variant={scenario.lastOutcome === "Won" ? "secondary" : scenario.lastOutcome === "Lost" ? "destructive" : "outline"}
                  className="text-base"
                >
                  {scenario.lastOutcome}
                </Badge>
              </div>

              {recommendation.emotionalAnalysis.shouldWait && (
                <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500 font-semibold">
                    ⚠️ Waiting Period Recommended
                  </p>
                  <p className="text-xs text-red-500/80 mt-1">
                    {recommendation.emotionalAnalysis.waitingPeriod}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={onPlaceBet}
          size="lg"
          className="flex-1 h-14 text-base font-semibold"
        >
          <DollarSign className="h-5 w-5 mr-2" />
          Place Bet (Tracked{recommendation.recommendation === "DON'T PLACE BET" ? " — Do not recommend" : ""})
        </Button>
        <Button
          onClick={onDiscard}
          variant="outline"
          size="lg"
          className="flex-1 h-14 text-base font-semibold"
        >
          Discard & Clear Head
        </Button>
      </div>
    </div>
  )
}
