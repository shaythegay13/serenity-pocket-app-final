"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { toast } from "sonner"
import { extractAndNormalizeTeams, normalizeTeamName } from "@/lib/team-normalization"
import { ArrowLeft, ChevronDown } from "lucide-react"
import type { UserData } from "@/lib/types"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import type { ComprehensiveBet } from "@/lib/types/bet-tracking"

interface EmotionCheckInDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
  userData?: UserData
  updateUserData?: (updates: Partial<UserData>) => Promise<void>
  onBettingDataSaved?: () => void
  /** Pre-select a bet for settling - automatically sets phase to "after" and selects the bet */
  preSelectedBet?: ComprehensiveBet
  /** Pre-set the outcome when settling a bet */
  preSelectedOutcome?: "profit" | "loss" | "breakeven"
}

// Core emotions with 10 sub-emotions each
const coreEmotions = [
  {
    id: "joy",
    label: "JOY",
    color: "#f59e0b",
    subEmotions: ["Happy", "Excited", "Optimistic", "Grateful", "Confident", "Proud", "Hopeful", "Content", "Cheerful", "Inspired"]
  },
  {
    id: "calm",
    label: "CALM",
    color: "#14b8a6",
    subEmotions: ["Peaceful", "Relaxed", "Centered", "Focused", "Balanced", "Serene", "Patient", "Composed", "Tranquil", "Stable"]
  },
  {
    id: "fear",
    label: "FEAR",
    color: "#ef4444",
    subEmotions: ["Anxious", "Worried", "Nervous", "Scared", "Uncertain", "Panicked", "Hesitant", "Overwhelmed", "Tense", "Uneasy"]
  },
  {
    id: "greed",
    label: "GREED",
    color: "#8b5cf6",
    subEmotions: ["FOMO", "Euphoric", "Impulsive", "Overconfident", "Eager", "Craving", "Obsessed", "Compulsive", "Restless", "Driven"]
  },
  {
    id: "frustration",
    label: "FRUSTRATION",
    color: "#f97316",
    subEmotions: ["Angry", "Irritated", "Disappointed", "Impatient", "Stressed", "Resentful", "Annoyed", "Agitated", "Bitter", "Exhausted"]
  },
  {
    id: "sadness",
    label: "SADNESS",
    color: "#6366f1",
    subEmotions: ["Down", "Discouraged", "Regretful", "Defeated", "Helpless", "Lonely", "Empty", "Hopeless", "Dejected", "Grief"]
  }
]

