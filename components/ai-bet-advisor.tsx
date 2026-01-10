"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SegmentedControl, YesNoControl } from "@/components/ui/segmented-control"
import { Loader2, AlertTriangle, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import type { BetScenario, ComprehensiveAnalysis } from "@/lib/ai-bet-advisor"
import type { SupportedSportKey } from "@/lib/types"
import { AIResultScreen } from "@/components/ai-result-screen"
import { supabase } from "@/lib/supabase"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import type { BetAnalysis } from "@/lib/types"
import { BetTrackingService } from "@/lib/bet-tracking-service"

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
  const [emotionMenuOpen, setEmotionMenuOpen] = useState(false)
  const [hoveredEmotionCategory, setHoveredEmotionCategory] = useState<string | null>(null)
  const [step, setStep] = useState<"details" | "context" | "mindset">("details")

  const [formData, setFormData] = useState<BetScenario>({
    // Core bet details
    sport: "americanfootball_nfl",
    homeTeam: "",
    awayTeam: "",
    betType: "Moneyline",
    line: 0,
    selection: "home", // "home" or "away"
    odds: 0,
    betAmount: 50,
    budget: 500,
    
    // Legacy fields (kept for backward compatibility)
    favoriteTeam: "",
    underdogTeam: "",
    favoriteRecord: "",
    underdogRecord: "",
    injuries: "",
    weather: "",
    
    // New boolean fields for UI
    hasKeyInjuries: false,
    hasAdverseWeather: false,
    isLiveBet: false,
    isFavoriteTeam: false,
    isChasingLoss: false,
    
    // Emotional data
    currentEmotion: "Centered",
    currentEmotionIntensity: 5,
    lastOutcome: "None",
    emotionalTriggers: "",
    bettingSlip: "",
    history: "",
    notes: "",
    
    // Psychological factors
    biasesIdentified: [],
    confidenceLevel: 5,
    reasoning: "",
    
    // Metadata
    sportsbook: "DraftKings",
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
      const sportMap: Record<string, SupportedSportKey> = {
        basketball_nba: "basketball_nba",
        americanfootball_nfl: "americanfootball_nfl", 
        baseball_mlb: "baseball_mlb",
        icehockey_nhl: "icehockey_nhl",
        NBA: "basketball_nba",
        NFL: "americanfootball_nfl",
        MLB: "baseball_mlb", 
        NHL: "icehockey_nhl",
      }

      const mappedSport = payload.sport ? sportMap[payload.sport] || "americanfootball_nfl" : "americanfootball_nfl"

      // Infer favorite vs underdog from moneyline odds
      const homeOdds = typeof payload.bestHomeOdds === "number" ? payload.bestHomeOdds : NaN
      const awayOdds = typeof payload.bestAwayOdds === "number" ? payload.bestAwayOdds : NaN

      // Calculate implied probabilities
      const implied = (odds: number) => {
        if (!odds || Number.isNaN(odds)) return 0.5
        return odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100)
      }

      const homeImp = implied(homeOdds)
      const awayImp = implied(awayOdds)

      let favoriteTeam = payload.homeTeam || ""
      let underdogTeam = payload.awayTeam || ""
      let favoriteRecord = payload.homeRecord || ""
      let underdogRecord = payload.awayRecord || ""

      if (!Number.isNaN(homeOdds) && !Number.isNaN(awayOdds)) {
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
          sport: mappedSport,
          homeTeam: payload.homeTeam || prev.homeTeam,
          awayTeam: payload.awayTeam || prev.awayTeam,
          betType: "Moneyline",
          selection: awayImp > homeImp ? "away" : "home",
          odds: awayImp > homeImp ? (typeof payload.bestAwayOdds === "number" ? payload.bestAwayOdds : prev.odds) : (typeof payload.bestHomeOdds === "number" ? payload.bestHomeOdds : prev.odds),
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

  // Check for pre-filled game data from live scores
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const prefillData = sessionStorage.getItem('tiltLabPrefillData')
      if (prefillData) {
        const gameData = JSON.parse(prefillData)
        console.log('TiltLab: Using pre-filled game data from live scores:', gameData)
        
        // Map the game data to form fields
        setFormData(prev => ({
          ...prev,
          homeTeam: gameData.homeTeam || prev.homeTeam,
          awayTeam: gameData.awayTeam || prev.awayTeam,
          sport: gameData.sport || prev.sport,
          odds: gameData.odds?.home || prev.odds,
        }))
        
        // Clear the pre-fill data after using it
        sessionStorage.removeItem('tiltLabPrefillData')
        sessionStorage.removeItem('pendingBetGame')
        
        // Show success message
        console.log(`Game pre-filled: ${gameData.awayTeam} @ ${gameData.homeTeam}`)
      }
    } catch (e) {
      console.error('Error loading pre-filled game data from live scores:', e)
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

            let lastOutcome: 'Won' | 'Lost' | 'Push' | 'None' = "None"
            let isChasingLoss = false

            if (lastBetDate >= sevenDaysAgo) {
              // Last bet was within 7 days, use the outcome
              if (lastCompletedTrade.outcome === "profit") {
                lastOutcome = "Won"
              } else if (lastCompletedTrade.outcome === "loss") {
                lastOutcome = "Lost"
                isChasingLoss = true // Auto-detect chasing behavior
              } else if (lastCompletedTrade.outcome === "breakeven") {
                lastOutcome = "Push"
              }
            }

            setFormData(prev => ({
              ...prev,
              lastOutcome,
              isChasingLoss
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

      console.log('AI Bet Advisor: Sending form data:', formData)
      console.log('AI Bet Advisor: Access token exists:', !!accessToken)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)
      const response = await fetch("/api/ai/analyze-bet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(formData),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const rawText = await response.text()
      let data: any
      
      console.log('AI Bet Advisor: Raw response:', {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        body: rawText.slice(0, 500) // First 500 chars
      })
      
      try {
        data = rawText ? JSON.parse(rawText) : {}
        console.log('AI Bet Advisor: Parsed response data:', data)
      } catch {
        console.error("AI Bet Advisor: Non-JSON response from /api/ai/analyze-bet", {
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type"),
          bodyPreview: rawText.slice(0, 200),
        })
        setError(
          `Analyze bet failed (non-JSON response, status ${response.status}). Try refreshing and signing in again.`,
        )
        setLoading(false) // Reset loading state before returning
        return
      }

      if (!response.ok) {
        console.log('AI Bet Advisor: Response not OK:', response.status, response.statusText)
        if (data.upgrade_required) {
          console.log('AI Bet Advisor: Upgrade required error')
          setError(`This feature requires a paid subscription (Premium or higher). Your current tier: ${data.current_tier}`)
        } else if (data.usage_limit_reached) {
          console.log('AI Bet Advisor: Usage limit reached error')
          setError(`TiltLab usage limit reached. You've used ${data.current_usage?.used || 0} of ${data.current_usage?.limit || 0} analyses this week.`)
        } else {
          console.log('AI Bet Advisor: General API error:', data)
          setError(data.error || `Failed to analyze bet (${response.status})`)
        }
        setLoading(false) // Reset loading state before returning
        return
      }

      setAnalysis(data.analysis)
      setUsedEnhancedAI(data.usedEnhancedAI || false)
      setEnhancedInsights(data.enhanced?.keyInsights || null)

      // Save comprehensive bet data using new tracking service
      try {
        const comprehensiveBet = await BetTrackingService.saveTiltLabBet(
          formData,
          data.analysis,
          data.usedEnhancedAI || false,
          data.enhanced?.keyInsights
        )
        
        console.log('Comprehensive bet saved:', comprehensiveBet)
      } catch (e) {
        console.warn("AI Bet Advisor: Failed to save comprehensive bet data", e)
      }

      // Keep legacy bet analysis save for backward compatibility
      try {
        const analysisId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        const selection = [
          formData.favoriteTeam,
          formData.underdogTeam,
        ].filter(Boolean).join(" vs ")

        const description = selection
          ? `${formData.sport}: ${selection} — ${formData.betType}`
          : `${formData.sport}: ${formData.betType}`

        const betAnalysis: BetAnalysis = {
          id: analysisId,
          timestamp: new Date(),
          betType:
            formData.betType === "Moneyline"
              ? "moneyline"
              : formData.betType === "Spread"
                ? "spread"
                : formData.betType === "Over/Under"
                  ? "total"
                  : "parlay",
          sport: formData.sport || "Unknown",
          description,
          odds: formData.odds ? Number(formData.odds) || 0 : 0,
          stake: Number(formData.betAmount) || 0,
          emotionalState: formData.currentEmotion || "neutral",
          emotionalIntensity: formData.currentEmotionIntensity || 5,
          biasWarnings: [],
          aiRecommendation:
            data.analysis?.recommendation?.reason ||
            data.analysis?.recommendation?.recommendation ||
            "",
          expectedValue: undefined,
          probabilityEstimate: undefined,
          outcome: "pending",
        }

        // @ts-ignore - Method added dynamically to storageHybrid
        await storage.addBetAnalysis(betAnalysis)
      } catch (e) {
        console.warn("AI Bet Advisor: legacy bet analysis save failed", e)
      }
    } catch (err) {
      const isAbort = (err as any)?.name === 'AbortError'
      setError(isAbort ? 'TiltLab timed out. Please try again.' : "An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateFormData = (field: keyof BetScenario, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePlaceBet = () => {
    // TODO: Implement bet tracking functionality
    // This would save the bet to the database and track it
    console.log("Place bet tracked:", formData)
    // Reset form after placing bet
    setAnalysis(null)
    setStep("details")
  }

  const handleDiscard = () => {
    // Clear the analysis and reset to form
    setAnalysis(null)
    setError(null)
    setStep("details")
  }

  const ProgressIndicator = () => {
    const stepValue = step === "details" ? 33 : step === "context" ? 67 : 100

    return (
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className={`flex-1 text-center text-sm font-medium transition-colors ${
            step === "details" ? "text-primary" : "text-muted-foreground"
          }`}>
            Bet Details
          </div>
          <div className={`flex-1 text-center text-sm font-medium transition-colors ${
            step === "context" ? "text-primary" : "text-muted-foreground"
          }`}>
            Logic & Context
          </div>
          <div className={`flex-1 text-center text-sm font-medium transition-colors ${
            step === "mindset" ? "text-primary" : "text-muted-foreground"
          }`}>
            Mindset
          </div>
        </div>
        <Progress value={stepValue} className="h-2" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>TiltLab</CardTitle>
          <CardDescription>
            Get comprehensive AI-powered analysis combining technical betting insights with emotional psychology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProgressIndicator />

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* STEP 1: BET DETAILS */}
            {step === "details" && (
              <Card className="fade-in">
                <CardHeader>
                  <CardTitle>Bet Details</CardTitle>
                  <CardDescription>Enter your betting scenario and financial information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sport">Sport/Event</Label>
                <Select value={formData.sport} onValueChange={(value) => updateFormData("sport", value as SupportedSportKey)}>
                  <SelectTrigger id="sport">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="americanfootball_nfl">NFL</SelectItem>
                    <SelectItem value="basketball_nba">NBA</SelectItem>
                    <SelectItem value="baseball_mlb">MLB</SelectItem>
                    <SelectItem value="icehockey_nhl">NHL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="homeTeam">Home Team</Label>
                <Input
                  id="homeTeam"
                  value={formData.homeTeam}
                  onChange={(e) => updateFormData("homeTeam", e.target.value)}
                  placeholder="e.g., Warriors"
                />
              </div>

              <div>
                <Label htmlFor="awayTeam">Away Team</Label>
                <Input
                  id="awayTeam"
                  value={formData.awayTeam}
                  onChange={(e) => updateFormData("awayTeam", e.target.value)}
                  placeholder="e.g., Lakers"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Bet Type</Label>
                <SegmentedControl
                  options={[
                    { value: "Spread", label: "Spread" },
                    { value: "Moneyline", label: "Moneyline" },
                    { value: "Over/Under", label: "Total" },
                    { value: "Parlay", label: "Parlay" },
                  ]}
                  value={formData.betType}
                  onChange={(value) => updateFormData("betType", value)}
                />
              </div>

              {formData.betType === "Spread" && (
                <>
                  <div>
                    <Label htmlFor="line">Line</Label>
                    <Input
                      id="line"
                      type="number"
                      step="0.5"
                      value={formData.line || ""}
                      onChange={(e) => updateFormData("line", parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., -3.5"
                    />
                  </div>
                  <div>
                    <Label>Selection</Label>
                    <SegmentedControl
                      options={[
                        { value: "home", label: "Home" },
                        { value: "away", label: "Away" },
                      ]}
                      value={formData.selection}
                      onChange={(value) => updateFormData("selection", value)}
                    />
                  </div>
                </>
              )}

              {formData.betType === "Over/Under" && (
                <>
                  <div>
                    <Label htmlFor="totalLine">Total Line</Label>
                    <Input
                      id="totalLine"
                      type="number"
                      step="0.5"
                      value={formData.line || ""}
                      onChange={(e) => updateFormData("line", parseFloat(e.target.value) || undefined)}
                      placeholder="e.g., 225.5"
                    />
                  </div>
                  <div>
                    <Label>Selection</Label>
                    <SegmentedControl
                      options={[
                        { value: "over", label: "Over" },
                        { value: "under", label: "Under" },
                      ]}
                      value={formData.selection}
                      onChange={(value) => updateFormData("selection", value)}
                    />
                  </div>
                </>
              )}

              {formData.betType === "Moneyline" && (
                <div>
                  <Label>Selection</Label>
                  <SegmentedControl
                    options={[
                      { value: "home", label: formData.homeTeam || "Home" },
                      { value: "away", label: formData.awayTeam || "Away" },
                    ]}
                    value={formData.selection}
                    onChange={(value) => updateFormData("selection", value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="odds">Odds (American)</Label>
                <Input
                  id="odds"
                  type="number"
                  value={formData.odds || ""}
                  onChange={(e) => updateFormData("odds", parseInt(e.target.value) || undefined)}
                  placeholder="e.g., -110"
                />
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
            </div>

            <Button type="button" onClick={() => setStep("context")} className="w-full">
              Next: Logic & Context
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: LOGIC & CONTEXT */}
      {step === "context" && (
        <Card className="fade-in">
          <CardHeader>
            <CardTitle>Logic & Context</CardTitle>
            <CardDescription>Add analytical factors and your reasoning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Are there key player injuries?</Label>
              <YesNoControl
                value={formData.hasKeyInjuries}
                onChange={(value) => {
                  updateFormData("hasKeyInjuries", value)
                  updateFormData("injuries", value ? "Key injuries present" : "No major injuries")
                }}
              />
            </div>

            <div>
              <Label>Is there adverse weather (Rain/Snow/Wind)?</Label>
              <YesNoControl
                value={formData.hasAdverseWeather}
                onChange={(value) => {
                  updateFormData("hasAdverseWeather", value)
                  updateFormData("weather", value ? "Adverse weather conditions" : "Clear conditions")
                }}
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
                <Label htmlFor="notes">User Notes/Reasoning</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData("notes", e.target.value)}
                  placeholder="e.g., Team has strong defense, great home record"
                  rows={2}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("details")} className="flex-1">
                  Back
                </Button>
                <Button type="button" onClick={() => setStep("mindset")} className="flex-1">
                  Next: Mindset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: MINDSET */}
        {step === "mindset" && (
          <Card className="fade-in">
            <CardHeader>
              <CardTitle>Mindset & Emotional State</CardTitle>
              <CardDescription>Reflect on your emotional state and recent betting patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emotionCategory">How are you feeling right now?</Label>
                <div className="relative">
                  {/* Trigger showing current selection */}
                  <button
                    type="button"
                    className="w-full flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm shadow-sm hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50"
                    onClick={() => {
                      const nextOpen = !emotionMenuOpen
                      setEmotionMenuOpen(nextOpen)
                      if (nextOpen) {
                        const initialCat = emotionCategory || coreEmotions[0]?.id || ""
                        setHoveredEmotionCategory(initialCat)
                      }
                    }}
                  >
                    <span className="text-left truncate">
                      {(() => {
                        const categoryLabel = coreEmotions.find(c => c.id === emotionCategory)?.label
                        if (categoryLabel && formData.currentEmotion) {
                          return `${categoryLabel} · ${formData.currentEmotion}`
                        }
                        if (formData.currentEmotion) {
                          return formData.currentEmotion
                        }
                        return "Select how you're feeling"
                      })()}
                    </span>
                    <span className="ml-2 text-xs text-muted-foreground">▼</span>
                  </button>

                  {emotionMenuOpen && (
                    <div className="absolute z-50 mt-2 flex w-full rounded-md border bg-popover text-popover-foreground shadow-lg">
                      {/* Core emotion list */}
                      <div className="w-40 max-h-64 overflow-y-auto border-r bg-background">
                        {coreEmotions.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            className={`block w-full px-3 py-2 text-left text-xs font-semibold ${
                              (hoveredEmotionCategory || emotionCategory) === category.id
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent/60"
                            }`}
                            onMouseEnter={() => setHoveredEmotionCategory(category.id)}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>

                      {/* Sub-emotions for hovered category */}
                      <div className="flex-1 max-h-64 overflow-y-auto bg-background">
                        {(() => {
                          const activeCategoryId = hoveredEmotionCategory || emotionCategory || coreEmotions[0]?.id
                          const activeCategory = coreEmotions.find(c => c.id === activeCategoryId)
                          if (!activeCategory) return null
                          return (
                            <div className="py-1">
                              {activeCategory.subEmotions.map((emotion) => (
                                <button
                                  key={emotion}
                                  type="button"
                                  className={`block w-full px-3 py-2 text-left text-xs ${
                                    formData.currentEmotion === emotion
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "hover:bg-accent/60"
                                  }`}
                                  onClick={() => {
                                    setEmotionCategory(activeCategory.id)
                                    updateFormData("currentEmotion", emotion)
                                    setEmotionMenuOpen(false)
                                  }}
                                >
                                  {emotion}
                                </button>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label>Last bet outcome</Label>
                <SegmentedControl
                  options={[
                    { value: "Won", label: "Win" },
                    { value: "Lost", label: "Loss" },
                    { value: "Push", label: "Push" },
                    { value: "None", label: "None" },
                  ]}
                  value={formData.lastOutcome}
                  onChange={(value) => updateFormData("lastOutcome", value)}
                />
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
                <Label htmlFor="history">Recent Betting History</Label>
                <Textarea
                  id="history"
                  value={formData.history}
                  onChange={(e) => updateFormData("history", e.target.value)}
                  placeholder="e.g., Won $50 yesterday or Lost 3 bets this week"
                  rows={2}
                />
              </div>

              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Psychological Factors</h4>

                <div>
                  <Label>Is this a Live/In-Play bet?</Label>
                  <YesNoControl
                    value={formData.isLiveBet}
                    onChange={(value) => updateFormData("isLiveBet", value)}
                  />
                </div>

                <div>
                  <Label>Are you betting on your favorite team?</Label>
                  <YesNoControl
                    value={formData.isFavoriteTeam}
                    onChange={(value) => updateFormData("isFavoriteTeam", value)}
                  />
                </div>

                <div>
                  <Label>Are you chasing a previous loss?</Label>
                  <YesNoControl
                    value={formData.isChasingLoss}
                    onChange={(value) => updateFormData("isChasingLoss", value)}
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setStep("context")} className="flex-1">
                  Back
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Analyzing..." : "Analyze Scenario"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
        <>
          {/* Enhanced AI Badge */}
          {usedEnhancedAI && (
            <Card className="bg-linear-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                      Enhanced AI Analysis with Gemini
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Powered by Google Gemini
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <AIResultScreen
            analysis={analysis}
            scenario={formData}
            onPlaceBet={handlePlaceBet}
            onDiscard={handleDiscard}
          />

          {/* Enhanced Insights from Gemini - shown below result screen */}
          {enhancedInsights && enhancedInsights.length > 0 && (
            <Card className="bg-linear-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  Gemini's Key Insights
                </CardTitle>
                <CardDescription>
                  Advanced reasoning from Google Gemini
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
        </>
      )}
    </div>
  )
}
