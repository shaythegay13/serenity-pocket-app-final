"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  Shield, 
  Sparkles,
  TrendingDown,
  Activity,
  Clock
} from "lucide-react"
import type { UserData, TiltAlert } from "@/lib/types"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { canAccessFeature } from "@/lib/subscription-tiers"
import { ActivityRing } from "@/components/activity-ring"

interface HomeTabProps {
  userData: UserData
  updateUserData: (updates: Partial<UserData>) => Promise<void>
  onNavigateToTab: (tab: string) => void
  refreshKey: number
}

export function HomeTab({ userData, updateUserData, onNavigateToTab, refreshKey }: HomeTabProps) {
  const [tiltAlerts, setTiltAlerts] = useState<TiltAlert[]>([])
  const [recentBets, setRecentBets] = useState<any[]>([])
  const [emotionalScore, setEmotionalScore] = useState(75)
  const [showCooldown, setShowCooldown] = useState(false)

  useEffect(() => {
    const init = async () => {
      // Load recent emotion logs to calculate emotional score
      const emotionLogs = await storage.getEmotionLogs()
      const recentEmotions = emotionLogs.slice(-5)
      
      // Calculate emotional stability score (0-100)
      // Higher intensity negative emotions = lower score
      if (recentEmotions.length > 0) {
        const negativeEmotions = ["anxious", "frustrated", "angry", "fearful", "stressed"]

        const avgScore = recentEmotions.reduce((sum, log) => {
          const isNegative = negativeEmotions.includes(log.emotion.toLowerCase())
          // Map 1-5 intensity to 0-100 scale
          const scaledIntensity = (log.intensity / 5) * 100
          // Negative: high intensity lowers score; Positive/neutral: high intensity raises score
          const entryScore = isNegative ? 100 - scaledIntensity : scaledIntensity
          return sum + entryScore
        }, 0) / recentEmotions.length

        setEmotionalScore(Math.round(avgScore))
      }

      // Check for tilt conditions
      const trades = await storage.getTrades()
      const recentTrades = trades.slice(-5)
      setRecentBets(recentTrades)
      
      // Detect tilt patterns
      const alerts: TiltAlert[] = []
      const recentLosses = recentTrades.filter(t => t.outcome === "loss").length
      
      if (recentLosses >= 3) {
        alerts.push({
          id: "losing-streak",
          timestamp: new Date(),
          severity: "high",
          triggers: ["3+ consecutive losses detected"],
          recommendation: "Take a 24-hour break to reset emotionally",
          cooldownSuggested: true
        })
        setShowCooldown(true)
      }

      if (emotionalScore < 40) {
        alerts.push({
          id: "emotional-volatility",
          timestamp: new Date(),
          severity: "critical",
          triggers: ["High emotional volatility", "Recent negative emotions"],
          recommendation: "Avoid betting until emotional state stabilizes",
          cooldownSuggested: true
        })
        setShowCooldown(true)
      }

      setTiltAlerts(alerts)
    }
    init()
  }, [userData, refreshKey])

  const getEmotionalScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500"
    if (score >= 40) return "text-yellow-500"
    return "text-red-500"
  }

  const getEmotionalScoreLabel = (score: number) => {
    if (score >= 70) return "Stable"
    if (score >= 40) return "Moderate"
    return "Volatile"
  }

  const getGaugeColor = (score: number) => {
    if (score >= 70) return "#22c55e"
    if (score >= 40) return "#eab308"
    return "#ef4444"
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/10 border-red-500/30 text-red-500"
      case "high": return "bg-orange-500/10 border-orange-500/30 text-orange-500"
      case "medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-500"
      default: return "bg-blue-500/10 border-blue-500/30 text-blue-500"
    }
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          Welcome back, {userData.name}
        </h2>
        <p className="text-muted-foreground">
          Your behavioral betting companion is here to help you make smarter decisions
        </p>
      </div>

      {/* Mission Statement */}
      <div className="px-4">
        <p className="text-sm text-foreground leading-relaxed">
          Serenity Pocket by PlayMindLabs applies behavioral science and data analytics to betting performance. Using real‑time mood tracking and decision‑pattern modeling, our system identifies when psychological factors—such as stress, confidence, or loss‑chasing—are influencing your wagers. By correlating emotional states with outcome data, Serenity Pocket helps you quantify risk, minimize volatility, and optimize long‑term performance through self‑awareness and evidence‑based insights.
        </p>
        <p className="text-sm text-foreground leading-relaxed mt-4 font-medium">
          Thank you for being part of a movement toward smarter, data‑driven play.
        </p>
      </div>

      {/* What Sets Us Apart */}
      <div className="px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-purple-500/20">
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">What Sets Serenity Pocket Apart</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          What sets Serenity Pocket apart is the fusion of psychology and predictive analytics. Our AI systems don't just process sports data — they learn from your behavioral patterns, emotional responses, and historical outcomes to deliver truly personalized insights. By combining cognitive modeling, real‑time performance tracking, and recovery recommendations, we help users transform betting into a skill‑based, self‑aware process. Serenity Pocket isn't just another betting tool — it's the first system designed to help you win with both data and discipline.
        </p>
      </div>

      {/* Cooldown Mode Alert */}
      {showCooldown && (
        <Card className="p-6 bg-linear-to-br from-red-500/10 to-orange-500/10 border-red-500/30">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Cooldown Mode Activated
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your betting patterns suggest you need a break. Taking time off helps reset emotional volatility.
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowCooldown(false)}>
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Tilt Alerts */}
      {tiltAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Tilt Alerts
          </h3>
          {tiltAlerts.map((alert) => (
            <Card key={alert.id} className={`p-4 ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {alert.severity.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {alert.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <ul className="space-y-1 mb-2">
                    {alert.triggers.map((trigger, i) => (
                      <li key={i} className="text-sm">• {trigger}</li>
                    ))}
                  </ul>
                  <p className="text-sm font-medium">{alert.recommendation}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onNavigateToTab("behavior")}
                >
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Privacy & Ethics Statement */}
      <div className="px-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-green-500/20">
            <Shield className="h-6 w-6 text-green-500" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Your Privacy & Well-Being Come First</h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed">
          Your data and well‑being come first. Serenity Pocket is built on privacy, security, and ethical design principles that prioritize transparency at every step. All tracking features are optional and encrypted, giving you full control over what's recorded and how it's used. Our mission is to create a responsible betting companion that supports informed decisions — never exploits impulsive ones — ensuring that you stay in control of both your data and your play.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { if (showCooldown || emotionalScore < 50) return; onNavigateToTab("odds") }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-blue-500/10">
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Sports Dashboard</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Compare real-time odds across multiple sportsbooks
          </p>
          {!canAccessFeature(userData.subscriptionTier || "free", "premium") && (
            <Badge variant="secondary" className="mt-3">Premium Feature</Badge>
          )}
          {(showCooldown || emotionalScore < 50) && (
            <Badge variant="destructive" className="mt-3">Cooldown Active</Badge>
          )}
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { if (showCooldown || emotionalScore < 50) return; onNavigateToTab("analyze") }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-purple-500/10">
              <Brain className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Analyze Bet</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Get AI-powered analysis of your bet ideas
          </p>
          {!canAccessFeature(userData.subscriptionTier || "free", "premium") && (
            <Badge variant="secondary" className="mt-3">Premium Feature</Badge>
          )}
          {(showCooldown || emotionalScore < 50) && (
            <Badge variant="destructive" className="mt-3">Cooldown Active</Badge>
          )}
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => { if (showCooldown || emotionalScore < 50) return; onNavigateToTab("ai-picks") }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <Sparkles className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Insight Hub</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            AI-powered picks and bet analysis tools
          </p>
          {!canAccessFeature(userData.subscriptionTier || "free", "elite") && (
            <Badge variant="secondary" className="mt-3">Elite Feature</Badge>
          )}
          {(showCooldown || emotionalScore < 50) && (
            <Badge variant="destructive" className="mt-3">Cooldown Active</Badge>
          )}
        </Card>
      </div>

    </div>
  )
}