export function EmotionCheckInDialog({ open, onOpenChange, onComplete, userData, updateUserData, onBettingDataSaved, preSelectedBet, preSelectedOutcome }: EmotionCheckInDialogProps) {
  const [step, setStep] = useState<"core" | "sub" | "details">("core")
  const [selectedCore, setSelectedCore] = useState<typeof coreEmotions[0] | null>(null)
  const [selectedEmotion, setSelectedEmotion] = useState("")
  const [intensity, setIntensity] = useState([5])
  const [phase, setPhase] = useState<"before" | "during" | "after">("before")
  const [outcome, setOutcome] = useState<"profit" | "loss" | "breakeven" | "">("")
  const [context, setContext] = useState("")

  // Betting data fields for after-game check-ins
  const [betAmount, setBetAmount] = useState("")
  const [betOdds, setBetOdds] = useState("")
  const [gameDescription, setGameDescription] = useState("")
  const [actualReturn, setActualReturn] = useState("")

  // New state for betting data selection
  const [betDataMode, setBetDataMode] = useState<"manual" | "select">("manual")
  const [savedBets, setSavedBets] = useState<ComprehensiveBet[]>([])
  const [selectedBet, setSelectedBet] = useState<ComprehensiveBet | null>(null)
  const [loadingBets, setLoadingBets] = useState(false)

  // Live betting tracking - important risk factor
  const [isLiveBet, setIsLiveBet] = useState(false)

  // Team selection state - which team is the user betting on
  const [parsedTeams, setParsedTeams] = useState<{ awayTeam: string; homeTeam: string }>({ awayTeam: "", homeTeam: "" })
  const [selectedTeamSide, setSelectedTeamSide] = useState<"home" | "away" | "">("")

  // Handle pre-selected bet when dialog opens (for settling bets from analytics)
  useEffect(() => {
    if (open && preSelectedBet) {
      // Set up the dialog for settling this specific bet
      setPhase("after")
      setBetDataMode("select")
      setSelectedBet(preSelectedBet)
      // Auto-fill form with selected bet data
      setBetAmount(preSelectedBet.stake.toString())
      setBetOdds(preSelectedBet.odds.toString())
      // Use description if available, otherwise construct from teams
      const desc = preSelectedBet.description ||
        `${preSelectedBet.awayTeam} vs ${preSelectedBet.homeTeam} - ${preSelectedBet.betType}`
      setGameDescription(desc)
      setIsLiveBet(preSelectedBet.isLiveBet || false)

      // Pre-set outcome if provided
      if (preSelectedOutcome) {
        setOutcome(preSelectedOutcome)
      }

      // Pre-set teams if available
      if (preSelectedBet.awayTeam && preSelectedBet.homeTeam) {
        setParsedTeams({
          awayTeam: normalizeTeamName(preSelectedBet.awayTeam),
          homeTeam: normalizeTeamName(preSelectedBet.homeTeam)
        })
        // Pre-select the team side if available
        if (preSelectedBet.selection === "home" || preSelectedBet.selection === "away") {
          setSelectedTeamSide(preSelectedBet.selection)
        }
      }
    }
  }, [open, preSelectedBet, preSelectedOutcome])

  // Parse game description to extract teams
  useEffect(() => {
    if (gameDescription && gameDescription.length > 3) {
      const { awayTeam, homeTeam } = extractAndNormalizeTeams(gameDescription)
      if (awayTeam !== "Unknown" || homeTeam !== "Unknown") {
        setParsedTeams({ awayTeam, homeTeam })
      }
    }
  }, [gameDescription])

  const handleSubmit = async () => {
    if (!selectedEmotion) return

    // Check if this completes a pending emotion track
    const isCompletingPendingTrack =
      phase === "after" &&
      userData?.pendingEmotionTradeId &&
      updateUserData

    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      emotion: selectedEmotion,
      intensity: intensity[0],
      context,
      phase: phase,
      tradeId: isCompletingPendingTrack ? userData.pendingEmotionTradeId : undefined
    }
    await storage.addEmotionLog(newLog)

    // Emit event to update analytics
    analyticsEvents.emit(ANALYTICS_EVENTS.EMOTION_LOGGED, newLog)

    // Handle betting data (creation or update)
    if ((betAmount && betOdds && gameDescription) || selectedBet) {
      const stake = parseFloat(betAmount)

      // Convert odds string to number
      let oddsNumber = 0
      try {
        if (betOdds.startsWith('+')) {
          oddsNumber = parseFloat(betOdds.substring(1))
        } else if (betOdds.startsWith('-')) {
          oddsNumber = parseFloat(betOdds.substring(1))
        } else {
          oddsNumber = parseFloat(betOdds)
        }
      } catch (error) {
        oddsNumber = 100 // Default fallback
      }

      // IMPORTANCE: Import BetTrackingService dynamically
      // We do this here to avoid circular dependencies and ensure it's available
      try {
        const { BetTrackingService } = await import("@/lib/bet-tracking-service")

        // 1. MANUAL ENTRY: Create new bet
        if (betDataMode === "manual" && betAmount && betOdds && gameDescription) {
          // For 'after' phase with outcome
          if (phase === "after" && outcome) {
            const returnAmount = actualReturn ? parseFloat(actualReturn) : 0

            const betAnalysis = {
              id: `bet_${Date.now()}`,
              timestamp: new Date(),
              betType: "straight" as const,
              sport: "general", // Could be parsed from description
              description: gameDescription,
              odds: oddsNumber,
              stake: stake,
              emotionalState: selectedEmotion,
              emotionalIntensity: intensity[0],
              biasWarnings: [],
              aiRecommendation: "",
              expectedValue: 0,
              probabilityEstimate: 0.5,
              outcome: (outcome === "breakeven" ? "push" : outcome === "profit" ? "win" : "loss") as "win" | "loss" | "push",
              actualReturn: returnAmount,
              source: "manual" as const,
              isLiveBet: isLiveBet // Track if this was a live/in-play bet
            }

            await storage.addBetAnalysis(betAnalysis)
          }
          // For 'before' or 'during' phase (pending bet)
          else if (phase !== "after") {
            // Use BetTrackingService to create a properly formatted bet
            // We use the current emotion as the 'before' emotion
            // Pass parsed teams and selection if available
            const teamsOverride = (parsedTeams.awayTeam && parsedTeams.homeTeam &&
              parsedTeams.awayTeam !== "Unknown" && parsedTeams.homeTeam !== "Unknown")
              ? { awayTeam: parsedTeams.awayTeam, homeTeam: parsedTeams.homeTeam }
              : undefined

            await BetTrackingService.saveBetAnalyzerBet(
              gameDescription,
              oddsNumber,
              stake,
              {
                recommendation: context || "Manual entry",
                confidenceScore: 0.5,
                biasWarnings: []
              },
              selectedEmotion,
              intensity[0],
              isLiveBet, // Pass live bet flag for risk tracking
              teamsOverride,
              selectedTeamSide || undefined
            )
          }
        }

        // 2. SAVED BET: Update existing bet
        else if (selectedBet) {
          if (phase === "after" && outcome) {
            await BetTrackingService.updateBetOutcome(
              selectedBet.id,
              (outcome === "breakeven" ? "push" : outcome === "profit" ? "win" : "loss") as "win" | "loss" | "push",
              selectedEmotion,
              intensity[0],
              `Emotional check-in: ${context || "No additional context"}`
            )
          } else {
            // Update emotion for the specific phase
            await BetTrackingService.updateBetEmotion(
              selectedBet.id,
              phase,
              selectedEmotion,
              intensity[0],
              context
            )
          }
        }

        console.log('✅ Betting data processed successfully')
        // Emit event to refresh analytics data across the app
        analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

        // Trigger callback to refresh analytics data
        if (onBettingDataSaved) {
          onBettingDataSaved()
        }
      } catch (error) {
        console.error('Error processing betting data:', error)
      }
    }

    // If completing pending track, award bonus XP and clear pending ID
    if (isCompletingPendingTrack && userData && updateUserData) {
      await updateUserData({
        pendingEmotionTradeId: undefined,
        xp: (userData.xp || 0) + 35, // +10 base + 25 bonus for completing the track
        totalEmotionsLogged: (userData.totalEmotionsLogged || 0) + 1
      })

      toast.success("Full emotion track completed! +35 XP earned", {
        description: "Great job completing your pre and post-bet emotions!"
      })
    } else {
      // Regular emotion check-in: +10 XP, increment total emotions logged
      if (userData && updateUserData) {
        await updateUserData({
          xp: (userData.xp || 0) + 10,
          totalEmotionsLogged: (userData.totalEmotionsLogged || 0) + 1
        })
      }

      const message = phase === "after" && betAmount
        ? "Emotion check-in and betting data recorded! +10 XP earned"
        : "Emotion check-in completed! +10 XP earned"

      toast.success(message, {
        description: phase === "after" && betAmount
          ? "Your betting performance will appear in the analytics tab."
          : "Your emotional awareness is improving. Keep it up!"
      })
    }

    onComplete()
    handleReset()
  }

  const handleReset = () => {
    setStep("core")
    setSelectedCore(null)
    setSelectedEmotion("")
    setIntensity([5])
    setPhase("before")
    setOutcome("")
    setContext("")
    setBetAmount("")
    setBetOdds("")
    setGameDescription("")
    setActualReturn("")
    // Reset new betting selection state
    setBetDataMode("manual")
    setSavedBets([])
    setSelectedBet(null)
    setLoadingBets(false)
    // Reset live bet tracking
    setIsLiveBet(false)
    // Reset team selection
    setParsedTeams({ awayTeam: "", homeTeam: "" })
    setSelectedTeamSide("")
  }

  const loadSavedBets = async () => {
    if (savedBets.length > 0) return // Already loaded

    setLoadingBets(true)
    try {
      const bets = await storage.getComprehensiveBets()
      // Filter for bets from bet analyzer or tiltlab that don't have outcomes yet
      const relevantBets = bets.filter(bet =>
        (bet.source === "bet-analyzer" || bet.source === "tiltlab") &&
        bet.outcome === "pending"
      ).slice(0, 20) // Limit to 20 most recent

      setSavedBets(relevantBets)
    } catch (error) {
      console.error("Error loading saved bets:", error)
      toast.error("Failed to load saved bets")
    } finally {
      setLoadingBets(false)
    }
  }

  const handleBetSelect = (bet: ComprehensiveBet) => {
    setSelectedBet(bet)
    // Auto-fill form with selected bet data
    setBetAmount(bet.stake.toString())
    setBetOdds(bet.odds.toString())
    setGameDescription(`${bet.awayTeam} vs ${bet.homeTeam} - ${bet.betType}`)
    setActualReturn("") // User still needs to enter actual return
  }

  const handleModeChange = (mode: "manual" | "select") => {
    setBetDataMode(mode)
    if (mode === "select") {
      loadSavedBets()
    } else {
      // Clear selected bet when switching back to manual
      setSelectedBet(null)
    }
  }

  const handleCoreSelect = (emotion: typeof coreEmotions[0]) => {
    setSelectedCore(emotion)
    setStep("sub")
  }

  const handleSubSelect = (subEmotion: string) => {
    setSelectedEmotion(subEmotion)
    setStep("details")
  }

  const handleBack = () => {
    if (step === "sub") {
      setStep("core")
      setSelectedCore(null)
    } else if (step === "details") {
      setStep("sub")
      setSelectedEmotion("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) handleReset()
      onOpenChange(open)
    }}>
      <DialogContent className="max-w-[90vw] sm:max-w-[700px] w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {step !== "core" && (
              <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle>Welcome! Daily Emotion Check-In</DialogTitle>
              <DialogDescription>
                {step === "core" && "Select a core emotion"}
                {step === "sub" && "Refine your emotion"}
                {step === "details" && "Tell us more"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3">
          {/* Step 1: Core Emotion Selection */}
          {step === "core" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-4">
                {coreEmotions.map((emotion) => (
                  <button
                    type="button"
                    key={emotion.id}
                    onClick={() => handleCoreSelect(emotion)}
                    className="group relative aspect-square flex flex-col items-center justify-center rounded-full transition-all hover:scale-105 hover:shadow-xl min-h-[100px] min-w-[100px] md:min-h-[110px] md:min-w-[110px] touch-manipulation active:scale-95"
                    style={{ backgroundColor: emotion.color }}
                  >
                    {/* Inner white circle border */}
                    <div className="absolute inset-2 rounded-full border-50 border-white/40 pointer-events-none" />
                    <span className="text-sm md:text-base lg:text-lg font-bold text-white drop-shadow-lg relative z-10 px-2">
                      {emotion.label}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Select a core emotion that best represents how you're feeling
              </p>
            </div>
          )}

          {/* Step 2: Sub-Emotion Selection - Zoomed In View */}
          {step === "sub" && selectedCore && (
            <div className="flex flex-col items-center justify-center zoom-in-emotion">
              {/* Circular container that mimics the large circle size */}
              <div className="relative w-full max-w-xl aspect-square mx-auto flex items-center justify-center" style={{ padding: 0, margin: '0 auto', boxSizing: 'border-box' }}>
                {/* Outer circle boundary using emotion color */}
                <div
                  className="absolute inset-0 rounded-full shadow-2xl"
                  style={{
                    backgroundColor: `${selectedCore.color}15`
                  }}
                />


                {/* 10 circles: 1 center + 9 in optimal packing ring */}
                <div className="absolute inset-0" style={{ transformOrigin: 'center center' }}>
                  {selectedCore.subEmotions.map((subEmotion, index) => {
                    // Circle-packing geometry for 9 circles around 1 center:
                    // 
                    // For adjacent outer circles to touch (not overlap):
                    //   Distance between centers = 2r
                    //   2·d·sin(π/9) = 2r  (where d = ring radius, θ = 40°)
                    //   d = r / sin(π/9) = r / sin(20°) ≈ 2.924r
                    //
                    // For all circles to fit in parent (R = 50%):
                    //   d + r ≤ 50
                    //   2.924r + r ≤ 50
                    //   3.924r ≤ 50
                    //   r ≤ 12.74%
                    //
                    const parentRadius = 50
                    const angleStep = Math.PI / 9 // 20° in radians
                    const sinAngle = Math.sin(angleStep) // sin(20°) ≈ 0.342

                    // Calculate optimal circle radius
                    const circleRadiusPercent = parentRadius / (1 / sinAngle + 1) // ≈ 12.74%
                    const circleDiameter = circleRadiusPercent * 2
                    const circleSize = `${circleDiameter}%`

                    let x = 0, y = 0

                    if (index === 0) {
                      // Center circle at exact geometric center
                      x = 0
                      y = 0
                    } else {
                      // Ring radius calculated for adjacent tangency
                      const ringRadius = circleRadiusPercent / sinAngle // ≈ 37.26%

                      const angleIndex = index - 1
                      const angleDegrees = (360 / 9) * angleIndex // 0°, 40°, 80°, ...
                      const angleRadians = (angleDegrees * Math.PI) / 180

                      // Position using polar coordinates, starting from top
                      x = ringRadius * Math.cos(angleRadians - Math.PI / 2)
                      y = ringRadius * Math.sin(angleRadians - Math.PI / 2)
                    }

                    return (
                      <button
                        type="button"
                        key={subEmotion}
                        onClick={() => handleSubSelect(subEmotion)}
                        className="absolute rounded-full flex items-center justify-center font-bold text-white transition-all hover:scale-105 hover:shadow-2xl hover:z-10 active:scale-95 touch-manipulation"
                        style={{
                          width: circleSize,
                          aspectRatio: '1',
                          backgroundColor: selectedCore.color,
                          left: `calc(50% + ${x}%)`,
                          top: `calc(50% + ${y}%)`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <span className="text-base text-center px-1 leading-tight font-bold">{subEmotion}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Select a specific emotion
              </p>
            </div>
          )}

          {/* Step 3: Details Form */}
          {step === "details" && (
            <div className="space-y-6">
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-6">
                {/* Selected emotion display */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">You selected</p>
                  <p className="text-2xl font-bold" style={{ color: selectedCore?.color }}>
                    {selectedEmotion}
                  </p>
                </div>

                {/* Intensity Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Intensity</Label>
                    <span className="text-lg font-bold" style={{ color: selectedCore?.color }}>
                      {intensity[0]}
                    </span>
                  </div>
                  <Slider
                    value={intensity}
                    onValueChange={setIntensity}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1 (Mild)</span>
                    <span>5 (Intense)</span>
                  </div>
                </div>

                {/* Betting Phase */}
                <div className="space-y-3">
                  <Label>Select Betting Phase</Label>
                  <RadioGroup value={phase} onValueChange={(val) => setPhase(val as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="before" id="before" />
                      <Label htmlFor="before" className="cursor-pointer">Before Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="during" id="during" />
                      <Label htmlFor="during" className="cursor-pointer">During Betting</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after" id="after" />
                      <Label htmlFor="after" className="cursor-pointer">After Betting</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Outcome (only for after betting) */}
                {phase === "after" && (
                  <div className="space-y-3">
                    <Label>What was the outcome?</Label>
                    <RadioGroup value={outcome} onValueChange={(val) => setOutcome(val as any)}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="profit" id="profit-dialog" />
                        <Label htmlFor="profit-dialog" className="cursor-pointer">Won 💰</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="loss" id="loss-dialog" />
                        <Label htmlFor="loss-dialog" className="cursor-pointer">Lost 📉</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="breakeven" id="breakeven-dialog" />
                        <Label htmlFor="breakeven-dialog" className="cursor-pointer">Pushed ⚖️</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Betting Data Fields - For ALL phases */}
                <div className="space-y-3 border-t pt-4">
                  <Label className="text-base font-medium">Betting Details</Label>

                  {/* Mode Selection Toggle */}
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">How would you like to enter betting data?</Label>
                    <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                      <button
                        type="button"
                        onClick={() => handleModeChange("manual")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${betDataMode === "manual"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Manual Entry
                      </button>
                      <button
                        type="button"
                        onClick={() => handleModeChange("select")}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors touch-manipulation min-h-[44px] ${betDataMode === "select"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                          }`}
                      >
                        Select Saved Bet
                      </button>
                    </div>
                  </div>

                  {/* Manual Entry Mode */}
                  {betDataMode === "manual" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="betAmount">Stake Amount ($)</Label>
                          <input
                            id="betAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="50.00"
                            value={betAmount}
                            onChange={(e) => setBetAmount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="betOdds">Odds (e.g., +110, -110)</Label>
                          <input
                            id="betOdds"
                            type="text"
                            placeholder="+110"
                            value={betOdds}
                            onChange={(e) => setBetOdds(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gameDescription">Game/Match Description</Label>
                        <input
                          id="gameDescription"
                          type="text"
                          placeholder="e.g., Lakers vs Warriors - NBA"
                          value={gameDescription}
                          onChange={(e) => setGameDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      {/* Team Selection - Which team are you betting on? */}
                      {(parsedTeams.awayTeam !== "" && parsedTeams.awayTeam !== "Unknown") ||
                       (parsedTeams.homeTeam !== "" && parsedTeams.homeTeam !== "Unknown") ? (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <Label className="text-sm font-medium">Which team are you betting on?</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {parsedTeams.awayTeam && parsedTeams.awayTeam !== "Unknown" && (
                              <button
                                type="button"
                                onClick={() => setSelectedTeamSide("away")}
                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors touch-manipulation min-h-[44px] active:scale-95 ${
                                  selectedTeamSide === "away"
                                    ? "border-blue-500 bg-blue-100 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {parsedTeams.awayTeam}
                              </button>
                            )}
                            {parsedTeams.homeTeam && parsedTeams.homeTeam !== "Unknown" && (
                              <button
                                type="button"
                                onClick={() => setSelectedTeamSide("home")}
                                className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors touch-manipulation min-h-[44px] active:scale-95 ${
                                  selectedTeamSide === "home"
                                    ? "border-blue-500 bg-blue-100 text-blue-700"
                                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {parsedTeams.homeTeam}
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select the team you're placing your bet on
                          </p>
                        </div>
                      ) : null}

                      {/* Live Bet Toggle - Important for risk assessment */}
                      <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex-1">
                          <Label htmlFor="isLiveBet" className="text-sm font-medium cursor-pointer">
                            Is this a live/in-play bet?
                          </Label>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Live betting can increase impulsivity risk
                          </p>
                        </div>
                        <button
                          id="isLiveBet"
                          type="button"
                          role="switch"
                          aria-checked={isLiveBet}
                          onClick={() => setIsLiveBet(!isLiveBet)}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors touch-manipulation ${isLiveBet ? "bg-orange-500" : "bg-gray-300"
                            }`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-sm ${isLiveBet ? "translate-x-7" : "translate-x-1"
                              }`}
                          />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Select Saved Bet Mode */}
                  {betDataMode === "select" && (
                    <div className="space-y-4">
                      {loadingBets ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground mt-2">Loading saved bets...</p>
                        </div>
                      ) : savedBets.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground">No saved bets found (pending outcome).</p>
                          <p className="text-xs text-muted-foreground mt-1">Analyze some bets or create manual entries first.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label className="text-sm text-muted-foreground">Select a bet from your analysis history:</Label>
                          <div className="max-h-40 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {savedBets.map((bet) => (
                              <button
                                type="button"
                                key={bet.id}
                                onClick={() => handleBetSelect(bet)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors touch-manipulation min-h-[44px] active:scale-[0.98] ${selectedBet?.id === bet.id
                                  ? "border-primary bg-primary/10"
                                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                                  }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {bet.awayTeam} vs {bet.homeTeam}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {bet.betType} • {bet.sport} • ${bet.stake} @ {bet.odds}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Source: {bet.source === "bet-analyzer" ? "Bet Analyzer" : "TiltLab"}
                                    </p>
                                  </div>
                                  {selectedBet?.id === bet.id && (
                                    <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                      <span className="text-white text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          {selectedBet && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800">Selected bet details auto-filled above</p>
                              <p className="text-xs text-green-600 mt-1">
                                {selectedBet.awayTeam} vs {selectedBet.homeTeam} - {selectedBet.betType}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actual Return (only for 'after' phase with known outcome) */}
                  {phase === "after" && outcome && (
                    <div className="space-y-2">
                      <Label htmlFor="actualReturn">Actual Return ($)</Label>
                      <input
                        id="actualReturn"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder={outcome === "profit" ? "105.00" : outcome === "loss" ? "0.00" : "50.00"}
                        value={actualReturn}
                        onChange={(e) => setActualReturn(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  )}
                </div>

                {/* Context */}
                <div className="space-y-3">
                  <Label htmlFor="context">Optional context</Label>
                  <Textarea
                    id="context"
                    placeholder="e.g., I was profitable today"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 min-h-[44px] touch-manipulation"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="flex-1 min-h-[44px] touch-manipulation"
                    style={{ backgroundColor: selectedCore?.color }}
                  >
                    Submit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}