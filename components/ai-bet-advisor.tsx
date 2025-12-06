"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import type { BetScenario, ComprehensiveAnalysis } from "@/lib/ai-bet-advisor"
import { supabase } from "@/lib/supabase"
import { storageHybrid as storage } from "@/lib/storage-hybrid"

// Core emotions with 10 sub-emotions each (matching behavior check-in)
const coreEmotions = [
  {
    id: "joy",
    label: "JOY",
    subEmotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"]
  },
  {
    id: "calm",
    label: "CALM",
    subEmotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"]
  },
  {
    id: "fear",
    label: "FEAR",
    subEmotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"]
  },
  {
    id: "greed",
    label: "GREED",
    subEmotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"]
  },
  {
    id: "frustration",
    label: "FRUSTRATION",
    subEmotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"]
  },
  {
    id: "sadness",
    label: "SADNESS",
    subEmotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"]
  }
]

export default function AIBetAdvisor() {
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState<ComprehensiveAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [usedEnhancedAI, setUsedEnhancedAI] = useState(false)
  const [enhancedInsights, setEnhancedInsights] = useState<string[] | null>(null)
  const [emotionCategory, setEmotionCategory] = useState<string>("")

  const [formData, setFormData] = useState<BetScenario>({
    sport: "NFL",
    betType: "Moneyline",
    betAmount: 0,
    budget: 0,
    favoriteTeam: "",
    underdogTeam: "",
    favoriteRecord: "",
    underdogRecord: "",
    injuries: "",
    weather: "",
    currentEmotion: "Centered",
    lastOutcome: "Haven't bet recently",
    emotionalTriggers: "",
    bettingSlip: "",
    history: "",
    notes: "",
  })

  // Prefill from Live Odds "Analyze This Bet (Advanced)" flow
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const raw = window.localStorage.getItem("pendingBetAnalysis")
      if (!raw) return

      const payload = JSON.parse(raw) as {
        sport?: string
        homeTeam?: string
        awayTeam?: string
        bestHomeOdds?: number
        bestAwayOdds?: number
        defaultStake?: number
        homeRecord?: string
        awayRecord?: string
      }

      // Map internal sport keys from odds API to human-readable labels
      const sportMap: Record<string, string> = {
        basketball_nba: "NBA",
        americanfootball_nfl: "NFL",
        baseball_mlb: "MLB",
        icehockey_nhl: "NHL",
      }

      const mappedSport = payload.sport && sportMap[payload.sport]

      // Infer favorite vs underdog from moneyline odds
      const homeOdds = typeof payload.bestHomeOdds === "number" ? payload.bestHomeOdds : NaN
      const awayOdds = typeof payload.bestAwayOdds === "number" ? payload.bestAwayOdds : NaN

      let favoriteTeam = payload.homeTeam || ""
      let underdogTeam = payload.awayTeam || ""
      let favoriteRecord = payload.homeRecord || ""
      let underdogRecord = payload.awayRecord || ""

      if (!Number.isNaN(homeOdds) && !Number.isNaN(awayOdds)) {
        const implied = (odds: number) => {
          if (!odds || Number.isNaN(odds)) return 0.5
          return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
        }

        const homeImp = implied(homeOdds)
        const awayImp = implied(awayOdds)

        if (awayImp > homeImp) {
          favoriteTeam = payload.awayTeam || favoriteTeam
          underdogTeam = payload.homeTeam || underdogTeam
          favoriteRecord = payload.awayRecord || favoriteRecord
          underdogRecord = payload.homeRecord || underdogRecord
        }
      }

      setFormData(prev => {
        const effectiveBetAmount = payload.defaultStake ?? prev.betAmount ?? 0
        // If user never set a budget, derive a reasonable default from the stake (e.g. 10x) or fallback to 500
        const effectiveBudget = (prev.budget && prev.budget > 0)
          ? prev.budget
          : (effectiveBetAmount > 0 ? effectiveBetAmount * 10 : 500)

        return {
          ...prev,
          sport: mappedSport || prev.sport,
          betType: "Moneyline",
          betAmount: effectiveBetAmount,
          budget: effectiveBudget,
          favoriteTeam: favoriteTeam || prev.favoriteTeam,
          underdogTeam: underdogTeam || prev.underdogTeam,
          favoriteRecord: favoriteRecord || prev.favoriteRecord,
          underdogRecord: underdogRecord || prev.underdogRecord,
        }
      })

      // Clear after use so it doesn't override manual entries later
      window.localStorage.removeItem("pendingBetAnalysis")
    } catch (err) {
      console.warn("AI Bet Advisor: Failed to prefill from pendingBetAnalysis", err)
    }
  }, [])

  // Auto-fill emotion from latest behavior check-in and last bet outcome
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        // Get latest emotion log
        const emotionLogs = await storage.getEmotionLogs()
        if (emotionLogs.length > 0) {
          const latestEmotion = emotionLogs[emotionLogs.length - 1]
          const emotion = latestEmotion.emotion || "Centered"

          // Set the emotion and also the category
          const category = coreEmotions.find(c => c.subEmotions.includes(emotion))
          if (category) {
            setEmotionCategory(category.id)
          }

          setFormData(prev => ({
            ...prev,
            currentEmotion: emotion
          }))
        }

        // Get last bet outcome from trades
        const trades = await storage.getTrades()

        if (trades.length > 0) {
          // Sort trades by timestamp descending to get the most recent
          const sortedTrades = [...trades].sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )

          // Find the most recent trade with an outcome
          const lastCompletedTrade = sortedTrades.find(trade => trade.outcome)

          if (lastCompletedTrade) {
            // Check if the last bet was within 7 days
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
            const lastBetDate = new Date(lastCompletedTrade.timestamp)

            let lastOutcome = "Haven't bet recently"

            if (lastBetDate >= sevenDaysAgo) {
              // Last bet was within 7 days, use the outcome
              if (lastCompletedTrade.outcome === "profit") {
                lastOutcome = "Won (feeling good)"
              } else if (lastCompletedTrade.outcome === "loss") {
                lastOutcome = "Lost (feeling frustrated)"
              } else if (lastCompletedTrade.outcome === "breakeven") {
                lastOutcome = "Push/Tie"
              }
            }

            setFormData(prev => ({
              ...prev,
              lastOutcome
            }))
          }
        }
      } catch (err) {
        console.warn("AI Bet Advisor: Failed to load user context", err)
      }
    }

    loadUserContext()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setAnalysis(null)

    try {
      let accessToken: string | undefined
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data.session?.access_token
      } catch (err) {
        console.warn("AI Bet Advisor: Failed to get Supabase session for JWT auth", err)
      }

      const response = await fetch("/api/ai/analyze-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.upgrade_required) {
          setError(`This feature requires an Elite subscription. Your current tier: ${data.current_tier}`)
        } else {
          setError(data.error || "Failed to analyze bet")
        }
        return
      }

      setAnalysis(data.analysis)
      setUsedEnhancedAI(data.usedEnhancedAI || false)
      setEnhancedInsights(data.enhanced?.keyInsights || null)
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof BetScenario, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Bet Advisor</CardTitle>
          <CardDescription>
            Get comprehensive AI-powered analysis combining technical betting insights with emotional psychology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport">Sport/Event</Label>
                <Select value={formData.sport} onValueChange={(value) => updateFormData("sport", value)}>
                  <SelectTrigger id="sport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NFL">NFL</SelectItem>
                    <SelectItem value="NBA">NBA</SelectItem>
                    <SelectItem value="MLB">MLB</SelectItem>
                    <SelectItem value="NHL">NHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="betType">Bet Type</Label>
                <Select value={formData.betType} onValueChange={(value: any) => updateFormData("betType", value)}>
                  <SelectTrigger id="betType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Moneyline">Moneyline</SelectItem>
                    <SelectItem value="Spread">Spread</SelectItem>
                    <SelectItem value="Over/Under">Over/Under</SelectItem>
                    <SelectItem value="Parlay">Parlay</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="betAmount">Proposed Bet Amount ($)</Label>
                <Input
                  id="betAmount"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.betAmount || ""}
                  onChange={(e) => updateFormData("betAmount", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 50"
                />
              </div>

              <div>
                <Label htmlFor="budget">Weekly Gambling Budget ($)</Label>
                <Input
                  id="budget"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.budget || ""}
                  onChange={(e) => updateFormData("budget", parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 500"
                />
              </div>

              <div>
                <Label htmlFor="favoriteTeam">Favorite Team</Label>
                <Input
                  id="favoriteTeam"
                  value={formData.favoriteTeam}
                  onChange={(e) => updateFormData("favoriteTeam", e.target.value)}
                  placeholder="e.g., Lakers"
                />
              </div>

              <div>
                <Label htmlFor="underdogTeam">Underdog Team</Label>
                <Input
                  id="underdogTeam"
                  value={formData.underdogTeam}
                  onChange={(e) => updateFormData("underdogTeam", e.target.value)}
                  placeholder="e.g., Warriors"
                />
              </div>

              <div>
                <Label htmlFor="favoriteRecord">Favorite Record (W-L)</Label>
                <Input
                  id="favoriteRecord"
                  value={formData.favoriteRecord}
                  onChange={(e) => updateFormData("favoriteRecord", e.target.value)}
                  placeholder="e.g., 8-2"
                />
              </div>

              <div>
                <Label htmlFor="underdogRecord">Underdog Record (W-L)</Label>
                <Input
                  id="underdogRecord"
                  value={formData.underdogRecord}
                  onChange={(e) => updateFormData("underdogRecord", e.target.value)}
                  placeholder="e.g., 5-5"
                />
              </div>

              <div>
                <Label htmlFor="injuries">Key Injuries</Label>
                <Input
                  id="injuries"
                  value={formData.injuries}
                  onChange={(e) => updateFormData("injuries", e.target.value)}
                  placeholder="e.g., No major injuries"
                />
              </div>

              <div>
                <Label htmlFor="weather">Weather/Conditions</Label>
                <Input
                  id="weather"
                  value={formData.weather}
                  onChange={(e) => updateFormData("weather", e.target.value)}
                  placeholder="e.g., Clear, 65°F"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emotionCategory">How are you feeling right now?</Label>
                <div className="space-y-2">
                  {/* Step 1: Select Category */}
                  <Select value={emotionCategory} onValueChange={(value) => {
                    setEmotionCategory(value)
                    // Reset emotion when category changes
                    const category = coreEmotions.find(c => c.id === value)
                    if (category && category.subEmotions.length > 0) {
                      updateFormData("currentEmotion", category.subEmotions[0])
                    }
                  }}>
                    <SelectTrigger id="emotionCategory">
                      <SelectValue placeholder="Select emotion category" />
                    </SelectTrigger>
                    <SelectContent>
                      {coreEmotions.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Step 2: Select Sub-Emotion (only shows if category selected) */}
                  {emotionCategory && (
                    <Select value={formData.currentEmotion} onValueChange={(value) => updateFormData("currentEmotion", value)}>
                      <SelectTrigger id="currentEmotion">
                        <SelectValue placeholder="Select specific emotion" />
                      </SelectTrigger>
                      <SelectContent>
                        {coreEmotions
                          .find(c => c.id === emotionCategory)
                          ?.subEmotions.map((emotion) => (
                            <SelectItem key={emotion} value={emotion}>
                              {emotion}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="lastOutcome">Last bet outcome</Label>
                <Select value={formData.lastOutcome} onValueChange={(value) => updateFormData("lastOutcome", value)}>
                  <SelectTrigger id="lastOutcome">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Won (feeling good)">Won (feeling good)</SelectItem>
                    <SelectItem value="Lost (feeling frustrated)">Lost (feeling frustrated)</SelectItem>
                    <SelectItem value="Push/Tie">Push/Tie</SelectItem>
                    <SelectItem value="Haven't bet recently">Haven't bet recently</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="emotionalTriggers">Emotional triggers (what's making you want to bet?)</Label>
              <Textarea
                id="emotionalTriggers"
                value={formData.emotionalTriggers}
                onChange={(e) => updateFormData("emotionalTriggers", e.target.value)}
                placeholder="e.g., I need to win back my losses, I'm feeling lucky..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="bettingSlip">Betting Slip (optional)</Label>
              <Textarea
                id="bettingSlip"
                value={formData.bettingSlip}
                onChange={(e) => updateFormData("bettingSlip", e.target.value)}
                placeholder="Paste your betting slip details or describe your bets..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="history">Recent Betting History</Label>
              <Textarea
                id="history"
                value={formData.history}
                onChange={(e) => updateFormData("history", e.target.value)}
                placeholder="e.g., Won $50 yesterday or Lost 3 bets this week"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="notes">User Notes/Reasoning</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="e.g., Team has strong defense, great home record"
                rows={2}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Analyzing..." : "Analyze Scenario"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-600">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Enhanced AI Badge */}
          {usedEnhancedAI && (
            <Card className="bg-linear-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      Enhanced AI Analysis with Claude
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Powered by Anthropic Claude 3.5 Sonnet via AWS Bedrock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unified Recommendation */}
          <Card
            className={
              analysis.recommendation.recommendation === "PLACE BET"
                ? "border-green-500 bg-green-50 dark:bg-green-950"
                : analysis.recommendation.recommendation === "DON'T PLACE BET"
                  ? "border-red-500 bg-red-50 dark:bg-red-950"
                  : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
            }
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {analysis.recommendation.recommendation === "PLACE BET" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : analysis.recommendation.recommendation === "DON'T PLACE BET" ? (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  {analysis.recommendation.recommendation}
                </CardTitle>
                <Badge variant="outline">Confidence: {analysis.recommendation.confidence}%</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{analysis.recommendation.reason}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Risk Level:</span> {analysis.recommendation.riskLevel}
                </div>
                <div>
                  <span className="font-semibold">Budget %:</span> {analysis.recommendation.budgetPercent}%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emotional Psychology Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Emotional Psychology Analysis</CardTitle>
              <CardDescription>
                <Badge
                  variant={
                    analysis.recommendation.emotionalAnalysis.emotionalRisk === "HIGH"
                      ? "destructive"
                      : analysis.recommendation.emotionalAnalysis.emotionalRisk === "MODERATE"
                        ? "default"
                        : "secondary"
                  }
                >
                  {analysis.recommendation.emotionalAnalysis.emotionalRisk} RISK
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Emotional Factors</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysis.recommendation.emotionalAnalysis.emotionalFactors.map((factor, i) => (
                    <li key={i}>{factor}</li>
                  ))}
                </ul>
              </div>
              {analysis.recommendation.emotionalAnalysis.shouldWait && (
                <Card className="border-red-500 bg-red-50 dark:bg-red-950">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="font-semibold text-red-600">Waiting Period Recommended</p>
                        <p className="text-sm text-red-600">
                          Suggested waiting period: {analysis.recommendation.emotionalAnalysis.waitingPeriod}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div>
                <h4 className="font-semibold mb-2">Recovery Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {analysis.recommendation.emotionalAnalysis.recoveryRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Insights from Claude */}
          {enhancedInsights && enhancedInsights.length > 0 && (
            <Card className="bg-linear-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Claude's Key Insights
                </CardTitle>
                <CardDescription>
                  Advanced reasoning from Anthropic Claude 3.5 Sonnet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {enhancedInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Analytical Assessment */}
            <Card>
              <CardHeader>
                <CardTitle>Analytical Assessment</CardTitle>
                <CardDescription>Technical betting analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Insights</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.analytical.insights.map((insight, i) => (
                      <li key={i}>{insight}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Expected Value Considerations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.analytical.evNotes.map((note, i) => (
                      <li key={i}>{note}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Relevant Factors</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.analytical.factors.map((factor, i) => (
                      <li key={i}>{factor}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Safety Check */}
            <Card>
              <CardHeader>
                <CardTitle>Safety Check</CardTitle>
                <CardDescription>Harm reduction analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-semibold">Bet size vs budget:</span> {analysis.safety.percent}% of weekly budget
                </div>
                <div>
                  <Badge
                    variant={
                      analysis.safety.risk === "HIGH"
                        ? "destructive"
                        : analysis.safety.risk === "MODERATE"
                          ? "default"
                          : "secondary"
                    }
                  >
                    Risk: {analysis.safety.risk}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Detected Patterns</h4>
                  {analysis.safety.signals.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {analysis.safety.signals.map((signal, i) => (
                        <li key={i}>{signal.label}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No red flags detected</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {analysis.safety.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
